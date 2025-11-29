import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/mailbox/[id]/checkout
 * Check out mail (mark mailbox as empty)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const mailboxId = params.id

    // Get mailbox with related household
    const mailbox = await prisma.mailbox.findUnique({
      where: { id: mailboxId },
      include: {
        household: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    })

    if (!mailbox) {
      return NextResponse.json({ error: 'Mailbox not found' }, { status: 404 })
    }

    // Check if user is a member of the household
    if (!mailbox.household || mailbox.household.members.length === 0) {
      return NextResponse.json(
        { error: 'You are not a member of this household' },
        { status: 403 }
      )
    }

    if (!mailbox.hasMail) {
      return NextResponse.json(
        { error: 'Mailbox is already empty' },
        { status: 400 }
      )
    }

    // Mark mailbox as empty
    await prisma.mailbox.update({
      where: { id: mailboxId },
      data: {
        hasMail: false,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Mail checked out successfully',
    })
  } catch (error) {
    console.error('Error checking out mail:', error)
    return NextResponse.json(
      { error: 'Failed to check out mail' },
      { status: 500 }
    )
  }
}

