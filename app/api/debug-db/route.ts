import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  try {
    // Basic DB identity info
    const [{ current_database, server_addr }]: Array<{ current_database: string; server_addr: string | null }>= await prisma.$queryRawUnsafe(
      "SELECT current_database(), inet_server_addr()"
    ) as any

    // Sample of users to verify which DB this is
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, isAdmin: true },
      take: 20,
      orderBy: { createdAt: 'desc' as any }
    })

    // Redact DATABASE_URL but include host if present
    const dbUrl = process.env.DATABASE_URL || ''
    let host: string | null = null
    try {
      const u = new URL(dbUrl)
      host = u.hostname
    } catch {}

    return NextResponse.json({
      database: {
        current_database,
        server_addr,
        host,
      },
      users
    })
  } catch (error) {
    console.error('debug-db error', error)
    return NextResponse.json({ error: 'Failed to read DB info' }, { status: 500 })
  }
}


