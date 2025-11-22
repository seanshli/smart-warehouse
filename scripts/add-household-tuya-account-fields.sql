-- Add Tuya account fields to Household table
-- 为 Household 表添加 Tuya 账户字段
-- 
-- 使用方法: 在 Supabase SQL Editor 中运行此脚本
-- 
-- 注意: 此脚本会添加以下字段:
--   - tuya_account: Household 的 Tuya 账户（邮箱或手机号）
--   - tuya_password: 加密的 Tuya 密码
--   - tuya_country_code: Tuya 国家代码（默认 886 - Taiwan）

-- 1. 添加 tuya_account 字段
ALTER TABLE households
ADD COLUMN IF NOT EXISTS tuya_account TEXT;

-- 2. 添加 tuya_password 字段
ALTER TABLE households
ADD COLUMN IF NOT EXISTS tuya_password TEXT;

-- 3. 添加 tuya_country_code 字段（默认 886 - Taiwan）
ALTER TABLE households
ADD COLUMN IF NOT EXISTS tuya_country_code TEXT DEFAULT '886';

-- 4. 验证字段已添加
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'households'
  AND column_name IN ('tuya_account', 'tuya_password', 'tuya_country_code')
ORDER BY column_name;

