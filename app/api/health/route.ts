import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

/**
 * Health check endpoint
 * Verifies database connection and key system components
 * Public endpoint - no authentication required for basic health checks
 */
export async function GET(request: NextRequest) {
  const checks: Record<string, { status: 'ok' | 'error'; message: string; details?: any }> = {}
  let overallStatus = 'ok'

  // Check database connection
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = {
      status: 'ok',
      message: 'Database connection successful'
    }
  } catch (error) {
    checks.database = {
      status: 'error',
      message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.stack : String(error) }
    }
    overallStatus = 'error'
  }

  // Check maintenance tables exist
  try {
    const tables = [
      'suppliers',
      'working_crews',
      'crew_members',
      'maintenance_tickets',
      'maintenance_ticket_work_logs',
      'maintenance_ticket_signoffs'
    ]

    const missingTables: string[] = []
    for (const table of tables) {
      try {
        await prisma.$queryRawUnsafe(`SELECT 1 FROM ${table} LIMIT 1`)
      } catch {
        missingTables.push(table)
      }
    }

    if (missingTables.length === 0) {
      checks.maintenanceTables = {
        status: 'ok',
        message: 'All maintenance tables exist',
        details: { tables }
      }
    } else {
      checks.maintenanceTables = {
        status: 'error',
        message: `Missing tables: ${missingTables.join(', ')}`,
        details: { missing: missingTables, expected: tables }
      }
      overallStatus = 'error'
    }
  } catch (error) {
    checks.maintenanceTables = {
      status: 'error',
      message: `Error checking tables: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.stack : String(error) }
    }
    overallStatus = 'error'
  }

  // Check environment variables
  const requiredEnvVars = ['DATABASE_URL', 'NEXTAUTH_URL', 'NEXTAUTH_SECRET']
  const missingEnvVars = requiredEnvVars.filter(key => !process.env[key])

  if (missingEnvVars.length === 0) {
    checks.environment = {
      status: 'ok',
      message: 'All required environment variables are set'
    }
  } else {
    checks.environment = {
      status: 'error',
      message: `Missing environment variables: ${missingEnvVars.join(', ')}`,
      details: { missing: missingEnvVars }
    }
    overallStatus = 'error'
  }

  // Check Vercel deployment
  const vercelUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL
  checks.vercel = {
    status: vercelUrl ? 'ok' : 'error',
    message: vercelUrl 
      ? `Vercel URL configured: ${vercelUrl}` 
      : 'Vercel URL not configured',
    details: { url: vercelUrl || 'Not set' }
  }

  // Get basic stats
  try {
    const [userCount, ticketCount] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.maintenanceTicket.count().catch(() => 0)
    ])

    checks.stats = {
      status: 'ok',
      message: 'System statistics retrieved',
      details: {
        users: userCount,
        maintenanceTickets: ticketCount
      }
    }
  } catch (error) {
    checks.stats = {
      status: 'error',
      message: `Failed to get stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: { error: error instanceof Error ? error.stack : String(error) }
    }
  }

  const statusCode = overallStatus === 'ok' ? 200 : 503

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.66',
      checks
    },
    { status: statusCode }
  )
}
