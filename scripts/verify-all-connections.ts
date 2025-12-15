#!/usr/bin/env tsx
/**
 * Comprehensive Connection Verification Script
 * Verifies: Vercel, Supabase, Prisma, API endpoints, and Mobile config
 */

import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import { resolve } from 'path'
import { existsSync } from 'fs'

// Load environment variables
const envLocalPath = resolve(process.cwd(), '.env.local')
const envPath = resolve(process.cwd(), '.env')

if (existsSync(envLocalPath)) {
  config({ path: envLocalPath, override: true })
} else if (existsSync(envPath)) {
  config({ path: envPath, override: true })
}

const prisma = new PrismaClient()

interface VerificationResult {
  name: string
  status: '✅ PASS' | '❌ FAIL' | '⚠️  WARN'
  message: string
  details?: any
}

const results: VerificationResult[] = []

async function verifyDatabaseConnection(): Promise<void> {
  try {
    await prisma.$connect()
    results.push({
      name: 'Database Connection',
      status: '✅ PASS',
      message: 'Successfully connected to Supabase PostgreSQL',
      details: {
        databaseUrl: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@') || 'Not set'
      }
    })
  } catch (error) {
    results.push({
      name: 'Database Connection',
      status: '❌ FAIL',
      message: `Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error }
    })
  }
}

async function verifyMaintenanceTables(): Promise<void> {
  try {
    // Check if maintenance tables exist
    const tables = [
      'suppliers',
      'working_crews',
      'crew_members',
      'maintenance_tickets',
      'maintenance_ticket_work_logs',
      'maintenance_ticket_signoffs'
    ]

    const existingTables: string[] = []
    const missingTables: string[] = []

    for (const table of tables) {
      try {
        // Try to query the table (this will fail if table doesn't exist)
        await prisma.$queryRawUnsafe(`SELECT 1 FROM ${table} LIMIT 1`)
        existingTables.push(table)
      } catch (error) {
        missingTables.push(table)
      }
    }

    if (missingTables.length === 0) {
      results.push({
        name: 'Maintenance Tables',
        status: '✅ PASS',
        message: `All ${tables.length} maintenance tables exist`,
        details: { tables: existingTables }
      })
    } else {
      results.push({
        name: 'Maintenance Tables',
        status: '❌ FAIL',
        message: `Missing tables: ${missingTables.join(', ')}`,
        details: { existing: existingTables, missing: missingTables }
      })
    }
  } catch (error) {
    results.push({
      name: 'Maintenance Tables',
      status: '❌ FAIL',
      message: `Error checking tables: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error }
    })
  }
}

async function verifyPrismaClient(): Promise<void> {
  try {
    // Test a simple query
    const userCount = await prisma.user.count()
    results.push({
      name: 'Prisma Client',
      status: '✅ PASS',
      message: 'Prisma client is working correctly',
      details: { userCount }
    })
  } catch (error) {
    results.push({
      name: 'Prisma Client',
      status: '❌ FAIL',
      message: `Prisma query failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error }
    })
  }
}

function verifyEnvironmentVariables(): void {
  const required = [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET'
  ]

  const optional = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'OPENAI_API_KEY'
  ]

  const missing: string[] = []
  const present: string[] = []
  const optionalPresent: string[] = []

  for (const key of required) {
    if (process.env[key]) {
      present.push(key)
    } else {
      missing.push(key)
    }
  }

  for (const key of optional) {
    if (process.env[key]) {
      optionalPresent.push(key)
    }
  }

  if (missing.length === 0) {
    results.push({
      name: 'Environment Variables',
      status: '✅ PASS',
      message: 'All required environment variables are set',
      details: {
        required: present,
        optional: optionalPresent
      }
    })
  } else {
    results.push({
      name: 'Environment Variables',
      status: '❌ FAIL',
      message: `Missing required variables: ${missing.join(', ')}`,
      details: { missing, present, optional: optionalPresent }
    })
  }
}

function verifyVercelConfig(): void {
  const vercelUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL
  const expectedUrl = 'https://smart-warehouse-five.vercel.app'

  if (vercelUrl) {
    results.push({
      name: 'Vercel Configuration',
      status: vercelUrl.includes('vercel.app') ? '✅ PASS' : '⚠️  WARN',
      message: `Vercel URL configured: ${vercelUrl}`,
      details: {
        configured: vercelUrl,
        expected: expectedUrl,
        match: vercelUrl.includes('smart-warehouse-five')
      }
    })
  } else {
    results.push({
      name: 'Vercel Configuration',
      status: '⚠️  WARN',
      message: 'Vercel URL not configured (may be using local development)',
      details: { expected: expectedUrl }
    })
  }
}

function verifyCapacitorConfig(): void {
  try {
    const fs = require('fs')
    const capacitorConfig = fs.readFileSync('capacitor.config.ts', 'utf-8')
    
    const hasVercelUrl = capacitorConfig.includes('smart-warehouse-five.vercel.app')
    const hasHttps = capacitorConfig.includes('cleartext: false')

    if (hasVercelUrl && hasHttps) {
      results.push({
        name: 'Capacitor Config',
        status: '✅ PASS',
        message: 'Mobile apps configured to use Vercel production URL',
        details: {
          serverUrl: 'https://smart-warehouse-five.vercel.app',
          https: true
        }
      })
    } else {
      results.push({
        name: 'Capacitor Config',
        status: '⚠️  WARN',
        message: 'Capacitor config may not be pointing to production',
        details: {
          hasVercelUrl,
          hasHttps
        }
      })
    }
  } catch (error) {
    results.push({
      name: 'Capacitor Config',
      status: '❌ FAIL',
      message: `Failed to read capacitor.config.ts: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error }
    })
  }
}

async function verifyMaintenanceAPIs(): Promise<void> {
  // Check if maintenance ticket APIs exist
  const apiFiles = [
    'app/api/maintenance/tickets/route.ts',
    'app/api/maintenance/tickets/[id]/route.ts',
    'app/api/maintenance/tickets/[id]/work-log/route.ts',
    'app/api/maintenance/tickets/[id]/complete/route.ts',
    'app/api/maintenance/tickets/[id]/signoff/route.ts',
    'app/api/maintenance/tickets/[id]/conversation/route.ts',
    'app/api/maintenance/front-desk-chat/route.ts',
    'app/api/admin/maintenance/tickets/[id]/evaluate/route.ts',
    'app/api/admin/maintenance/crews/route.ts',
    'app/api/admin/maintenance/suppliers/route.ts'
  ]

  const fs = require('fs')
  const existing: string[] = []
  const missing: string[] = []

  for (const file of apiFiles) {
    if (existsSync(file)) {
      existing.push(file)
    } else {
      missing.push(file)
    }
  }

  if (missing.length === 0) {
    results.push({
      name: 'Maintenance APIs',
      status: '✅ PASS',
      message: `All ${apiFiles.length} maintenance API endpoints exist`,
      details: { endpoints: existing }
    })
  } else {
    results.push({
      name: 'Maintenance APIs',
      status: '❌ FAIL',
      message: `Missing API files: ${missing.length}`,
      details: { existing: existing.length, missing }
    })
  }
}

async function main() {
  console.log('🔍 Verifying All Connections...\n')
  console.log('=' .repeat(60))

  // Run all verifications
  verifyEnvironmentVariables()
  verifyVercelConfig()
  verifyCapacitorConfig()
  await verifyDatabaseConnection()
  await verifyPrismaClient()
  await verifyMaintenanceTables()
  await verifyMaintenanceAPIs()

  // Print results
  console.log('\n📊 Verification Results:\n')
  
  for (const result of results) {
    console.log(`${result.status} ${result.name}`)
    console.log(`   ${result.message}`)
    if (result.details) {
      console.log(`   Details:`, JSON.stringify(result.details, null, 2))
    }
    console.log()
  }

  // Summary
  const passed = results.filter(r => r.status === '✅ PASS').length
  const failed = results.filter(r => r.status === '❌ FAIL').length
  const warnings = results.filter(r => r.status === '⚠️  WARN').length

  console.log('=' .repeat(60))
  console.log(`\n📈 Summary:`)
  console.log(`   ✅ Passed: ${passed}/${results.length}`)
  console.log(`   ❌ Failed: ${failed}/${results.length}`)
  console.log(`   ⚠️  Warnings: ${warnings}/${results.length}`)

  if (failed === 0 && warnings === 0) {
    console.log('\n🎉 All systems ready!')
    process.exit(0)
  } else if (failed > 0) {
    console.log('\n❌ Some checks failed. Please review the errors above.')
    process.exit(1)
  } else {
    console.log('\n⚠️  Some warnings detected. Review above for details.')
    process.exit(0)
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
