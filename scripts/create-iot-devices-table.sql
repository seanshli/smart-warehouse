-- 創建 IoT 設備表（統一支援 MQTT 和 RESTful API）
-- Create IoT Device Table (Supporting both MQTT and RESTful API)

-- 在 Supabase SQL Editor 中執行此腳本
-- Execute this script in Supabase SQL Editor

-- 創建 IoT 設備表
CREATE TABLE IF NOT EXISTS iot_devices (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  device_id TEXT NOT NULL,
  name TEXT NOT NULL,
  vendor TEXT NOT NULL,
  connection_type TEXT DEFAULT 'mqtt',
  topic TEXT,
  command_topic TEXT,
  status_topic TEXT,
  base_url TEXT,
  api_key TEXT,
  access_token TEXT,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  room_id TEXT REFERENCES rooms(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'offline',
  state JSONB,
  metadata JSONB,
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, device_id, vendor)
);

-- 創建索引以提升查詢性能
CREATE INDEX IF NOT EXISTS idx_iot_devices_household ON iot_devices(household_id);
CREATE INDEX IF NOT EXISTS idx_iot_devices_vendor ON iot_devices(vendor);
CREATE INDEX IF NOT EXISTS idx_iot_devices_connection_type ON iot_devices(connection_type);
CREATE INDEX IF NOT EXISTS idx_iot_devices_status ON iot_devices(status);
CREATE INDEX IF NOT EXISTS idx_iot_devices_room ON iot_devices(room_id);

-- 添加更新時間觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 如果觸發器已存在則刪除
DROP TRIGGER IF EXISTS update_iot_devices_updated_at ON iot_devices;

-- 創建觸發器
CREATE TRIGGER update_iot_devices_updated_at 
  BEFORE UPDATE ON iot_devices 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 驗證表已創建
SELECT 
  'iot_devices table created successfully' AS status,
  COUNT(*) AS column_count
FROM information_schema.columns
WHERE table_name = 'iot_devices';

