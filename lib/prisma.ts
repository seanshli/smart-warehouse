// Prisma 資料庫客戶端 (Prisma 7)
// 提供與資料庫的連線和操作，針對 Supabase 進行了優化設定

// Ensure environment variables are loaded before Prisma initialization
import { config } from 'dotenv'
import { resolve } from 'path'
import { existsSync } from 'fs'

// Load .env.local file if it exists (for local development and scripts)
const envLocalPath = resolve(process.cwd(), '.env.local')
const envPath = resolve(process.cwd(), '.env')

if (existsSync(envLocalPath)) {
  config({ path: envLocalPath, override: true })
} else if (existsSync(envPath)) {
  config({ path: envPath, override: true })
}

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// 全域 Prisma 客戶端（用於開發環境的熱重載）
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

// 創建 PostgreSQL 連線池
function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL
  
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required')
  }
  
  // 生產環境連線參數
  const isProduction = process.env.NODE_ENV === 'production'
  
  return new Pool({
    connectionString,
    ssl: isProduction ? { rejectUnauthorized: false } : undefined,
    max: isProduction ? 1 : 10, // 生產環境限制連線數
    idleTimeoutMillis: isProduction ? 0 : 30000,
    connectionTimeoutMillis: 30000,
  })
}

// 創建 Prisma 客戶端，使用 Prisma 7 adapter 模式
function createPrismaClient(): PrismaClient {
  const pool = globalForPrisma.pool ?? createPool()
  
  // 保存 pool 到全域變數（用於熱重載）
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.pool = pool
  }
  
  const adapter = new PrismaPg(pool)
  
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    adapter,
    // 添加事務選項以防止預備語句衝突
    transactionOptions: {
      maxWait: 5000, // 最大等待時間：5 秒
      timeout: 10000, // 超時時間：10 秒
    },
  })
}

// 創建或重用 Prisma 客戶端
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// 在非生產環境中，將 Prisma 客戶端保存到全域變數（用於熱重載）
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
