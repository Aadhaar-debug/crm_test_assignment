# 🚀 CRM Application - Quick Start Guide

## ⚡ **Single Command Startup**

### **Option 1: Standard NPM Start (Recommended)**
```bash
npm start
```

### **Option 2: PowerShell Script**
```bash
npm run start-crm
```

### **Option 3: Advanced Batch File**
```bash
npm run start-crm-bat
```

### **Option 3: Direct Script Execution**
```bash
# PowerShell
powershell -ExecutionPolicy Bypass -File start-crm.ps1

# Batch File
start-crm.bat
```

## 🎯 **What the Startup Script Does**

✅ **Automatically checks** Node.js and npm availability  
✅ **Verifies** environment configuration  
✅ **Installs dependencies** if missing  
✅ **Starts backend server** on port 3001  
✅ **Starts frontend app** on port 3002  
✅ **Opens separate terminals** for each service  
✅ **Provides status updates** and helpful tips  

## 🌐 **Access Your CRM**

- **Frontend**: http://localhost:3002
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 🔧 **Manual Startup (Alternative)**

If you prefer to start services manually:

### **Terminal 1 - Backend**
```bash
cd server
npm start
```

### **Terminal 2 - Frontend**
```bash
npm run dev
```

### **Note**
- `npm start` now runs the full CRM application (both servers)
- `npm run start:frontend` runs only the frontend in production mode
- `npm run dev` runs only the frontend in development mode

## 📋 **Prerequisites**

- ✅ Node.js 18+ installed
- ✅ MongoDB connection configured
- ✅ `.env.local` file with database credentials

## 🚨 **Troubleshooting**

### **Port Already in Use**
The startup script automatically detects and stops conflicting processes.

### **Environment File Missing**
The script automatically copies `.env.local` to `server/.env` if needed.

### **Dependencies Missing**
The script automatically installs missing dependencies.

## 💡 **Pro Tips**

- **Keep both terminals open** - backend must run for frontend to work
- **Use Ctrl+C** in individual terminals to stop specific services
- **Check MongoDB connection** in the backend terminal
- **Frontend will show errors** if backend is not running

## 🎉 **You're Ready!**

After running the startup script, you'll have a fully functional CRM system with:
- 🔐 Authentication system
- 👥 User management
- 📊 Lead management
- 🏢 Customer management
- ✅ Task management
- 📈 Analytics dashboard

**Happy CRM-ing! 🚀**
