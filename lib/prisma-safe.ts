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
  const originalQuery = client.$queryRaw.bind(client)
  const originalExecute = client.$executeRaw.bind(client)

  client.$queryRaw = ((query: any, ...args: any[]) => {
    let lastError: any
    const retryQuery = async () => {
      for (let i = 0; i < 3; i++) {
        try {
          return await originalQuery(query, ...args)
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
    return retryQuery()
  }) as typeof client.$queryRaw

  client.$executeRaw = ((query: any, ...args: any[]) => {
    let lastError: any
    const retryExecute = async () => {
      for (let i = 0; i < 3; i++) {
        try {
          return await originalExecute(query, ...args)
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
    return retryExecute()
  }) as typeof client.$executeRaw

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
