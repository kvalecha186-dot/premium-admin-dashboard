@echo off
title Premium Admin Dashboard - Localhost Server
echo ========================================================
echo   Starting Localhost Server for Premium Admin Dashboard
echo ========================================================
echo.

if not exist node_modules (
    echo [1/2] Installing required project dependencies...
    call npm install
    echo.
)

echo [2/2] Opening browser at http://localhost:8443 ...
start http://localhost:8443
echo.
echo Starting dev server...
call npm run dev
pause
