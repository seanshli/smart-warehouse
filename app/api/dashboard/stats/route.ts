import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id

    // Get user's household
    const household = await prisma.household.findFirst({
      where: {
        members: {
          some: {
            userId: userId
          }
        }
      }
    })

    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    // Get dashboard statistics
    const [
      totalItems,
      totalRooms,
      lowStockItems,
      householdMembers,
      recentItems
    ] = await Promise.all([
      // Total items count
      prisma.item.count({
        where: {
          householdId: household.id
        }
      }),
      
      // Total rooms count
      prisma.room.count({
        where: {
          householdId: household.id
        }
      }),
      
      // Low stock items count
      prisma.item.count({
        where: {
          householdId: household.id,
          quantity: {
            lte: prisma.item.fields.minQuantity
          }
        }
      }),
      
      // Household members count
      prisma.householdMember.count({
        where: {
          householdId: household.id
        }
      }),
      
      // Recent activities (last 5) - including checkouts
      prisma.itemHistory.findMany({
        where: {
          item: {
            householdId: household.id
          }
        },
        include: {
          item: {
            select: {
              id: true,
              name: true,
              room: {
                select: {
                  name: true
                }
              },
              cabinet: {
                select: {
                  name: true
                }
              }
            }
          },
          performer: {
            select: {
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      })
    ])

    return NextResponse.json({
      totalItems,
      totalRooms,
      lowStockItems,
      householdMembers,
      recentActivities: recentItems
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
}
