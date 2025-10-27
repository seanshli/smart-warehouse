import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdminEmail } from '@/lib/admin'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    console.log('[Admin] No session or email for add member')
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Check if user is admin in database (consistent with other admin APIs)
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { isAdmin: true }
  })

  console.log('[Admin] Add member auth check:', {
    email: session.user.email,
    isAdmin: user?.isAdmin
  })

  if (!user?.isAdmin) {
    console.log('[Admin] Access denied - not admin user for add member')
    return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
  }

  const { userId, email, role } = await request.json()
  let targetUser = null as any
  if (userId) {
    targetUser = await prisma.user.findUnique({ where: { id: userId } })
  } else if (email) {
    targetUser = await prisma.user.findUnique({ where: { email } })
  }
  if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const existing = await prisma.householdMember.findUnique({ where: { userId_householdId: { userId: targetUser.id, householdId: params.id } } })
  if (existing) return NextResponse.json({ error: 'Already a member' }, { status: 400 })

  const member = await prisma.householdMember.create({ data: { userId: targetUser.id, householdId: params.id, role } })
  return NextResponse.json({ member })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    console.log('[Admin] No session or email for remove member')
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Check if user is admin in database (consistent with other admin APIs)
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { isAdmin: true }
  })

  if (!user?.isAdmin) {
    console.log('[Admin] Access denied - not admin user for remove member')
    return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const memberId = searchParams.get('memberId')
  if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })
  await prisma.householdMember.delete({ where: { id: memberId } })
  return NextResponse.json({ ok: true })
}


