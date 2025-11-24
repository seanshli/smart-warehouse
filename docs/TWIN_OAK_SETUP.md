# Twin-Oak / 雙橡園 社区设置

## 📋 社区信息

**社区名称**: Twin-Oak / 雙橡園  
**社区 ID**: `e0a5b54e-90c0-4755-a2d6-166c277c699b`  
**邀请码**: `d0708943-4185-4c54-81a1-1ffcc42c8317`

## 👤 社区管理员账户

**邮箱**: `twin-oak-admin@smartwarehouse.com`  
**密码**: `TwinOak2024!@#`  
**角色**: ADMIN  
**权限**: 可以管理整个社区的所有建筑、成员和工作组

## 🏢 建筑列表

### 1. Twin-Oak S1
- **建筑 ID**: `313a3f1a-f42e-414a-84b6-ba6d252b1b5d`
- **管理员邮箱**: `twin-oak-s1-admin@smartwarehouse.com`
- **管理员密码**: `TwinOakS1!@#2024`
- **社区角色**: MANAGER
- **权限**: 可以管理该建筑和社区内的其他建筑

### 2. 雙橡園1812
- **建筑 ID**: `9a1a395a-cb04-4332-91d2-96859c90a915`
- **管理员邮箱**: `twin-oak-1812-admin@smartwarehouse.com`
- **管理员密码**: `TwinOak1812!@#2024`
- **社区角色**: MANAGER
- **权限**: 可以管理该建筑和社区内的其他建筑

### 3. 雙橡園1617
- **建筑 ID**: `0208032a-4cd1-4f43-a0ce-11258286c297`
- **管理员邮箱**: `twin-oak-1617-admin@smartwarehouse.com`
- **管理员密码**: `TwinOak1617!@#2024`
- **社区角色**: MANAGER
- **权限**: 可以管理该建筑和社区内的其他建筑

### 4. Twin-Oak V1
- **建筑 ID**: `d9ea1e56-298a-4239-8ff1-c451a700c43e`
- **管理员邮箱**: `twin-oak-v1-admin@smartwarehouse.com`
- **管理员密码**: `TwinOakV1!@#2024`
- **社区角色**: MANAGER
- **权限**: 可以管理该建筑和社区内的其他建筑

## 🔐 权限说明

### 社区管理员 (ADMIN)
- 可以管理整个社区
- 可以创建、编辑、删除建筑
- 可以管理所有社区成员
- 可以管理工作组

### 建筑管理员 (MANAGER)
- 可以管理社区内的建筑
- 可以查看和管理社区成员
- 可以管理工作组
- 无法删除社区或修改社区基本信息

## 🚀 访问方式

### 社区管理员登录
1. 访问: `https://smart-warehouse-five.vercel.app/auth/signin`
2. 使用邮箱: `twin-oak-admin@smartwarehouse.com`
3. 使用密码: `TwinOak2024!@#`
4. 登录后可以访问: `/community/e0a5b54e-90c0-4755-a2d6-166c277c699b`

### 建筑管理员登录
1. 访问: `https://smart-warehouse-five.vercel.app/auth/signin`
2. 使用对应的建筑管理员邮箱和密码
3. 登录后可以访问对应的建筑页面

## 📝 注意事项

1. **数据隔离**: 所有账户只能看到 Twin-Oak 社区的数据，无法看到其他社区
2. **密码安全**: 建议首次登录后修改密码
3. **权限管理**: 建筑管理员作为 MANAGER 角色，可以管理社区内的建筑，但无法删除社区
4. **邀请码**: 可以使用社区邀请码邀请新成员加入社区

## 🔄 重新运行设置脚本

如果需要重新设置，可以运行：
```bash
npx tsx scripts/setup-twin-oak-community.ts
```

脚本会检查现有数据，不会重复创建已存在的账户和建筑。

