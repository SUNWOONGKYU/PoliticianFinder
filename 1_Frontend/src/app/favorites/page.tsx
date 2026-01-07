'use client';
import { useRequireAuth } from '@/hooks/useRequireAuth';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// API 응답에서 받는 관심 정치인 데이터 형식
interface FavoriteItem {
  id: string;
  politician_id: string;
  notes?: string;
  notification_enabled: boolean;
  is_pinned: boolean;
  created_at: string;
  politicians: {
    id: string;
    name: string;
    party: string;
    position: string;
    title?: string;
    status?: string;
    region?: string;
    district?: string;
    profile_image_url?: string;
  };
}

// 화면 표시용 정치인 데이터 형식
interface Politician {
  id: string;
  politician_id: string;
  name: string;
  currentPosition: string;  // 현직책 (서울특별시장 등)
  party: string;            // 소속정당
  identity: string;         // 출마신분 (현직/출마예정자 등)
  positionType: string;     // 출마직종 (광역단체장 등)
  region: string;           // 출마지역
  district: string;         // 출마지구
  profile_image_url?: string;
}

export default function FavoritesPage() {
  // P7F1: Page-level authentication protection
  const { user: authUser, loading: authLoading } = useRequireAuth();

  // 모든 hooks를 먼저 선언 (React hooks 규칙 준수)
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Politician[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Politician[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);  // 게시판 태깅과 동일

  // Handle politician search - API call (게시판 태깅과 100% 동일)
  useEffect(() => {
    const query = searchQuery.trim();

    if (query.length === 0) {
      setShowSearchResults(false);
      setSearchResults([]);
      return;
    }

    if (query.length < 2) {
      // Require at least 2 characters for search
      return;
    }

    const fetchPoliticians = async () => {
      try {
        setSearchLoading(true);
        const response = await fetch(
          `/api/politicians/search?q=${encodeURIComponent(query)}&type=name&limit=20`
        );
        const result = await response.json();

        if (result.success && result.data) {
          // Transform API data to match component interface (게시판 태깅과 동일)
          const transformedData: Politician[] = result.data.map((p: any) => ({
            id: p.id,
            politician_id: p.id,
            name: p.name,
            currentPosition: p.position || '',
            party: p.party || '',
            identity: p.status || '출마예정자',
            positionType: p.title || '',
            region: p.region || '',
            district: p.district || '',
            profile_image_url: p.profile_image_url || null,
          }));

          setSearchResults(transformedData);
          setShowSearchResults(true);
        } else {
          setSearchResults([]);
          setShowSearchResults(true);
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to fetch politicians:', error);
        }
        setSearchResults([]);
        setShowSearchResults(false);
      } finally {
        setSearchLoading(false);
      }
    };

    // Debounce search (게시판 태깅과 동일)
    const timeoutId = setTimeout(fetchPoliticians, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // 검색창 외부 클릭 시 드롭다운 닫기 (게시판 태깅과 동일)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#politician-search-input') && !target.closest('#politician-search-results')) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/favorites', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            // API 응답 데이터를 화면 표시용 형식으로 변환
            // DB 컬럼 매핑: position=현직책, title=출마직종, status=출마신분
            const transformedData: Politician[] = data.data.map((item: FavoriteItem) => ({
              id: item.id,
              politician_id: item.politician_id,
              name: item.politicians?.name || '알 수 없음',
              currentPosition: item.politicians?.position || '',  // 현직책
              party: item.politicians?.party || '',               // 소속정당
              identity: item.politicians?.status || '출마예정자',  // 출마신분
              positionType: item.politicians?.title || '',        // 출마직종
              region: item.politicians?.region || '',             // 출마지역
              district: item.politicians?.district || '',         // 출마지구
              profile_image_url: item.politicians?.profile_image_url || null,
            }));
            setFavorites(transformedData);
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

  const handleAddFavorite = async (politician: Politician) => {
    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          politician_id: politician.politician_id,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setFavorites([...favorites, politician]);
        setAlertMessage(`${politician.name} 정치인을 관심 목록에 추가했습니다!`);
        setShowAlert(true);
        setSearchQuery('');
        setSearchResults([]);
        setShowSearchResults(false);  // 드롭다운 닫기
        setTimeout(() => setShowAlert(false), 2000);
      } else {
        setAlertMessage(data.error || '관심 정치인 추가에 실패했습니다.');
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 2000);
      }
    } catch (err) {
      console.error('Error adding favorite:', err);
      setAlertMessage('관심 정치인 추가 중 오류가 발생했습니다.');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2000);
    }
  };

  const handleRemoveFavorite = async (politicianId: string, name: string) => {
    try {
      const response = await fetch(`/api/favorites?politician_id=${politicianId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setFavorites(favorites.filter((p) => p.politician_id !== politicianId));
        setAlertMessage(`${name} 정치인을 관심 목록에서 삭제했습니다.`);
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 2000);
      } else {
        const data = await response.json();
        setAlertMessage(data.error || '삭제에 실패했습니다.');
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 2000);
      }
    } catch (err) {
      console.error('Error removing favorite:', err);
      setAlertMessage('삭제 중 오류가 발생했습니다.');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2000);
    }
  };
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
              id="politician-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="정치인 이름 검색 (2자 이상)..."
              autoComplete="off"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 pr-12"
            />
            <svg className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>

            {/* Search Results Dropdown - 게시판 태깅과 동일한 구조 */}
            {showSearchResults && (
              <div id="politician-search-results" className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchLoading ? (
                  <div className="p-3 text-sm text-gray-500 text-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600 mx-auto mb-2"></div>
                    검색 중...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500">검색 결과가 없습니다</div>
                ) : (
                  <>
                    {searchResults.map((politician) => (
                      <div
                        key={politician.id}
                        onClick={() => handleAddFavorite(politician)}
                        className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                            <img
                              src={politician.profile_image_url || '/icons/default-profile.svg'}
                              alt={politician.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/icons/default-profile.svg';
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900">{politician.name}</div>
                            <div className="text-xs text-gray-600">
                              {politician.party && <span>{politician.party}</span>}
                              {politician.party && politician.currentPosition && <span> · </span>}
                              {politician.currentPosition && <span>{politician.currentPosition}</span>}
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-primary-500 text-white rounded text-xs flex-shrink-0">추가</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Favorite Politicians List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">내 관심 정치인</h2>
            <span className="text-sm text-gray-500">{favorites.length}명</span>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-600">관심 정치인을 불러오는 중...</p>
            </div>
          ) : favorites.length > 0 ? (
            <div className="space-y-4">
              {favorites.map((politician) => (
                <div key={politician.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                  <Link href={`/politicians/${politician.politician_id}`} className="flex items-center gap-4 flex-1">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                      <img
                        src={politician.profile_image_url || '/icons/default-profile.svg'}
                        alt={politician.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/icons/default-profile.svg';
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{politician.name}</h3>
                      <p className="text-sm text-gray-600">
                        {politician.currentPosition && <span>{politician.currentPosition}</span>}
                        {politician.currentPosition && politician.party && <span> · </span>}
                        {politician.party && <span>{politician.party}</span>}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs">
                        {politician.identity && (
                          <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded">{politician.identity}</span>
                        )}
                        {politician.positionType && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">{politician.positionType}</span>
                        )}
                        {politician.region && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{politician.region}</span>
                        )}
                        {politician.district && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{politician.district}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                  <button
                    onClick={() => handleRemoveFavorite(politician.politician_id, politician.name)}
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
