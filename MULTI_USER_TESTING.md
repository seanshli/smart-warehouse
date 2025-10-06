# Multi-User Testing Guide

## 🎯 Overview
The Smart Warehouse system now supports multiple users with role-based access control. This guide explains how to test multi-user scenarios.

## 👥 Test Users Created

### Individual Users
1. **Alice Johnson** (`alice@smartwarehouse.com` / `alice123`)
   - Has her own household: "Alice Johnson's Household"
   - Role: OWNER in her household
   - Can manage everything in her household

2. **Bob Smith** (`bob@smartwarehouse.com` / `bob123`)
   - Has his own household: "Bob Smith's Household"
   - Role: OWNER in his household
   - Can manage everything in his household

3. **Carol Davis** (`carol@smartwarehouse.com` / `carol123`)
   - Has her own household: "Carol Davis's Household"
   - Role: OWNER in her household
   - Can manage everything in her household

### Shared Household
4. **Shared Family Household**
   - Alice: OWNER (can manage members, roles, everything)
   - Bob: USER (can manage items, categories, rooms, set watermarks)

## 🧪 Testing Scenarios

### Scenario 1: Individual Household Isolation
**Goal**: Verify each user only sees their own data

**Steps**:
1. Sign in as Alice (`alice@smartwarehouse.com` / `alice123`)
2. Add some items to Alice's household
3. Sign out and sign in as Bob (`bob@smartwarehouse.com` / `bob123`)
4. Verify Bob cannot see Alice's items
5. Add different items to Bob's household
6. Sign out and sign in as Carol (`carol@smartwarehouse.com` / `carol123`)
7. Verify Carol cannot see Alice's or Bob's items

**Expected Result**: Complete data isolation between individual households

### Scenario 2: Shared Household Access
**Goal**: Test shared household functionality

**Steps**:
1. Sign in as Alice
2. Go to the "Members" tab
3. Verify Alice can see the shared household with Bob as a member
4. Add items to the shared household
5. Sign out and sign in as Bob
6. Verify Bob can see the shared household and Alice's items
7. Add items as Bob
8. Sign back in as Alice and verify she can see Bob's items

**Expected Result**: Both Alice and Bob can see and manage items in the shared household

### Scenario 3: Role-Based Permissions
**Goal**: Test different role capabilities

**Steps**:
1. Sign in as Bob (USER role in shared household)
2. Try to access the "Members" tab
3. Verify Bob cannot manage members or roles
4. Verify Bob can add/edit items, categories, and rooms
5. Sign in as Alice (OWNER role in shared household)
6. Verify Alice can access all tabs including "Members"
7. Try to change Bob's role or invite new members

**Expected Result**: 
- OWNER: Full access to all features
- USER: Can manage items/categories/rooms but not members
- VISITOR: Can only move items

### Scenario 4: Member Management
**Goal**: Test inviting and managing household members

**Steps**:
1. Sign in as Alice (OWNER)
2. Go to "Members" tab
3. Try to invite Carol to the shared household
4. Set Carol's role as "VISITOR"
5. Sign in as Carol
6. Verify Carol can see the shared household
7. Try to add items (should be limited based on VISITOR role)
8. As Alice, try to change Carol's role to "USER"
9. Verify the role change is reflected

**Expected Result**: OWNER can invite, remove, and change member roles

### Scenario 5: Data Consistency
**Goal**: Verify data consistency across multiple users

**Steps**:
1. Alice adds an item to the shared household
2. Bob signs in and moves the item to a different location
3. Alice signs back in and verifies the item location change
4. Bob creates a new category in the shared household
5. Alice verifies she can see the new category
6. Alice deletes the category
7. Bob signs in and verifies the category is gone

**Expected Result**: All changes are immediately visible to all household members

## 🔧 Testing Tools

### Browser Testing
- Use different browsers or incognito windows to simulate different users
- Chrome, Firefox, Safari for cross-browser testing
- Mobile browsers for responsive testing

### API Testing
- Test API endpoints with different user sessions
- Verify authentication and authorization
- Test household data isolation

### Database Verification
- Use Prisma Studio to verify data isolation
- Check household_members table for correct relationships
- Verify items are properly associated with households

## 📊 Expected Behaviors

### Data Isolation
- Users cannot see items from other households they don't belong to
- Each household has its own rooms, categories, and items
- User preferences (language) are individual

### Shared Access
- Multiple users can access shared households
- Real-time updates across all household members
- Role-based feature access

### Security
- Proper authentication required for all operations
- Authorization checks on all API endpoints
- Session management and security

## 🐛 Common Issues to Watch For

1. **Data Leakage**: Users seeing items from other households
2. **Permission Bypass**: Users accessing features they shouldn't
3. **Session Issues**: Users being logged out unexpectedly
4. **Real-time Updates**: Changes not appearing immediately
5. **Role Confusion**: Incorrect permissions for different roles

## 🚀 Advanced Testing

### Load Testing
- Multiple users accessing the same household simultaneously
- Large numbers of items and categories
- Concurrent modifications

### Edge Cases
- Removing the last OWNER from a household
- Inviting users who don't exist
- Network interruptions during operations

### Integration Testing
- Taiwan e-invoice functionality with multiple users
- Photo uploads and sharing
- Search and filtering across households

## 📝 Test Checklist

- [ ] Individual household isolation works
- [ ] Shared household access works
- [ ] Role-based permissions are enforced
- [ ] Member management functions correctly
- [ ] Data consistency across users
- [ ] UI shows correct user context
- [ ] API endpoints respect authorization
- [ ] Real-time updates work
- [ ] Session management works
- [ ] Cross-browser compatibility

## 🔄 Reset Test Data

To reset test data and start fresh:
```bash
# Reset database
npx prisma migrate reset --force

# Recreate test users
node scripts/create-test-users.js

# Seed with demo data
npm run seed
```

## 📞 Support

If you encounter issues during testing:
1. Check the browser console for errors
2. Verify network requests in DevTools
3. Check server logs for API errors
4. Use Prisma Studio to inspect database state
