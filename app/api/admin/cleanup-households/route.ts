import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true, adminRole: true }
    })

    if (!user?.isAdmin || (user.adminRole !== 'SUPERUSER' && user.adminRole !== 'HOUSEHOLD_MODIFICATION')) {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
    }

    // Find duplicate households by name AND owner (first admin member)
    const households = await prisma.household.findMany({
      select: { 
        id: true, 
        name: true, 
        createdAt: true,
        members: {
          where: { role: 'ADMIN' },
          select: { userId: true, user: { select: { email: true } } },
          take: 1
        }
      }
    })

    // Group by name + owner email combination
    const nameOwnerGroups = households.reduce((acc, household) => {
      const name = household.name.toLowerCase().trim()
      const ownerEmail = household.members[0]?.user?.email || 'unknown'
      const key = `${name}|${ownerEmail}`
      
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(household)
      return acc
    }, {} as Record<string, any[]>)

    const duplicates = Object.entries(nameOwnerGroups)
      .filter(([key, households]) => households.length > 1)
      .map(([key, households]) => households)

    let deletedCount = 0
    const deletedHouseholds = []
    const duplicateGroups = []

    for (const duplicateGroup of duplicates) {
      // Keep the oldest household, delete the rest
      const sorted = duplicateGroup.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      
      const toKeep = sorted[0] // Oldest
      const toDelete = sorted.slice(1) // Delete the rest
      
      const groupInfo = {
        name: toKeep.name,
        owner: toKeep.members[0]?.user?.email || 'unknown',
        kept: { id: toKeep.id, createdAt: toKeep.createdAt },
        deleted: [] as Array<{ id: string; name: string; createdAt: Date | null }>
      }
      
      for (const household of toDelete) {
        try {
          await prisma.household.delete({
            where: { id: household.id }
          })
          deletedCount++
          deletedHouseholds.push(household.name)
          groupInfo.deleted.push({ 
            id: household.id, 
            name: household.name, 
            createdAt: household.createdAt 
          })
        } catch (error) {
          console.error(`Failed to delete household ${household.name}:`, error)
        }
      }
      
      if (groupInfo.deleted.length > 0) {
        duplicateGroups.push(groupInfo)
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      deletedHouseholds,
      duplicateGroups,
      message: `Cleaned up ${deletedCount} duplicate households (grouped by name + owner)`
    })

  } catch (error) {
    console.error('Error cleaning up households:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup households', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
