import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('🏥 Health check: Testing database connection...')
    
    // Simple database query to test connection
    const startTime = Date.now()
    const result = await prisma.$queryRaw`SELECT 1 as test`
    const endTime = Date.now()
    
    const responseTime = endTime - startTime
    
    console.log('🏥 Health check: Database response time:', responseTime, 'ms')
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('🏥 Health check: Database connection failed:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
