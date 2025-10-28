/**
 * 404 Not Found Page
 * P4F2: Lighthouse 90+ - Error Handling
 *
 * Custom 404 page for better UX
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>

          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            페이지를 찾을 수 없습니다
          </h2>

          <p className="text-gray-600 mb-6">
            요청하신 페이지가 존재하지 않거나 이동되었습니다.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/">
              <Button className="w-full sm:w-auto">
                홈으로 돌아가기
              </Button>
            </Link>

            <Link href="/politicians">
              <Button variant="outline" className="w-full sm:w-auto">
                정치인 목록 보기
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
