@echo off
setlocal

:: Local master-password recovery tool - no administrator rights required,
:: only file access to this server. See INSTALLDOCU.txt section 5.

set "SCRIPT_DIR=%~dp0"
set "BACKEND_DIR=%SCRIPT_DIR%..\webapp\backend"

if not exist "%BACKEND_DIR%" (
    echo Could not find ..\webapp\backend next to this script.
    pause
    exit /b 1
)

pushd "%BACKEND_DIR%"
call npm run reset:master-password
popd

echo.
pause
