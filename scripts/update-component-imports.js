#!/usr/bin/env node

/**
 * 批量更新组件导入路径脚本
 * 更新 warehouse 和 mqtt 模块内的相对导入路径
 */

const fs = require('fs');
const path = require('path');

// 需要更新的文件
const filesToUpdate = [
  // Warehouse components
  'components/warehouse/AddItemModal.tsx',
  'components/warehouse/EditItemModal.tsx',
  'components/warehouse/ItemCard.tsx',
  'components/warehouse/ItemsList.tsx',
  'components/warehouse/RoomManagement.tsx',
  'components/warehouse/CategoryManagement.tsx',
  'components/warehouse/SearchModal.tsx',
  'components/warehouse/SearchPage.tsx',
  'components/warehouse/Dashboard.tsx',
  'components/warehouse/DuplicateItemsModal.tsx',
  'components/warehouse/CheckoutModal.tsx',
  'components/warehouse/MoveItemModal.tsx',
  'components/warehouse/QuantityAdjustModal.tsx',
  'components/warehouse/ItemHistoryModal.tsx',
  'components/warehouse/BarcodeScanner.tsx',
  'components/warehouse/TaiwanInvoiceUploader.tsx',
  
  // MQTT components
  'components/mqtt/MQTTPanel.tsx',
  'components/mqtt/ProvisioningModal.tsx',
  'components/mqtt/HomeAssistantPanel.tsx',
  'components/mqtt/HomeAssistantSegments.tsx',
];

// 需要更新的导入映射（从相对路径到正确的路径）
const importMappings = {
  // Warehouse 模块内的组件（保持相对路径，因为它们在同一目录）
  './LanguageProvider': '../LanguageProvider',
  './HouseholdProvider': '../HouseholdProvider',
  './NotificationCenter': '../NotificationCenter',
  './Activities': '../Activities',
  './HouseholdMemberManagement': '../HouseholdMemberManagement',
  './MobileLayout': '../MobileLayout',
  './HouseholdSettings': '../HouseholdSettings',
  './CreateHouseholdModal': '../CreateHouseholdModal',
  './VoiceAssistantPanel': '../VoiceAssistantPanel',
  './ErrorBoundary': '../ErrorBoundary',
  './MQTTPanel': '../mqtt/MQTTPanel',
  './HomeAssistantPanel': '../mqtt/HomeAssistantPanel',
  './ProvisioningModal': '../mqtt/ProvisioningModal',
  
  // MQTT 模块内的组件
  './LanguageProvider': '../LanguageProvider',
  './HouseholdProvider': '../HouseholdProvider',
};

function updateFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // 更新导入路径
    for (const [oldPath, newPath] of Object.entries(importMappings)) {
      // 匹配各种导入格式
      const patterns = [
        new RegExp(`from\\s+['"]${oldPath.replace(/\./g, '\\.')}['"]`, 'g'),
        new RegExp(`import\\s+.*from\\s+['"]${oldPath.replace(/\./g, '\\.')}['"]`, 'g'),
      ];

      for (const pattern of patterns) {
        if (pattern.test(content)) {
          content = content.replace(pattern, (match) => {
            return match.replace(oldPath, newPath);
          });
          modified = true;
        }
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

// 主函数
function main() {
  console.log('🔄 Starting component import path migration...\n');

  let totalUpdated = 0;

  for (const file of filesToUpdate) {
    if (updateFile(file)) {
      totalUpdated++;
    }
  }

  console.log(`\n✅ Migration complete! Updated ${totalUpdated} files.`);
}

main();

