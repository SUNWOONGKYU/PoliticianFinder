/**
 * Project Grid Task ID: P1F1
 * 작업명: 홈페이지 (프로토타입 기준 전면 재작성)
 * 설명: PC = 프로토타입 100% 충실 / 모바일 = md:hidden, hidden md:block 분리
 */

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

// ISR: 60초마다 재검증
export const revalidate = 60;

// AI 로고 URL
const AI_LOGOS = {
  claude: 'https://cdn.brandfetch.io/idW5s392j1/w/338/h/338/theme/dark/icon.png?c=1bxid64Mup7aczewSAYMX&t=1738315794862',
  chatgpt: 'https://cdn.brandfetch.io/idR3duQxYl/theme/dark/symbol.svg?c=1bxid64Mup7aczewSAYMX',
  gemini: 'https://cdn.simpleicons.org/googlegemini/4285F4',
  grok: 'https://cdn.simpleicons.org/x/000000',
  perplexity: 'https://cdn.simpleicons.org/perplexity/1FB8CD',
};

// 평가 등급 표시
function getGradeDisplay(grade: string | null) {
  const gradeMap: Record<string, { emoji: string; label: string }> = {
    'M': { emoji: '🌺', label: 'M' },
    'D': { emoji: '💎', label: 'D' },
    'E': { emoji: '💚', label: 'E' },
    'B': { emoji: '🥉', label: 'B' },
    'S': { emoji: '🥈', label: 'S' },
    'G': { emoji: '🥇', label: 'G' },
  };
  return gradeMap[grade || ''] || { emoji: '💚', label: 'E' };
}

// 별점 표시
function renderStars(rating: number) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  let stars = '';
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) stars += '★';
    else if (i === fullStars && hasHalf) stars += '☆';
    else stars += '☆';
  }
  return stars;
}

export default async function HomePage() {
  const supabase = await createClient();

  // 병렬로 데이터 가져오기
  const [
    politicianDetailsResult,
    politicianPostsResult,
    popularPostsResult,
    noticesResult,
    totalPoliticiansResult,
    totalMembersResult,
    totalPostsResult,
    totalCommentsResult,
  ] = await Promise.all([
    // 정치인 순위 데이터 가져오기 (상위 10명) - politician_details에서 직접 조회
    supabase
      .from('politician_details')
      .select(`
        politician_id,
        status,
        position,
        position_type,
        avg_ai_score,
        evaluation_grade,
        user_rating,
        rating_count,
        claude_score,
        chatgpt_score,
        gemini_score,
        grok_score,
        perplexity_score,
        politicians (
          id,
          name,
          party,
          region
        )
      `)
      .not('avg_ai_score', 'is', null)
      .order('avg_ai_score', { ascending: false })
      .limit(10),
    // 정치인 최근 게시글
    supabase
      .from('posts')
      .select('id, title, content, created_at, views, comment_count, author_name')
      .eq('category', 'politician_post')
      .order('created_at', { ascending: false })
      .limit(3),
    // 커뮤니티 인기 게시글
    supabase
      .from('posts')
      .select('id, title, content, created_at, views, comment_count, author_name, like_count, dislike_count, is_hot, is_best')
      .eq('category', 'general')
      .order('like_count', { ascending: false })
      .limit(5),
    // 공지사항
    supabase
      .from('notices')
      .select('id, title, created_at, is_important')
      .order('is_important', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5),
    // 통계 데이터
    supabase.from('politicians').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('comments').select('*', { count: 'exact', head: true }),
  ]);

  // 정치인 데이터 매핑 (politician_details -> politicians 구조로 변환)
  const politicians = politicianDetailsResult.data?.map((detail: any) => ({
    id: detail.politicians?.id || detail.politician_id,
    name: detail.politicians?.name || '-',
    party: detail.politicians?.party || '-',
    region: detail.politicians?.region || '-',
    politician_details: [{
      status: detail.status,
      position: detail.position,
      position_type: detail.position_type,
      avg_ai_score: detail.avg_ai_score,
      evaluation_grade: detail.evaluation_grade,
      user_rating: detail.user_rating,
      rating_count: detail.rating_count,
      claude_score: detail.claude_score,
      chatgpt_score: detail.chatgpt_score,
      gemini_score: detail.gemini_score,
      grok_score: detail.grok_score,
      perplexity_score: detail.perplexity_score,
    }],
  })) || [];

  const politicianPosts = politicianPostsResult.data;
  const popularPosts = popularPostsResult.data;
  const notices = noticesResult.data;
  const totalPoliticians = totalPoliticiansResult.count;
  const totalMembers = totalMembersResult.count;
  const totalPosts = totalPostsResult.count;
  const totalComments = totalCommentsResult.count;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Main Content (Left) */}
        <main className="lg:col-span-9 space-y-6">

          {/* 통합검색 */}
          <section className="bg-white rounded-lg shadow-lg p-4">
            <div className="mb-3">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span>🔍</span>
                <span>통합검색</span>
              </h2>
            </div>
            <div className="space-y-4">
              <form action="/search" method="GET" className="relative flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    name="q"
                    placeholder="정치인, 게시글을 통합검색 해보세요"
                    className="w-full px-4 py-3 pl-12 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-gray-900 focus:ring-2 focus:ring-primary-200"
                  />
                  <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <button type="submit" className="px-8 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-300 font-semibold text-sm shadow-sm">
                  검색
                </button>
              </form>
            </div>
          </section>

          {/* 정치인 순위 섹션 */}
          <section className="bg-white rounded-lg shadow">
            <div className="px-4 pt-4">
              <h2 className="text-2xl font-bold text-gray-900">🏆 정치인 순위</h2>
              <p className="text-sm text-gray-600 mt-1">공개된 데이터를 활용하여 AI가 객관적으로 산출한 정치인 평점 순위</p>
              <div className="w-full h-0.5 bg-primary-500 mt-3 mb-4"></div>
            </div>
            <div className="p-4">

              {/* PC: 테이블 형태 */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100 border-b-2 border-primary-500">
                    <tr>
                      <th className="px-2 py-3 text-center font-bold text-gray-900">순위</th>
                      <th className="px-3 py-3 text-left font-bold text-gray-900">이름</th>
                      <th className="px-2 py-3 text-left font-bold text-gray-900">신분/직책</th>
                      <th className="px-2 py-3 text-left font-bold text-gray-900">출마직종</th>
                      <th className="px-2 py-3 text-left font-bold text-gray-900">정당/지역</th>
                      <th className="px-2 py-3 text-center font-bold text-gray-900">종합평점<br/>(평가등급)</th>
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
                          <img src={AI_LOGOS.gemini} alt="Gemini" className="h-6 w-6 object-contain" />
                          <span className="text-xs font-medium text-gray-900">Gemini</span>
                        </div>
                      </th>
                      <th className="px-2 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <img src={AI_LOGOS.grok} alt="Grok" className="h-6 w-6 object-contain" />
                          <span className="text-xs font-medium text-gray-900">Grok</span>
                        </div>
                      </th>
                      <th className="px-2 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <img src={AI_LOGOS.perplexity} alt="Perplexity" className="h-6 w-6 object-contain" />
                          <span className="text-xs font-medium text-gray-900">Perplexity</span>
                        </div>
                      </th>
                      <th className="px-2 py-3 text-center">
                        <div className="font-bold text-gray-900">회원평점</div>
                        <div className="text-gray-900 text-xs">(참여자수)</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {politicians?.map((politician: any, index: number) => {
                      const details = politician.politician_details?.[0];
                      const grade = getGradeDisplay(details?.evaluation_grade);
                      return (
                        <tr key={politician.id} className="hover:bg-gray-50 cursor-pointer">
                          <td className="px-2 py-3 text-center">
                            <span className={`font-bold ${index < 3 ? 'text-sm' : ''} text-gray-900`}>{index + 1}</span>
                          </td>
                          <td className="px-3 py-3">
                            <Link href={`/politicians/${politician.id}`} className="font-bold text-primary-600 hover:text-primary-700 text-sm inline-flex items-center gap-1">
                              {politician.name} <span className="text-xs">›</span>
                            </Link>
                          </td>
                          <td className="px-2 py-3 text-gray-600">
                            <div className="font-medium">{details?.status || '-'}</div>
                            <div className="text-xs">{details?.position || '-'}</div>
                          </td>
                          <td className="px-2 py-3 text-gray-600 text-xs">{details?.position_type || '-'}</td>
                          <td className="px-2 py-3 text-gray-600">
                            <div className="font-medium">{politician.party || '-'}</div>
                            <div className="text-xs">{politician.region || '-'}</div>
                          </td>
                          <td className="px-2 py-3 text-center">
                            <div className="font-bold text-accent-600">{details?.avg_ai_score || '-'}</div>
                            <div className="text-xs font-semibold text-accent-600 mt-0.5">{grade.emoji} {grade.label}</div>
                          </td>
                          <td className="px-2 py-3 text-center font-bold text-accent-600">{details?.claude_score || '-'}</td>
                          <td className="px-2 py-3 text-center font-bold text-accent-600">{details?.chatgpt_score || '-'}</td>
                          <td className="px-2 py-3 text-center font-bold text-accent-600">{details?.gemini_score || '-'}</td>
                          <td className="px-2 py-3 text-center font-bold text-accent-600">{details?.grok_score || '-'}</td>
                          <td className="px-2 py-3 text-center font-bold text-accent-600">{details?.perplexity_score || '-'}</td>
                          <td className="px-2 py-3 text-center">
                            <div className="font-bold text-secondary-600">{renderStars(details?.user_rating || 0)}</div>
                            <div className="text-gray-900 text-xs">({details?.rating_count || 0}명)</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 모바일: 카드 형태 */}
              <div className="md:hidden space-y-4">
                {politicians?.slice(0, 3).map((politician: any, index: number) => {
                  const details = politician.politician_details?.[0];
                  const grade = getGradeDisplay(details?.evaluation_grade);
                  const isFirst = index === 0;
                  return (
                    <div key={politician.id} className={`bg-white rounded-lg p-4 shadow ${isFirst ? 'border-2 border-primary-500 shadow-md' : 'border border-gray-200'}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`${isFirst ? 'text-2xl text-primary-500' : 'text-xl text-gray-700'} font-bold`}>{index + 1}위</span>
                            <Link href={`/politicians/${politician.id}`} className={`${isFirst ? 'text-xl' : 'text-lg'} font-bold text-gray-900 hover:text-primary-600 hover:underline`}>
                              {politician.name}
                            </Link>
                          </div>
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">{details?.status} {details?.position_type}</span>
                            <span className="mx-1">|</span>
                            <span>{politician.party}</span>
                          </div>
                          <div className="text-sm text-gray-600">{politician.region}</div>
                        </div>
                      </div>

                      <div className="border-t pt-3 mt-3">
                        <div className="text-center mb-3 pb-3 border-b">
                          <div className="text-xs text-gray-600 mb-1">종합평점</div>
                          <div className="text-2xl font-bold text-accent-600">{details?.avg_ai_score || '-'}</div>
                          <div className="text-sm font-bold mt-1">{grade.emoji} <span className="text-accent-600">{grade.label}</span></div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div className="flex items-center gap-2">
                            <img src={AI_LOGOS.claude} alt="Claude" className="h-5 w-5 object-contain rounded" />
                            <span className="text-xs text-gray-900">Claude</span>
                            <span className="ml-auto font-bold text-accent-600">{details?.claude_score || '-'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <img src={AI_LOGOS.chatgpt} alt="ChatGPT" className="h-5 w-5 object-contain" />
                            <span className="text-xs text-gray-900">ChatGPT</span>
                            <span className="ml-auto font-bold text-accent-600">{details?.chatgpt_score || '-'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <img src={AI_LOGOS.gemini} alt="Gemini" className="h-5 w-5 object-contain" />
                            <span className="text-xs text-gray-900">Gemini</span>
                            <span className="ml-auto font-bold text-accent-600">{details?.gemini_score || '-'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <img src={AI_LOGOS.grok} alt="Grok" className="h-5 w-5 object-contain" />
                            <span className="text-xs text-gray-900">Grok</span>
                            <span className="ml-auto font-bold text-accent-600">{details?.grok_score || '-'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <img src={AI_LOGOS.perplexity} alt="Perplexity" className="h-5 w-5 object-contain" />
                            <span className="text-xs text-gray-900">Perplexity</span>
                            <span className="ml-auto font-bold text-accent-600">{details?.perplexity_score || '-'}</span>
                          </div>
                        </div>

                        <div className="text-center pt-2 border-t">
                          <div className="text-xs text-gray-600 mb-1">회원평점</div>
                          <div className="font-bold text-secondary-600">{renderStars(details?.user_rating || 0)}</div>
                          <div className="text-xs text-gray-600">({details?.rating_count || 0}명)</div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* 4-10위 간략 버전 */}
                {politicians?.slice(3).map((politician: any, index: number) => {
                  const details = politician.politician_details?.[0];
                  const grade = getGradeDisplay(details?.evaluation_grade);
                  return (
                    <div key={politician.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-gray-700">{index + 4}위</span>
                          <div>
                            <Link href={`/politicians/${politician.id}`} className="font-bold text-gray-900 hover:text-primary-600 hover:underline">
                              {politician.name}
                            </Link>
                            <div className="text-xs text-gray-600">{details?.status} {details?.position_type} | {politician.party}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-accent-600">{details?.avg_ai_score || '-'}</div>
                          <div className="text-xs font-bold">{grade.emoji} <span className="text-accent-600">{grade.label}</span></div>
                          <div className="text-xs text-gray-600">종합평점</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-center pt-4">
                <Link href="/politicians" className="inline-block px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium focus:outline-none focus:ring-2 focus:ring-primary-300">
                  전체 순위 보기 →
                </Link>
              </div>
            </div>
          </section>

          {/* 정치인 최근 게시글 */}
          <section className="bg-white rounded-lg shadow">
            <div className="p-4 border-b-2 border-primary-500">
              <h2 className="text-2xl font-bold text-gray-900">📝 정치인 최근 게시글</h2>
              <p className="text-sm text-gray-600 mt-1">정치인들이 작성한 최신 글</p>
            </div>
            <div className="divide-y">
              {politicianPosts?.map((post: any) => (
                <Link key={post.id} href={`/community/posts/${post.id}`} className="block p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">{post.title}</h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-1">{post.content}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="font-medium text-primary-600">{post.author_name}</span>
                        <span>{new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
                        <span>조회 {post.views}</span>
                        <span>댓글 {post.comment_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              {(!politicianPosts || politicianPosts.length === 0) && (
                <div className="p-8 text-center text-gray-500">
                  아직 정치인 게시글이 없습니다.
                </div>
              )}
            </div>
          </section>

          {/* 커뮤니티 인기 게시글 */}
          <section className="bg-white rounded-lg shadow">
            <div className="p-4 border-b-2 border-secondary-500">
              <h2 className="text-2xl font-bold text-gray-900">🔥 커뮤니티 인기 게시글</h2>
              <p className="text-sm text-gray-600 mt-1">이번 주 가장 인기 있는 글</p>
            </div>
            <div className="divide-y">
              {popularPosts?.map((post: any) => (
                <Link key={post.id} href={`/community/posts/${post.id}`} className="block p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {post.is_hot && <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded">Hot</span>}
                        {post.is_best && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">Best</span>}
                        <h3 className="font-bold text-gray-900">{post.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-1">{post.content}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="font-medium text-secondary-600">{post.author_name}</span>
                        <span>{new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
                        <span>조회 {post.views}</span>
                        <span className="text-red-600">👍 {post.like_count || 0}</span>
                        <span className="text-gray-400">👎 {post.dislike_count || 0}</span>
                        <span>댓글 {post.comment_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              {(!popularPosts || popularPosts.length === 0) && (
                <div className="p-8 text-center text-gray-500">
                  아직 인기 게시글이 없습니다.
                </div>
              )}
            </div>
            <div className="p-4 text-center border-t">
              <Link href="/community" className="inline-block px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium">
                커뮤니티 더보기 →
              </Link>
            </div>
          </section>

        </main>

        {/* Right Sidebar */}
        <aside className="lg:col-span-3 space-y-4">

          {/* 공지사항 */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-primary-500">
              <h3 className="font-bold text-xl text-gray-900">📢 공지사항</h3>
              <Link href="/notices" className="text-xs text-gray-500 hover:text-primary-600">더보기 →</Link>
            </div>
            <div className="space-y-2">
              {notices?.map((notice: any) => (
                <Link key={notice.id} href={`/notices/${notice.id}`} className="block text-sm text-gray-700 hover:text-primary-600 truncate">
                  {notice.is_important && <span className="text-red-500 mr-1">[중요]</span>}
                  {notice.title}
                </Link>
              ))}
              {(!notices || notices.length === 0) && (
                <p className="text-sm text-gray-500">공지사항이 없습니다.</p>
              )}
            </div>
          </div>

          {/* 정치인 등록 현황 */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold text-xl mb-3 pb-2 border-b-2 border-primary-500 text-gray-900">📊 정치인 등록 현황</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">전체</span>
                <span className="font-semibold text-gray-900">{totalPoliticians || 0}명</span>
              </div>
            </div>
          </div>

          {/* 회원 현황 */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold text-xl mb-3 pb-2 border-b-2 border-secondary-500 text-gray-900">👥 회원 현황</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">전체</span>
                <span className="font-semibold text-gray-900">{totalMembers || 0}명</span>
              </div>
            </div>
          </div>

          {/* 커뮤니티 활동 */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold text-xl mb-3 pb-2 border-b-2 border-secondary-500 text-gray-900">💬 커뮤니티 활동</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">전체 게시글</span>
                <span className="font-semibold text-gray-900">{totalPosts || 0}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">전체 댓글</span>
                <span className="font-semibold text-gray-900">{totalComments || 0}개</span>
              </div>
            </div>
          </div>

          {/* 서비스 중개 */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-bold text-xl mb-3 pb-2 border-b-2 border-gray-700 text-gray-900">🔗 서비스 중개</h3>
            <div className="space-y-3 text-sm">
              <Link href="/connection" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <div className="font-semibold text-gray-900 mb-1">⚖️ 법률자문</div>
                <p className="text-xs text-gray-600">정치 활동 관련 법률자문 서비스</p>
              </Link>
              <Link href="/connection" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <div className="font-semibold text-gray-900 mb-1">💼 컨설팅</div>
                <p className="text-xs text-gray-600">선거 전략, 공약 개발 관련 컨설팅</p>
              </Link>
              <Link href="/connection" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                <div className="font-semibold text-gray-900 mb-1">🎯 홍보</div>
                <p className="text-xs text-gray-600">SNS 관리, 미디어 홍보, 브랜딩</p>
              </Link>
            </div>
            <div className="mt-3 pt-3 border-t text-center">
              <Link href="/connection" className="text-gray-700 hover:text-gray-900 font-medium text-sm">
                전체 서비스 보기 →
              </Link>
            </div>
          </div>

          {/* 광고: Claude 완벽 가이드 */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-xs text-gray-500 mb-2">광고</div>
            <a href="https://sales-system-psi.vercel.app/" target="_blank" rel="noopener noreferrer" className="block rounded-lg p-4 transition hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #FFF8F3 0%, #FFEBE0 100%)', border: '1px solid #FF6B35' }}>
              <div className="text-center">
                <h4 className="font-bold text-lg" style={{ color: '#2C3E50' }}>Claude 설치부터 기본 사용까지 완벽 가이드</h4>
                <p className="text-sm font-medium mt-2" style={{ color: '#FF6B35' }}>국내 최초 Claude 4종 종합 설치 가이드북</p>
                <div className="mt-4 px-6 py-2 inline-block bg-white rounded-full font-bold text-lg" style={{ color: '#FF6B35', border: '1px solid #FF6B35' }}>
                  ₩9,990
                </div>
                <p className="text-xs mt-3" style={{ color: '#546E7A' }}>자세히 보기 및 구매하기</p>
              </div>
            </a>
          </div>

          {/* 광고 배너 2 */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-xs text-gray-500 mb-2">광고</div>
            <div className="bg-gray-100 rounded-lg flex items-center justify-center" style={{ height: '150px' }}>
              <div className="text-center text-gray-400">
                <div className="text-3xl mb-1">📢</div>
                <div className="text-sm">배너 광고 영역 2</div>
                <div className="text-xs">(300x150)</div>
              </div>
            </div>
          </div>

          {/* 광고 배너 3 */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-xs text-gray-500 mb-2">광고</div>
            <div className="bg-gray-100 rounded-lg flex items-center justify-center" style={{ height: '150px' }}>
              <div className="text-center text-gray-400">
                <div className="text-3xl mb-1">📢</div>
                <div className="text-sm">배너 광고 영역 3</div>
                <div className="text-xs">(300x150)</div>
              </div>
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}
