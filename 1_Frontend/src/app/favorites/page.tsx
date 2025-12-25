'use client';
import { useRequireAuth } from '@/hooks/useRequireAuth';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';

interface Politician {
  id: string;
  name: string;
  party: string;
  position: string;
  region: string;
  identity: string;  // P3F3: 신분
  title?: string;    // P3F3: 직책
}

export default function FavoritesPage() {
  // P7F1: Page-level authentication protection
  const { user: authUser, loading: authLoading } = useRequireAuth();

  // P7F1: Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Politician[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredResults = useMemo((): Politician[] => {
    // 검색 기능은 API를 통해 구현 필요
    return [];
  }, [searchQuery, favorites]);

  const handleAddFavorite = (politician: Politician) => {
    setFavorites([...favorites, politician]);
    setAlertMessage(`${politician.name} 정치인을 관심 목록에 추가했습니다!`);
    setShowAlert(true);
    setSearchQuery('');
    setTimeout(() => setShowAlert(false), 2000);
  };

  const handleRemoveFavorite = (name: string) => {
    setFavorites(favorites.filter((p) => p.name !== name));
    setAlertMessage(`${name} 정치인을 관심 목록에서 삭제했습니다.`);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 2000);
  };


  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/favorites', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setFavorites(data.data);
          }
        }
      } catch (err) {
        console.error('Error fetching favorites:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, []);
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">관심 정치인 관리</h1>
          <p className="text-gray-600 mt-2">관심 있는 정치인을 등록하여 활동 업데이트 알림을 받을 수 있습니다.</p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">정치인 검색 및 추가</h2>

          <div className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="정치인 이름을 검색하세요..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-12"
            />
            <svg className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Search Results */}
          {searchQuery && filteredResults.length > 0 && (
            <div className="border border-gray-200 rounded-lg divide-y max-h-96 overflow-y-auto">
              {filteredResults.map((politician) => (
                <div key={politician.id} className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xl">👤</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{politician.name}</div>
                      <div className="text-xs text-gray-600">
                        {politician.party} · {politician.position}
                      </div>
                      <div className="text-xs text-gray-500">{politician.region}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddFavorite(politician)}
                    className="px-3 py-1 bg-primary-500 text-white rounded text-sm hover:bg-primary-600"
                  >
                    추가
                  </button>
                </div>
              ))}
            </div>
          )}

          {searchQuery && filteredResults.length === 0 && (
            <div className="p-4 text-sm text-gray-500 border border-gray-200 rounded-lg text-center">
              검색 결과가 없습니다
            </div>
          )}
        </div>

        {/* Favorite Politicians List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">내 관심 정치인</h2>
            <span className="text-sm text-gray-500">{favorites.length}명</span>
          </div>

          {favorites.length > 0 ? (
            <div className="space-y-4">
              {favorites.map((politician) => (
                <div key={politician.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                  <Link href={`/politicians/${politician.name}`} className="flex items-center gap-4 flex-1">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-2xl">👤</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{politician.name}</h3>
                      <p className="text-sm text-gray-600">
                        {politician.party} · {politician.position}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded">{politician.identity} {politician.title && `• ${politician.title}`}</span>
                        <span className="text-xs text-gray-500">{politician.region}</span>
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={() => handleRemoveFavorite(politician.name)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="mt-4 text-gray-600">등록된 관심 정치인이 없습니다</p>
              <p className="text-sm text-gray-500 mt-1">위에서 정치인을 검색하여 추가해보세요</p>
            </div>
          )}
        </div>

        {/* Back to Settings */}
        <div className="mt-6">
          <Link href="/settings" className="inline-flex items-center text-secondary-600 hover:text-secondary-700 font-medium">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            설정으로 돌아가기
          </Link>
        </div>
      </main>

      {/* Alert Modal */}
      {showAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6">
            <div className="mb-6">
              <p className="text-gray-900 text-center whitespace-pre-line">{alertMessage}</p>
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => setShowAlert(false)}
                className="px-8 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 transition"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
