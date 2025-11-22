# PAYROLL AUTOMATION MODULE - Complete Implementation Guide

## 📋 Overview

This is a **complete salary automation and payroll processing system** for FinTrack HRIS. The system automates all aspects of Philippine payroll including:

- ✅ Automated salary computation
- ✅ Attendance-based deductions (lates, undertime, absences)
- ✅ Government contributions (SSS, PhilHealth, Pag-IBIG)
- ✅ BIR TRAIN Law withholding tax calculation
- ✅ Premium pay calculation (overtime, night differential, holiday pay)
- ✅ Digital payslips with PDF export
- ✅ Role-based approval workflow
- ✅ Complete audit trail and locked records

---

## 🏗️ Architecture

### Backend Structure

```
backend/
├── models/
│   ├── GovernmentTaxTables.js     # SSS, PhilHealth, Pag-IBIG, Tax tables
│   ├── EmployeeSalaryConfig.js    # Employee salary settings & allowances
│   ├── PayrollPeriod.js           # Payroll cycle (monthly, semi-monthly)
│   ├── PayrollRecord.js           # Core salary computation document
│   └── Payslip.js                 # Generated payslips for employees
├── controllers/
│   └── payrollController.js       # All payroll business logic (11 functions)
├── routes/
│   └── payroll.js                 # API endpoints with RBAC
└── server.js                      # Routes registered
```

### Frontend Structure

```
frontend/src/
├── components/
│   └── Payroll/
│       ├── PayrollForm.jsx         # HR Staff: Initialize & Compute
│       ├── PayrollApproval.jsx     # HR Head: Approve & Lock
│       ├── PayslipViewer.jsx       # Employee: View & Download
│       ├── PayrollForm.css
│       ├── PayrollApproval.css
│       └── PayslipViewer.css
└── pages/
    └── [Dashboards to be integrated]
```

---

## 📊 Data Models

### 1. GovernmentTaxTables
Stores all Philippine government contribution tables and withholding tax brackets (BIR TRAIN Law).

**Key Fields:**
```javascript
{
  sssContributions: [{salaryRange, monthlyContribution}],
  philhealthContributions: [{salaryRange, monthlyContribution}],
  pagibigContributions: [{salaryRange, monthlyContribution}],
  withholdinTaxBrackets: [{incomeRange, taxRate, fixedTaxAmount}],
  effectiveDate: Date,
  version: Number
}
```

### 2. EmployeeSalaryConfig
Configuration for each employee's salary, allowances, and deductions.

**Key Fields:**
```javascript
{
  employee: ObjectId (ref: User),
  salaryType: 'daily_rate' | 'monthly_rate',
  dailyRate: Number,
  monthlyRate: Number,
  hourlyRate: Number (computed),
  allowances: [{name, amount, isRecurring}],
  deductions: [{name, amount, isRecurring, startDate, endDate}],
  overtimeRate: 1.25,
  nightDifferentialRate: 1.10,
  specialHolidayRate: 1.30,
  regularHolidayRate: 2.00
}
```

### 3. PayrollPeriod
Represents a payroll cycle (monthly, semi-monthly, bi-weekly).

**Status Flow:**
```
draft → pending_computation → computation_completed → 
pending_approval → approved → locked → payroll_run
```

**Key Fields:**
```javascript
{
  periodName: String,
  payrollCycle: 'monthly' | 'semi_monthly' | 'bi_weekly',
  startDate, endDate: Date,
  attendanceCutoffStart, attendanceCutoffEnd: Date,
  specialDays: [{date, dayType, description}],
  status: String,
  totalEmployeesInPayroll: Number,
  totalGrossPay, totalDeductions, totalNetPay: Number,
  computedBy: ObjectId,
  approvedBy: ObjectId,
  lockedBy: ObjectId
}
```

### 4. PayrollRecord
Core salary computation document. Contains all earnings and deductions for one employee in one payroll period.

**Key Sections:**

#### Attendance Data
```javascript
attendance: {
  workDaysInPeriod, presentDays, absenceDays,
  tardinessMins, undertimeMins,
  overtimeHours, nightDifferentialHours
}
```

#### Earnings
```javascript
earnings: {
  basicSalary,
  overtimePay: OTHours × HourlyRate × 1.25,
  nightDifferentialPay: NDHours × HourlyRate × 1.10,
  holidayPay,
  paidLeavePay,
  allowances,
  bonusesReimbursements,
  grossPay
}
```

#### Deductions
```javascript
deductions: {
  lateDeduction: (tardinessMins / 60) × HourlyRate,
  undertimeDeduction: (undertimeMins / 60) × HourlyRate,
  absenceDeduction: DailyRate × AbsentDays,
  sssContribution,
  philhealthContribution,
  pagibigContribution,
  withholdinTax,
  loanDeductions,
  otherDeductions,
  totalDeductions
}
```

### 5. Payslip
Generated digital payslip (snapshot of final payroll record).

**Key Fields:**
```javascript
{
  payrollRecord: ObjectId,
  employee: ObjectId,
  employeeDetails: {...},
  periodInfo: {...},
  earnings: {...},
  deductions: {...},
  netPay: Number,
  status: 'draft' | 'generated' | 'viewed' | 'downloaded',
  viewedAt, downloadedAt: Date
}
```

---

## 💰 Salary Computation Logic

### Flow: Attendance → Salary → Deductions → Net Pay

#### Step 1: Get Attendance Data
- Query `Attendance` collection for payroll period
- Count work days (Mon-Sat, exclude Sunday)
- Calculate: present days, tardiness, undertime, OT, night differential

#### Step 2: Calculate Earnings

**Basic Salary:**
```
BasicSalary = DailyRate × PresentDays
(or) = MonthlyRate ÷ 26 × PresentDays
```

**Overtime Pay:**
```
OvertimePay = OvertimeHours × HourlyRate × 1.25
```

**Night Differential (10 PM - 6 AM):**
```
ND Pay = NDHours × HourlyRate × 1.10
```

**Holiday Pay:**
```
SpecialHolidayPay (worked) = Hours × HourlyRate × 1.30
RegularHolidayPay (worked) = Hours × HourlyRate × 2.00
```

**Paid Leave:**
```
PaidLeavePay = PaidLeaveDays × DailyRate
```

**Gross Pay:**
```
GrossPay = BasicSalary + OT + ND + HolidayPay + PaidLeavePay + Allowances + Bonuses
```

#### Step 3: Calculate Deductions

**Penalty Deductions:**
```
Tardiness = (TardyMinutes ÷ 60) × HourlyRate
Undertime = (UTMinutes ÷ 60) × HourlyRate
Absences = DailyRate × AbsentDays
```

**Government Contributions** (lookup from tables):
- SSS: Based on salary bracket (employee share only)
- PhilHealth: 2.75% of salary ÷ 2 (employee share)
- Pag-IBIG: 1-2% based on salary level

**Withholding Tax (BIR TRAIN Law PY 2024):**
```
Taxable Income = GrossPay - (SSS + PhilHealth + Pag-IBIG)

Tax Brackets:
- 0 - 250,000: 0%
- 250,001 - 400,000: 15% (less ₱37,500)
- 400,001 - 800,000: 20% (less ₱97,500)
- 800,001 - 2,000,000: 25% (less ₱297,500)
- 2,000,001+: 30% (less ₱797,500)

Formula: Tax = (TaxableIncome - BracketMin) × Rate + FixedDeduction
```

**Total Deductions:**
```
TotalDeductions = Tardiness + Undertime + Absences + 
                  SSS + PhilHealth + Pag-IBIG + Tax + 
                  LoanDeductions + OtherDeductions
```

#### Step 4: Calculate Net Pay

```
NetPay = GrossPay - TotalDeductions
```

---

## 🔌 API Endpoints

### INITIALIZE PAYROLL (HR Staff)
```
POST /api/payroll/initialize
Body: {
  periodName: "January 2024",
  payrollCycle: "monthly",
  startDate: "2024-01-01",
  endDate: "2024-01-31",
  attendanceCutoffStart: "2024-01-01",
  attendanceCutoffEnd: "2024-01-31",
  specialDays: [{date, dayType, description}]
}
Response: Creates PayrollPeriod & initializes all employee records
```

### COMPUTE PAYROLL (HR Staff)
```
PUT /api/payroll/:payrollPeriodId/:employeeId/compute
Body: {
  computationNotes: "Verified attendance data"
}
Response: PayrollRecord with all calculations
```

### GET PAYROLL RECORDS (HR Staff/Head)
```
GET /api/payroll/:payrollPeriodId?status=computed&search=name
Response: Array of PayrollRecords for period
```

### APPROVE PAYROLL (HR Head)
```
PUT /api/payroll/:payrollRecordId/approve
Body: { approvalNotes: "Approved" }
Response: Updated PayrollRecord with status = 'approved'
```

### REJECT PAYROLL (HR Head)
```
PUT /api/payroll/:payrollRecordId/reject
Body: { rejectionReason: "Needs adjustment" }
Response: Sent back to draft for recomputation
```

### LOCK PAYROLL PERIOD (HR Head)
```
PUT /api/payroll/:payrollPeriodId/lock
Response: All records locked, no more edits allowed
```

### GENERATE PAYSLIPS (HR Head)
```
POST /api/payroll/:payrollPeriodId/generate-payslips
Response: Creates Payslip records for all approved employees
```

### GET EMPLOYEE PAYSLIPS (Employee)
```
GET /api/payroll/payslips/me
Response: Array of employee's payslips (sorted by date)
```

### VIEW PAYSLIP (Employee)
```
GET /api/payroll/payslips/:payslipId
Response: Payslip detail (marks as viewed)
```

### EXPORT PAYSLIP PDF (Employee)
```
GET /api/payroll/payslips/:payslipId/pdf
Response: Payslip data for PDF generation
```

### GET PAYROLL SUMMARY (HR Staff/Head)
```
GET /api/payroll/:payrollPeriodId/summary
Response: {
  totalEmployees,
  totalGrossPay,
  totalDeductions,
  totalNetPay,
  totalSSS,
  totalPhilHealth,
  totalPagIBIG,
  totalTax,
  recordsByStatus
}
```

---

## 🎯 Role-Based Access Control

| Role | Initialize | Compute | Approve | Lock | Download | View |
|------|-----------|---------|---------|------|----------|------|
| HR Staff | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| HR Head | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Employee | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ (own) |

---

## 🔄 Workflow

### HR Staff
1. **Initialize** → Creates PayrollPeriod
2. **Compute** → Runs salary calculations for all employees
3. **Review** → View computed records before HR Head approval

### HR Head
1. **Review** → View all computed records
2. **Approve/Reject** → Approve individual records or send back
3. **Lock** → Finalize period (no more edits)
4. **Generate Payslips** → Create digital payslips

### Employee
1. **View Payslips** → See payslip history
2. **View Details** → Breakdown of earnings and deductions
3. **Download PDF** → Generate printable payslip

---

## 📱 Frontend Components

### PayrollForm (HR Staff)
- **Tab 1: Initialize Payroll**
  - Form to create new payroll period
  - Recent periods list with status
  
- **Tab 2: Compute Payroll**
  - Select period
  - View all employees
  - Compute button for each employee
  - Real-time status updates

### PayrollApproval (HR Head)
- **Tab 1: Approve Records**
  - Table of computed records
  - Review button opens detail modal
  - Approve/Reject buttons
  - Earnings/Deductions breakdown
  - Lock Period button
  - Generate Payslips button

- **Tab 2: Summary**
  - Total employees, gross pay, deductions, net pay
  - Government contributions breakdown
  - Records by status chart

### PayslipViewer (Employee)
- **Payslip List** (default view)
  - Grid of all payslips
  - Period, net pay, status display
  - View Details & Download buttons

- **Payslip Detail** (on click)
  - Full earnings breakdown
  - Full deductions breakdown
  - Government contributions detail
  - Download PDF button
  - Printable format

---

## 🚀 Quick Start

### 1. Backend Setup
```bash
# Models already created in /backend/models/
# - GovernmentTaxTables.js
# - EmployeeSalaryConfig.js
# - PayrollPeriod.js
# - PayrollRecord.js
# - Payslip.js

# Controller created in /backend/controllers/
# - payrollController.js

# Routes created in /backend/routes/
# - payroll.js (already registered in server.js)
```

### 2. Frontend Setup
```bash
# Components already created in /frontend/src/components/Payroll/
# - PayrollForm.jsx + PayrollForm.css
# - PayrollApproval.jsx + PayrollApproval.css
# - PayslipViewer.jsx + PayslipViewer.css
```

### 3. Dashboard Integration (NEXT STEPS)
```javascript
// In /frontend/src/pages/HRStaff/HRStaffDashboard.jsx
import PayrollForm from '../../components/Payroll/PayrollForm';

// Add to nav menu & renderContent:
case 'payroll':
  return <PayrollForm />;

// In /frontend/src/pages/HRHead/HRHeadDashboard.jsx
import PayrollApproval from '../../components/Payroll/PayrollApproval';
case 'payroll':
  return <PayrollApproval />;

// In /frontend/src/pages/Employee/Dashboard.jsx
import PayslipViewer from '../../components/Payroll/PayslipViewer';
case 'payslips':
  return <PayslipViewer />;
```

### 4. Database Initialization
```javascript
// Create government tax tables (one-time setup)
// POST /api/payroll/setup-tax-tables

// Create salary config for employees
// POST /api/employees/:id/salary-config
```

---

## 🧮 Calculation Examples

### Example 1: Regular Employee
```
Daily Rate: ₱1,000
Period: Jan 1-31, 2024 (22 working days Mon-Sat)

Attendance:
- Present: 21 days
- Absent: 1 day
- Tardiness: 120 minutes (2 hours)
- Overtime: 10 hours

Hourly Rate = ₱1,000 ÷ 8 = ₱125/hour

EARNINGS:
- Basic Salary = ₱1,000 × 21 = ₱21,000
- Overtime = 10 × ₱125 × 1.25 = ₱1,562.50
- Allowances = ₱1,000
- Gross Pay = ₱23,562.50

DEDUCTIONS:
- Tardiness = (120 ÷ 60) × ₱125 = ₱250
- Absence = ₱1,000 × 1 = ₱1,000
- SSS (lookup: ₱1,236.50)
- PhilHealth (lookup: ₱336.50)
- Pag-IBIG (lookup: ₱250)
- Tax (lookup: ₱1,200)
- Total = ₱4,273

NET PAY = ₱23,562.50 - ₱4,273 = ₱19,289.50
```

---

## 🔒 Security & Audit

- ✅ **Locked Records**: Cannot edit after approval
- ✅ **Audit Trail**: All changes logged with user & timestamp
- ✅ **RBAC**: Role-based access control on all endpoints
- ✅ **Immutable Payslips**: Cannot modify generated payslips
- ✅ **Computed Fields**: All calculations server-side validated

---

## 📝 Philippine Tax Reference (PY 2024)

### Working Days Policy
- **Monday - Saturday** (exclude Sunday)
- 26 working days per month average

### Government Contributions
- **SSS**: Based on salary bracket (employee share)
- **PhilHealth**: 2.75% of salary (employee = employer share)
- **Pag-IBIG**: 1-2% based on salary, max ₱200

### Premium Pay Rates
- **Overtime**: 1.25x of hourly rate
- **Night Differential**: 1.10x (10 PM - 6 AM)
- **Special Holiday (work)**: 1.30x
- **Regular Holiday (work)**: 2.00x

### BIR TRAIN LAW (PY 2024)
12% Effective Tax Rate for most employees on ₱500K+ gross income

---

## ✅ Testing Checklist

Before production deployment:

- [ ] Initialize payroll period
- [ ] Compute payroll for test employee
- [ ] Verify attendance data pulls correctly
- [ ] Check gross pay calculation
- [ ] Verify government contributions lookup
- [ ] Verify withholding tax calculation
- [ ] Approve payroll record
- [ ] Lock payroll period
- [ ] Generate payslips
- [ ] View payslip as employee
- [ ] Download PDF
- [ ] Verify all calculations match manual verification

---

## 📚 Files Created

### Backend (5 Models + 1 Controller + 1 Route)
- `/backend/models/GovernmentTaxTables.js`
- `/backend/models/EmployeeSalaryConfig.js`
- `/backend/models/PayrollPeriod.js`
- `/backend/models/PayrollRecord.js`
- `/backend/models/Payslip.js`
- `/backend/controllers/payrollController.js` (11 functions, ~650 lines)
- `/backend/routes/payroll.js` (All RBAC endpoints)

### Frontend (3 Components + 3 CSS Files)
- `/frontend/src/components/Payroll/PayrollForm.jsx`
- `/frontend/src/components/Payroll/PayrollApproval.jsx`
- `/frontend/src/components/Payroll/PayslipViewer.jsx`
- `/frontend/src/components/Payroll/PayrollForm.css`
- `/frontend/src/components/Payroll/PayrollApproval.css`
- `/frontend/src/components/Payroll/PayslipViewer.css`

### Configuration
- Integrated payroll routes in `/backend/server.js`

---

## 🎓 Next Steps

1. **Dashboard Integration** - Add payroll components to all dashboards
2. **Testing** - End-to-end workflow testing
3. **Government Tax Tables Seeding** - Populate tax tables with actual PH rates
4. **Employee Salary Config** - Set up salary configuration for each employee
5. **Production Deployment** - Deploy with proper monitoring

---

**Core Principle**: This system automates payroll to ensure accuracy, compliance, and transparency. All calculations follow Philippine regulations and BIR requirements.
