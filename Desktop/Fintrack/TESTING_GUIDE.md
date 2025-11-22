# FinTrack HRIS - Testing & Setup Guide

## Quick Start

### Prerequisites
- Node.js and npm installed
- MongoDB running locally or connection string ready
- Two terminals (one for backend, one for frontend)

---

## Backend Setup

### 1. Navigate to Backend
```bash
cd backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Edit `.env` file:
```
MONGO_URI=""
PORT=5000
JWT_SECRET=your-super-secret-key-change-this-in-production
```

### 4. Seed the Database
Run the seeding script (do this once):
```bash
node seed.js
```

Expected output:
```
✓ Connected to MongoDB
✓ Created Seeder Admin

╔══════════════════════════════════════════════════════╗
║         FinTrack Database Seeded Successfully        ║
╚══════════════════════════════════════════════════════╝

📧 Email:    seeder_admin@fintrack.com
🔐 Password: Admin@123456
👤 Role:    Seeder Admin
```

### 5. Start Backend Server
```bash
npm run dev
```

Expected output:
```
╔══════════════════════════════════════╗
║  FinTrack HRIS API Server Running    ║
║  Port: 5000                          ║
║  API: http://localhost:5000          ║
╚══════════════════════════════════════╝
```

---

## Frontend Setup

### 1. Navigate to Frontend (in another terminal)
```bash
cd frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Frontend Development Server
```bash
npm run dev
```

Expected output:
```
  VITE v5.0.2  ready in XXX ms

  ➜  Local:   http://localhost:3000/
```

---

## Testing Flow

### Step 1: Database Already Seeded!
You already ran `node seed.js` in backend setup, so Seeder Admin is created ✓

**Seeder Admin Credentials:**
- Email: `seeder_admin@fintrack.com`
- Password: `Admin@123456`

---

### Step 2: Login as Seeder Admin

**Frontend URL:** `http://localhost:3000/`

**Credentials:**
- Email: `seeder_admin@fintrack.com`
- Password: `Admin@123456`

**Expected Result:**
- Auto-redirects to `/seeder-admin` dashboard
- Shows "Seeder Admin Dashboard" with supervisor registration form

---

### Step 3: Create a Supervisor

In the Seeder Admin Dashboard:

1. Click **"+ Add New Supervisor"** button
2. Fill in the form:
   - First Name: `John`
   - Last Name: `Supervisor`
   - Email: `john.supervisor@fintrack.com`
   - Password: `Supervisor@123456`
   - Confirm Password: `Supervisor@123456`
3. Click **"Create Supervisor"**
4. See success message and supervisor appears in the list

**Backend Call (Alternative via Postman):**
```
POST http://localhost:5000/api/auth/register
Headers:
  Authorization: Bearer <seeder_admin_token>
  Content-Type: application/json

Body:
{
  "firstName": "John",
  "lastName": "Supervisor",
  "email": "john.supervisor@fintrack.com",
  "password": "Supervisor@123456",
  "role": "supervisor"
}
```

---

### Step 4: Logout and Login as Supervisor

1. Click **"Logout"** button
2. On login page, enter supervisor credentials:
   - Email: `john.supervisor@fintrack.com`
   - Password: `Supervisor@123456`
3. Redirects to `/dashboard`

---

### Step 5: Create an HR Head

**Currently:** Generic dashboard for all non-seeder-admin roles

Soon you'll have Supervisor Dashboard where they can create HR Heads with:
- First Name, Last Name
- Email, Password
- Role: `hr_head`

**Backend Call (via Postman):**
```
POST http://localhost:5000/api/auth/register
Headers:
  Authorization: Bearer <supervisor_token>
  Content-Type: application/json

Body:
{
  "firstName": "Jane",
  "lastName": "HR",
  "email": "jane.hr@fintrack.com",
  "password": "HRHead@123456",
  "role": "hr_head"
}
```

---

## API Endpoints Reference

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--|
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/logout` | Logout user | Yes |
| POST | `/api/auth/register` | Create user (role-based) | Yes |
| GET | `/api/auth/me` | Get current user info | Yes |
| GET | `/api/auth/users` | List users (hierarchy-based) | Yes |
| GET | `/api/auth/audit-logs` | View audit logs | Yes (Seeder Admin) |

**Note:** Seeding is now done via `node seed.js` (CLI) instead of API endpoint

---

## Hierarchy & Permissions

### User Hierarchy
```
Seeder Admin
    ↓
Supervisor (creates HR Heads)
    ↓
HR Head (creates HR Staff & Employees)
    ├── HR Staff (manages employees)
    └── Employees (Treasury & Marketing)
```

### Registration Permissions
- **Seeder Admin** can create: Supervisors
- **Supervisor** can create: HR Heads
- **HR Head** can create: HR Staff, Employees (must specify department)
- **HR Staff**: Cannot create users
- **Employee**: Cannot create users

### Departments
- **HR** - For HR Head and HR Staff
- **Treasury** - For employees
- **Marketing** - For employees

---

## Common Issues & Solutions

### Issue: Port 5000 Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

### Issue: MongoDB Connection Error
- Ensure MongoDB is running
- Check connection string in `.env`
- Test connection: `mongosh` or MongoDB Compass

### Issue: CORS Error
- Backend CORS is enabled for `http://localhost:3000`
- If frontend on different port, update backend server.js:
```javascript
app.use(cors({
  origin: 'http://localhost:YOUR_PORT'
}));
```

### Issue: Token Expired
- Login again
- Token expires after 24 hours
- New token issued on every login

---

## Testing Checklist

- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 3000
- [ ] POST `/api/seed` returns Seeder Admin
- [ ] Login as Seeder Admin works
- [ ] Seeder Admin Dashboard shows
- [ ] Can create Supervisor from dashboard
- [ ] Can logout
- [ ] Can login as Supervisor
- [ ] Supervisor redirects to `/dashboard`
- [ ] Can create HR Head via API

---

## Next Steps

1. **Create Supervisor Dashboard**
   - Similar to Seeder Admin Dashboard
   - Register HR Heads instead of Supervisors

2. **Create HR Head Dashboard**
   - Register HR Staff and Employees
   - Department selection for employees

3. **Create Employee Management System**
   - Employee schema already created (models/Employee.js)
   - CRUD endpoints for employees
   - Payroll, leave management, etc.

4. **Role-Specific Dashboards**
   - HR Staff dashboard
   - Employee profile page
   - Department dashboards (Treasury & Marketing)

5. **Analytics & Reports**
   - Department-based statistics
   - Payroll reports
   - Employee analytics

---

## Code Structure

```
fintrack/
├── backend/
│   ├── models/
│   │   ├── User.js           # User schema with roles
│   │   ├── Employee.js       # Employee schema
│   │   └── AuditLog.js       # Audit logging
│   ├── middleware/
│   │   ├── authMiddleware.js # JWT verification & RBAC
│   │   └── rateLimitMiddleware.js # Brute-force protection
│   ├── routes/
│   │   └── auth.js           # Authentication endpoints
│   ├── .env                  # Environment variables
│   ├── server.js             # Main server file
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Home.jsx
    │   │   ├── Dashboard.jsx
    │   │   └── SeederAdminDashboard.jsx
    │   ├── components/
    │   │   └── ProtectedRoute.jsx
    │   ├── styles/
    │   │   ├── App.css
    │   │   ├── Login.css
    │   │   └── SeederAdminDashboard.css
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Security Notes

1. **Change JWT_SECRET in production**
   - Current value is placeholder
   - Use strong random string

2. **Change Seeder Admin Password in production**
   - Current: `Admin@123456`
   - Set strong password

3. **Enable HTTPS in production**
   - All API calls should use HTTPS

4. **Store tokens securely**
   - Frontend currently uses localStorage
   - Consider HttpOnly cookies in production

5. **Rate Limiting**
   - Login attempts limited to 5 per minute
   - Account locked for 15 minutes after 5 failed attempts

---

## Support & Troubleshooting

For issues, check:
1. Backend logs in terminal
2. Browser console (F12)
3. Network tab in DevTools
4. MongoDB connection status
5. Firewall/antivirus blocking ports

---

**Version:** 1.0.0  
**Last Updated:** November 21, 2025  
**Status:** Development Phase
