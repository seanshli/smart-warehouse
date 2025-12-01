import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/building/[id]/door-bell/active-calls
 * Get all active doorbell calls for a building (for front desk)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const buildingId = params.id

    const activeSessions = await prisma.doorBellCallSession.findMany({
      where: {
        doorBell: {
          buildingId,
        },
        status: {
          in: ['ringing', 'connected'],
        },
      },
      include: {
        doorBell: {
          include: {
            household: {
              select: {
                id: true,
                name: true,
                apartmentNo: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
          take: 50,
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      calls: activeSessions.map(session => ({
        id: session.id,
        doorBellId: session.doorBellId,
        doorBellNumber: session.doorBell.household?.apartmentNo || session.doorBell.doorBellNumber,
        household: session.doorBell.household ? {
          id: session.doorBell.household.id,
          name: session.doorBell.household.name,
          apartmentNo: session.doorBell.household.apartmentNo,
        } : null,
        status: session.status,
        startedAt: session.startedAt,
        connectedAt: session.connectedAt,
        messages: session.messages.map(msg => ({
          id: msg.id,
          text: msg.message,
          from: msg.from,
          timestamp: msg.createdAt,
        })),
      })),
    })
  } catch (error) {
    console.error('Error fetching active calls:', error)
    return NextResponse.json(
      { error: 'Failed to fetch active calls' },
      { status: 500 }
    )
  }
}

