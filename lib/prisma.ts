// Prisma 資料庫客戶端
// 提供與資料庫的連線和操作，針對 Supabase 進行了優化設定

import { PrismaClient } from '@prisma/client'

// 全域 Prisma 客戶端（用於開發環境的熱重載）
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 創建 Prisma 客戶端，針對 Supabase 進行優化設定
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'], // 開發環境記錄查詢、錯誤、警告
  datasources: {
    db: {
      url: process.env.DATABASE_URL + (process.env.NODE_ENV === 'production' 
        ? '?sslmode=require&connection_limit=1&pool_timeout=0&prepared_statements=false&pgbouncer=true&statement_timeout=30000' // 生產環境連線參數
        : ''), // 開發環境使用預設設定
    },
  },
  // 添加事務選項以防止預備語句衝突
  transactionOptions: {
    maxWait: 5000, // 最大等待時間：5 秒
    timeout: 10000, // 超時時間：10 秒
  },
})

// 在非生產環境中，將 Prisma 客戶端保存到全域變數（用於熱重載）
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}


