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

    // Find duplicate households by name
    const households = await prisma.household.findMany({
      select: { id: true, name: true, createdAt: true }
    })

    const nameGroups = households.reduce((acc, household) => {
      const name = household.name.toLowerCase().trim()
      if (!acc[name]) {
        acc[name] = []
      }
      acc[name].push(household)
      return acc
    }, {} as Record<string, any[]>)

    const duplicates = Object.entries(nameGroups)
      .filter(([name, households]) => households.length > 1)
      .map(([name, households]) => households)

    let deletedCount = 0
    const deletedHouseholds = []

    for (const duplicateGroup of duplicates) {
      // Keep the oldest household, delete the rest
      const sorted = duplicateGroup.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      
      const toDelete = sorted.slice(1) // Keep the first (oldest), delete the rest
      
      for (const household of toDelete) {
        try {
          await prisma.household.delete({
            where: { id: household.id }
          })
          deletedCount++
          deletedHouseholds.push(household.name)
        } catch (error) {
          console.error(`Failed to delete household ${household.name}:`, error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      deletedHouseholds,
      message: `Cleaned up ${deletedCount} duplicate households`
    })

  } catch (error) {
    console.error('Error cleaning up households:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup households', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
