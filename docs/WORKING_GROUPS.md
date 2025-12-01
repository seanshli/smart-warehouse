# Working Groups System

## Overview

The working groups system provides team management for communities and buildings. Each community and building automatically gets three working groups:

1. **Management Team** - Building and community management
2. **Maintenance Team** - Maintenance and repair operations
3. **Front Door Team** - Front door and security operations

## Features

- **Automatic Initialization**: Working groups are automatically created when:
  - A new community is created
  - A new building is created

- **Admin Ownership**: The first admin user is automatically added as LEADER of all working groups

- **Default Accounts**: Each building gets two default internal accounts:
  - `doorbell@[building-id].internal` (password: `engo888`) - For doorbell front side operations
  - `frontdesk@[building-id].internal` (password: `engo888`) - For front desk operations

- **Permissions**: Admins have full permissions to:
  - Add/remove team members
  - Assign roles (LEADER, MEMBER)
  - View and edit group settings

## Working Group Structure

### Community-Level Groups
- Created at the community level
- Scope: ALL_BUILDINGS (affects all buildings in the community)
- Name format: "Management Team", "Maintenance Team", "Front Door Team"

### Building-Level Groups
- Created at the community level but scoped to specific buildings
- Scope: SPECIFIC_BUILDING (affects only one building)
- Name format: "Management Team - [Building Name]", etc.

## Default Accounts

Each building automatically receives two internal accounts:

### Doorbell Account
- **Email**: `doorbell@[building-id].internal`
- **Password**: `engo888`
- **Purpose**: Front door bell operations
- **Auto-assigned**: Added to Front Door Team

### Front Desk Account
- **Email**: `frontdesk@[building-id].internal`
- **Password**: `engo888`
- **Purpose**: Front desk operations
- **Auto-assigned**: Added to Front Door Team

## API Endpoints

### Initialize Working Groups (Admin Only)
```
POST /api/admin/initialize-working-groups
```
Initializes working groups for all existing communities and buildings. Useful for migrating existing data.

### Working Group Management
- `GET /api/community/[id]/working-groups` - List working groups
- `POST /api/community/[id]/working-groups` - Create working group
- `GET /api/community/[id]/working-groups/[groupId]/members` - List members
- `POST /api/community/[id]/working-groups/[groupId]/members` - Add member
- `DELETE /api/community/[id]/working-groups/[groupId]/members/[memberId]` - Remove member

## Scripts

### Initialize Working Groups Script
```bash
npx ts-node scripts/initialize-working-groups.ts
```

This script can be run to initialize working groups for all existing communities and buildings.

## Permissions

Working groups use a permission-based system:

- **ADD_MEMBER**: Add new members to the group
- **REVOKE_MEMBER**: Remove members from the group
- **VIEW**: View group information
- **EDIT**: Edit group settings
- **MANAGE_BUILDING**: Manage building-specific operations (building-level groups only)

## Roles

- **LEADER**: Full access to manage the group
- **MEMBER**: Standard member access

## Implementation Details

### Auto-Initialization
When a new community or building is created, the system automatically:
1. Creates the three working groups
2. Adds the admin user as LEADER
3. Sets up appropriate permissions
4. For buildings: Creates default accounts and adds them to Front Door Team

### Helper Functions
Located in `lib/working-groups-init.ts`:
- `initializeCommunityWorkingGroups()` - Initialize for community
- `initializeBuildingWorkingGroups()` - Initialize for building
- `createBuildingDefaultAccounts()` - Create default accounts
- `addAccountsToFrontDoorTeam()` - Add accounts to front door team

## Notes

- Working groups are stored at the community level but can be scoped to specific buildings via permissions
- Default accounts use `.internal` domain to indicate they are system accounts
- All default accounts use the same password (`engo888`) - should be changed in production
- Admin user must exist before working groups can be initialized


