-- Add database indexes to improve query performance
-- These indexes will significantly speed up the dashboard queries

-- Index for items by household (most common query)
CREATE INDEX IF NOT EXISTS "idx_items_household_id" ON "Item"("householdId");

-- Index for rooms by household
CREATE INDEX IF NOT EXISTS "idx_rooms_household_id" ON "Room"("householdId");

-- Index for household members by household
CREATE INDEX IF NOT EXISTS "idx_household_members_household_id" ON "HouseholdMember"("householdId");

-- Index for item history by household (for activities)
CREATE INDEX IF NOT EXISTS "idx_item_history_household_id" ON "ItemHistory"("itemId");

-- Index for item history by creation date (for sorting)
CREATE INDEX IF NOT EXISTS "idx_item_history_created_at" ON "ItemHistory"("createdAt" DESC);

-- Composite index for items with minQuantity (for low stock calculation)
CREATE INDEX IF NOT EXISTS "idx_items_household_min_quantity" ON "Item"("householdId", "minQuantity") WHERE "minQuantity" IS NOT NULL;

-- Index for items by household and quantity (for low stock)
CREATE INDEX IF NOT EXISTS "idx_items_household_quantity" ON "Item"("householdId", "quantity");

-- Index for user language preferences
CREATE INDEX IF NOT EXISTS "idx_users_language" ON "User"("language");
