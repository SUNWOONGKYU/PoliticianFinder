/**
 * Floating CTA 버튼 - 클라이언트 컴포넌트
 * 스크롤 및 네비게이션 인터랙션
 */
'use client';

export default function FloatingCTA() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex gap-3">
      {/* 검색 버튼 */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="bg-primary-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-primary-600 transition-all hover:scale-105 flex items-center gap-2"
        aria-label="맨 위로 스크롤하여 검색"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>검색</span>
      </button>

      {/* 평가하기 버튼 */}
      <button
        onClick={() => window.location.href = '/politicians'}
        className="bg-secondary-600 text-white p-3 rounded-full shadow-lg hover:bg-secondary-700 transition-all hover:scale-105"
        title="정치인 평가하기"
        aria-label="정치인 평가하기"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </button>
    </div>
  );
}
