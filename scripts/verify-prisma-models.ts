#!/usr/bin/env ts-node
/**
 * Verify that Prisma Client includes all new models
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verify() {
  console.log('🔍 验证 Prisma Client 模型...\n')

  const models = [
    'community',
    'building',
    'communityMember',
    'workingGroup',
    'workingGroupMember',
    'workingGroupPermission',
  ]

  const results: { model: string; exists: boolean; error?: string }[] = []

  for (const model of models) {
    try {
      const modelClient = (prisma as any)[model]
      if (modelClient) {
        // Try to call a method to verify it's a valid Prisma model
        if (typeof modelClient.findMany === 'function') {
          results.push({ model, exists: true })
          console.log(`✅ ${model} - 存在`)
        } else {
          results.push({ model, exists: false, error: '不是有效的 Prisma 模型' })
          console.log(`❌ ${model} - 不是有效的 Prisma 模型`)
        }
      } else {
        results.push({ model, exists: false, error: '属性不存在' })
        console.log(`❌ ${model} - 属性不存在`)
      }
    } catch (error: any) {
      results.push({ model, exists: false, error: error.message })
      console.log(`❌ ${model} - 错误: ${error.message}`)
    }
  }

  console.log('\n📊 验证结果:')
  console.log('====================')
  const allPassed = results.every(r => r.exists)
  
  if (allPassed) {
    console.log('✅ 所有模型验证通过！')
  } else {
    console.log('❌ 部分模型验证失败:')
    results.filter(r => !r.exists).forEach(r => {
      console.log(`  - ${r.model}: ${r.error}`)
    })
  }

  await prisma.$disconnect()
  process.exit(allPassed ? 0 : 1)
}

verify().catch(error => {
  console.error('验证过程出错:', error)
  process.exit(1)
})

