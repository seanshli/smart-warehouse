# Workflow System Implementation Guide

## Overview

This document describes the implementation of two major features:
1. **Enhanced Working Group Member Management** - Community/building admins can manage their working team members
2. **Workflow System** - Define and execute workflows with step-by-step task tracking and time management

## Feature 1: Enhanced Working Group Member Management

### Current Status
- ✅ RLS policies already allow community/building admins to manage working group members
- ✅ APIs exist for adding/removing members
- ⏳ Need to enhance APIs for:
  - Updating member details (name, email, etc.)
  - Updating passwords
  - Updating roles
  - Assigning members to multiple working groups

### Database Schema
- `WorkingGroup` - Groups within a community
- `WorkingGroupMember` - Members of working groups (supports multiple groups per user)

### API Endpoints Needed

#### 1. Update Working Group Member
```
PUT /api/community/[id]/working-groups/[groupId]/members/[memberId]
Body: { role: "LEADER" | "MEMBER" }
```

#### 2. Update User Details (by Admin)
```
PUT /api/admin/users/[userId]
Body: { name, email, phone, etc. }
Permissions: Community/building admin can only update users in their working groups
```

#### 3. Update User Password (by Admin)
```
PUT /api/admin/users/[userId]/password
Body: { password: "newpassword" }
Permissions: Community/building admin can only update passwords for users in their working groups
```

#### 4. Get User's Working Groups
```
GET /api/users/[userId]/working-groups
Returns: List of all working groups the user belongs to
```

## Feature 2: Workflow System

### Database Schema (✅ Added)

#### Models Created:
1. **WorkflowType** - Types of workflows (CATERING, MAINTENANCE, etc.)
2. **WorkflowTemplate** - Reusable workflow templates
3. **WorkflowTemplateStep** - Steps in a template
4. **Workflow** - Instance of a workflow
5. **WorkflowStep** - Steps in a workflow instance
6. **WorkflowTask** - Individual tasks within a step
7. **WorkflowTaskLog** - Time tracking logs

### Key Features:
- ✅ Define workflow types (catering, maintenance, etc.)
- ✅ Create workflow templates with predefined steps
- ✅ Assign steps to working groups
- ✅ Track estimated vs actual time
- ✅ Record wait time between steps
- ✅ Record task duration
- ✅ Support multiple working groups per workflow

### API Endpoints Needed

#### Workflow Type Management
```
GET    /api/workflow-types                    - List all workflow types
POST   /api/workflow-types                    - Create workflow type
GET    /api/workflow-types/[id]               - Get workflow type
PUT    /api/workflow-types/[id]               - Update workflow type
DELETE /api/workflow-types/[id]               - Delete workflow type
```

#### Workflow Template Management
```
GET    /api/workflow-templates                - List templates
POST   /api/workflow-templates                - Create template
GET    /api/workflow-templates/[id]           - Get template with steps
PUT    /api/workflow-templates/[id]           - Update template
DELETE /api/workflow-templates/[id]          - Delete template

POST   /api/workflow-templates/[id]/steps     - Add step to template
PUT    /api/workflow-templates/[id]/steps/[stepId] - Update step
DELETE /api/workflow-templates/[id]/steps/[stepId] - Delete step
```

#### Workflow Instance Management
```
GET    /api/workflows                         - List workflows (filtered by community/building)
POST   /api/workflows                         - Create workflow from template or scratch
GET    /api/workflows/[id]                    - Get workflow with steps and tasks
PUT    /api/workflows/[id]                    - Update workflow
DELETE /api/workflows/[id]                    - Cancel workflow

POST   /api/workflows/[id]/start              - Start workflow
POST   /api/workflows/[id]/complete           - Complete workflow
```

#### Workflow Step Management
```
GET    /api/workflows/[id]/steps              - List steps
POST   /api/workflows/[id]/steps              - Add step
PUT    /api/workflows/[id]/steps/[stepId]     - Update step
DELETE /api/workflows/[id]/steps/[stepId]    - Delete step

POST   /api/workflows/[id]/steps/[stepId]/start    - Start step
POST   /api/workflows/[id]/steps/[stepId]/complete - Complete step
```

#### Workflow Task Management
```
GET    /api/workflows/[id]/steps/[stepId]/tasks    - List tasks
POST   /api/workflows/[id]/steps/[stepId]/tasks    - Create task
PUT    /api/workflows/[id]/tasks/[taskId]          - Update task
DELETE /api/workflows/[id]/tasks/[taskId]          - Delete task

POST   /api/workflows/[id]/tasks/[taskId]/start   - Start task
POST   /api/workflows/[id]/tasks/[taskId]/complete - Complete task
POST   /api/workflows/[id]/tasks/[taskId]/log      - Add log entry
```

## Next Steps

### 1. Database Migration
```bash
npx prisma migrate dev --name add_workflow_system
npx prisma generate
```

### 2. Implement API Endpoints
- Start with workflow type management
- Then workflow templates
- Then workflow instances
- Finally task execution and time tracking

### 3. Add RLS Policies
Update `enable-rls-on-all-tables.sql` to add policies for:
- `workflow_types`
- `workflow_templates`
- `workflow_template_steps`
- `workflows`
- `workflow_steps`
- `workflow_tasks`
- `workflow_task_logs`

### 4. Create UI Components
- Workflow type management page
- Workflow template builder
- Workflow instance viewer/executor
- Task execution interface with time tracking

## Permissions

### Community Admin
- Can manage workflows for their community
- Can create/edit workflow templates
- Can assign workflows to working groups in their community

### Building Admin
- Can manage workflows for their building
- Can view workflow templates
- Can assign workflows to working groups in their building

### Working Group Members
- Can view assigned workflows
- Can execute tasks assigned to their working group
- Can update task status and time

## Time Tracking

The system tracks:
1. **Estimated Time** - Set when creating template step
2. **Wait Time** - Time between step completion and next step start
3. **Actual Duration** - Time from task start to completion
4. **Task Logs** - Detailed log entries with timestamps

All times are stored in minutes for consistency.

