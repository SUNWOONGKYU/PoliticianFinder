'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Footer } from '@/components/Footer';
import { StatusBadge } from '@/components/StatusBadge';
import type { PoliticianStatus } from '@/types';
import { getHomeData, type HomeData } from '@/lib/api/home';

export default function Home() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const homeData = await getHomeData();
        setData(homeData);
      } catch (err) {
        console.error('Failed to load home data:', err);
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
            <p className="text-gray-600">데이터를 불러오는 중...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || '데이터를 불러올 수 없습니다.'}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-brand-600 text-white px-4 py-2 rounded hover:bg-brand-700"
            >
              다시 시도
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-brand-50 to-white py-8">
        <div className="max-w-6xl mx-auto px-3 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            훌륭한 정치인 찾기
          </h1>
          <p className="text-lg md:text-xl font-bold bg-gradient-to-r from-brand-600 to-brand-700 bg-clip-text text-transparent mb-4">
            AI 기반 정치인 평가 플랫폼
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto bg-white rounded-full shadow border border-gray-200 focus-within:border-brand-500">
            <div className="flex items-center px-4 py-2">
              <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <input
                type="text"
                placeholder="정치인 이름, 신분, 직종, 지역, 정당으로 검색..."
                className="flex-1 outline-none text-gray-900 text-sm"
              />
              <button className="bg-brand-500 hover:bg-brand-600 text-white rounded-full px-4 py-1.5 ml-2 text-xs font-medium">
                검색
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid: 3/4 content + 1/4 sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

          {/* Left Main Content (3/4) */}
          <div className="lg:col-span-3 space-y-4">

            {/* AI Ranking Section */}
            <section className="py-4 bg-white border-2 border-brand-500 rounded-lg">
              <div className="px-3">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">🤖 AI 평점 랭킹</h2>
                    <p className="text-xs text-gray-600">AI가 공개된 데이터를 활용하여 객관적으로 평가한 정치인 평점 순위 (TOP 10)</p>
                  </div>
                  <div className="flex gap-1 text-xs">
                    <button className="px-2 py-1 bg-brand-500 text-white rounded font-medium">전체</button>
                    <button className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">지역</button>
                    <button className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">정당</button>
                    <button className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200">직종</button>
                  </div>
                </div>

                {/* Rankings Table */}
                <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
                  <table className="w-full text-xs">
                    <thead className="bg-brand-50 border-b border-brand-500">
                      <tr>
                        <th className="px-2 py-1.5 text-left font-bold text-gray-900">순위</th>
                        <th className="px-2 py-1.5 text-left font-bold text-gray-900">이름</th>
                        <th className="px-2 py-1.5 text-center font-bold text-gray-900">신분</th>
                        <th className="px-2 py-1.5 text-left font-bold text-gray-900">정당</th>
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
                      {data.aiRanking.map((politician, index) => (
                        <tr key={politician.id} className="hover:bg-brand-50">
                          <td className="px-2 py-1">
                            {index === 0 ? (
                              <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold px-2 py-0.5 rounded-full text-[10px]">
                                {index + 1}
                              </span>
                            ) : index < 3 ? (
                              <span className="bg-gray-200 text-gray-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                                {index + 1}
                              </span>
                            ) : (
                              <span className="bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full text-[10px]">
                                {index + 1}
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-1">
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold text-xs">
                                {politician.name.charAt(0)}
                              </div>
                              <div>
                                <Link href={`/politicians/${politician.id}`} className="font-bold text-gray-900 hover:text-brand-600 transition-colors">{politician.name}</Link>
                                <div className="text-[10px] text-gray-500">{politician.position}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-1 text-center">
                            <StatusBadge status={politician.political_status as PoliticianStatus} />
                          </td>
                          <td className="px-2 py-1 text-gray-700">{politician.party}</td>
                          <td className="px-2 py-1 text-gray-700">{politician.region}</td>
                          <td className="px-2 py-1 text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-sm font-bold text-gray-900">
                                {politician.claude_score ? Number(politician.claude_score).toFixed(1) : '-'}
                              </span>
                              <a href="#ai-detail" className="text-[9px] text-blue-600 hover:text-blue-700">평가내역 보기</a>
                            </div>
                          </td>
                          <td className="px-2 py-1 text-center text-gray-300 text-[10px]">
                            {politician.gpt_score ? Number(politician.gpt_score).toFixed(1) : '-'}
                          </td>
                          <td className="px-2 py-1 text-center text-gray-300 text-[10px]">
                            {politician.gemini_score ? Number(politician.gemini_score).toFixed(1) : '-'}
                          </td>
                          <td className="px-2 py-1 text-center text-gray-300 text-[10px]">
                            {politician.grok_score ? Number(politician.grok_score).toFixed(1) : '-'}
                          </td>
                          <td className="px-2 py-1 text-center text-gray-300 text-[10px]">
                            {politician.perplexity_score ? Number(politician.perplexity_score).toFixed(1) : '-'}
                          </td>
                          <td className="px-2 py-1 text-center">
                            <span className="text-sm font-bold text-brand-600">
                              {politician.composite_score ? Number(politician.composite_score).toFixed(1) : '-'}
                            </span>
                          </td>
                          <td className="px-2 py-1 text-center">
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-amber-400 text-xs">
                                {'⭐'.repeat(Math.round(Number(politician.member_rating) || 0))}
                              </span>
                              <span className="text-[9px] text-gray-500">
                                ({politician.member_rating_count})
                              </span>
                              <a href="#rate" className="text-[9px] text-brand-600 hover:text-brand-700">평가하기</a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 text-center">
                  <button className="text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 mx-auto text-sm">
                    <span>전체 랭킹 보기 →</span>
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
                  <button className="px-2 py-0.5 bg-brand-500 text-white rounded font-medium">1시간</button>
                  <button className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded">6시간</button>
                  <button className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded">24시간</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                {/* Column 1 (1-5) */}
                <div className="space-y-1">
                  {data.hotPosts.slice(0, 5).map((post, index) => (
                    <div key={post.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                      <span className={`${post.is_hot ? 'bg-gradient-to-r from-amber-500 to-amber-600 animate-pulse' : index < 2 ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-600'} text-white font-bold w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0`}>
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 hover:text-brand-600 truncate">{post.title}</h3>
                        <div className="flex gap-2 text-[10px] text-gray-500">
                          <span>👁️ {post.view_count}</span>
                          <span>💬 {post.comment_count}</span>
                          <span>⬆️ {post.upvotes}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Column 2 (6-10) */}
                <div className="space-y-1">
                  {data.hotPosts.slice(5, 10).map((post, index) => (
                    <div key={post.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                      <span className="bg-gray-100 text-gray-600 font-bold w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0">
                        {index + 6}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 hover:text-brand-600 truncate">{post.title}</h3>
                        <div className="flex gap-2 text-[10px] text-gray-500">
                          <span>👁️ {post.view_count}</span>
                          <span>💬 {post.comment_count}</span>
                          <span>⬆️ {post.upvotes}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Column 3 (11-15) */}
                <div className="space-y-1">
                  {data.hotPosts.slice(10, 15).map((post, index) => (
                    <div key={post.id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                      <span className="bg-gray-100 text-gray-600 font-bold w-5 h-5 rounded-full flex items-center justify-center text-[10px] flex-shrink-0">
                        {index + 11}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 hover:text-brand-600 truncate">{post.title}</h3>
                        <div className="flex gap-2 text-[10px] text-gray-500">
                          <span>👁️ {post.view_count}</span>
                          <span>💬 {post.comment_count}</span>
                          <span>⬆️ {post.upvotes}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Politician Recent Posts Section */}
            <div className="bg-gradient-to-br from-brand-50 to-brand-100 rounded-lg shadow p-3 border border-brand-200">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-1">
                  <span className="text-xl">📝</span>
                  정치인 최근 글
                </h2>
                <a href="#" className="text-brand-600 hover:text-brand-700 font-medium text-xs">전체보기 →</a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                {data.politicianPosts.map((post) => (
                  <div key={post.id} className="bg-white rounded-lg p-2 shadow-sm hover:shadow transition-shadow cursor-pointer border border-brand-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-amber-600 rounded flex items-center justify-center text-white font-bold text-xs shadow">
                        🏅
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          {post.politician_id && (<Link href={`/politicians/${post.politician_id}`} className="font-bold text-gray-900 hover:text-brand-600 transition-colors text-xs truncate">{post.politician_name}</Link>)}
                          <StatusBadge status={post.politician_status as PoliticianStatus} className="text-[9px]" />
                        </div>
                        <div className="text-[9px] text-gray-500">
                          {new Date(post.created_at).toLocaleDateString('ko-KR')}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed text-[11px] mb-2 line-clamp-3">{post.content}</p>
                    <div className="flex gap-2 text-[10px] text-gray-500">
                      <span>💬 {post.comment_count}</span>
                      <span>⬆️ {post.upvotes}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Sidebar (1/4) */}
          <div className="space-y-3">

            {/* Politician Registration Status */}
            {data.sidebar.stats && (
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg shadow p-2 border border-indigo-200">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-1 text-xs">
                  <span className="text-sm">📊</span>
                  정치인 등록 현황
                </h3>
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex justify-between items-center p-1 bg-white/70 rounded">
                    <span className="text-gray-700">총 등록 정치인</span>
                    <span className="font-bold text-indigo-600">{data.sidebar.stats.total_count}명</span>
                  </div>
                  <div className="flex justify-between items-center p-1 bg-white/70 rounded">
                    <span className="text-gray-700">현직</span>
                    <span className="font-bold text-emerald-600">{data.sidebar.stats.active_count}명</span>
                  </div>
                  <div className="flex justify-between items-center p-1 bg-white/70 rounded">
                    <span className="text-gray-700">후보자</span>
                    <span className="font-bold text-cyan-600">{data.sidebar.stats.candidate_count}명</span>
                  </div>
                  <div className="pt-1 border-t border-indigo-200">
                    <div className="flex justify-between items-center p-1 bg-gradient-to-r from-indigo-100 to-blue-100 rounded">
                      <span className="text-gray-700 font-medium">이번 주 신규</span>
                      <span className="font-bold text-blue-600">+{data.sidebar.stats.new_this_week}명</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Rising Rating Politicians */}
            {data.sidebar.trendingPoliticians && data.sidebar.trendingPoliticians.length > 0 && (
              <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg shadow p-2 border border-rose-200">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-1 text-xs">
                  <span className="text-sm">📈</span>
                  평점 급상승 정치인
                </h3>
                <div className="space-y-1.5 text-[10px]">
                  {data.sidebar.trendingPoliticians.map((politician: any) => (
                    <div key={politician.id} className="flex items-center gap-2 p-1 bg-white/70 rounded hover:bg-white transition-colors cursor-pointer">
                      <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow">
                        {politician.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/politicians/${politician.id}`} className="font-bold text-gray-900 truncate hover:text-brand-600 transition-colors">{politician.name}</Link>
                        <div className="text-[9px] text-gray-500">{politician.position} · {politician.party}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-rose-600 font-bold text-xs">↑ {Number(politician.score_change).toFixed(1)}</div>
                        <div className="text-[9px] text-gray-500">이번 주</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Realtime Stats */}
            {data.sidebar.realtimeStats && (
              <div className="bg-white rounded-lg shadow p-2">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-1 text-xs">
                  <span className="text-sm">📊</span>
                  실시간 통계
                </h3>
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex justify-between items-center p-1 bg-gray-50 rounded">
                    <span className="text-gray-700">1시간 새 글</span>
                    <span className="font-bold text-brand-600">{data.sidebar.realtimeStats.posts_last_hour}</span>
                  </div>
                  <div className="flex justify-between items-center p-1 bg-gray-50 rounded">
                    <span className="text-gray-700">1시간 댓글</span>
                    <span className="font-bold text-brand-600">{data.sidebar.realtimeStats.comments_last_hour}</span>
                  </div>
                  <div className="flex justify-between items-center p-1 bg-gray-50 rounded">
                    <span className="text-gray-700">24시간 활성 사용자</span>
                    <span className="font-bold text-green-600">{data.sidebar.realtimeStats.active_users_24h}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Connected Services */}
            {data.sidebar.connectedServices && data.sidebar.connectedServices.length > 0 && (
              <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-lg shadow p-2 border border-green-200">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-1 text-xs">
                  <span className="text-sm">🔗</span>
                  연결 서비스
                </h3>
                <div className="space-y-1 text-[10px]">
                  {data.sidebar.connectedServices.map((service: any) => (
                    <div key={service.id} className="p-1 bg-white/50 rounded">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-gray-700">{service.icon}</span>
                        <span className="font-medium text-gray-900">{service.name}</span>
                      </div>
                      <div className="text-[9px] text-gray-500">{service.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Advertisement Area */}
            {data.sidebar.ad ? (
              <div className="bg-gray-100 rounded-lg shadow p-3 border border-gray-300">
                <div className="text-center space-y-2">
                  <div className="text-gray-400 text-xs font-medium">광고</div>
                  {data.sidebar.ad.image_url ? (
                    <img src={data.sidebar.ad.image_url} alt={data.sidebar.ad.title} className="w-full rounded" />
                  ) : (
                    <div className="bg-white rounded p-4 min-h-[250px] flex items-center justify-center">
                      <div className="text-center">
                        <h4 className="font-bold text-gray-900 mb-2">{data.sidebar.ad.title}</h4>
                        <p className="text-xs text-gray-600">{data.sidebar.ad.content}</p>
                      </div>
                    </div>
                  )}
                  <div className="text-[9px] text-gray-400">Sponsored</div>
                </div>
              </div>
            ) : (
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
            )}

          </div>

        </div>
      </div>

      <Footer />
    </>
  );
}
