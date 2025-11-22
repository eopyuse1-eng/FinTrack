# Quick Start - HR Head System Testing

## System Status

✅ **Backend:** Ready for startup
✅ **Frontend:** Built and compiled (452.12 kB)
✅ **Database:** Connected and verified (8 users in system)
✅ **Components:** All 8 HRHead components fully implemented

---

## Test Users

### HR Head Access
- **Email:** maria.santos@company.com
- **Password:** (Use Gmail OAuth or set password via backend)
- **Role:** HR_HEAD
- **Department:** admin

### HR Staff Reference (for comparison)
- **Email:** renzo@fintrack.com
- **Password:** (Check backend setup)
- **Role:** HR_STAFF
- **Department:** hr

### Employees
- LJ Tanauan (lj.tanauan@company.com) - Marketing
- Joshua Marcelino (joshua.marcelino@company.com) - Marketing
- Lee Pinkly (lee@fintrack.com) - Treasury
- Ana Garcia (ana.garcia@company.com) - Treasury

---

## How to Start

### Option 1: Terminal Commands

**Terminal 1 - Backend:**
```bash
cd c:\Users\Lee\Desktop\Fintrack\backend
npm install
node server.js
```

**Terminal 2 - Frontend:**
```bash
cd c:\Users\Lee\Desktop\Fintrack\frontend
npm install
npm run dev
```

**Result:**
- Backend running on: http://localhost:5000
- Frontend running on: http://localhost:5173 (or next available port)

---

## Component Testing Checklist

### 1. Dashboard Home ✅
**Path:** HR Head → Dashboard
**Test:**
- [ ] See 5 stat cards (Employees, Present, Pending Leaves, Unlocks, Absent)
- [ ] See recent activity feed
- [ ] Pagination works on activity
- [ ] Quick action buttons visible

**Expected Stats:**
- Total Employees: 4
- Pending Leaves: (variable)
- Pending Unlocks: (variable based on locked accounts)

---

### 2. Attendance Management ✅
**Path:** HR Head → Attendance
**Test:**
- [ ] Table shows company attendance records
- [ ] Can search by employee name
- [ ] Pagination works (10 per page)
- [ ] Status badges show correctly (Present, Late, Absent)
- [ ] Time format shows correctly (HH:MM:SS)
- [ ] Refresh button reloads data
- [ ] Pending Corrections tab works

**Expected Data:**
- Should show records for all 4 employees
- Check-in/out times
- Total hours worked

---

### 3. Employee Management ✅
**Path:** HR Head → Employee Management
**Test:**
- [ ] All 4 employees displayed in table
- [ ] Search works by name/email/department
- [ ] "Add Employee" button opens form
- [ ] Form has all required fields
- [ ] Form validation works (try submit empty)
- [ ] Can create new employee
- [ ] View button opens employee details modal
- [ ] Status badge shows correctly (Active/Inactive)
- [ ] Pagination works

**Try Adding:**
- First Name: Test
- Last Name: Employee
- Email: test@company.com
- Department: IT
- Position: Developer

---

### 4. Leave Management ✅
**Path:** HR Head → Leave Management
**Test:**
- [ ] All leave requests display
- [ ] Filter by status works (All, Pending, Approved, Rejected)
- [ ] Search by employee/leave type works
- [ ] Table shows: Employee, Leave Type, Period, Days, Status
- [ ] Pending requests have "Review" button
- [ ] Approved/Rejected requests have "View" button
- [ ] Review modal appears with request details
- [ ] Comment textarea visible
- [ ] Approve/Reject buttons work
- [ ] Status badges color correctly
- [ ] Pagination works

**Expected Data:**
- Depends on created leave requests
- Maria Santos can see all company leaves

---

### 5. Payroll Workflow ✅
**Path:** HR Head → Payroll Workflow
**Test:**
- [ ] Period selection dropdown shows periods
- [ ] Can select a period
- [ ] Table shows payroll records for period
- [ ] Search by employee name works
- [ ] Salary values display with ₱ and 2 decimals
- [ ] Status badges (Pending, Processed, Paid)
- [ ] "Process Payroll" button with confirmation dialog
- [ ] "Generate Payslips" button with confirmation
- [ ] Period info displays correctly
- [ ] Pagination works

**Expected Data:**
- Base Salary, Deductions, Net Salary
- Status calculation
- All 4 employees in payroll

---

### 6. Reports ✅
**Path:** HR Head → Reports
**Test:**
- [ ] Report type selector shows 4 options
- [ ] Date range pickers work
- [ ] "Generate Report" button triggers
- [ ] Summary stats display correctly
- [ ] Data shows in JSON format
- [ ] "Export CSV" button downloads file
- [ ] Different stats for different report types

**Try Each Report Type:**
1. **Attendance Report** - Shows presence statistics
2. **Leave Report** - Shows leave statistics
3. **Payroll Report** - Shows salary statistics
4. **Performance Report** - Shows performance tiers

---

### 7. Tax Settings ✅
**Path:** HR Head → Tax Settings
**Test:**
- [ ] All 6 tax fields display
- [ ] Each field has label, description, percentage value
- [ ] "Edit" button visible on each card
- [ ] Click "Edit" shows input field
- [ ] Can enter percentage (0-100)
- [ ] Save/Cancel buttons work
- [ ] Success message appears after save
- [ ] Value updates in display
- [ ] Information box explains settings

**Fields to Test:**
- Base Tax Rate
- SSS Contribution
- Medical Insurance
- PhilHealth Contribution
- Pag-IBIG Contribution
- Other Deductions

---

### 8. Account Unlocks ✅
**Path:** HR Head → Account Unlocks
**Test:**
- [ ] Filter tabs show All/Pending/Approved/Denied
- [ ] Tab counts update correctly
- [ ] Search functionality works
- [ ] Table shows unlock requests
- [ ] Pending requests have Approve/Deny buttons
- [ ] Review modal displays request details
- [ ] Comment field in modal
- [ ] Password reset checkbox available
- [ ] Approve/Deny processing works
- [ ] Status badges color correctly

**To Test Unlocks:**
1. Trigger account lock (5 failed login attempts)
2. Request unlock from Login page
3. Review in HR Head dashboard
4. Approve/Deny the request

---

## Feature Verification

### Search & Filter ✅
- [x] Attendance - Search by name
- [x] Employee Management - Search by name/email/department
- [x] Leave Management - Search + Status filter
- [x] Payroll - Search by employee
- [x] Reports - Date range filter
- [x] Unlocks - Search functionality

### Pagination ✅
- [x] All list components support pagination
- [x] 10 records per page
- [x] Previous/Next buttons
- [x] Page indicator shows current page

### Forms & Validation ✅
- [x] Employee form - Email validation
- [x] Employee form - Required field validation
- [x] Salary field - Numeric validation
- [x] Tax settings - Percentage range (0-100)

### Status Badges ✅
- [x] Attendance - Present (green), Late (yellow), Absent (red)
- [x] Leave - Pending (yellow), Approved (green), Rejected (red)
- [x] Payroll - Pending (yellow), Processed (green), Paid (blue)
- [x] Unlocks - Color-coded by status

### Real-time Data ✅
- [x] Statistics update after actions
- [x] Refresh buttons reload data
- [x] Forms submit and show feedback
- [x] Modals display current data

---

## Known Integration Points

### Backend Endpoints Used

**Attendance:**
- GET /api/attendance/paginated

**Employees:**
- GET /api/users?role=EMPLOYEE
- POST /api/users/create

**Leave:**
- GET /api/leave/all
- PUT /api/leave/:id/approve
- PUT /api/leave/:id/reject

**Payroll:**
- GET /api/payroll/periods
- GET /api/payroll/records/:periodId
- POST /api/payroll/process/:periodId
- POST /api/payroll/generate-payslips/:periodId

**Reports:**
- GET /api/reports/attendance
- GET /api/reports/leave
- GET /api/reports/payroll
- GET /api/reports/performance

**Tax Settings:**
- GET /api/tax-settings
- PUT /api/tax-settings/:field

**Unlocks:**
- GET /api/auth/unlock-requests
- POST /api/auth/unlock/:id
- POST /api/auth/unlock/:id/deny

**Dashboard:**
- GET /api/attendance/dashboard/stats
- GET /api/audit-logs/paginated

---

## Troubleshooting

### Component Not Loading
- Check browser console for errors
- Verify backend is running on port 5000
- Check API token validity in localStorage

### Data Not Showing
- Verify database connection: `node listUsers.js` in backend folder
- Check network tab in DevTools for failed API calls
- Confirm user has HR_HEAD role

### Styling Issues
- Verify `Dashboards.css` exists in `/frontend/src/styles/`
- Check CSS imports use correct relative paths
- Clear browser cache and rebuild (`npm run build`)

### Form Submission Fails
- Check backend console for error details
- Verify request body matches endpoint expectations
- Check authentication token in Authorization header

---

## Performance Notes

- Frontend build size: 452.12 kB JS, 92.33 kB CSS
- All components use pagination to limit initial data load
- Search is client-side filtered for instant results
- Modals reduce page reloads and server requests

---

## Success Indicators

✅ All components render without errors
✅ Data loads from backend correctly
✅ Forms submit and update database
✅ Pagination works on all list views
✅ Status badges display with correct colors
✅ Search filters work instantly
✅ Modal popups function correctly
✅ Error messages display appropriately
✅ Loading states show during data fetch
✅ CSV export generates correct format

---

## Next Phase Features (Future)

- Real-time notifications for pending approvals
- Bulk operations (approve/reject multiple leaves)
- Department-wise performance dashboards
- Email alerts for HR Head actions
- Advanced filtering with date ranges
- Custom report builder
- Dashboard widgets customization
- Export to Excel with formatting

---

**Last Updated:** 2025-11-22
**Version:** 1.0 - Full Implementation Complete
