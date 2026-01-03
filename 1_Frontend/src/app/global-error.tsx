/**
 * 에러 핸들링: Global Error Page
 * 작업일: 2026-01-03
 * 설명: 루트 레이아웃에서 발생하는 에러를 잡는 글로벌 에러 핸들러
 *       html, body 태그를 직접 렌더링해야 함
 */

'use client';

import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // 에러 로깅
    console.error('Global Application Error:', error);
    // TODO: 프로덕션에서는 Sentry.captureException(error) 등으로 전송
  }, [error]);

  return (
    <html lang="ko">
      <body className="bg-gray-900 text-white">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            {/* Error Icon */}
            <div className="mb-8">
              <svg
                className="mx-auto h-24 w-24 text-red-500 mb-4"
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
              <h1 className="text-6xl font-bold text-red-500 mb-2">오류</h1>
            </div>

            {/* Message */}
            <h2 className="text-2xl font-bold mb-3">
              심각한 오류가 발생했습니다
            </h2>
            <p className="text-gray-300 mb-6">
              애플리케이션에 문제가 발생했습니다.<br />
              페이지를 새로고침하거나 잠시 후 다시 시도해 주세요.
            </p>

            {/* Error Details */}
            {process.env.NODE_ENV === 'development' && error.message && (
              <div className="mb-6 p-4 bg-red-900/50 rounded-lg text-left">
                <p className="text-sm text-red-200 font-mono break-all">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs text-red-400 mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={reset}
                className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                다시 시도하기
              </button>

              <a
                href="/"
                className="block w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition font-medium text-center"
              >
                홈으로 돌아가기
              </a>
            </div>

            {/* Help Text */}
            <p className="mt-8 text-xs text-gray-500">
              문제가 계속되면{' '}
              <a href="mailto:support@politicianfinder.com" className="text-primary-400 hover:underline">
                고객센터
              </a>
              로 문의해 주세요.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
