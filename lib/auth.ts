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
    updateAge: 0, // Don't update session age automatically
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
      }
      
      // Check if session is expired (24 hours)
      if (token.loginTime && Date.now() - (token.loginTime as number) > 24 * 60 * 60 * 1000) {
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
        password: { label: 'Password', type: 'password' }
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

