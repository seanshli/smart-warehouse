import { readFileSync } from 'fs';
import { join } from 'path';
import { prisma } from '../lib/prisma';

async function runRLSMigration() {
  try {
    console.log('🔒 Starting RLS migration...');
    
    // Read the SQL migration file
    const migrationPath = join(process.cwd(), 'prisma/migrations/enable-rls-on-all-tables.sql');
    
    // Verify file exists
    try {
      const fs = require('fs');
      if (!fs.existsSync(migrationPath)) {
        throw new Error(`SQL migration file not found at: ${migrationPath}`);
      }
    } catch (err) {
      console.error('❌ Error checking file:', err);
      throw err;
    }
    
    const sql = readFileSync(migrationPath, 'utf-8');
    
    // Verify we got SQL content, not TypeScript
    // Check for TypeScript patterns (import/export statements at start of line)
    const tsPatterns = [
      /^import\s+.*\s+from\s+['"]/m,  // import ... from '...'
      /^export\s+/m,                    // export ...
      /^import\s*\(/m,                  // import(...)
    ];
    
    const hasTypeScript = tsPatterns.some(pattern => pattern.test(sql));
    if (hasTypeScript) {
      throw new Error('ERROR: Read TypeScript file instead of SQL file! Check file path.');
    }
    
    if (!sql.trim().startsWith('--') && !sql.trim().toUpperCase().includes('CREATE') && !sql.trim().toUpperCase().includes('ALTER')) {
      console.warn('⚠️  Warning: SQL file content may not be valid SQL');
    }
    
    console.log('📄 Read migration file, executing SQL...');
    console.log(`📊 SQL file size: ${sql.length} characters`);
    console.log(`📊 SQL file lines: ${sql.split('\n').length}`);
    
    // Execute the SQL migration
    console.log('🚀 Executing RLS migration...');
    console.log('⏳ This may take a few minutes...');
    
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log('✅ RLS migration completed successfully!');
      console.log('🔒 Row Level Security has been enabled on all tables');
    } catch (error: any) {
      console.error('❌ Error executing SQL migration:', error.message);
      console.error('');
      console.error('💡 If the error is due to file size, try running it manually:');
      console.error('   1. Copy the SQL file content');
      console.error('   2. Go to Supabase Dashboard → SQL Editor');
      console.error('   3. Paste and run the SQL');
      console.error('');
      console.error(`   Or use psql: psql $DATABASE_URL -f ${migrationPath}`);
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Error running RLS migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runRLSMigration();

