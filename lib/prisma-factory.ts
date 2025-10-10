import { PrismaClient } from '@prisma/client'

// Factory function to create fresh Prisma clients
export function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL + (process.env.NODE_ENV === 'production' ? '?pgbouncer=true&connection_limit=1' : ''),
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
