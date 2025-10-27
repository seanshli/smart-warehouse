import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Smart Warehouse - AI-Powered Inventory Management',
  description: 'Manage your household inventory with AI-powered item recognition',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Smart Warehouse',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Smart Warehouse',
    title: 'Smart Warehouse - AI-Powered Inventory Management',
    description: 'Manage your household inventory with AI-powered item recognition',
  },
  twitter: {
    card: 'summary',
    title: 'Smart Warehouse',
    description: 'AI-Powered Inventory Management',
  },
  icons: {
    icon: '/icon-192x192.png',
    apple: '/icon-192x192.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#dc2626',
  // iOS specific
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Smart Warehouse',
  },
  // Android specific
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyAHSc802preQitVIaas3o0k8RbLxteSlQQ'}&libraries=places`}
          async
          defer
        />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

