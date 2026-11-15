@echo off
chcp 65001 > nul
title Ajarändur: 8. Klassi Ajaloo Maailmad

echo =================================================================
echo             AJARÄNDUR: 8. KLASSI AJALOO MAAILMAD
echo       2D Interaktiivne Avastusmäng ja Hariduslik Simulaator
echo =================================================================
echo.
echo Vali käivitamisviis:
echo   [1] Veebibrauseri 2D mäng (SOOVITATAV - Avaneb automaatselt)
echo   [2] Pygame töölauamäng (Eraldi 2D mänguaken)
echo.
set /p choice="Sinu valik (1 või 2, vaikimisi 1): "

if "%choice%"=="2" (
    echo.
    echo Käivitan Pygame töölauamängu...
    if exist .venv\Scripts\python.exe (
        .venv\Scripts\python.exe main.py --pygame
    ) else (
        python main.py --pygame
    )
) else (
    echo.
    echo Käivitan 2D mängu veebibrauseris aadressil http://127.0.0.1:8008 ...
    if exist .venv\Scripts\python.exe (
        .venv\Scripts\python.exe main.py
    ) else (
        python main.py
    )
)

pause
