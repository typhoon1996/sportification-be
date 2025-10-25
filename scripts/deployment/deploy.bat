@echo off
REM =============================================================================
REM Deployment Script Wrapper for Windows
REM =============================================================================
REM This is a Windows wrapper for the deployment functionality
REM It delegates to Node.js scripts for cross-platform compatibility
REM =============================================================================

echo.
echo ========================================
echo   Sportification Deployment (Windows)
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ first.
    echo Download from: https://nodejs.org/
    exit /b 1
)

REM Get environment argument
set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" (
    echo Usage: deploy.bat [environment]
    echo.
    echo Available environments:
    echo   dev   - Deploy to development
    echo   test  - Deploy to test/staging
    echo   prod  - Deploy to production
    echo.
    exit /b 1
)

REM Validate environment
if "%ENVIRONMENT%" NEQ "dev" if "%ENVIRONMENT%" NEQ "test" if "%ENVIRONMENT%" NEQ "prod" (
    echo [ERROR] Invalid environment: %ENVIRONMENT%
    echo Valid options: dev, test, prod
    exit /b 1
)

REM Use npm script which internally uses cross-platform Node.js scripts
echo [INFO] Deploying to %ENVIRONMENT%...
npm run deploy:%ENVIRONMENT%

if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Deployment failed
    exit /b 1
)

echo.
echo [SUCCESS] Deployment completed!
exit /b 0
