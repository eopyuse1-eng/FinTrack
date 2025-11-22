# Treasury Voucher System - Architecture & Data Flow

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          FINTRACK APPLICATION                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────── FRONTEND (React) ──────────────────┐          │
│  │                                                      │          │
│  │  ┌──────────────────────────────────────────────┐   │          │
│  │  │  Unified Dashboard Header                    │   │          │
│  │  │  [Menu] [Title] [🎟️ Voucher Badge] [More]   │   │          │
│  │  │         ↑ Shows count if low stock           │   │          │
│  │  └──────────────────────────────────────────────┘   │          │
│  │           ↓ (Auto-refresh every 30s)               │          │
│  │  ┌──────────────────────────────────────────────┐   │          │
│  │  │  Dashboard Content Area (Dynamic)            │   │          │
│  │  │  ┌─────────────────────────────────────────┐ │   │          │
│  │  │  │ Treasury Dashboard:                     │ │   │          │
│  │  │  │ ├─ 🎟️ Voucher System                   │ │   │          │
│  │  │  │ │  ├─ Create Form                      │ │   │          │
│  │  │  │ │  ├─ Voucher Grid (Cards)            │ │   │          │
│  │  │  │ │  └─ Detail Modal                    │ │   │          │
│  │  │  │ └─ Other Sections                      │ │   │          │
│  │  │  │                                        │ │   │          │
│  │  │  │ HR Head Dashboard:                     │ │   │          │
│  │  │  │ ├─ 🔄 Voucher Replenishment          │ │   │          │
│  │  │  │ │  ├─ Low-Stock Tab                   │ │   │          │
│  │  │  │ │  ├─ All Vouchers Tab                │ │   │          │
│  │  │  │ │  ├─ Voucher Cards                   │ │   │          │
│  │  │  │ │  └─ Replenish Modal                 │ │   │          │
│  │  │  │ └─ Other Sections                      │ │   │          │
│  │  │  └─────────────────────────────────────────┘ │   │          │
│  │  └──────────────────────────────────────────────┘   │          │
│  └──────────────────────────────────────────────────────┘          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────┐          │
│  │  HTTP Requests (Authorization Bearer Token)          │          │
│  └──────────────────────────────────────────────────────┘          │
│                           ↕                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────── BACKEND (Express.js) ─────────────┐          │
│  │                                                      │          │
│  │  ┌──────────────────────────────────────────────┐   │          │
│  │  │  API Routes (/api/vouchers)                  │   │          │
│  │  │  ├─ POST   / (create)          [Treasury]   │   │          │
│  │  │  ├─ GET    / (list)            [Auth]       │   │          │
│  │  │  ├─ GET    /:id (details)      [Auth]       │   │          │
│  │  │  ├─ GET    /low-stock (alerts) [Auth]       │   │          │
│  │  │  ├─ POST   /:id/use (deduct)   [Auth]       │   │          │
│  │  │  ├─ POST   /:id/replenish      [HR Head]    │   │          │
│  │  │  └─ POST   /:id/status         [Treasury]   │   │          │
│  │  └──────────────────────────────────────────────┘   │          │
│  │           ↕ (JSON Request/Response)                 │          │
│  │  ┌──────────────────────────────────────────────┐   │          │
│  │  │  Voucher Controller                          │   │          │
│  │  │  ├─ createVoucher()       [Validation]       │   │          │
│  │  │  ├─ getVouchers()         [Filtering]        │   │          │
│  │  │  ├─ getVoucherDetails()   [Aggregation]      │   │          │
│  │  │  ├─ useVouchers()         [Stock Deduct]     │   │          │
│  │  │  ├─ replenishVouchers()   [Stock Add]        │   │          │
│  │  │  ├─ updateVoucherStatus() [Status Update]    │   │          │
│  │  │  └─ getLowStockVouchers() [Query]            │   │          │
│  │  └──────────────────────────────────────────────┘   │          │
│  │           ↕ (CRUD Operations)                       │          │
│  │  ┌──────────────────────────────────────────────┐   │          │
│  │  │  Data Models (Mongoose)                      │   │          │
│  │  │  ├─ Voucher                                  │   │          │
│  │  │  │  ├─ Code, Type, Stock (3 types)         │   │          │
│  │  │  │  ├─ Value, Validity Dates               │   │          │
│  │  │  │  ├─ Status, Threshold                   │   │          │
│  │  │  │  └─ Audit fields (createdBy, etc)       │   │          │
│  │  │  │                                          │   │          │
│  │  │  ├─ VoucherTransaction                      │   │          │
│  │  │  │  ├─ Type (used, replenished, etc)       │   │          │
│  │  │  │  ├─ Quantity, User refs                 │   │          │
│  │  │  │  ├─ Reference (expense, trip)           │   │          │
│  │  │  │  └─ Approval status, timestamps         │   │          │
│  │  │  │                                          │   │          │
│  │  │  └─ Integrated Models                       │   │          │
│  │  │     ├─ User (createdBy, usedBy, etc)       │   │          │
│  │  │     └─ AuditLog (all operations)           │   │          │
│  │  └──────────────────────────────────────────────┘   │          │
│  └──────────────────────────────────────────────────────┘          │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────── DATABASE (MongoDB) ─────────────┐            │
│  │                                                    │            │
│  │  ┌──────────────────────────────────────────────┐ │            │
│  │  │  vouchers collection                         │ │            │
│  │  │  ├─ _id                                      │ │            │
│  │  │  ├─ voucherCode (unique index)              │ │            │
│  │  │  ├─ voucherType, totalStock, value          │ │            │
│  │  │  ├─ availableStock, usedStock, expiredStock │ │            │
│  │  │  ├─ status, validUntil                      │ │            │
│  │  │  ├─ lowStockThreshold                       │ │            │
│  │  │  ├─ createdBy (User ref)                    │ │            │
│  │  │  └─ timestamps (createdAt, updatedAt)       │ │            │
│  │  └──────────────────────────────────────────────┘ │            │
│  │                                                    │            │
│  │  ┌──────────────────────────────────────────────┐ │            │
│  │  │  vouchertransactions collection              │ │            │
│  │  │  ├─ _id                                      │ │            │
│  │  │  ├─ voucher (Voucher ref)                   │ │            │
│  │  │  ├─ transactionType (enum)                  │ │            │
│  │  │  ├─ quantity, usedBy (User ref)            │ │            │
│  │  │  ├─ referenceId, referenceType             │ │            │
│  │  │  ├─ approvalStatus, recordedBy              │ │            │
│  │  │  └─ timestamps (index)                      │ │            │
│  │  └──────────────────────────────────────────────┘ │            │
│  │                                                    │            │
│  │  ┌──────────────────────────────────────────────┐ │            │
│  │  │  auditlogs collection (Existing)             │ │            │
│  │  │  ├─ action: "voucher_created"               │ │            │
│  │  │  ├─ action: "voucher_used"                  │ │            │
│  │  │  ├─ action: "voucher_replenished"           │ │            │
│  │  │  └─ Full audit trail of all changes         │ │            │
│  │  └──────────────────────────────────────────────┘ │            │
│  └────────────────────────────────────────────────────┘            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. Create Voucher Flow
```
Treasury Staff
    ↓
Input Form (Validation)
    ↓
Submit POST /api/vouchers
    ↓
Backend Validation
├─ Check duplicate code
├─ Validate date range
├─ Check stock > 0
└─ Check value > 0
    ↓
Create Voucher Document
├─ totalStock = availableStock
├─ usedStock = 0
├─ expiredStock = 0
└─ status = "active"
    ↓
Log VoucherTransaction (created)
    ↓
Log AuditLog (voucher_created)
    ↓
Return Response {success, data}
    ↓
Frontend
├─ Show Success Toast
├─ Clear Form
├─ Refresh Voucher List
└─ Update UI
```

### 2. Use Voucher Flow
```
Staff/System
    ↓
Request: POST /api/vouchers/:id/use?quantity=X
    ↓
Backend Validation
├─ Check quantity > 0
├─ Check availableStock >= quantity
├─ Check not expired
└─ Check status = "active"
    ↓
Deduct Stock
├─ availableStock -= quantity
├─ usedStock += quantity
└─ Save to database
    ↓
Check Low Stock
└─ If availableStock <= threshold
   → Set low-stock flag in response
    ↓
Log VoucherTransaction (used)
└─ Include usedBy, quantity, timestamp
    ↓
Log AuditLog (voucher_used)
    ↓
Return Response {success, newBalance, isLowStock}
    ↓
Frontend
├─ Update display
├─ Show confirmation
└─ (Optional) Show replenish prompt if low
```

### 3. Replenish Voucher Flow
```
HR Head
    ↓
Select Low-Stock Voucher
    ↓
Input Quantity & Description
    ↓
Request: POST /api/vouchers/:id/replenish
    ↓
Authorization Check
├─ Verify hr_head role ✓
└─ Otherwise → 403 Forbidden
    ↓
Backend Validation
├─ Check quantity > 0
├─ Check voucher exists
└─ Check status = "active"
    ↓
Add Stock
├─ totalStock += quantity
├─ availableStock += quantity
└─ Save to database
    ↓
Log VoucherTransaction (replenished)
├─ Include hr_head user
├─ Include quantity
├─ Include description
└─ Include timestamp
    ↓
Log AuditLog (voucher_replenished)
    ↓
Return Response {success, newTotal, newAvailable}
    ↓
Frontend
├─ Show Success Toast
├─ Update card display
├─ Refresh low-stock list
└─ Close modal
```

### 4. Low-Stock Alert Flow
```
Real-Time Alert System (Every 30s)
    ↓
VoucherNotifications Component
    ├─ Check user role
    ├─ Verify Treasury or HR Head
    └─ Otherwise → Don't fetch
    ↓
Request: GET /api/vouchers/low-stock
    ↓
Backend Query
├─ Find all Vouchers where:
│  ├─ status = "active"
│  ├─ availableStock <= lowStockThreshold
│  └─ validUntil > today
└─ Sort by availableStock ASC
    ↓
Return {success, data: [vouchers]}
    ↓
Frontend Update
├─ If count > 0:
│  ├─ Show badge with count
│  ├─ Display 🎟️ icon (red)
│  └─ Make clickable
│
└─ If count = 0:
   └─ Hide badge
    ↓
User Clicks Badge
    ↓
Expand Dropdown
├─ Show list of low-stock items
├─ Display stock percentages
├─ Show stock bars
└─ Quick link to replenishment
    ↓
Click on Voucher
    ↓
Navigate to Replenishment Page
└─ Pre-select that voucher
```

## Role-Based Access Control Matrix

```
                    Treasury  HR Head  Employee  Others
Create Voucher        ✅       ❌       ❌       ❌
View All Vouchers     ✅       ✅       ✅ (own)  ❌
View Details          ✅       ✅       ✅       ❌
Use Vouchers          ✅       ❌       ⚠️       ❌
Replenish Stock       ❌       ✅       ❌       ❌
Update Status         ✅       ⚠️       ❌       ❌
View Low Stock        ✅       ✅       ❌       ❌
Access Dashboard      ✅       ✅       ✅       ❌

✅ = Full Access
⚠️ = Limited/Conditional
❌ = No Access
```

## State Management Flow

```
Frontend State
├─ vouchers: Array<Voucher>
│  └─ Updated on: create, delete, list, replenish
│
├─ selectedVoucher: Voucher | null
│  └─ Updated on: card click, modal close
│
├─ loading: boolean
│  └─ Set during fetch operations
│
├─ error: string | null
│  └─ Set on API errors
│
├─ success: string | null
│  └─ Set on successful operations
│
├─ filter: string (status)
│  └─ Controls which vouchers displayed
│
├─ activeTab: string (low-stock | all)
│  └─ Replenishment page tab state
│
└─ lowStockCount: number
   └─ Badge notification count
```

## Database Relationships

```
┌─────────────────────┐
│      Voucher        │
├─────────────────────┤
│ _id                 │
│ voucherCode (unique)│
│ voucherType (enum)  │
│ totalStock          │
│ availableStock      │
│ usedStock           │
│ expiredStock        │
│ voucherValue        │
│ currency            │
│ validFrom           │
│ validUntil          │
│ status (enum)       │
│ lowStockThreshold   │
│ createdBy → ┐       │
│ lastModifiedBy → ┐  │
│ timestamps      │   │
└─────────────────────┘
                      │
        ┌─────────────┴──────────────┐
        │                            │
    (1:N)                        (1:N)
        │                            │
        ↓                            ↓
┌──────────────────────┐    ┌─────────────────────┐
│ VoucherTransaction   │    │ AuditLog            │
├──────────────────────┤    ├─────────────────────┤
│ _id                  │    │ _id                 │
│ voucher → Voucher    │    │ model               │
│ transactionType (enum)    │ action              │
│ quantity             │    │ userId → User       │
│ usedBy → User        │    │ details             │
│ referenceId          │    │ timestamp           │
│ referenceType        │    │ ...                 │
│ description          │    └─────────────────────┘
│ approvalStatus       │
│ recordedBy → User    │
│ timestamps           │
└──────────────────────┘
        ↕
    (Many:One)
        ↕
┌─────────────────────┐
│        User         │
├─────────────────────┤
│ _id                 │
│ firstName           │
│ lastName            │
│ role (enum)         │
│ department          │
│ email               │
│ ...                 │
└─────────────────────┘
```

## API Response Schema

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "_id": "ObjectId",
    "voucherCode": "VOUCH-0001-2024",
    "voucherType": "travel",
    "totalStock": 100,
    "availableStock": 95,
    "usedStock": 5,
    "expiredStock": 0,
    "voucherValue": 500,
    "status": "active",
    "validFrom": "2024-01-01T00:00:00Z",
    "validUntil": "2024-12-31T23:59:59Z",
    "lowStockThreshold": 10,
    "createdBy": { "firstName": "John", "lastName": "Doe" },
    "createdAt": "2024-01-01T10:00:00Z",
    "updatedAt": "2024-01-15T14:30:00Z"
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "voucherCode",
      "message": "Code already exists"
    }
  ]
}
```

---

## Summary

The Treasury Voucher System follows a clean **3-tier architecture**:
1. **Frontend** (React): User Interface & State Management
2. **Backend** (Express): API Routes & Business Logic
3. **Database** (MongoDB): Data Persistence & Audit Trail

All components are loosely coupled, role-based access is enforced at every layer, and comprehensive audit logging ensures compliance and accountability.
