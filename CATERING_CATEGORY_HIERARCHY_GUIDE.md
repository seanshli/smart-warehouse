# Catering Category Hierarchy and Time Slots Guide

## Overview

The catering system now supports:
1. **2-level category hierarchy** (category and sub-category), similar to warehouse categories
2. **Category-level time slots** that are inherited by all menu items in that category
3. **Weekday/weekend distinction** in time slots

## Database Migration

**IMPORTANT:** Run this migration on your Supabase database:

```sql
-- File: prisma/migrations/add-catering-category-hierarchy-and-timeslots.sql
```

The migration:
- Adds `parent_id` and `level` columns to `catering_categories`
- Creates `catering_category_time_slots` table
- Sets up foreign keys and indexes
- Updates existing categories to level 1 (top-level)

## Features

### 1. Category Hierarchy

Categories can now have a parent-child relationship:
- **Level 1 (Top-level)**: Main categories (e.g., "Breakfast", "Lunch", "Dinner")
- **Level 2 (Sub-category)**: Sub-categories under a main category (e.g., "Hot Dishes" under "Lunch")

**Example Structure:**
```
Breakfast (Level 1)
  ├── Hot Items (Level 2)
  └── Cold Items (Level 2)
Lunch (Level 1)
  ├── Main Courses (Level 2)
  └── Sides (Level 2)
```

### 2. Category-Level Time Slots

Time slots can be defined at the category level, and all menu items in that category will inherit these time slots if they don't have their own.

**Time Slot Fields:**
- `dayOfWeek`: 0 = Sunday, 1 = Monday, ..., 6 = Saturday, -1 = All days
- `startTime`: Start time in HH:mm format (e.g., "09:00")
- `endTime`: End time in HH:mm format (e.g., "17:00")
- `isWeekend`: 
  - `true` = Weekend only (Saturday/Sunday)
  - `false` = Weekday only (Monday-Friday)
  - `null` = All days (when combined with specific dayOfWeek)

**Example Time Slots:**
```javascript
// Weekday lunch: Monday-Friday, 11:00-14:00
{
  dayOfWeek: -1,  // All days
  startTime: "11:00",
  endTime: "14:00",
  isWeekend: false
}

// Weekend brunch: Saturday-Sunday, 09:00-12:00
{
  dayOfWeek: -1,  // All days
  startTime: "09:00",
  endTime: "12:00",
  isWeekend: true
}

// Specific day: Monday only, 08:00-10:00
{
  dayOfWeek: 1,  // Monday
  startTime: "08:00",
  endTime: "10:00",
  isWeekend: null
}
```

### 3. Time Slot Inheritance

Menu items inherit time slots from their category in this order:
1. **Item's own time slots** (if defined) - highest priority
2. **Category's time slots** (if item has no time slots)
3. **Available all day** (if no time slots anywhere)

## API Usage

### Create Category with Hierarchy

```javascript
POST /api/catering/categories
{
  "serviceId": "service-id",
  "name": "Lunch",
  "description": "Lunch menu",
  "displayOrder": 1,
  "isActive": true,
  "parentId": null,  // null for top-level
  "level": 1,
  "timeSlots": [
    {
      "dayOfWeek": -1,
      "startTime": "11:00",
      "endTime": "14:00",
      "isWeekend": false
    }
  ]
}
```

### Create Sub-Category

```javascript
POST /api/catering/categories
{
  "serviceId": "service-id",
  "name": "Main Courses",
  "description": "Main course items",
  "displayOrder": 1,
  "isActive": true,
  "parentId": "parent-category-id",  // Reference to parent
  "level": 2,  // Will be auto-set to 2 if parentId is provided
  "timeSlots": []  // Can inherit from parent or define own
}
```

### Get Categories with Hierarchy

```javascript
GET /api/catering/categories?buildingId=xxx&includeInactive=false
```

Response includes:
- `parent`: Parent category info (if sub-category)
- `children`: Array of sub-categories (if top-level)
- `timeSlots`: Array of category time slots

### Get Menu Items with Category Time Slots

```javascript
GET /api/catering/menu?buildingId=xxx
```

Response includes:
- `category.parent`: Parent category info
- `category.timeSlots`: Category time slots
- `timeSlots`: Item's own time slots

## Utility Functions

A utility module is available at `lib/catering-time-slots.ts`:

```typescript
import { 
  getEffectiveTimeSlots, 
  isItemAvailableNow, 
  formatTimeSlot 
} from '@/lib/catering-time-slots'

// Get effective time slots for an item (item's own or category's)
const effectiveSlots = getEffectiveTimeSlots(
  item.timeSlots,
  item.category?.timeSlots,
  item.availableAllDay
)

// Check if item is currently available
const isAvailable = isItemAvailableNow(
  effectiveSlots,
  item.availableAllDay
)

// Format time slot for display
const displayText = formatTimeSlot(slot)
```

## Frontend Integration

The menu display components will automatically:
- Show categories in hierarchical order
- Display category time slots
- Inherit category time slots for items without their own

To use the utility functions in components:

```typescript
import { getEffectiveTimeSlots } from '@/lib/catering-time-slots'

// In your component
const effectiveSlots = getEffectiveTimeSlots(
  menuItem.timeSlots,
  menuItem.category?.timeSlots,
  menuItem.availableAllDay
)
```

## Migration Steps

1. **Run the SQL migration** on your Supabase database:
   ```bash
   # Connect to Supabase and run:
   psql -d your_database -f prisma/migrations/add-catering-category-hierarchy-and-timeslots.sql
   ```

2. **Update existing categories** (optional):
   - Existing categories will be set to `level = 1` automatically
   - You can manually update them to create sub-categories

3. **Add time slots to categories**:
   - Use the admin panel or API to add time slots to categories
   - Menu items will automatically inherit these time slots

## Notes

- Maximum hierarchy depth is **2 levels** (category and sub-category)
- Sub-categories cannot have their own sub-categories
- Time slot inheritance is automatic - items use category time slots if they don't have their own
- The `isWeekend` field allows distinguishing weekday vs weekend availability
- Time slots can span midnight (e.g., 22:00 to 02:00)
