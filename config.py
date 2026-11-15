import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Загружаем переменные окружения из .env файла в директории проекта
BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / ".env"

if ENV_FILE.exists():
    load_dotenv(ENV_FILE)

# Токен бота от @BotFather
BOT_TOKEN = os.getenv("BOT_TOKEN", "").strip()

# Список ID администраторов (поддерживает один или несколько через запятую)
_raw_admins = os.getenv("ADMIN_IDS") or os.getenv("ADMIN_ID") or ""
ADMIN_IDS: list[int] = []

for item in _raw_admins.replace(" ", "").split(","):
    if item.isdigit():
        ADMIN_IDS.append(int(item))

# Путь к файлу базы данных SQLite
DB_PATH = BASE_DIR / "bot_database.sqlite"


def is_admin(user_id: int) -> bool:
    """Проверяет, является ли пользователь администратором."""
    return user_id in ADMIN_IDS


def check_config() -> bool:
    """Проверяет корректность заполнения конфигурации."""
    errors = []
    if not BOT_TOKEN or BOT_TOKEN == "YOUR_BOT_TOKEN_HERE":
        errors.append("Не указан токен бота (BOT_TOKEN) в файле .env")
    if not ADMIN_IDS:
        errors.append("Не указан ID администратора (ADMIN_IDS) в файле .env")

    if errors:
        print("\n" + "=" * 60)
        print("ВНИМАНИЕ: Ошибки конфигурации бота:")
        for err in errors:
            print(f"  ❌ {err}")
        print("=" * 60)
        print("Пожалуйста, откройте файл .env и укажите ваши данные:")
        print("1. BOT_TOKEN — токен бота от @BotFather в Telegram")
        print("2. ADMIN_IDS — ваш числовой ID Telegram (можно узнать у @userinfobot)")
        print("=" * 60 + "\n")
        return False
    return True
