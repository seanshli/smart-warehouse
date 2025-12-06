# How to Add Members to Working Groups

## Problem: "Target user not found" Error

When trying to add a member to a working group, you may see the error:
- **"Target user not found"** - The user doesn't exist in the system OR isn't a member of the community yet

## Solution: Follow This Workflow

### Step 1: Ensure User Exists in System

The user must have an account in the system first. Two options:

#### Option A: User Self-Registration (Recommended)
- User goes to the signup page and creates their own account
- URL: `/auth/signup`

#### Option B: Admin Creates User
- Go to **Admin Panel** → **Users** page
- Click "Create User" button
- Enter user's email and details
- User will need to set their password on first login

### Step 2: Add User to Community

**Before** adding to a working group, the user must be a member of the community:

1. Navigate to the **Community** page
   - URL: `/community/[community-id]`
   - Or click on the community name in the navigation

2. Click on the **"Members"** tab

3. Click **"Add Member"** button

4. Enter the user's email address (e.g., `frontdesk0S13@twinoak.com`)

5. Select the role:
   - **MEMBER** (default) - Regular community member
   - **ADMIN** - Community administrator
   - **MANAGER** - Community manager
   - **VIEWER** - Read-only access

6. Select Member Class:
   - **community** - Direct community member
   - **household** - Member via household
   - **building** - Member via building

7. Click **"Add Member"**

✅ **Success**: User is now a community member

### Step 3: Add User to Working Group

Now you can add the user to the working group:

1. Go to the **Community** page → **"工作組" (Working Groups)** tab

2. Click on the working group (e.g., "Front Door Team")

3. In the "Add Member by Email" section:
   - Enter the user's email: `frontdesk0S13@twinoak.com`
   - Click **"Add Member"**

✅ **Success**: User is now added to the working group!

## Quick Reference

### Error Messages and Solutions

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Target user not found" | User doesn't exist OR not a community member | 1. Create user account<br>2. Add to community first |
| "User must be a member of the community first" | User exists but not in community | Add user to community (Step 2) |
| "User is already a member" | User already in working group | User is already added |

### Navigation Path

```
Community Page
  └── Members Tab
      └── Add Member (by email)
          └── ✅ User is now community member
              
Working Groups Tab
  └── Select Working Group
      └── Add Member (by email)
          └── ✅ User is now in working group
```

## Important Notes

1. **Order Matters**: Always add to Community BEFORE adding to Working Group
2. **User Must Exist**: User must have an account before being added anywhere
3. **Email Must Match**: Use the exact email address the user registered with
4. **Permissions**: You need appropriate permissions to add members:
   - Community ADMIN/MANAGER can add community members
   - Working Group LEADER can add working group members

## Troubleshooting

### User Still Not Found After Adding to Community?

1. **Check Email Spelling**: Ensure email matches exactly (case-sensitive)
2. **Refresh Page**: Sometimes UI needs refresh to see new members
3. **Check User Account**: Verify user account exists in Admin → Users
4. **Check Community Membership**: Verify user appears in Community → Members tab

### Need to Add User to Building Too?

If the working group is building-specific, you may also need to:
1. Go to Building page
2. Add user as building member
3. Then add to working group

## API Endpoints Reference

- **Add Community Member**: `POST /api/community/[id]/members`
- **Add Working Group Member**: `POST /api/community/[id]/working-groups/[groupId]/members`
- **Add Building Member**: `POST /api/building/[id]/members`

