-- Create table for menu item options/selections
-- This allows menu items to have configurable options like "Vegetarian: Yes/No", "Spice Level: no, 1x pepper, 2x pepper, 3x pepper"

CREATE TABLE IF NOT EXISTS "catering_menu_item_options" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "menu_item_id" TEXT NOT NULL,
  "option_name" TEXT NOT NULL, -- e.g., "Vegetarian", "Spice Level"
  "option_type" TEXT NOT NULL DEFAULT 'select', -- 'select', 'radio', 'checkbox'
  "is_required" BOOLEAN DEFAULT false,
  "display_order" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT "fk_menu_item_option_menu_item"
    FOREIGN KEY ("menu_item_id") REFERENCES "catering_menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create table for option selections/values
CREATE TABLE IF NOT EXISTS "catering_menu_item_option_selections" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "option_id" TEXT NOT NULL,
  "selection_name" TEXT NOT NULL, -- e.g., "Yes", "No", "1x pepper", "2x pepper"
  "selection_value" TEXT NOT NULL, -- e.g., "yes", "no", "1x pepper", "2x pepper" (for API use)
  "display_order" INTEGER DEFAULT 0,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT "fk_option_selection_option"
    FOREIGN KEY ("option_id") REFERENCES "catering_menu_item_options"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS "idx_menu_item_options_menu_item_id" ON "catering_menu_item_options"("menu_item_id");
CREATE INDEX IF NOT EXISTS "idx_menu_item_options_display_order" ON "catering_menu_item_options"("display_order");
CREATE INDEX IF NOT EXISTS "idx_option_selections_option_id" ON "catering_menu_item_option_selections"("option_id");
CREATE INDEX IF NOT EXISTS "idx_option_selections_display_order" ON "catering_menu_item_option_selections"("display_order");

-- Add comments for documentation
COMMENT ON TABLE "catering_menu_item_options" IS 'Configurable options for menu items (e.g., Vegetarian, Spice Level)';
COMMENT ON TABLE "catering_menu_item_option_selections" IS 'Available selections/values for each menu item option';
COMMENT ON COLUMN "catering_menu_item_options"."option_type" IS 'Type of option: select (dropdown), radio (radio buttons), checkbox (checkboxes)';
COMMENT ON COLUMN "catering_menu_item_options"."is_required" IS 'Whether this option must be selected when ordering';
