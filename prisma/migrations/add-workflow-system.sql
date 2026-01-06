-- Migration: Add Workflow System
-- Created: 2025-01-06
-- Description: Adds workflow system models for managing workflows, templates, steps, tasks, and time tracking

-- Create WorkflowType table
CREATE TABLE IF NOT EXISTS "workflow_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "workflow_types_pkey" PRIMARY KEY ("id")
);

-- Create WorkflowTemplate table
CREATE TABLE IF NOT EXISTS "workflow_templates" (
    "id" TEXT NOT NULL,
    "workflow_type_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "workflow_templates_pkey" PRIMARY KEY ("id")
);

-- Create WorkflowTemplateStep table
CREATE TABLE IF NOT EXISTS "workflow_template_steps" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "task_description" TEXT,
    "estimated_minutes" INTEGER,
    "working_group_id" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "can_skip" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "workflow_template_steps_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "workflow_template_steps_template_id_step_order_key" UNIQUE ("template_id", "step_order")
);

-- Create Workflow table
CREATE TABLE IF NOT EXISTS "workflows" (
    "id" TEXT NOT NULL,
    "workflow_type_id" TEXT NOT NULL,
    "template_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "related_id" TEXT,
    "related_type" TEXT,
    "community_id" TEXT,
    "building_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "assigned_to_id" TEXT,
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "workflows_pkey" PRIMARY KEY ("id")
);

-- Create WorkflowStep table
CREATE TABLE IF NOT EXISTS "workflow_steps" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "template_step_id" TEXT,
    "step_order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "task_description" TEXT,
    "estimated_minutes" INTEGER,
    "working_group_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "wait_time_minutes" INTEGER,
    "duration_minutes" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "workflow_steps_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "workflow_steps_workflow_id_step_order_key" UNIQUE ("workflow_id", "step_order")
);

-- Create WorkflowTask table
CREATE TABLE IF NOT EXISTS "workflow_tasks" (
    "id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "step_id" TEXT NOT NULL,
    "assigned_to_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "estimated_minutes" INTEGER,
    "actual_minutes" INTEGER,
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "work_done" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "workflow_tasks_pkey" PRIMARY KEY ("id")
);

-- Create WorkflowTaskLog table
CREATE TABLE IF NOT EXISTS "workflow_task_logs" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performed_by_id" TEXT NOT NULL,
    "description" TEXT,
    "duration_minutes" INTEGER,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "workflow_task_logs_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "workflow_templates" ADD CONSTRAINT "workflow_templates_workflow_type_id_fkey" FOREIGN KEY ("workflow_type_id") REFERENCES "workflow_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "workflow_template_steps" ADD CONSTRAINT "workflow_template_steps_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "workflow_templates"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "workflow_template_steps" ADD CONSTRAINT "workflow_template_steps_working_group_id_fkey" FOREIGN KEY ("working_group_id") REFERENCES "working_groups"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "workflows" ADD CONSTRAINT "workflows_workflow_type_id_fkey" FOREIGN KEY ("workflow_type_id") REFERENCES "workflow_types"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_template_step_id_fkey" FOREIGN KEY ("template_step_id") REFERENCES "workflow_template_steps"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_working_group_id_fkey" FOREIGN KEY ("working_group_id") REFERENCES "working_groups"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "workflow_tasks" ADD CONSTRAINT "workflow_tasks_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "workflows"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "workflow_tasks" ADD CONSTRAINT "workflow_tasks_step_id_fkey" FOREIGN KEY ("step_id") REFERENCES "workflow_steps"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "workflow_tasks" ADD CONSTRAINT "workflow_tasks_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "workflow_task_logs" ADD CONSTRAINT "workflow_task_logs_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "workflow_tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "workflow_task_logs" ADD CONSTRAINT "workflow_task_logs_performed_by_id_fkey" FOREIGN KEY ("performed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- Create indexes
CREATE INDEX IF NOT EXISTS "workflows_workflow_type_id_idx" ON "workflows"("workflow_type_id");
CREATE INDEX IF NOT EXISTS "workflows_status_idx" ON "workflows"("status");
CREATE INDEX IF NOT EXISTS "workflows_community_id_idx" ON "workflows"("community_id");
CREATE INDEX IF NOT EXISTS "workflows_building_id_idx" ON "workflows"("building_id");
CREATE INDEX IF NOT EXISTS "workflows_related_id_related_type_idx" ON "workflows"("related_id", "related_type");

CREATE INDEX IF NOT EXISTS "workflow_steps_workflow_id_idx" ON "workflow_steps"("workflow_id");
CREATE INDEX IF NOT EXISTS "workflow_steps_status_idx" ON "workflow_steps"("status");

CREATE INDEX IF NOT EXISTS "workflow_tasks_workflow_id_idx" ON "workflow_tasks"("workflow_id");
CREATE INDEX IF NOT EXISTS "workflow_tasks_step_id_idx" ON "workflow_tasks"("step_id");
CREATE INDEX IF NOT EXISTS "workflow_tasks_assigned_to_id_idx" ON "workflow_tasks"("assigned_to_id");
CREATE INDEX IF NOT EXISTS "workflow_tasks_status_idx" ON "workflow_tasks"("status");

CREATE INDEX IF NOT EXISTS "workflow_task_logs_task_id_idx" ON "workflow_task_logs"("task_id");
CREATE INDEX IF NOT EXISTS "workflow_task_logs_performed_by_id_idx" ON "workflow_task_logs"("performed_by_id");
CREATE INDEX IF NOT EXISTS "workflow_task_logs_timestamp_idx" ON "workflow_task_logs"("timestamp");

