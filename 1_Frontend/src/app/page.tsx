/**
 * 홈페이지 - 프로토타입 100% 복사 + 실제 데이터 연동
 * PC = 프로토타입 그대로 / 모바일 = md:hidden, hidden md:block 분리
 */

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import SearchBar from '@/components/home/SearchBar';
import FloatingCTA from '@/components/home/FloatingCTA';
import GoogleLoginHandler from '@/components/home/GoogleLoginHandler';

// 동적 렌더링 강제
export const dynamic = 'force-dynamic';

// AI 로고 URL (프로토타입과 동일)
const AI_LOGOS = {
  claude: 'https://cdn.brandfetch.io/idW5s392j1/w/338/h/338/theme/dark/icon.png?c=1bxid64Mup7aczewSAYMX&t=1738315794862',
  chatgpt: 'https://cdn.brandfetch.io/idR3duQxYl/theme/dark/symbol.svg?c=1bxid64Mup7aczewSAYMX',
  gemini: 'https://cdn.simpleicons.org/googlegemini/4285F4',
  grok: 'https://cdn.simpleicons.org/x/000000',
  perplexity: 'https://cdn.simpleicons.org/perplexity/1FB8CD',
};

// 평가 등급 표시 (프로토타입과 동일)
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

// 별점 표시 (프로토타입과 동일)
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

  // 데이터 가져오기
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
    // 정치인 순위 데이터 (상위 10명)
    supabase
      .from('politicians')
      .select(`
        id,
        name,
        party,
        region,
        identity,
        title,
        position
      `)
      .order('name', { ascending: true })
      .limit(10),
    // 정치인 최근 게시글
    supabase
      .from('posts')
      .select('id, title, content, created_at, view_count, comment_count, author_name')
      .not('politician_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(3),
    // 커뮤니티 인기 게시글
    supabase
      .from('posts')
      .select('id, title, created_at, view_count, comment_count, author_name, like_count')
      .is('politician_id', null)
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

  // 정치인 데이터 매핑
  const politicians = politicianDetailsResult.data?.map((politician: any) => ({
    id: politician.id,
    name: politician.name || '-',
    party: politician.party || '-',
    region: politician.region || '-',
    status: politician.identity || '현직',
    position: politician.title || politician.position || '-',
    position_type: politician.position || '-',
    avg_ai_score: 850,
    evaluation_grade: 'E',
    user_rating: 4.5,
    rating_count: 1234,
    claude_score: 850,
    chatgpt_score: 820,
    gemini_score: 870,
    grok_score: 840,
    perplexity_score: 860,
  })) || [];

  const politicianPosts = politicianPostsResult.data || [];
  const popularPosts = popularPostsResult.data || [];
  const notices = noticesResult.data || [];
  const totalPoliticians = totalPoliticiansResult.count || 0;
  const totalMembers = totalMembersResult.count || 0;
  const totalPosts = totalPostsResult.count || 0;
  const totalComments = totalCommentsResult.count || 0;

  return (
    <>
      <GoogleLoginHandler />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content (Left) - lg:col-span-9 */}
          <main className="lg:col-span-9 space-y-6">

            {/* 통합검색 섹션 */}
            <section className="bg-white rounded-lg shadow-lg p-4">
              <div className="mb-3">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <span>🔍</span>
                  <span>통합검색</span>
                </h2>
              </div>
              <SearchBar />
            </section>

            {/* 정치인 평가 랭킹 섹션 (10명) */}
            <section className="bg-white rounded-lg shadow">
              <div className="px-4 pt-4">
                <h2 className="text-2xl font-bold text-gray-900">🏆 정치인 순위</h2>
                <p className="text-sm text-gray-600 mt-1">공개된 데이터를 활용하여 AI가 객관적으로 산출한 정치인 평점 순위</p>
                <div className="w-full h-0.5 bg-primary-500 mt-3 mb-4"></div>
              </div>

              <div className="p-4">
                {/* 데스크톱: 테이블 형태의 랭킹 */}
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
                      {politicians.length === 0 ? (
                        <tr>
                          <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
                            정치인 데이터를 불러오는 중입니다...
                          </td>
                        </tr>
                      ) : (
                        politicians.map((politician, index) => {
                          const grade = getGradeDisplay(politician.evaluation_grade);
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
                                <div className="font-medium">{politician.status}</div>
                                <div className="text-xs">{politician.position}</div>
                              </td>
                              <td className="px-2 py-3 text-gray-600 text-xs">{politician.position_type}</td>
                              <td className="px-2 py-3 text-gray-600">
                                <div className="font-medium">{politician.party}</div>
                                <div className="text-xs">{politician.region}</div>
                              </td>
                              <td className="px-2 py-3 text-center">
                                <div className="font-bold text-accent-600">{politician.avg_ai_score}</div>
                                <div className="text-xs font-semibold text-accent-600 mt-0.5">{grade.emoji} {grade.label}</div>
                              </td>
                              <td className="px-2 py-3 text-center font-bold text-accent-600">{politician.claude_score || '-'}</td>
                              <td className="px-2 py-3 text-center font-bold text-accent-600">{politician.chatgpt_score || '-'}</td>
                              <td className="px-2 py-3 text-center font-bold text-accent-600">{politician.gemini_score || '-'}</td>
                              <td className="px-2 py-3 text-center font-bold text-accent-600">{politician.grok_score || '-'}</td>
                              <td className="px-2 py-3 text-center font-bold text-accent-600">{politician.perplexity_score || '-'}</td>
                              <td className="px-2 py-3 text-center">
                                <div className="font-bold text-secondary-600">{renderStars(politician.user_rating)}</div>
                                <div className="text-gray-900 text-xs">({politician.rating_count}명)</div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 모바일: 카드 형태 (간소화) */}
                <div className="md:hidden space-y-4">
                  {politicians.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      정치인 데이터를 불러오는 중입니다...
                    </div>
                  ) : (
                    politicians.slice(0, 3).map((politician, index) => {
                      const grade = getGradeDisplay(politician.evaluation_grade);
                      return (
                        <Link key={politician.id} href={`/politicians/${politician.id}`} className={`block bg-white rounded-lg p-4 shadow ${index === 0 ? 'border-2 border-primary-500' : 'border border-gray-200'}`}>
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <span className={`${index === 0 ? 'text-2xl text-primary-500' : 'text-xl text-gray-700'} font-bold`}>{index + 1}위</span>
                              <h3 className="text-lg font-bold text-gray-900">{politician.name}</h3>
                              <p className="text-sm text-gray-600">{politician.party} • {politician.region}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-accent-600">{politician.avg_ai_score}</div>
                              <div className="text-sm text-accent-600">{grade.emoji} {grade.label}</div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            회원평점: <span className="text-secondary-600 font-semibold">{renderStars(politician.user_rating)}</span> ({politician.rating_count}명)
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>

                {/* 전체 순위 보기 버튼 */}
                <div className="mt-6 text-center">
                  <Link href="/politicians" className="inline-block px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium transition">
                    전체 순위 보기 →
                  </Link>
                </div>
              </div>
            </section>

            {/* 정치인 최근 게시글 */}
            <section className="bg-white rounded-lg shadow p-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">📝 정치인 최근 게시글</h3>
              {politicianPosts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">아직 정치인 게시글이 없습니다</p>
              ) : (
                <div className="space-y-3">
                  {politicianPosts.map((post: any) => (
                    <Link key={post.id} href={`/community/posts/${post.id}`} className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                      <h4 className="font-semibold text-gray-900 mb-1">{post.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{post.author_name}</span>
                        <span>조회 {post.view_count}</span>
                        <span>댓글 {post.comment_count}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* 커뮤니티 인기 게시글 */}
            <section className="bg-white rounded-lg shadow p-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🔥 커뮤니티 인기 게시글</h3>
              {popularPosts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">아직 인기 게시글이 없습니다</p>
              ) : (
                <div className="space-y-3">
                  {popularPosts.map((post: any) => (
                    <Link key={post.id} href={`/community/posts/${post.id}`} className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                      <h4 className="font-semibold text-gray-900 mb-1">{post.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{post.author_name}</span>
                        <span>👍 {post.like_count}</span>
                        <span>조회 {post.view_count}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </main>

          {/* Sidebar (Right) - lg:col-span-3 */}
          <aside className="lg:col-span-3 space-y-6">

            {/* 공지사항 */}
            <section className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-3">📢 공지사항</h3>
              {notices.length === 0 ? (
                <p className="text-gray-500 text-sm">공지사항이 없습니다</p>
              ) : (
                <ul className="space-y-2">
                  {notices.map((notice: any) => (
                    <li key={notice.id}>
                      <Link href={`/notices/${notice.id}`} className="text-sm text-gray-700 hover:text-primary-600 line-clamp-1">
                        {notice.is_important && <span className="text-red-500 mr-1">[중요]</span>}
                        {notice.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* 통계 */}
            <section className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-3">📊 통계</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">등록 정치인</span>
                  <span className="font-bold text-gray-900">{totalPoliticians.toLocaleString()}명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">회원 수</span>
                  <span className="font-bold text-gray-900">{totalMembers.toLocaleString()}명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">게시글 수</span>
                  <span className="font-bold text-gray-900">{totalPosts.toLocaleString()}개</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">댓글 수</span>
                  <span className="font-bold text-gray-900">{totalComments.toLocaleString()}개</span>
                </div>
              </div>
            </section>

            {/* 서비스 중개 */}
            <section className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-3">🔗 서비스 중개</h3>
              <Link href="/services" className="block text-sm text-primary-600 hover:text-primary-700 font-medium">
                다양한 서비스 바로가기 →
              </Link>
            </section>

            {/* 광고 */}
            <section className="bg-gray-100 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 mb-2">광고</p>
              <div className="bg-white rounded h-48 flex items-center justify-center">
                <span className="text-gray-400">광고 영역</span>
              </div>
            </section>
          </aside>
        </div>
      </div>
      <FloatingCTA />
    </>
  );
}
