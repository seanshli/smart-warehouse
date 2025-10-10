import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdminEmail } from '@/lib/admin'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email || null
  if (!isAdminEmail(email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const households = await prisma.household.findMany({
    include: {
      members: {
        include: {
          user: {
            select: { id: true, email: true, name: true }
          }
        }
      },
      rooms: { select: { id: true, name: true } },
      categories: { select: { id: true, name: true, level: true } },
      _count: {
        select: { items: true, members: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json({ households })
}


