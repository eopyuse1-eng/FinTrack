# 🎯 FINTRACK PRESENTATION COMMANDS (Nov 22, 2025 - 9-10 AM)

## ⚠️ IMPORTANT: Run Commands in This Order

---

## STEP 0: Start Backend & Frontend (Before Demo)

### Terminal 1: Start MongoDB Connection + Backend
```bash
cd c:\Users\Lee\Desktop\Fintrack\backend
npm start
```
✓ Wait until you see: `MongoDB connected` and `Server running on port 5000`

### Terminal 2: Start Frontend (New Terminal)
```bash
cd c:\Users\Lee\Desktop\Fintrack\frontend
npm run dev
```
✓ Wait until you see: `Local: http://localhost:5173`

---

## STEP 1: Verify Demo Data is Ready

Run this ONCE before presentation (if not already done):

```bash
cd c:\Users\Lee\Desktop\Fintrack\backend
node setupDemoUsers.js
```
✓ Should show: "✅ Demo Setup Complete!" with 5 users created

---

## STEP 2: Generate Attendance Data

Run this ONCE before presentation (if not already done):

```bash
cd c:\Users\Lee\Desktop\Fintrack\backend
node generateAttendanceData.js
```
✓ Should show: "✓ Generated 13 attendance records for Nov 15-30"

---

## 🎬 PRESENTATION DEMO FLOW

### Login 1: HR Head (maria.santos@company.com / password123)
- Configure Joshua's salary: ₱30,000/month
- Approve & generate payslips (after HR Staff computes)

### Login 2: HR Staff (juan.cruz@company.com / password123)
- Initialize & Compute payroll for Nov 1-30
- Process Joshua's attendance → Calculate gross pay & deductions

### Login 3: Employee (joshua.marcelino@company.com / password123)
- View payslip with earnings breakdown
- See deductions (SSS, PhilHealth, Pag-IBIG, Tax)
- View payment history

---

## 📋 Quick Reference: Demo User Credentials

```
🔐 SEEDER ADMIN (Created automatically)
   Email: seeder@example.com
   Role: supervisor

👔 HR HEAD
   Email: maria.santos@company.com
   Password: password123

📊 HR STAFF
   Email: juan.cruz@company.com
   Password: password123

🎯 EMPLOYEE - Marketing (Joshua)
   Email: joshua.marcelino@company.com
   Password: password123

🎯 EMPLOYEE - Marketing (LJ)
   Email: lj.tanauan@company.com
   Password: password123

💰 EMPLOYEE - Treasury (Ana)
   Email: ana.garcia@company.com
   Password: password123
```

---

## 🔧 Troubleshooting Commands

### If Backend Won't Start
```bash
cd c:\Users\Lee\Desktop\Fintrack\backend
npm install
npm start
```

### If Frontend Won't Start
```bash
cd c:\Users\Lee\Desktop\Fintrack\frontend
npm install
npm run dev
```

### List All Users (Verify Data)
```bash
cd c:\Users\Lee\Desktop\Fintrack\backend
node listUsers.js
```

### Check Attendance Records
```bash
cd c:\Users\Lee\Desktop\Fintrack\backend
node checkAttendance.js
```

---

## ✅ Pre-Presentation Checklist

- [ ] Run `node setupDemoUsers.js` (creates 5 demo users)
- [ ] Run `node generateAttendanceData.js` (creates 13 attendance days)
- [ ] Start backend: `npm start` (Terminal 1)
- [ ] Start frontend: `npm run dev` (Terminal 2)
- [ ] Open browser: `http://localhost:5173`
- [ ] Test login with maria.santos@company.com
- [ ] Test login with joshua.marcelino@company.com

---

## 🚀 Go Live Commands

### Push to GitHub (After Presentation)
```bash
cd c:\Users\Lee\Desktop\Fintrack
git add .
git commit -m "feat: Complete payroll automation system with live data support"
git push origin main
```

---

**GOOD LUCK WITH YOUR PRESENTATION! 💪**
