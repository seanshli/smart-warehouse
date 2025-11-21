#!/usr/bin/env node

/**
 * 批量更新 API 路径脚本
 * 将旧的 API 路径更新为新的 warehouse/mqtt 模块路径
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 仓库相关的 API 路径映射
const warehouseApiMappings = {
  '/api/items': '/api/warehouse/items',
  '/api/rooms': '/api/warehouse/rooms',
  '/api/cabinets': '/api/warehouse/cabinets',
  '/api/categories': '/api/warehouse/categories',
  '/api/barcodes': '/api/warehouse/barcodes',
  '/api/search': '/api/warehouse/search',
  '/api/dashboard': '/api/warehouse/dashboard',
  '/api/activities': '/api/warehouse/activities',
  '/api/notifications': '/api/warehouse/notifications',
  '/api/duplicates': '/api/warehouse/duplicates',
  '/api/cleanup-duplicates': '/api/warehouse/cleanup-duplicates',
  '/api/cleanup-category-duplicates': '/api/warehouse/cleanup-category-duplicates',
  '/api/create-demo-items': '/api/warehouse/create-demo-items',
};

// MQTT 相关的 API 路径映射
const mqttApiMappings = {
  '/api/iot': '/api/mqtt/iot',
  '/api/provisioning': '/api/mqtt/provisioning',
  '/api/tuya': '/api/mqtt/tuya',
  '/api/wifi': '/api/mqtt/wifi',
  '/api/homeassistant': '/api/mqtt/homeassistant',
};

// 需要更新的目录
const directoriesToUpdate = [
  'components',
  'app',
  'lib',
];

function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // 更新仓库相关的 API 路径
    for (const [oldPath, newPath] of Object.entries(warehouseApiMappings)) {
      const regex = new RegExp(oldPath.replace(/\//g, '\\/'), 'g');
      if (content.includes(oldPath)) {
        content = content.replace(regex, newPath);
        modified = true;
      }
    }

    // 更新 MQTT 相关的 API 路径
    for (const [oldPath, newPath] of Object.entries(mqttApiMappings)) {
      const regex = new RegExp(oldPath.replace(/\//g, '\\/'), 'g');
      if (content.includes(oldPath)) {
        content = content.replace(regex, newPath);
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
    return false;
  }
}

function walkDirectory(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  function walk(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      // 跳过 node_modules, .git, .next 等目录
      if (entry.isDirectory()) {
        if (!['node_modules', '.git', '.next', 'out', 'dist'].includes(entry.name)) {
          walk(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  walk(dir);
  return files;
}

// 主函数
function main() {
  console.log('🔄 Starting API path migration...\n');

  let totalUpdated = 0;

  for (const dir of directoriesToUpdate) {
    if (!fs.existsSync(dir)) {
      console.log(`⚠️  Directory not found: ${dir}`);
      continue;
    }

    console.log(`📁 Processing directory: ${dir}`);
    const files = walkDirectory(dir);
    
    for (const file of files) {
      if (updateFile(file)) {
        totalUpdated++;
      }
    }
  }

  console.log(`\n✅ Migration complete! Updated ${totalUpdated} files.`);
}

main();

