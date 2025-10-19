# Admin Panel Setup Guide

## 🎯 Overview

This guide will help you set up the Smart Warehouse Admin Panel with proper authentication and access controls. The admin panel is completely separate from the main application and requires special admin privileges.

## 🔧 Setup Steps

### 1. Database Migration

First, update your database schema to include the admin field:

```bash
# Generate Prisma client with new schema
npx prisma generate

# Apply database migration (if using migrations)
npx prisma db push
```

### 2. Create Admin User

#### Option A: Using the Script (Recommended)
```bash
# Create your first admin user
node scripts/create-admin-user.js admin@yourcompany.com your-secure-password "Admin User"
```

#### Option B: Manual Database Update
If you already have a user you want to make an admin:

```sql
-- Update existing user to admin
UPDATE users SET is_admin = true WHERE email = 'admin@yourcompany.com';
```

### 3. Environment Variables

Add admin credentials to your environment variables:

```bash
# Add to .env.local or your environment
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=your-secure-password
```

### 4. Credential Verification

Update your credential verification system to recognize admin users. The system should check:

1. Email matches admin credentials
2. Password matches admin password
3. User has `isAdmin: true` in database

## 🚀 Accessing the Admin Panel

### URLs
- **Production**: `https://your-domain.com/admin-auth/signin`
- **Local Development**: `http://localhost:3000/admin-auth/signin`

### Authentication Flow
1. Navigate to `/admin-auth/signin`
2. Enter admin credentials
3. System verifies admin privileges
4. Redirects to `/admin` dashboard

## 🔐 Security Features

### Admin-Only Access
- **Middleware Protection**: All `/admin/*` routes are protected
- **Role Verification**: Checks `isAdmin` flag in database
- **Session Management**: Admin sessions are separate from regular users
- **Automatic Redirect**: Non-admin users redirected to sign-in

### Authentication Layers
1. **NextAuth.js**: Handles session management
2. **Custom Middleware**: Verifies admin privileges
3. **Database Check**: Confirms `isAdmin` status
4. **Route Protection**: Prevents unauthorized access

## 📊 Admin Panel Features

### Dashboard Overview
- **System Statistics**: Users, households, items counts
- **Quick Actions**: Direct links to management sections
- **System Status**: Health monitoring of services
- **Recent Activity**: Admin action logs

### Household Management
- **View All Households**: Complete household listing
- **Search & Filter**: Find households by various criteria
- **Member Management**: Add, remove, reset passwords
- **Household Actions**: Rename, delete, invite members

### Item Management
- **Global Item View**: All items across all households
- **Advanced Filtering**: By household, category, location
- **Sorting Options**: Multiple sort criteria
- **Detailed Information**: Complete item data

### User Management
- **Password Reset**: Reset any user's password
- **Role Management**: View and modify user roles
- **Member Removal**: Remove users from households
- **Access Control**: Manage user permissions

## 🛠️ Admin Operations

### Common Tasks

#### Create New Admin User
```bash
node scripts/create-admin-user.js newadmin@company.com password123 "New Admin"
```

#### Update Existing User to Admin
```sql
UPDATE users SET is_admin = true WHERE email = 'user@company.com';
```

#### Remove Admin Privileges
```sql
UPDATE users SET is_admin = false WHERE email = 'user@company.com';
```

### System Maintenance

#### View All Admin Users
```sql
SELECT id, email, name, is_admin, created_at FROM users WHERE is_admin = true;
```

#### Monitor Admin Activity
- Check system logs for admin actions
- Monitor database changes
- Review user management activities

## 🔒 Security Best Practices

### Admin Account Security
1. **Strong Passwords**: Use complex, unique passwords
2. **Regular Rotation**: Change admin passwords periodically
3. **Limited Access**: Only necessary personnel should have admin access
4. **Monitoring**: Log all admin activities

### System Security
1. **HTTPS Only**: Always use secure connections in production
2. **Session Timeout**: Implement appropriate session timeouts
3. **IP Restrictions**: Consider IP-based access restrictions
4. **Audit Logging**: Log all administrative actions

### Database Security
1. **Backup Regularly**: Maintain database backups
2. **Access Control**: Limit database access to necessary personnel
3. **Monitor Changes**: Track schema and data modifications
4. **Secure Connections**: Use encrypted database connections

## 🚨 Troubleshooting

### Common Issues

#### "Access Denied" Error
- Check if user has `isAdmin: true` in database
- Verify admin credentials in environment variables
- Ensure middleware is properly configured

#### Admin Sign-In Not Working
- Verify email/password combination
- Check credential verification system
- Ensure database connection is working

#### Missing Admin Features
- Verify user has admin privileges
- Check if admin routes are properly protected
- Ensure all admin components are loaded

### Debug Steps
1. Check database for admin users: `SELECT * FROM users WHERE is_admin = true;`
2. Verify environment variables are set
3. Test credential verification system
4. Check browser console for errors
5. Verify middleware configuration

## 📞 Support

### Getting Help
1. Check this guide for common solutions
2. Review system logs for error messages
3. Verify database schema and data
4. Test with a fresh admin user creation

### Emergency Access
If you lose admin access:
1. Use database direct access to create new admin user
2. Run the admin creation script with new credentials
3. Update environment variables with new credentials
4. Test admin access with new credentials

---

**Important**: The admin panel provides powerful system management capabilities. Always use admin privileges responsibly and maintain proper security practices.
