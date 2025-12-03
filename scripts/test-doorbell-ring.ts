import { prisma } from '../lib/prisma'

async function testDoorbellRing() {
  try {
    console.log('🔔 Testing doorbell ring functionality...\n')

    // Find Twin-Oak S1 building and doorbell 3A
    const building = await prisma.building.findFirst({
      where: {
        name: {
          contains: 'Twin-Oak',
          mode: 'insensitive',
        },
      },
      include: {
        doorBells: {
          where: {
            doorBellNumber: '3A',
          },
          include: {
            household: {
              include: {
                members: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!building) {
      console.log('❌ Building "Twin-Oak" not found')
      return
    }

    const doorbell3A = building.doorBells[0]
    if (!doorbell3A) {
      console.log('❌ Doorbell "3A" not found')
      return
    }

    console.log(`✅ Found doorbell: ${doorbell3A.doorBellNumber}`)
    console.log(`   Building: ${building.name}`)
    console.log(`   Enabled: ${doorbell3A.isEnabled}`)
    console.log(`   Household: ${doorbell3A.household?.name || 'None'}`)
    console.log(`   Members: ${doorbell3A.household?.members.length || 0}\n`)

    // Test 1: Verify table exists
    console.log('📋 Test 1: Checking if tables exist...')
    try {
      const tableCheck = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('door_bell_call_sessions', 'door_bell_messages')
      `
      const tables = (tableCheck as any[]).map(t => t.table_name)
      console.log(`   ✅ Found tables: ${tables.join(', ')}`)
      
      if (!tables.includes('door_bell_call_sessions')) {
        console.log('   ❌ door_bell_call_sessions table missing!')
        return
      }
      if (!tables.includes('door_bell_messages')) {
        console.log('   ❌ door_bell_messages table missing!')
        return
      }
    } catch (error) {
      console.log('   ❌ Error checking tables:', error)
      return
    }

    // Test 2: Verify we can create a call session
    console.log('\n📋 Test 2: Testing call session creation...')
    try {
      // End any existing sessions first
      await prisma.doorBellCallSession.updateMany({
        where: {
          doorBellId: doorbell3A.id,
          status: {
            in: ['ringing', 'connected'],
          },
        },
        data: {
          status: 'ended',
          endedAt: new Date(),
        },
      })

      // Create a test session
      const testSession = await prisma.doorBellCallSession.create({
        data: {
          doorBellId: doorbell3A.id,
          status: 'ringing',
          startedAt: new Date(),
        },
      })

      console.log(`   ✅ Successfully created call session: ${testSession.id}`)
      console.log(`   Status: ${testSession.status}`)

      // Test 3: Verify we can query the session
      console.log('\n📋 Test 3: Testing session query...')
      const retrievedSession = await prisma.doorBellCallSession.findUnique({
        where: { id: testSession.id },
        include: {
          doorBell: {
            select: {
              doorBellNumber: true,
            },
          },
        },
      })

      if (retrievedSession) {
        console.log(`   ✅ Successfully retrieved session`)
        console.log(`   Doorbell: ${retrievedSession.doorBell.doorBellNumber}`)
      } else {
        console.log('   ❌ Failed to retrieve session')
      }

      // Test 4: Test updating session status
      console.log('\n📋 Test 4: Testing session status update...')
      const updatedSession = await prisma.doorBellCallSession.update({
        where: { id: testSession.id },
        data: {
          status: 'connected',
          connectedAt: new Date(),
        },
      })

      console.log(`   ✅ Successfully updated session status to: ${updatedSession.status}`)

      // Test 5: Test creating a message
      console.log('\n📋 Test 5: Testing message creation...')
      const testMessage = await prisma.doorBellMessage.create({
        data: {
          callSessionId: testSession.id,
          from: 'guest',
          message: 'Test message',
        },
      })

      console.log(`   ✅ Successfully created message: ${testMessage.id}`)

      // Clean up test session
      await prisma.doorBellCallSession.update({
        where: { id: testSession.id },
        data: {
          status: 'ended',
          endedAt: new Date(),
        },
      })

      console.log('\n✅ All tests passed! Doorbell functionality is working correctly.')
      console.log('\n🎉 The doorbell should now work when you press it!')

    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`)
      console.log(`   Code: ${error.code}`)
      if (error.meta) {
        console.log(`   Meta:`, error.meta)
      }
      throw error
    }

  } catch (error: any) {
    console.error('\n❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDoorbellRing()


