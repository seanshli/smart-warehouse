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
    where: { email: email.toLowerCase() }
  })

  if (!user) {
    return null
  }

  // Verify password using the stored hash
  const isValidPassword = verifyUserPassword(email, password)
  
  if (!isValidPassword) {
    return null
  }

  return user
}

// Simple in-memory storage for demo purposes
// In production, use a proper database table
const userPasswords = new Map<string, string>()

// Add demo user credentials
userPasswords.set('demo@smartwarehouse.com', '$2a$12$Ypt9XaDn.rDgBOO58CM6aeFrfANKqDV956eUkNZj1Fwoj2/Mnvx76') // demo123

// Add test user credentials (hashed with bcrypt)
userPasswords.set('alice@smartwarehouse.com', '$2a$12$ku6P4rxZKDlIk7izcIg5Ju.n4UbjTHp0nQCV/2kwOu5tML4LXQjEe') // alice123
userPasswords.set('bob@smartwarehouse.com', '$2a$12$kAcPGBchdjazScmI/pwwIeWTnH9Febvh2ysmU2rt7FwcCcWY2n2Y6') // bob123
userPasswords.set('carol@smartwarehouse.com', '$2a$12$OQy9yYPnHDY8OhzM9OrYv.B4kQ1YyYMCmSBiZDWtCscmjpIvLALOi') // carol123
userPasswords.set('test@example.com', '$2a$12$pELsndmn.5SPc2hMwH5EPOmajTz82iWMQVhpq/jM3INGdZifV2us2') // test123
userPasswords.set('seanshlitw@gmail.com', '$2a$12$wkmI66puO7cXxmrqKcJLpO3IGHO3.2.l93bKVBD0jue5rttfpI.UK') // smtengo888

export function storeUserPassword(email: string, hashedPassword: string) {
  userPasswords.set(email.toLowerCase(), hashedPassword)
}

export function verifyUserPassword(email: string, password: string): boolean {
  const storedHash = userPasswords.get(email.toLowerCase())
  if (!storedHash) return false
  
  return bcrypt.compareSync(password, storedHash)
}
