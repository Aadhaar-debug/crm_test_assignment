@echo off
chcp 65001 >nul
title CRM Application Startup

echo.
echo 🚀 Starting CRM Application...
echo =====================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is available
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not available
    pause
    exit /b 1
)

echo ✅ Node.js and npm are available

REM Check if .env file exists in server directory
if not exist "server\.env" (
    echo ⚠️  Server .env file not found. Checking for .env.local...
    if exist ".env.local" (
        echo 📋 Copying .env.local to server\.env...
        copy ".env.local" "server\.env" >nul
        echo ✅ Environment file copied
    ) else (
        echo ❌ No environment file found. Please create .env.local in root directory
        echo Required variables: MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET, PORT=3001
        pause
        exit /b 1
    )
)

REM Check if dependencies are installed
echo 🔍 Checking dependencies...

if not exist "node_modules" (
    echo 📦 Installing root dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install root dependencies
        pause
        exit /b 1
    )
)

if not exist "server\node_modules" (
    echo 📦 Installing server dependencies...
    cd server
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install server dependencies
        pause
        exit /b 1
    )
    cd ..
)

echo ✅ All dependencies are installed

REM Start both servers
echo 🚀 Starting servers...
echo =====================================

REM Start backend server in new window
echo 🔧 Starting Backend Server (Port 3001)...
start "Backend Server" cmd /k "cd server && echo 🔧 Backend Server Starting... && npm start"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window
echo 🎨 Starting Frontend Application (Port 3002)...
start "Frontend App" cmd /k "echo 🎨 Frontend Starting... && npm run dev"

REM Wait for both to start
timeout /t 5 /nobreak >nul

echo =====================================
echo 🎉 CRM Application Started Successfully!
echo =====================================
echo 🌐 Frontend: http://localhost:3002
echo 🔧 Backend: http://localhost:3001
echo 📊 Health Check: http://localhost:3001/health
echo =====================================
echo 💡 Tips:
echo    • Use Ctrl+C in each terminal to stop individual servers
echo    • Backend must be running for frontend to work properly
echo    • Check MongoDB connection in backend terminal
echo =====================================

echo.
echo ⏳ Press any key to exit this script (servers will continue running)...
pause >nul
