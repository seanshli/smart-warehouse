import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export interface UserCredentials {
  email: string
  password: string
  name?: string
}

export async function createUserWithCredentials(credentials: UserCredentials) {
  const { email, password, name } = credentials

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  })

  if (existingUser) {
    throw new Error('User already exists')
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12)

  // Create user
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name: name || email.split('@')[0],
      language: 'en'
    }
  })

  // Store credentials in a simple way (in production, use a separate credentials table)
  // For now, we'll use a simple approach with environment variables or a separate storage
  // This is a simplified approach for demo purposes
  
  return user
}

export async function verifyUserCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { credentials: true }
  })

  if (!user || !user.credentials) {
    return null
  }

  // Verify password using the stored hash
  const isValidPassword = await bcrypt.compare(password, user.credentials.password)
  
  if (!isValidPassword) {
    return null
  }

  return user
}

export async function storeUserPassword(email: string, hashedPassword: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Create or update credentials
  await prisma.userCredentials.upsert({
    where: { userId: user.id },
    update: { password: hashedPassword },
    create: {
      userId: user.id,
      password: hashedPassword
    }
  })
}

export async function verifyUserPassword(email: string, password: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { credentials: true }
  })

  if (!user || !user.credentials) {
    return false
  }
  
  return await bcrypt.compare(password, user.credentials.password)
}
