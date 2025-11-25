'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface SearchResult {
  id: string;
  type: 'politician' | 'community';
  name: string;
  subtext: string;
  score?: number;
}

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    // TODO: API 구현 후 실제 검색 연동
    setTimeout(() => setIsSearching(false), 500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">검색</h1>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <input
            type="search"
            inputMode="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="검색어 입력..."
            className="w-full px-4 py-3 border-2 border-primary-200 dark:border-gray-600 rounded-lg text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`min-h-[44px] px-4 py-2 rounded-lg font-medium transition ${
                filterType === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setFilterType('politician')}
              className={`min-h-[44px] px-4 py-2 rounded-lg font-medium transition ${
                filterType === 'politician'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              정치인
            </button>
            <button
              onClick={() => setFilterType('community')}
              className={`min-h-[44px] px-4 py-2 rounded-lg font-medium transition ${
                filterType === 'community'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              커뮤니티
            </button>
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-4">검색 결과 {results.length}건</p>

        {/* 검색 결과 */}
        {results.length > 0 ? (
          <div className="space-y-4">
            {results.map((result) => (
              <Link key={result.id} href={result.type === 'politician' ? `/politicians/${result.id}` : `/community/${result.id}`}>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-lg cursor-pointer min-h-[60px] touch-manipulation">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{result.name}</h3>
                      <p className="text-gray-600 dark:text-gray-400">{result.subtext}</p>
                    </div>
                    {result.score && <div className="text-right"><div className="text-xl font-bold text-primary-600">{result.score}</div></div>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* 빈 상태 안내 UI */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <div className="mx-auto w-16 h-16 mb-4 text-gray-400 dark:text-gray-500">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {hasSearched ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">검색 결과가 없습니다</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">다른 검색어로 시도해 보세요</p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">정치인과 게시글을 검색하세요</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                  이름, 정당, 지역 또는 게시글 제목으로 검색할 수 있습니다
                </p>
              </>
            )}

            {/* 추천 검색어 */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">인기 검색어</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['더불어민주당', '국민의힘', '서울', '국회의원', '정치개혁'].map((keyword) => (
                  <button
                    key={keyword}
                    onClick={() => {
                      setSearchTerm(keyword);
                      handleSearch();
                    }}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition min-h-[40px]"
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            </div>

            {/* 바로가기 링크 */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">바로가기</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/politicians"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition min-h-[44px]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  정치인 목록
                </Link>
                <Link
                  href="/community"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition min-h-[44px]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                  커뮤니티
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
