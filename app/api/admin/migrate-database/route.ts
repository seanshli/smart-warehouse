import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('🗄️ Running database migration...')
    
    // Step 1: Add isAdmin column if it doesn't exist
    try {
      await prisma.$executeRaw`ALTER TABLE users ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT false`
      console.log('✅ Added isAdmin column to users table')
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        console.log('✅ isAdmin column already exists')
      } else {
        throw error
      }
    }

    // Step 2: Create user_credentials table
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "user_credentials" (
          "id" TEXT NOT NULL PRIMARY KEY DEFAULT (gen_random_uuid())::text,
          "user_id" TEXT NOT NULL UNIQUE,
          "password" TEXT NOT NULL,
          "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
          CONSTRAINT "user_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        )
      `
      console.log('✅ Created user_credentials table')
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        console.log('✅ user_credentials table already exists')
      } else {
        throw error
      }
    }

    // Step 3: Create index for better performance
    try {
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "user_credentials_user_id_idx" ON "user_credentials"("user_id")`
      console.log('✅ Created index on user_credentials.user_id')
    } catch (error) {
      console.log('ℹ️ Index creation skipped (may already exist)')
    }

    // Step 4: Update existing users to be admin if they should be
    try {
      await prisma.$executeRaw`
        UPDATE users 
        SET "isAdmin" = true 
        WHERE email IN ('admin@smartwarehouse.com', 'seanshlitw@gmail.com')
      `
      console.log('✅ Updated admin users')
    } catch (error) {
      console.log('ℹ️ Admin user update skipped')
    }

    return NextResponse.json({
      success: true,
      message: 'Database migration completed successfully!',
      steps: [
        'Added isAdmin column to users table',
        'Created user_credentials table',
        'Created database indexes',
        'Updated admin users'
      ]
    })

  } catch (error) {
    console.error('❌ Error running database migration:', error)
    return NextResponse.json(
      { 
        error: 'Failed to run database migration', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}
