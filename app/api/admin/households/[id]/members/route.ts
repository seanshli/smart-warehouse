import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdminEmail } from '@/lib/admin'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!isAdminEmail(session?.user?.email || null)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { userId, email, role } = await request.json()
  let user = null as any
  if (userId) {
    user = await prisma.user.findUnique({ where: { id: userId } })
  } else if (email) {
    user = await prisma.user.findUnique({ where: { email } })
  }
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const existing = await prisma.householdMember.findUnique({ where: { userId_householdId: { userId: user.id, householdId: params.id } } })
  if (existing) return NextResponse.json({ error: 'Already a member' }, { status: 400 })

  const member = await prisma.householdMember.create({ data: { userId: user.id, householdId: params.id, role } })
  return NextResponse.json({ member })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!isAdminEmail(session?.user?.email || null)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { searchParams } = new URL(request.url)
  const memberId = searchParams.get('memberId')
  if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })
  await prisma.householdMember.delete({ where: { id: memberId } })
  return NextResponse.json({ ok: true })
}


