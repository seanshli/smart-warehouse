import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting database schema fix...')
    
    // Add location fields to households table
    await prisma.$executeRaw`
      ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "country" TEXT;
    `
    console.log('✅ Added country column')
    
    await prisma.$executeRaw`
      ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "city" TEXT;
    `
    console.log('✅ Added city column')
    
    await prisma.$executeRaw`
      ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "district" TEXT;
    `
    console.log('✅ Added district column')
    
    await prisma.$executeRaw`
      ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "community" TEXT;
    `
    console.log('✅ Added community column')
    
    await prisma.$executeRaw`
      ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "apartment_no" TEXT;
    `
    console.log('✅ Added apartment_no column')
    
    await prisma.$executeRaw`
      ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
    `
    console.log('✅ Added latitude column')
    
    await prisma.$executeRaw`
      ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
    `
    console.log('✅ Added longitude column')
    
    await prisma.$executeRaw`
      ALTER TABLE "households" ADD COLUMN IF NOT EXISTS "address" TEXT;
    `
    console.log('✅ Added address column')
    
    // Add tags field to items table
    await prisma.$executeRaw`
      ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
    `
    console.log('✅ Added tags column to items table')
    
    // Verify the changes
    const householdColumns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'households' 
      AND column_name IN ('country', 'city', 'district', 'community', 'apartment_no', 'latitude', 'longitude', 'address')
      ORDER BY column_name;
    `
    
    const itemColumns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'items' 
      AND column_name = 'tags';
    `
    
    console.log('✅ Database schema fix completed successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Database schema fixed successfully!',
      householdColumns,
      itemColumns,
      details: 'All missing columns have been added to the database'
    })
    
  } catch (error) {
    console.error('❌ Database fix error:', error)
    return NextResponse.json({
      error: 'Failed to fix database schema',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
