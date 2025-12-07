#!/usr/bin/env node

/**
 * Direct database script to fix building admins and working team members
 * This script connects directly to Supabase database, no API needed
 * 
 * Usage: node scripts/fix-building-admins-direct.js
 * 
 * Make sure DATABASE_URL is set in your environment or .env file
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function fixBuildingAdmins() {
  try {
    console.log('🔧 開始修復建築管理員和工作團隊成員...\n');

    // Find all building admins
    // Note: We only check role='ADMIN' since memberClass might not exist in all databases
    const buildingMembers = await prisma.buildingMember.findMany({
      where: {
        role: 'ADMIN',
      },
      select: {
        id: true,
        userId: true,
        buildingId: true,
        role: true,
        building: {
          select: {
            id: true,
            name: true,
            communityId: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    console.log(`📊 找到 ${buildingMembers.length} 個建築管理員/工作團隊成員\n`);

    const results = [];
    let fixed = 0;
    let skipped = 0;
    let errors = 0;

    for (const buildingMember of buildingMembers) {
      if (!buildingMember.building?.communityId) {
        skipped++;
        results.push({
          userId: buildingMember.user.id,
          userEmail: buildingMember.user.email,
          buildingId: buildingMember.building?.id,
          buildingName: buildingMember.building?.name,
          role: buildingMember.role,
          status: 'skipped',
          reason: 'Building has no community',
        });
        continue;
      }

      // Check if user already has community membership
      const existingCommunityMembership = await prisma.communityMember.findUnique({
        where: {
          userId_communityId: {
            userId: buildingMember.user.id,
            communityId: buildingMember.building.communityId,
          },
        },
        select: {
          id: true,
          userId: true,
          communityId: true,
          role: true,
        },
      });

      if (existingCommunityMembership) {
        // Already has community membership - check if role needs updating
        if (existingCommunityMembership.role !== 'MEMBER' && existingCommunityMembership.role !== 'ADMIN') {
          // Update role to MEMBER if it's not ADMIN or MEMBER
          // Use raw SQL to avoid memberClass column issue
          await prisma.$executeRaw`
            UPDATE community_members 
            SET role = 'MEMBER'
            WHERE user_id = ${buildingMember.user.id} 
            AND community_id = ${buildingMember.building.communityId}
          `;
          fixed++;
          results.push({
            userId: buildingMember.user.id,
            userEmail: buildingMember.user.email,
            buildingId: buildingMember.building.id,
            buildingName: buildingMember.building.name,
            communityId: buildingMember.building.communityId,
            status: 'updated',
            action: 'Updated role to MEMBER',
          });
        } else {
          skipped++;
          results.push({
            userId: buildingMember.user.id,
            userEmail: buildingMember.user.email,
            buildingId: buildingMember.building.id,
            buildingName: buildingMember.building.name,
            communityId: buildingMember.building.communityId,
            status: 'skipped',
            reason: 'Already has correct community membership',
          });
        }
      } else {
        // Create community membership
        try {
          // Use raw SQL to avoid memberClass column issue
          await prisma.$executeRaw`
            INSERT INTO community_members (id, user_id, community_id, role, created_at, updated_at)
            VALUES (
              gen_random_uuid()::text,
              ${buildingMember.user.id},
              ${buildingMember.building.communityId},
              'MEMBER',
              NOW(),
              NOW()
            )
            ON CONFLICT (user_id, community_id) DO NOTHING
          `;
          fixed++;
          results.push({
            userId: buildingMember.user.id,
            userEmail: buildingMember.user.email,
            buildingId: buildingMember.building.id,
            buildingName: buildingMember.building.name,
            communityId: buildingMember.building.communityId,
            status: 'created',
            action: 'Created community membership',
          });
        } catch (error) {
          errors++;
          results.push({
            userId: buildingMember.user.id,
            userEmail: buildingMember.user.email,
            buildingId: buildingMember.building.id,
            buildingName: buildingMember.building.name,
            communityId: buildingMember.building.communityId,
            status: 'error',
            error: error.message || 'Unknown error',
          });
        }
      }
    }

    console.log('\n✅ 修復完成！\n');
    console.log('📊 摘要:');
    console.log(`   - 總數: ${buildingMembers.length}`);
    console.log(`   - 已修復: ${fixed}`);
    console.log(`   - 跳過: ${skipped}`);
    console.log(`   - 錯誤: ${errors}\n`);

    if (results.length > 0) {
      console.log('📋 詳細結果:');
      results.forEach((r, i) => {
        const icon = r.status === 'created' || r.status === 'updated' ? '✅' : 
                     r.status === 'skipped' ? '⏭️' : '❌';
        console.log(`   ${icon} ${i + 1}. ${r.userEmail} (${r.buildingName}) - ${r.status}${r.reason ? ` (${r.reason})` : ''}${r.action ? ` - ${r.action}` : ''}`);
      });
    }

    return {
      success: true,
      summary: {
        total: buildingMembers.length,
        fixed,
        skipped,
        errors,
      },
      results,
    };
  } catch (error) {
    console.error('\n❌ 錯誤:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixBuildingAdmins()
  .then((result) => {
    console.log('\n🎉 腳本執行成功！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 腳本執行失敗:', error.message);
    process.exit(1);
  });

