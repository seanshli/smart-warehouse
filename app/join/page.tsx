'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useLanguage } from '@/components/LanguageProvider'
import toast from 'react-hot-toast'
import QRCodeScanner from '@/components/QRCodeScanner'

function JoinPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { t } = useLanguage()
  const [invitationCode, setInvitationCode] = useState('')
  const [type, setType] = useState<'household' | 'building' | 'community'>('household')
  const [loading, setLoading] = useState(false)
  const [targetInfo, setTargetInfo] = useState<any>(null)
  const [showScanner, setShowScanner] = useState(false)

  useEffect(() => {
    const code = searchParams.get('code')
    const typeParam = searchParams.get('type') as 'household' | 'building' | 'community' | null
    
    if (code) {
      setInvitationCode(code)
    }
    if (typeParam && ['household', 'building', 'community'].includes(typeParam)) {
      setType(typeParam)
    }
    
    if (code) {
      checkInvitationCode(code, typeParam || 'household')
    }
  }, [searchParams])

  const checkInvitationCode = async (code: string, targetType: string) => {
    setLoading(true)
    try {
      let endpoint = ''
      if (targetType === 'household') {
        endpoint = `/api/household/join?code=${encodeURIComponent(code)}`
      } else if (targetType === 'building') {
        endpoint = `/api/building/join?code=${encodeURIComponent(code)}`
      } else if (targetType === 'community') {
        endpoint = `/api/community/join?code=${encodeURIComponent(code)}`
      }

      const response = await fetch(endpoint)
      const data = await response.json()

      if (response.ok) {
        setTargetInfo(data)
      } else {
        toast.error(data.error || t('invalidInvitationCode') || 'Invalid invitation code')
      }
    } catch (error) {
      toast.error(t('failedToValidateCode') || 'Failed to validate invitation code')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!session?.user) {
      toast.error(t('pleaseSignIn') || 'Please sign in to join')
      router.push(`/auth/signin?callbackUrl=/join?code=${invitationCode}&type=${type}`)
      return
    }

    setLoading(true)
    try {
      let endpoint = ''
      let body: any = {}

      if (type === 'household') {
        endpoint = '/api/household/join'
        body = { invitationCode, role: 'USER' }
      } else if (type === 'building') {
        endpoint = '/api/building/join'
        body = { invitationCode }
      } else if (type === 'community') {
        endpoint = '/api/community/join'
        body = { invitationCode }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.requiresApproval) {
          toast.success(t('joinRequestSent') || 'Join request sent. Waiting for approval.')
          router.push('/')
          return
        }
        throw new Error(data.error || t('failedToJoin') || 'Failed to join')
      }

      toast.success(t('successfullyJoined') || 'Successfully joined!')
      router.push('/')
    } catch (err: any) {
      toast.error(err.message || t('failedToJoin') || 'Failed to join')
    } finally {
      setLoading(false)
    }
  }

  const handleScan = (code: string) => {
    try {
      const url = new URL(code)
      const codeParam = url.searchParams.get('code')
      const typeParam = url.searchParams.get('type') as 'household' | 'building' | 'community' | null
      
      if (codeParam) {
        setInvitationCode(codeParam)
        if (typeParam && ['household', 'building', 'community'].includes(typeParam)) {
          setType(typeParam)
        }
        checkInvitationCode(codeParam, typeParam || 'household')
        setShowScanner(false)
        toast.success(t('codeScanned') || 'Code scanned successfully')
      } else {
        // Try to use the code directly
        setInvitationCode(code)
        checkInvitationCode(code, 'household')
        setShowScanner(false)
      }
    } catch {
      // Not a URL, use directly
      setInvitationCode(code)
      checkInvitationCode(code, 'household')
      setShowScanner(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('join') || 'Join'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('joinWithInvitationCode') || 'Join using an invitation code'}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              {t('joinType') || 'Join Type'}
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as 'household' | 'building' | 'community')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="household">Household</option>
              <option value="building">Building</option>
              <option value="community">Community</option>
            </select>
          </div>

          <div>
            <label htmlFor="invitationCode" className="block text-sm font-medium text-gray-700 mb-1">
              {t('invitationCode') || 'Invitation Code'}
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                id="invitationCode"
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder={t('enterInvitationCode') || 'Enter invitation code'}
              />
              <button
                type="button"
                onClick={() => setShowScanner(!showScanner)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                {t('scanQRCode') || 'Scan'}
              </button>
            </div>
          </div>

          {showScanner && (
            <div className="bg-gray-50 rounded-lg p-4">
              <QRCodeScanner onScan={handleScan} onError={(err) => toast.error(err)} />
            </div>
          )}

          {targetInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                {t('found') || 'Found'}
              </h4>
              <p className="text-sm text-blue-700">
                {targetInfo.name || targetInfo.household?.name}
              </p>
            </div>
          )}

          <button
            onClick={handleJoin}
            disabled={loading || !invitationCode.trim() || !targetInfo}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></span>
                {t('joining') || 'Joining...'}
              </>
            ) : (
              t('join') || 'Join'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <JoinPageContent />
    </Suspense>
  )
}

