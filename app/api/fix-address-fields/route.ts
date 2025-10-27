import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting address fields database fix...')
    
    // Add street_address field
    await prisma.$executeRaw`
      ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "street_address" TEXT;
    `
    console.log('✅ Added street_address column')
    
    // Add building_address field
    await prisma.$executeRaw`
      ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "building_address" TEXT;
    `
    console.log('✅ Added building_address column')
    
    // Add telephone field
    await prisma.$executeRaw`
      ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "telephone" TEXT;
    `
    console.log('✅ Added telephone column')
    
    // Verify the changes
    const newColumns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'households' 
      AND column_name IN ('street_address', 'building_address', 'telephone')
      ORDER BY column_name;
    `
    
    console.log('✅ Address fields database fix completed successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Address fields added successfully!',
      newColumns,
      details: 'All additional address fields have been added to the database'
    })
    
  } catch (error) {
    console.error('❌ Address fields fix error:', error)
    return NextResponse.json({
      error: 'Failed to add address fields',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
