# FinTrack HRIS - Deployment Guide

## Overview

FinTrack is now production-ready without relying on seed/mock data. The system automatically initializes critical data on first startup and creates necessary configurations when users are added.

## Production Deployment Setup

### Prerequisites

- Node.js v14+ 
- MongoDB (local or cloud)
- npm v6+

### 1. Environment Setup

Create `.env` file in backend folder:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/fintrack_db
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=production
```

For production deployment (e.g., AWS, Azure, Heroku):
- Use a cloud MongoDB service (MongoDB Atlas recommended)
- Use environment variables for sensitive data
- Set `NODE_ENV=production`

### 2. Installation

```bash
# Backend setup
cd backend
npm install

# Frontend setup
cd ../frontend
npm install
```

### 3. Start the Application

```bash
# Terminal 1: Start backend server
cd backend
npm start

# Terminal 2: Start frontend development server (or build for production)
cd frontend
npm run dev
# OR for production build:
npm run build
```

### 4. Initial Setup Flow

**The system works as follows without mock data:**

#### Step 1: Create Seeder Admin
```bash
# Run this ONCE (creates the first admin user)
cd backend
node seed.js
```

Credentials created:
- Email: `seeder_admin@fintrack.com`
- Password: `Admin@123456` (⚠️ Change immediately in production)

#### Step 2: Login as Seeder Admin
- Navigate to http://localhost:5173 (frontend)
- Login with seeder admin credentials
- Dashboard initializes government tax tables automatically ✅

#### Step 3: Create Supervisor
- Seeder Admin creates a Supervisor via dashboard
- Supervisor: (any person managing HR)

#### Step 4: Supervisor Creates HR Head
- Supervisor logs in
- Creates HR Head user via dashboard

#### Step 5: HR Head Creates Employees
- HR Head logs in
- Creates HR Staff and Employees via "Employee Management"
- **Automatically:** Each employee gets a default salary config (₱30,000/month daily rate)

#### Step 6: Employees Start Working
- Employees can check in/out (Attendance)
- Start filing leave requests
- Supervisors approve time corrections

#### Step 7: HR Staff Computes Payroll
- Go to Payroll → Initialize & Compute
- Create payroll period (e.g., "Nov 2025 2nd Half")
- System automatically:
  - ✅ Queries government tax tables
  - ✅ Pulls attendance records
  - ✅ Calculates earnings & deductions
  - ✅ Computes net pay

#### Step 8: HR Head Approves & Generates Payslips
- HR Head approves payroll in PayrollApproval tab
- Locks the period
- Generates payslips
- Employees see payslips in their dashboard under "💰 Payroll"

---

## Key Production Features

### ✅ Auto-Initialization

**On Server Startup:**
- Government tax tables are created automatically (if not exists)
- Includes all Philippine tax brackets and contributions

**On Employee Creation:**
- Default salary config automatically created
- Daily rate: ₱1,363.64 (~₱30,000/month)
- Meal allowance: ₱200/month
- Contribution rates configured

### ✅ No Mock Data Required

- System works with real employees created through UI
- Real attendance data from daily check-in/check-out
- Real payroll computation based on actual hours worked

### ✅ Production-Grade Error Handling

If something's missing:
- Clear error messages (not "please seed data")
- User-friendly responses
- Admin-friendly logs for troubleshooting

---

## Database Schema Overview

The system uses these MongoDB collections:

```
users              - All employees, HR staff, admins
salaryConfigs      - Employee salary settings
payrollPeriods     - Monthly/semi-monthly payroll cycles
payrollRecords     - Individual employee computations
payslips           - Generated salary slips
attendance         - Daily check-in/check-out records
leaves             - Leave requests and approvals
timeCorrections    - Time correction requests
governmentTaxTables - PH tax brackets & contributions (auto-created)
auditLogs          - System audit trail
```

---

## Payroll Calculation Example

**Input:**
- Employee: Joshua (Marketing)
- Daily rate: ₱1,363.64
- Days present: 13 (Nov 15-30, 2025)
- Salary config: Meal allowance ₱200

**Processing:**
1. Basic Salary = 13 days × ₱1,363.64 = ₱17,727.32
2. Allowances = ₱200
3. Gross Pay = ₱17,927.32

4. Deductions:
   - SSS: ₱555
   - PhilHealth: ₱200
   - Pag-IBIG: ₱200
   - Withholding Tax: ₱12.50 (BIR TRAIN bracket)
   - Total: ₱967.50

5. Net Pay = ₱17,927.32 - ₱967.50 = **₱16,959.82**

**Philippine Compliance:**
- ✅ BIR TRAIN 2024 tax brackets
- ✅ SSS contribution rates
- ✅ PhilHealth premium
- ✅ Pag-IBIG contribution
- ✅ Semi-monthly payroll cycles support

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] MongoDB connection verified
- [ ] Backend started (npm start)
- [ ] Frontend built/started
- [ ] Seeder admin created (node seed.js)
- [ ] Login with seeder_admin@fintrack.com
- [ ] First supervisor created
- [ ] First HR Head created
- [ ] First employee created (check salary config auto-created)
- [ ] Attendance record created (check-in/out)
- [ ] Payroll period initialized
- [ ] Payroll computed successfully
- [ ] Employee can view payslip

---

## Troubleshooting

### "Tax tables not configured"
- **Cause:** Server not fully connected to DB yet
- **Fix:** Wait 5 seconds and retry; check MongoDB connection

### Employee won't create
- **Cause:** Missing required fields or role hierarchy issue
- **Fix:** Ensure logged-in user has permission (HR Head can create employees)

### Payroll compute fails
- **Cause:** Employee has no salary config
- **Fix:** Check if salary config was auto-created; manually create if needed

### No payslips appearing
- **Cause:** Payroll period not locked and payslips not generated
- **Fix:** HR Head must lock period then generate payslips

---

## Support & Maintenance

### Regular Maintenance
- Monitor MongoDB disk space
- Review audit logs monthly
- Backup database weekly

### Password Management
- Change seeder admin password immediately in production
- Implement password expiration policy
- Use strong passwords (min 8 chars, special chars)

### Updates
- Keep Node.js and npm updated
- Review security advisories regularly
- Test updates in staging environment first

---

## Contact

For issues or questions, refer to project documentation or contact your system administrator.

**Last Updated:** November 2025
**Version:** 1.0.0 (Production Ready)
