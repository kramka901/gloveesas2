@echo off
chcp 65001 > nul
title Telegram Feedback Bot
cd /d "%~dp0"

echo ===================================================
echo     Запуск Telegram-бота обратной связи...
echo ===================================================
echo.

if exist ".venv\Scripts\python.exe" (
    ".venv\Scripts\python.exe" bot.py
) else (
    python bot.py
)

pause
