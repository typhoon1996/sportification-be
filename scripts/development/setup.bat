@echo off
REM =============================================================================
REM Setup Script Wrapper for Windows
REM =============================================================================
REM Quick setup script for Windows users
REM =============================================================================

echo.
echo ========================================
echo   Sportification Backend Setup
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed.
    echo Please install Node.js 18+ from: https://nodejs.org/
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1" %%i in ('node -v') do set NODE_VERSION=%%i
echo [INFO] Node.js %NODE_VERSION% detected

REM Check if npm is available
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed.
    exit /b 1
)

REM Get npm version
for /f "tokens=1" %%i in ('npm -v') do set NPM_VERSION=%%i
echo [INFO] npm %NPM_VERSION% detected

echo.
echo [INFO] Installing dependencies...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)

echo.
echo [INFO] Building project...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed
    exit /b 1
)

echo.
echo [SUCCESS] Setup completed successfully!
echo.
echo Next steps:
echo   1. Configure your .env file
echo   2. Start MongoDB and Redis (via Docker or locally)
echo   3. Run: npm run dev
echo.
exit /b 0
