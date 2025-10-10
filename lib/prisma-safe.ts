import { PrismaClient } from '@prisma/client'

// Create a safe Prisma client with retry logic for prepared statement conflicts
export function createSafePrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

  // Add retry logic for prepared statement conflicts
  const originalQuery = client.$queryRaw
  const originalExecute = client.$executeRaw

  client.$queryRaw = async (query: any, ...args: any[]) => {
    let lastError: any
    for (let i = 0; i < 3; i++) {
      try {
        return await originalQuery.call(client, query, ...args)
      } catch (error: any) {
        lastError = error
        if (error.message?.includes('prepared statement') || error.message?.includes('42P05')) {
          // Wait a bit and try again
          await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)))
          continue
        }
        throw error
      }
    }
    throw lastError
  }

  client.$executeRaw = async (query: any, ...args: any[]) => {
    let lastError: any
    for (let i = 0; i < 3; i++) {
      try {
        return await originalExecute.call(client, query, ...args)
      } catch (error: any) {
        lastError = error
        if (error.message?.includes('prepared statement') || error.message?.includes('42P05')) {
          // Wait a bit and try again
          await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)))
          continue
        }
        throw error
      }
    }
    throw lastError
  }

  return client
}

// Global singleton for development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createSafePrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
