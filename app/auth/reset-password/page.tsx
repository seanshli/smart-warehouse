'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useLanguage } from '@/components/LanguageProvider'
import { LockClosedIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function ResetPasswordPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')

  useEffect(() => {
    const emailParam = searchParams?.get('email')
    const tokenParam = searchParams?.get('token')
    
    if (emailParam) setEmail(emailParam)
    if (tokenParam) setToken(tokenParam)
    
    if (!emailParam || !tokenParam) {
      toast.error(t('invalidResetLink') || 'Invalid reset link')
      router.push('/auth/forgot-password')
    }
  }, [searchParams, router, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error(t('passwordsDoNotMatch') || 'Passwords do not match')
      return
    }

    if (password.length < 6) {
      toast.error(t('passwordTooShort') || 'Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword: password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password')
      }

      toast.success(data.message || 'Password reset successfully')
      router.push('/auth/signin')
    } catch (error) {
      console.error('Error resetting password:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <LockClosedIcon className="mx-auto h-12 w-12 text-primary-600" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('resetPassword') || 'Reset Password'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('enterNewPassword') || 'Enter your new password below'}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="sr-only">
                {t('newPassword') || 'New Password'}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder={t('newPassword') || 'New Password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                {t('confirmPassword') || 'Confirm Password'}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder={t('confirmPassword') || 'Confirm Password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !email || !token}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {isLoading ? (t('resetting') || 'Resetting...') : (t('resetPassword') || 'Reset Password')}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/auth/signin"
              className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              {t('backToSignIn') || 'Back to Sign In'}
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

