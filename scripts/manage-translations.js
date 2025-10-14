#!/usr/bin/env node

/**
 * Translation Management Script
 * 
 * This script helps manage item translations for the Smart Warehouse app.
 * It can:
 * 1. List all items that need translation
 * 2. Add new translations
 * 3. Export/import translations
 */

const fs = require('fs');
const path = require('path');

const TRANSLATIONS_FILE = path.join(__dirname, '../lib/item-translations.ts');

function readTranslations() {
  try {
    const content = fs.readFileSync(TRANSLATIONS_FILE, 'utf8');
    // Extract the ITEM_TRANSLATIONS array from the TypeScript file
    const match = content.match(/export const ITEM_TRANSLATIONS: ItemTranslation\[\] = \[([\s\S]*?)\]/);
    if (match) {
      console.log('Current translations:');
      console.log(match[1]);
    }
  } catch (error) {
    console.error('Error reading translations file:', error.message);
  }
}

function addTranslation(original, english, type = 'name') {
  console.log(`Adding translation: "${original}" -> "${english}" (${type})`);
  
  try {
    let content = fs.readFileSync(TRANSLATIONS_FILE, 'utf8');
    
    // Find the end of the ITEM_TRANSLATIONS array
    const arrayEndMatch = content.match(/(ITEM_TRANSLATIONS: ItemTranslation\[\] = \[[\s\S]*?)(\s*\]\s*$)/m);
    
    if (arrayEndMatch) {
      const newTranslation = `  {
    original: '${original}',
    english: '${english}',
    type: '${type}'
  },\n`;
      
      const newContent = content.replace(
        arrayEndMatch[0],
        arrayEndMatch[1] + newTranslation + arrayEndMatch[2]
      );
      
      fs.writeFileSync(TRANSLATIONS_FILE, newContent, 'utf8');
      console.log('✅ Translation added successfully!');
    } else {
      console.error('❌ Could not find translation array in file');
    }
  } catch (error) {
    console.error('❌ Error adding translation:', error.message);
  }
}

function showHelp() {
  console.log(`
Translation Management Script

Usage:
  node scripts/manage-translations.js list                    - List all current translations
  node scripts/manage-translations.js add <original> <english> [type] - Add a new translation
  node scripts/manage-translations.js help                    - Show this help

Examples:
  node scripts/manage-translations.js list
  node scripts/manage-translations.js add "新物品" "New Item" name
  node scripts/manage-translations.js add "這是描述" "This is description" description
`);
}

// Main execution
const command = process.argv[2];

switch (command) {
  case 'list':
    readTranslations();
    break;
  case 'add':
    const original = process.argv[3];
    const english = process.argv[4];
    const type = process.argv[5] || 'name';
    
    if (!original || !english) {
      console.error('❌ Please provide both original and english text');
      console.log('Usage: node scripts/manage-translations.js add "original" "english" [type]');
      process.exit(1);
    }
    
    addTranslation(original, english, type);
    break;
  case 'help':
  default:
    showHelp();
    break;
}
