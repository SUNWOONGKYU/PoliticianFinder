/**
 * Global Loading Component
 * P4F2: Lighthouse 90+ - Loading States
 *
 * Displays loading state while content is being fetched
 */

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" role="status" aria-label="로딩 중">
          <span className="sr-only">로딩 중...</span>
        </div>
        <p className="mt-4 text-gray-600">로딩 중...</p>
      </div>
    </div>
  )
}
