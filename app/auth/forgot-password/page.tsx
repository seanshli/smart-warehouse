'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useLanguage } from '@/components/LanguageProvider'
import { EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function ForgotPasswordPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email')
      }

      setEmailSent(true)
      toast.success(data.message || 'Password reset email sent')
      
      // In development, show the reset link
      if (data.resetLink) {
        console.log('Reset link:', data.resetLink)
        toast.success(`Development: Reset link - ${data.resetLink}`, { duration: 10000 })
      }
    } catch (error) {
      console.error('Error sending reset email:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send reset email')
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <EnvelopeIcon className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {t('checkYourEmail') || 'Check Your Email'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('passwordResetEmailSent') || 'If an account exists with this email, a password reset link has been sent.'}
            </p>
            <div className="mt-6">
              <Link
                href="/auth/signin"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                {t('backToSignIn') || 'Back to Sign In'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('forgotPassword') || 'Forgot Password'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('forgotPasswordDescription') || 'Enter your email address and we\'ll send you a link to reset your password.'}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {isLoading ? (t('sending') || 'Sending...') : (t('sendResetLink') || 'Send Reset Link')}
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

