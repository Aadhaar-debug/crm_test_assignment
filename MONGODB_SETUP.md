# MongoDB Setup Guide for CRM Application

## Quick Setup with MongoDB Atlas (Recommended)

### 1. Create MongoDB Atlas Account
- Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
- Sign up for a free account
- Create a new project

### 2. Create a Cluster
- Click "Build a Database"
- Choose "FREE" tier (M0)
- Select your preferred cloud provider and region
- Click "Create"

### 3. Set Up Database Access
- Go to "Database Access" in the left sidebar
- Click "Add New Database User"
- Create a username and password (save these!)
- Select "Read and write to any database"
- Click "Add User"

### 4. Set Up Network Access
- Go to "Network Access" in the left sidebar
- Click "Add IP Address"
- Click "Allow Access from Anywhere" (for development)
- Click "Confirm"

### 5. Get Your Connection String
- Go back to "Database" in the left sidebar
- Click "Connect" on your cluster
- Choose "Connect your application"
- Copy the connection string

### 6. Update Environment Variables
- Copy the connection string
- Replace `<username>`, `<password>`, and `<dbname>` with your actual values
- Update your `.env.local` file:

```env
MONGODB_URI=mongodb+srv://yourusername:yourpassword@cluster0.xxxxx.mongodb.net/crm_app
```

### 7. Test the Connection
- Start the backend server: `cd server && npm run dev`
- You should see: "✅ Connected to MongoDB successfully"

## Alternative: Local MongoDB Installation

### Windows
1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Run the installer
3. Start MongoDB service: `net start MongoDB`

### macOS
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

### Linux (Ubuntu)
```bash
sudo apt update
sudo apt install mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

## Testing the Application

Once MongoDB is connected:

1. **Start Backend**: `cd server && npm run dev`
2. **Start Frontend**: `npm run dev` (in root directory)
3. **Seed Database**: `npm run seed`
4. **Access Application**: http://localhost:3002

## Default Login Credentials

After running the seed script:
- **Admin**: admin@crm.com / admin123
- **Agent**: agent1@crm.com / agent123

## Troubleshooting

### Connection Refused
- Check if MongoDB is running
- Verify connection string format
- Ensure network access is configured correctly

### Authentication Failed
- Verify username and password
- Check if user has correct permissions

### Port Already in Use
- Change ports in package.json scripts
- Kill existing processes: `taskkill /f /im node.exe`
