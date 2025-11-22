# FinTrack HRIS - Project Summary

## Overview

FinTrack is a full-stack Human Resource Information System (HRIS) built with:
- **Backend:** Node.js + Express + MongoDB
- **Frontend:** React + Vite
- **Styling:** Pure CSS (no frameworks)
- **Authentication:** JWT with role-based access control (RBAC)

**Current Status:** Development Phase - Authentication & User Hierarchy Complete

---

## What's Built

### ✅ Backend Features

#### 1. **Authentication System**
- User registration with role-based hierarchy
- JWT token generation and verification
- Password hashing with bcryptjs
- 24-hour token expiration
- Rate limiting (5 login attempts/minute, 15-min account lock)

#### 2. **Role-Based Access Control (RBAC)**
- 5 user roles with hierarchical permissions
- Protected API endpoints
- Middleware for role validation
- Audit logging for all auth events

#### 3. **User Hierarchy**
```
Seeder Admin (only initial user)
    ↓
Supervisor (can create)
    ↓
HR Head (can create)
    ├── HR Staff (department: HR)
    └── Employees (departments: Treasury, Marketing)
```

#### 4. **Database Models**
- **User.js** - Authentication & hierarchy
- **Employee.js** - Employee data with payroll info
- **AuditLog.js** - Security audit trail

#### 5. **Security Features**
- Password hashing (bcrypt)
- Account locking after failed attempts
- Audit logging
- CORS enabled
- Environment variable protection

#### 6. **API Endpoints**
- `POST /api/seed` - Initialize Seeder Admin
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/register` - User registration (role-based)
- `GET /api/auth/me` - Get current user
- `GET /api/auth/users` - List users (hierarchy-based)
- `GET /api/auth/audit-logs` - View audit logs

---

### ✅ Frontend Features

#### 1. **Login Page**
- Email & password authentication
- Error message display
- Form validation
- Redirect after successful login

#### 2. **Seeder Admin Dashboard**
- Supervisor registration form
- List of registered supervisors
- Form validation
- Success/error messages
- Responsive design

#### 3. **Protected Routes**
- Role-based access control
- Automatic redirect for unauthorized users
- Protected route component
- Auto-redirect for Seeder Admin

#### 4. **Authentication Flow**
- Token storage in localStorage
- Automatic user info retrieval
- Token-based API calls
- Logout functionality

#### 5. **Responsive Design**
- Mobile-friendly layouts
- Pure CSS styling
- Gradient color scheme (purple/blue)
- Smooth transitions and hover effects

---

## Project Structure

### Backend
```
backend/
├── models/
│   ├── User.js              # User schema (5 roles)
│   ├── Employee.js          # Employee schema (payroll)
│   └── AuditLog.js          # Audit logging
├── middleware/
│   ├── authMiddleware.js    # JWT + RBAC
│   └── rateLimitMiddleware.js # Brute-force protection
├── routes/
│   └── auth.js              # Auth endpoints
├── .env                     # Environment config
├── server.js                # Main server
└── package.json
```

### Frontend
```
frontend/
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

## Technology Stack

### Backend
- **express** - Web framework
- **mongoose** - MongoDB ODM
- **jsonwebtoken** - JWT token generation
- **bcryptjs** - Password hashing
- **cors** - Cross-origin requests
- **dotenv** - Environment variables
- **nodemon** - Development tool

### Frontend
- **react** - UI library
- **react-router-dom** - Routing
- **axios** - HTTP client
- **vite** - Build tool
- **chart.js** - Charts (for future use)

---

## Key Features Implemented

### 1. User Hierarchy
- Seeder Admin only initial user on deployment
- Each role creates next level down
- Cascading permissions
- Audit trail of who created whom

### 2. Security
- Bcrypt password hashing
- JWT token authentication
- Rate limiting with account locking
- Audit logs for all events
- Role-based access control

### 3. Departments
- HR, Treasury, Marketing
- Department-based access
- Employee assignment to departments

### 4. Data Validation
- Email format validation
- Phone number format
- Government ID validation
- Required field validation

### 5. Responsive Design
- Mobile-first approach
- Works on desktop, tablet, mobile
- Pure CSS (no frameworks)
- Accessible forms

---

## Testing Instructions

### Quick Start
1. **Backend:** `npm run dev` (in backend folder)
2. **Frontend:** `npm run dev` (in frontend folder)
3. **Seed DB:** `POST http://localhost:5000/api/seed`
4. **Login:** seeder_admin@fintrack.com / Admin@123456

### Test Flow
1. Seed database
2. Login as Seeder Admin
3. Create Supervisor via dashboard form
4. Logout and login as Supervisor
5. Would create HR Head next (feature in progress)

See `TESTING_GUIDE.md` for detailed steps.

---

## What's Next

### Phase 2 - Role Dashboards
- [ ] Supervisor Dashboard (create HR Heads)
- [ ] HR Head Dashboard (manage HR Staff & Employees)
- [ ] HR Staff Dashboard (view employees)
- [ ] Employee Dashboard (view profile & data)

### Phase 3 - Employee Management
- [ ] Employee CRUD endpoints
- [ ] Employee profile pages
- [ ] Payroll system
- [ ] Leave management
- [ ] Attendance tracking

### Phase 4 - Department Features
- [ ] Treasury Department Dashboard
- [ ] Marketing Department Dashboard
- [ ] Department-specific reports
- [ ] Performance tracking

### Phase 5 - Advanced Features
- [ ] Payroll processing
- [ ] Leave requests & approvals
- [ ] Performance reviews
- [ ] Document management
- [ ] Email notifications
- [ ] Mobile app (React Native)

---

## Deployment Checklist

- [ ] Change JWT_SECRET in .env
- [ ] Change Seeder Admin password
- [ ] Set MongoDB connection to production DB
- [ ] Enable HTTPS
- [ ] Configure email service
- [ ] Set up error logging
- [ ] Configure backup strategy
- [ ] Set up monitoring
- [ ] Configure rate limiting for production
- [ ] Enable database backups

---

## Environment Variables

### Backend `.env`
```
MONGO_URI=mongodb://localhost:27017/fintrack
PORT=5000
JWT_SECRET=your-secret-key-here
```

### Frontend
- Backend API: http://localhost:5000
- Token storage: localStorage

---

## Notes for Developers

### Code Quality
- All models include validation
- Error handling on all endpoints
- Consistent code style
- JSDoc comments on key functions
- Proper HTTP status codes

### Security Considerations
- Passwords never logged
- Sensitive data excluded from responses
- CORS restricted to frontend origin
- Rate limiting on login
- Account locking mechanism

### Performance
- Indexed database fields
- Efficient queries
- Token caching possible
- Pagination ready (not implemented)

---

## Support & Documentation

- **Main README:** See `/README.md`
- **Testing Guide:** See `/TESTING_GUIDE.md`
- **API Documentation:** See backend code comments
- **Issue Tracking:** Check github issues (when available)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Nov 21, 2025 | Initial development - Auth system & Seeder Admin Dashboard |

---

## Team & Contact

**Project:** FinTrack HRIS  
**Status:** Development  
**Last Updated:** November 21, 2025  
**Next Review:** When Phase 2 completes

---

## Changelog

### Version 1.0.0 - November 21, 2025
- ✅ Full authentication system with JWT
- ✅ Role-based access control (RBAC)
- ✅ User hierarchy (Seeder Admin → Supervisor → HR Head → Staff/Employees)
- ✅ Audit logging for all authentication events
- ✅ Rate limiting with account locking
- ✅ Seeder Admin Dashboard for supervisor registration
- ✅ Protected routes on frontend
- ✅ Pure CSS responsive design
- ✅ Security features (password hashing, token expiration)
- ✅ Employee schema with comprehensive fields

---

**Built with ❤️ for Human Resource Management**
