-- 添加 tuya_home_id 字段到 households 表
-- Add tuya_home_id column to households table

-- 检查字段是否已存在，如果不存在则添加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'households' 
        AND column_name = 'tuya_home_id'
    ) THEN
        -- 添加 tuya_home_id 字段
        ALTER TABLE households 
        ADD COLUMN tuya_home_id TEXT UNIQUE;
        
        -- 添加注释
        COMMENT ON COLUMN households.tuya_home_id IS 'Tuya Home ID (对应到 Tuya SDK 的 Home)';
        
        RAISE NOTICE 'Column tuya_home_id added successfully';
    ELSE
        RAISE NOTICE 'Column tuya_home_id already exists';
    END IF;
END $$;

