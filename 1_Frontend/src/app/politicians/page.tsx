/**
 * 정치인 목록 페이지 - 프로토타입 100% 복사
 * PC = 프로토타입 100% 충실 (Table with 5 AI logos) / 모바일 = md:hidden, hidden md:block 분리
 */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface Politician {
  id: string;
  rank: number;
  name: string;
  identity: string; // 신분
  title: string; // 직책
  category: string; // 출마직종
  party: string;
  region: string;
  district: string;
  grade: string;
  gradeEmoji: string;
  totalScore: number; // 종합평점
  claudeScore: number;
  chatgptScore: number;
  grokScore: number;
  userRating: number; // 회원평점 (별점 1-5)
  ratingCount: number; // 참여자수
}

// AI Logos (3개만 사용: Claude, ChatGPT, Grok)
const AI_LOGOS = {
  claude: 'https://cdn.brandfetch.io/idW5s392j1/w/338/h/338/theme/dark/icon.png?c=1bxid64Mup7aczewSAYMX&t=1738315794862',
  chatgpt: 'https://cdn.brandfetch.io/idR3duQxYl/theme/dark/symbol.svg?c=1bxid64Mup7aczewSAYMX',
  grok: 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/grok-icon.svg',
};

export default function PoliticiansPage() {
  const router = useRouter();
  const [politicians, setPoliticians] = useState<Politician[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [identityFilter, setIdentityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [partyFilter, setPartyFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');

  // Fetch politicians from API
  useEffect(() => {
    const fetchPoliticians = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/politicians?limit=100');
        if (!response.ok) throw new Error('Failed to fetch');

        const data = await response.json();
        if (data.success && data.data) {
          const mapped: Politician[] = data.data.map((p: any, index: number) => ({
            id: p.id,
            rank: index + 1,
            name: p.name,
            identity: p.identity || '현직',
            title: p.title || '',
            category: p.position || '',
            party: p.party || '',
            region: p.region || '',
            district: '',
            grade: p.grade || 'E',
            gradeEmoji: p.gradeEmoji || '💚',
            totalScore: p.totalScore || 0,
            claudeScore: p.claudeScore || 0,
            chatgptScore: p.totalScore || 0,
            grokScore: p.totalScore || 0,
            userRating: p.userRating || 0,
            ratingCount: p.ratingCount || 0,
          }));
          setPoliticians(mapped);
        }
      } catch (err) {
        console.error('Error fetching politicians:', err);
        setPoliticians([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPoliticians();
  }, []);

  // Filter politicians
  const filteredPoliticians = useMemo(() => {
    return politicians.filter(p => {
      const matchesSearch = !searchTerm ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.party.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.region.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesIdentity = !identityFilter || p.identity === identityFilter;
      const matchesCategory = !categoryFilter || p.category === categoryFilter;
      const matchesParty = !partyFilter || p.party === partyFilter;
      const matchesRegion = !regionFilter || p.region === regionFilter;
      const matchesGrade = !gradeFilter || p.grade === gradeFilter;

      return matchesSearch && matchesIdentity && matchesCategory && matchesParty && matchesRegion && matchesGrade;
    });
  }, [politicians, searchTerm, identityFilter, categoryFilter, partyFilter, regionFilter, gradeFilter]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setIdentityFilter('');
    setCategoryFilter('');
    setPartyFilter('');
    setRegionFilter('');
    setGradeFilter('');
  };

  // Convert rating to stars
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;
    return '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <p className="text-lg text-gray-600">AI 기반 객관적 평가내역을 참고하여 훌륭한 정치인을 찾아보세요</p>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="space-y-4">
            {/* Search Row */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="이름, 정당, 지역 등으로 통합검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border-2 border-primary-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 text-sm"
              />
              <button
                onClick={() => {}}
                className="px-8 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-300 font-medium text-sm shadow-sm whitespace-nowrap"
              >
                검색
              </button>
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap gap-2">
              {/* Identity Filter (신분) */}
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

              {/* Region Filter (지역) */}
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
                  <option value="대전">대전</option>
                  <option value="울산">울산</option>
                  <option value="세종">세종</option>
                  <option value="경기">경기</option>
                  <option value="강원">강원</option>
                  <option value="충북">충북</option>
                  <option value="충남">충남</option>
                  <option value="전북">전북</option>
                  <option value="전남">전남</option>
                  <option value="경북">경북</option>
                  <option value="경남">경남</option>
                  <option value="제주">제주</option>
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
                <button
                  onClick={() => {}}
                  className="px-8 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-300 font-medium text-sm shadow-sm whitespace-nowrap"
                >
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

        {/* Desktop: Table (hidden md:block) */}
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
                      <img src={AI_LOGOS.claude} alt="Claude" className="h-6 w-6 object-contain rounded" />
                      <span className="text-xs font-medium text-gray-900">Claude</span>
                    </div>
                  </th>
                  <th className="px-2 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <img src={AI_LOGOS.chatgpt} alt="ChatGPT" className="h-6 w-6 object-contain" />
                      <span className="text-xs font-medium text-gray-900">ChatGPT</span>
                    </div>
                  </th>
                  <th className="px-2 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <img src={AI_LOGOS.grok} alt="Grok" className="h-6 w-6 object-contain" />
                      <span className="text-xs font-medium text-gray-900">Grok</span>
                    </div>
                  </th>
                  <th className="px-2 py-3 text-center font-bold text-gray-900">회원평점 (참여자수)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={13} className="px-4 py-8 text-center text-gray-500">
                      데이터를 불러오는 중...
                    </td>
                  </tr>
                ) : filteredPoliticians.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-4 py-8 text-center text-gray-500">
                      검색 결과가 없습니다
                    </td>
                  </tr>
                ) : (
                  filteredPoliticians.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => router.push(`/politicians/${p.id}`)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-2 py-3 text-center">
                        <span className="font-bold text-gray-900 text-sm">{p.rank}</span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-bold text-primary-600 hover:text-primary-700 text-sm cursor-pointer inline-flex items-center gap-1">
                          {p.name} <span className="text-xs">›</span>
                        </span>
                      </td>
                      <td className="px-2 py-3 text-gray-600 text-xs">{p.identity}</td>
                      <td className="px-2 py-3 text-gray-600 text-xs">{p.title}</td>
                      <td className="px-2 py-3 text-gray-600 text-xs">{p.category}</td>
                      <td className="px-2 py-3 text-gray-600 text-xs">{p.party}</td>
                      <td className="px-2 py-3 text-gray-600 text-xs">
                        {p.region} {p.district}
                      </td>
                      <td className="px-2 py-3 text-center text-xs font-semibold text-accent-600">
                        {p.gradeEmoji} {p.grade}
                      </td>
                      <td className="px-2 py-3 text-center font-bold text-accent-600">{p.totalScore}</td>
                      <td className="px-2 py-3 text-center font-bold text-accent-600">{p.claudeScore}</td>
                      <td className="px-2 py-3 text-center font-bold text-accent-600">{p.chatgptScore}</td>
                      <td className="px-2 py-3 text-center font-bold text-accent-600">{p.grokScore}</td>
                      <td className="px-2 py-3 text-center text-xs">
                        <span className="font-bold text-secondary-600">
                          {renderStars(p.userRating)}
                        </span>{' '}
                        <span className="text-gray-900">({p.ratingCount}명)</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile: Cards (md:hidden) */}
        <div className="md:hidden space-y-4">
          {loading ? (
            <div className="text-center py-16 text-gray-500">데이터를 불러오는 중...</div>
          ) : filteredPoliticians.length === 0 ? (
            <div className="text-center py-16 text-gray-500">검색 결과가 없습니다</div>
          ) : (
            filteredPoliticians.map((p) => (
              <div
                key={p.id}
                onClick={() => router.push(`/politicians/${p.id}`)}
                className="bg-white rounded-lg shadow-md p-4 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-bold text-gray-700">{p.rank}위</span>
                      <span className="text-lg font-bold text-gray-900">{p.name}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{p.identity} {p.title}</span>
                      <span className="mx-1">|</span>
                      <span>{p.party}</span>
                    </div>
                    <div className="text-sm text-gray-600">{p.region} {p.district}</div>
                  </div>
                </div>

                <div className="border-t pt-3 mt-3">
                  <div className="text-center mb-3 pb-3 border-b">
                    <div className="text-xs text-gray-600 mb-1">종합평점</div>
                    <div className="text-2xl font-bold text-accent-600">{p.totalScore}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <img src={AI_LOGOS.claude} alt="Claude" className="h-5 w-5 object-contain rounded" />
                      <span className="text-xs text-gray-900">Claude</span>
                      <span className="ml-auto font-bold text-accent-600">{p.claudeScore}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <img src={AI_LOGOS.chatgpt} alt="ChatGPT" className="h-5 w-5 object-contain" />
                      <span className="text-xs text-gray-900">ChatGPT</span>
                      <span className="ml-auto font-bold text-accent-600">{p.chatgptScore}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <img src={AI_LOGOS.grok} alt="Grok" className="h-5 w-5 object-contain" />
                      <span className="text-xs text-gray-900">Grok</span>
                      <span className="ml-auto font-bold text-accent-600">{p.grokScore}</span>
                    </div>
                  </div>

                  <div className="text-center pt-2 border-t">
                    <div className="text-xs text-gray-600 mb-1">회원평점</div>
                    <div className="font-bold text-secondary-600">{renderStars(p.userRating)}</div>
                    <div className="text-xs text-gray-600">({p.ratingCount}명)</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
