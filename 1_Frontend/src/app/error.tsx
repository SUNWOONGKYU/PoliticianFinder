/**
 * Project Grid Task ID: H15
 * 작업명: 500 에러 페이지 구현
 * 생성시간: 2025-11-25
 * 생성자: Claude Code
 * 설명: 사용자 친화적인 500 에러 페이지 (모바일 최적화, 다크모드 지원)
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const router = useRouter();

  useEffect(() => {
    // 에러 로깅 (프로덕션에서는 외부 서비스로 전송)
    console.error('Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Error Icon */}
        <div className="mb-8">
          <svg
            className="mx-auto h-24 w-24 text-red-400 dark:text-red-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h1 className="text-6xl font-bold text-red-600 dark:text-red-500 mb-2">오류</h1>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          문제가 발생했습니다
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          예기치 않은 오류가 발생했습니다.<br />
          잠시 후 다시 시도해 주세요.
        </p>

        {/* Error Details (개발 환경에서만 표시) */}
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 rounded-lg text-left">
            <p className="text-sm text-red-800 dark:text-red-200 font-mono break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full min-h-touch px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:shadow-lg transition font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            다시 시도하기
          </button>

          <button
            onClick={() => router.push('/')}
            className="w-full min-h-touch px-6 py-3 bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 border-2 border-primary-600 dark:border-primary-500 rounded-lg hover:bg-primary-50 dark:hover:bg-gray-600 transition font-medium"
          >
            홈으로 돌아가기
          </button>

          <button
            onClick={() => router.push('/politicians')}
            className="w-full min-h-touch px-6 py-3 bg-white dark:bg-gray-700 text-secondary-600 dark:text-secondary-400 border-2 border-secondary-600 dark:border-secondary-500 rounded-lg hover:bg-secondary-50 dark:hover:bg-gray-600 transition font-medium"
          >
            정치인 검색하기
          </button>
        </div>

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mt-6 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition text-sm flex items-center justify-center gap-1 mx-auto min-h-touch"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          이전 페이지로
        </button>

        {/* Help Text */}
        <p className="mt-8 text-xs text-gray-400 dark:text-gray-500">
          문제가 계속되면{' '}
          <a href="mailto:support@politicianfinder.com" className="text-primary-600 dark:text-primary-400 hover:underline">
            고객센터
          </a>
          로 문의해 주세요.
        </p>
      </div>
    </div>
  );
}
