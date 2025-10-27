-- Add database indexes to improve query performance
-- These indexes will significantly speed up the dashboard queries

-- Index for items by household (most common query)
CREATE INDEX IF NOT EXISTS "idx_items_household_id" ON "items"("household_id");

-- Index for rooms by household
CREATE INDEX IF NOT EXISTS "idx_rooms_household_id" ON "rooms"("household_id");

-- Index for household members by household
CREATE INDEX IF NOT EXISTS "idx_household_members_household_id" ON "household_members"("household_id");

-- Index for item history by household (for activities)
CREATE INDEX IF NOT EXISTS "idx_item_history_household_id" ON "item_history"("item_id");

-- Index for item history by creation date (for sorting)
CREATE INDEX IF NOT EXISTS "idx_item_history_created_at" ON "item_history"("created_at" DESC);

-- Composite index for items with minQuantity (for low stock calculation)
CREATE INDEX IF NOT EXISTS "idx_items_household_min_quantity" ON "items"("household_id", "min_quantity") WHERE "min_quantity" IS NOT NULL;

-- Index for items by household and quantity (for low stock)
CREATE INDEX IF NOT EXISTS "idx_items_household_quantity" ON "items"("household_id", "quantity");

-- Index for user language preferences
CREATE INDEX IF NOT EXISTS "idx_users_language" ON "users"("language");
