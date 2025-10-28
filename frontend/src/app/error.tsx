/**
 * Global Error Boundary
 * P4F2: Lighthouse 90+ - Error Handling
 *
 * Catches and displays errors gracefully
 */

'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            문제가 발생했습니다
          </h1>

          <p className="text-gray-600 mb-6">
            일시적인 오류가 발생했습니다. 다시 시도해주세요.
          </p>

          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="mb-6 p-4 bg-gray-100 rounded-md text-left">
              <p className="text-sm text-gray-800 font-mono break-words">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={reset}
              className="w-full sm:w-auto"
            >
              다시 시도
            </Button>

            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="w-full sm:w-auto"
            >
              홈으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
