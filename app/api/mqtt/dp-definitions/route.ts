// API endpoint for DP definitions
// 獲取所有品牌的 DP 定義
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { VENDOR_DPS } from '@/lib/iot-dp'

export const dynamic = 'force-dynamic'

/**
 * GET /api/mqtt/dp-definitions
 * Get all predefined DP definitions for all vendors
 * 
 * Query params:
 * - vendor: Filter by vendor (tuya, midea, philips, etc.)
 * - category: Filter by device category
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const vendor = searchParams.get('vendor')
    const category = searchParams.get('category')

    let result: Record<string, any> = {}

    if (vendor) {
      const vendorLower = vendor.toLowerCase()
      if (VENDOR_DPS[vendorLower]) {
        if (category) {
          // Specific vendor and category
          const categoryDPs = VENDOR_DPS[vendorLower][category]
          if (categoryDPs) {
            result = { [vendorLower]: { [category]: categoryDPs } }
          }
        } else {
          // All categories for vendor
          result = { [vendorLower]: VENDOR_DPS[vendorLower] }
        }
      }
    } else {
      // All vendors
      result = VENDOR_DPS
    }

    // Get summary statistics
    const summary = {
      vendors: Object.keys(VENDOR_DPS).length,
      categories: Object.values(VENDOR_DPS).reduce(
        (acc, v) => acc + Object.keys(v).length,
        0
      ),
      totalDPs: Object.values(VENDOR_DPS).reduce(
        (acc, v) => acc + Object.values(v).reduce(
          (a, c) => a + c.dps.length,
          0
        ),
        0
      ),
    }

    return NextResponse.json({
      success: true,
      summary,
      definitions: result,
    })
  } catch (error: any) {
    console.error('Error fetching DP definitions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch DP definitions' },
      { status: 500 }
    )
  }
}
