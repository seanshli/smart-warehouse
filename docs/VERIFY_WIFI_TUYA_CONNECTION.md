# WiFi 和 Tuya 连接验证指南
## WiFi and Tuya Connection Verification Guide

**最后更新**: 2025-11-21

---

## 📋 验证清单

### 1. WiFi 连接验证

#### 1.1 原生 WiFi 插件测试

**iOS/Android 应用测试**:

1. **打开配网模态框**
   - 进入 MQTT 面板
   - 点击"配网设备"
   - 选择 Tuya 品牌

2. **测试自动获取 SSID**
   - 模态框打开时应该自动获取当前连接的 WiFi SSID
   - 检查是否显示当前 SSID
   - 检查是否自动填充保存的密码

3. **测试 WiFi 扫描**
   - 点击"扫描 WiFi"按钮
   - 检查是否显示可用网络列表
   - 检查是否显示已保存的网络

4. **测试手动输入 SSID**
   - 在 SSID 输入框中输入网络名称
   - 检查输入是否正常
   - 检查是否自动填充保存的密码

5. **测试密码保存**
   - 输入 WiFi 密码
   - 勾选"记住密码"
   - 检查密码是否保存成功
   - 下次打开时检查是否自动填充

#### 1.2 权限检查

**iOS**:
- 确保位置权限已授予（设置 → 隐私 → 位置服务）
- 确保应用有位置权限

**Android**:
- 确保位置权限已授予
- 确保 WiFi 权限已授予

---

### 2. Tuya 账户验证

#### 2.1 环境变量检查

**在 Vercel Dashboard 中检查**:
- `TUYA_IOS_SDK_APP_KEY` - iOS SDK App Key
- `TUYA_IOS_SDK_APP_SECRET` - iOS SDK App Secret
- `TUYA_ANDROID_SDK_APP_KEY` - Android SDK App Key
- `TUYA_ANDROID_SDK_APP_SECRET` - Android SDK App Secret
- `TUYA_ANDROID_SDK_SHA256` - Android App SHA256 签名

**验证方法**:
```bash
# 测试 iOS SDK 配置
curl https://smart-warehouse-five.vercel.app/api/mqtt/tuya/sdk-config?platform=ios

# 测试 Android SDK 配置
curl https://smart-warehouse-five.vercel.app/api/mqtt/tuya/sdk-config?platform=android
```

**预期响应**:
```json
{
  "appKey": "...",
  "appSecret": "..."
}
```

#### 2.2 数据库结构检查

**检查 users 表是否有 Tuya 账户字段**:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN (
  'tuya_account',
  'tuya_password',
  'tuya_country_code',
  'tuya_access_token',
  'tuya_token_expires_at'
);
```

**如果缺少字段，运行迁移脚本**:
```sql
-- 运行 scripts/add-tuya-user-account-fields.sql
```

#### 2.3 自动创建账户测试

**测试步骤**:
1. 登录应用
2. 打开配网模态框
3. 选择 Tuya 品牌
4. 系统应该自动：
   - 检查用户是否有 Tuya 账户
   - 如果没有，自动创建账户
   - 自动登录到 Tuya SDK

**验证方法**:
- 检查浏览器控制台日志
- 检查数据库中的 `tuya_account` 字段
- 检查是否有错误消息

#### 2.4 登录状态检查

**测试步骤**:
1. 打开配网模态框
2. 系统应该检查 Tuya 登录状态
3. 如果未登录，应该自动登录

**验证方法**:
- 检查浏览器控制台日志
- 检查是否有登录错误
- 测试配网功能是否正常

---

## 🔧 使用验证脚本

### 运行验证脚本

```bash
# 安装依赖（如果需要）
npm install

# 运行验证脚本
npx tsx scripts/verify-wifi-tuya-connection.ts
```

**脚本会检查**:
- WiFi 插件可用性
- 权限状态
- 密码保存/获取功能
- Tuya SDK 配置
- 数据库结构
- API 端点可用性

---

## 🐛 常见问题

### WiFi 扫描不工作

**问题**: 无法获取当前 SSID 或扫描网络

**解决方案**:
1. 检查位置权限是否已授予
2. 检查 Info.plist 中是否有位置权限描述
3. 在设备设置中手动授予权限
4. 重启应用

### SSID 输入不工作

**问题**: 无法在输入框中输入 SSID

**解决方案**:
1. 检查输入框是否被禁用（`disabled={status !== 'idle'}`）
2. 检查是否有 JavaScript 错误
3. 检查状态管理是否正确

### Tuya 账户创建失败

**问题**: 自动创建账户失败

**解决方案**:
1. 检查环境变量是否设置
2. 检查数据库字段是否存在
3. 检查 API 端点是否可用
4. 查看服务器日志

### Tuya 登录失败

**问题**: 无法登录到 Tuya SDK

**解决方案**:
1. 检查账户是否已创建
2. 检查密码是否正确
3. 检查 SDK 配置是否正确
4. 检查网络连接

---

## ✅ 验证成功标准

### WiFi 功能
- ✅ 可以自动获取当前 SSID
- ✅ 可以扫描可用网络
- ✅ 可以手动输入 SSID
- ✅ 可以保存和获取密码
- ✅ 密码在下次打开时自动填充

### Tuya 账户功能
- ✅ 环境变量已设置
- ✅ SDK 配置 API 可用
- ✅ 数据库字段存在
- ✅ 可以自动创建账户
- ✅ 可以自动登录
- ✅ 配网功能正常

---

## 📝 测试报告模板

```
测试日期: [日期]
测试平台: [iOS/Android/Web]
测试人员: [姓名]

WiFi 功能:
- [ ] 自动获取 SSID: [通过/失败]
- [ ] WiFi 扫描: [通过/失败]
- [ ] 手动输入 SSID: [通过/失败]
- [ ] 密码保存: [通过/失败]
- [ ] 密码自动填充: [通过/失败]

Tuya 账户功能:
- [ ] 环境变量: [通过/失败]
- [ ] SDK 配置: [通过/失败]
- [ ] 数据库结构: [通过/失败]
- [ ] 自动创建账户: [通过/失败]
- [ ] 自动登录: [通过/失败]
- [ ] 配网功能: [通过/失败]

问题记录:
[记录任何发现的问题]

备注:
[其他备注]
```

---

## 🚀 下一步

1. 运行验证脚本
2. 在移动应用中测试所有功能
3. 记录测试结果
4. 修复发现的问题
5. 重新测试直到所有功能正常

