import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOrCreateConversation } from '@/lib/messaging/permissions'

// POST /api/maintenance/front-desk-chat - Request chat with front desk
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { householdId, buildingId, communityId, initialMessage, ticketId } = body

    // For building/community admin context, householdId might not be required
    // But we need at least buildingId or communityId
    if (!householdId && !buildingId && !communityId) {
      return NextResponse.json({ error: 'householdId, buildingId, or communityId is required' }, { status: 400 })
    }

    let effectiveBuildingId = buildingId
    let effectiveHouseholdId = householdId

    // If householdId provided, verify user belongs to household
    if (householdId) {
      const membership = await prisma.householdMember.findUnique({
        where: {
          userId_householdId: {
            userId,
            householdId
          }
        }
      })

      if (!membership) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      // Get building from household if not provided
      if (!effectiveBuildingId) {
        const household = await prisma.household.findUnique({
          where: { id: householdId },
          select: { buildingId: true }
        })
        effectiveBuildingId = household?.buildingId || null
      }
    } else {
      // For admin context without household, use buildingId or communityId
      // Find a household in this building/community to use for conversation
      if (effectiveBuildingId) {
        try {
          const building = await prisma.building.findUnique({
            where: { id: effectiveBuildingId },
            include: {
              households: {
                take: 1,
                select: { id: true }
              }
            }
          })
          // Use first household in building as placeholder (for conversation structure)
          effectiveHouseholdId = building?.households[0]?.id || null
        } catch (error) {
          console.error('Error finding household in building:', error)
          // If no households found, create a system conversation without household
          // This requires schema change or we need to handle it differently
        }
      } else if (communityId) {
        try {
          const community = await prisma.community.findUnique({
            where: { id: communityId },
            include: {
              buildings: {
                take: 1,
                include: {
                  households: {
                    take: 1,
                    select: { id: true }
                  }
                }
              }
            }
          })
          effectiveHouseholdId = community?.buildings[0]?.households[0]?.id || null
          effectiveBuildingId = community?.buildings[0]?.id || null
        } catch (error) {
          console.error('Error finding household in community:', error)
        }
      }
    }

    // For admin-to-admin conversations, we might not have a household
    // In this case, we need to create a special conversation type or use a system household
    if (!effectiveHouseholdId) {
      // Try to find or create a system household for admin conversations
      try {
        const systemHousehold = await prisma.household.findFirst({
          where: {
            name: { contains: 'System' },
            buildingId: effectiveBuildingId || undefined
          },
          select: { id: true }
        })
        
        if (systemHousehold) {
          effectiveHouseholdId = systemHousehold.id
        } else if (effectiveBuildingId) {
          // Create a system household for this building if none exists
          const building = await prisma.building.findUnique({
            where: { id: effectiveBuildingId },
            select: { id: true, name: true }
          })
          
          if (building) {
            const newSystemHousehold = await prisma.household.create({
              data: {
                name: `System - ${building.name}`,
                buildingId: effectiveBuildingId,
                description: 'System household for admin conversations'
              }
            })
            effectiveHouseholdId = newSystemHousehold.id
          }
        }
      } catch (error) {
        console.error('Error creating system household:', error)
        return NextResponse.json({ 
          error: 'Could not determine household context for conversation',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 400 })
      }
    }

    if (!effectiveHouseholdId) {
      return NextResponse.json({ error: 'Could not determine household context for conversation' }, { status: 400 })
    }

    // Create or get conversation with front desk
    const conversationId = await getOrCreateConversation(
      userId,
      effectiveHouseholdId,
      effectiveBuildingId,
      ticketId ? 'maintenance_ticket' : 'front_desk',
      ticketId || null
    )

    // If initial message provided, send it
    if (initialMessage) {
      await prisma.message.create({
        data: {
          conversationId,
          senderId: userId,
          content: initialMessage,
          messageType: 'text'
        }
      })

      // Record in chat history
      await prisma.chatHistory.create({
        data: {
          conversationId,
          senderId: userId,
          receiverId: null, // Front desk (will be determined by conversation creator)
          receiverType: 'frontdesk',
          messageType: 'text',
          content: initialMessage
        }
      })
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        household: {
          select: {
            id: true,
            name: true,
            apartmentNo: true
          }
        },
        building: {
          select: {
            id: true,
            name: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      }
    })

    return NextResponse.json({ conversation })
  } catch (error: any) {
    console.error('Error creating front desk chat:', error)
    return NextResponse.json(
      { error: 'Failed to create chat', details: error.message },
      { status: 500 }
    )
  }
}
