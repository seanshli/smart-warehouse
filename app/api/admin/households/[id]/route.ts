import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdminEmail } from '@/lib/admin'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

async function ensureAdmin() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email || null
  if (!isAdminEmail(email)) {
    return null
  }
  return session
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await ensureAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const household = await prisma.household.findUnique({
    where: { id: params.id },
    include: {
      members: { include: { user: { select: { id: true, email: true, name: true } } } },
      rooms: true,
      categories: true,
      items: true,
      _count: { select: { items: true, members: true } },
    },
  })
  if (!household) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ household })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await ensureAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await prisma.household.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await ensureAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const data = await request.json()
  const updated = await prisma.household.update({ where: { id: params.id }, data })
  return NextResponse.json({ household: updated })
}


