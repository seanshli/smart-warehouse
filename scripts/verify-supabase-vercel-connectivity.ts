#!/usr/bin/env tsx
/**
 * Verify Supabase and Vercel Connectivity
 * Tests database connection, Vercel deployment, and API endpoints
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { existsSync } from 'fs'

// Load environment variables FIRST
const envLocalPath = resolve(process.cwd(), '.env.local')
const envPath = resolve(process.cwd(), '.env')

if (existsSync(envLocalPath)) {
  config({ path: envLocalPath, override: true })
} else if (existsSync(envPath)) {
  config({ path: envPath, override: true })
}

// Import Prisma after env vars are loaded
import { prisma } from '@/lib/prisma'

interface CheckResult {
  name: string
  status: '✅ ONLINE' | '❌ OFFLINE' | '⚠️  WARNING'
  message: string
  details?: any
  responseTime?: number
}

const results: CheckResult[] = []

// Test Supabase Database Connection
async function checkSupabaseConnection(): Promise<void> {
  const startTime = Date.now()
  try {
    // Test basic connection
    await prisma.$connect()
    const responseTime = Date.now() - startTime
    
    // Test a simple query
    const userCount = await prisma.user.count()
    
    // Test workflow tables exist
    const workflowTables = ['workflow_templates', 'workflow_types', 'workflows', 'workflow_steps']
    const existingTables: string[] = []
    const missingTables: string[] = []
    
    for (const table of workflowTables) {
      try {
        await prisma.$queryRawUnsafe(`SELECT 1 FROM ${table} LIMIT 1`)
        existingTables.push(table)
      } catch {
        missingTables.push(table)
      }
    }
    
    results.push({
      name: 'Supabase Database',
      status: '✅ ONLINE',
      message: `Connected successfully (${responseTime}ms)`,
      details: {
        userCount,
        workflowTables: {
          existing: existingTables,
          missing: missingTables.length > 0 ? missingTables : undefined
        },
        databaseUrl: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@') || 'Not set'
      },
      responseTime
    })
  } catch (error) {
    results.push({
      name: 'Supabase Database',
      status: '❌ OFFLINE',
      message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.stack : String(error) },
      responseTime: Date.now() - startTime
    })
  }
}

// Test Vercel Production Deployment
async function checkVercelDeployment(): Promise<void> {
  const vercelUrl = 'https://smart-warehouse-five.vercel.app'
  const startTime = Date.now()
  
  try {
    const response = await fetch(`${vercelUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000) // 10 second timeout
    })
    
    const responseTime = Date.now() - startTime
    const data = await response.json()
    
    if (response.ok && data.status === 'ok') {
      results.push({
        name: 'Vercel Deployment',
        status: '✅ ONLINE',
        message: `Deployment is live and responding (${responseTime}ms)`,
        details: {
          url: vercelUrl,
          version: data.version,
          checks: data.checks,
          timestamp: data.timestamp
        },
        responseTime
      })
    } else {
      results.push({
        name: 'Vercel Deployment',
        status: '⚠️  WARNING',
        message: `Deployment responded but with errors (${responseTime}ms)`,
        details: {
          url: vercelUrl,
          status: data.status,
          checks: data.checks,
          httpStatus: response.status
        },
        responseTime
      })
    }
  } catch (error: any) {
    results.push({
      name: 'Vercel Deployment',
      status: '❌ OFFLINE',
      message: `Failed to reach Vercel: ${error.message || 'Unknown error'}`,
      details: {
        url: vercelUrl,
        error: error.message,
        code: error.code
      },
      responseTime: Date.now() - startTime
    })
  }
}

// Test Database API Endpoint on Vercel
async function checkDatabaseAPI(): Promise<void> {
  const vercelUrl = 'https://smart-warehouse-five.vercel.app'
  const startTime = Date.now()
  
  try {
    const response = await fetch(`${vercelUrl}/api/test/db`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000)
    })
    
    const responseTime = Date.now() - startTime
    const data = await response.json()
    
    if (response.ok && data.status === 'Database connected successfully') {
      results.push({
        name: 'Database API (Vercel)',
        status: '✅ ONLINE',
        message: `API endpoint working (${responseTime}ms)`,
        details: {
          userCount: data.userCount,
          hasDemoUser: !!data.demoUser,
          sampleItems: data.items?.length || 0
        },
        responseTime
      })
    } else {
      results.push({
        name: 'Database API (Vercel)',
        status: '❌ OFFLINE',
        message: `API endpoint failed: ${data.error || 'Unknown error'}`,
        details: {
          status: data.status,
          error: data.error,
          code: data.code
        },
        responseTime
      })
    }
  } catch (error: any) {
    results.push({
      name: 'Database API (Vercel)',
      status: '❌ OFFLINE',
      message: `Failed to reach API: ${error.message || 'Unknown error'}`,
      details: {
        error: error.message,
        code: error.code
      },
      responseTime: Date.now() - startTime
    })
  }
}

// Check Environment Variables
function checkEnvironmentVariables(): void {
  const required = ['DATABASE_URL']
  const recommended = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'NEXTAUTH_URL']
  
  const missing: string[] = []
  const present: string[] = []
  const recommendedPresent: string[] = []
  
  for (const key of required) {
    if (process.env[key]) {
      present.push(key)
    } else {
      missing.push(key)
    }
  }
  
  for (const key of recommended) {
    if (process.env[key]) {
      recommendedPresent.push(key)
    }
  }
  
  if (missing.length === 0) {
    results.push({
      name: 'Environment Variables',
      status: '✅ ONLINE',
      message: 'All required variables are set',
      details: {
        required: present,
        recommended: recommendedPresent.length === recommended.length 
          ? recommendedPresent 
          : { present: recommendedPresent, missing: recommended.filter(k => !process.env[k]) }
      }
    })
  } else {
    results.push({
      name: 'Environment Variables',
      status: '❌ OFFLINE',
      message: `Missing required variables: ${missing.join(', ')}`,
      details: {
        missing,
        present,
        recommended: recommendedPresent
      }
    })
  }
}

// Check Workflow Migration Status
async function checkWorkflowMigration(): Promise<void> {
  try {
    // Check if workflow_type_id is nullable
    const workflowTypeIdNullable = await prisma.$queryRaw<Array<{is_nullable: string}>>`
      SELECT is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'workflow_templates' 
      AND column_name = 'workflow_type_id'
    `
    
    // Check if household_id exists in workflows
    const householdIdExists = await prisma.$queryRaw<Array<{column_name: string}>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'workflows' 
      AND column_name = 'household_id'
    `
    
    const isNullable = workflowTypeIdNullable[0]?.is_nullable === 'YES'
    const hasHouseholdId = householdIdExists.length > 0
    
    if (isNullable && hasHouseholdId) {
      results.push({
        name: 'Workflow Migration',
        status: '✅ ONLINE',
        message: 'Latest migration applied successfully',
        details: {
          workflowTypeIdNullable: isNullable,
          householdIdExists: hasHouseholdId
        }
      })
    } else {
      results.push({
        name: 'Workflow Migration',
        status: '⚠️  WARNING',
        message: 'Migration may not be fully applied',
        details: {
          workflowTypeIdNullable: isNullable,
          householdIdExists: hasHouseholdId,
          action: 'Run: prisma/migrations/make-workflow-template-type-optional-and-add-household.sql'
        }
      })
    }
  } catch (error) {
    results.push({
      name: 'Workflow Migration',
      status: '⚠️  WARNING',
      message: 'Could not verify migration status',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })
  }
}

async function main() {
  console.log('🔍 Verifying Supabase & Vercel Connectivity...\n')
  console.log('='.repeat(70))
  
  // Run checks
  checkEnvironmentVariables()
  await checkSupabaseConnection()
  await checkWorkflowMigration()
  await checkVercelDeployment()
  await checkDatabaseAPI()
  
  // Print results
  console.log('\n📊 Connectivity Status:\n')
  
  for (const result of results) {
    const statusIcon = result.status === '✅ ONLINE' ? '✅' : 
                      result.status === '❌ OFFLINE' ? '❌' : '⚠️'
    console.log(`${statusIcon} ${result.name}`)
    console.log(`   ${result.message}`)
    if (result.responseTime !== undefined) {
      console.log(`   Response Time: ${result.responseTime}ms`)
    }
    if (result.details) {
      console.log(`   Details:`, JSON.stringify(result.details, null, 2))
    }
    console.log()
  }
  
  // Summary
  const online = results.filter(r => r.status === '✅ ONLINE').length
  const offline = results.filter(r => r.status === '❌ OFFLINE').length
  const warnings = results.filter(r => r.status === '⚠️  WARNING').length
  
  console.log('='.repeat(70))
  console.log(`\n📈 Summary:`)
  console.log(`   ✅ Online: ${online}/${results.length}`)
  console.log(`   ❌ Offline: ${offline}/${results.length}`)
  console.log(`   ⚠️  Warnings: ${warnings}/${results.length}`)
  
  if (offline === 0 && warnings === 0) {
    console.log('\n🎉 All systems are online and connected!')
    process.exit(0)
  } else if (offline > 0) {
    console.log('\n❌ Some systems are offline. Please check the errors above.')
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
