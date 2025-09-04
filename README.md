# 🚀 CRM Application - Full-Stack Customer Relationship Management System

A modern, production-ready CRM application built with Next.js 15, Node.js, Express, and MongoDB. Features a comprehensive suite of tools for managing leads, customers, tasks, and analytics with role-based access control.

## ✨ Features

### 🔐 Authentication & User Management
- **Local Authentication**: Email/password login with JWT tokens
- **Role-Based Access Control**: Admin and Agent roles
- **Protected Routes**: Frontend and backend route protection
- **Token Management**: Access + refresh token strategy
- **Session Persistence**: Automatic token refresh

### 👥 User Roles & Permissions
- **Admin Users**: Full system access, user management, all data access
- **Agent Users**: Manage own leads/customers, view assigned tasks
- **Ownership Checks**: Data isolation between agents
- **Permission Middleware**: Backend API protection

### 📊 Lead Management
- **Full CRUD Operations**: Create, read, update, delete leads
- **Advanced Filtering**: Search by name, email, status, source
- **Status Tracking**: New → In Progress → Closed Won/Lost
- **Agent Assignment**: Assign leads to specific agents
- **Lead Conversion**: Convert successful leads to customers
- **Soft Delete**: Archive leads without permanent deletion
- **Pagination**: Efficient data loading for large datasets

### 🏢 Customer Management
- **Customer Profiles**: Company information, contact details, tags
- **Notes System**: Add and track customer interactions
- **Deal Tracking**: Monitor sales opportunities and values
- **Tag Management**: Categorize customers for better organization
- **Ownership Control**: Agents manage their assigned customers
- **Activity History**: Track all customer interactions

### ✅ Task Management
- **Task Creation**: Assign tasks with due dates and priorities
- **Status Tracking**: Open → In Progress → Done
- **Priority Levels**: Low, Medium, High
- **Due Date Management**: Overdue indicators and reminders
- **Entity Linking**: Connect tasks to leads or customers
- **Owner Assignment**: Assign tasks to specific agents
- **Progress Monitoring**: Track task completion rates

### 📈 Dashboard & Analytics
- **Real-time Statistics**: Total leads, customers, tasks
- **Lead Status Distribution**: Visual breakdown of lead pipeline
- **Activity Charts**: Lead creation trends (last 14 days)
- **Recent Activity Feed**: Latest 10 system events
- **Performance Metrics**: Agent productivity tracking
- **Interactive Charts**: Built with Recharts library

## 🛠️ Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **React Context API**: Global state management
- **React Hook Form**: Form handling and validation
- **Zod**: Schema validation
- **Recharts**: Data visualization and charts
- **Lucide React**: Modern icon library
- **Clsx**: Conditional class names

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **JWT**: JSON Web Token authentication
- **bcryptjs**: Password hashing
- **Express Validator**: Input validation
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API protection

### Development Tools
- **TypeScript**: Type safety across the stack
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **tsx**: TypeScript execution
- **Nodemon**: Development server with auto-restart

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** installed
- **MongoDB** connection (local or Atlas)
- **Git** for version control

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd crm_test_assignment
```

### 2. Environment Setup
Create a `.env.local` file in the root directory:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/crm_db
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
PORT=3001
NODE_ENV=development
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Install Dependencies
```bash
# Install root dependencies (frontend)
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### 4. Start the Application

#### **Option 1: Single Command (Recommended)**
```bash
npm start
```
This starts both backend and frontend simultaneously.

#### **Option 2: Manual Startup**
```bash
# Terminal 1 - Backend Server
cd server
npm start

# Terminal 2 - Frontend Application
npm run dev
```

#### **Option 3: Alternative Scripts**
```bash
# PowerShell version
npm run start-crm

# Advanced batch version
npm run start-crm-bat
```

### 5. Access Your CRM
- **Frontend**: http://localhost:3002
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 🌱 Database Seeding

### Run the Seed Script
```bash
npm run seed
```

### What the Seed Script Does
The seed script populates your database with initial data:

- **1 Admin User**: Full system access
- **2 Agent Users**: Sales representatives
- **10 Sample Leads**: Various statuses and sources
- **5 Sample Customers**: With company information and tags
- **Sample Tasks**: Assigned to different agents
- **Activity Records**: System interaction history

### Seed Data Credentials
- **Admin**: admin@crm.com / admin123
- **Agent 1**: agent1@crm.com / agent123
- **Agent 2**: agent2@crm.com / agent123

## 📁 Project Structure

```
crm_test_assignment/
├── app/                          # Next.js frontend
│   ├── components/              # Reusable UI components
│   │   ├── ui/                 # Base UI components
│   │   ├── Header.tsx          # Application header
│   │   └── Sidebar.tsx         # Navigation sidebar
│   ├── contexts/               # React contexts
│   │   └── AuthContext.tsx     # Authentication state
│   ├── dashboard/              # Dashboard page
│   ├── leads/                  # Lead management
│   ├── customers/              # Customer management
│   ├── tasks/                  # Task management
│   ├── login/                  # Authentication page
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page
├── server/                      # Express backend
│   ├── models/                 # Mongoose schemas
│   ├── routes/                 # API endpoints
│   ├── middleware/             # Custom middleware
│   ├── index.ts                # Server entry point
│   └── package.json            # Backend dependencies
├── scripts/                     # Utility scripts
│   └── seed.ts                 # Database seeding
├── public/                      # Static assets
├── start-crm.ps1               # PowerShell startup script
├── start-crm.bat               # Batch startup script
├── start-crm-simple.bat        # Simple batch startup
├── package.json                 # Frontend dependencies
└── README.md                    # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new admin user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users` - List users (admin only)
- `GET /api/users/:id` - Get user details
- `POST /api/users` - Create user (admin only)
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)

### Leads
- `GET /api/leads` - List leads with filtering
- `GET /api/leads/:id` - Get lead details
- `POST /api/leads` - Create new lead
- `PATCH /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Soft delete lead
- `POST /api/leads/:id/convert` - Convert lead to customer

### Customers
- `GET /api/customers` - List customers with filtering
- `GET /api/customers/:id` - Get customer details
- `POST /api/customers` - Create new customer
- `PATCH /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer
- `POST /api/customers/:id/notes` - Add customer note

### Tasks
- `GET /api/tasks` - List tasks with filtering
- `GET /api/tasks/:id` - Get task details
- `POST /api/tasks` - Create new task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Activity
- `GET /api/activity` - List system activities
- `POST /api/activity` - Log new activity

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcryptjs for password security
- **Rate Limiting**: API abuse prevention
- **CORS Protection**: Cross-origin request control
- **Helmet Security**: HTTP header security
- **Input Validation**: Server-side data validation
- **Role-Based Access**: Granular permission control
- **Ownership Checks**: Data isolation between users

## 📊 Database Schema

### User Model
- Authentication fields (email, password)
- Role-based permissions (admin/agent)
- Profile information (firstName, lastName)
- Timestamps and audit fields

### Lead Model
- Contact information (name, email, phone)
- Status tracking (New, In Progress, Closed Won/Lost)
- Source attribution and agent assignment
- Notes and activity history

### Customer Model
- Company and contact details
- Tag system for categorization
- Notes and interaction history
- Deal tracking and value management

### Task Model
- Task details (title, description, due date)
- Status and priority management
- Entity relationships (leads/customers)
- Owner assignment and tracking

### Activity Model
- System event logging
- User action tracking
- Timestamp and metadata
- Audit trail maintenance

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
The startup scripts automatically detect and resolve port conflicts.

#### MongoDB Connection Issues
- Verify your connection string in `.env.local`
- Check network connectivity to MongoDB Atlas
- Ensure database user has proper permissions

#### Frontend Not Loading
- Ensure backend server is running on port 3001
- Check browser console for CORS errors
- Verify environment variables are loaded

#### Authentication Errors
- Check JWT secret configuration
- Verify token expiration settings
- Ensure proper CORS configuration

### Environment Setup
- **Windows**: Use `.env.local` in root directory
- **PowerShell Issues**: Use batch file alternatives
- **Permission Errors**: Run as administrator if needed

## 🧪 Development

### Running in Development Mode
```bash
# Frontend development
npm run dev

# Backend development
cd server
npm run dev
```

### Building for Production
```bash
# Build frontend
npm run build

# Start production frontend
npm run start:frontend
```

### Code Quality
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality rules
- **Prettier**: Consistent formatting
- **Component Structure**: Reusable UI components

## 📈 Performance Features

- **Database Indexing**: Optimized MongoDB queries
- **Pagination**: Efficient data loading
- **Caching**: JWT token caching
- **Rate Limiting**: API performance protection
- **Lazy Loading**: Component-level code splitting
- **Optimized Queries**: Mongoose query optimization

## 🔄 Deployment

### Environment Variables
Ensure all required environment variables are set in production:
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `NODE_ENV=production`
- `PORT`

### Build Process
```bash
# Install dependencies
npm install

# Build frontend
npm run build

# Start production servers
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the troubleshooting section
- Review the API documentation
- Check MongoDB connection status
- Verify environment configuration

---

**Built with ❤️ using Next.js, Express, and MongoDB**

**Happy CRM-ing! 🚀**
