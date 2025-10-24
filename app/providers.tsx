'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from 'next-themes'
import LanguageProvider from '@/components/LanguageProvider'
import { HouseholdProvider } from '@/components/HouseholdProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LanguageProvider>
          <HouseholdProvider>
            {children}
            <Toaster position="top-right" />
          </HouseholdProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}


