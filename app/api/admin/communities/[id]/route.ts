import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const communityId = params.id

    // Check if user is super admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true }
    })

    const isSuperAdmin = !!user?.isAdmin

    // If not super admin, check if user is admin for this specific community
    if (!isSuperAdmin) {
      const communityMember = await prisma.communityMember.findFirst({
        where: {
          userId: userId,
          communityId: communityId,
          role: 'ADMIN'
        }
      })

      if (!communityMember) {
        return NextResponse.json({ error: 'Access denied. You are not an admin for this community.' }, { status: 403 })
      }
    }

    const community = await prisma.community.findUnique({
      where: { id: communityId }
    })

    if (!community) {
      return NextResponse.json({ error: 'Community not found' }, { status: 404 })
    }

    return NextResponse.json({ community })
  } catch (error) {
    console.error('Error fetching community:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
