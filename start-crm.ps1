# CRM Application Startup Script
# This script starts both the backend server and frontend application

Write-Host "🚀 Starting CRM Application..." -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if npm is available
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not available" -ForegroundColor Red
    exit 1
}

# Function to check if port is available
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $false  # Port is in use
    } catch {
        return $true   # Port is available
    }
}

# Function to kill process on specific port
function Stop-ProcessOnPort {
    param([int]$Port)
    try {
        $process = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
        if ($process) {
            Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
            Write-Host "🔄 Stopped process on port $Port" -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    } catch {
        # Ignore errors
    }
}

# Check and clear ports if needed
Write-Host "🔍 Checking port availability..." -ForegroundColor Cyan

if (-not (Test-Port 3001)) {
    Write-Host "⚠️  Port 3001 (backend) is in use. Stopping existing process..." -ForegroundColor Yellow
    Stop-ProcessOnPort 3001
}

if (-not (Test-Port 3002)) {
    Write-Host "⚠️  Port 3002 (frontend) is in use. Stopping existing process..." -ForegroundColor Yellow
    Stop-ProcessOnPort 3002
}

# Check if .env file exists in server directory
$serverEnvPath = "server\.env"
if (-not (Test-Path $serverEnvPath)) {
    Write-Host "⚠️  Server .env file not found. Checking for .env.local..." -ForegroundColor Yellow
    $rootEnvPath = ".env.local"
    if (Test-Path $rootEnvPath) {
        Write-Host "📋 Copying .env.local to server\.env..." -ForegroundColor Cyan
        Copy-Item $rootEnvPath $serverEnvPath -Force
        Write-Host "✅ Environment file copied" -ForegroundColor Green
    } else {
        Write-Host "❌ No environment file found. Please create .env.local in root directory" -ForegroundColor Red
        Write-Host "Required variables: MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET, PORT=3001" -ForegroundColor Yellow
        exit 1
    }
}

# Check if dependencies are installed
Write-Host "🔍 Checking dependencies..." -ForegroundColor Cyan

# Check root dependencies
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing root dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install root dependencies" -ForegroundColor Red
        exit 1
    }
}

# Check server dependencies
if (-not (Test-Path "server\node_modules")) {
    Write-Host "📦 Installing server dependencies..." -ForegroundColor Yellow
    Set-Location "server"
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install server dependencies" -ForegroundColor Red
        exit 1
    }
    Set-Location ".."
}

Write-Host "✅ All dependencies are installed" -ForegroundColor Green

# Start both servers
Write-Host "🚀 Starting servers..." -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan

# Start backend server in background
Write-Host "🔧 Starting Backend Server (Port 3001)..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; Write-Host '🔧 Backend Server Starting...' -ForegroundColor Blue; npm start" -WindowStyle Normal

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend in background
Write-Host "🎨 Starting Frontend Application (Port 3002)..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '🎨 Frontend Starting...' -ForegroundColor Blue; npm run dev" -WindowStyle Normal

# Wait for both to start
Start-Sleep -Seconds 5

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "🎉 CRM Application Started Successfully!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "🌐 Frontend: http://localhost:3002" -ForegroundColor Yellow
Write-Host "🔧 Backend: http://localhost:3001" -ForegroundColor Yellow
Write-Host "📊 Health Check: http://localhost:3001/health" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "💡 Tips:" -ForegroundColor Cyan
Write-Host "   • Use Ctrl+C in each terminal to stop individual servers" -ForegroundColor White
Write-Host "   • Backend must be running for frontend to work properly" -ForegroundColor White
Write-Host "   • Check MongoDB connection in backend terminal" -ForegroundColor White
Write-Host "=====================================" -ForegroundColor Cyan

# Keep script running to show status
Write-Host "⏳ Press any key to exit this script (servers will continue running)..." -ForegroundColor Magenta
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
