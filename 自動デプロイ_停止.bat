@echo off
chcp 65001 >nul

echo ==================================================
echo   Kokokara HP - Auto deploy : STOP
echo ==================================================
echo.

powershell -ExecutionPolicy Bypass -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='powershell.exe'\" | Where-Object { $_.CommandLine -like '*auto_deploy_watch*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }; $p=[Environment]::GetFolderPath('Startup'); Remove-Item (Join-Path $p 'KokokaraAutoDeploy.lnk') -ErrorAction SilentlyContinue"

echo Stopped the watcher and removed it from Startup.
echo (Your files are safe. Automatic deploy is now OFF.)
echo.
pause
