-- 跨生态链控制和场景管理 - 数据库迁移脚本
-- Cross-ecosystem Control and Scene Management - Database Migration Script
-- 
-- 使用方法: 在 Supabase SQL Editor 中运行此脚本
-- 
-- 此脚本会创建以下表:
--   - automation_rules: 自动化规则表
--   - scenes: 场景表
--   - scene_actions: 场景动作表

-- 1. 创建自动化规则表
CREATE TABLE IF NOT EXISTS automation_rules (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT true,
    
    -- 源设备/传感器配置
    source_type TEXT NOT NULL, -- 'device', 'time', 'manual'
    source_device_id TEXT REFERENCES iot_devices(id) ON DELETE SET NULL,
    source_property TEXT, -- 源设备属性（如 'temperature', 'motion', 'light'）
    
    -- 触发条件 (JSON)
    condition JSONB NOT NULL,
    
    -- 目标动作 (JSON)
    actions JSONB NOT NULL,
    
    -- 防抖/节流配置
    debounce_ms INTEGER DEFAULT 1000,
    throttle_ms INTEGER,
    
    -- 执行统计
    execution_count INTEGER DEFAULT 0,
    last_executed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建场景表
CREATE TABLE IF NOT EXISTS scenes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT true,
    
    -- 场景图标/颜色（可选）
    icon TEXT,
    color TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建场景动作表
CREATE TABLE IF NOT EXISTS scene_actions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL REFERENCES iot_devices(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'power_on', 'power_off', 'set_temperature', 'set_brightness', etc.
    value JSONB, -- 动作值（如温度值、亮度值等）
    delay_ms INTEGER DEFAULT 0, -- 延迟执行时间（毫秒）
    "order" INTEGER DEFAULT 0 -- 执行顺序
);

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_automation_rules_household_id ON automation_rules(household_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_enabled ON automation_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_automation_rules_source_device_id ON automation_rules(source_device_id);

CREATE INDEX IF NOT EXISTS idx_scenes_household_id ON scenes(household_id);
CREATE INDEX IF NOT EXISTS idx_scenes_enabled ON scenes(enabled);

CREATE INDEX IF NOT EXISTS idx_scene_actions_scene_id ON scene_actions(scene_id);
CREATE INDEX IF NOT EXISTS idx_scene_actions_device_id ON scene_actions(device_id);

-- 5. 验证表创建
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('automation_rules', 'scenes', 'scene_actions')
ORDER BY table_name, ordinal_position;

