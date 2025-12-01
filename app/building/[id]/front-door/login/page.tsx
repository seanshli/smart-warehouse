'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import QRCodeDisplay from '@/components/QRCode'
import toast from 'react-hot-toast'
import { useLanguage } from '@/components/LanguageProvider'
import { BuildingStorefrontIcon } from '@heroicons/react/24/outline'

export default function FrontDoorLoginPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useLanguage()
  const buildingId = params.id as string
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')

  useEffect(() => {
    // Generate QR code URL for auto-login
    if (buildingId) {
      const loginUrl = `${window.location.origin}/building/${buildingId}/front-door/login?auto=true`
      setQrCodeUrl(loginUrl)
    }
  }, [buildingId])

  // Auto-login if QR code is scanned
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.get('auto') === 'true') {
      // Try to auto-login with frontdesk account
      handleAutoLogin()
    }
  }, [])

  const handleAutoLogin = async () => {
    try {
      setLoading(true)
      
      // Try to find frontdesk account for this building
      const frontdeskEmail = `frontdesk@${buildingId}.internal`
      const frontdeskPassword = 'engo888'

      const result = await signIn('credentials', {
        email: frontdeskEmail,
        password: frontdeskPassword,
        redirect: false,
      })

      if (result?.ok) {
        toast.success('Auto-logged in successfully!')
        router.push(`/building/${buildingId}/front-door`)
      } else {
        // If auto-login fails, show manual login form
        setLoading(false)
      }
    } catch (error) {
      console.error('Auto-login error:', error)
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.ok) {
        toast.success('Logged in successfully!')
        router.push(`/building/${buildingId}/front-door`)
      } else {
        toast.error('Invalid credentials')
      }
    } catch (error) {
      toast.error('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <BuildingStorefrontIcon className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Front Door System
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Scan QR code to auto-login or enter credentials manually
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg space-y-6">
          {/* QR Code Section */}
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Quick Login with QR Code
            </h3>
            {qrCodeUrl && (
              <div className="flex justify-center mb-4">
                <QRCodeDisplay value={qrCodeUrl} size={200} />
              </div>
            )}
            <p className="text-sm text-gray-500">
              Scan this QR code with your device to automatically log in
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or login manually</span>
            </div>
          </div>

          {/* Manual Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="frontdesk@building.internal"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Enter password"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Default accounts: frontdesk@[building-id].internal or doorbell@[building-id].internal
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Default password: engo888
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

