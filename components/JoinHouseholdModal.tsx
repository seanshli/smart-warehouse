'use client'

import { useState } from 'react'
import { useHousehold } from './HouseholdProvider'
import { useLanguage } from './LanguageProvider'
import { XMarkIcon, QrCodeIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import QRCodeDisplay from './QRCode'
import QRCodeScanner from './QRCodeScanner'

interface JoinHouseholdModalProps {
  onClose: () => void
}

export default function JoinHouseholdModal({ onClose }: JoinHouseholdModalProps) {
  const { refetch } = useHousehold()
  const { t } = useLanguage()
  const [invitationCode, setInvitationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [householdInfo, setHouseholdInfo] = useState<any>(null)
  const [showQRScanner, setShowQRScanner] = useState(false)

  const handleCodeCheck = async () => {
    if (!invitationCode.trim()) {
      toast.error(t('enterInvitationCode') || 'Please enter an invitation code')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/household/join?code=${encodeURIComponent(invitationCode)}`)
      const data = await response.json()

      if (response.ok) {
        setHouseholdInfo(data.household)
        toast.success(`${t('householdFound') || 'Found household'}: ${data.household.name}`)
      } else {
        setError(data.error || t('invalidInvitationCode') || 'Invalid invitation code')
      }
    } catch (error) {
      setError(t('failedToValidateCode') || 'Failed to validate invitation code')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!invitationCode.trim()) {
      toast.error(t('enterInvitationCode') || 'Please enter an invitation code')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/household/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invitationCode: invitationCode.trim(),
          role: 'USER',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Check if it's a join request scenario
        if (data.requiresApproval) {
          toast.success(t('joinRequestSent') || 'Join request sent. Waiting for owner approval.')
          await refetch()
          onClose()
          return
        }
        throw new Error(data.error || t('failedToJoin') || 'Failed to join household')
      }

      toast.success(t('successfullyJoined') || 'Successfully joined household!')
      await refetch()
      onClose()
    } catch (err: any) {
      setError(err.message || t('failedToJoin') || 'Failed to join household')
    } finally {
      setLoading(false)
    }
  }

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setInvitationCode(text)
      toast.success(t('codePasted') || 'Code pasted from clipboard')
    } catch (err) {
      toast.error(t('failedToPaste') || 'Failed to read from clipboard')
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {t('joinHousehold') || 'Join Household'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 dark:bg-red-900 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {householdInfo && (
          <div className="mb-4 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              {t('householdFound') || 'Household Found'}
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {householdInfo.name}
            </p>
            {householdInfo.description && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {householdInfo.description}
              </p>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="invitationCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('invitationCode') || 'Invitation Code'}
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                id="invitationCode"
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder={t('enterInvitationCode') || 'Enter invitation code'}
              />
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                title="Paste from clipboard"
              >
                <ClipboardDocumentIcon className="h-5 w-5 text-gray-500" />
              </button>
              <button
                type="button"
                onClick={() => setShowQRScanner(!showQRScanner)}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                title={t('scanQRCode') || 'Scan QR Code'}
              >
                <QrCodeIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          {showQRScanner && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {t('scanQRCodeToJoin') || 'Scan QR code to join'}
              </p>
              <QRCodeScanner
                onScan={(code) => {
                  // Extract code from URL if it's a full URL
                  try {
                    const url = new URL(code)
                    const codeParam = url.searchParams.get('code')
                    if (codeParam) {
                      setInvitationCode(codeParam)
                    } else {
                      setInvitationCode(code)
                    }
                  } catch {
                    setInvitationCode(code)
                  }
                  setShowQRScanner(false)
                  toast.success('Code scanned successfully')
                }}
                onError={(error) => {
                  toast.error(error)
                }}
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              {t('cancel') || 'Cancel'}
            </button>
            {!householdInfo ? (
              <button
                type="button"
                onClick={handleCodeCheck}
                disabled={loading || !invitationCode.trim()}
                className="px-4 py-2 bg-primary-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></span>
                    {t('checking') || 'Checking...'}
                  </>
                ) : (
                  t('check') || 'Check'
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleJoin}
                disabled={loading}
                className="px-4 py-2 bg-primary-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


import { useRef } from 'react'
import jsQR from 'jsqr'

