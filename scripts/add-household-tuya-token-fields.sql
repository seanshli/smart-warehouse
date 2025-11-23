-- Add missing Tuya token fields to Household table
-- 为 Household 表添加缺失的 Tuya token 字段
-- 
-- 使用方法: 在 Supabase SQL Editor 中运行此脚本
-- 
-- 注意: 此脚本会添加以下字段:
--   - tuya_access_token: Household 的 Tuya access token（临时，加密）
--   - tuya_token_expires_at: Token 过期时间

-- 1. 添加 tuya_access_token 字段
ALTER TABLE households
ADD COLUMN IF NOT EXISTS tuya_access_token TEXT;

-- 2. 添加 tuya_token_expires_at 字段
ALTER TABLE households
ADD COLUMN IF NOT EXISTS tuya_token_expires_at TIMESTAMP WITH TIME ZONE;

-- 3. 验证字段已添加
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'households'
  AND column_name IN ('tuya_access_token', 'tuya_token_expires_at')
ORDER BY column_name;
