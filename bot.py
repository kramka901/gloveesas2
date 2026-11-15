import asyncio
import html
import logging
import sys
from aiogram import Bot, Dispatcher, F
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.exceptions import TelegramBadRequest, TelegramForbiddenError
from aiogram.filters import Command, CommandObject, CommandStart
from aiogram.types import Message, ReplyParameters

import config
import database

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

dp = Dispatcher()


# =====================================================================
# ХЭНДЛЕРЫ ДЛЯ КОМАНД ОБЩЕГО ДОСТУПА И АДМИНИСТРАТОРА
# =====================================================================

@dp.message(CommandStart())
async def handle_start(message: Message):
    user = message.from_user
    if not user:
        return

    # Если пишет администратор
    if config.is_admin(user.id):
        text = (
            "👑 <b>Панель администратора бота обратной связи</b>\n\n"
            "Сюда будут автоматически приходить все сообщения от пользователей.\n\n"
            "📌 <b>Как отвечать пользователям:</b>\n"
            "Просто воспользуйтесь стандартной функцией Telegram <b>«Ответить» (Reply)</b> "
            "на сообщение пользователя или на карточку с информацией о нем.\n\n"
            "🛠 <b>Доступные команды:</b>\n"
            "• <code>/reply &lt;ID&gt; &lt;текст&gt;</code> — отправить сообщение пользователю по его ID\n"
            "• <code>/stats</code> — посмотреть статистику обращений\n"
            "• <code>/block &lt;ID&gt;</code> — заблокировать пользователя\n"
            "• <code>/unblock &lt;ID&gt;</code> — разблокировать пользователя\n"
            "• <code>/id</code> — узнать свой ID Telegram"
        )
        await message.answer(text)
        return

    # Если пишет обычный пользователь
    await database.upsert_user(user.id, user.username, user.full_name)
    welcome_text = (
        f"👋 <b>Здравствуйте, {html.escape(user.first_name)}!</b>\n\n"
        "Напишите сюда свой вопрос, предложение или отзыв.\n"
        "Ваше сообщение сразу поступит администратору, и он ответит вам прямо в этом чате!"
    )
    await message.answer(welcome_text)


@dp.message(Command("id"))
async def handle_id_command(message: Message):
    """Показывает ID пользователя. Очень удобно для быстрой настройки бота."""
    user = message.from_user
    if not user:
        return
    text = (
        f"🆔 Ваш Telegram ID: <code>{user.id}</code>\n"
        f"👤 Имя: <b>{html.escape(user.full_name)}</b>\n"
        f"🔗 Username: @{user.username if user.username else 'отсутствует'}"
    )
    if config.is_admin(user.id):
        text += "\n\n<i>👑 Вы являетесь администратором этого бота.</i>"
    else:
        text += "\n\n<i>Скопируйте этот ID и вставьте в .env (ADMIN_IDS), если хотите сделать себя администратором.</i>"
    await message.answer(text)


@dp.message(Command("help"))
async def handle_help_command(message: Message):
    user = message.from_user
    if not user:
        return
    if config.is_admin(user.id):
        await handle_start(message)
    else:
        await message.answer(
            "ℹ️ <b>Как пользоваться ботом:</b>\n\n"
            "Просто отправьте сюда текстовое сообщение, фото, голосовое или документ. "
            "Администратор получит его и ответит вам."
        )


# =====================================================================
# СПЕЦИАЛЬНЫЕ КОМАНДЫ АДМИНИСТРАТОРА
# =====================================================================

@dp.message(F.from_user.id.in_(config.ADMIN_IDS), Command("stats"))
async def handle_admin_stats(message: Message):
    stats = await database.get_stats()
    text = (
        "📊 <b>Статистика бота обратной связи:</b>\n\n"
        f"👥 Всего пользователей в базе: <b>{stats['total_users']}</b>\n"
        f"🚫 Заблокировано спамеров: <b>{stats['blocked_users']}</b>\n"
        f"📥 Получено сообщений от пользователей: <b>{stats['incoming_messages']}</b>\n"
        f"📤 Отправлено ответов администраторами: <b>{stats['outgoing_messages']}</b>"
    )
    await message.answer(text)


@dp.message(F.from_user.id.in_(config.ADMIN_IDS), Command("block"))
async def handle_admin_block(message: Message, command: CommandObject):
    if not command.args or not command.args.strip().isdigit():
        await message.answer("⚠️ Использование: <code>/block &lt;ID_пользователя&gt;</code>\nПример: <code>/block 123456789</code>")
        return

    target_id = int(command.args.strip())
    if config.is_admin(target_id):
        await message.answer("❌ Нельзя заблокировать администратора бота!")
        return

    success = await database.set_user_block(target_id, blocked=True)
    if success:
        await message.answer(f"🚫 Пользователь <code>{target_id}</code> успешно заблокирован.")
    else:
        await message.answer(f"⚠️ Пользователь с ID <code>{target_id}</code> пока не найден в базе данных, но статус блокировки обновлен.")


@dp.message(F.from_user.id.in_(config.ADMIN_IDS), Command("unblock"))
async def handle_admin_unblock(message: Message, command: CommandObject):
    if not command.args or not command.args.strip().isdigit():
        await message.answer("⚠️ Использование: <code>/unblock &lt;ID_пользователя&gt;</code>\nПример: <code>/unblock 123456789</code>")
        return

    target_id = int(command.args.strip())
    await database.set_user_block(target_id, blocked=False)
    await message.answer(f"✅ Пользователь <code>{target_id}</code> успешно разблокирован.")


@dp.message(F.from_user.id.in_(config.ADMIN_IDS), Command("reply"))
async def handle_admin_manual_reply(message: Message, command: CommandObject, bot: Bot):
    """Позволяет отправить ответ пользователю напрямую по ID через команду /reply <ID> <сообщение>."""
    if not command.args:
        await message.answer(
            "⚠️ Использование: <code>/reply &lt;ID&gt; &lt;текст сообщения&gt;</code>\n"
            "Пример: <code>/reply 123456789 Здравствуйте! Ваш заказ отправлен.</code>"
        )
        return

    parts = command.args.split(maxsplit=1)
    if len(parts) < 2 or not parts[0].isdigit():
        await message.answer("⚠️ Укажите числовой ID пользователя и текст сообщения через пробел.")
        return

    target_id = int(parts[0])
    reply_text = parts[1]

    try:
        sent = await bot.send_message(
            chat_id=target_id,
            text=f"💬 <b>Ответ от администратора:</b>\n\n{reply_text}"
        )
        await database.log_message(target_id, is_from_admin=True)
        await message.answer(f"✅ Сообщение успешно отправлено пользователю <code>{target_id}</code>!")
    except TelegramForbiddenError:
        await message.answer(f"❌ Пользователь <code>{target_id}</code> заблокировал бота или удалил диалог.")
    except Exception as e:
        await message.answer(f"❌ Ошибка отправки: {e}")


# =====================================================================
# ОБРАБОТКА ОТВЕТОВ АДМИНИСТРАТОРА ЧЕРЕЗ REPLY
# =====================================================================

@dp.message(F.from_user.id.in_(config.ADMIN_IDS), F.reply_to_message)
async def handle_admin_reply(message: Message, bot: Bot):
    """
    Срабатывает, когда администратор нажимает 'Ответить' (Reply) на сообщение
    или информационную карточку от пользователя.
    """
    replied_msg_id = message.reply_to_message.message_id
    mapping = await database.get_user_by_admin_message(replied_msg_id)

    if not mapping:
        await message.reply(
            "⚠️ Не удалось определить пользователя для этого сообщения.\n"
            "Возможно, сообщение устарело или было отправлено до запуска базы данных.\n"
            "Вы можете ответить вручную командой: <code>/reply &lt;ID&gt; &lt;текст&gt;</code>"
        )
        return

    target_user_id, original_user_msg_id = mapping

    try:
        reply_params = ReplyParameters(message_id=original_user_msg_id) if original_user_msg_id else None

        # Если администратор отправил обычный текст
        if message.text:
            formatted_text = f"💬 <b>Ответ от администратора:</b>\n\n{message.html_text}"
            try:
                await bot.send_message(
                    chat_id=target_user_id,
                    text=formatted_text,
                    reply_parameters=reply_params
                )
            except TelegramBadRequest:
                # Если исходное сообщение пользователя было удалено, отправляем без цитаты
                await bot.send_message(
                    chat_id=target_user_id,
                    text=formatted_text
                )
        else:
            # Если администратор отправил медиа (фото, голос, видео, файл и т.д.)
            await bot.send_message(chat_id=target_user_id, text="💬 <b>Ответ от администратора:</b>")
            await message.send_copy(chat_id=target_user_id)

        await database.log_message(target_user_id, is_from_admin=True)
        await message.reply(f"✅ Ответ успешно отправлен пользователю <code>{target_user_id}</code>!")

    except TelegramForbiddenError:
        await message.reply(f"❌ Не удалось отправить ответ: пользователь <code>{target_user_id}</code> заблокировал бота.")
    except Exception as e:
        logger.error(f"Ошибка отправки ответа: {e}", exc_info=True)
        await message.reply(f"❌ Ошибка при отправке ответа: {e}")


@dp.message(F.from_user.id.in_(config.ADMIN_IDS))
async def handle_admin_unprompted_message(message: Message):
    """Напоминание администратору, если он отправил сообщение без Reply и не команду."""
    await message.reply(
        "💡 <b>Подсказка для администратора:</b>\n"
        "Чтобы ответить пользователю, нажмите <b>«Ответить» (Reply)</b> на карточку или сообщение пользователя.\n"
        "Либо отправьте команду: <code>/reply &lt;ID&gt; &lt;текст&gt;</code>"
    )


# =====================================================================
# ОБРАБОТКА ВХОДЯЩИХ СООБЩЕНИЙ ОТ ОБЫЧНЫХ ПОЛЬЗОВАТЕЛЕЙ
# =====================================================================

@dp.message(~F.from_user.id.in_(config.ADMIN_IDS))
async def handle_user_incoming_message(message: Message, bot: Bot):
    user = message.from_user
    if not user:
        return

    # Проверка на блокировку
    if await database.is_user_blocked(user.id):
        await message.answer("⛔️ Вы заблокированы и не можете отправлять сообщения администратору.")
        return

    # Обновляем профиль в БД и логируем
    await database.upsert_user(user.id, user.username, user.full_name)
    await database.log_message(user.id, is_from_admin=False)

    if not config.ADMIN_IDS:
        await message.answer(
            "⚠️ Бот в данный момент настраивается (администратор еще не указал свой ID).\n"
            "Пожалуйста, повторите попытку немного позже."
        )
        return

    # Формируем информационную карточку для администраторов
    username_display = f"@{user.username}" if user.username else "нет"
    card_text = (
        "📩 <b>Новое обращение!</b>\n\n"
        f"👤 <b>Отправитель:</b> {html.escape(user.full_name)}\n"
        f"🆔 <b>User ID:</b> <code>{user.id}</code>\n"
        f"🔗 <b>Username:</b> {username_display}\n\n"
        "<i>💬 Чтобы ответить, сделайте <b>Reply (Ответить)</b> на это сообщение или на копию ниже.</i>"
    )

    # Рассылаем администраторам
    forwarded_to_any = False
    for admin_id in config.ADMIN_IDS:
        try:
            # 1. Отправляем информационную карточку
            card_msg = await bot.send_message(chat_id=admin_id, text=card_text)

            # 2. Отправляем точную копию сообщения пользователя (текст, фото, голос, файл и т.д.)
            copied_msg = await message.send_copy(chat_id=admin_id)

            # 3. Сохраняем связку для обоих сообщений: на какое бы из них админ ни нажал Reply, бот поймет
            await database.save_mapping(card_msg.message_id, user.id, message.message_id)
            await database.save_mapping(copied_msg.message_id, user.id, message.message_id)

            forwarded_to_any = True
        except TelegramForbiddenError:
            logger.warning(f"Администратор {admin_id} не запустил бота (Forbidden).")
        except Exception as e:
            logger.error(f"Не удалось переслать сообщение администратору {admin_id}: {e}")

    if forwarded_to_any:
        await message.answer("✅ <b>Ваше сообщение принято!</b>\nАдминистратор ответит вам в ближайшее время.")
    else:
        await message.answer(
            "⚠️ Не удалось доставить сообщение администратору.\n"
            "Убедитесь, что администратор запустил бота нажатием /start."
        )


# =====================================================================
# ТОЧКА ВХОДА
# =====================================================================

async def main():
    print("=" * 60)
    print("Запуск Telegram-бота обратной связи...")
    print("=" * 60)

    # Проверка конфигурации
    if not config.check_config():
        print("Запуск приостановлен. Заполните .env и перезапустите бота.")
        return

    # Инициализация базы данных
    await database.init_db()
    logger.info("База данных SQLite инициализирована.")

    # Инициализация бота
    bot = Bot(
        token=config.BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML)
    )

    bot_info = await bot.get_me()
    print(f"✅ Бот успешно подключен: @{bot_info.username} ({bot_info.first_name})")
    print(f"👑 Зарегистрированные ID администраторов: {config.ADMIN_IDS}")
    print("=" * 60)
    print("Ожидание входящих сообщений (нажмите Ctrl+C для остановки)...")

    # Сбрасываем старые вебхуки / обновления и запускаем polling
    await bot.delete_webhook(drop_pending_updates=True)
    await dp.start_polling(bot)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        print("\nБот остановлен.")
