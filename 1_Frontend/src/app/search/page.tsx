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

  // 검색 기능은 API를 통해 구현 필요

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">검색</h1>
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="검색어 입력..."
            className="w-full px-4 py-2 border-2 border-primary-200 rounded-lg"
          />
          <div className="mt-3 flex gap-2">
            <button onClick={() => setFilterType('all')} className={filterType === 'all' ? 'px-4 py-2 bg-primary-500 text-white rounded' : 'px-4 py-2 bg-gray-200 rounded'}>
              전체
            </button>
            <button onClick={() => setFilterType('politician')} className={filterType === 'politician' ? 'px-4 py-2 bg-primary-500 text-white rounded' : 'px-4 py-2 bg-gray-200 rounded'}>
              정치인
            </button>
            <button onClick={() => setFilterType('community')} className={filterType === 'community' ? 'px-4 py-2 bg-primary-500 text-white rounded' : 'px-4 py-2 bg-gray-200 rounded'}>
              커뮤니티
            </button>
          </div>
        </div>

        <p className="text-gray-600 mb-4">검색 결과 {results.length}건</p>
        <div className="space-y-4">
          {results.map((result) => (
            <Link key={result.id} href={result.type === 'politician' ? `/politicians/${result.id}` : `/community/${result.id}`}>
              <div className="bg-white rounded-lg shadow p-4 hover:shadow-lg cursor-pointer">
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-lg font-bold">{result.name}</h3>
                    <p className="text-gray-600">{result.subtext}</p>
                  </div>
                  {result.score && <div className="text-right"><div className="text-xl font-bold text-primary-600">{result.score}</div></div>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
