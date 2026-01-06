# IT Inventory Management System

A full-stack inventory management system for tracking IT assets, including computers, laptops, and equipment. Built with React (Vite + TailwindCSS) for the frontend and Node.js + Express + Sequelize for the backend.

## 🌟 Features

### Inventory Management

- ✅ Add, edit, and delete inventory items
- ✅ Track PC details: Name, Windows Version, MS Office, Applications
- ✅ Track device type: Laptop/Desktop
- ✅ Status management: Active User, Transfer, Available, Maintenance, For Upgrade
- ✅ User status tracking and remarks
- ✅ Pagination and filtering

### Borrow/Return Management

- ✅ Monitor product release and return
- ✅ Schedule return dates
- ✅ Track borrowed items
- ✅ View overdue and upcoming returns
- ✅ Email notifications for borrow confirmations and return reminders

### Reporting

- ✅ Generate inventory reports
- ✅ Borrow activity reports
- ✅ Department statistics
- ✅ Activity logs
- ✅ Export reports to CSV

### User Management

- ✅ Role-based access control (Admin, Manager, User)
- ✅ JWT authentication
- ✅ User CRUD operations (Admin only)
- ✅ Account activation/deactivation

## 🛠️ Tech Stack

### Frontend

- **React 18** - UI Library
- **Vite** - Build Tool
- **TailwindCSS** - Styling
- **React Router DOM** - Routing
- **Zustand** - State Management
- **Recharts** - Charts and Visualizations
- **Axios** - HTTP Client
- **React Hot Toast** - Notifications
- **Heroicons** - Icons

### Backend

- **Node.js** - Runtime
- **Express** - Web Framework
- **Sequelize ORM** - Database ORM
- **MySQL** - Database
- **JWT** - Authentication
- **Nodemailer** - Email Notifications
- **bcryptjs** - Password Hashing

## 📋 Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm or yarn

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Inventory-System
```

### 2. Setup Database

Create a MySQL database:

```sql
CREATE DATABASE inventory_system;
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env
```

Edit `.env` file with your database credentials:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=inventory_system
DB_USER=root
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# Email Configuration (Optional - for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=IT Inventory <noreply@company.com>

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

Run database migrations and seed data:

```bash
# Start the server (will auto-sync database in development)
npm run dev

# Seed demo data (in another terminal)
npm run seed
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

Edit `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the development server:

```bash
npm run dev
```

## 🌐 Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api

### Demo Credentials

| Role    | Username | Password   |
| ------- | -------- | ---------- |
| Admin   | admin    | admin123   |
| Manager | manager  | manager123 |
| User    | user     | user123    |

## 📁 Project Structure

```
Inventory-System/
├── backend/
│   ├── src/
│   │   ├── config/         # Database & email configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth & error handling
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API routes
│   │   ├── seeders/        # Demo data seeders
│   │   └── server.js       # Express app entry
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service functions
│   │   ├── store/          # Zustand state stores
│   │   ├── App.jsx         # Main app with routing
│   │   ├── main.jsx        # Entry point
│   │   └── index.css       # TailwindCSS styles
│   ├── .env.example
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
└── README.md
```

## 🔌 API Endpoints

### Authentication

| Method | Endpoint                    | Description              |
| ------ | --------------------------- | ------------------------ |
| POST   | `/api/auth/register`        | Register new user        |
| POST   | `/api/auth/login`           | User login               |
| GET    | `/api/auth/profile`         | Get current user profile |
| PUT    | `/api/auth/profile`         | Update profile           |
| PUT    | `/api/auth/change-password` | Change password          |

### Users (Admin Only)

| Method | Endpoint              | Description    |
| ------ | --------------------- | -------------- |
| GET    | `/api/auth/users`     | Get all users  |
| GET    | `/api/auth/users/:id` | Get user by ID |
| POST   | `/api/auth/users`     | Create user    |
| PUT    | `/api/auth/users/:id` | Update user    |
| DELETE | `/api/auth/users/:id` | Delete user    |

### Inventory

| Method | Endpoint               | Description              |
| ------ | ---------------------- | ------------------------ |
| GET    | `/api/inventory`       | Get all inventory items  |
| GET    | `/api/inventory/stats` | Get inventory statistics |
| GET    | `/api/inventory/:id`   | Get item by ID           |
| POST   | `/api/inventory`       | Create inventory item    |
| PUT    | `/api/inventory/:id`   | Update inventory item    |
| DELETE | `/api/inventory/:id`   | Delete inventory item    |

### Borrow Records

| Method | Endpoint                 | Description            |
| ------ | ------------------------ | ---------------------- |
| GET    | `/api/borrow`            | Get all borrow records |
| GET    | `/api/borrow/stats`      | Get borrow statistics  |
| GET    | `/api/borrow/overdue`    | Get overdue returns    |
| GET    | `/api/borrow/upcoming`   | Get upcoming returns   |
| GET    | `/api/borrow/:id`        | Get record by ID       |
| POST   | `/api/borrow`            | Create borrow record   |
| PUT    | `/api/borrow/:id`        | Update borrow record   |
| PUT    | `/api/borrow/:id/return` | Process return         |
| DELETE | `/api/borrow/:id`        | Delete record          |

### Reports

| Method | Endpoint                  | Description            |
| ------ | ------------------------- | ---------------------- |
| GET    | `/api/reports/inventory`  | Inventory report       |
| GET    | `/api/reports/borrow`     | Borrow activity report |
| GET    | `/api/reports/department` | Department report      |
| GET    | `/api/reports/activity`   | Activity logs          |

## 🔒 Role Permissions

| Feature               | Admin | Manager | User |
| --------------------- | ----- | ------- | ---- |
| View Inventory        | ✅    | ✅      | ✅   |
| Add/Edit Inventory    | ✅    | ✅      | ❌   |
| Delete Inventory      | ✅    | ❌      | ❌   |
| Manage Borrow Records | ✅    | ✅      | ❌   |
| View Reports          | ✅    | ✅      | ✅   |
| User Management       | ✅    | ❌      | ❌   |

## 🔧 Available Scripts

### Backend

```bash
npm start         # Start production server
npm run dev       # Start development server with nodemon
npm run seed      # Run database seeders
```

### Frontend

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

## 📊 Database Schema

### Users Table

- id, username, email, password, fullName, role, department, isActive, lastLogin

### Inventory Table

- id, fullName, department, pcName, windowsVersion, msOffice, applicationsSystem
- pcType, status, userStatus, remarks, serialNumber, purchaseDate, warrantyExpiry
- assignedTo, assignedDate

### BorrowRecords Table

- id, inventoryId, borrowerName, borrowerEmail, borrowerDepartment
- borrowDate, expectedReturnDate, actualReturnDate, status, notes, borrowedBy

### Departments Table

- id, name, description, manager

## 📧 Email Notifications

The system sends email notifications for:

- Borrow confirmation
- Return reminders (upcoming due dates)
- Return confirmation

Configure SMTP settings in `.env` to enable email functionality.

## 🐛 Troubleshooting

### Database Connection Issues

- Verify MySQL is running
- Check database credentials in `.env`
- Ensure database exists

### CORS Errors

- Verify `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check that both servers are running

### Authentication Issues

- Clear browser localStorage
- Verify JWT_SECRET is set
- Check token expiration

## 📝 License

MIT License - Feel free to use this project for personal or commercial purposes.

## 👥 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**Developed for FFCC IT Inventory Management**
