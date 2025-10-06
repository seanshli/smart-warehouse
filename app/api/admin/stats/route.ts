import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdminEmail } from '@/lib/admin'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!isAdminEmail(session?.user?.email || null)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [users, households, items] = await Promise.all([
    prisma.user.count(),
    prisma.household.count(),
    prisma.item.count(),
  ])

  // Simple per-day/hour counts for last 7 days using createdAt
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const events = await prisma.itemHistory.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' }
  })

  const perDay: Record<string, number> = {}
  const perHour: Record<string, number> = {}
  for (const e of events) {
    const d = new Date(e.createdAt)
    const dayKey = d.toISOString().slice(0, 10)
    const hourKey = d.toISOString().slice(0, 13)
    perDay[dayKey] = (perDay[dayKey] || 0) + 1
    perHour[hourKey] = (perHour[hourKey] || 0) + 1
  }

  return NextResponse.json({ users, households, items, perDay, perHour })
}


