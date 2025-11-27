/**
 * 홈페이지 - 서버 컴포넌트 (성능 최적화)
 *
 * 최적화 내용:
 * 1. 서버 컴포넌트로 전환 (SSR)
 * 2. ISR 적용 (60초마다 재검증)
 * 3. API 호출 병렬화 (Promise.all)
 * 4. 클라이언트 컴포넌트 분리 (SearchBar, FloatingCTA, GoogleLoginHandler)
 */

import Link from 'next/link';
import SearchBar from '@/components/home/SearchBar';
import FloatingCTA from '@/components/home/FloatingCTA';
import GoogleLoginHandler from '@/components/home/GoogleLoginHandler';

// ISR: 60초마다 재검증
export const revalidate = 60;

// 타입 정의
interface Politician {
  id: string;
  rank: number;
  name: string;
  identity: string;
  title?: string;
  position: string;
  office: string;
  party: string;
  region: string;
  totalScore: number;
  grade: string;
  gradeEmoji: string;
  claude: number;
  chatgpt: number;
  grok: number;
  userRating: string;
  userCount: number;
}

interface Post {
  id: number;
  title: string;
  content: string;
  category: string;
  author: string;
  author_id: string;
  member_level?: string;
  politician_id?: string | null;
  politician_name?: string;
  politician_position?: string;
  politician_identity?: string;
  politician_title?: string;
  view_count: number;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  created_at: string;
  is_hot?: boolean;
  is_best?: boolean;
}

interface Notice {
  id: number;
  title: string;
  created_at: string;
}

interface Statistics {
  politicians: number;
  users: number;
  posts: number;
  ratings: number;
}

// 헬퍼 함수들
function calculateGrade(score: number): string {
  if (score >= 900) return 'M';
  if (score >= 850) return 'D';
  if (score >= 800) return 'P';
  if (score >= 750) return 'G';
  return 'E';
}

function getGradeEmoji(grade: string): string {
  const emojiMap: Record<string, string> = {
    'M': '🌺',
    'D': '💎',
    'P': '🥇',
    'G': '🥇',
    'E': '💚',
  };
  return emojiMap[grade] || '💚';
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

// 서버에서 데이터 fetch (병렬)
async function fetchHomeData() {
  // 프로덕션 URL 우선순위: NEXT_PUBLIC_BASE_URL > VERCEL_URL > localhost
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || 'http://localhost:3000';

  const sampleNicknames = [
    '정치는우리의것', '투명한정치', '민주시민', '시민참여자', '투표하는시민',
    '민생이우선', '변화를원해', '미래세대', '깨어있는시민', '정책분석가'
  ];

  console.log('[Home] Fetching data from:', baseUrl);

  try {
    // 모든 API 호출을 병렬로 실행
    const [politiciansRes, politicianPostsRes, popularPostsRes, statisticsRes, noticesRes] = await Promise.all([
      fetch(`${baseUrl}/api/politicians?limit=10&page=1`, {
        next: { revalidate: 60 },
        headers: { 'Content-Type': 'application/json' }
      }),
      fetch(`${baseUrl}/api/posts?has_politician=true&limit=3&page=1`, {
        next: { revalidate: 60 }
      }),
      fetch(`${baseUrl}/api/posts?limit=3&page=1&sort=-view_count`, {
        next: { revalidate: 60 }
      }),
      fetch(`${baseUrl}/api/statistics/overview`, {
        next: { revalidate: 60 },
        headers: { 'Content-Type': 'application/json' }
      }),
      fetch(`${baseUrl}/api/notices?limit=3`, {
        next: { revalidate: 60 }
      }),
    ]);

    console.log('[Home] API responses:', {
      politicians: politiciansRes.status,
      politicianPosts: politicianPostsRes.status,
      popularPosts: popularPostsRes.status,
      statistics: statisticsRes.status,
      notices: noticesRes.status,
    });

    // 정치인 데이터 처리
    let politicians: Politician[] = [];
    if (politiciansRes.ok) {
      const data = await politiciansRes.json();
      if (data.success && data.data?.length > 0) {
        politicians = data.data.map((p: any, index: number) => {
          const aiScore = p.totalScore || p.claudeScore || 0;
          const grade = p.grade || calculateGrade(aiScore);
          return {
            id: p.id || index + 1,
            rank: index + 1,
            name: p.name,
            identity: p.identity || '현직',
            title: p.title || '',
            position: p.position || '-',
            office: p.position || '국회의원',
            party: p.party || '',
            region: p.region || '',
            totalScore: aiScore,
            grade,
            gradeEmoji: p.gradeEmoji || getGradeEmoji(grade),
            claude: aiScore,
            chatgpt: aiScore,
            grok: aiScore,
            userRating: '★'.repeat(Math.round(p.userRating || 0)) + '☆'.repeat(5 - Math.round(p.userRating || 0)),
            userCount: p.ratingCount || 0,
          };
        });
      }
    }

    // 정치인 게시글 처리
    let politicianPosts: Post[] = [];
    if (politicianPostsRes.ok) {
      const data = await politicianPostsRes.json();
      if (data.success && data.data) {
        politicianPosts = data.data.map((post: any) => {
          const positionMap: Record<number, string> = {
            1: '국회의원', 2: '광역단체장', 3: '광역의원', 4: '기초단체장', 5: '기초의원'
          };
          return {
            id: post.id,
            title: post.title,
            content: post.content,
            category: post.category,
            author: post.politicians?.name || '정치인',
            author_id: post.user_id,
            politician_id: post.politician_id,
            politician_name: post.politicians?.name || '정치인',
            politician_position: post.politicians?.position || positionMap[post.politicians?.position_id] || '정치인',
            politician_identity: post.politicians?.identity,
            politician_title: post.politicians?.title,
            view_count: post.view_count || 0,
            upvotes: post.upvotes || 0,
            downvotes: post.downvotes || 0,
            comment_count: post.comment_count || 0,
            created_at: post.created_at,
          };
        });
      }
    }

    // 인기 게시글 처리
    let popularPosts: Post[] = [];
    if (popularPostsRes.ok) {
      const data = await popularPostsRes.json();
      if (data.success && data.data) {
        popularPosts = data.data.map((post: any, index: number) => {
          const userIdHash = post.user_id ? post.user_id.split('-')[0].charCodeAt(0) : index;
          const nicknameIndex = userIdHash % 10;
          const memberLevel = `ML${(userIdHash % 5) + 1}`;
          return {
            id: post.id,
            title: post.title,
            content: post.content,
            category: post.category,
            author: sampleNicknames[nicknameIndex],
            author_id: post.user_id,
            member_level: memberLevel,
            politician_id: post.politician_id,
            view_count: post.view_count || 0,
            upvotes: post.upvotes || 0,
            downvotes: post.downvotes || 0,
            comment_count: post.comment_count || 0,
            created_at: post.created_at,
            is_hot: (post.view_count || 0) > 100,
            is_best: (post.upvotes || 0) > 50,
          };
        });
      }
    }

    // 통계 데이터 처리
    let statistics: Statistics = { politicians: 0, users: 0, posts: 0, ratings: 0 };
    if (statisticsRes.ok) {
      const data = await statisticsRes.json();
      if (data.success && data.data) {
        statistics = {
          politicians: data.data.total.politicians || 0,
          users: data.data.total.users || 0,
          posts: data.data.total.posts || 0,
          ratings: data.data.total.ratings || 0,
        };
      }
    }

    // 공지사항 처리
    let notices: Notice[] = [];
    if (noticesRes.ok) {
      const data = await noticesRes.json();
      if (data.success && data.data) {
        notices = data.data;
      }
    }

    return { politicians, politicianPosts, popularPosts, statistics, notices };
  } catch (error) {
    console.error('[Home] Error fetching home data:', error);
    console.error('[Home] baseUrl was:', baseUrl);
    return {
      politicians: [],
      politicianPosts: [],
      popularPosts: [],
      statistics: { politicians: 0, users: 0, posts: 0, ratings: 0 },
      notices: [],
    };
  }
}

// AI 로고 URL
const aiLogos = {
  claude: 'https://cdn.brandfetch.io/idW5s392j1/w/338/h/338/theme/dark/icon.png?c=1bxid64Mup7aczewSAYMX&t=1738315794862',
  chatgpt: 'https://cdn.brandfetch.io/idR3duQxYl/theme/dark/symbol.svg?c=1bxid64Mup7aczewSAYMX',
  grok: 'https://cdn.simpleicons.org/x/000000',
};

export default async function Home() {
  const { politicians, politicianPosts, popularPosts, statistics, notices } = await fetchHomeData();

  return (
    <main className="bg-gray-50">
      {/* Google 로그인 핸들러 (클라이언트) */}
      <GoogleLoginHandler />

      {/* 메인 레이아웃 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 메인 콘텐츠 (왼쪽) */}
          <div className="lg:col-span-9 space-y-6">
            {/* 검색 섹션 (클라이언트 컴포넌트) */}
            <SearchBar />

            {/* 통계 섹션 */}
            <section className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg shadow-lg p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center bg-white/70 backdrop-blur-sm rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="text-4xl md:text-5xl font-bold text-primary-600 mb-2">
                    {statistics.politicians > 0 ? `${statistics.politicians.toLocaleString()}+` : '...'}
                  </div>
                  <div className="text-sm md:text-base text-gray-700 font-medium">등록된 정치인</div>
                </div>
                <div className="text-center bg-white/70 backdrop-blur-sm rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="text-4xl md:text-5xl font-bold text-secondary-600 mb-2">
                    {statistics.users > 0 ? `${statistics.users.toLocaleString()}+` : '...'}
                  </div>
                  <div className="text-sm md:text-base text-gray-700 font-medium">회원</div>
                </div>
                <div className="text-center bg-white/70 backdrop-blur-sm rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">
                    {statistics.posts > 0 ? `${statistics.posts.toLocaleString()}+` : '...'}
                  </div>
                  <div className="text-sm md:text-base text-gray-700 font-medium">커뮤니티 글</div>
                </div>
                <div className="text-center bg-white/70 backdrop-blur-sm rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                    {statistics.ratings > 0 ? `${statistics.ratings.toLocaleString()}+` : '...'}
                  </div>
                  <div className="text-sm md:text-base text-gray-700 font-medium">평가 참여자</div>
                </div>
              </div>
            </section>

            {/* 정치인 순위 섹션 */}
            <section className="bg-white rounded-lg shadow">
              <div className="px-4 pt-4">
                <h2 className="text-2xl font-bold text-gray-900">🏆 정치인 순위 TOP 10</h2>
                <p className="text-sm text-gray-600 mt-1">
                  공개된 데이터를 활용하여 AI가 객관적으로 산출한 정치인 평점 순위 (상위 10명)
                </p>
                <div className="w-full h-0.5 bg-primary-500 mt-3 mb-4"></div>
              </div>
              <div className="p-4">
                {politicians.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">정치인 데이터가 없습니다.</p>
                  </div>
                ) : (
                  <>
                    {/* 데스크톱: 테이블 */}
                    <div className="hidden md:block overflow-x-auto">
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
                            <th className="px-2 py-3 text-center font-bold text-gray-900 w-20">회원평가</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {politicians.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50 cursor-pointer">
                              <td className="px-2 py-3 text-center">
                                <span className="font-bold text-gray-900 text-sm">{p.rank}</span>
                              </td>
                              <td className="px-3 py-3">
                                <Link href={`/politicians/${p.id}`}>
                                  <span className="font-bold text-primary-600 hover:text-primary-700 text-sm inline-flex items-center gap-1">
                                    {p.name} <span className="text-xs">›</span>
                                  </span>
                                </Link>
                              </td>
                              <td className="px-2 py-3 text-gray-600 text-xs">{p.identity}</td>
                              <td className="px-2 py-3 text-gray-600 text-xs">{p.title || '-'}</td>
                              <td className="px-2 py-3 text-gray-600 text-xs">{p.office}</td>
                              <td className="px-2 py-3 text-gray-600 text-xs">{p.party}</td>
                              <td className="px-2 py-3 text-gray-600 text-xs">{p.region}</td>
                              <td className="px-2 py-3 text-center text-xs font-semibold text-accent-600">
                                {p.gradeEmoji} {p.grade}
                              </td>
                              <td className="px-2 py-3 text-center font-bold text-accent-600">{p.totalScore}</td>
                              <td className="px-2 py-3 text-center font-bold text-accent-600">{p.claude}</td>
                              <td className="px-2 py-3 text-center font-bold text-accent-600">{p.chatgpt}</td>
                              <td className="px-2 py-3 text-center font-bold text-accent-600">{p.grok}</td>
                              <td className="px-2 py-3 text-center text-xs">
                                <span className="font-bold text-secondary-600">{p.userRating}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* 모바일: 카드 */}
                    <div className="md:hidden space-y-4">
                      {/* 1위 - 특별 스타일 */}
                      {politicians[0] && (
                        <div className="bg-white border-2 border-primary-500 rounded-lg p-4 shadow-md">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl font-bold text-primary-500">1위</span>
                                <Link
                                  href={`/politicians/${politicians[0].id}`}
                                  className="text-xl font-bold text-gray-900 hover:text-primary-600 hover:underline"
                                >
                                  {politicians[0].name}
                                </Link>
                              </div>
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">
                                  {politicians[0].identity} {politicians[0].title && `• ${politicians[0].title}`}
                                </span>
                                <span className="mx-1">|</span>
                                <span>{politicians[0].party}</span>
                              </div>
                              <div className="text-sm text-gray-600">{politicians[0].region}</div>
                            </div>
                          </div>
                          <div className="border-t pt-3 mt-3">
                            <div className="text-center mb-3 pb-3 border-b">
                              <div className="text-xs text-gray-600 mb-1">종합평점</div>
                              <div className="text-2xl font-bold text-accent-600">{politicians[0].totalScore}</div>
                              <div className="text-sm font-bold mt-1">
                                {politicians[0].gradeEmoji}{' '}
                                <span className="text-accent-600">{politicians[0].grade}</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                              <div className="flex items-center gap-2">
                                <img src={aiLogos.claude} alt="Claude" className="h-5 w-5 object-contain rounded" />
                                <span className="text-xs text-gray-900">Claude</span>
                                <span className="ml-auto font-bold text-accent-600">{politicians[0].claude}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <img src={aiLogos.chatgpt} alt="ChatGPT" className="h-5 w-5 object-contain" />
                                <span className="text-xs text-gray-900">ChatGPT</span>
                                <span className="ml-auto font-bold text-accent-600">{politicians[0].chatgpt}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <img src={aiLogos.grok} alt="Grok" className="h-5 w-5 object-contain" />
                                <span className="text-xs text-gray-900">Grok</span>
                                <span className="ml-auto font-bold text-accent-600">{politicians[0].grok}</span>
                              </div>
                            </div>
                            <div className="text-center pt-2 border-t">
                              <div className="text-xs text-gray-600 mb-1">회원평가</div>
                              <div className="font-bold text-secondary-600">{politicians[0].userRating}</div>
                              <div className="text-xs text-gray-600">({politicians[0].userCount}명)</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 2-3위 */}
                      {politicians.slice(1, 3).map((p) => (
                        <div key={p.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl font-bold text-gray-700">{p.rank}위</span>
                                <Link
                                  href={`/politicians/${p.id}`}
                                  className="text-lg font-bold text-gray-900 hover:text-primary-600 hover:underline"
                                >
                                  {p.name}
                                </Link>
                              </div>
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">{p.identity} {p.title && `• ${p.title}`}</span>
                                <span className="mx-1">|</span>
                                <span>{p.party}</span>
                              </div>
                              <div className="text-sm text-gray-600">{p.region}</div>
                            </div>
                          </div>
                          <div className="border-t pt-3 mt-3">
                            <div className="text-center mb-3 pb-3 border-b">
                              <div className="text-xs text-gray-600 mb-1">종합평점</div>
                              <div className="text-2xl font-bold text-accent-600">{p.totalScore}</div>
                              <div className="text-sm font-bold mt-1">
                                {p.gradeEmoji} <span className="text-accent-600">{p.grade}</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                              <div className="flex items-center gap-2">
                                <img src={aiLogos.claude} alt="Claude" className="h-5 w-5 object-contain rounded" />
                                <span className="text-xs text-gray-900">Claude</span>
                                <span className="ml-auto font-bold text-accent-600">{p.claude}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <img src={aiLogos.chatgpt} alt="ChatGPT" className="h-5 w-5 object-contain" />
                                <span className="text-xs text-gray-900">ChatGPT</span>
                                <span className="ml-auto font-bold text-accent-600">{p.chatgpt}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <img src={aiLogos.grok} alt="Grok" className="h-5 w-5 object-contain" />
                                <span className="text-xs text-gray-900">Grok</span>
                                <span className="ml-auto font-bold text-accent-600">{p.grok}</span>
                              </div>
                            </div>
                            <div className="text-center pt-2 border-t">
                              <div className="text-xs text-gray-600 mb-1">회원평가</div>
                              <div className="font-bold text-secondary-600">{p.userRating}</div>
                              <div className="text-xs text-gray-600">({p.userCount}명)</div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* 4-10위 - 간략 버전 */}
                      {politicians.slice(3).map((p) => (
                        <div key={p.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold text-gray-700">{p.rank}위</span>
                              <div>
                                <Link
                                  href={`/politicians/${p.id}`}
                                  className="font-bold text-gray-900 hover:text-primary-600 hover:underline"
                                >
                                  {p.name}
                                </Link>
                                <div className="text-xs text-gray-600">
                                  {p.identity} {p.title && `• ${p.title}`} | {p.party}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-accent-600">{p.totalScore}</div>
                              <div className="text-xs font-bold">
                                {p.gradeEmoji} <span className="text-accent-600">{p.grade}</span>
                              </div>
                              <div className="text-xs text-gray-600">종합평점</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="text-center pt-4">
                      <Link
                        href="/politicians"
                        className="inline-block px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium focus:outline-none focus:ring-2 focus:ring-primary-300"
                      >
                        전체 순위 보기 →
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* 정치인 최근 게시글 섹션 */}
            <section className="bg-white rounded-lg shadow">
              <div className="p-4 border-b-2 border-primary-500">
                <h2 className="text-2xl font-bold text-gray-900">📝 정치인 최근 게시글</h2>
                <p className="text-sm text-gray-600 mt-1">정치인들이 작성한 최신 글</p>
              </div>
              <div className="divide-y">
                {politicianPosts.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">정치인 게시글이 없습니다</div>
                ) : (
                  politicianPosts.map((post) => (
                    <Link key={post.id} href={`/community/posts/${post.id}`}>
                      <div className="p-4 hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 mb-1">{post.title}</h3>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{post.content}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              {post.politician_id ? (
                                <Link
                                  href={`/politicians/${post.politician_id}`}
                                  className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {post.politician_name} | {post.politician_identity} {post.politician_title && `• ${post.politician_title}`}
                                </Link>
                              ) : (
                                <span className="font-medium text-primary-600">{post.author}</span>
                              )}
                              <span>{formatDate(post.created_at)}</span>
                              <span>조회 {post.view_count}</span>
                              <span className="text-red-600">👍 {post.upvotes}</span>
                              <span className="text-gray-400">👎 0</span>
                              <span>댓글 {post.comment_count}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </section>

            {/* 커뮤니티 인기 게시글 섹션 */}
            <section className="bg-white rounded-lg shadow">
              <div className="p-4 border-b-2 border-secondary-500">
                <h2 className="text-2xl font-bold text-gray-900">🔥 커뮤니티 인기 게시글</h2>
                <p className="text-sm text-gray-600 mt-1">이번 주 가장 인기 있는 글</p>
              </div>
              <div className="divide-y">
                {popularPosts.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">인기 게시글이 없습니다</div>
                ) : (
                  popularPosts.map((post) => (
                    <Link key={post.id} href={`/community/posts/${post.id}`}>
                      <div className="p-4 hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {post.is_hot && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded">Hot</span>
                              )}
                              {post.is_best && (
                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">Best</span>
                              )}
                              <h3 className="font-bold text-gray-900">{post.title}</h3>
                            </div>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{post.content}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="font-medium text-secondary-600">{post.author}</span>
                              {post.member_level && (
                                <span className="text-xs text-gray-900 font-medium">{post.member_level}</span>
                              )}
                              <span className="text-xs text-emerald-900 font-medium">🏰 영주</span>
                              <span>{formatDate(post.created_at)}</span>
                              <span>조회 {post.view_count}</span>
                              <span className="text-red-600">👍 {post.upvotes}</span>
                              <span className="text-gray-400">👎 0</span>
                              <span>댓글 {post.comment_count}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
              <div className="p-4 text-center border-t">
                <Link
                  href="/community"
                  className="inline-block px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium"
                >
                  커뮤니티 더보기 →
                </Link>
              </div>
            </section>
          </div>

          {/* 우측 사이드바 */}
          <aside className="lg:col-span-3 space-y-4">
            {/* 공지사항 */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-primary-500">
                <h3 className="font-bold text-xl text-gray-900">📢 공지사항</h3>
                <Link href="/notices" className="text-xs text-gray-500 hover:text-primary-600">더보기 →</Link>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                {notices.length === 0 ? (
                  <p className="text-center text-gray-500">공지사항이 없습니다</p>
                ) : (
                  notices.map((notice, index) => (
                    <Link
                      key={notice.id}
                      href={`/notices/${notice.id}`}
                      className="block hover:text-primary-600 line-clamp-1"
                    >
                      <span className={index === 0 ? "text-red-600 font-bold mr-1" : "text-primary-600 mr-1"}>📢</span>
                      {notice.title}
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* 정치인 통계 */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold text-xl mb-3 pb-2 border-b-2 border-primary-500 text-gray-900">📊 정치인 등록 현황</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">전체</span>
                  <span className="font-semibold text-gray-900">30명</span>
                </div>
                <div className="mt-3 pt-2 border-t">
                  <div className="font-semibold text-gray-900 mb-2">📋 신분별</div>
                  <div className="space-y-1 pl-2">
                    <div className="flex justify-between text-gray-700"><span>현직</span><span className="font-medium text-gray-900">23명</span></div>
                    <div className="flex justify-between text-gray-700"><span>후보자</span><span className="font-medium text-gray-900">3명</span></div>
                    <div className="flex justify-between text-gray-700"><span>예비후보자</span><span className="font-medium text-gray-900">2명</span></div>
                    <div className="flex justify-between text-gray-700"><span>출마자</span><span className="font-medium text-gray-900">2명</span></div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t">
                  <div className="font-semibold text-gray-900 mb-2">🏛️ 출마직종별</div>
                  <div className="space-y-1 pl-2">
                    <div className="flex justify-between text-gray-700"><span>국회의원</span><span className="font-medium text-gray-900">12명</span></div>
                    <div className="flex justify-between text-gray-700"><span>광역단체장</span><span className="font-medium text-gray-900">5명</span></div>
                    <div className="flex justify-between text-gray-700"><span>광역의원</span><span className="font-medium text-gray-900">4명</span></div>
                    <div className="flex justify-between text-gray-700"><span>기초단체장</span><span className="font-medium text-gray-900">6명</span></div>
                    <div className="flex justify-between text-gray-700"><span>기초의원</span><span className="font-medium text-gray-900">3명</span></div>
                    <div className="flex justify-between text-gray-700"><span>교육감</span><span className="font-medium text-gray-900">2명</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 회원 통계 */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold text-xl mb-3 pb-2 border-b-2 border-secondary-500 text-gray-900">👥 회원 현황</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-700">전체</span><span className="font-semibold text-gray-900">20명</span></div>
                <div className="flex justify-between"><span className="text-gray-700">이번 달 가입</span><span className="font-semibold text-gray-900">0명</span></div>
                <div className="mt-3 pt-2 border-t">
                  <div className="font-semibold text-gray-900 mb-2">📊 레벨별 분포</div>
                  <div className="space-y-1 pl-2">
                    <div className="flex justify-between text-xs text-gray-700"><span>ML5</span><span className="font-medium text-gray-900">1명</span></div>
                    <div className="flex justify-between text-xs text-gray-700"><span>ML4</span><span className="font-medium text-gray-900">7명</span></div>
                    <div className="flex justify-between text-xs text-gray-700"><span>ML3</span><span className="font-medium text-gray-900">11명</span></div>
                    <div className="flex justify-between text-xs text-gray-700"><span>ML2</span><span className="font-medium text-gray-900">1명</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 커뮤니티 통계 */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold text-xl mb-3 pb-2 border-b-2 border-secondary-500 text-gray-900">💬 커뮤니티 활동</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <div className="font-semibold text-gray-900 mb-1">전체 게시글: 20개</div>
                  <div className="pl-2 space-y-1">
                    <div className="flex justify-between text-gray-700"><span>정치인글</span><span className="font-medium text-gray-900">2개</span></div>
                    <div className="flex justify-between text-gray-700"><span>회원글</span><span className="font-medium text-gray-900">18개</span></div>
                  </div>
                </div>
                <div className="pt-2"><div className="font-semibold text-gray-900">전체 댓글: 59개</div></div>
                <div className="mt-3 pt-2 border-t">
                  <div className="font-semibold text-gray-900 mb-1">📅 오늘</div>
                  <div className="pl-2 space-y-1">
                    <div className="flex justify-between text-gray-700"><span>게시글</span><span className="font-medium text-gray-900">0개</span></div>
                    <div className="flex justify-between text-gray-700"><span>댓글</span><span className="font-medium text-gray-900">4개</span></div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t">
                  <div className="font-semibold text-gray-900 mb-1">📅 이번 주</div>
                  <div className="pl-2 space-y-1">
                    <div className="flex justify-between text-gray-700"><span>게시글</span><span className="font-medium text-gray-900">3개</span></div>
                    <div className="flex justify-between text-gray-700"><span>댓글</span><span className="font-medium text-gray-900">12개</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* 연결 */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold text-xl mb-3 pb-2 border-b-2 border-gray-700 text-gray-900">🔗 서비스 중개</h3>
              <div className="space-y-3 text-sm">
                <Link href="/relay" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <div className="font-semibold text-gray-900 mb-1">⚖️ 법률자문</div>
                  <p className="text-xs text-gray-600">정치 활동 관련 법률자문 서비스</p>
                </Link>
                <Link href="/relay" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <div className="font-semibold text-gray-900 mb-1">💼 컨설팅</div>
                  <p className="text-xs text-gray-600">선거 전략, 공약 개발 관련 컨설팅</p>
                </Link>
                <Link href="/relay" className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                  <div className="font-semibold text-gray-900 mb-1">🎯 홍보</div>
                  <p className="text-xs text-gray-600">SNS 관리, 미디어 홍보, 브랜딩</p>
                </Link>
              </div>
              <div className="mt-3 pt-3 border-t text-center">
                <Link href="/relay" className="text-gray-700 hover:text-gray-900 font-medium text-sm">전체 서비스 보기 →</Link>
              </div>
            </div>

            {/* 광고: Claude 완벽 가이드 */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-xs text-gray-500 mb-2">광고</div>
              <a
                href="https://sales-system-psi.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg p-4 transition hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #FFF8F3 0%, #FFEBE0 100%)', border: '1px solid #FF6B35' }}
              >
                <div className="text-center">
                  <h4 className="font-bold text-lg" style={{ color: '#2C3E50' }}>Claude 설치부터 기본 사용까지 완벽 가이드</h4>
                  <p className="text-sm font-medium mt-2" style={{ color: '#FF6B35' }}>국내 최초 Claude 4종 종합 설치 가이드북</p>
                  <div className="mt-4 px-6 py-2 inline-block bg-white rounded-full font-bold text-lg" style={{ color: '#FF6B35', border: '1px solid #FF6B35' }}>₩9,990</div>
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

            {/* 내 정보 */}
            <div className="bg-white rounded-lg shadow p-3">
              <h3 className="font-bold text-xl mb-2 pb-1 border-b-2 border-secondary-500 text-gray-900">👤 나의 활동</h3>
              <div className="flex flex-col gap-1">
                <div className="bg-secondary-50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-900">활동 등급</span>
                    <span className="text-sm font-bold text-gray-900">ML5</span>
                  </div>
                </div>
                <div className="bg-secondary-50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-900">보유 포인트</span>
                    <span className="text-sm font-bold text-gray-900">12,580 P</span>
                  </div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-900">영향력 등급</span>
                    <span className="text-sm font-bold text-emerald-900">🏰 영주</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <div>팔로워 327명</div>
                    <div>지역구 내 상위 15%</div>
                  </div>
                </div>
                <Link
                  href="/mypage"
                  className="block w-full bg-secondary-500 text-white font-medium py-3 rounded-lg hover:bg-secondary-600 transition text-sm text-center"
                >
                  마이페이지
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* M5: 최근 활동 피드 섹션 */}
      <section className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 mt-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">최근 활동</h2>
            <Link href="/community" className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
              더보기
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* 활동 피드 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 dark:text-gray-400">새 게시글</p>
                  <p className="font-medium text-gray-900 dark:text-white truncate">정치인 평가 시스템 도입 제안</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">민주시민 · 5분 전</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary-100 dark:bg-secondary-900 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-secondary-600 dark:text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 dark:text-gray-400">새 댓글</p>
                  <p className="font-medium text-gray-900 dark:text-white truncate">"좋은 의견이네요, 저도 동의합니다"</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">투명한정치 · 12분 전</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 dark:text-gray-400">정치인 평가</p>
                  <p className="font-medium text-gray-900 dark:text-white truncate">김민준 의원에게 ★★★★★ 평가</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">시민참여자 · 18분 전</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🔥</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 dark:text-gray-400">HOT 게시글</p>
                  <p className="font-medium text-gray-900 dark:text-white truncate">2025년 지방선거 전망</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">조회 1,234 · 공감 89</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 dark:text-gray-400">신규 가입</p>
                  <p className="font-medium text-gray-900 dark:text-white truncate">새로운 회원이 가입했습니다</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">미래세대 · 25분 전</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-pink-600 dark:text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 dark:text-gray-400">관심 등록</p>
                  <p className="font-medium text-gray-900 dark:text-white truncate">이서연 부산시장 관심 +5</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">오늘 · 총 234명</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 이용 방법 섹션 */}
      <section className="bg-white py-16 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">이용 방법</h2>
            <p className="text-gray-600">간단한 3단계로 시작하세요</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-secondary-600 text-white rounded-full text-3xl font-bold mb-4">1</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">회원가입</h3>
              <p className="text-gray-600">간단한 정보만 입력하면 손쉽게 회원 가입을 할 수 있습니다.</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-secondary-600 text-white rounded-full text-3xl font-bold mb-4">2</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">정치인 검색</h3>
              <p className="text-gray-600">관심있는 정치인을 검색하고 AI가 산출한 평가점수와 내역을 확인해보세요.</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-secondary-600 text-white rounded-full text-3xl font-bold mb-4">3</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">참여하기</h3>
              <p className="text-gray-600">정치인들에 대해서 평가하고, 정치와 관련된 다양한 주제에 대하여 자신의 주장을 하고 토론하면서 보상 포인트를 모아보세요.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="bg-white py-16 border-t-4 border-secondary-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">더 나은 민주주의를 위한 첫 걸음, PoliticianFinder와 함께 하세요.</h2>
          <Link
            href="/auth/signup"
            className="inline-block px-8 py-4 bg-primary-500 text-white font-bold text-lg rounded-lg hover:bg-primary-600 transition shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            회원가입
          </Link>
        </div>
      </section>

      {/* Floating CTA Buttons (클라이언트 컴포넌트) */}
      <FloatingCTA />
    </main>
  );
}
