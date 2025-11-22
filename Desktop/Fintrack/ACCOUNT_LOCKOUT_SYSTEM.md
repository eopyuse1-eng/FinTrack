# Account Lockout & Unlock System - Implementation Summary

## Overview
Implemented a complete account lockout and unlock request system that allows locked-out users to request account unlocks from the HR Head.

## Backend Implementation

### 1. User Model Updates (`backend/models/User.js`)
Added three new fields to track unlock requests:
- `unlockRequest` (Boolean, default: false) - Flag for pending unlock request
- `unlockReason` (String) - User's reason for unlock request
- `unlockRequestedAt` (Date) - When the unlock was requested

### 2. New Model: UnlockRequest (`backend/models/UnlockRequest.js`)
Created a new model to track all unlock requests with:
- `user` (Reference to User) - Who requested the unlock
- `reason` (String, max 500 chars) - Why they need to unlock
- `status` (pending, approved, denied) - Current state
- `reviewedBy` (Reference to HR Head) - Who reviewed it
- `reviewComment` (String) - HR Head's comment
- `passwordReset` (Boolean) - Whether to reset password
- `createdAt` & `reviewedAt` (Dates) - Timeline tracking

### 3. Auth Controller Updates (`backend/controllers/authController.js`)

#### New Functions:
1. **requestUnlock()** - POST /auth/request-unlock
   - User files unlock request with reason
   - Creates UnlockRequest record
   - Sets unlockRequest flag on user
   - Logs action in AuditLog

2. **getUnlockRequests()** - GET /auth/unlock-requests (HR_HEAD only)
   - Returns all unlock requests with populated user details
   - HR Head can filter and review requests

3. **approveUnlock()** - POST /auth/unlock/:id (HR_HEAD only)
   - Unlocks the user's account (removes lockUntil)
   - Resets login attempts to 0
   - Optionally generates temporary password
   - Logs action with HR Head's comment

4. **denyUnlock()** - POST /auth/unlock/:id/deny (HR_HEAD only)
   - Denies the unlock request
   - Keeps account locked
   - Logs denial with HR Head's reasoning

5. **getAccountStatus()** - GET /auth/account-status/:email
   - Check if account is locked (used during login)
   - Returns lockUntil date and unlock request status

#### Modified Functions:
- **login()** - Added check for account lockout before password verification
  - Returns 423 status code with ACCOUNT_LOCKED code
  - Includes lockUntil timestamp and canRequestUnlock flag

### 4. New Routes (`backend/routes/auth.js`)
Added 5 new endpoints:
```
POST   /auth/request-unlock           - File unlock request (public)
GET    /auth/account-status/:email    - Check lock status (public)
GET    /auth/unlock-requests          - View all requests (HR_HEAD only)
POST   /auth/unlock/:id               - Approve unlock (HR_HEAD only)
POST   /auth/unlock/:id/deny          - Deny unlock (HR_HEAD only)
```

---

## Frontend Implementation

### 1. Login Page Updates (`frontend/src/pages/Login.jsx`)

#### New State Variables:
- `isAccountLocked` - Track if account is locked
- `lockUntil` - When the lock expires
- `showUnlockModal` - Show/hide unlock request modal
- `unlockReason` - User's unlock reason
- `isSubmittingUnlock` - Loading state for unlock submission
- `actionType` - Track approve/deny action

#### Updated Functions:
- **handleSubmit()** - Enhanced to handle ACCOUNT_LOCKED error code
  - Displays lock message
  - Shows unlock modal automatically

#### New Functions:
- **handleUnlockRequest()** - Submit unlock request to backend
  - Validates reason is provided
  - Sends POST to /auth/request-unlock
  - Shows success/error alerts

#### Modal UI:
- Lock information box with lock expiration time
- Textarea for explaining unlock reason (500 char limit)
- Submit and Cancel buttons
- Character counter for reason field

### 2. Login Styles (`frontend/src/styles/Login.css`)

Added comprehensive modal styling:
- `.modal-overlay` - Fixed position overlay with fade animation
- `.modal-content` - Centered modal box with slide-up animation
- `.unlock-info` - Styled info box for lock details
- `.btn-primary` / `.btn-secondary` - Button styles
- `.modal-actions` - Action buttons layout
- Responsive design for mobile devices

### 3. HR Head Unlock Requests Page (`frontend/src/components/HRHead/UnlockRequests.jsx`)

#### Features:
- **Filter Tabs**: View all, pending, approved, or denied requests
- **Unlock Request Table** with columns:
  - User name and email
  - User's department
  - Reason for unlock (truncated)
  - Request date
  - Current status (color-coded badges)
  - Action buttons (Approve/Deny for pending)

#### Functions:
- **fetchUnlockRequests()** - Load all requests from backend
- **handleApproveClick()** / **handleDenyClick()** - Open review modal
- **handleApproveSubmit()** - Submit approval with optional password reset
- **handleDenySubmit()** - Submit denial with optional comment
- **getStatusBadge()** - Color-coded status display (pending/approved/denied)

#### Review Modal:
- Shows user info and unlock reason
- Optional comment field for HR Head's decision
- Checkbox to reset user's password (on approve)
- Character counter for comment
- Displays temporary password if generated

### 4. HR Head Dashboard Integration (`frontend/src/pages/HRHead/HRHeadDashboard.jsx`)

Added new menu item:
- **Account Unlocks** (🔓) - Links to UnlockRequests component
- Integrated into existing HR Head dashboard navigation

---

## Security & Features

### Security:
- ✅ Only HR_HEAD can approve/deny unlocks
- ✅ Unlock requests require reason (audit trail)
- ✅ All actions logged in AuditLog
- ✅ JWT token protection on all endpoints
- ✅ Temporary passwords generated securely with crypto
- ✅ Rate limiting via existing middleware

### User Experience:
- ✅ Automatic lockout after 5 failed attempts (15 min lock)
- ✅ Users can request unlock anytime when locked
- ✅ HR Head can reset password along with unlock
- ✅ Unlock status tracked with timestamps
- ✅ Visual feedback via color-coded badges
- ✅ Approval/denial comments for user feedback

### Audit Trail:
All actions logged in AuditLog:
- ACCOUNT_UNLOCK_REQUESTED
- ACCOUNT_UNLOCK_APPROVED
- ACCOUNT_UNLOCK_DENIED

---

## System Flow

### When Account Gets Locked:
1. User fails login 5 times in 15 minutes
2. Account gets lockUntil timestamp set (15 min from now)
3. Login returns ACCOUNT_LOCKED error code

### User Requests Unlock:
1. User sees "Unlock Account" modal on login
2. Enters reason for unlock request
3. System creates UnlockRequest record
4. Sets unlockRequest flag on user
5. Notification ready for HR Head

### HR Head Reviews & Approves:
1. HR Head views Account Unlocks page
2. Sees pending requests filtered
3. Clicks Approve/Deny button
4. Opens review modal with user details
5. Can optionally reset password
6. Adds comment
7. Submits approval
8. User's account unlocked (lockUntil removed)
9. loginAttempts reset to 0

### HR Head Denies:
1. Similar flow but denies unlock
2. Account stays locked
3. User must wait for lock to expire naturally (15 min)
4. Or request unlock again with different reason

---

## Status Codes Used

- **423 (Locked)** - ACCOUNT_LOCKED error during login
- **200 (OK)** - Successful unlock request/approval
- **201 (Created)** - New unlock request created
- **400 (Bad Request)** - Invalid reason, already pending, etc.
- **403 (Forbidden)** - Non-HR_HEAD trying to approve
- **404 (Not Found)** - User/request not found
- **500 (Server Error)** - Backend processing error

---

## Testing Checklist

- [ ] User gets locked after 5 failed login attempts
- [ ] Locked user sees "Unlock Account" button in modal
- [ ] User can submit unlock request with reason
- [ ] HR Head sees pending unlock request in Account Unlocks page
- [ ] HR Head can approve unlock
- [ ] HR Head can approve and reset password
- [ ] HR Head can deny unlock
- [ ] User can login after account is unlocked
- [ ] Account lockout time is 15 minutes
- [ ] All actions appear in AuditLog
- [ ] Modal works in light/dark mode

---

## Files Modified/Created

### Created:
- `backend/models/UnlockRequest.js`
- `frontend/src/components/HRHead/UnlockRequests.jsx`

### Modified:
- `backend/models/User.js` - Added unlock fields
- `backend/controllers/authController.js` - Added 5 new functions
- `backend/routes/auth.js` - Added 5 new routes
- `frontend/src/pages/Login.jsx` - Added unlock modal + state
- `frontend/src/styles/Login.css` - Added modal styling
- `frontend/src/pages/HRHead/HRHeadDashboard.jsx` - Added menu item
