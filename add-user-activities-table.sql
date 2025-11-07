-- Migration: Add user_activities table for tracking user actions
-- This table stores all user activities like searches, views, filters, and navigation
-- for analytics and admin statistics

CREATE TABLE IF NOT EXISTS user_activities (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'search', 'view_item', 'view_location', 'view_category', 'navigate', 'filter', 'voice_comment'
    action TEXT NOT NULL, -- 'search_items', 'view_item_detail', 'view_room', etc.
    metadata JSONB, -- Store search query, filter params, etc.
    description TEXT,
    item_id TEXT REFERENCES items(id) ON DELETE SET NULL,
    room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,
    cabinet_id TEXT REFERENCES cabinets(id) ON DELETE SET NULL,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_activities_user_household_created 
    ON user_activities(user_id, household_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_activities_household_type_created 
    ON user_activities(household_id, activity_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_activities_created_at 
    ON user_activities(created_at DESC);

-- Add comment
COMMENT ON TABLE user_activities IS 'Tracks user activities for analytics: searches, views, filters, navigation, etc.';

