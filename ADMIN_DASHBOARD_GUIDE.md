# Admin Dashboard Guide

## 🎯 Overview

The Smart Warehouse Admin Dashboard provides comprehensive management capabilities for overseeing all households, users, and items in the system. This guide covers all the features and how to use them effectively.

## 🚀 Accessing the Admin Dashboard

### URL
- **Production**: `https://smart-warehouse-five.vercel.app/admin`
- **Local Development**: `http://localhost:3000/admin`

### Authentication
- Only users with admin privileges can access the dashboard
- If you see "Access Denied", ensure your user account has admin permissions

## 📊 Main Dashboard Features

### 1. Statistics Overview
The dashboard displays key metrics at the top:
- **Total Users**: Number of registered users across all households
- **Households**: Number of active households
- **Total Items**: Total inventory items across all households
- **Avg Items/Household**: Average inventory size per household

### 2. Household Management

#### Search & Filter
- **Search Bar**: Search by household name, description, or member emails
- **Real-time Filtering**: Results update as you type
- **Clear Search**: Click "Clear search" to reset filters

#### Household Cards
Each household displays:
- **Basic Info**: Name, creation date, member count, item count
- **Description**: Household description (if provided)
- **Quick Stats**: Visual indicators for rooms, categories, and items

#### Expandable Details
Click "Show Details" to see:

##### Structure Overview
- **Rooms**: List of all rooms in the household with count
- **Categories**: All categories with level indicators (L1, L2, L3)
- **Items**: Total item count with navigation hint

##### Member Management
- **Member Table**: Complete list of household members
- **Role Indicators**: Color-coded role badges (OWNER, USER, VISITOR)
- **Member Actions**:
  - **Reset Password**: Change any member's password
  - **Remove Member**: Remove member from household

##### Household Actions
- **Rename Household**: Change household name
- **Add Member**: Invite new members by email with role assignment
- **Delete Household**: Permanently delete household and all data

## 📦 Items Management

### Accessing Items
- Click "View All Items" button from main dashboard
- Or navigate to `/admin/items`

### Items Page Features

#### Statistics
- **Total Items**: Count of all items across households
- **Households**: Number of households with items
- **Avg Items/Household**: Average inventory size

#### Search & Filtering
- **Search**: Find items by name
- **Household Filter**: Filter items by specific household
- **Real-time Updates**: Results update as you type

#### Items Table
Comprehensive table with sortable columns:

##### Columns
- **Item Name**: Item name with description (if available)
- **Quantity**: Current quantity with minimum quantity indicator
- **Household**: Household name with ID preview
- **Location**: Room → Cabinet hierarchy
- **Category**: Category name with level indicator
- **Created**: Creation date

##### Sorting
Click column headers to sort:
- **Name**: Alphabetical sorting
- **Quantity**: Numerical sorting
- **Household**: Alphabetical by household name
- **Created**: Chronological sorting

## 🎨 User Interface Features

### Design Elements
- **Modern UI**: Clean, professional design with Tailwind CSS
- **Responsive**: Works on desktop, tablet, and mobile
- **Icons**: Consistent Heroicons throughout
- **Color Coding**: Role-based color schemes

### Navigation
- **Header Navigation**: Quick access to different sections
- **Breadcrumbs**: Clear navigation path
- **Back Buttons**: Easy return to main app

### Loading States
- **Spinner**: Loading indicators during data fetch
- **Error Handling**: Clear error messages with recovery options

## 🔧 Administrative Actions

### User Management
- **Password Reset**: Reset any user's password
- **Member Removal**: Remove users from households
- **Role Management**: View and understand user roles

### Household Management
- **Rename**: Change household names
- **Add Members**: Invite new users with specific roles
- **Delete**: Permanently remove households (with confirmation)

### Data Overview
- **Comprehensive View**: See all data across households
- **Search Capabilities**: Find specific information quickly
- **Sorting Options**: Organize data by various criteria

## 📱 Mobile Responsiveness

### Features
- **Responsive Tables**: Horizontal scrolling on mobile
- **Touch-Friendly**: Large buttons and touch targets
- **Adaptive Layout**: Optimized for all screen sizes

## 🚨 Important Notes

### Security
- **Admin Only**: Dashboard requires admin privileges
- **Confirmation Dialogs**: Destructive actions require confirmation
- **Error Handling**: Failed actions show clear error messages

### Data Management
- **Real-time Updates**: Changes reflect immediately
- **Comprehensive View**: See all system data in one place
- **Search & Filter**: Quickly find specific information

### Best Practices
- **Regular Monitoring**: Check dashboard for system health
- **User Management**: Monitor user activity and roles
- **Data Cleanup**: Use household deletion for cleanup

## 🔗 Navigation

### Quick Links
- **Main App**: Return to user interface
- **Admin Items**: View all items across households
- **Admin Dashboard**: Return to household overview

### URL Structure
- `/admin` - Main dashboard
- `/admin/items` - Items management
- `/` - Return to main app

## 📞 Support

For issues with the admin dashboard:
1. Check your admin privileges
2. Verify database connectivity
3. Check browser console for errors
4. Contact system administrator

---

**Note**: The admin dashboard is a powerful tool for system management. Use with care, especially for destructive operations like deleting households or removing members.
