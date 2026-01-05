import { prisma } from '../lib/prisma';

async function verifyRLS() {
  try {
    console.log('🔍 Verifying RLS is enabled...\n');
    
    // Check if RLS is enabled on key tables
    const tables = ['users', 'households', 'communities', 'buildings', 'working_groups', 'working_group_members'];
    
    for (const table of tables) {
      try {
        const result = await prisma.$queryRawUnsafe<Array<{ relname: string; relrowsecurity: boolean }>>(
          `SELECT relname, relrowsecurity 
           FROM pg_class 
           WHERE relname = $1 
           AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')`,
          table
        );
        
        if (result.length > 0) {
          const enabled = result[0].relrowsecurity;
          console.log(`${enabled ? '✅' : '❌'} ${table}: RLS ${enabled ? 'ENABLED' : 'DISABLED'}`);
        } else {
          console.log(`⚠️  ${table}: Table not found`);
        }
      } catch (error: any) {
        console.log(`❌ ${table}: Error - ${error.message}`);
      }
    }
    
    // Check if helper functions exist
    console.log('\n🔍 Checking helper functions...');
    const functions = ['get_user_email', 'is_service_role'];
    
    for (const func of functions) {
      try {
        const result = await prisma.$queryRawUnsafe<Array<{ proname: string }>>(
          `SELECT proname 
           FROM pg_proc 
           WHERE proname = $1 
           AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')`,
          func
        );
        
        if (result.length > 0) {
          console.log(`✅ Function ${func}() exists`);
        } else {
          console.log(`❌ Function ${func}() not found`);
        }
      } catch (error: any) {
        console.log(`❌ Function ${func}: Error - ${error.message}`);
      }
    }
    
    // Check policy count
    console.log('\n🔍 Checking policies...');
    try {
      const policyResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count 
         FROM pg_policies 
         WHERE schemaname = 'public'`
      );
      const policyCount = Number(policyResult[0]?.count || 0);
      console.log(`✅ Found ${policyCount} RLS policies`);
    } catch (error: any) {
      console.log(`⚠️  Could not count policies: ${error.message}`);
    }
    
    console.log('\n✅ Verification complete!');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyRLS();

