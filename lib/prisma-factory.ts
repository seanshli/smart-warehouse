import { PrismaClient } from '@prisma/client'

// Factory function to create fresh Prisma clients
export function createPrismaClient(): PrismaClient {
  // Create unique connection string with timestamp to avoid prepared statement conflicts
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(7)
  const connectionParams = process.env.NODE_ENV === 'production' 
    ? `?connection_limit=1&pool_timeout=20&connect_timeout=60&prepared_statements=false&timestamp=${timestamp}_${randomId}`
    : ''
  
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL + connectionParams,
      },
    },
  })
}

// For development, use a singleton
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
