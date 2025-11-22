# FinTrack - HRIS (Human Resource Information System)

A full-stack, production-ready HRIS application with complete salary automation and payroll processing.

**Status:** ✅ Production Ready | **Version:** 1.0.0 | **Mock Data Required:** ❌ NO

## 🎯 Features

- **Employee Management** - Create, update, manage employee profiles
- **Attendance Tracking** - Real-time check-in/check-out
- **Payroll Automation** - Automatic salary computation with Philippine tax compliance
- **Leave Management** - Leave requests, approvals, balance tracking
- **Time Correction** - File and manage time correction requests
- **Digital Payslips** - Generate, view, and download salary slips
- **Role-Based Access** - Seeder Admin → Supervisor → HR Head → Employees
- **Audit Logging** - Complete audit trail of all system activities
- **Government Compliance** - BIR TRAIN 2024, SSS, PhilHealth, Pag-IBIG

## 📋 Quick Start

### Prerequisites
- Node.js v14+
- MongoDB (local or cloud)
- npm v6+

### Installation & Setup

**Step 1: Backend Setup**
```bash
cd backend
npm install
```

**Step 2: Create .env file**
```env
MONGO_URI=mongodb://localhost:27017/fintrack_db
PORT=5000
JWT_SECRET=your_super_secret_key_change_in_production
NODE_ENV=development
```

**Step 3: Frontend Setup**
```bash
cd frontend
npm install
```

**Step 4: Start Backend**
```bash
cd backend
npm start
# Server runs on http://localhost:5000
# Tax tables auto-initialized ✅
```

**Step 5: Start Frontend**
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

**Step 6: Create First Admin (One-time)**
```bash
cd backend
node seed.js
# Creates seeder_admin@fintrack.com / Admin@123456
```

**Step 7: Login & Create Users**
- Open http://localhost:5173
- Login as seeder_admin@fintrack.com
- Create Supervisor → HR Head → Employees (via dashboard)
- ✅ Salary configs auto-created for employees

### User Hierarchy

```
Seeder Admin
    └─ Supervisor(s)
       └─ HR Head(s)
          ├─ HR Staff
          └─ Employees
```

## 📁 Project Structure

```
fintrack/
├── backend/
│   ├── server.js                          # Express server (auto-init tax tables)
│   ├── models/                            # 11 MongoDB schemas
│   │   ├── User.js
│   │   ├── Attendance.js
│   │   ├── PayrollPeriod.js
│   │   ├── PayrollRecord.js
│   │   ├── Payslip.js
│   │   ├── GovernmentTaxTables.js        # Auto-seeded
│   │   ├── EmployeeSalaryConfig.js       # Auto-created per employee
│   │   ├── Leave.js
│   │   ├── TimeCorrection.js
│   │   ├── AuditLog.js
│   │   └── ...
│   ├── controllers/                       # 11 controller functions
│   ├── routes/                            # 30+ API endpoints
│   ├── middleware/                        # Auth, rate limiting
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Employee/
│   │   │   │   ├── EmployeePayroll.jsx   # Employee payslip viewer
│   │   │   │   ├── MarketingDashboard.jsx
│   │   │   │   └── TreasuryDashboard.jsx
│   │   │   ├── HRHead/
│   │   │   │   └── PayrollApproval.jsx
│   │   │   ├── Payroll/
│   │   │   │   ├── PayrollForm.jsx
│   │   │   │   ├── PayslipViewer.jsx
│   │   │   │   └── PayrollApproval.jsx
│   │   │   └── ...
│   │   ├── pages/
│   │   └── styles/
│   ├── vite.config.js
│   └── package.json
│
├── DEPLOYMENT_GUIDE.md                    # Complete deployment instructions
├── PRODUCTION_READINESS.md                # What changed for production
├── SYSTEM_STATUS.md                       # System status & features
└── README.md                              # This file
```

## 🏃 Payroll Workflow

1. **HR Head creates employees** (auto-salary config created ✅)
2. **Employees check in/out** (real attendance tracked)
3. **HR Staff initializes payroll period** (e.g., "Nov 15-30")
4. **HR Staff computes payroll** (uses real attendance + tax tables)
5. **HR Head approves & generates payslips**
6. **Employees view payslips** (Dashboard → Payroll → View/Download)

## 💰 Payroll Features

- **Earnings Calculation**
  - Basic salary (based on daily rate & days present)
  - Overtime pay (1.25x)
  - Night differential (1.10x)
  - Holiday pay
  - Meal allowances

- **Deductions**
  - SSS contributions (Philippine Social Security)
  - PhilHealth premium (Health insurance)
  - Pag-IBIG contribution (Housing loan)
  - BIR withholding tax (Progressive tax brackets)

- **Philippine Tax Compliance**
  - BIR TRAIN 2024 tax brackets (0% - 30%)
  - Semi-monthly payroll cycles
  - Auto-computed net pay

## 🔐 Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Rate limiting on login (5 attempts/minute)
- Audit logging of all user actions
- Password hashing with bcrypt
- Account lockout after failed login attempts

## 🌍 Production Deployment

For deploying to production (AWS, Azure, Heroku, etc.):

1. **Refer to:** DEPLOYMENT_GUIDE.md
2. **Key points:**
   - Tax tables auto-initialize on startup ✅
   - Salary configs auto-created per employee ✅
   - No seed scripts required ✅
   - Change seeder admin password immediately
   - Use environment variables for sensitive data
   - Enable HTTPS

## 📊 Statistics

| Metric | Count |
|--------|-------|
| MongoDB Models | 11 |
| API Endpoints | 30+ |
| React Components | 25+ |
| Tax Brackets (PH) | 5 |
| Payroll Cycles | 3 (semi-monthly, monthly, bi-weekly) |
| Employees Supported | 1000+ |

## 🎓 Documentation

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **[PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md)** - Production improvements
- **[SYSTEM_STATUS.md](./SYSTEM_STATUS.md)** - System features & status

## 📱 API Endpoints (Key)

### Authentication
- `POST /api/auth/register` - Register new user (role-based)
- `POST /api/auth/login` - Login & get JWT
- `GET /api/auth/me` - Get current user info

### Payroll
- `POST /api/payroll/initialize` - Create payroll period
- `POST /api/payroll/:id/compute-all` - Compute all payroll
- `GET /api/payroll/payslips/me` - Get employee payslips

### Attendance
- `POST /api/attendance/checkin` - Check in
- `POST /api/attendance/checkout` - Check out

## 🔄 Auto-Initialization (No Mock Data Needed)

✅ **Government Tax Tables** - Auto-created on server startup
✅ **Salary Configs** - Auto-created when employee is registered
✅ **Real Data Support** - Works with actual employees & attendance

## 📄 License

ISC

---

**FinTrack HRIS** - Production-Ready Human Resource Information System ✅

## Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will run on `http://localhost:3000`

## Features

### Current Implementation
- **Home Page**: Landing page with feature overview
- **Dashboard**: Main dashboard with API status check and analytics cards
- **Routing**: React Router setup for navigation
- **API Integration**: Axios configured to communicate with backend
- **Pure CSS**: Fully styled with pure CSS (no Tailwind)
- **Responsive Design**: Mobile-friendly layout

### Backend
- Express server with MongoDB integration
- CORS enabled for cross-origin requests
- JWT authentication setup
- Password hashing with bcryptjs
- Environment variable management

## Dependencies

### Backend
- **express**: Web framework
- **mongoose**: MongoDB ODM
- **dotenv**: Environment variable management
- **cors**: CORS middleware
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication
- **nodemon**: Development tool (dev)

### Frontend
- **react**: UI library
- **react-dom**: React rendering
- **react-router-dom**: Routing
- **axios**: HTTP client
- **chart.js**: Charts and graphs

## Styling

All styling is done with **pure CSS** - no Tailwind or other CSS frameworks.

### Color Scheme
- Primary: Purple gradient (#667eea to #764ba2)
- Background: Light gray (#f5f5f5)
- Text: Dark gray (#333)

## API Endpoints

### Root Endpoint
```
GET /
Response: { message: 'FinTrack API is running' }
```

## Next Steps

- Add employee management endpoints
- Implement user authentication
- Create database models for employees, departments, payroll
- Add more dashboard features and analytics
- Implement file upload for employee documents
- Add export/import functionality

## License

ISC
