# FinTrack HRIS - System Architecture Design

## System Architecture Overview

### Step 1: Client Layer (Frontend)

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
│                    (React.js + Vite)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Login     │  │  Dashboard  │  │  Payroll    │        │
│  │    Page     │  │    Page     │  │    Page     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Attendance  │  │   Leave     │  │  Profile    │        │
│  │    Page     │  │    Page     │  │    Page     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌──────────────────────────────────────────────────┐     │
│  │         Redux State Management                   │     │
│  │  ├─ User State (role, permissions)               │     │
│  │  ├─ Auth State (token, verified)                 │     │
│  │  ├─ Payroll State (records, periods)             │     │
│  │  └─ UI State (loading, errors)                   │     │
│  └──────────────────────────────────────────────────┘     │
│                                                             │
│  ┌──────────────────────────────────────────────────┐     │
│  │      Local Storage                               │     │
│  │  ├─ JWT Token (24h expiry)                       │     │
│  │  ├─ User Info (name, role, dept)                 │     │
│  │  └─ Active Tab (for persistence)                 │     │
│  └──────────────────────────────────────────────────┘     │
│                                                             │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP/HTTPS
                     │ API Calls
                     ▼
```

---

### Step 2: API Gateway & Middleware Layer (Express.js)

```
┌─────────────────────────────────────────────────────────────┐
│            API GATEWAY & MIDDLEWARE LAYER                   │
│                   (Express.js Server)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  PORT: 5000                                                │
│                                                             │
│  ┌──────────────────────────────────────────────────┐     │
│  │       CORS Middleware                            │     │
│  │  Allow Origins:                                  │     │
│  │  ├─ http://localhost:3000                        │     │
│  │  ├─ http://localhost:5173                        │     │
│  │  └─ https://production-url.com                   │     │
│  └──────────────────────────────────────────────────┘     │
│                           │                                 │
│                           ▼                                 │
│  ┌──────────────────────────────────────────────────┐     │
│  │    Request Logging Middleware                    │     │
│  │  Log: Method, URL, Status, Response Time         │     │
│  └──────────────────────────────────────────────────┘     │
│                           │                                 │
│                           ▼                                 │
│  ┌──────────────────────────────────────────────────┐     │
│  │    Body Parser / JSON Middleware                 │     │
│  │  Parse incoming JSON requests                    │     │
│  └──────────────────────────────────────────────────┘     │
│                           │                                 │
│                           ▼                                 │
│  ┌──────────────────────────────────────────────────┐     │
│  │    Authentication Middleware                     │     │
│  │  ├─ Extract JWT from headers                     │     │
│  │  ├─ Verify JWT signature                         │     │
│  │  ├─ Check token expiry                           │     │
│  │  └─ Attach user info to request                  │     │
│  └──────────────────────────────────────────────────┘     │
│                           │                                 │
│                           ▼                                 │
│  ┌──────────────────────────────────────────────────┐     │
│  │    Authorization Middleware                      │     │
│  │  ├─ Check user role permissions                  │     │
│  │  ├─ Check account disabled status                │     │
│  │  └─ Verify email verified flag                   │     │
│  └──────────────────────────────────────────────────┘     │
│                           │                                 │
│                           ▼                                 │
│  ┌──────────────────────────────────────────────────┐     │
│  │    Route Dispatcher                              │     │
│  │  ├─ /auth/* → authRoutes                         │     │
│  │  ├─ /api/payroll/* → payrollRoutes               │     │
│  │  ├─ /api/attendance/* → attendanceRoutes         │     │
│  │  ├─ /api/leave/* → leaveRoutes                   │     │
│  │  └─ /api/timeCorrection/* → timeCorrectionRoutes│     │
│  └──────────────────────────────────────────────────┘     │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
```

---

### Step 3: Business Logic Layer (Controllers)

```
┌─────────────────────────────────────────────────────────────┐
│          BUSINESS LOGIC LAYER (Controllers)                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────┐      │
│  │       authController.js                         │      │
│  │  Functions:                                     │      │
│  │  ├─ login()                                     │      │
│  │  ├─ createUser()                                │      │
│  │  ├─ googleAuthCallback()                        │      │
│  │  └─ logout()                                    │      │
│  └─────────────────────────────────────────────────┘      │
│                           │                                 │
│  ┌─────────────────────────────────────────────────┐      │
│  │    payrollController.js                         │      │
│  │  Functions:                                     │      │
│  │  ├─ initializePayroll()                         │      │
│  │  ├─ computeAllPayroll()                         │      │
│  │  ├─ approvePayrollRecord()                      │      │
│  │  ├─ generatePayslips()                          │      │
│  │  └─ getMyPayslips()                             │      │
│  └─────────────────────────────────────────────────┘      │
│                           │                                 │
│  ┌─────────────────────────────────────────────────┐      │
│  │    attendanceController.js                      │      │
│  │  Functions:                                     │      │
│  │  ├─ checkIn()                                   │      │
│  │  ├─ checkOut()                                  │      │
│  │  ├─ getTodayAttendance()                        │      │
│  │  └─ getDepartmentAttendance()                   │      │
│  └─────────────────────────────────────────────────┘      │
│                           │                                 │
│  ┌─────────────────────────────────────────────────┐      │
│  │    leaveController.js                           │      │
│  │  Functions:                                     │      │
│  │  ├─ requestLeave()                              │      │
│  │  ├─ approveLeave()                              │      │
│  │  ├─ getMyLeave()                                │      │
│  │  └─ getLeaveBalance()                           │      │
│  └─────────────────────────────────────────────────┘      │
│                           │                                 │
│  ┌─────────────────────────────────────────────────┐      │
│  │    timeCorrectionController.js                  │      │
│  │  Functions:                                     │      │
│  │  ├─ requestCorrection()                         │      │
│  │  ├─ approveCorrection()                         │      │
│  │  └─ getCorrectionHistory()                      │      │
│  └─────────────────────────────────────────────────┘      │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
```

---

### Step 4: Utility & Service Layer

```
┌─────────────────────────────────────────────────────────────┐
│         UTILITY & SERVICE LAYER                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────┐                          │
│  │   passwordUtils.js           │                          │
│  │  ├─ validatePasswordStrength()│                         │
│  │  ├─ validateSeederAdmin...() │                         │
│  │  ├─ generateSecurePassword() │                         │
│  │  └─ isRecentPasswordChange() │                         │
│  └──────────────────────────────┘                          │
│           │                                                 │
│  ┌──────────────────────────────┐                          │
│  │   authUtils.js               │                          │
│  │  ├─ canCreateUser()          │                          │
│  │  ├─ canUseLocalLogin()       │                          │
│  │  ├─ isDemoSeed()             │                          │
│  │  └─ getCreationRules()       │                          │
│  └──────────────────────────────┘                          │
│           │                                                 │
│  ┌──────────────────────────────┐                          │
│  │   bcryptjs                   │                          │
│  │  ├─ Hash passwords           │                          │
│  │  ├─ Compare passwords        │                          │
│  │  └─ Salt rounds: 8           │                          │
│  └──────────────────────────────┘                          │
│           │                                                 │
│  ┌──────────────────────────────┐                          │
│  │   jsonwebtoken               │                          │
│  │  ├─ Generate tokens          │                          │
│  │  ├─ Verify tokens            │                          │
│  │  └─ Expiry: 24 hours         │                          │
│  └──────────────────────────────┘                          │
│           │                                                 │
└───────────┼──────────────────────────────────────────────────┘
            │
```

---

### Step 5: Data Access Layer (Models & Mongoose)

```
┌─────────────────────────────────────────────────────────────┐
│       DATA ACCESS LAYER (Mongoose Models)                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────┐  ┌────────────────────┐            │
│  │   User.js          │  │   Attendance.js    │            │
│  │  Fields:           │  │  Fields:           │            │
│  │  ├─ email          │  │  ├─ employee       │            │
│  │  ├─ password       │  │  ├─ date           │            │
│  │  ├─ role           │  │  ├─ checkInTime    │            │
│  │  ├─ department     │  │  ├─ checkOutTime   │            │
│  │  ├─ isEmailVerified│  │  ├─ status         │            │
│  │  ├─ isDisabled     │  │  └─ totalHours     │            │
│  │  └─ ... others     │  └────────────────────┘            │
│  └────────────────────┘                                     │
│           │                                                 │
│  ┌────────────────────┐  ┌────────────────────┐            │
│  │  PayrollRecord.js  │  │   Payslip.js       │            │
│  │  Fields:           │  │  Fields:           │            │
│  │  ├─ payrollPeriod  │  │  ├─ payrollRecord  │            │
│  │  ├─ employee       │  │  ├─ employee       │            │
│  │  ├─ earnings       │  │  ├─ earnings       │            │
│  │  ├─ deductions     │  │  ├─ deductions     │            │
│  │  ├─ netPay         │  │  ├─ netPay         │            │
│  │  └─ status         │  │  └─ status         │            │
│  └────────────────────┘  └────────────────────┘            │
│           │                                                 │
│  ┌────────────────────┐  ┌────────────────────┐            │
│  │   Leave.js         │  │  AuditLog.js       │            │
│  │  Fields:           │  │  Fields:           │            │
│  │  ├─ employee       │  │  ├─ user           │            │
│  │  ├─ type           │  │  ├─ action         │            │
│  │  ├─ startDate      │  │  ├─ details        │            │
│  │  ├─ endDate        │  │  ├─ targetUser     │            │
│  │  ├─ reason         │  │  ├─ timestamp      │            │
│  │  └─ status         │  │  └─ ipAddress      │            │
│  └────────────────────┘  └────────────────────┘            │
│           │                                                 │
└───────────┼──────────────────────────────────────────────────┘
            │
```

---

### Step 6: Database Layer (MongoDB)

```
┌─────────────────────────────────────────────────────────────┐
│              DATABASE LAYER (MongoDB Atlas)                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────┐        │
│  │     fintrack_db (Database Cluster)            │        │
│  ├───────────────────────────────────────────────┤        │
│  │                                               │        │
│  │  Collections:                                 │        │
│  │                                               │        │
│  │  ┌─────────────────────────────────────┐    │        │
│  │  │  users (Indexed)                    │    │        │
│  │  │  ├─ email: unique index             │    │        │
│  │  │  ├─ role: index                     │    │        │
│  │  │  ├─ department: index               │    │        │
│  │  │  └─ isDisabled: index               │    │        │
│  │  └─────────────────────────────────────┘    │        │
│  │                                               │        │
│  │  ┌─────────────────────────────────────┐    │        │
│  │  │  attendance (Indexed)               │    │        │
│  │  │  ├─ employee: index                 │    │        │
│  │  │  ├─ date: index                     │    │        │
│  │  │  ├─ department: index               │    │        │
│  │  │  └─ (employee, date): compound idx  │    │        │
│  │  └─────────────────────────────────────┘    │        │
│  │                                               │        │
│  │  ┌─────────────────────────────────────┐    │        │
│  │  │  payrollRecords (Indexed)           │    │        │
│  │  │  ├─ payrollPeriod: index            │    │        │
│  │  │  ├─ employee: index                 │    │        │
│  │  │  ├─ status: index                   │    │        │
│  │  │  └─ (period, employee): compound    │    │        │
│  │  └─────────────────────────────────────┘    │        │
│  │                                               │        │
│  │  ┌─────────────────────────────────────┐    │        │
│  │  │  payslips (Indexed)                 │    │        │
│  │  │  ├─ employee: index                 │    │        │
│  │  │  ├─ payrollPeriod: index            │    │        │
│  │  │  └─ (period, employee): compound    │    │        │
│  │  └─────────────────────────────────────┘    │        │
│  │                                               │        │
│  │  ┌─────────────────────────────────────┐    │        │
│  │  │  leaves (Indexed)                   │    │        │
│  │  │  ├─ employee: index                 │    │        │
│  │  │  ├─ status: index                   │    │        │
│  │  │  └─ startDate: index                │    │        │
│  │  └─────────────────────────────────────┘    │        │
│  │                                               │        │
│  │  ┌─────────────────────────────────────┐    │        │
│  │  │  auditLogs (Immutable)              │    │        │
│  │  │  ├─ user: index                     │    │        │
│  │  │  ├─ action: index                   │    │        │
│  │  │  ├─ timestamp: index                │    │        │
│  │  │  └─ (action, timestamp): compound   │    │        │
│  │  └─────────────────────────────────────┘    │        │
│  │                                               │        │
│  └───────────────────────────────────────────────┘        │
│                                                             │
│  Features:                                                 │
│  ├─ Replication: 3 nodes (high availability)              │
│  ├─ Backups: Daily automated backups                      │
│  ├─ Encryption: At-rest encryption enabled                │
│  ├─ Connection: Mongoose ORM with connection pooling      │
│  └─ TTL: Some collections with TTL indexes (audit logs)   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Step 7: Authentication & OAuth Layer

```
┌─────────────────────────────────────────────────────────────┐
│         AUTHENTICATION & OAUTH LAYER (Passport.js)         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────┐                 │
│  │   Local Strategy                     │                 │
│  │   (Email + Password)                 │                 │
│  │                                      │                 │
│  │  Flow:                               │                 │
│  │  1. User enters email + password     │                 │
│  │  2. Query user by email              │                 │
│  │  3. Check isDisabled flag            │                 │
│  │  4. Check isEmailVerified flag       │                 │
│  │  5. Compare password with bcrypt    │                 │
│  │  6. Generate JWT token               │                 │
│  │  7. Return token to frontend         │                 │
│  └──────────────────────────────────────┘                 │
│           │                                                 │
│  ┌──────────────────────────────────────┐                 │
│  │   Google OAuth 2.0 Strategy          │                 │
│  │   (Gmail 2FA Verification)           │                 │
│  │                                      │                 │
│  │  Flow:                               │                 │
│  │  1. Click "Sign in with Google"      │                 │
│  │  2. Redirect to Google login         │                 │
│  │  3. User enters Gmail credentials    │                 │
│  │  4. Google returns OAuth token       │                 │
│  │  5. Callback to backend              │                 │
│  │  6. Extract email from profile       │                 │
│  │  7. Find user by email               │                 │
│  │  8. Set isEmailVerified = true       │                 │
│  │  9. Set googleId = profile.id        │                 │
│  │  10. Generate JWT token              │                 │
│  │  11. Redirect to dashboard           │                 │
│  └──────────────────────────────────────┘                 │
│           │                                                 │
│  ┌──────────────────────────────────────┐                 │
│  │   JWT Strategy (Token Verification)  │                 │
│  │                                      │                 │
│  │  On every request:                   │                 │
│  │  1. Extract token from headers       │                 │
│  │  2. Verify signature                 │                 │
│  │  3. Check expiry (24h)               │                 │
│  │  4. Attach user data to request      │                 │
│  │  5. Proceed to next middleware       │                 │
│  └──────────────────────────────────────┘                 │
│           │                                                 │
└───────────┼──────────────────────────────────────────────────┘
            │
```

---

### Step 8: External Services

```
┌─────────────────────────────────────────────────────────────┐
│             EXTERNAL SERVICES & INTEGRATIONS               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────┐                              │
│  │   Google OAuth 2.0       │                              │
│  │   (Email Verification)   │                              │
│  │                          │                              │
│  │  Provides:               │                              │
│  │  ├─ OAuth tokens         │                              │
│  │  ├─ User email           │                              │
│  │  ├─ Profile info         │                              │
│  │  └─ Email verification   │                              │
│  │                          │                              │
│  │  Endpoint:               │                              │
│  │  https://accounts.google │                              │
│  │  .com/o/oauth2/v2/auth   │                              │
│  └──────────────────────────┘                              │
│                                                             │
│  ┌──────────────────────────┐                              │
│  │   Gmail SMTP             │                              │
│  │   (Email Notifications)  │                              │
│  │                          │                              │
│  │  Provides:               │                              │
│  │  ├─ Send notifications   │                              │
│  │  ├─ Leave approvals      │                              │
│  │  ├─ Payroll updates      │                              │
│  │  └─ Account alerts       │                              │
│  └──────────────────────────┘                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Complete Architecture Stack

```
┌──────────────────────────────────────────────────┐
│         FinTrack HRIS Full Stack                 │
├──────────────────────────────────────────────────┤
│                                                  │
│  Layer 1: FRONTEND                              │
│  ├─ React 18 + Vite                             │
│  ├─ Redux (State Management)                    │
│  └─ localStorage (Token Storage)                │
│           ↓                                      │
│  Layer 2: API GATEWAY                           │
│  ├─ Express.js Server                           │
│  ├─ CORS, Auth Middleware                       │
│  └─ Rate Limiting                               │
│           ↓                                      │
│  Layer 3: BUSINESS LOGIC                        │
│  ├─ Controllers                                 │
│  ├─ Utilities (Password, Auth)                  │
│  └─ Services                                    │
│           ↓                                      │
│  Layer 4: DATA ACCESS                           │
│  ├─ Mongoose ORM                                │
│  ├─ Database Models                             │
│  └─ Validation Schemas                          │
│           ↓                                      │
│  Layer 5: DATABASE                              │
│  ├─ MongoDB Atlas (Cloud)                       │
│  ├─ Collections (Users, Payroll, etc.)          │
│  └─ Indexes & Replication                       │
│           ↓                                      │
│  Layer 6: AUTHENTICATION                        │
│  ├─ Local Strategy (Email/Password)             │
│  ├─ Google OAuth 2.0                            │
│  ├─ JWT Tokens                                  │
│  └─ Password Hashing (bcryptjs)                 │
│           ↓                                      │
│  Layer 7: EXTERNAL SERVICES                     │
│  ├─ Google OAuth                                │
│  ├─ Gmail SMTP                                  │
│  └─ Cloud Storage                               │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

**Architecture Version**: 1.0  
**Date**: November 22, 2025  
**Status**: Production Ready ✅
