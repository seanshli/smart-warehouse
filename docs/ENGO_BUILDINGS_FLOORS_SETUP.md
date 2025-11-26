# enGo Smart Home Buildings - Floors and Units Setup

**Date:** 2025-11-26  
**Status:** ✅ **COMPLETED**

---

## 📋 Setup Summary

All 3 buildings in the enGo Smart Home community have been set up with:
- **3 floors** per building (Floor 1, 2, 3)
- **5 units** per floor (A, B, C, D, E)
- **15 households** per building (3 floors × 5 units)
- **15 mailboxes** per building (linked to each household)

---

## 🏢 Buildings Setup

### 1. 三重合野 (Sanchong Heye)
- **Building ID:** `78ddf2a4-8567-4f95-a6be-c8d5c5297410`
- **Floors:** 3
- **Households:** 15
- **Mailboxes:** 15
- **Units:** 1A-1E, 2A-2E, 3A-3E

### 2. 台中大雅 (Taichung Daya)
- **Building ID:** `f2846a7c-08dd-4db9-89cc-6aacafb7eaee`
- **Floors:** 3
- **Households:** 15
- **Mailboxes:** 15
- **Units:** 1A-1E, 2A-2E, 3A-3E

### 3. 台北八德路 (Taipei Bade Road)
- **Building ID:** `4bd2b3b3-0261-4222-b9bc-88c752f6646f`
- **Floors:** 3
- **Households:** 15
- **Mailboxes:** 15
- **Units:** 1A-1E, 2A-2E, 3A-3E

---

## 📊 Totals

- **Total Floors:** 9 (3 buildings × 3 floors)
- **Total Households:** 45 (3 buildings × 15 households)
- **Total Mailboxes:** 45 (3 buildings × 15 mailboxes)

---

## 🏗️ Structure

Each building follows this structure:

```
Building
├── Floor 1 (Residential)
│   ├── Unit 1A → Household + Mailbox 1A
│   ├── Unit 1B → Household + Mailbox 1B
│   ├── Unit 1C → Household + Mailbox 1C
│   ├── Unit 1D → Household + Mailbox 1D
│   └── Unit 1E → Household + Mailbox 1E
├── Floor 2 (Residential)
│   ├── Unit 2A → Household + Mailbox 2A
│   ├── Unit 2B → Household + Mailbox 2B
│   ├── Unit 2C → Household + Mailbox 2C
│   ├── Unit 2D → Household + Mailbox 2D
│   └── Unit 2E → Household + Mailbox 2E
└── Floor 3 (Residential)
    ├── Unit 3A → Household + Mailbox 3A
    ├── Unit 3B → Household + Mailbox 3B
    ├── Unit 3C → Household + Mailbox 3C
    ├── Unit 3D → Household + Mailbox 3D
    └── Unit 3E → Household + Mailbox 3E
```

---

## 🚀 Setup Script

The setup was performed using:

```bash
npm run setup:engo-floors
```

**Script Location:** `scripts/setup-engo-buildings-floors.ts`

---

## 📝 Details

### Floors
- All floors are marked as **residential** (`isResidential: true`)
- Floor names: `Floor 1`, `Floor 2`, `Floor 3`
- Each floor has a description: `Residential floor X with 5 units (A, B, C, D, E)`

### Households
- Each household is named: `Unit {floorNumber}{unit}` (e.g., `Unit 1A`, `Unit 2B`)
- `apartmentNo` field: `{floorNumber}{unit}` (e.g., `1A`, `2B`)
- Linked to their respective floor via `floorId` and `floorNumber`
- Linked to building via `buildingId`

### Mailboxes
- Each mailbox number matches the unit number (e.g., `1A`, `2B`, `3C`)
- Location: `Common Area - Mailbox Section`
- Linked to corresponding household via `householdId`
- Linked to floor via `floorId`
- Initial status: `hasMail: false`

---

## ✅ Verification

To verify the setup:

1. **Check Building Details:**
   - Navigate to each building page
   - Verify floor count shows 3
   - Verify unit count shows 15

2. **Check Floors:**
   - View floors tab in building page
   - Should see 3 floors listed

3. **Check Households:**
   - View households tab in building page
   - Should see 15 households grouped by floor
   - Each floor should have 5 units (A, B, C, D, E)

4. **Check Mailboxes:**
   - View mailboxes tab in building page
   - Should see 15 mailboxes
   - Each mailbox should be linked to a household

---

## 🔄 Re-running the Script

The script uses `upsert` operations, so it's safe to run multiple times:
- Existing floors will be updated (not duplicated)
- Existing households will be updated (not duplicated)
- Existing mailboxes will be updated (not duplicated)

To re-run:

```bash
npm run setup:engo-floors
```

---

## 📋 Unit Naming Convention

- **Format:** `{floorNumber}{unitLetter}`
- **Examples:**
  - Floor 1, Unit A → `1A`
  - Floor 2, Unit B → `2B`
  - Floor 3, Unit E → `3E`

---

**Last Updated:** 2025-11-26  
**Status:** ✅ **SETUP COMPLETE**

