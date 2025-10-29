import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import { verifyUserPassword } from './credentials'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  // Force fresh login for multi-user security
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 24 * 60 * 60,
  },
  // Disable session persistence across browser sessions
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  // Use secure cookies for production, but allow SameSite=None for mobile apps
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? `__Secure-next-auth.session-token` 
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'none', // Changed from 'lax' to 'none' for cross-origin support (iOS/Android)
        path: '/',
        secure: true, // Required when sameSite is 'none'
      },
    },
  },
  // Disable automatic session refresh
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signin',
    error: '/auth/signin',
  },
  // Force re-authentication on each device
  callbacks: {
    async signIn({ user, account, profile }) {
      // Log each sign-in attempt for security
      console.log(`[auth] signIn: ${user.email} via ${account?.provider}`)
      return true
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to dashboard after login
      if (url.startsWith('/')) return `${baseUrl}${url}`
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
    async jwt({ token, user, account }) {
      // Force fresh token on each login
      if (user) {
        token.id = user.id
        token.isAdmin = (user as any).isAdmin
        token.loginTime = Date.now()
        token.sessionId = Date.now().toString() // Unique session ID
        console.log('[auth] JWT: New session created for', user.email, 'sessionId:', token.sessionId)
        return token
      }
      
      // For existing tokens, check if session is expired (24 hours)
      if (token.loginTime && Date.now() - (token.loginTime as number) > 24 * 60 * 60 * 1000) {
        console.log('[auth] JWT: Session expired for', token.id)
        return {} // Force re-authentication
      }
      
      // Only check session ID for existing tokens, not new ones
      if (token.id && !token.sessionId) {
        console.log('[auth] JWT: No session ID for existing token, forcing re-authentication')
        return {} // Force re-authentication
      }
      
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string
        (session.user as any).isAdmin = token.isAdmin as boolean
      }
      return session
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        householdId: { label: 'Household ID', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('[auth] authorize: missing email or password')
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email.toLowerCase()
          }
        })

        if (!user) {
          console.log('[auth] authorize: user not found', credentials.email)
          return null
        }

        // Verify password
        const isValidPassword = await verifyUserPassword(credentials.email, credentials.password)
        
        if (!isValidPassword) {
          console.log('[auth] authorize: invalid password for', credentials.email)
          return null
        }

        // Handle household joining if householdId is provided
        if (credentials.householdId) {
          try {
            const household = await prisma.household.findUnique({
              where: { id: credentials.householdId }
            })

            if (household) {
              // Check if user is already a member
              const existingMembership = await prisma.householdMember.findFirst({
                where: {
                  userId: user.id,
                  householdId: household.id
                }
              })

              if (!existingMembership) {
                // Add user to household as a member
                await prisma.householdMember.create({
                  data: {
                    userId: user.id,
                    householdId: household.id,
                    role: 'MEMBER'
                  }
                })
                console.log('[auth] authorize: added user to household', user.email, household.id)
              } else {
                console.log('[auth] authorize: user already member of household', user.email, household.id)
              }
            } else {
              console.log('[auth] authorize: household not found', credentials.householdId)
            }
          } catch (error) {
            console.error('[auth] authorize: error joining household', error)
          }
        }

        console.log('[auth] authorize: success for', user.email, 'isAdmin=', (user as any).isAdmin)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          isAdmin: (user as any).isAdmin || false,
        }
      }
    })
  ],
}

