import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdminEmail } from '@/lib/admin'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!isAdminEmail(session?.user?.email || null)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || undefined

  const items = await prisma.item.findMany({
    where: q ? { OR: [ { name: { contains: q } }, { name: { contains: q.toLowerCase() } }, { name: { contains: q.toUpperCase() } } ] } : undefined,
    select: {
      id: true,
      name: true,
      quantity: true,
      household: { select: { id: true, name: true } },
      room: { select: { id: true, name: true } },
      cabinet: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json({ items })
}


