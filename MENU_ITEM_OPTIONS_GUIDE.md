# Menu Item Options/Selections Guide

## ✅ Feature Implemented

Menu items can now have configurable **options** with **selections**. This allows you to define custom options for each menu item (e.g., "Vegetarian: Yes/No", "Spice Level: no, 1x pepper, 2x pepper, 3x pepper").

## 📋 Database Schema

### New Tables Created

1. **`catering_menu_item_options`** - Stores options for menu items
   - `option_name`: Name of the option (e.g., "Vegetarian", "Spice Level")
   - `option_type`: Type of option ('select', 'radio', 'checkbox')
   - `is_required`: Whether this option must be selected
   - `display_order`: Order for display

2. **`catering_menu_item_option_selections`** - Stores available selections for each option
   - `selection_name`: Display name (e.g., "Yes", "No", "1x pepper")
   - `selection_value`: Value for API use (e.g., "yes", "no", "1x pepper")
   - `display_order`: Order for display

## 🎯 How to Use

### Creating Options for a Menu Item

1. **Open Menu Item Form**: Click "新增項目" (Add Item) or edit an existing item
2. **Scroll to Options Section**: Find "選項設定 (Options/Selections)" section
3. **Add Option**: Click "+ 新增選項" (Add Option)
4. **Configure Option**:
   - **Option Name**: Enter the option name (e.g., "素食", "辣度")
   - **Option Type**: Choose from:
     - 下拉選單 (Select/Dropdown)
     - 單選 (Radio buttons)
     - 複選 (Checkboxes)
   - **Required**: Check if this option must be selected
5. **Add Selections**: Click "+ 新增選項值" (Add Selection) for each option
   - **Display Name**: What users see (e.g., "Yes", "No", "1x pepper")
   - **Value**: Value used by API (e.g., "yes", "no", "1x pepper")
6. **Save**: Click "建立" or "更新" to save

### Example Configuration

**Option 1: Vegetarian (素食)**
- Type: Select
- Required: Yes
- Selections:
  - Display: "是", Value: "yes"
  - Display: "否", Value: "no"

**Option 2: Spice Level (辣度)**
- Type: Select
- Required: No
- Selections:
  - Display: "不辣", Value: "no"
  - Display: "1倍辣", Value: "1x pepper"
  - Display: "2倍辣", Value: "2x pepper"
  - Display: "3倍辣", Value: "3x pepper"

## 🔧 Technical Details

### API Endpoints

**Create Menu Item with Options:**
```javascript
POST /api/catering/menu
{
  // ... other fields
  options: [
    {
      optionName: "Vegetarian",
      optionType: "select",
      isRequired: true,
      displayOrder: 0,
      selections: [
        { selectionName: "Yes", selectionValue: "yes", displayOrder: 0 },
        { selectionName: "No", selectionValue: "no", displayOrder: 1 }
      ]
    }
  ]
}
```

**Update Menu Item with Options:**
```javascript
PUT /api/catering/menu/[id]
{
  // ... other fields
  options: [ /* same structure as create */ ]
}
```

### Data Structure

```typescript
interface MenuItemOption {
  id?: string
  optionName: string
  optionType: 'select' | 'radio' | 'checkbox'
  isRequired: boolean
  displayOrder: number
  selections: Array<{
    id?: string
    selectionName: string
    selectionValue: string
    displayOrder: number
  }>
}
```

## 📝 Migration Required

**Run this migration on Supabase:**
```sql
-- File: prisma/migrations/add-menu-item-options.sql
```

This migration creates:
- `catering_menu_item_options` table
- `catering_menu_item_option_selections` table
- Foreign keys and indexes

## ✅ Features

- ✅ Multiple options per menu item
- ✅ Multiple selections per option
- ✅ Option types: select, radio, checkbox
- ✅ Required/optional options
- ✅ Display order control
- ✅ Full CRUD operations
- ✅ Options included in menu item API responses

## 🚀 Next Steps

1. Run the database migration
2. Create menu items with options
3. Options will be available when users order items
4. Frontend ordering UI will need to be updated to display and capture these options

## 📌 Notes

- Options are stored at the menu item level
- When ordering, users will select from these predefined options
- The current order system already supports `isVegetarian` and `spiceLevel` - these can now be configured per menu item
- Options are fully customizable - you can create any option with any selections
