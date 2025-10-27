#!/usr/bin/env node

/**
 * Recovery script for Sean household
 * This script attempts to recover or recreate the Sean household
 * that was accidentally deleted.
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function recoverSeanHousehold() {
  try {
    console.log('🔍 Checking for Sean household recovery options...')
    
    // Check if there are any traces of Sean household in the database
    console.log('\n1. Checking for any remaining Sean household data...')
    
    // Look for any items that might have been associated with Sean household
    const itemsWithSean = await prisma.item.findMany({
      where: {
        OR: [
          { name: { contains: 'Sean', mode: 'insensitive' } },
          { description: { contains: 'Sean', mode: 'insensitive' } }
        ]
      },
      include: {
        household: true
      }
    })
    
    console.log(`Found ${itemsWithSean.length} items with "Sean" in name/description:`)
    itemsWithSean.forEach(item => {
      console.log(`  - ${item.name} (Household: ${item.household?.name || 'Unknown'})`)
    })
    
    // Look for any users with Sean in their email
    const seanUsers = await prisma.user.findMany({
      where: {
        email: { contains: 'sean', mode: 'insensitive' }
      }
    })
    
    console.log(`\nFound ${seanUsers.length} users with "sean" in email:`)
    seanUsers.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user.id})`)
    })
    
    // Check current households
    const currentHouseholds = await prisma.household.findMany({
      include: {
        _count: {
          select: {
            members: true,
            items: true,
            rooms: true,
            categories: true
          }
        }
      }
    })
    
    console.log(`\n2. Current households in database:`)
    currentHouseholds.forEach(household => {
      console.log(`  - ${household.name} (ID: ${household.id})`)
      console.log(`    Members: ${household._count.members}, Items: ${household._count.items}, Rooms: ${household._count.rooms}, Categories: ${household._count.categories}`)
    })
    
    // Check if we can find Sean's user account
    const seanUser = await prisma.user.findFirst({
      where: {
        email: { contains: 'sean', mode: 'insensitive' }
      }
    })
    
    if (seanUser) {
      console.log(`\n3. Found Sean user: ${seanUser.email} (ID: ${seanUser.id})`)
      
      // Check if Sean is a member of any household
      const seanMemberships = await prisma.householdMember.findMany({
        where: {
          userId: seanUser.id
        },
        include: {
          household: true
        }
      })
      
      console.log(`Sean is currently a member of ${seanMemberships.length} households:`)
      seanMemberships.forEach(membership => {
        console.log(`  - ${membership.household.name} (Role: ${membership.role})`)
      })
      
      // If Sean is not a member of any household, offer to create one
      if (seanMemberships.length === 0) {
        console.log('\n4. Sean is not a member of any household.')
        console.log('Would you like to create a new household for Sean?')
        console.log('Run this script with --create-household flag to create a new household.')
      }
    } else {
      console.log('\n3. No Sean user found in database.')
    }
    
    // Check for any orphaned data that might belong to Sean
    console.log('\n5. Checking for orphaned data...')
    
    // Look for items without households (shouldn't happen due to foreign key constraints)
    const orphanedItems = await prisma.item.findMany({
      where: {
        householdId: null
      }
    })
    
    console.log(`Found ${orphanedItems.length} orphaned items (items without household)`)
    
    console.log('\n✅ Recovery analysis complete.')
    
  } catch (error) {
    console.error('❌ Error during recovery analysis:', error)
  } finally {
    await prisma.$disconnect()
  }
}

async function createSeanHousehold() {
  try {
    console.log('🏠 Creating new household for Sean...')
    
    // Find Sean user
    const seanUser = await prisma.user.findFirst({
      where: {
        email: { contains: 'sean', mode: 'insensitive' }
      }
    })
    
    if (!seanUser) {
      console.log('❌ Sean user not found. Cannot create household.')
      return
    }
    
    // Create new household
    const newHousehold = await prisma.household.create({
      data: {
        name: "Sean's Household",
        description: "Recovered household for Sean",
        members: {
          create: {
            userId: seanUser.id,
            role: 'OWNER'
          }
        }
      }
    })
    
    console.log(`✅ Created new household: ${newHousehold.name} (ID: ${newHousehold.id})`)
    console.log(`Sean is now the owner of this household.`)
    
  } catch (error) {
    console.error('❌ Error creating household:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Main execution
const args = process.argv.slice(2)

if (args.includes('--create-household')) {
  createSeanHousehold()
} else {
  recoverSeanHousehold()
}
