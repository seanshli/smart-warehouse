# Tuya iOS/Android 原生与 MQTT 集成实现计划

## 📊 当前状态总结

### ✅ 已实现
1. **iOS 原生 Tuya SDK**: 完全实现
2. **Android Tuya SDK**: 框架就绪，待实现
3. **MQTT 客户端**: 基础功能已实现
4. **设备控制 API**: 已实现
5. **设备创建**: 已实现，包含 MQTT 连接

### ❌ 未实现
1. **场景管理**: 完全未实现
2. **跨生态链控制**: 完全未实现
3. **自动化规则引擎**: 完全未实现
4. **MQTT 状态同步**: 部分实现（需要完善）

## 🎯 实现优先级

### Phase 1: 完善 MQTT 集成（高优先级）
1. ✅ 完善设备自动 MQTT 连接
2. ✅ 实现设备状态自动同步
3. ✅ 实现 MQTT 消息路由

### Phase 2: 场景管理（中优先级）
1. ✅ 创建场景数据模型
2. ✅ 实现场景 CRUD API
3. ✅ 实现场景执行引擎
4. ✅ 创建场景管理 UI

### Phase 3: 跨生态链控制（中优先级）
1. ✅ 创建自动化规则数据模型
2. ✅ 实现规则引擎
3. ✅ 实现跨生态链消息路由
4. ✅ 创建规则管理 UI

### Phase 4: Android 原生实现（高优先级）
1. ✅ 集成 Tuya Android SDK
2. ✅ 实现所有配网方法
3. ✅ 实现用户登录/登出
4. ✅ 实现 Tuya Home 管理

## 📋 详细实现步骤

### Step 1: 完善 MQTT 状态同步
- [ ] 创建 MQTT 消息处理服务
- [ ] 实现设备状态主题自动订阅
- [ ] 实现状态更新数据库同步
- [ ] 实现 SSE 实时推送

### Step 2: 场景管理数据模型
```prisma
model Scene {
  id          String
  name        String
  description String?
  householdId String
  enabled     Boolean
  actions     SceneAction[]
  createdAt   DateTime
  updatedAt   DateTime
}

model SceneAction {
  id        String
  sceneId   String
  deviceId  String
  action    String
  value     Json
  order     Int
}
```

### Step 3: 自动化规则数据模型
```prisma
model AutomationRule {
  id          String
  name        String
  description String?
  householdId String
  enabled     Boolean
  source      Json // { type: 'device', deviceId: '...', property: '...' }
  condition   Json // { operator: '>', value: 25 }
  actions     Json // [{ deviceId: '...', action: '...', value: '...' }]
  createdAt   DateTime
  updatedAt   DateTime
}
```

### Step 4: 规则引擎实现
- [ ] MQTT 消息监听器
- [ ] 条件匹配逻辑
- [ ] 动作执行器
- [ ] 防抖/节流机制

