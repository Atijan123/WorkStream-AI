@echo off
REM Self-Evolving Workflow Automator - Windows Startup Script
REM This script starts the complete application stack on Windows

setlocal enabledelayedexpansion

REM Configuration
if "%NODE_ENV%"=="" set NODE_ENV=development
if "%BACKEND_PORT%"=="" set BACKEND_PORT=3001
if "%FRONTEND_PORT%"=="" set FRONTEND_PORT=5173
if "%DATABASE_PATH%"=="" set DATABASE_PATH=.\backend\data\database.sqlite
if "%LOG_LEVEL%"=="" set LOG_LEVEL=info

echo.
echo 🚀 Starting Self-Evolving Workflow Automator
echo Environment: %NODE_ENV%
echo.

REM Function to check if a port is in use
:check_port
netstat -an | find ":%1 " | find "LISTENING" >nul
if %errorlevel%==0 (
    exit /b 0
) else (
    exit /b 1
)

REM Check prerequisites
echo 🔍 Checking prerequisites...

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js %NODE_VERSION%

REM Check npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm %NPM_VERSION%

REM Check if ports are available
call :check_port %BACKEND_PORT%
if %errorlevel%==0 (
    echo ❌ Port %BACKEND_PORT% is already in use
    echo    Please stop the service using port %BACKEND_PORT% or set BACKEND_PORT to a different value
    pause
    exit /b 1
)

call :check_port %FRONTEND_PORT%
if %errorlevel%==0 (
    echo ❌ Port %FRONTEND_PORT% is already in use
    echo    Please stop the service using port %FRONTEND_PORT% or set FRONTEND_PORT to a different value
    pause
    exit /b 1
)

echo ✅ Ports %BACKEND_PORT% and %FRONTEND_PORT% are available

REM Install dependencies if needed
echo.
echo 📦 Installing dependencies...

if not exist "node_modules" (
    echo    Installing root dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install root dependencies
        pause
        exit /b 1
    )
)

if not exist "backend\node_modules" (
    echo    Installing backend dependencies...
    cd backend
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install backend dependencies
        pause
        exit /b 1
    )
    cd ..
)

if not exist "frontend\node_modules" (
    echo    Installing frontend dependencies...
    cd frontend
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install frontend dependencies
        pause
        exit /b 1
    )
    cd ..
)

echo ✅ Dependencies installed

REM Initialize database
echo.
echo 🗄️ Initializing database...

REM Create data directory if it doesn't exist
for %%F in ("%DATABASE_PATH%") do (
    if not exist "%%~dpF" mkdir "%%~dpF"
)

REM Run database initialization
cd backend
call npm run db:init
if %errorlevel% neq 0 (
    echo ❌ Failed to initialize database
    cd ..
    pause
    exit /b 1
)
cd ..

echo ✅ Database initialized

REM Build applications
echo.
echo 🔨 Building applications...

REM Build backend
echo    Building backend...
cd backend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Failed to build backend
    cd ..
    pause
    exit /b 1
)
cd ..

REM Build frontend for production
if "%NODE_ENV%"=="production" (
    echo    Building frontend for production...
    cd frontend
    call npm run build
    if %errorlevel% neq 0 (
        echo ❌ Failed to build frontend
        cd ..
        pause
        exit /b 1
    )
    cd ..
)

echo ✅ Applications built

REM Start services
echo.
echo 🚀 Starting services...

REM Start backend
echo    Starting backend on port %BACKEND_PORT%...
cd backend
start "Backend Server" cmd /c "set PORT=%BACKEND_PORT%&& set NODE_ENV=%NODE_ENV%&& set LOG_LEVEL=%LOG_LEVEL%&& npm start"
cd ..

REM Wait for backend to be ready
echo    Waiting for backend to be ready...
:wait_backend
timeout /t 2 /nobreak >nul
curl -s http://localhost:%BACKEND_PORT%/api/health >nul 2>&1
if %errorlevel% neq 0 goto wait_backend
echo ✅ Backend is ready

REM Start frontend
if "%NODE_ENV%"=="production" (
    echo    Frontend built and ready to be served
) else (
    echo    Starting frontend development server on port %FRONTEND_PORT%...
    cd frontend
    start "Frontend Server" cmd /c "set PORT=%FRONTEND_PORT%&& npm run dev"
    cd ..
    
    REM Wait for frontend to be ready
    echo    Waiting for frontend to be ready...
    :wait_frontend
    timeout /t 2 /nobreak >nul
    curl -s http://localhost:%FRONTEND_PORT% >nul 2>&1
    if %errorlevel% neq 0 goto wait_frontend
    echo ✅ Frontend is ready
)

REM Display startup information
echo.
echo 🎉 Self-Evolving Workflow Automator is running!
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo Backend:  http://localhost:%BACKEND_PORT%
echo API:      http://localhost:%BACKEND_PORT%/api
echo Health:   http://localhost:%BACKEND_PORT%/api/health

if not "%NODE_ENV%"=="production" (
    echo Frontend: http://localhost:%FRONTEND_PORT%
)

echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo The application is now running. Check the separate console windows for logs.
echo Close those console windows to stop the services.
echo.
pause