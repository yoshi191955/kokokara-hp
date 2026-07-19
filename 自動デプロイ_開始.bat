@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ==================================================
echo   Kokokara HP - Auto deploy : START
echo ==================================================
echo.
echo Starting folder watcher (runs hidden in background)
echo and registering it to Windows Startup...
echo.

start "" powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0auto_deploy_watch.ps1" -Install

echo Done. From now on, when you save a file in this folder,
echo it will be pushed to GitHub and published by Netlify
echo automatically (a few seconds delay).
echo.
echo You can close this window.
echo.
pause
