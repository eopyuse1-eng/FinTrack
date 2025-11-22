# Voucher System - Quick Reference Guide

## 🚀 Quick Start

### For Treasury Staff - Creating Vouchers
1. Dashboard → 🎟️ Voucher System
2. Click "+ Create Voucher Batch"
3. Fill in form:
   - **Code**: VOUCH-0001-2024 (unique)
   - **Type**: travel/meal/accommodation/equipment
   - **Stock**: 100 units
   - **Value**: ₱500 per unit
   - **Valid Until**: Select end date
   - **Threshold**: 10 (for low-stock alert)
4. Submit → Done! ✅

### For HR Head - Replenishing Stock
1. Dashboard → 🔄 Voucher Replenishment
2. Click on low-stock voucher card (red/orange indicator)
3. Enter quantity to add
4. (Optional) Add reason/description
5. Click "Confirm Replenishment"
6. Stock updated instantly ✅

### For Everyone - View Low Stock Alerts
1. Check header for 🎟️ badge with number
2. Click badge to see which vouchers are low
3. Click links to go to replenishment page
4. Notifications auto-refresh every 30 seconds ✅

## 📊 Stock Status Colors

| Color | Status | Percentage | Action |
|-------|--------|-----------|--------|
| 🟢 GREEN | HIGH | 76-100% | No action needed |
| 🟡 YELLOW | MEDIUM | 51-75% | Monitor |
| 🟠 ORANGE | LOW | 26-50% | **Replenish Soon** |
| 🔴 RED | CRITICAL | 0-25% | **Replenish Immediately** |

## 🔑 Key Features

### Voucher Creation (Treasury Only)
```
Voucher Code → Unique identifier
Voucher Type → Category of voucher
Total Stock → Number of units
Voucher Value → Price per unit (₱)
Valid From/Until → Date range
Low Stock Threshold → Alert trigger level
Description → Optional notes
```

### Stock Tracking
```
Total Stock = Base inventory
Available = Ready to use
Used = Already consumed
Expired = Past validity date
```

### Replenishment (HR Head Only)
```
Select Low-Stock Voucher
Enter Quantity to Add
Add Reason/Notes
Confirm → Auto-logged in audit trail
```

## 🔐 Access Control

| Role | Can Create | Can Replenish | Can View | Can Use |
|------|-----------|---------------|---------|---------|
| Treasury | ✅ YES | ❌ NO | ✅ YES | ✅ YES |
| HR Head | ❌ NO | ✅ YES | ✅ YES | ❌ NO |
| Others | ❌ NO | ❌ NO | ✅ YES | ❌ NO |

## 📱 Navigation Paths

### Treasury Employee Dashboard
```
Menu → 🎟️ Voucher System
  ├─ Create Batch
  ├─ View All
  ├─ Filter by Status
  ├─ View Details
  └─ Use Vouchers
```

### HR Head Dashboard
```
Menu → 🔄 Voucher Replenishment
  ├─ Tab: Low Stock Alerts
  ├─ Tab: All Active Vouchers
  ├─ Click Card to Replenish
  ├─ Enter Quantity
  └─ Confirm
```

### Header Alerts
```
Header → 🎟️ Badge (if low stock exists)
  ├─ Shows count of low-stock vouchers
  ├─ Dropdown list with details
  └─ Quick click to replenishment page
```

## 🔄 Transaction Flow

### Creating Voucher
```
Treasury Staff Creates → Validation → Database Insert
                      ↓
              AuditLog Entry → VoucherTransaction Created
                      ↓
              Success Response → Grid Updated
```

### Using Voucher
```
Staff Clicks "Use" → Quantity Check → Stock Deduction
                  ↓
          Expiry Validation → Transaction Created
                  ↓
          Low Stock Check → Audit Log → Response
```

### Replenishing Voucher
```
HR Head Selects → Quantity Input → HR_HEAD Role Check
                ↓
        Stock Addition → Transaction Created
                ↓
        Audit Log Entry → Success Response
```

## 📊 Real-Time Notifications

### What Triggers Alerts?
- Stock falls below threshold
- Checks every 30 seconds
- Auto-refresh on all pages
- Only for Treasury/HR Head roles

### Alert Indicator
- 🎟️ Emoji in header
- Red badge showing count
- Click to expand dropdown
- Shows all low-stock items

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't create voucher | Check if Treasury role assigned |
| Can't replenish | Check if HR Head role assigned |
| No alerts showing | Refresh page or wait 30 seconds |
| Form validation error | Check all required fields filled |
| Stock not updating | Reload page or try again |

## 📋 Form Requirements

### Create Voucher Form
```
✓ Voucher Code (required, unique)
✓ Voucher Type (required)
✓ Total Stock (required, > 0)
✓ Voucher Value (required, > 0)
✓ Valid From (required)
✓ Valid Until (required, after Valid From)
✓ Low Stock Threshold (optional, default 10)
  Description (optional)
```

### Replenish Form
```
✓ Select Voucher (required)
✓ Quantity (required, > 0)
  Description (optional)
```

## 🎯 Best Practices

1. **Code Naming**: Use consistent format like `VOUCH-XXXX-YYYY`
2. **Thresholds**: Set to ~10-20% of total stock
3. **Expiry Dates**: Give 3-6 month validity period
4. **Replenishment**: Check alerts daily to maintain stock
5. **Documentation**: Add description for audit trail clarity

## 📞 Support Info

**Backend Endpoint**: `http://localhost:5000/api/vouchers`

**Available Endpoints**:
- POST   /api/vouchers (create)
- GET    /api/vouchers (list)
- GET    /api/vouchers/:id (details)
- POST   /api/vouchers/:id/use (deduct)
- POST   /api/vouchers/:id/replenish (add)
- POST   /api/vouchers/:id/status (update)
- GET    /api/vouchers/low-stock (alerts)

**Response Format**:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* result */ }
}
```

## 🎓 Training Checklist

- [ ] Treasury staff trained on creation
- [ ] HR Head trained on replenishment
- [ ] Everyone shown alert notification system
- [ ] Test create/use/replenish workflows
- [ ] Verify role-based access
- [ ] Test low-stock scenarios
- [ ] Review audit trail logging
- [ ] Check error message clarity

---

**Last Updated**: 2024
**Status**: ✅ Production Ready
**Version**: 1.0
