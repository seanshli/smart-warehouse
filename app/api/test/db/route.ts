import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const userCount = await prisma.user.count()
    const demoUser = await prisma.user.findUnique({
      where: { email: 'demo@smartwarehouse.com' }
    })
    
    const items = await prisma.item.findMany({
      take: 5,
      include: {
        room: { select: { name: true } },
        cabinet: { select: { name: true } }
      }
    })
    
    return NextResponse.json({
      status: 'Database connected successfully',
      userCount,
      demoUser: demoUser ? { id: demoUser.id, email: demoUser.email } : null,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        barcode: item.barcode,
        location: `${item.room?.name || 'No Room'} > ${item.cabinet?.name || 'No Cabinet'}`
      }))
    })
  } catch (error: any) {
    console.error('Database test error:', error)
    return NextResponse.json(
      { 
        status: 'Database connection failed',
        error: error.message,
        code: error.code
      },
      { status: 500 }
    )
  }
}
