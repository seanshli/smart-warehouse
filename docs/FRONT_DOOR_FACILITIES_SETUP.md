# Front Door and Facilities Setup Guide

**Date:** 2025-11-26  
**Status:** ⚠️ **DATABASE MIGRATION REQUIRED**

---

## 📋 Overview

This document describes the new front door and facilities features that have been implemented:

1. **Front Door Features:**
   - Door bells (similar to mailboxes) - triggers alarm to household
   - Mailboxes (moved from common area to front door)
   - Package room with 10 lockers

2. **Facilities (Floor 2):**
   - Gym
   - Meeting Room #1
   - Meeting Room #2
   - Calendar for operation hours (building admin can edit)
   - Reservation system with approval and access codes

3. **Building Structure Changes:**
   - **Floor 1:** Front Door area (door bells, mailboxes, package room)
   - **Floor 2:** Facilities (Gym, Meeting Room #1, Meeting Room #2)
   - **Floor 3:** Residential units only (5 units: A, B, C, D, E)

---

## 🗄️ Database Migration Required

**⚠️ IMPORTANT:** Before running the setup script, you must run the SQL migration in Supabase.

### Step 1: Run SQL Migration

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `scripts/add-front-door-facilities-schema.sql`
3. Execute the SQL script

This will create the following tables:
- `door_bells` - Door bell system
- `package_lockers` - Package locker system (10 lockers)
- `packages` - Package check-in records
- `facilities` - Facility information (Gym, Meeting Rooms)
- `facility_operating_hours` - Operating hours calendar
- `facility_reservations` - Reservation system

### Step 2: Run Setup Script

After the database migration is complete, run:

```bash
npm run setup:engo-floors
```

This will:
- Update floors 1-3 for all enGo buildings
- Remove households from floors 1-2
- Keep only floor 3 households (5 units: 3A-3E)
- Create door bells for each household
- Move mailboxes to front door
- Create 10 package lockers per building
- Create 3 facilities per building (Gym, Meeting Room #1, Meeting Room #2)
- Set default operating hours (9:00-22:00, Monday-Sunday)

---

## 📊 New Database Models

### DoorBell
- Links to building and household
- Tracks last rung time
- Can be enabled/disabled
- Triggers notifications to household members

### PackageLocker
- 10 lockers per building
- Tracks occupancy status
- Located in "Front Door - Package Room"

### Package
- Check-in record for packages
- Links to locker and household
- Tracks check-in/check-out times and users
- Status: pending, picked_up, expired

### Facility
- Gym, Meeting Room #1, Meeting Room #2
- Located on Floor 2
- Has capacity and type
- Can be active/inactive

### FacilityOperatingHours
- Calendar for operation hours
- One record per day of week (0-6)
- Building admin can edit
- Tracks open/close times and closed status

### FacilityReservation
- Members can reserve time slots
- Status: pending, approved, rejected, completed, cancelled
- Building admin approves and generates access code
- Access code used for entry at reservation time

---

## 🔧 API Routes to Implement

The following API routes need to be created:

### Door Bell
- `POST /api/building/[id]/door-bell/[doorBellNumber]/ring` - Ring door bell (triggers notification)
- `GET /api/building/[id]/door-bell` - List all door bells
- `PUT /api/building/[id]/door-bell/[id]/enable` - Enable/disable door bell

### Package Management
- `POST /api/building/[id]/package/check-in` - Check in package to locker
- `GET /api/building/[id]/package` - List all packages
- `PUT /api/building/[id]/package/[id]/check-out` - Check out package
- `GET /api/building/[id]/package-locker` - List all lockers

### Facility Management
- `GET /api/building/[id]/facility` - List all facilities
- `GET /api/building/[id]/facility/[id]/operating-hours` - Get operating hours
- `PUT /api/building/[id]/facility/[id]/operating-hours` - Update operating hours (admin only)
- `POST /api/building/[id]/facility/[id]/reservation` - Create reservation
- `GET /api/building/[id]/facility/[id]/reservation` - List reservations
- `PUT /api/building/[id]/facility-reservation/[id]/approve` - Approve reservation (admin only)
- `PUT /api/building/[id]/facility-reservation/[id]/reject` - Reject reservation (admin only)
- `GET /api/building/[id]/facility-reservation/[id]/access-code` - Get access code (for approved reservations)

---

## 🎨 UI Components to Implement

### Front Door Panel
- Door bell interface (click to ring, enable/disable)
- Mailbox status display
- Package room interface (locker selection, check-in form)

### Facility Reservation Panel
- Facility list with availability
- Calendar view with operating hours
- Reservation form (select facility, date, time slot)
- Reservation list (pending, approved, rejected)
- Access code display for approved reservations

### Building Admin Panel
- Facility operating hours editor
- Reservation approval interface
- Package check-in interface

---

## 📝 Next Steps

1. ✅ **Schema Updated** - Prisma schema includes all new models
2. ✅ **SQL Migration Script Created** - `scripts/add-front-door-facilities-schema.sql`
3. ✅ **Setup Script Updated** - `scripts/setup-engo-buildings-floors.ts`
4. ⏳ **Run SQL Migration in Supabase** - Execute the SQL script
5. ⏳ **Run Setup Script** - `npm run setup:engo-floors`
6. ⏳ **Create API Routes** - Implement all API endpoints
7. ⏳ **Create UI Components** - Build front door and facility panels
8. ⏳ **Test End-to-End** - Test door bell, package check-in, and facility reservation

---

## 🔔 Notification System

Notifications are automatically created for:
- **Door Bell:** When door bell is rung, all household members receive notification
- **Package:** When package is checked in, household receives notification with locker number
- **Facility Reservation:** When reservation is approved/rejected, household receives notification with access code (if approved)

---

**Last Updated:** 2025-11-26  
**Status:** ⚠️ **AWAITING DATABASE MIGRATION**

