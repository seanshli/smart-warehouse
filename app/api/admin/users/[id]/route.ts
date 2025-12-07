import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * DELETE /api/admin/users/[id] - Delete a user
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const currentUser = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { isAdmin: true }
    })

    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Handle both Promise and direct params (Next.js 14 vs 15)
    const resolvedParams = params instanceof Promise ? await params : params
    const userId = resolvedParams.id

    // Validate userId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return NextResponse.json({ 
        error: 'Invalid user ID format',
        details: 'User ID must be a valid UUID'
      }, { status: 400 })
    }

    console.log('[Delete User] Request:', { userId, deletedBy: (session.user as any).id })

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent self-deletion
    if (userId === (session.user as any).id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId }
    })

    console.log('[Delete User] Success:', { userId, email: user.email })

    return NextResponse.json({ 
      message: 'User deleted successfully',
      userId 
    })
  } catch (error) {
    console.error('[Delete User] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorDetails = error instanceof Error ? error.stack : String(error)
    console.error('[Delete User] Error details:', {
      errorMessage,
      errorDetails
    })
    
    // Check if it's a foreign key constraint error
    if (errorMessage.includes('Foreign key constraint') || errorMessage.includes('P2003')) {
      return NextResponse.json(
        { 
          error: 'Cannot delete user. User has associated records that must be removed first.',
          details: 'Please remove all memberships, items, and other associations before deleting.'
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to delete user',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
