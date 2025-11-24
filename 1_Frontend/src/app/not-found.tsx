/**
 * Project Grid Task ID: Mobile Optimization - Phase 1, Item 8
 * 작업명: 404 에러 페이지 개선
 * 생성시간: 2025-11-24
 * 생성자: Claude Code
 * 설명: 사용자 친화적인 404 에러 페이지 (모바일 최적화)
 */

'use client';

import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* 404 Icon */}
        <div className="mb-8">
          <svg
            className="mx-auto h-24 w-24 text-primary-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h1 className="text-6xl font-bold text-primary-600 mb-2">404</h1>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          페이지를 찾을 수 없습니다
        </h2>
        <p className="text-gray-600 mb-8">
          요청하신 페이지가 존재하지 않거나<br />
          삭제되었을 수 있습니다
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => router.push('/')}
            className="w-full min-h-touch px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:shadow-lg transition font-medium"
          >
            홈으로 돌아가기
          </button>

          <button
            onClick={() => router.push('/politicians')}
            className="w-full min-h-touch px-6 py-3 bg-white text-primary-600 border-2 border-primary-600 rounded-lg hover:bg-primary-50 transition font-medium"
          >
            정치인 검색하기
          </button>

          <button
            onClick={() => router.push('/community')}
            className="w-full min-h-touch px-6 py-3 bg-white text-secondary-600 border-2 border-secondary-600 rounded-lg hover:bg-secondary-50 transition font-medium"
          >
            커뮤니티 보기
          </button>
        </div>

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mt-6 text-gray-500 hover:text-gray-700 transition text-sm flex items-center justify-center gap-1 mx-auto min-h-touch"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          이전 페이지로
        </button>
      </div>
    </div>
  );
}
