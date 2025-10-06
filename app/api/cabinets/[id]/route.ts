import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cabinetId = params.id
    const body = await request.json()
    const { name, description } = body

    // Get user's household
    const household = await prisma.household.findFirst({
      where: {
        members: {
          some: {
            userId: (session?.user as any)?.id
          }
        }
      }
    })

    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    // Verify cabinet exists and belongs to user's household
    const existingCabinet = await prisma.cabinet.findFirst({
      where: {
        id: cabinetId,
        room: {
          householdId: household.id
        }
      },
      include: {
        room: true
      }
    })

    if (!existingCabinet) {
      return NextResponse.json({ error: 'Cabinet not found' }, { status: 404 })
    }

    // Update cabinet
    const updatedCabinet = await prisma.cabinet.update({
      where: { id: cabinetId },
      data: {
        name: name.trim(),
        description: description?.trim() || null
      }
    })

    return NextResponse.json(updatedCabinet)

  } catch (error) {
    console.error('Error updating cabinet:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cabinetId = params.id

    // Get user's household
    const household = await prisma.household.findFirst({
      where: {
        members: {
          some: {
            userId: (session?.user as any)?.id
          }
        }
      }
    })

    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    // Verify cabinet exists and belongs to user's household
    const existingCabinet = await prisma.cabinet.findFirst({
      where: {
        id: cabinetId,
        room: {
          householdId: household.id
        }
      }
    })

    if (!existingCabinet) {
      return NextResponse.json({ error: 'Cabinet not found' }, { status: 404 })
    }

    // Delete cabinet (this will also delete all items in the cabinet due to cascade)
    await prisma.cabinet.delete({
      where: { id: cabinetId }
    })

    return NextResponse.json({ message: 'Cabinet deleted successfully' })

  } catch (error) {
    console.error('Error deleting cabinet:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
