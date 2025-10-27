import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const householdId = params.id
    const userId = (session.user as any).id

    // Verify user has access to this household
    const household = await prisma.household.findFirst({
      where: {
        id: householdId,
        members: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!household) {
      return NextResponse.json({ error: 'Household not found or access denied' }, { status: 404 })
    }

    return NextResponse.json(household)

  } catch (error) {
    console.error('Error fetching household:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const householdId = params.id
    const userId = (session.user as any).id
    const body = await request.json()

    const {
      name,
      description,
      country,
      city,
      district,
      community,
      apartmentNo,
      address,
      streetAddress,
      telephone,
      latitude,
      longitude
    } = body

    // Verify user has admin or owner access to this household
    const membership = await prisma.householdMember.findFirst({
      where: {
        householdId: householdId,
        userId: userId,
        role: {
          in: ['ADMIN', 'OWNER']
        }
      }
    })

    if (!membership) {
      return NextResponse.json({ 
        error: 'Access denied. Only household administrators and owners can modify household information.' 
      }, { status: 403 })
    }

    // Update household
    const updatedHousehold = await prisma.household.update({
      where: { id: householdId },
      data: {
        name: name?.trim() || undefined,
        description: description?.trim() || null,
        country: country?.trim() || null,
        city: city?.trim() || null,
        district: district?.trim() || null,
        community: community?.trim() || null,
        apartmentNo: apartmentNo?.trim() || null,
        address: address?.trim() || null,
        streetAddress: streetAddress?.trim() || null,
        telephone: telephone?.trim() || null,
        latitude: latitude || null,
        longitude: longitude || null
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedHousehold)

  } catch (error) {
    console.error('Error updating household:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

