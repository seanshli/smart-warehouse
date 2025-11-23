-- 添加 SceneAction 与 IoTDevice 的关系
-- Add relation between SceneAction and IoTDevice

-- 首先确保 scene_actions 表有 device_id 列（如果还没有）
-- First ensure scene_actions table has device_id column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'scene_actions' 
        AND column_name = 'device_id'
    ) THEN
        ALTER TABLE scene_actions ADD COLUMN device_id TEXT;
    END IF;
END $$;

-- 添加外键约束（如果还没有）
-- Add foreign key constraint (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'scene_actions_device_id_fkey'
        AND table_name = 'scene_actions'
    ) THEN
        ALTER TABLE scene_actions 
        ADD CONSTRAINT scene_actions_device_id_fkey 
        FOREIGN KEY (device_id) 
        REFERENCES iot_devices(id) 
        ON DELETE CASCADE 
        ON UPDATE NO ACTION;
    END IF;
END $$;

-- 添加索引（如果还没有）
-- Add index (if not exists)
CREATE INDEX IF NOT EXISTS scene_actions_device_id_idx ON scene_actions(device_id);

-- 验证
SELECT 
    'scene_actions.device_id column exists' as check_1,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'scene_actions' 
        AND column_name = 'device_id'
    ) as result_1,
    'scene_actions_device_id_fkey constraint exists' as check_2,
    EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'scene_actions_device_id_fkey'
        AND table_name = 'scene_actions'
    ) as result_2,
    'scene_actions_device_id_idx index exists' as check_3,
    EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'scene_actions' 
        AND indexname = 'scene_actions_device_id_idx'
    ) as result_3;

