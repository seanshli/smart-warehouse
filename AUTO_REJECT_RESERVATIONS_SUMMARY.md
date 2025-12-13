# Auto-Reject Occupied Time Slots - Implementation Summary

## ✅ Feature Implemented

When a household user tries to reserve a time slot that is already occupied by another household, the system now:

1. **Automatically creates a rejected reservation** (instead of just returning an error)
2. **Returns a specific error code** (`TIME_OCCUPIED` or `CAPACITY_EXCEEDED`)
3. **Shows a clear message** to the user explaining why their reservation was rejected
4. **Stores the rejection reason** in the reservation notes

## 🔧 Changes Made

### Backend API Endpoints

#### 1. `/api/facility/[id]/reservations` (Household Side)
**File**: `app/api/facility/[id]/reservations/route.ts`

**Changes**:
- When time slot is occupied (exclusive facilities): Creates reservation with `status: 'rejected'`
- When capacity exceeded: Creates reservation with `status: 'rejected'`
- Returns `errorCode: 'TIME_OCCUPIED'` or `errorCode: 'CAPACITY_EXCEEDED'`
- Uses HTTP 409 Conflict status code
- Stores rejection reason in `notes` field

#### 2. `/api/building/[id]/facility/[facilityId]/reservation` (Admin Side)
**File**: `app/api/building/[id]/facility/[facilityId]/reservation/route.ts`

**Changes**:
- Same auto-reject logic as household endpoint
- Consistent error codes and status codes

### Frontend Component

#### `FacilityReservationPanel.tsx`
**Changes**:
- Handles `TIME_OCCUPIED` error code specifically
- Shows translated error message
- Automatically refreshes reservations list to show rejected reservation
- Also handles `CAPACITY_EXCEEDED` error code

### Translations

**Added**: `reservationTimeOccupied` translation key
- English: "Time slot is already occupied by another household. Your reservation has been automatically rejected."
- Traditional Chinese: "該時段已被其他住戶預約。您的預約已自動被拒絕。"
- Simplified Chinese: "该时段已被其他住户预约。您的预约已自动被拒绝。"
- Japanese: "この時間帯は既に他の世帯によって予約されています。ご予約は自動的に拒否されました。"

## 📊 Error Codes

### `TIME_OCCUPIED`
- **When**: Time slot is already reserved by another household (exclusive facilities)
- **HTTP Status**: 409 Conflict
- **Response**: Includes `reservation` object (with rejected status), `conflict` info, `nextAvailable` slot

### `CAPACITY_EXCEEDED`
- **When**: Adding this reservation would exceed facility capacity
- **HTTP Status**: 409 Conflict
- **Response**: Includes `reservation` object (with rejected status), `conflict` info with capacity details

## 🔍 Example Response

```json
{
  "success": false,
  "error": "Time slot is already occupied",
  "errorCode": "TIME_OCCUPIED",
  "reservation": {
    "id": "...",
    "status": "rejected",
    "notes": "[Auto-rejected] Time slot occupied by Household A",
    ...
  },
  "conflict": {
    "household": "Household A",
    "startTime": "2025-12-13T09:00:00Z",
    "endTime": "2025-12-13T10:00:00Z"
  },
  "nextAvailable": {
    "startTime": "2025-12-13T10:00:00Z",
    "endTime": "2025-12-13T11:00:00Z"
  }
}
```

## ✅ Benefits

1. **User Experience**: Users see rejected reservations in their list, providing transparency
2. **Audit Trail**: All reservation attempts are recorded, even rejected ones
3. **Clear Feedback**: Specific error codes help frontend show appropriate messages
4. **Consistency**: Both household and admin endpoints behave the same way

## 🧪 Testing

### Test Cases:
1. ✅ Try to reserve an occupied time slot → Should auto-reject with TIME_OCCUPIED
2. ✅ Try to reserve when capacity exceeded → Should auto-reject with CAPACITY_EXCEEDED
3. ✅ Check rejected reservation appears in user's reservation list
4. ✅ Verify rejection reason is stored in notes
5. ✅ Verify frontend shows appropriate error message

## 📝 Notes

- Rejected reservations are stored in the database with `status: 'rejected'`
- Rejection reason is prefixed with `[Auto-rejected]` in the notes field
- HTTP 409 Conflict is used to indicate resource conflict
- Both endpoints (household and admin) use the same logic for consistency

---

**Status**: ✅ **IMPLEMENTED AND TESTED**
