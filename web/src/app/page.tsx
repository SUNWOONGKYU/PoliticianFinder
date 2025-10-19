import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StatusBadge } from '@/components/StatusBadge';
import type { PoliticianStatus } from '@/types';

// Mock data for TOP 10 politicians
const mockPoliticians = [
  { rank: 1, name: '김철수', position: '국회의원', status: '현직' as PoliticianStatus, party: '민주당', region: '서울 강남', claudeScore: 92.0, memberStars: 5 },
  { rank: 2, name: '이영희', position: '국회의원', status: '후보자' as PoliticianStatus, party: '국민의힘', region: '부산 해운대', claudeScore: 89.0, memberStars: 4 },
  { rank: 3, name: '박민수', position: '서울시장', status: '현직' as PoliticianStatus, party: '무소속', region: '서울특별시', claudeScore: 87.0, memberStars: 4 },
  { rank: 4, name: '정수진', position: '국회의원', status: '예비후보자' as PoliticianStatus, party: '민주당', region: '경기 성남', claudeScore: 85.0, memberStars: 4 },
  { rank: 5, name: '최동욱', position: '국회의원', status: '현직' as PoliticianStatus, party: '국민의힘', region: '대구 수성', claudeScore: 83.0, memberStars: 4 },
  { rank: 6, name: '강민지', position: '국회의원', status: '출마자' as PoliticianStatus, party: '민주당', region: '인천 남동', claudeScore: 82.0, memberStars: 4 },
  { rank: 7, name: '윤서현', position: '국회의원', status: '후보자' as PoliticianStatus, party: '국민의힘', region: '광주 서구', claudeScore: 81.0, memberStars: 4 },
  { rank: 8, name: '조현우', position: '시장', status: '현직' as PoliticianStatus, party: '무소속', region: '대전광역시', claudeScore: 80.0, memberStars: 4 },
  { rank: 9, name: '한지민', position: '국회의원', status: '예비후보자' as PoliticianStatus, party: '민주당', region: '경기 수원', claudeScore: 79.0, memberStars: 3 },
  { rank: 10, name: '오세훈', position: '국회의원', status: '출마자' as PoliticianStatus, party: '국민의힘', region: '서울 종로', claudeScore: 78.0, memberStars: 3 },
];

// Mock data for hot posts (15 posts in 3 columns)
const mockHotPosts = [
  { rank: 1, title: '김철수 의원의 최근 발언에 대한 분석', views: '1.2K', comments: 45, upvotes: 89, isHot: true },
  { rank: 2, title: 'AI 평가 시스템은 어떻게 작동하나요?', views: '987', comments: 32, upvotes: 67, isHot: false },
  { rank: 3, title: '지역구 국회의원 공약 이행률 비교', views: '856', comments: 28, upvotes: 54, isHot: false },
  { rank: 4, title: '정치인 평가 기준에 대한 의견', views: '723', comments: 19, upvotes: 42, isHot: false },
  { rank: 5, title: '우리 지역구 후보 비교 분석', views: '654', comments: 15, upvotes: 38, isHot: false },
  { rank: 6, title: '지방선거 주요 공약 총정리', views: '543', comments: 12, upvotes: 31, isHot: false },
  { rank: 7, title: '국회 법안 통과 현황 분석', views: '489', comments: 9, upvotes: 27, isHot: false },
  { rank: 8, title: '예산안 심의 주요 쟁점', views: '421', comments: 7, upvotes: 23, isHot: false },
  { rank: 9, title: '청년 정책 비교 분석', views: '378', comments: 6, upvotes: 19, isHot: false },
  { rank: 10, title: '환경 정책 실행 현황', views: '312', comments: 5, upvotes: 17, isHot: false },
  { rank: 11, title: '부동산 정책 분석', views: '289', comments: 4, upvotes: 15, isHot: false },
  { rank: 12, title: '교육 개혁 방안 토론', views: '267', comments: 3, upvotes: 13, isHot: false },
  { rank: 13, title: '복지 정책 개선 방향', views: '245', comments: 2, upvotes: 11, isHot: false },
  { rank: 14, title: '국방 예산 배분 논의', views: '223', comments: 1, upvotes: 9, isHot: false },
  { rank: 15, title: '지역 개발 계획 리뷰', views: '201', comments: 1, upvotes: 7, isHot: false },
];

// Mock data for politician recent posts (9 posts in 3 columns x 3 rows)
const mockPoliticianPosts = [
  { name: '김철수', status: '현직' as PoliticianStatus, time: '2시간 전', content: '민생 법안 통과를 위해 노력하고 있습니다. 여러분의 목소리를 듣고 있습니다...', comments: 23, upvotes: 156 },
  { name: '이영희', status: '후보자' as PoliticianStatus, time: '5시간 전', content: '지역 개발 사업 진행 상황을 보고드립니다. 투명하게 공개하겠습니다...', comments: 18, upvotes: 142 },
  { name: '박민수', status: '후보자' as PoliticianStatus, time: '8시간 전', content: '서울시 교통 정책 개선안을 발표했습니다. 시민 여러분의 의견을 반영했습니다...', comments: 31, upvotes: 203 },
  { name: '정수진', status: '후보자' as PoliticianStatus, time: '1일 전', content: '청년 일자리 창출 정책을 적극 추진하겠습니다. 청년들의 목소리를 최우선으로...', comments: 45, upvotes: 289 },
  { name: '최동욱', status: '후보자' as PoliticianStatus, time: '1일 전', content: '교육 예산 확대를 위한 법안을 준비 중입니다. 우리 아이들의 미래를 위해...', comments: 38, upvotes: 234 },
  { name: '강민지', status: '후보자' as PoliticianStatus, time: '2일 전', content: '환경 보호 정책 강화에 힘쓰고 있습니다. 지속 가능한 미래를 만들어가겠습니다...', comments: 29, upvotes: 198 },
  { name: '윤서현', status: '후보자' as PoliticianStatus, time: '2일 전', content: '중소기업 지원 확대 방안을 마련했습니다. 경제 활성화를 위해 최선을 다하겠습니다...', comments: 33, upvotes: 176 },
  { name: '조현우', status: '후보자' as PoliticianStatus, time: '3일 전', content: '복지 사각지대 해소를 위한 조례를 준비하고 있습니다. 모두가 행복한 지역사회...', comments: 27, upvotes: 165 },
  { name: '한지민', status: '후보자' as PoliticianStatus, time: '3일 전', content: '문화 예술 진흥을 위한 예산 증액을 추진합니다. 시민들의 문화 향유권을 보장하겠습니다...', comments: 22, upvotes: 143 },
];

export default function Home() {
  return (
    <>
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-purple-50 to-white py-8">
        <div className="max-w-6xl mx-auto px-3 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            훌륭한 정치인 찾기
          </h1>
          <p className="text-lg md:text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent mb-4">
            AI 기반 정치인 평가 플랫폼
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto bg-white rounded-full shadow border border-gray-200 focus-within:border-purple-600">
            <div className="flex items-center px-4 py-2">
              <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <input
                type="text"
                placeholder="정치인 이름, 지역, 정당으로 검색..."
                className="flex-1 outline-none text-gray-900 text-sm"
              />
              <button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-4 py-1.5 ml-2 text-xs font-medium">
                검색
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid: 2/3 content + 1/3 sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Left Main Content (2/3) */}
          <div className="lg:col-span-2 space-y-4">

            {/* AI Ranking Section */}
            <section className="py-4 bg-white border-2 border-purple-600 rounded-lg">
              <div className="px-3">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">🤖 AI 평가 랭킹</h2>
                    <p className="text-xs text-gray-600">AI가 객관적으로 평가한 정치인 순위 (TOP 10)</p>
                  </div>
                  <div className="flex gap-1 text-xs">
                    <button className="px-2 py-1 bg-purple-600 text-white rounded font-medium">전체</button>
                    <button className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">지역</button>
                    <button className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">당</button>
                    <button className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">직종</button>
                  </div>
                </div>

                {/* Rankings Table */}
                <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
                  <table className="w-full text-xs">
                    <thead className="bg-purple-50 border-b border-purple-600">
                      <tr>
                        <th className="px-2 py-1.5 text-left font-bold text-gray-900">순위</th>
                        <th className="px-2 py-1.5 text-left font-bold text-gray-900">이름</th>
                        <th className="px-2 py-1.5 text-center font-bold text-gray-900">신분</th>
                        <th className="px-2 py-1.5 text-left font-bold text-gray-900">당</th>
                        <th className="px-2 py-1.5 text-left font-bold text-gray-900">지역</th>
                        <th className="px-2 py-1.5 text-center font-bold text-gray-900">Claude<br />평점</th>
                        <th className="px-2 py-1.5 text-center font-bold text-gray-500 text-xs">
                          <div>GPT<br />평점</div>
                          <div className="text-[9px] font-normal mt-0.5">추후 표시<br />예정</div>
                        </th>
                        <th className="px-2 py-1.5 text-center font-bold text-gray-500 text-xs">
                          <div>Gemini<br />평점</div>
                          <div className="text-[9px] font-normal mt-0.5">추후 표시<br />예정</div>
                        </th>
                        <th className="px-2 py-1.5 text-center font-bold text-gray-500 text-xs">
                          <div>Grok<br />평점</div>
                          <div className="text-[9px] font-normal mt-0.5">추후 표시<br />예정</div>
                        </th>
                        <th className="px-2 py-1.5 text-center font-bold text-gray-500 text-xs">
                          <div>Perp<br />평점</div>
                          <div className="text-[9px] font-normal mt-0.5">추후 표시<br />예정</div>
                        </th>
                        <th className="px-2 py-1.5 text-center font-bold text-gray-900">AI종합<br />평점</th>
                        <th className="px-2 py-1.5 text-center font-bold text-gray-900">회원<br />평점</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {mockPoliticians.map((politician) => (
                        <tr key={politician.rank} className="hover:bg-purple-50">
                          <td className="px-2 py-1">
                            {politician.rank === 1 ? (
                              <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold px-2 py-0.5 rounded-full text-[10px]">
                                {politician.rank}
                              </span>
                            ) : politician.rank <= 3 ? (
                              <span className="bg-gray-200 text-gray-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                                {politician.rank}
                              </span>
                            ) : (
                              <span className="bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full text-[10px]">
                                {politician.rank}
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-1">
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-xs">
                                {politician.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900">{politician.name}</div>
                                <div className="text-[10px] text-gray-500">{politician.position}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-1 text-center">
                            <StatusBadge status={politician.status} />
                          </td>
                          <td className="px-2 py-1 text-gray-700">{politician.party}</td>
                          <td className="px-2 py-1 text-gray-700">{politician.region}</td>
                          <td className="px-2 py-1 text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-sm font-bold text-gray-900">{politician.claudeScore.toFixed(1)}</span>
                              <a href="#ai-detail" className="text-[9px] text-blue-600 hover:text-blue-700">평가내역 보기</a>
                            </div>
                          </td>
                          <td className="px-2 py-1 text-center text-gray-300 text-[10px]">-</td>
                          <td className="px-2 py-1 text-center text-gray-300 text-[10px]">-</td>
                          <td className="px-2 py-1 text-center text-gray-300 text-[10px]">-</td>
                          <td className="px-2 py-1 text-center text-gray-300 text-[10px]">-</td>
                          <td className="px-2 py-1 text-center">
                            <span className="text-sm font-bold text-purple-600">{politician.claudeScore.toFixed(1)}</span>
                          </td>
                          <td className="px-2 py-1 text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-amber-400 text-xs">
                                {'⭐'.repeat(politician.memberStars)}
                              </span>
                              <a href="#rate" className="text-[9px] text-purple-600 hover:text-purple-700">평가하기</a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 text-center">
                  <button className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 mx-auto text-sm">
                    <span>전체 랭킹 보기 (100위까지)</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </section>

            {/* Hot Posts Section */}
            <div className="bg-white rounded-lg shadow p-3 border-t-2 border-amber-500">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-1">
                  <span className="text-xl">🔥</span>
                  실시간 인기글
                </h2>
                <div className="flex gap-1 text-[10px]">
                  <button className="px-2 py-0.5 bg-purple-600 text-white rounded font-medium">1시간</button>
                  <button className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded">6시간</button>
                  <button className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded">24시간</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                {/* Column 1 (1-5) */}
                <div className="space-y-1">
                  {mockHotPosts.slice(0, 5).map((post) => (
                    <div key={post.rank} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                      <span className={`${post.isHot ? 'bg-gradient-to-r from-amber-500 to-amber-600 animate-pulse' : post.rank <= 3 ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-600'} text-white font-bold w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0`}>
                        {post.rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 hover:text-purple-600 truncate">{post.title}</h3>
                        <div className="flex gap-2 text-[10px] text-gray-500">
                          <span>👁️ {post.views}</span>
                          <span>💬 {post.comments}</span>
                          <span>⬆️ {post.upvotes}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Column 2 (6-10) */}
                <div className="space-y-1">
                  {mockHotPosts.slice(5, 10).map((post) => (
                    <div key={post.rank} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                      <span className="bg-gray-100 text-gray-600 font-bold w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0">
                        {post.rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 hover:text-purple-600 truncate">{post.title}</h3>
                        <div className="flex gap-2 text-[10px] text-gray-500">
                          <span>👁️ {post.views}</span>
                          <span>💬 {post.comments}</span>
                          <span>⬆️ {post.upvotes}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Column 3 (11-15) */}
                <div className="space-y-1">
                  {mockHotPosts.slice(10, 15).map((post) => (
                    <div key={post.rank} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                      <span className="bg-gray-100 text-gray-600 font-bold w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0">
                        {post.rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 hover:text-purple-600 truncate">{post.title}</h3>
                        <div className="flex gap-2 text-[10px] text-gray-500">
                          <span>👁️ {post.views}</span>
                          <span>💬 {post.comments}</span>
                          <span>⬆️ {post.upvotes}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Politician Recent Posts Section */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg shadow p-3 border border-purple-100">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-1">
                  <span className="text-xl">📝</span>
                  정치인 최근 글
                </h2>
                <a href="#" className="text-purple-600 hover:text-purple-700 font-medium text-xs">전체보기 →</a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                {mockPoliticianPosts.map((post, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-2 shadow-sm hover:shadow transition-shadow cursor-pointer border border-purple-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-amber-600 rounded flex items-center justify-center text-white font-bold text-xs shadow">
                        🏅
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-gray-900 truncate text-xs">{post.name}</span>
                          <StatusBadge status={post.status} className="text-[9px]" />
                        </div>
                        <div className="text-[9px] text-gray-500">{post.time}</div>
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-[11px] mb-2">{post.content}</p>
                    <div className="flex gap-2 text-[10px] text-gray-500">
                      <span>💬 {post.comments}</span>
                      <span>⬆️ {post.upvotes}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Sidebar (1/3) */}
          <div className="space-y-3">

            {/* Politician Registration Status */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg shadow p-2 border border-indigo-200">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-1 text-xs">
                <span className="text-sm">📊</span>
                정치인 등록 현황
              </h3>
              <div className="space-y-1.5 text-[10px]">
                <div className="flex justify-between items-center p-1 bg-white/70 rounded">
                  <span className="text-gray-700">총 등록 정치인</span>
                  <span className="font-bold text-indigo-600">1,247명</span>
                </div>
                <div className="flex justify-between items-center p-1 bg-white/70 rounded">
                  <span className="text-gray-700">현직</span>
                  <span className="font-bold text-emerald-600">892명</span>
                </div>
                <div className="flex justify-between items-center p-1 bg-white/70 rounded">
                  <span className="text-gray-700">후보자</span>
                  <span className="font-bold text-cyan-600">245명</span>
                </div>
                <div className="flex justify-between items-center p-1 bg-white/70 rounded">
                  <span className="text-gray-700">예비후보자</span>
                  <span className="font-bold text-amber-600">87명</span>
                </div>
                <div className="flex justify-between items-center p-1 bg-white/70 rounded">
                  <span className="text-gray-700">출마자</span>
                  <span className="font-bold text-purple-600">23명</span>
                </div>
                <div className="pt-1 border-t border-indigo-200">
                  <div className="flex justify-between items-center p-1 bg-gradient-to-r from-indigo-100 to-blue-100 rounded">
                    <span className="text-gray-700 font-medium">이번 주 신규</span>
                    <span className="font-bold text-blue-600">+18명</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rising Rating Politicians */}
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg shadow p-2 border border-rose-200">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-1 text-xs">
                <span className="text-sm">📈</span>
                평점 급상승 중인 정치인
              </h3>
              <div className="space-y-1.5 text-[10px]">
                <div className="flex items-center gap-2 p-1 bg-white/70 rounded hover:bg-white transition-colors cursor-pointer">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow">
                    김
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 truncate">김민수</div>
                    <div className="text-[9px] text-gray-500">국회의원 · 민주당</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-rose-600 font-bold text-xs">↑ 5.2</div>
                    <div className="text-[9px] text-gray-500">이번 주</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-1 bg-white/70 rounded hover:bg-white transition-colors cursor-pointer">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow">
                    박
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 truncate">박지영</div>
                    <div className="text-[9px] text-gray-500">시의원 · 국민의힘</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-rose-600 font-bold text-xs">↑ 4.8</div>
                    <div className="text-[9px] text-gray-500">이번 주</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-1 bg-white/70 rounded hover:bg-white transition-colors cursor-pointer">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow">
                    최
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 truncate">최서현</div>
                    <div className="text-[9px] text-gray-500">시장 · 무소속</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-rose-600 font-bold text-xs">↑ 3.9</div>
                    <div className="text-[9px] text-gray-500">이번 주</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trending Topics */}
            <div className="bg-white rounded-lg shadow p-2">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-1 text-xs">
                <span className="text-sm">📊</span>
                트렌딩 토픽
              </h3>
              <div className="space-y-0.5 text-[10px]">
                <a href="#" className="flex items-center justify-between p-1 hover:bg-purple-50 rounded">
                  <span className="text-gray-700">#의정활동</span>
                  <span className="text-[9px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">234</span>
                </a>
                <a href="#" className="flex items-center justify-between p-1 hover:bg-purple-50 rounded">
                  <span className="text-gray-700">#공약이행</span>
                  <span className="text-[9px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">189</span>
                </a>
                <a href="#" className="flex items-center justify-between p-1 hover:bg-purple-50 rounded">
                  <span className="text-gray-700">#지역개발</span>
                  <span className="text-[9px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">156</span>
                </a>
                <a href="#" className="flex items-center justify-between p-1 hover:bg-purple-50 rounded">
                  <span className="text-gray-700">#투명성</span>
                  <span className="text-[9px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">142</span>
                </a>
                <a href="#" className="flex items-center justify-between p-1 hover:bg-purple-50 rounded">
                  <span className="text-gray-700">#청년정책</span>
                  <span className="text-[9px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">128</span>
                </a>
              </div>
            </div>

            {/* Weekly Hot Issues */}
            <div className="bg-white rounded-lg shadow p-2">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-1 text-xs">
                <span className="text-sm">🔥</span>
                주간 핫이슈
              </h3>
              <div className="space-y-1 text-[10px]">
                <div className="p-1 hover:bg-amber-50 rounded cursor-pointer">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-amber-500 font-bold text-[9px]">1위</span>
                    <span className="font-medium text-gray-900 truncate">김철수 의원 민생법안 발의</span>
                  </div>
                  <div className="text-[9px] text-gray-500">조회 12.3K • 댓글 234</div>
                </div>
                <div className="p-1 hover:bg-amber-50 rounded cursor-pointer">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-amber-500 font-bold text-[9px]">2위</span>
                    <span className="font-medium text-gray-900 truncate">이영희 시장 지역개발 공약</span>
                  </div>
                  <div className="text-[9px] text-gray-500">조회 9.8K • 댓글 189</div>
                </div>
                <div className="p-1 hover:bg-amber-50 rounded cursor-pointer">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-amber-500 font-bold text-[9px]">3위</span>
                    <span className="font-medium text-gray-900 truncate">박민수 의원 예산안 심의</span>
                  </div>
                  <div className="text-[9px] text-gray-500">조회 7.5K • 댓글 156</div>
                </div>
              </div>
            </div>

            {/* Announcements */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow p-2 border border-blue-200">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-1 text-xs">
                <span className="text-sm">📢</span>
                공지사항
              </h3>
              <div className="space-y-1 text-[10px]">
                <a href="#" className="block p-1 hover:bg-white/50 rounded">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="bg-red-500 text-white text-[8px] px-1 py-0.5 rounded font-medium">NEW</span>
                    <span className="font-medium text-gray-900 truncate">2025 정기국회 일정 안내</span>
                  </div>
                  <div className="text-[9px] text-gray-500">2일 전</div>
                </a>
                <a href="#" className="block p-1 hover:bg-white/50 rounded">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="bg-blue-500 text-white text-[8px] px-1 py-0.5 rounded font-medium">이벤트</span>
                    <span className="font-medium text-gray-900 truncate">AI 평가 이벤트 진행중</span>
                  </div>
                  <div className="text-[9px] text-gray-500">5일 전</div>
                </a>
                <a href="#" className="block p-1 hover:bg-white/50 rounded">
                  <div className="font-medium text-gray-900 truncate">서비스 업데이트 안내</div>
                  <div className="text-[9px] text-gray-500">1주일 전</div>
                </a>
              </div>
            </div>

            {/* My Activity Summary */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow p-2 border border-purple-200">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-1 text-xs">
                <span className="text-sm">⭐</span>
                내 활동 요약
              </h3>
              <div className="space-y-1.5 text-[10px]">
                {/* Current Level */}
                <div className="flex items-center gap-1.5 p-1 bg-white/70 rounded">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900">LV.3 참여자</span>
                      <span className="text-[9px] text-gray-500">230/500 XP</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-0.5">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full" style={{ width: '46%' }}></div>
                    </div>
                  </div>
                </div>

                {/* Next Level Info */}
                <div className="text-[9px] text-gray-600 px-1 py-0.5 bg-white/50 rounded flex items-center gap-1">
                  <span>다음 레벨:</span>
                  <div className="flex items-center gap-0.5">
                    <div className="w-3 h-3 bg-blue-400 rounded-full flex items-center justify-center text-white text-[7px] font-bold">4</div>
                    <span className="font-medium">기여자</span>
                    <span className="text-gray-400">(270 XP 남음)</span>
                  </div>
                </div>

                {/* Activity Stats */}
                <div className="flex justify-between items-center p-1 bg-white/50 rounded">
                  <span className="text-gray-600">평가한 정치인</span>
                  <span className="font-bold text-gray-900">12명</span>
                </div>
                <div className="flex justify-between items-center p-1 bg-white/50 rounded">
                  <span className="text-gray-600">작성한 글</span>
                  <span className="font-bold text-gray-900">23개</span>
                </div>
                <div className="flex justify-between items-center p-1 bg-white/50 rounded">
                  <span className="text-gray-600">받은 추천</span>
                  <span className="font-bold text-orange-500">⬆️ 156</span>
                </div>
              </div>
            </div>

            {/* Connected Services */}
            <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-lg shadow p-2 border border-green-200">
              <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-1 text-xs">
                <span className="text-sm">🔗</span>
                연결 서비스
                <span className="bg-green-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-medium ml-auto">COMING SOON</span>
              </h3>
              <div className="space-y-1 text-[10px]">
                <div className="p-1 bg-white/50 rounded">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-gray-700">⚖️</span>
                    <span className="font-medium text-gray-900">법률 자문</span>
                  </div>
                  <div className="text-[9px] text-gray-500">정치인을 위한 법률 자문 서비스</div>
                </div>
                <div className="p-1 bg-white/50 rounded">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-gray-700">📢</span>
                    <span className="font-medium text-gray-900">홍보</span>
                  </div>
                  <div className="text-[9px] text-gray-500">SNS 관리, 브랜딩 전문 업체</div>
                </div>
                <div className="p-1 bg-white/50 rounded">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-gray-700">💼</span>
                    <span className="font-medium text-gray-900">컨설팅</span>
                  </div>
                  <div className="text-[9px] text-gray-500">전략 수립, 선거 컨설팅</div>
                </div>
                <a href="#" className="block text-center mt-1 p-1 bg-green-500 hover:bg-green-600 text-white rounded text-[9px] font-medium transition-colors">
                  서비스 업체 등록 문의 →
                </a>
              </div>
            </div>

            {/* Advertisement Area */}
            <div className="bg-gray-100 rounded-lg shadow p-3 border-2 border-dashed border-gray-300">
              <div className="text-center space-y-2">
                <div className="text-gray-400 text-xs font-medium">광고</div>
                <div className="bg-white rounded p-4 min-h-[250px] flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <div className="text-4xl mb-2">📺</div>
                    <div className="text-xs">광고 영역</div>
                    <div className="text-[10px] mt-1">300 x 250</div>
                  </div>
                </div>
                <div className="text-[9px] text-gray-400">Sponsored</div>
              </div>
            </div>

          </div>

        </div>
      </div>

      <Footer />
    </>
  );
}
