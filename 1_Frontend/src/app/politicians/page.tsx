'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { PoliticianListItem } from '@/types/politician';
import { REGIONS } from '@/constants/regions';
import { CONSTITUENCIES, getConstituenciesByMetropolitan } from '@/constants/constituencies';

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
        // Pagination: 20개씩 가져오기
        const response = await fetch(`/api/politicians?limit=${ITEMS_PER_PAGE}&page=${currentPage}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store', // Disable caching to ensure fresh data
        });

        if (!response.ok) {
          console.error('API response not OK:', response.status, response.statusText);
          throw new Error('Failed to fetch politicians');
        }

        const data = await response.json();
        console.log('API response:', data); // 디버깅용

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
              category: p.position || '',
              party: p.party || '',
              region: p.region || '',
              district: '',
              claudeScore: p.claudeScore || 0,
              totalScore: p.totalScore || 0,
              grade: p.grade || 'E',
              gradeEmoji: p.gradeEmoji || '💚',
              overallScore: p.totalScore || 0,
              chatgptScore: p.totalScore || 0,
              grokScore: p.totalScore || 0,
              userRating: p.userRating || 0,
              ratingCount: p.ratingCount || 0,
              memberRating: p.userRating || 0,
              memberCount: p.ratingCount || 0,
              profileImageUrl: p.profileImageUrl || null,
              updatedAt: p.updatedAt || '',
            };
          });
          console.log(`Loaded ${transformedData.length} politicians from API (Page ${currentPage}/${data.pagination?.totalPages || 1})`);
          setPoliticians(transformedData);
        } else {
          console.warn('No data from API');
          setPoliticians([]);
        }
      } catch (err) {
        console.error('Error fetching politicians:', err);
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
    <div className="bg-gray-50 min-h-screen">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <p className="text-lg text-gray-600">
            AI 기반 객관적 평가내역을 참고하여 훌륭한 정치인을 찾아보세요
          </p>
        </div>

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

            {/* Filter Row */}
            <div className="flex flex-wrap gap-2">
              {/* Identity Filter (신분) - P3F3 */}
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">신분</label>
                <select
                  value={identityFilter}
                  onChange={(e) => setIdentityFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 text-sm"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 text-sm"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 text-sm"
                >
                  <option value="">전체</option>
                  <option value="더불어민주당">더불어민주당</option>
                  <option value="국민의힘">국민의힘</option>
                  <option value="정의당">정의당</option>
                  <option value="무소속">무소속</option>
                </select>
              </div>

              {/* Region/Constituency Filter - 국회의원이면 선거구, 아니면 지역 */}
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {categoryFilter === '국회의원' ? '지역구' : '지역'}
                </label>
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 text-sm"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 text-sm"
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
                <button className="px-8 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-300 font-medium text-sm shadow-sm whitespace-nowrap">
                  필터 검색
                </button>
              </div>

              {/* Reset Button */}
              <div className="flex-shrink-0">
                <label className="block text-xs font-medium text-gray-700 mb-1 invisible">초기화</label>
                <button
                  onClick={handleResetFilters}
                  className="px-8 py-2 bg-primary-100 text-primary-700 border-2 border-primary-300 rounded-md hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-300 font-medium text-sm shadow-sm whitespace-nowrap"
                >
                  초기화
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop: Table */}
        <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-100 border-b-2 border-primary-500">
                <tr>
                  <th className="px-2 py-3 text-center font-bold text-gray-900 w-12">순위</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-900 w-24">이름</th>
                  <th className="px-2 py-3 text-left font-bold text-gray-900 w-16">신분</th>
                  <th className="px-2 py-3 text-left font-bold text-gray-900 w-28">직책</th>
                  <th className="px-2 py-3 text-left font-bold text-gray-900 w-24">출마직종</th>
                  <th className="px-2 py-3 text-left font-bold text-gray-900 w-24">정당</th>
                  <th className="px-2 py-3 text-left font-bold text-gray-900 w-28">지역</th>
                  <th className="px-2 py-3 text-center font-bold text-gray-900 w-24">평가등급</th>
                  <th className="px-2 py-3 text-center font-bold text-gray-900 w-20">종합평점</th>
                  <th className="px-2 py-3 text-center font-bold text-gray-900 w-16">Claude</th>
                  <th className="px-2 py-3 text-center font-bold text-gray-900 w-16">ChatGPT</th>
                  <th className="px-2 py-3 text-center font-bold text-gray-900 w-16">Grok</th>
                  <th className="px-2 py-3 text-center font-bold text-gray-900 w-32">회원평점 (참여자수)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.map((p) => (
                  <tr
                    key={p.rank}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => window.location.href = `/politicians/${p.id}`}
                  >
                    <td className="px-2 py-3 text-center">
                      <span className="font-bold text-gray-900 text-sm">{p.rank}</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-bold text-primary-600 hover:text-primary-700 text-sm inline-flex items-center gap-1">
                        {p.name} <span className="text-xs">›</span>
                      </span>
                    </td>
                    <td className="px-2 py-3 text-gray-600 text-xs">{p.identity}</td>
                    <td className="px-2 py-3 text-gray-600 text-xs">{p.title || '-'}</td>
                    <td className="px-2 py-3 text-gray-600 text-xs">{p.category}</td>
                    <td className="px-2 py-3 text-gray-600 text-xs">{p.party}</td>
                    <td className="px-2 py-3 text-gray-600 text-xs">
                      {p.region} {p.district}
                    </td>
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

        {/* Mobile: Card View */}
        <div className="md:hidden space-y-4">
          {filteredData.map((p) => (
            <div
              key={p.rank}
              className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition"
              onClick={() => window.location.href = `/politicians/${p.id}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary-500">#{p.rank}</span>
                  <span className="text-lg font-bold text-gray-900">
                    {p.name}
                  </span>
                </div>
                <div className="text-sm font-semibold text-accent-600">
                  {p.grade === 'E' && '💚 Emerald'}
                  {p.grade === 'P' && '🥇 Platinum'}
                  {p.grade === 'D' && '💎 Diamond'}
                  {p.grade === 'M' && '🌺 Mugunghwa'}
                  {p.grade === 'G' && '🥇 Gold'}
                </div>
              </div>

              <div className="text-sm text-gray-600 space-y-1 mb-3">
                <div>{p.identity} {p.title && `• ${p.title}`} • {p.category}</div>
                <div>{p.party} • {p.region} {p.district}</div>
              </div>

              <div className="border-t pt-3">
                <div className="text-center mb-3 pb-3 border-b">
                  <div className="text-xs text-gray-600 mb-1">종합평점</div>
                  <div className="text-2xl font-bold text-accent-600">{p.overallScore}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-xs">Claude</span>
                    <span className="font-bold text-accent-600">{p.claudeScore}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-xs">ChatGPT</span>
                    <span className="font-bold text-accent-600">{p.chatgptScore}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-xs">Grok</span>
                    <span className="font-bold text-accent-600">{p.grokScore}</span>
                  </div>
                </div>

                <div className="text-center pt-2 border-t">
                  <div className="text-xs text-gray-600 mb-1">회원평점</div>
                  <div className="font-bold text-secondary-600">
                    {'★'.repeat(p.memberRating)}
                    {'☆'.repeat(5 - p.memberRating)}
                  </div>
                  <div className="text-xs text-gray-500">({p.memberCount}명)</div>
                </div>
              </div>
            </div>
          ))}
        </div>

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
    </div>
  );
}
