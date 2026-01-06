-- Migration: Add assignedToId to WorkflowTemplateStep and WorkflowStep
-- Created: 2025-01-06
-- Description: Adds person assignment capability to workflow steps

-- Add assigned_to_id column to workflow_template_steps
ALTER TABLE "workflow_template_steps"
ADD COLUMN IF NOT EXISTS "assigned_to_id" TEXT;

-- Add foreign key constraint for workflow_template_steps.assigned_to_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'workflow_template_steps_assigned_to_id_fkey'
  ) THEN
    ALTER TABLE "workflow_template_steps"
    ADD CONSTRAINT "workflow_template_steps_assigned_to_id_fkey"
    FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

-- Add index for workflow_template_steps.assigned_to_id
CREATE INDEX IF NOT EXISTS "workflow_template_steps_assigned_to_id_idx"
ON "workflow_template_steps"("assigned_to_id");

-- Add assigned_to_id column to workflow_steps
ALTER TABLE "workflow_steps"
ADD COLUMN IF NOT EXISTS "assigned_to_id" TEXT;

-- Add foreign key constraint for workflow_steps.assigned_to_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'workflow_steps_assigned_to_id_fkey'
  ) THEN
    ALTER TABLE "workflow_steps"
    ADD CONSTRAINT "workflow_steps_assigned_to_id_fkey"
    FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

-- Add index for workflow_steps.assigned_to_id
CREATE INDEX IF NOT EXISTS "workflow_steps_assigned_to_id_idx"
ON "workflow_steps"("assigned_to_id");

