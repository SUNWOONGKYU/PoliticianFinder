'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';

interface Politician {
  rank: number;
  name: string;
  status: string;
  position: string;
  category: string;
  party: string;
  region: string;
  district: string;
  grade: string;
  overallScore: number;
  claudeScore: number;
  chatgptScore: number;
  geminiScore: number;
  grokScore: number;
  perplexityScore: number;
  memberRating: number;
  memberCount: number;
}

// composite_score를 grade로 변환하는 함수
const calculateGrade = (score: number): string => {
  if (score >= 90) return 'D';
  if (score >= 85) return 'E';
  if (score >= 80) return 'P';
  if (score >= 75) return 'G';
  if (score >= 70) return 'S';
  if (score >= 65) return 'B';
  if (score >= 60) return 'I';
  return 'Tn';
};

const SAMPLE_POLITICIANS: Politician[] = [
  {
    rank: 1,
    name: '김민준',
    status: '현직',
    position: '국회의원',
    category: '국회의원',
    party: '더불어민주당',
    region: '서울',
    district: '강남구 갑',
    grade: 'E',
    overallScore: 84.8,
    claudeScore: 850,
    chatgptScore: 82.0,
    geminiScore: 870,
    grokScore: 84.0,
    perplexityScore: 860,
    memberRating: 4,
    memberCount: 1247,
  },
  {
    rank: 2,
    name: '이서연',
    status: '현직',
    position: '국회의원',
    category: '국회의원',
    party: '국민의힘',
    region: '부산',
    district: '해운대구 을',
    grade: 'P',
    overallScore: 78.0,
    claudeScore: 78.0,
    chatgptScore: 80.0,
    geminiScore: 76.0,
    grokScore: 79.0,
    perplexityScore: 77.0,
    memberRating: 4,
    memberCount: 1089,
  },
  {
    rank: 3,
    name: '박지후',
    status: '현직',
    position: '서울시의원',
    category: '광역의원',
    party: '정의당',
    region: '서울특별시',
    district: '',
    grade: 'P',
    overallScore: 72.0,
    claudeScore: 72.0,
    chatgptScore: 74.0,
    geminiScore: 71.0,
    grokScore: 73.0,
    perplexityScore: 70.0,
    memberRating: 4,
    memberCount: 543,
  },
];

export default function PoliticiansPage() {
  const [politicians, setPoliticians] = useState(SAMPLE_POLITICIANS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 20;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
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
      const matchesStatus = !statusFilter || p.status === statusFilter;
      const matchesCategory = !categoryFilter || p.category === categoryFilter;
      const matchesParty = !partyFilter || p.party === partyFilter;
      const matchesRegion = !regionFilter || p.region === regionFilter || p.district === regionFilter;
      const matchesGrade = !gradeFilter || p.grade === gradeFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesParty &&
        matchesRegion &&
        matchesGrade
      );
    });
  }, [politicians, searchTerm, statusFilter, categoryFilter, partyFilter, regionFilter, gradeFilter]);


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
            const aiScore = p.ai_score || p.evaluation_score || 0;
            return {
              rank: (currentPage - 1) * ITEMS_PER_PAGE + index + 1,
              name: p.name,
              status: p.status || '현직',
              position: p.position || '',
              category: p.position || '',
              party: p.party || '',
              region: p.region || '',
              district: '',
              grade: calculateGrade(aiScore),
              overallScore: aiScore,
              claudeScore: aiScore,
              chatgptScore: aiScore,
              geminiScore: aiScore,
              grokScore: aiScore,
              perplexityScore: aiScore,
              memberRating: p.user_rating || 0,
              memberCount: p.rating_count || 0,
            };
          });
          console.log(`Loaded ${transformedData.length} politicians from API (Page ${currentPage}/${data.pagination?.totalPages || 1})`);
          setPoliticians(transformedData);
        } else {
          console.warn('No data from API, using sample data');
          setPoliticians(SAMPLE_POLITICIANS);
        }
      } catch (err) {
        console.error('Error fetching politicians:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setPoliticians(SAMPLE_POLITICIANS);
      } finally {
        setLoading(false);
      }
    };

    fetchPoliticians();
  }, [currentPage]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
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
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="이름, 정당, 지역 등으로 통합검색"
                className="flex-1 px-4 py-2 border-2 border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 text-sm"
              />
              <button className="px-8 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-300 font-medium text-sm shadow-sm whitespace-nowrap">
                검색
              </button>
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap gap-2">
              {/* Status Filter (신분) */}
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">신분</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
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

              {/* Region Filter */}
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs font-medium text-gray-700 mb-1">지역</label>
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500 text-sm"
                >
                  <option value="">전체</option>
                  <option value="서울">서울</option>
                  <option value="부산">부산</option>
                  <option value="대구">대구</option>
                  <option value="인천">인천</option>
                  <option value="광주">광주</option>
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
                  <th className="px-2 py-3 text-center font-bold text-gray-900">순위</th>
                  <th className="px-3 py-3 text-left font-bold text-gray-900">이름</th>
                  <th className="px-2 py-3 text-left font-bold text-gray-900">신분</th>
                  <th className="px-2 py-3 text-left font-bold text-gray-900">직책</th>
                  <th className="px-2 py-3 text-left font-bold text-gray-900">출마직종</th>
                  <th className="px-2 py-3 text-left font-bold text-gray-900">정당</th>
                  <th className="px-2 py-3 text-left font-bold text-gray-900">지역</th>
                  <th className="px-2 py-3 text-center font-bold text-gray-900">평가등급</th>
                  <th className="px-2 py-3 text-center font-bold text-gray-900">종합평점</th>
                  <th className="px-2 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-medium text-gray-900">Claude</span>
                    </div>
                  </th>
                  <th className="px-2 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-medium text-gray-900">ChatGPT</span>
                    </div>
                  </th>
                  <th className="px-2 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-medium text-gray-900">Gemini</span>
                    </div>
                  </th>
                  <th className="px-2 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-medium text-gray-900">Grok</span>
                    </div>
                  </th>
                  <th className="px-2 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-medium text-gray-900">Perplexity</span>
                    </div>
                  </th>
                  <th className="px-2 py-3 text-center font-bold text-gray-900">회원평점 (참여자수)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.map((p) => (
                  <tr key={p.rank} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-2 py-3 text-center">
                      <span className="font-bold text-gray-900 text-sm">{p.rank}</span>
                    </td>
                    <td className="px-3 py-3">
                      <Link href={`/politicians/${p.name}`}>
                        <span className="font-bold text-primary-600 hover:text-primary-700 text-sm cursor-pointer inline-flex items-center gap-1">
                          {p.name} <span className="text-xs">›</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-2 py-3 text-gray-600 text-xs">{p.status}</td>
                    <td className="px-2 py-3 text-gray-600 text-xs">{p.position}</td>
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
                    <td className="px-2 py-3 text-center font-bold text-accent-600">{p.geminiScore}</td>
                    <td className="px-2 py-3 text-center font-bold text-accent-600">{p.grokScore}</td>
                    <td className="px-2 py-3 text-center font-bold text-accent-600">{p.perplexityScore}</td>
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
            <div key={p.rank} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary-500">#{p.rank}</span>
                  <Link href={`/politicians/${p.name}`}>
                    <span className="text-lg font-bold text-gray-900 hover:text-primary-600">
                      {p.name}
                    </span>
                  </Link>
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
                <div>{p.status} • {p.category}</div>
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
                    <span className="text-gray-600 text-xs">Gemini</span>
                    <span className="font-bold text-accent-600">{p.geminiScore}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-xs">Grok</span>
                    <span className="font-bold text-accent-600">{p.grokScore}</span>
                  </div>
                  <div className="flex justify-between items-center col-span-2">
                    <span className="text-gray-600 text-xs">Perplexity</span>
                    <span className="font-bold text-accent-600">{p.perplexityScore}</span>
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
          <div className="flex justify-center items-center gap-4 mt-8 mb-4">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-700 transition-colors"
            >
              이전
            </button>
            <span className="text-gray-700 font-medium">
              페이지 {currentPage} / {totalPages} (총 {totalCount}명)
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-700 transition-colors"
            >
              다음
            </button>
          </div>
        )}

        {/* No results message */}
        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">검색 결과가 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
