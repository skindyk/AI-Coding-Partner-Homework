@echo off
REM Customer Support Ticket System - Windows Start Script

echo ======================================
echo  Customer Support Ticket System
echo ======================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    exit /b 1
)

echo [INFO] Node.js version:
node --version
echo.

REM Check if dependencies are installed
if not exist "node_modules\" (
    echo [INFO] Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies!
        exit /b 1
    )
    echo.
)

echo [INFO] Starting the server...
echo [INFO] The application will be available at:
echo        http://localhost:3000
echo.
echo [INFO] Press Ctrl+C to stop the server
echo.

REM Start the application
npm start
