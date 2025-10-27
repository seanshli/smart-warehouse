import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdminEmail } from '@/lib/admin'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

async function ensureAdmin() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email || null
  if (!isAdminEmail(email)) {
    return null
  }
  return session
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await ensureAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const household = await prisma.household.findUnique({
    where: { id: params.id },
    include: {
      members: { include: { user: { select: { id: true, email: true, name: true } } } },
      rooms: true,
      categories: true,
      items: true,
      _count: { select: { items: true, members: true } },
    },
  })
  if (!household) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ household })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await ensureAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  
  try {
    console.log(`[Admin] Attempting to delete household: ${params.id}`)
    
    // First check if household exists
    const household = await prisma.household.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { items: true, members: true, rooms: true, categories: true }
        }
      }
    })
    
    if (!household) {
      console.log(`[Admin] Household not found: ${params.id}`)
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }
    
    console.log(`[Admin] Household found: ${household.name}, items: ${household._count.items}, members: ${household._count.members}`)
    
    // Delete the household using a transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // First, manually delete related records to ensure they're gone
      await tx.householdMember.deleteMany({
        where: { householdId: params.id }
      })
      
      await tx.item.deleteMany({
        where: { householdId: params.id }
      })
      
      await tx.room.deleteMany({
        where: { householdId: params.id }
      })
      
      await tx.category.deleteMany({
        where: { householdId: params.id }
      })
      
      // Finally, delete the household
      return await tx.household.delete({ 
        where: { id: params.id } 
      })
    })
    
    console.log(`[Admin] Household deleted successfully: ${result.id}`)
    
    return NextResponse.json({ 
      ok: true, 
      deletedHousehold: {
        id: result.id,
        name: result.name
      }
    })
  } catch (error) {
    console.error(`[Admin] Error deleting household ${params.id}:`, error)
    return NextResponse.json(
      { error: 'Failed to delete household', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await ensureAdmin()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const data = await request.json()
  const updated = await prisma.household.update({ where: { id: params.id }, data })
  return NextResponse.json({ household: updated })
}


