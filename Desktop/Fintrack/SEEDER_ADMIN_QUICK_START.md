# ⚡ Quick Start: Seeder Admin Setup

## One-Command Setup

```bash
cd backend && node seed.js
```

**That's it!** The script will:
✅ Create Seeder Admin with strong password
✅ Validate password strength (95/100 score)
✅ Show you the credentials
✅ Create audit log entry
✅ Prevent duplicate Seeder Admins

---

## Default Credentials

After running `seed.js`, you'll get:

```
Email:    seeder_admin@fintrack.com
Password: FinTrack@Admin2025!SecurePass#
```

⚠️ **SAVE THESE IN A SECURE PASSWORD MANAGER IMMEDIATELY**

---

## Next Steps

1. **Start Backend**
   ```bash
   npm run dev
   ```

2. **Login to Dashboard**
   - URL: http://localhost:5173
   - Email: `seeder_admin@fintrack.com`
   - Password: `FinTrack@Admin2025!SecurePass#`

3. **Create Supervisor**
   - Dashboard > Create User
   - Role: Supervisor
   - Supervisor creates HR Heads
   - HR Head creates Employees

---

## Role Hierarchy

```
Seeder Admin (YOU)
    ↓
Supervisor
    ↓
HR Head
    ↓
HR Staff & Employees
```

---

## Security Features

✅ Strong password (12+ chars, mixed case, numbers, special chars)
✅ Only ONE Seeder Admin allowed
✅ All actions audited & logged
✅ Email verification gates for regular users
✅ Role-based access control
✅ Cannot be deleted without database reset

---

## Troubleshooting

### "Seeder Admin already exists"
**Solution:** Delete from database and run again
```bash
# Connect to MongoDB and run:
db.users.deleteOne({ role: 'seeder_admin' })
```

### Forgot the password?
**Solution:** Reset the Seeder Admin
```bash
# Delete Seeder Admin from database
db.users.deleteOne({ role: 'seeder_admin' })

# Run seeding again
node seed.js
```

### Cannot login
**Check:**
1. Backend server is running: `npm run dev`
2. Email is exactly: `seeder_admin@fintrack.com`
3. Password is exactly: `FinTrack@Admin2025!SecurePass#`
4. No extra spaces before/after

---

## For Presentation (Nov 22, 9 AM)

✅ **Ready to go!** No further setup needed.

**Demo flow:**
1. Login as Seeder Admin
2. Create Supervisor
3. Create HR Head
4. Create Employee
5. Show payroll workflow
6. (Optional) Show Gmail OAuth verification gate

---

## Security Reminders

- 🔒 Store password in password manager
- 🔒 Don't share credentials
- 🔒 Change password monthly
- 🔒 Monitor audit logs weekly
- 🔒 Only person with access should have this account

---

For detailed security guide, see: [SEEDER_ADMIN_SECURITY.md](SEEDER_ADMIN_SECURITY.md)
