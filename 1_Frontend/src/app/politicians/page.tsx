'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PoliticianListItem } from '@/types/politician';
import { REGIONS } from '@/constants/regions';
import { CONSTITUENCIES, getConstituenciesByMetropolitan } from '@/constants/constituencies';
import { SkeletonRankingTable, SkeletonPoliticianCard } from '@/components/ui/Skeleton';

interface Politician extends PoliticianListItem {
  rank: number;
  category: string;
  district: string;
  overallScore: number;
  chatgptScore: number;
  grokScore: number;
  memberRating: number;
  memberCount: number;
}

// composite_score를 grade로 변환하는 함수
const calculateGrade = (score: number): string => {
  if (score >= 900) return 'D';
  if (score >= 850) return 'E';
  if (score >= 800) return 'P';
  if (score >= 750) return 'G';
  if (score >= 700) return 'S';
  if (score >= 650) return 'B';
  if (score >= 600) return 'I';
  return 'Tn';
};

export default function PoliticiansPage() {
  const router = useRouter();
  const [politicians, setPoliticians] = useState<Politician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 20;

  const [searchTerm, setSearchTerm] = useState('');
  const [identityFilter, setIdentityFilter] = useState('');  // P3F3: status → identity
  const [categoryFilter, setCategoryFilter] = useState('');
  const [partyFilter, setPartyFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // M6: 비교하기 기능 상태
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const MAX_COMPARE_COUNT = 4;

  // M6: 비교 선택 토글
  const toggleCompareSelection = useCallback((politicianId: string | number, e?: React.MouseEvent | React.ChangeEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const idStr = String(politicianId);
    setSelectedForCompare(prev => {
      if (prev.includes(idStr)) {
        return prev.filter(id => id !== idStr);
      }
      if (prev.length >= MAX_COMPARE_COUNT) {
        return prev;
      }
      return [...prev, idStr];
    });
  }, []);

  // M6: 비교하기 모드 종료
  const exitCompareMode = useCallback(() => {
    setCompareMode(false);
    setSelectedForCompare([]);
  }, []);

  // M6: 비교 페이지로 이동
  const goToComparePage = useCallback(() => {
    if (selectedForCompare.length >= 2) {
      router.push(`/politicians/compare?ids=${selectedForCompare.join(',')}`);
    }
  }, [selectedForCompare, router]);

  const filteredData = useMemo(() => {
    return politicians.filter((p) => {
      const matchesSearch =
        !searchTerm ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.party.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.region.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesIdentity = !identityFilter || p.identity === identityFilter;  // P3F3: status → identity
      const matchesCategory = !categoryFilter || p.category === categoryFilter;
      const matchesParty = !partyFilter || p.party === partyFilter;

      // Region filter logic:
      // - If regionFilter is empty: match all
      // - If regionFilter is full metropolitan name (e.g., "서울특별시"): match by region
      // - If regionFilter is "region + district" format (e.g., "서울 강남구"): exact match
      let matchesRegion = !regionFilter;
      if (regionFilter) {
        const politicianFullLocation = p.district ? `${p.region} ${p.district}` : p.region;

        // Check if it's a full metropolitan name (contains "특별시", "광역시", "특별자치시", "특별자치도", or "도")
        const isMetropolitanFilter = regionFilter.includes('특별시') ||
                                      regionFilter.includes('광역시') ||
                                      regionFilter.includes('특별자치') ||
                                      regionFilter.endsWith('도');

        if (isMetropolitanFilter) {
          // Match by region only (광역 전체)
          matchesRegion = p.region === regionFilter.replace(/특별시|광역시|특별자치시|특별자치도|도/g, '');
        } else {
          // Match exact "region district" format
          matchesRegion = politicianFullLocation === regionFilter;
        }
      }

      const matchesGrade = !gradeFilter || p.grade === gradeFilter;

      return (
        matchesSearch &&
        matchesIdentity &&
        matchesCategory &&
        matchesParty &&
        matchesRegion &&
        matchesGrade
      );
    });
  }, [politicians, searchTerm, identityFilter, categoryFilter, partyFilter, regionFilter, gradeFilter]);


  // API에서 정치인 데이터 가져오기 (페이지네이션 포함)
  useEffect(() => {
    const fetchPoliticians = async () => {
      try {
        setLoading(true);
        // Pagination: 20개씩 가져오기 (종합평점 기준 정렬)
        const response = await fetch(`/api/politicians?limit=${ITEMS_PER_PAGE}&page=${currentPage}&sort=totalScore&order=desc`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store', // Disable caching to ensure fresh data
        });

        if (!response.ok) {
          if (process.env.NODE_ENV === 'development') {
            console.error('API response not OK:', response.status, response.statusText);
          }
          throw new Error('Failed to fetch politicians');
        }

        const data = await response.json();
        if (process.env.NODE_ENV === 'development') {
          console.log('API response:', data);
        }

        if (data.success && data.data && data.data.length > 0) {
          // Pagination 정보 업데이트
          if (data.pagination) {
            setTotalPages(data.pagination.totalPages);
            setTotalCount(data.pagination.total);
          }

          // API 데이터를 프론트엔드 형식으로 변환
          const transformedData = data.data.map((p: any, index: number) => {
            return {
              rank: (currentPage - 1) * ITEMS_PER_PAGE + index + 1,
              id: p.id,
              name: p.name,
              identity: p.identity || '현직',
              title: p.title || '',
              position: p.position || '',
              category: p.positionType || '',  // 출마직종 (국회의원/광역단체장 등)
              party: p.party || '',
              region: p.region || '',
              district: '',
              claudeScore: p.claudeScore || p.claude || 0,
              totalScore: p.totalScore || 0,
              grade: p.grade || 'E',
              gradeEmoji: p.gradeEmoji || '💚',
              overallScore: p.totalScore || 0,
              chatgptScore: p.chatgpt || 0,
              grokScore: p.grok || 0,
              userRating: p.userRating || 0,
              ratingCount: p.ratingCount || 0,
              memberRating: p.userRating || 0,
              memberCount: p.ratingCount || 0,
              profileImageUrl: p.profileImageUrl || null,
              updatedAt: p.updatedAt || '',
            };
          });
          if (process.env.NODE_ENV === 'development') {
            console.log(`Loaded ${transformedData.length} politicians from API (Page ${currentPage}/${data.pagination?.totalPages || 1})`);
          }
          setPoliticians(transformedData);
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.warn('No data from API');
          }
          setPoliticians([]);
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching politicians:', err);
        }
        setError(err instanceof Error ? err.message : 'An error occurred');
        setPoliticians([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPoliticians();
  }, [currentPage]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setIdentityFilter('');  // P3F3: status → identity
    setCategoryFilter('');
    setPartyFilter('');
    setRegionFilter('');
    setGradeFilter('');
  };

  return (
    <div className="bg-gray-50 min-h-screen overflow-x-hidden">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-lg text-gray-600">
            AI 기반 객관적 평가내역을 참고하여 훌륭한 정치인을 찾아보세요
          </p>
          {/* M6: 비교하기 모드 토글 버튼 */}
          <button
            onClick={() => compareMode ? exitCompareMode() : setCompareMode(true)}
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
              min-h-touch whitespace-nowrap
              ${compareMode
                ? 'bg-primary-500 text-white hover:bg-primary-600'
                : 'bg-white border-2 border-primary-500 text-primary-600 hover:bg-primary-50'
              }
            `}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {compareMode ? '비교 취소' : '비교하기'}
          </button>
        </div>

        {/* M6: 비교하기 안내 배너 */}
        {compareMode && (
          <div className="mb-4 p-4 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-700 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-800 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-primary-800 dark:text-primary-200">
                  비교할 정치인을 선택하세요 (최대 {MAX_COMPARE_COUNT}명)
                </p>
                <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                  선택: {selectedForCompare.length}/{MAX_COMPARE_COUNT}명 | 2명 이상 선택 시 비교 가능
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search & Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="space-y-4">
            {/* Search Row */}
            <div className="flex gap-2">
              <input
                type="search"
                inputMode="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="이름, 정당, 지역 검색"
                className="flex-1 px-4 py-2 border-2 border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 text-base"
              />
              <button className="px-8 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-300 font-medium text-sm shadow-sm whitespace-nowrap">
                검색
              </button>
            </div>

            {/* Active Filters Tags */}
            {(identityFilter || categoryFilter || partyFilter || regionFilter || gradeFilter) && (
              <div className="flex flex-wrap items-center gap-2 pb-4 mb-4 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">활성 필터:</span>

                {identityFilter && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                    신분: {identityFilter}
                    <button
                      onClick={() => setIdentityFilter('')}
                      className="min-w-touch min-h-touch flex items-center justify-center hover:bg-primary-200 rounded-full p-1 touch-manipulation"
                      aria-label="신분 필터 제거"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}

                {categoryFilter && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                    출마직종: {categoryFilter}
                    <button
                      onClick={() => setCategoryFilter('')}
                      className="min-w-touch min-h-touch flex items-center justify-center hover:bg-primary-200 rounded-full p-1 touch-manipulation"
                      aria-label="출마직종 필터 제거"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}

                {partyFilter && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                    정당: {partyFilter}
                    <button
                      onClick={() => setPartyFilter('')}
                      className="min-w-touch min-h-touch flex items-center justify-center hover:bg-primary-200 rounded-full p-1 touch-manipulation"
                      aria-label="정당 필터 제거"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}

                {regionFilter && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                    지역: {regionFilter}
                    <button
                      onClick={() => setRegionFilter('')}
                      className="min-w-touch min-h-touch flex items-center justify-center hover:bg-primary-200 rounded-full p-1 touch-manipulation"
                      aria-label="지역 필터 제거"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}

                {gradeFilter && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                    평가등급: {gradeFilter}
                    <button
                      onClick={() => setGradeFilter('')}
                      className="min-w-touch min-h-touch flex items-center justify-center hover:bg-primary-200 rounded-full p-1 touch-manipulation"
                      aria-label="평가등급 필터 제거"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}

                <button
                  onClick={handleResetFilters}
                  className="text-sm text-primary-600 hover:text-primary-800 font-medium"
                >
                  전체 초기화
                </button>
              </div>
            )}

            {/* Mobile Filter Toggle Button */}
            <div className="md:hidden mb-4">
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="w-full px-4 py-3 bg-white border-2 border-primary-500 text-primary-700 rounded-lg font-medium flex items-center justify-between min-h-touch"
                aria-label={showMobileFilters ? '필터 패널 닫기' : '필터 패널 열기'}
                aria-expanded={showMobileFilters}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  필터 {identityFilter || categoryFilter || partyFilter || regionFilter || gradeFilter ? `(${[identityFilter, categoryFilter, partyFilter, regionFilter, gradeFilter].filter(Boolean).length}개 적용중)` : ''}
                </span>
                <svg className={`w-5 h-5 transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Filter Row */}
            <div className={`flex-wrap gap-3 ${showMobileFilters ? 'flex' : 'hidden md:flex'}`}>
              {/* Identity Filter (신분) - P3F3 */}
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">신분</label>
                <select
                  value={identityFilter}
                  onChange={(e) => setIdentityFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 text-sm"
                >
                  <option value="">전체</option>
                  <option value="현직">현직</option>
                  <option value="후보자">후보자</option>
                  <option value="예비후보자">예비후보자</option>
                  <option value="출마자">출마자</option>
                </select>
              </div>

              {/* Category Filter (출마직종) */}
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">출마직종</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 text-sm"
                >
                  <option value="">전체</option>
                  <option value="국회의원">국회의원</option>
                  <option value="광역단체장">광역단체장</option>
                  <option value="광역의원">광역의원</option>
                  <option value="기초단체장">기초단체장</option>
                  <option value="기초의원">기초의원</option>
                </select>
              </div>

              {/* Party Filter (정당) */}
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">정당</label>
                <select
                  value={partyFilter}
                  onChange={(e) => setPartyFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 text-sm"
                >
                  <option value="">전체</option>
                  <option value="더불어민주당">더불어민주당</option>
                  <option value="국민의힘">국민의힘</option>
                  <option value="정의당">정의당</option>
                  <option value="무소속">무소속</option>
                </select>
              </div>

              {/* Region/Constituency Filter - 국회의원이면 출마지구, 아니면 출마지역 */}
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {categoryFilter === '국회의원' ? '출마지구' : '출마지역'}
                </label>
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 text-sm"
                >
                  <option value="">전체</option>

                  {categoryFilter === '국회의원' ? (
                    // 국회의원 선거구 드롭다운
                    CONSTITUENCIES.map((constituency) => (
                      <optgroup key={constituency.metropolitanArea} label={constituency.metropolitanArea}>
                        {constituency.districts.map((district) => (
                          <option key={district} value={`${constituency.metropolitanArea} ${district}`}>
                            {district}
                          </option>
                        ))}
                      </optgroup>
                    ))
                  ) : (
                    // 일반 지역 드롭다운 (광역의원, 기초의원 등)
                    REGIONS.map((region) => (
                      <optgroup key={region.label} label={region.label}>
                        <option value={region.fullName}>{region.fullName} (전체)</option>
                        {region.districts.map((district) => (
                          <option key={district} value={`${region.label} ${district}`}>
                            {district}
                          </option>
                        ))}
                      </optgroup>
                    ))
                  )}
                </select>
              </div>

              {/* Grade Filter (평가등급) */}
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">평가등급</label>
                <select
                  value={gradeFilter}
                  onChange={(e) => setGradeFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 text-sm"
                >
                  <option value="">전체</option>
                  <option value="M">🌺 Mugunghwa (940-1000점)</option>
                  <option value="D">💎 Diamond (880-939점)</option>
                  <option value="E">💚 Emerald (820-879점)</option>
                  <option value="P">🥇 Platinum (760-819점)</option>
                  <option value="G">🥇 Gold (700-759점)</option>
                  <option value="S">🥈 Silver (640-699점)</option>
                  <option value="B">🥉 Bronze (580-639점)</option>
                  <option value="I">⚫ Iron (520-579점)</option>
                  <option value="Tn">🪨 Tin (460-519점)</option>
                  <option value="L">⬛ Lead (400-459점)</option>
                </select>
              </div>

              {/* Filter Search Button */}
              <div className="flex-shrink-0">
                <label className="block text-xs font-medium text-gray-700 mb-1 invisible">검색</label>
                <button className="px-8 py-3 bg-primary-500 text-white rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-300 font-medium text-sm shadow-sm whitespace-nowrap">
                  필터 검색
                </button>
              </div>

              {/* Reset Button */}
              <div className="flex-shrink-0">
                <label className="block text-xs font-medium text-gray-700 mb-1 invisible">초기화</label>
                <button
                  onClick={handleResetFilters}
                  className="px-8 py-3 bg-primary-100 text-primary-700 border-2 border-primary-300 rounded-md hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-300 font-medium text-sm shadow-sm whitespace-nowrap"
                >
                  초기화
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State - Desktop */}
        {loading && (
          <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
            <SkeletonRankingTable rows={10} />
          </div>
        )}

        {/* Loading State - Mobile */}
        {loading && (
          <div className="md:hidden space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonPoliticianCard key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-800 mb-1">데이터를 불러오는데 실패했습니다</h3>
                <p className="text-red-600 text-sm mb-3">잠시 후 다시 시도해주세요.</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                >
                  새로고침
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop: Table */}
        {!loading && !error && (
        <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b-2 border-primary-500">
                <tr>
                  {/* M6: 비교 모드 체크박스 컬럼 */}
                  {compareMode && (
                    <th className="px-2 py-3 text-center font-bold text-gray-900 w-12">선택</th>
                  )}
                  <th className="px-2 py-3 text-center font-bold text-gray-900 w-12">순위</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-900 w-24">이름</th>
                  <th className="px-2 py-3 text-left font-bold text-gray-900 w-28">직책</th>
                  <th className="px-2 py-3 text-left font-bold text-gray-900 w-24">정당</th>
                  <th className="px-2 py-3 text-left font-bold text-gray-900 w-16">신분</th>
                  <th className="px-2 py-3 text-left font-bold text-gray-900 w-24">출마직종</th>
                  <th className="px-2 py-3 text-left font-bold text-gray-900 w-20">출마지역</th>
                  <th className="px-2 py-3 text-left font-bold text-gray-900 w-24">출마지구</th>
                  <th className="px-2 py-3 text-center font-bold text-gray-900 w-24">평가등급</th>
                  <th className="px-2 py-3 text-center font-bold text-gray-900 w-20">종합평점</th>
                  <th className="px-2 py-3 text-center font-bold text-gray-900 w-16">Claude</th>
                  <th className="px-2 py-3 text-center font-bold text-gray-900 w-16">ChatGPT</th>
                  <th className="px-2 py-3 text-center font-bold text-gray-900 w-16">Grok</th>
                  <th className="px-2 py-3 text-center font-bold text-gray-900 w-32">회원평가 (참여자수)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.map((p) => (
                  <tr
                    key={p.rank}
                    className={`
                      hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500
                      ${compareMode && selectedForCompare.includes(String(p.id)) ? 'bg-primary-50' : ''}
                    `}
                    onClick={() => {
                      if (compareMode) {
                        toggleCompareSelection(p.id);
                      } else {
                        window.location.href = `/politicians/${p.id}`;
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (compareMode) {
                          toggleCompareSelection(p.id);
                        } else {
                          window.location.href = `/politicians/${p.id}`;
                        }
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={compareMode ? `${p.name} 비교 선택` : `${p.name} 상세 정보 보기`}
                  >
                    {/* M6: 비교 모드 체크박스 */}
                    {compareMode && (
                      <td className="px-3 py-3 text-center">
                        <label className="flex items-center justify-center min-w-[44px] min-h-[44px] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedForCompare.includes(String(p.id))}
                            onChange={(e) => toggleCompareSelection(p.id, e)}
                            onClick={(e) => e.stopPropagation()}
                            disabled={!selectedForCompare.includes(String(p.id)) && selectedForCompare.length >= MAX_COMPARE_COUNT}
                            className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label={`${p.name} 비교 선택`}
                          />
                        </label>
                      </td>
                    )}
                    <td className="px-2 py-3 text-center">
                      <span className="font-bold text-gray-900 text-sm">{p.rank}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-bold text-primary-600 hover:text-primary-700 text-sm inline-flex items-center gap-1">
                        {p.name} <span className="text-xs">›</span>
                      </span>
                    </td>
                    <td className="px-2 py-3 text-gray-600 text-xs">{p.title || '-'}</td>
                    <td className="px-2 py-3 text-gray-600 text-xs">{p.party}</td>
                    <td className="px-2 py-3 text-gray-600 text-xs">{p.identity}</td>
                    <td className="px-2 py-3 text-gray-600 text-xs">{p.category}</td>
                    <td className="px-2 py-3 text-gray-600 text-xs">{p.region}</td>
                    <td className="px-2 py-3 text-gray-600 text-xs">{p.district || '-'}</td>
                    <td className="px-2 py-3 text-center text-xs font-semibold text-accent-600">
                      {p.grade === 'E' && '💚 Emerald'}
                      {p.grade === 'P' && '🥇 Platinum'}
                      {p.grade === 'D' && '💎 Diamond'}
                      {p.grade === 'M' && '🌺 Mugunghwa'}
                      {p.grade === 'G' && '🥇 Gold'}
                    </td>
                    <td className="px-2 py-3 text-center font-bold text-accent-600">{p.overallScore}</td>
                    <td className="px-2 py-3 text-center font-bold text-accent-600">{p.claudeScore}</td>
                    <td className="px-2 py-3 text-center font-bold text-accent-600">{p.chatgptScore}</td>
                    <td className="px-2 py-3 text-center font-bold text-accent-600">{p.grokScore}</td>
                    <td className="px-2 py-3 text-center text-xs">
                      <span className="font-bold text-secondary-600">
                        {'★'.repeat(p.memberRating)}
                        {'☆'.repeat(5 - p.memberRating)}
                      </span>{' '}
                      <span className="text-gray-900">({p.memberCount}명)</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )}

        {/* Mobile: Enhanced Card View */}
        {!loading && !error && (
        <div className="md:hidden space-y-4">
          {filteredData.map((p) => (
            <div
              key={p.rank}
              className={`
                bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden touch-manipulation focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer
                ${compareMode && selectedForCompare.includes(String(p.id)) ? 'ring-2 ring-primary-500 bg-primary-50/30' : ''}
              `}
              onClick={() => {
                if (compareMode) {
                  toggleCompareSelection(p.id);
                } else {
                  window.location.href = `/politicians/${p.id}`;
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (compareMode) {
                    toggleCompareSelection(p.id);
                  } else {
                    window.location.href = `/politicians/${p.id}`;
                  }
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={compareMode ? `${p.name} 비교 선택` : `${p.name} 상세 정보 보기`}
            >
              {/* Card Header with Rank and Grade */}
              <div className="bg-gradient-to-r from-primary-50 to-secondary-50 px-4 py-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {/* M6: 비교 모드 체크박스 */}
                  {compareMode && (
                    <div className="flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={selectedForCompare.includes(String(p.id))}
                        onChange={(e) => toggleCompareSelection(p.id, e)}
                        onClick={(e) => e.stopPropagation()}
                        disabled={!selectedForCompare.includes(String(p.id)) && selectedForCompare.length >= MAX_COMPARE_COUNT}
                        className="w-6 h-6 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`${p.name} 비교 선택`}
                      />
                    </div>
                  )}
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-base font-bold text-primary-600">#{p.rank}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{p.name}</h3>
                    <p className="text-sm text-gray-600">{p.party}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-accent-600 whitespace-nowrap">
                    {p.grade === 'E' && '💚 Emerald'}
                    {p.grade === 'P' && '🥇 Platinum'}
                    {p.grade === 'D' && '💎 Diamond'}
                    {p.grade === 'M' && '🌺 Mugunghwa'}
                    {p.grade === 'G' && '🥇 Gold'}
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4">
                {/* Basic Info */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                    {p.identity}
                  </span>
                  {p.title && (
                    <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {p.title}
                    </span>
                  )}
                  <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    {p.category}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{p.region} {p.district}</span>
                </div>

                {/* Overall Score Highlight */}
                <div className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-lg p-4 mb-4 text-center">
                  <div className="text-sm text-accent-700 font-medium mb-1">종합 AI 평점</div>
                  <div className="text-3xl font-bold text-accent-600">{p.overallScore}</div>
                  <div className="text-sm text-accent-600 mt-1">점</div>
                </div>

                {/* AI Scores Grid */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-sm text-gray-500 mb-1">Claude</div>
                    <div className="text-lg font-bold text-gray-900">{p.claudeScore}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-sm text-gray-500 mb-1">ChatGPT</div>
                    <div className="text-lg font-bold text-gray-900">{p.chatgptScore}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-sm text-gray-500 mb-1">Grok</div>
                    <div className="text-lg font-bold text-gray-900">{p.grokScore}</div>
                  </div>
                </div>

                {/* Member Rating */}
                <div className="bg-secondary-50 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-secondary-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span className="text-sm text-gray-600">회원 평가</span>
                  </div>
                  <div className="text-right">
                    <div className="text-secondary-600 font-bold text-base">
                      {'★'.repeat(p.memberRating)}
                      {'☆'.repeat(5 - p.memberRating)}
                    </div>
                    <div className="text-sm text-gray-500">{p.memberCount}명 참여</div>
                  </div>
                </div>
              </div>

              {/* Card Footer - View Detail Arrow */}
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-center text-primary-600 font-medium text-sm">
                <span>상세보기</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8 mb-4">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                currentPage === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
            >
              이전
            </button>
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  currentPage === pageNum
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                currentPage >= totalPages
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
            >
              다음
            </button>
          </div>
        )}

        {/* Empty State - Enhanced for mobile UX */}
        {filteredData.length === 0 && (
          <div className="text-center py-16 px-4">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">검색 결과가 없습니다</h3>
            <p className="text-gray-500 text-sm mb-6">다른 검색어나 필터 조건을 시도해보세요</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setIdentityFilter('');
                setCategoryFilter('');
                setPartyFilter('');
                setRegionFilter('');
                setGradeFilter('');
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition min-h-touch"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              필터 초기화
            </button>
          </div>
        )}
      </div>

      {/* M6: 하단 고정 비교 바 */}
      {compareMode && selectedForCompare.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* 선택된 정치인 미리보기 */}
              <div className="flex-1 flex items-center gap-2 overflow-x-auto">
                <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  선택됨:
                </span>
                <div className="flex gap-2">
                  {selectedForCompare.map(id => {
                    const politician = politicians.find(p => String(p.id) === id);
                    return politician ? (
                      <div
                        key={id}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm whitespace-nowrap"
                      >
                        <span>{politician.name}</span>
                        <button
                          onClick={(e) => toggleCompareSelection(id, e)}
                          className="hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full p-0.5 transition"
                          aria-label={`${politician.name} 선택 해제`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              {/* 버튼 그룹 */}
              <div className="flex-shrink-0 flex items-center gap-2">
                <button
                  onClick={exitCompareMode}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition min-h-touch"
                >
                  취소
                </button>
                <button
                  onClick={goToComparePage}
                  disabled={selectedForCompare.length < 2}
                  className={`
                    px-6 py-2 rounded-lg font-medium text-sm transition min-h-touch
                    ${selectedForCompare.length >= 2
                      ? 'bg-primary-500 text-white hover:bg-primary-600'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  비교하기 ({selectedForCompare.length}명)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 비교 모드일 때 하단 패딩 추가 */}
      {compareMode && selectedForCompare.length > 0 && (
        <div className="h-20" aria-hidden="true" />
      )}
    </div>
  );
}
