'use client'

import { useEffect } from 'react'
import { useLanguage } from '@/components/LanguageProvider'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useLanguage()

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
        {/* Error Icon */}
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 mb-4">
          <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        {/* Error Title */}
        <h1 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {t('errorOccurred') || 'Something went wrong'}
        </h1>

        {/* Error Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {t('unexpectedError') || 'An unexpected error occurred. Please try refreshing the page.'}
        </p>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={reset}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
          >
            {t('refreshPage') || 'Refresh Page'}
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
          >
            {t('goHome') || 'Go Home'}
          </button>
        </div>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer">
              Error Details (Development)
            </summary>
            <pre className="mt-2 text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
              {error.message}
              {error.stack && `\n\nStack trace:\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}
