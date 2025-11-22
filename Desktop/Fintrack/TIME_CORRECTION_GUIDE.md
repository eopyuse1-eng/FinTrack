# Time Correction Module - Implementation Guide

## Overview

The Time Correction module allows employees and HR personnel to submit requests for correcting recorded attendance times. The system implements a multi-level approval workflow based on the filer's role and department.

## Approval Hierarchy

The approval process follows these rules:

### 1. HR Head Files Correction
- **Requires 1 Approval**: Supervisor only
- **Approval Flow**: HR Head → Supervisor

### 2. HR Staff Files Correction  
- **Requires 2 Approvals**: HR Head OR Supervisor (both)
- **Approval Flow**: HR Staff → HR Head/Supervisor (either) → The Other

### 3. Employee (Treasury/Marketing) Files Correction
- **Requires 2 Approvals**: HR Staff (first) → HR Head (final)
- **Approval Flow**: Employee → HR Staff → HR Head

## Database Schema

### TimeCorrection Model

**Location**: `/backend/models/TimeCorrection.js`

**Fields**:
- `employee` - Reference to User (ObjectId)
- `attendanceRecord` - Reference to Attendance record (ObjectId)
- `correctionDate` - Date being corrected
- `originalCheckInTime` - Original check-in timestamp
- `originalCheckOutTime` - Original check-out timestamp
- `originalTotalHours` - Original calculated hours
- `originalStatus` - Original attendance status
- `correctedCheckInTime` - Proposed check-in time
- `correctedCheckOutTime` - Proposed check-out time
- `correctedTotalHours` - Proposed calculated hours
- `correctedStatus` - Proposed attendance status
- `reason` - Reason for correction (required)
- `department` - Employee's department
- `status` - Current status: 'pending', 'approved', 'rejected'
- `approvals[]` - Array of approval steps with:
  - `approver` - User ID of approver
  - `approverRole` - Role of approver
  - `approverName` - Full name of approver
  - `action` - 'approved' or 'rejected'
  - `comments` - Approval comments
  - `approvedAt` - Timestamp of approval
- `currentApprovalLevel` - Current position in approval chain (0-indexed)
- `totalApprovalsRequired` - Total approvals needed to complete
- `submittedBy` - User ID of who submitted
- `submittedAt` - Submission timestamp
- `approvedAt` - Final approval timestamp
- `rejectedAt` - Rejection timestamp
- `rejectionReason` - Reason for rejection

## Backend APIs

### 1. Submit Time Correction
**Endpoint**: `POST /api/time-correction/request`  
**Auth Required**: Yes  
**Access**: All authenticated users (employee, hr_staff, hr_head, supervisor)

**Request Body**:
```json
{
  "attendanceId": "ObjectId",
  "correctedCheckInTime": "2024-01-15T08:30:00.000Z",
  "correctedCheckOutTime": "2024-01-15T17:00:00.000Z",
  "reason": "System malfunction prevented proper check-out"
}
```

**Response** (201 - Success):
```json
{
  "success": true,
  "message": "Time correction request submitted successfully",
  "data": { TimeCorrection object }
}
```

### 2. Get Pending Approvals
**Endpoint**: `GET /api/time-correction/pending-approvals`  
**Auth Required**: Yes  
**Access**: supervisor, hr_head, hr_staff only

**Response** (200 - Success):
```json
{
  "success": true,
  "data": [ Array of pending TimeCorrection objects ],
  "total": number
}
```

**Logic**:
- **Supervisor sees**: HR Head corrections at any approval level
- **HR Head sees**: 
  - HR Staff corrections at level 0 or 1
  - Employee corrections at level 1 (final approval)
- **HR Staff sees**: Employee corrections in their department at level 0 (first approval)

### 3. Approve Time Correction
**Endpoint**: `POST /api/time-correction/:id/approve`  
**Auth Required**: Yes  
**Access**: supervisor, hr_head, hr_staff only

**Request Body**:
```json
{
  "comments": "Looks good, approved"
}
```

**Response** (200 - Success):
```json
{
  "success": true,
  "message": "Time correction approved and applied" | "Approval recorded, awaiting further approval",
  "data": { Updated TimeCorrection object }
}
```

**Behavior**:
- Adds approval to the approvals chain
- Increments currentApprovalLevel
- If all approvals complete: Updates attendance record and sets status to 'approved'
- If more approvals needed: Keeps status as 'pending'

### 4. Reject Time Correction
**Endpoint**: `POST /api/time-correction/:id/reject`  
**Auth Required**: Yes  
**Access**: supervisor, hr_head, hr_staff only

**Request Body**:
```json
{
  "rejectionReason": "Insufficient documentation provided"
}
```

**Response** (200 - Success):
```json
{
  "success": true,
  "message": "Time correction request rejected",
  "data": { Updated TimeCorrection object }
}
```

### 5. Get My Requests
**Endpoint**: `GET /api/time-correction/my-requests`  
**Auth Required**: Yes  
**Access**: All authenticated users

**Response** (200 - Success):
```json
{
  "success": true,
  "data": [ Array of user's submitted TimeCorrection objects ],
  "total": number
}
```

## Frontend Components

### FileCorrectionForm Component
**Location**: `/frontend/src/components/TimeCorrection/FileCorrectionForm.jsx`

**Props**:
- `attendanceRecord` - The attendance record to correct
- `onClose` - Callback when modal closes
- `onSuccess` - Callback when correction submitted successfully

**Features**:
- Displays original times (read-only)
- Allows editing of check-in/check-out times
- Requires reason for correction
- Shows success/error messages
- Loading state during submission

### PendingCorrections Component
**Location**: `/frontend/src/components/TimeCorrection/PendingCorrections.jsx`

**Props**:
- `userRole` - Current user's role

**Features**:
- Displays all pending corrections for approver
- Shows original vs. corrected times
- Displays employee details and reason
- Approve/Reject buttons for each correction
- Modal dialog for approval comments/rejection reason
- Shows approval status and current level
- Auto-refresh capability

### TimeCorrection Styling
**Location**: `/frontend/src/components/styles/TimeCorrection.css`

Comprehensive styling for:
- Modal dialogs
- Forms and input fields
- Buttons (primary, secondary, success, danger)
- Tables and data display
- Badges for status indicators
- Responsive design for mobile devices

## Integration Points

### Attendance Component
Both HR Head and HR Staff Attendance pages include:
- "View Pending Corrections" toggle button
- "Correct" action button for each attendance record
- Modal form for submitting corrections
- Display of pending corrections list

### Data Flow

1. **Employee/HR Files Correction**:
   - Selects attendance record
   - Clicks "Correct" button
   - Opens FileCorrectionForm modal
   - Enters corrected times and reason
   - Submits request via API
   - Request saved with status 'pending'

2. **Approver Reviews Corrections**:
   - Clicks "View Pending Corrections"
   - Sees list of corrections awaiting their approval
   - Reviews employee, times, and reason
   - Clicks Approve or Reject
   - Modal opens for comments/reason
   - Submits approval/rejection
   - System processes based on approval level

3. **Final Approval Processing**:
   - When all approvals received
   - Attendance record updated with corrected times
   - Status changed to 'approved'
   - Original data preserved in TimeCorrection record

## Error Handling

### Validation Errors
- Required fields not provided (400)
- Invalid attendance record (404)
- Unauthorized user (403)
- Request already processed (400)

### Response Codes
- `200` - Successful operation
- `201` - Resource created
- `400` - Bad request / validation error
- `403` - Forbidden / unauthorized
- `404` - Resource not found
- `500` - Server error

## Testing the Feature

### Step 1: User Files Correction
```
1. Login as employee/hr_staff/hr_head
2. Go to Attendance page
3. Click "Correct" on any attendance record
4. Update times and add reason
5. Submit correction
```

### Step 2: Approver Reviews
```
1. Login as approver (supervisor/hr_head/hr_staff)
2. Go to Attendance page
3. Click "View Pending Corrections"
4. Review correction details
5. Click Approve or Reject
6. Add comments/reason and confirm
```

### Step 3: Verify Updates
```
1. Check that:
   - Status updates correctly
   - Attendance record updated (if approved)
   - Approval history preserved
   - Correct approvers notified at each level
```

## Role-Based Access Control (RBAC)

### Who Can Submit Corrections?
- ✓ Employees (for own attendance)
- ✓ HR Staff (for own or department)
- ✓ HR Head (for any attendance)
- ✓ Supervisors (for any attendance)

### Who Can Approve Corrections?
- ✓ Supervisor (approves HR Head corrections)
- ✓ HR Head (approves HR Staff & Employee corrections)
- ✓ HR Staff (approves Employee corrections in department)

### Who Can View Pending?
- ✓ Supervisor (sees HR Head corrections)
- ✓ HR Head (sees HR Staff & Employee corrections)
- ✓ HR Staff (sees Employee corrections)

## Status Transitions

```
pending → approved (final approval received)
        → rejected (any approver rejects)

approved → [END STATE] (attendance updated, correction complete)
rejected → [END STATE] (no changes made)
```

## Future Enhancements

1. **Notifications**: Email/in-app notifications to approvers
2. **Audit Trail**: Full audit logging of all approvals
3. **Reports**: Time correction history and statistics
4. **Bulk Actions**: Process multiple corrections at once
5. **Templates**: Pre-defined reasons for common correction types
6. **Appeals**: Allow appeals for rejected corrections
7. **Auto-Approval**: For corrections within threshold

## Troubleshooting

### Correction Not Appearing in Pending
- Check user role has approval permission
- Verify correction status is 'pending'
- Confirm user is in correct approval level

### Attendance Record Not Updating After Approval
- Verify all required approvals are complete
- Check correction status is 'approved'
- Ensure attendance record ID is valid

### CORS Errors When Submitting
- Check API endpoint is registered in server.js
- Verify CORS middleware is configured
- Check token is valid and not expired

## API Registration

The time correction routes are registered in `/backend/server.js`:

```javascript
app.use('/api/time-correction', timeCorrectionRoutes);
```

All endpoints under `/api/time-correction/` are available via:
- `/request` - Submit correction
- `/pending-approvals` - Get pending corrections
- `/:id/approve` - Approve correction
- `/:id/reject` - Reject correction
- `/my-requests` - Get own submissions
