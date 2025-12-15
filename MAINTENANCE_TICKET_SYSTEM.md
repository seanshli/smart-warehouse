# Maintenance Ticket System (報修) - Implementation Plan

## Overview

A comprehensive work order system for household maintenance requests with a complete workflow from request to sign-off.

## Workflow Stages

### 1. **START: Household Member Requests Support**
- Household member creates a maintenance ticket
- Provides: title, description, category, priority, location
- Status: `PENDING_EVALUATION`

### 2. **EVALUATE: Routing Decision**
Admin evaluates and routes the ticket:

**a) Internal (Building/Community) Support:**
- House cleaning, food order, car service, building maintenance
- Admin assigns to appropriate working crew
- Status: `EVALUATED` → `ASSIGNED`
- Routing Type: `INTERNAL_BUILDING` or `INTERNAL_COMMUNITY`

**b) External Supplier Support:**
- Appliances, water filter, smart home (e.g., enGo)
- Admin links with appropriate supplier
- Supplier evaluates and documents
- Status: `EVALUATED` → `ASSIGNED`
- Routing Type: `EXTERNAL_SUPPLIER`

### 3. **FIX/WORKING: Work Execution**
- Assigned worker/crew documents work
- Records: work description, hours, materials, notes, attachments
- Status: `IN_PROGRESS` → `WORK_COMPLETED`

### 4. **SIGN-OFF: Completion Approval**

**For Internal Work:**
- Crew lead reviews and signs off
- Status: `SIGNED_OFF_BY_CREW`
- Then sent to household for final sign-off

**For External Supplier:**
- Supplier lead signs off
- Status: `SIGNED_OFF_BY_SUPPLIER`
- Then sent to household for final sign-off

**Final Step:**
- Household member signs off
- Status: `SIGNED_OFF_BY_HOUSEHOLD` → `CLOSED`
- All timestamps and details recorded

## Database Schema

### Core Tables

1. **suppliers** - External vendors (enGo, appliance repair, etc.)
2. **working_crews** - Internal crews (building/community maintenance)
3. **crew_members** - Members of working crews
4. **maintenance_tickets** - Main work orders
5. **maintenance_ticket_work_logs** - Work documentation
6. **maintenance_ticket_signoffs** - Sign-off records

### Key Fields

**MaintenanceTicket:**
- `ticketNumber` - Auto-generated: MT-YYYYMMDD-XXXX
- `status` - Workflow state tracking
- `routingType` - INTERNAL_BUILDING, INTERNAL_COMMUNITY, EXTERNAL_SUPPLIER
- `category` - BUILDING_MAINTENANCE, HOUSE_CLEANING, FOOD_ORDER, CAR_SERVICE, APPLIANCE, WATER_FILTER, SMART_HOME
- Multiple timestamp fields for workflow tracking

## API Endpoints Needed

### Household Endpoints
- `POST /api/maintenance/tickets` - Create ticket
- `GET /api/maintenance/tickets` - List household tickets
- `GET /api/maintenance/tickets/[id]` - Get ticket details
- `POST /api/maintenance/tickets/[id]/signoff` - Household sign-off

### Admin Endpoints
- `GET /api/admin/maintenance/tickets` - List all tickets (with filters)
- `POST /api/admin/maintenance/tickets/[id]/evaluate` - Evaluate and route
- `POST /api/admin/maintenance/tickets/[id]/assign` - Assign to crew/supplier
- `GET /api/admin/maintenance/crews` - List working crews
- `POST /api/admin/maintenance/crews` - Create working crew
- `GET /api/admin/maintenance/suppliers` - List suppliers
- `POST /api/admin/maintenance/suppliers` - Create supplier

### Worker/Crew Endpoints
- `GET /api/maintenance/tickets/assigned` - Get assigned tickets
- `POST /api/maintenance/tickets/[id]/work-log` - Add work log
- `POST /api/maintenance/tickets/[id]/complete` - Mark work completed
- `POST /api/maintenance/tickets/[id]/signoff` - Crew/supplier sign-off

## UI Components Needed

### Household UI
1. **Ticket Request Form** (`components/maintenance/TicketRequestForm.tsx`)
   - Category selection
   - Priority selection
   - Description and location
   - Photo attachments

2. **Ticket List** (`components/maintenance/TicketList.tsx`)
   - View all household tickets
   - Filter by status
   - View ticket details

3. **Ticket Details** (`components/maintenance/TicketDetails.tsx`)
   - View full ticket information
   - View work logs
   - Sign-off interface

### Admin UI
1. **Ticket Management** (`app/admin/maintenance/page.tsx`)
   - List all tickets
   - Filter and search
   - Evaluate and route tickets
   - Assign to crews/suppliers

2. **Crew Management** (`app/admin/maintenance/crews/page.tsx`)
   - Create/edit working crews
   - Assign crew members
   - Set crew lead

3. **Supplier Management** (`app/admin/maintenance/suppliers/page.tsx`)
   - Create/edit suppliers
   - Set service types
   - Contact information

### Worker/Crew UI
1. **Work Dashboard** (`components/maintenance/WorkDashboard.tsx`)
   - View assigned tickets
   - Add work logs
   - Mark work completed
   - Sign-off interface

## Implementation Steps

1. ✅ **Database Schema** - Created SQL migration and Prisma models
2. ⏳ **API Endpoints** - Create all API routes
3. ⏳ **Household UI** - Ticket request and management
4. ⏳ **Admin UI** - Routing and management
5. ⏳ **Worker UI** - Work documentation
6. ⏳ **Sign-off Workflow** - Complete sign-off process

## Next Steps

1. Run the SQL migration in Supabase
2. Run `npx prisma generate` to update Prisma client
3. Create API endpoints
4. Build UI components
5. Test complete workflow
