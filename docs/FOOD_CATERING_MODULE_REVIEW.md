# Food Catering Order Module - Review & Implementation Plan

## Overview
This document outlines the review and implementation plan for adding a food catering order module to the Smart Warehouse application.

## Requirements Analysis

### Backend Requirements
1. **Menu Items** - Each item should have:
   - Photo/image
   - Short description
   - Cost (price)
   - Quantity available
   - Association with Building or Community (service availability)

2. **Service Availability**:
   - Items can be associated with specific buildings
   - Items can be associated with communities (all buildings in community)
   - Service availability flag to enable/disable catering per building/community

### Frontend Requirements
1. **Menu Display Module**:
   - Household members can browse available items
   - Filter by building/community availability
   - View item details (photo, description, price, availability)

2. **Shopping Cart**:
   - Add items to cart
   - Update quantities
   - Remove items
   - View cart total

3. **Order Placement**:
   - Review cart before checkout
   - Select delivery time:
     - **Immediately** (as soon as possible)
     - **Scheduled** (預約 - reservation for specific time)
   - Confirm order

4. **Order Management**:
   - View order history
   - Track order status
   - Cancel orders (if allowed)

## Database Schema Design

### New Models Required

#### 1. CateringService (Service Availability)
```prisma
model CateringService {
  id          String    @id @default(dbgenerated("(gen_random_uuid())::text"))
  buildingId  String?   @map("building_id")
  communityId String?   @map("community_id")
  isActive    Boolean   @default(true) @map("is_active")
  createdAt   DateTime? @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime? @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  
  building    Building?  @relation(fields: [buildingId], references: [id], onDelete: Cascade)
  community   Community? @relation(fields: [communityId], references: [id], onDelete: Cascade)
  menuItems   CateringMenuItem[]
  
  @@unique([buildingId])
  @@unique([communityId])
  @@map("catering_services")
}
```

#### 2. CateringMenuItem (Menu Items)
```prisma
model CateringMenuItem {
  id            String    @id @default(dbgenerated("(gen_random_uuid())::text"))
  serviceId     String    @map("service_id")
  name          String
  description   String?   // Short description
  imageUrl      String?   @map("image_url")
  cost          Decimal   @db.Decimal(10, 2) // Price
  quantityAvailable Int   @default(0) @map("quantity_available")
  isActive      Boolean   @default(true) @map("is_active")
  category      String?   // e.g., "main", "side", "drink", "dessert"
  createdAt     DateTime? @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt     DateTime? @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  
  service       CateringService @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  orderItems    CateringOrderItem[]
  
  @@index([serviceId])
  @@index([isActive])
  @@map("catering_menu_items")
}
```

#### 3. CateringOrder (Orders)
```prisma
model CateringOrder {
  id              String    @id @default(dbgenerated("(gen_random_uuid())::text"))
  householdId     String    @map("household_id")
  orderedById     String    @map("ordered_by_id")
  orderNumber     String    @unique @map("order_number") // e.g., "ORD-2025-001234"
  
  // Delivery options
  deliveryType    String    @default("immediate") @map("delivery_type") // "immediate" | "scheduled"
  scheduledTime   DateTime? @map("scheduled_time") @db.Timestamptz(6) // For scheduled orders
  
  // Order details
  totalAmount     Decimal   @map("total_amount") @db.Decimal(10, 2)
  status          String    @default("pending") // "pending", "confirmed", "preparing", "ready", "delivered", "cancelled"
  notes           String?   // Special instructions
  
  // Timestamps
  orderedAt       DateTime? @default(now()) @map("ordered_at") @db.Timestamptz(6)
  confirmedAt     DateTime? @map("confirmed_at") @db.Timestamptz(6)
  preparedAt      DateTime? @map("prepared_at") @db.Timestamptz(6)
  deliveredAt     DateTime? @map("delivered_at") @db.Timestamptz(6)
  cancelledAt     DateTime? @map("cancelled_at") @db.Timestamptz(6)
  
  createdAt       DateTime? @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime? @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  
  household       Household         @relation(fields: [householdId], references: [id], onDelete: Cascade)
  orderedBy       User              @relation(fields: [orderedById], references: [id], onDelete: Cascade)
  items           CateringOrderItem[]
  notifications   Notification[]
  
  @@index([householdId])
  @@index([orderedById])
  @@index([status])
  @@index([orderedAt])
  @@map("catering_orders")
}
```

#### 4. CateringOrderItem (Items in Order)
```prisma
model CateringOrderItem {
  id          String    @id @default(dbgenerated("(gen_random_uuid())::text"))
  orderId     String    @map("order_id")
  menuItemId String    @map("menu_item_id")
  quantity    Int       @default(1)
  unitPrice   Decimal   @map("unit_price") @db.Decimal(10, 2) // Price at time of order
  subtotal    Decimal   @db.Decimal(10, 2) // quantity * unitPrice
  
  order       CateringOrder    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  menuItem    CateringMenuItem @relation(fields: [menuItemId], references: [id], onDelete: Restrict)
  
  @@index([orderId])
  @@index([menuItemId])
  @@map("catering_order_items")
}
```

### Schema Updates Required

#### Update Building Model
```prisma
model Building {
  // ... existing fields
  cateringService CateringService?
}
```

#### Update Community Model
```prisma
model Community {
  // ... existing fields
  cateringService CateringService?
}
```

#### Update Household Model
```prisma
model Household {
  // ... existing fields
  cateringOrders CateringOrder[]
}
```

#### Update User Model
```prisma
model User {
  // ... existing fields
  cateringOrders CateringOrder[] @relation("CateringOrderUser")
}
```

#### Update Notification Model
```prisma
model Notification {
  // ... existing fields
  cateringOrderId String? @map("catering_order_id")
  cateringOrder   CateringOrder? @relation(fields: [cateringOrderId], references: [id], onDelete: Cascade)
}
```

## API Routes Design

### Menu Management (Admin/Building Admin)
- `GET /api/catering/menu` - Get menu items (filtered by building/community)
- `GET /api/catering/menu/[id]` - Get single menu item
- `POST /api/catering/menu` - Create menu item (admin only)
- `PUT /api/catering/menu/[id]` - Update menu item (admin only)
- `DELETE /api/catering/menu/[id]` - Delete menu item (admin only)

### Service Availability
- `GET /api/catering/service` - Get service availability for current building/community
- `POST /api/catering/service` - Enable/disable service (admin only)
- `PUT /api/catering/service/[id]` - Update service settings (admin only)

### Shopping Cart (Session-based or Database)
- `GET /api/catering/cart` - Get current cart
- `POST /api/catering/cart/add` - Add item to cart
- `PUT /api/catering/cart/[itemId]` - Update item quantity in cart
- `DELETE /api/catering/cart/[itemId]` - Remove item from cart
- `DELETE /api/catering/cart` - Clear cart

### Orders
- `GET /api/catering/orders` - Get orders for current household
- `GET /api/catering/orders/[id]` - Get single order details
- `POST /api/catering/orders` - Place order (checkout)
- `PUT /api/catering/orders/[id]/cancel` - Cancel order
- `GET /api/catering/orders/admin` - Get all orders (admin only)
- `PUT /api/catering/orders/[id]/status` - Update order status (admin only)

## Frontend Components

### 1. CateringMenu Component
**Location**: `components/catering/CateringMenu.tsx`
- Display menu items in grid/list view
- Filter by category
- Show availability status
- Add to cart button

### 2. CateringCart Component
**Location**: `components/catering/CateringCart.tsx`
- Display cart items
- Update quantities
- Remove items
- Show total
- Proceed to checkout button

### 3. CateringCheckout Component
**Location**: `components/catering/CateringCheckout.tsx`
- Review order summary
- Select delivery type (immediate/scheduled)
- Date/time picker for scheduled delivery
- Special instructions input
- Place order button

### 4. CateringOrderHistory Component
**Location**: `components/catering/CateringOrderHistory.tsx`
- List of past orders
- Order status indicators
- Order details modal
- Cancel order (if allowed)

### 5. CateringAdminPanel Component (Optional)
**Location**: `components/catering/CateringAdminPanel.tsx`
- Menu item management
- Service availability management
- Order management dashboard
- Inventory updates

## Page Routes

### User-facing Pages
- `/catering` - Main menu page
- `/catering/cart` - Shopping cart page
- `/catering/orders` - Order history page
- `/catering/orders/[id]` - Order details page

### Admin Pages
- `/admin/catering` - Admin dashboard
- `/admin/catering/menu` - Menu management
- `/admin/catering/orders` - Order management

## Implementation Steps

### Phase 1: Database Schema
1. ✅ Create Prisma schema for new models
2. ✅ Create migration file
3. ✅ Update existing models with relations
4. ✅ Run migration

### Phase 2: Backend API
1. ✅ Create menu management API routes
2. ✅ Create service availability API routes
3. ✅ Create shopping cart API routes (session-based)
4. ✅ Create order management API routes
5. ✅ Add authorization checks
6. ✅ Add validation

### Phase 3: Frontend Components
1. ✅ Create CateringMenu component
2. ✅ Create CateringCart component
3. ✅ Create CateringCheckout component
4. ✅ Create CateringOrderHistory component
5. ✅ Add navigation/routing

### Phase 4: Integration
1. ✅ Add catering link to main navigation
2. ✅ Add notifications for order status changes
3. ✅ Add real-time updates (if needed)
4. ✅ Add admin panel integration

### Phase 5: Testing & Polish
1. ✅ Test order flow end-to-end
2. ✅ Test admin functions
3. ✅ Add error handling
4. ✅ Add loading states
5. ✅ Add translations (i18n)

## Technical Considerations

### Shopping Cart Storage
**Option 1: Session-based (Recommended for MVP)**
- Store cart in session/cookies
- Simple implementation
- No database overhead
- Lost on logout

**Option 2: Database-based**
- Store cart in database
- Persists across sessions
- More complex
- Better for long-term carts

**Recommendation**: Start with session-based, migrate to database if needed.

### Delivery Time Selection
- **Immediate**: Order as soon as possible (default)
- **Scheduled**: Select date and time
  - Date picker component
  - Time slot selection (e.g., 30-minute intervals)
  - Validation: Cannot select past times
  - Minimum advance notice (e.g., 1 hour)

### Order Number Generation
- Format: `ORD-YYYY-NNNNNN`
- Example: `ORD-2025-001234`
- Sequential number per year
- Unique constraint

### Inventory Management
- When order is placed, reduce `quantityAvailable`
- When order is cancelled, restore quantity
- Real-time availability updates
- Low stock alerts for admin

### Notifications
- Order confirmation
- Order status updates
- Order ready for pickup/delivery
- Order cancellation

## Security Considerations

1. **Authorization**:
   - Only household members can place orders
   - Only admins can manage menu items
   - Building admins can manage their building's menu

2. **Validation**:
   - Validate quantities (cannot exceed available)
   - Validate delivery times (not in past)
   - Validate order totals

3. **Rate Limiting**:
   - Limit order frequency per household
   - Prevent cart manipulation

## Future Enhancements

1. **Payment Integration**:
   - Payment gateway integration
   - Payment status tracking
   - Refund handling

2. **Delivery Tracking**:
   - Real-time delivery status
   - Delivery person assignment
   - GPS tracking (if applicable)

3. **Reviews & Ratings**:
   - Item ratings
   - Order reviews
   - Feedback system

4. **Loyalty Program**:
   - Points system
   - Discounts
   - Special offers

5. **Advanced Features**:
   - Recurring orders
   - Favorite items
   - Meal plans
   - Dietary restrictions/filters

## Files to Create/Modify

### New Files
- `prisma/schema.prisma` (update with new models)
- `app/api/catering/menu/route.ts`
- `app/api/catering/menu/[id]/route.ts`
- `app/api/catering/service/route.ts`
- `app/api/catering/cart/route.ts`
- `app/api/catering/cart/[itemId]/route.ts`
- `app/api/catering/orders/route.ts`
- `app/api/catering/orders/[id]/route.ts`
- `app/api/catering/orders/[id]/cancel/route.ts`
- `app/catering/page.tsx`
- `app/catering/cart/page.tsx`
- `app/catering/orders/page.tsx`
- `app/catering/orders/[id]/page.tsx`
- `components/catering/CateringMenu.tsx`
- `components/catering/CateringCart.tsx`
- `components/catering/CateringCheckout.tsx`
- `components/catering/CateringOrderHistory.tsx`
- `components/catering/CateringMenuItemCard.tsx`
- `lib/catering.ts` (utility functions)

### Modified Files
- `prisma/schema.prisma` (add relations to existing models)
- `app/layout.tsx` (add navigation link)
- `components/warehouse/Dashboard.tsx` (add catering module link)

## Translation Keys Needed

```typescript
// Catering module translations
'catering.menu': 'Catering Menu'
'catering.cart': 'Shopping Cart'
'catering.orders': 'My Orders'
'catering.addToCart': 'Add to Cart'
'catering.removeFromCart': 'Remove'
'catering.checkout': 'Checkout'
'catering.deliveryImmediate': 'Immediate'
'catering.deliveryScheduled': 'Schedule (預約)'
'catering.selectDeliveryTime': 'Select Delivery Time'
'catering.orderPlaced': 'Order Placed'
'catering.orderStatus': 'Order Status'
'catering.total': 'Total'
'catering.quantity': 'Quantity'
'catering.available': 'Available'
'catering.outOfStock': 'Out of Stock'
// ... more keys
```

---

**Status**: ✅ Review Complete - Ready for Implementation
**Next Step**: Begin Phase 1 - Database Schema Implementation
