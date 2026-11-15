import aiosqlite
from typing import Optional, Tuple
from config import DB_PATH


async def init_db() -> None:
    """Инициализация таблиц базы данных."""
    async with aiosqlite.connect(DB_PATH) as db:
        # Таблица пользователей
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY,
                username TEXT,
                full_name TEXT,
                is_blocked INTEGER DEFAULT 0,
                first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Таблица связки сообщений администратора и пользователей
        # Позволяет боту понимать, какому пользователю отвечать при Reply
        await db.execute("""
            CREATE TABLE IF NOT EXISTS message_mappings (
                admin_message_id INTEGER PRIMARY KEY,
                user_id INTEGER NOT NULL,
                user_message_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Таблица логов сообщений для статистики
        await db.execute("""
            CREATE TABLE IF NOT EXISTS message_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                is_from_admin INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Индексы для ускорения поиска
        await db.execute("CREATE INDEX IF NOT EXISTS idx_users_blocked ON users(is_blocked)")
        await db.commit()


async def upsert_user(user_id: int, username: Optional[str], full_name: Optional[str]) -> None:
    """Добавляет нового пользователя или обновляет информацию о существующем."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            INSERT INTO users (user_id, username, full_name, last_seen)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
                username = excluded.username,
                full_name = excluded.full_name,
                last_seen = CURRENT_TIMESTAMP
        """, (user_id, username, full_name))
        await db.commit()


async def is_user_blocked(user_id: int) -> bool:
    """Проверяет, заблокирован ли пользователь."""
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT is_blocked FROM users WHERE user_id = ?", (user_id,)) as cursor:
            row = await cursor.fetchone()
            return bool(row[0]) if row else False


async def set_user_block(user_id: int, blocked: bool) -> bool:
    """Блокирует или разблокирует пользователя. Возвращает True, если пользователь найден."""
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "UPDATE users SET is_blocked = ? WHERE user_id = ?",
            (1 if blocked else 0, user_id)
        )
        await db.commit()
        return cursor.rowcount > 0


async def save_mapping(admin_message_id: int, user_id: int, user_message_id: Optional[int]) -> None:
    """Сохраняет соответствие между сообщением администратора и сообщением пользователя."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            INSERT OR REPLACE INTO message_mappings (admin_message_id, user_id, user_message_id)
            VALUES (?, ?, ?)
        """, (admin_message_id, user_id, user_message_id))
        await db.commit()


async def get_user_by_admin_message(admin_message_id: int) -> Optional[Tuple[int, Optional[int]]]:
    """Возвращает (user_id, user_message_id) по ID сообщения в чате администратора."""
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute(
            "SELECT user_id, user_message_id FROM message_mappings WHERE admin_message_id = ?",
            (admin_message_id,)
        ) as cursor:
            row = await cursor.fetchone()
            if row:
                return row[0], row[1]
            return None


async def log_message(user_id: int, is_from_admin: bool) -> None:
    """Логирует входящее или исходящее сообщение."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(
            "INSERT INTO message_logs (user_id, is_from_admin) VALUES (?, ?)",
            (user_id, 1 if is_from_admin else 0)
        )
        await db.commit()


async def get_stats() -> dict:
    """Возвращает общую статистику бота."""
    async with aiosqlite.connect(DB_PATH) as db:
        async with db.execute("SELECT COUNT(*) FROM users") as cur:
            total_users = (await cur.fetchone())[0]

        async with db.execute("SELECT COUNT(*) FROM users WHERE is_blocked = 1") as cur:
            blocked_users = (await cur.fetchone())[0]

        async with db.execute("SELECT COUNT(*) FROM message_logs WHERE is_from_admin = 0") as cur:
            incoming_messages = (await cur.fetchone())[0]

        async with db.execute("SELECT COUNT(*) FROM message_logs WHERE is_from_admin = 1") as cur:
            outgoing_messages = (await cur.fetchone())[0]

        return {
            "total_users": total_users,
            "blocked_users": blocked_users,
            "incoming_messages": incoming_messages,
            "outgoing_messages": outgoing_messages,
        }
