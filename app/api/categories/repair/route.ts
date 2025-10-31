import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!(session?.user as any)?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session?.user as any)?.id
    const { searchParams } = new URL(request.url)
    const householdId = searchParams.get('householdId') || undefined
    const dryrun = searchParams.get('dryrun') === 'true'

    // Resolve household
    const household = await prisma.household.findFirst({
      where: {
        id: householdId,
        members: { some: { userId } }
      }
    })

    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 })
    }

    const { getNormalizedCategoryKey } = await import('@/lib/category-translations')

    // Fetch full tree
    const categories = await prisma.category.findMany({
      where: { householdId: household.id },
      include: { children: true, items: true },
      orderBy: [{ level: 'asc' }, { name: 'asc' }]
    })

    let fixes = { repairedLevels: 0, reparentedOrphans: 0, mergedDuplicates: 0 }

    // 1) Fix invalid levels (>3) and negatives
    for (const cat of categories) {
      const safeLevel = Math.min(Math.max(cat.level ?? 1, 1), 3)
      if (safeLevel !== cat.level && !dryrun) {
        await prisma.category.update({ where: { id: cat.id }, data: { level: safeLevel } })
        fixes.repairedLevels++
      }
    }

    // 2) Re-parent orphans (parentId not found) to level 1
    const idSet = new Set(categories.map(c => c.id))
    for (const cat of categories) {
      if (cat.parentId && !idSet.has(cat.parentId)) {
        if (!dryrun) await prisma.category.update({ where: { id: cat.id }, data: { parentId: null, level: 1 } })
        fixes.reparentedOrphans++
      }
    }

    // 3) Merge duplicates within same parent by normalized key (exact duplicates only)
    const byParent = new Map<string, any[]>()
    for (const cat of categories) {
      const key = `${cat.parentId || 'root'}`
      if (!byParent.has(key)) byParent.set(key, [])
      byParent.get(key)!.push(cat)
    }

    for (const [parentKey, cats] of byParent.entries()) {
      const groups = new Map<string, any[]>()
      for (const c of cats) {
        const k = getNormalizedCategoryKey(c.name)
        if (!groups.has(k)) groups.set(k, [])
        groups.get(k)!.push(c)
      }

      for (const [norm, group] of groups.entries()) {
        if (group.length <= 1) continue
        // Keep oldest with most items
        group.sort((a, b) => {
          const byItems = (b.items?.length || 0) - (a.items?.length || 0)
          if (byItems !== 0) return byItems
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        })
        const keep = group[0]
        const remove = group.slice(1)
        for (const r of remove) {
          if (!dryrun) {
            await prisma.$transaction([
              prisma.item.updateMany({ where: { categoryId: r.id }, data: { categoryId: keep.id } }),
              prisma.category.updateMany({ where: { parentId: r.id }, data: { parentId: keep.id } }),
              prisma.category.delete({ where: { id: r.id } })
            ])
          }
          fixes.mergedDuplicates++
        }
      }
    }

    return NextResponse.json({ success: true, fixes, dryrun, householdId: household.id })
  } catch (error: any) {
    console.error('Categories repair failed:', error)
    return NextResponse.json({ error: error.message || 'Failed to repair categories' }, { status: 500 })
  }
}


