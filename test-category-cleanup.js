// Test script to verify category cleanup logic
const categories = [
  {
    id: "bca480f1-a0e3-465c-9293-596757698069",
    name: "Clothing",
    createdAt: "2025-10-10T09:46:45.076Z"
  },
  {
    id: "cmgl67zmh000dg6sv3j34qvwm", 
    name: "衣服",
    createdAt: "2025-10-10T18:19:27.641Z"
  },
  {
    id: "cmglkknuh0001ccpa6qdjdn72",
    name: "服裝", 
    createdAt: "2025-10-11T01:01:13.316Z"
  }
];

// Group categories by their cross-language equivalents
const categoryGroups = new Map();

for (const category of categories) {
  // Create a normalized key for cross-language matching
  let normalizedKey = category.name.toLowerCase();
  
  // Map Chinese names to English equivalents for grouping
  const chineseToEnglish = {
    '書籍': 'books',
    '服裝': 'clothing',
    '衣服': 'clothing',
    '電子產品': 'electronics',
    '廚房': 'kitchen',
    '其他': 'miscellaneous',
    '工具': 'tools',
    '上衣': 'shirts',
    't-shirt': 'shirts'
  };
  
  // If it's a Chinese name, normalize to English equivalent
  if (chineseToEnglish[category.name]) {
    normalizedKey = chineseToEnglish[category.name];
  }
  
  if (!categoryGroups.has(normalizedKey)) {
    categoryGroups.set(normalizedKey, []);
  }
  categoryGroups.get(normalizedKey).push(category);
}

console.log('Category Groups:');
for (const [key, categories] of categoryGroups) {
  console.log(`\nKey: "${key}"`);
  categories.forEach(cat => {
    console.log(`  - "${cat.name}" (ID: ${cat.id}, Created: ${cat.createdAt})`);
  });
  
  if (categories.length > 1) {
    console.log(`  🎯 DUPLICATES FOUND: ${categories.length} categories`);
    categories.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    console.log(`  ✅ Keep: "${categories[0].name}" (oldest)`);
    categories.slice(1).forEach(cat => {
      console.log(`  🗑️ Delete: "${cat.name}"`);
    });
  }
}
