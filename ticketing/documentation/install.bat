@echo off
setlocal

:: ITSD Ticketing System - Windows install entry point.
:: Right-click this file and choose "Run as administrator" (or just double
:: click it; it will request elevation automatically).

net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo Requesting administrator privileges...
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

set "SCRIPT_DIR=%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%Install-TicketingApp.ps1"

echo.
pause
