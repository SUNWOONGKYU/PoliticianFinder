/**
 * 홈페이지 검색바 - 클라이언트 컴포넌트
 * 성능 최적화: 서버 컴포넌트에서 분리된 인터랙티브 요소
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <section className="bg-white rounded-lg shadow-lg p-3">
      <div className="space-y-4">
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <input
              type="search"
              inputMode="search"
              id="index-search-input"
              placeholder="정치인과 게시글을 통합 검색하세요"
              className="w-full px-4 py-3 pl-12 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-gray-900 focus:ring-2 focus:ring-primary-200 text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
            />
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>
          <button
            onClick={handleSearch}
            className="px-8 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-300 font-semibold text-sm shadow-sm"
          >
            검색
          </button>
        </div>
      </div>
    </section>
  );
}
