#!/usr/bin/env tsx
/**
 * Verify Migration Script
 * Checks if migration tables exist in Supabase database
 * 
 * Usage: npx tsx scripts/verify-migration.ts
 * 
 * Note: Requires DATABASE_URL in .env.local or .env
 */

import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL not found!')
  console.error('   Please set DATABASE_URL in .env.local or .env')
  console.error('\n   Alternatively, run the SQL queries directly in Supabase SQL Editor:')
  console.error('   See VERIFY_MIGRATION.sql for the queries')
  process.exit(1)
}

const prisma = new PrismaClient()

async function verifyMigration() {
  console.log('🔍 Verifying migration tables...\n')

  const tablesToCheck = ['conversations', 'call_sessions', 'chat_history']
  const results: Record<string, boolean> = {}

  for (const tableName of tablesToCheck) {
    try {
      // Try to query the table - if it exists, this will succeed
      const result = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        ) as exists`,
        tableName
      )

      const exists = result[0]?.exists || false
      results[tableName] = exists

      if (exists) {
        console.log(`✅ ${tableName} - EXISTS`)
      } else {
        console.log(`❌ ${tableName} - NOT FOUND`)
      }
    } catch (error: any) {
      console.error(`❌ ${tableName} - ERROR: ${error.message}`)
      results[tableName] = false
    }
  }

  console.log('\n📊 Checking columns...\n')

  // Check call_sessions columns
  try {
    const columns = await prisma.$queryRawUnsafe<Array<{
      column_name: string
      data_type: string
      is_nullable: string
    }>>(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns 
       WHERE table_name = 'call_sessions' 
       AND column_name IN ('household_id', 'target_household_id', 'rejection_reason', 'conversation_id')
       ORDER BY column_name`
    )

    const expectedColumns = ['household_id', 'target_household_id', 'rejection_reason', 'conversation_id']
    const foundColumns = columns.map(c => c.column_name)

    for (const col of expectedColumns) {
      const found = foundColumns.includes(col)
      const colInfo = columns.find(c => c.column_name === col)
      if (found && colInfo) {
        const nullable = colInfo.is_nullable === 'YES' ? '(nullable)' : '(not null)'
        console.log(`✅ call_sessions.${col} - EXISTS ${nullable}`)
      } else {
        console.log(`❌ call_sessions.${col} - NOT FOUND`)
      }
    }

    // Check if conversation_id is nullable
    const conversationIdCol = columns.find(c => c.column_name === 'conversation_id')
    if (conversationIdCol) {
      if (conversationIdCol.is_nullable === 'YES') {
        console.log(`✅ conversation_id is nullable (correct for household-to-household calls)`)
      } else {
        console.log(`⚠️  conversation_id is NOT nullable (may need to be updated)`)
      }
    }
  } catch (error: any) {
    console.error(`❌ Error checking columns: ${error.message}`)
  }

  console.log('\n📈 Checking indexes...\n')

  // Check indexes
  try {
    const indexes = await prisma.$queryRawUnsafe<Array<{
      indexname: string
      tablename: string
    }>>(
      `SELECT indexname, tablename
       FROM pg_indexes
       WHERE tablename IN ('conversations', 'call_sessions', 'chat_history')
       ORDER BY tablename, indexname`
    )

    const indexesByTable: Record<string, string[]> = {}
    for (const idx of indexes) {
      if (!indexesByTable[idx.tablename]) {
        indexesByTable[idx.tablename] = []
      }
      indexesByTable[idx.tablename].push(idx.indexname)
    }

    for (const table of tablesToCheck) {
      const tableIndexes = indexesByTable[table] || []
      if (tableIndexes.length > 0) {
        console.log(`✅ ${table} - ${tableIndexes.length} indexes found`)
        tableIndexes.forEach(idx => console.log(`   - ${idx}`))
      } else {
        console.log(`⚠️  ${table} - No indexes found`)
      }
    }
  } catch (error: any) {
    console.error(`❌ Error checking indexes: ${error.message}`)
  }

  // Summary
  console.log('\n📋 Summary:\n')
  const allTablesExist = Object.values(results).every(exists => exists)
  
  if (allTablesExist) {
    console.log('✅ All migration tables exist!')
    console.log('✅ Migration appears successful')
  } else {
    console.log('❌ Some tables are missing')
    console.log('⚠️  Please re-run the migration SQL in Supabase')
  }

  await prisma.$disconnect()
}

verifyMigration().catch((error) => {
  console.error('❌ Verification failed:', error)
  process.exit(1)
})
