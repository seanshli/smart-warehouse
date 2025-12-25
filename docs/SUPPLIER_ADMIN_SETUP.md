# Supplier Admin Setup Guide

## Overview

This guide explains how to set up supplier admin access, allowing suppliers to manage their own work orders (工單) through a dedicated admin interface.

## Features

1. **Supplier Admin Pages**: Each supplier gets their own admin page at `/admin/suppliers/[supplierId]/maintenance`
2. **Automatic Routing**: 
   - Mail/package/doorbell/catering services → automatically routed to building/community
   - Supplier services (e.g., WATER_FILTER) → automatically routed to specific suppliers (e.g., Smar Engo)
3. **Filtered View**: Supplier admins only see work orders assigned to their supplier
4. **Access Control**: Supplier admins can only access their own supplier's admin pages

## Database Setup

### 1. Run Migration

Run the SQL migration to create the `supplier_members` table:

```sql
-- See prisma/migrations/add-supplier-member-table.sql
```

Or run:
```bash
psql -d your_database -f prisma/migrations/add-supplier-member-table.sql
```

### 2. Create Supplier Admin User

To make a user a supplier admin:

```sql
-- Example: Make user a supplier admin for "Smar Engo" (智管家)
INSERT INTO supplier_members (user_id, supplier_id, role)
SELECT 
  u.id,
  s.id,
  'ADMIN'
FROM users u, suppliers s
WHERE u.email = 'supplier-admin@example.com'
  AND s.name ILIKE '%Smar Engo%'
ON CONFLICT (user_id, supplier_id) DO UPDATE SET role = 'ADMIN';
```

## Automatic Routing Configuration

### Service-to-Supplier Mapping

The system automatically routes certain services to specific suppliers. Current mappings:

- `WATER_FILTER` → "Smar Engo" (智管家)

To add more mappings, edit `/app/api/maintenance/tickets/route.ts`:

```typescript
const serviceToSupplierMapping: Record<string, string> = {
  WATER_FILTER: 'Smar Engo',
  // Add more: SERVICE_TYPE: 'Supplier Name'
}
```

### Local Service Routing

These services are automatically routed to building/community:

- `MAIL_SERVICE` → `INTERNAL_BUILDING`
- `PACKAGE_SERVICE` → `INTERNAL_BUILDING`
- `DOORBELL_SERVICE` → `INTERNAL_BUILDING`
- `FOOD_ORDER` → `INTERNAL_COMMUNITY`

## Accessing Supplier Admin Panel

1. **Sign in** as a supplier admin user
2. Navigate to `/admin` - you'll see your supplier in the navigation
3. Click on your supplier name to access the maintenance page
4. You'll only see work orders assigned to your supplier

## API Endpoints

### Get Supplier Info
```
GET /api/admin/suppliers/[id]
```
Returns supplier information (requires supplier admin access)

### Get Tickets (Filtered by Supplier)
```
GET /api/maintenance/tickets?admin=true&supplierId=[supplierId]
```
Returns only tickets assigned to the specified supplier

## Admin Context

The admin context API (`/api/admin/context`) now includes `supplierAdmins`:

```json
{
  "isSuperAdmin": false,
  "communityAdmins": [],
  "buildingAdmins": [],
  "supplierAdmins": [
    {
      "id": "supplier-id",
      "name": "Smar Engo",
      "serviceTypes": ["WATER_FILTER"]
    }
  ]
}
```

## Navigation

Supplier admins see a simplified navigation with only:
- Their supplier's maintenance page link

Super admins, community admins, and building admins see the full navigation menu.

## Security

- Supplier admins can only access `/admin/suppliers/[theirSupplierId]/*` routes
- Middleware validates supplier admin access before allowing route access
- API endpoints filter tickets by `assignedSupplierId` for supplier admins
- Supplier admin status is included in JWT token for efficient middleware checks

## Example: Setting up Smar Engo (智管家) Supplier Admin

1. **Ensure supplier exists**:
```sql
SELECT id, name FROM suppliers WHERE name ILIKE '%Smar Engo%';
```

2. **Create supplier admin**:
```sql
INSERT INTO supplier_members (user_id, supplier_id, role)
SELECT 
  u.id,
  s.id,
  'ADMIN'
FROM users u, suppliers s
WHERE u.email = 'smar-engo-admin@example.com'
  AND s.name ILIKE '%Smar Engo%';
```

3. **Verify routing**:
   - Create a ticket with category `WATER_FILTER`
   - It should automatically be assigned to Smar Engo supplier
   - The supplier admin can see it in their admin panel

## Troubleshooting

### Supplier admin can't access admin panel
- Check that `supplier_members` table exists and has the correct entry
- Verify user has `role = 'ADMIN'` or `role = 'MANAGER'` in `supplier_members`
- Check that supplier `isActive = true`

### Tickets not auto-routing to supplier
- Verify `serviceToSupplierMapping` in `/app/api/maintenance/tickets/route.ts`
- Check that supplier name matches exactly (case-insensitive)
- Ensure supplier `isActive = true`

### Supplier admin sees no tickets
- Verify tickets have `assignedSupplierId` matching the supplier
- Check that tickets are not filtered out by status
- Ensure routing logic assigned the supplier correctly
