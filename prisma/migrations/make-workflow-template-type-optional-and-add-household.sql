-- Migration: Make workflow template type optional and add household to workflow
-- Created: 2025-01-06
-- Description: 
-- 1. Makes workflowTypeId optional in workflow_templates
-- 2. Adds householdId to workflows table for dynamic household assignment

-- Make workflowTypeId optional in workflow_templates
ALTER TABLE "workflow_templates"
ALTER COLUMN "workflow_type_id" DROP NOT NULL;

-- Drop the foreign key constraint temporarily
ALTER TABLE "workflow_templates"
DROP CONSTRAINT IF EXISTS "workflow_templates_workflow_type_id_fkey";

-- Re-add the foreign key constraint with ON DELETE SET NULL
ALTER TABLE "workflow_templates"
ADD CONSTRAINT "workflow_templates_workflow_type_id_fkey"
FOREIGN KEY ("workflow_type_id") REFERENCES "workflow_types"("id")
ON DELETE SET NULL ON UPDATE NO ACTION;

-- Add householdId to workflows table
ALTER TABLE "workflows"
ADD COLUMN IF NOT EXISTS "household_id" TEXT;

-- Add foreign key constraint for household_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'workflows_household_id_fkey'
  ) THEN
    ALTER TABLE "workflows"
    ADD CONSTRAINT "workflows_household_id_fkey"
    FOREIGN KEY ("household_id") REFERENCES "households"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

-- Add index for household_id
CREATE INDEX IF NOT EXISTS "workflows_household_id_idx"
ON "workflows"("household_id");

