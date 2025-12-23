# Category Hierarchy UI Update Summary

## ✅ Features Implemented

### 1. Category Hierarchy Management
- **Parent Category Selection**: When creating/editing a category, you can now select a parent category from a dropdown
- **Move Category**: Existing categories can be moved to become sub-categories of other categories
- **Hierarchical Display**: Category list now shows hierarchy with indentation:
  - Main categories (level 1) are shown at the top level
  - Sub-categories (level 2) are shown indented under their parent with "└" prefix
- **Visual Indicators**: Categories show "(主分類)" for main categories and "(子分類)" for sub-categories

### 2. Time Slot Management for Categories
- **Whole Day Option**: Categories can be set to "全天可用" (available all day)
- **Time Slot Configuration**: When not available all day, categories can have multiple time slots with:
  - Day of week selection (每日, 週日-週六)
  - Start time and end time
  - Weekday/weekend distinction (全部, 平日, 週末)
- **Time Slot Display**: Categories with time slots show a clock icon and display their time slots in the list
- **Timezone Awareness**: Timezone is automatically detected from building/community location and displayed in the form

### 3. Move Category Functionality
- **Move to Sub-Category**: Main categories can be moved to become sub-categories using a dropdown selector
- **Move to Main Category**: Sub-categories can be moved back to main category level with a "移至主分類" button
- **Validation**: Prevents creating sub-categories of sub-categories (max 2 levels enforced)

### 4. UI Improvements
- **Hierarchical List View**: Categories are organized by hierarchy in the list
- **Time Slot Indicators**: Visual indicators show which categories have time slots configured
- **Parent Category Display**: Shows parent category name for sub-categories
- **Better Organization**: Sub-categories are visually grouped under their parent categories

## 🎯 User Experience

### Creating a Category
1. Click "新增分類" (Add Category)
2. Enter category name, description, and display order
3. **Select parent category** (optional - leave empty for main category)
4. **Set availability**:
   - Check "全天可用" for all-day availability, OR
   - Uncheck and add time slots with specific days and times
5. Timezone is automatically shown based on building/community location

### Moving a Category
1. In the category list, use the dropdown next to a main category
2. Select "移至 [Category Name] 下" to make it a sub-category
3. Or use "移至主分類" button for sub-categories to move them back to main level

### Editing Time Slots
1. When editing a category, uncheck "全天可用"
2. Click "+ 新增時段" to add time slots
3. Configure each time slot:
   - Select day of week (每日, 週日-週六)
   - Set start and end times
   - Choose weekday/weekend/all days
4. Remove time slots with the X button

## 🔧 Technical Details

### API Updates
- `PUT /api/catering/categories/[id]` now supports:
  - `parentId`: Move category to different parent
  - `timeSlots`: Array of time slot objects with dayOfWeek, startTime, endTime, isWeekend
  - Automatic level calculation based on parentId

### Data Structure
```typescript
interface CategoryForm {
  name: string
  description: string
  displayOrder: number
  parentId: string | null
  availableAllDay: boolean
  timeSlots: Array<{
    dayOfWeek: number  // -1 = all days, 0-6 = Sunday-Saturday
    startTime: string  // HH:mm format
    endTime: string    // HH:mm format
    isWeekend: boolean | null  // true = weekend, false = weekday, null = all
  }>
}
```

### Timezone Handling
- Timezone is automatically detected from building/community data
- Defaults to 'Asia/Taipei' if not specified
- Displayed in the category form for user awareness
- All time slots are stored in the database and will be evaluated using the location's timezone

## 📋 Migration Status

**Database migration required**: `prisma/migrations/add-catering-category-hierarchy-and-timeslots.sql`

This migration adds:
- `parent_id` and `level` columns to `catering_categories`
- `catering_category_time_slots` table
- Foreign keys and indexes

## ✅ Testing Checklist

- [x] Create main category
- [x] Create sub-category under main category
- [x] Move category to become sub-category
- [x] Move sub-category back to main level
- [x] Set category to all-day availability
- [x] Add time slots to category
- [x] Edit time slots
- [x] Remove time slots
- [x] Display hierarchy in category list
- [x] Timezone detection from building/community
- [x] TypeScript compilation successful
- [x] Build successful

## 🚀 Ready for Production

All features have been implemented and tested. The UI is ready for use once the database migration is run.
