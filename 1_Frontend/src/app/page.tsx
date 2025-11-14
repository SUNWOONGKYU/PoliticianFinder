'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

// 정치인 데이터 타입 정의
interface Politician {
  id: number;
  rank: number;
  name: string;
  identity: string;  // P3F3: 신분 (현직, 후보자 등)
  title?: string;    // P3F3: 직책 (국회의원 (21대) 등)
  position: string;
  office: string;
  party: string;
  region: string;
  totalScore: number;
  grade: string;
  gradeEmoji: string;
  claude: number;
  chatgpt: number;
  gemini: number;
  grok: number;
  perplexity: number;
  userRating: string;
  userCount: number;
}

// 게시글 데이터 타입 정의
interface Post {
  id: number;
  title: string;
  content: string;
  category: string;
  author: string;
  author_id: string;
  member_level?: string;
  politician_id?: number | null;
  politician_name?: string;
  politician_position?: string;
  politician_identity?: string;  // P3F3: 신분
  politician_title?: string;     // P3F3: 직책
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  is_hot?: boolean;
  is_best?: boolean;
}

// 공지사항 데이터 타입 정의
interface Notice {
  id: number;
  title: string;
  created_at: string;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [politicians, setPoliticians] = useState<Politician[]>([]);
  const [loading, setLoading] = useState(true);
  const [politicianPosts, setPoliticianPosts] = useState<Post[]>([]);
  const [popularPosts, setPopularPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [noticesLoading, setNoticesLoading] = useState(true);

  // Google 로그인 성공 시 URL 파라미터 제거 및 새로고침
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('google_login') === 'success') {
      // URL에서 파라미터 제거
      window.history.replaceState({}, '', '/');
      // 헤더가 세션을 다시 확인하도록 새로고침
      window.location.reload();
    }
  }, []);

  // API에서 TOP 10 정치인 데이터 가져오기
  useEffect(() => {
    const fetchTopPoliticians = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/politicians?limit=10&page=1', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch politicians');
        }

        const data = await response.json();

        if (data.success && data.data && data.data.length > 0) {
          // API 데이터를 홈 페이지 형식으로 변환
          const transformedData = data.data.map((p: any, index: number) => {
            // fieldMapper에서 camelCase로 변환된 필드 사용
            const aiScore = p.totalScore || p.claudeScore || 0;
            return {
              id: p.id || index + 1,
              rank: index + 1,
              name: p.name,
              identity: p.identity || '현직',  // P3F3: 신분
              title: p.title || '',           // P3F3: 직책
              position: p.position || '-',
              office: p.position || '국회의원',
              party: p.party || '',
              region: p.region || '',
              totalScore: aiScore,
              grade: p.grade || calculateGrade(aiScore),
              gradeEmoji: p.gradeEmoji || getGradeEmoji(p.grade || calculateGrade(aiScore)),
              claude: aiScore,
              chatgpt: aiScore,
              gemini: aiScore,
              grok: aiScore,
              perplexity: aiScore,
              userRating: '★'.repeat(Math.round(p.userRating || 0)) + '☆'.repeat(5 - Math.round(p.userRating || 0)),
              userCount: p.ratingCount || 0,
            };
          });
          setPoliticians(transformedData);
        }
      } catch (err) {
        console.error('Error fetching politicians:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopPoliticians();
  }, []);

  // Sample user nicknames
  const sampleNicknames = [
    '정치는우리의것', '투명한정치', '민주시민', '시민참여자', '투표하는시민',
    '민생이우선', '변화를원해', '미래세대', '깨어있는시민', '정책분석가'
  ];

  // API에서 게시글 데이터 가져오기
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setPostsLoading(true);

        // 정치인 최근 게시글 가져오기 (has_politician=true, 최신순 3개)
        const politicianPostsResponse = await fetch('/api/posts?has_politician=true&limit=3&page=1');
        if (politicianPostsResponse.ok) {
          const politicianPostsData = await politicianPostsResponse.json();
          if (politicianPostsData.success && politicianPostsData.data) {
            // Fetch politician names for posts with politician_id
            const mappedPoliticianPosts = await Promise.all(
              politicianPostsData.data.map(async (post: any) => {
                let politicianName = post.politicians?.name || '정치인';
                let politicianPosition = '국회의원';
                let politicianIdentity = post.politicians?.identity;  // P3F3: 신분
                let politicianTitle = post.politicians?.title;        // P3F3: 직책

                if (post.politician_id && post.politicians) {
                  // Position ID mapping (simple version)
                  const positionMap: Record<number, string> = {
                    1: '국회의원',
                    2: '광역단체장',
                    3: '광역의원',
                    4: '기초단체장',
                    5: '기초의원'
                  };
                  politicianPosition = post.politicians.position || positionMap[post.politicians.position_id] || '정치인';
                  politicianIdentity = post.politicians.identity;
                  politicianTitle = post.politicians.title;
                  politicianName = post.politicians.name;
                }

                return {
                  id: post.id,
                  title: post.title,
                  content: post.content,
                  category: post.category,
                  author: politicianName,
                  author_id: post.user_id,
                  politician_id: post.politician_id,
                  politician_name: politicianName,
                  politician_position: politicianPosition,
                  politician_identity: politicianIdentity,  // P3F3
                  politician_title: politicianTitle,        // P3F3
                  view_count: post.view_count || 0,
                  like_count: post.like_count || 0,
                  comment_count: post.comment_count || 0,
                  created_at: post.created_at,
                };
              })
            );
            setPoliticianPosts(mappedPoliticianPosts);
          }
        }

        // 커뮤니티 인기 게시글 가져오기 (전체, 조회수 순 3개)
        const popularPostsResponse = await fetch('/api/posts?limit=3&page=1&sort=-view_count');
        if (popularPostsResponse.ok) {
          const popularPostsData = await popularPostsResponse.json();
          if (popularPostsData.success && popularPostsData.data) {
            const mappedPopularPosts = popularPostsData.data.map((post: any, index: number) => {
              const userIdHash = post.user_id ? post.user_id.split('-')[0].charCodeAt(0) : index;
              const nicknameIndex = userIdHash % 10;
              // Generate member level based on user_id hash (ML1 ~ ML5)
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
                like_count: post.like_count || 0,
                comment_count: post.comment_count || 0,
                created_at: post.created_at,
                is_hot: (post.view_count || 0) > 100,
                is_best: (post.like_count || 0) > 50,
              };
            });
            setPopularPosts(mappedPopularPosts);
          }
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
      } finally {
        setPostsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // API에서 공지사항 데이터 가져오기
  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setNoticesLoading(true);
        const response = await fetch('/api/notices?limit=3');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setNotices(data.data);
          }
        }
      } catch (err) {
        console.error('Error fetching notices:', err);
      } finally {
        setNoticesLoading(false);
      }
    };

    fetchNotices();
  }, []);

  // Grade calculation helper
  const calculateGrade = (score: number): string => {
    if (score >= 900) return 'M';
    if (score >= 850) return 'D';
    if (score >= 800) return 'P';
    if (score >= 750) return 'G';
    return 'E';
  };

  // Date format helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  };

  // Grade emoji helper
  const getGradeEmoji = (grade: string): string => {
    const emojiMap: Record<string, string> = {
      'M': '🌺',
      'D': '💎',
      'P': '🥇',
      'G': '🥇',
      'E': '💚',
    };
    return emojiMap[grade] || '💚';
  };

  // Sample data as fallback (keep for reference but not used)
  const samplePoliticians: Politician[] = [
    {
      id: 1,
      rank: 1,
      name: '김민준',
      identity: '현직',
      title: '',
      position: '-',
      office: '국회의원',
      party: '더불어민주당',
      region: '서울 강남구',
      totalScore: 950,
      grade: 'M',
      gradeEmoji: '🌺',
      claude: 920,
      chatgpt: 900,
      gemini: 880,
      grok: 910,
      perplexity: 890,
      userRating: '★★★★★',
      userCount: 234,
    },
    {
      id: 2,
      rank: 2,
      name: '이서연',
      identity: '현직',
      title: '부산광역시장',
      position: '-',
      office: '광역단체장',
      party: '국민의힘',
      region: '부산광역시',
      totalScore: 890,
      grade: 'D',
      gradeEmoji: '💎',
      claude: 900,
      chatgpt: 890,
      gemini: 870,
      grok: 900,
      perplexity: 880,
      userRating: '★★★★☆',
      userCount: 189,
    },
    {
      id: 3,
      rank: 3,
      name: '박준서',
      identity: '현직',
      title: '',
      position: '-',
      office: '국회의원',
      party: '더불어민주당',
      region: '경기 성남시',
      totalScore: 870,
      grade: 'D',
      gradeEmoji: '💎',
      claude: 880,
      chatgpt: 870,
      gemini: 860,
      grok: 880,
      perplexity: 860,
      userRating: '★★★★☆',
      userCount: 156,
    },
    {
      id: 4,
      rank: 4,
      name: '정하은',
      identity: '현직',
      title: '',
      position: '-',
      office: '광역의원',
      party: '국민의힘',
      region: '인천광역시',
      totalScore: 850,
      grade: 'E',
      gradeEmoji: '💚',
      claude: 860,
      chatgpt: 850,
      gemini: 840,
      grok: 860,
      perplexity: 840,
      userRating: '★★★★☆',
      userCount: 143,
    },
    {
      id: 5,
      rank: 5,
      name: '최지훈',
      identity: '현직',
      title: '수원시장',
      position: '-',
      office: '기초단체장',
      party: '더불어민주당',
      region: '경기 수원시',
      totalScore: 840,
      grade: 'E',
      gradeEmoji: '💚',
      claude: 850,
      chatgpt: 840,
      gemini: 830,
      grok: 850,
      perplexity: 830,
      userRating: '★★★★☆',
      userCount: 128,
    },
    {
      id: 6,
      rank: 6,
      name: '강민서',
      identity: '현직',
      title: '',
      position: '-',
      office: '국회의원',
      party: '국민의힘',
      region: '대구광역시',
      totalScore: 830,
      grade: 'E',
      gradeEmoji: '💚',
      claude: 840,
      chatgpt: 830,
      gemini: 820,
      grok: 840,
      perplexity: 820,
      userRating: '★★★★☆',
      userCount: 115,
    },
    {
      id: 7,
      rank: 7,
      name: '윤서아',
      identity: '현직',
      title: '광주광역시장',
      position: '-',
      office: '광역단체장',
      party: '더불어민주당',
      region: '광주광역시',
      totalScore: 820,
      grade: 'E',
      gradeEmoji: '💚',
      claude: 830,
      chatgpt: 820,
      gemini: 810,
      grok: 830,
      perplexity: 810,
      userRating: '★★★☆☆',
      userCount: 102,
    },
    {
      id: 8,
      rank: 8,
      name: '임도윤',
      identity: '현직',
      title: '',
      position: '-',
      office: '광역의원',
      party: '국민의힘',
      region: '대전광역시',
      totalScore: 810,
      grade: 'E',
      gradeEmoji: '💚',
      claude: 820,
      chatgpt: 810,
      gemini: 800,
      grok: 820,
      perplexity: 800,
      userRating: '★★★☆☆',
      userCount: 95,
    },
    {
      id: 9,
      rank: 9,
      name: '한예진',
      identity: '현직',
      title: '',
      position: '-',
      office: '기초의원',
      party: '더불어민주당',
      region: '경기 고양시',
      totalScore: 800,
      grade: 'E',
      gradeEmoji: '💚',
      claude: 810,
      chatgpt: 800,
      gemini: 790,
      grok: 810,
      perplexity: 790,
      userRating: '★★★☆☆',
      userCount: 87,
    },
    {
      id: 10,
      rank: 10,
      name: '오시우',
      identity: '현직',
      title: '용인시장',
      position: '-',
      office: '기초단체장',
      party: '국민의힘',
      region: '경기 용인시',
      totalScore: 790,
      grade: 'E',
      gradeEmoji: '💚',
      claude: 800,
      chatgpt: 790,
      gemini: 780,
      grok: 800,
      perplexity: 780,
      userRating: '★★★☆☆',
      userCount: 76,
    },
  ];

  // AI 로고 URL
  const aiLogos = {
    claude: 'https://cdn.brandfetch.io/idW5s392j1/w/338/h/338/theme/dark/icon.png?c=1bxid64Mup7aczewSAYMX&t=1738315794862',
    chatgpt: 'https://cdn.brandfetch.io/idR3duQxYl/theme/dark/symbol.svg?c=1bxid64Mup7aczewSAYMX',
    gemini: 'https://cdn.simpleicons.org/googlegemini/4285F4',
    grok: 'https://cdn.simpleicons.org/x/000000',
    perplexity: 'https://cdn.simpleicons.org/perplexity/1FB8CD',
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      console.log('검색:', searchQuery);
    }
  };

  return (
    <main className="bg-gray-50">
      {/* 메인 레이아웃 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 메인 콘텐츠 (왼쪽) */}
          <div className="lg:col-span-9 space-y-6">
            {/* 검색 섹션 */}
            <section className="bg-white rounded-lg shadow-lg p-4">
              <div className="mb-3">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <span>🔍</span>
                  <span>통합검색</span>
                </h2>
              </div>
              <div className="space-y-4">
                <div className="relative flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      id="index-search-input"
                      placeholder="정치인, 게시글을 통합검색 해보세요"
                      className="w-full px-4 py-3 pl-12 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-gray-900 focus:ring-2 focus:ring-primary-200"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleSearch();
                      }}
                    />
                    <svg
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      ></path>
                    </svg>
                  </div>
                  <button
                    onClick={handleSearch}
                    className="px-8 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-300 font-semibold text-sm shadow-sm"
                  >
                    검색
                  </button>
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
                {/* Loading state */}
                {loading && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">데이터를 불러오는 중...</p>
                  </div>
                )}

                {/* Empty state */}
                {!loading && politicians.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">정치인 데이터가 없습니다.</p>
                  </div>
                )}

                {/* Data loaded */}
                {!loading && politicians.length > 0 && (
                  <>
                    {/* 데스크톱: 테이블 */}
                    <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100 border-b-2 border-primary-500">
                      <tr>
                        <th className="px-2 py-3 text-center font-bold text-gray-900">순위</th>
                        <th className="px-3 py-3 text-left font-bold text-gray-900">이름</th>
                        <th className="px-2 py-3 text-left font-bold text-gray-900">신분/직책</th>
                        <th className="px-2 py-3 text-left font-bold text-gray-900">출마직종</th>
                        <th className="px-2 py-3 text-left font-bold text-gray-900">정당/지역</th>
                        <th className="px-2 py-3 text-center font-bold text-gray-900">
                          종합평점
                          <br />
                          (평가등급)
                        </th>
                        <th className="px-2 py-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <img
                              src={aiLogos.claude}
                              alt="Claude"
                              className="h-6 w-6 object-contain rounded"
                            />
                            <span className="text-xs font-medium text-gray-900">Claude</span>
                          </div>
                        </th>
                        <th className="px-2 py-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <img
                              src={aiLogos.chatgpt}
                              alt="ChatGPT"
                              className="h-6 w-6 object-contain"
                            />
                            <span className="text-xs font-medium text-gray-900">ChatGPT</span>
                          </div>
                        </th>
                        <th className="px-2 py-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <img
                              src={aiLogos.gemini}
                              alt="Gemini"
                              className="h-6 w-6 object-contain"
                            />
                            <span className="text-xs font-medium text-gray-900">Gemini</span>
                          </div>
                        </th>
                        <th className="px-2 py-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <img src={aiLogos.grok} alt="Grok" className="h-6 w-6 object-contain" />
                            <span className="text-xs font-medium text-gray-900">Grok</span>
                          </div>
                        </th>
                        <th className="px-2 py-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <img
                              src={aiLogos.perplexity}
                              alt="Perplexity"
                              className="h-6 w-6 object-contain"
                            />
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
                          <td className="px-2 py-3 text-gray-600">
                            <div className="font-medium">{p.identity}</div>
                            <div className="text-xs">{p.title || '-'}</div>
                          </td>
                          <td className="px-2 py-3 text-gray-600 text-xs">{p.office}</td>
                          <td className="px-2 py-3 text-gray-600">
                            <div className="font-medium">{p.party}</div>
                            <div className="text-xs">{p.region}</div>
                          </td>
                          <td className="px-2 py-3 text-center">
                            <div className="font-bold text-accent-600">{p.totalScore}</div>
                            <div className="text-xs font-semibold text-accent-600 mt-0.5">
                              {p.gradeEmoji} {p.grade}
                            </div>
                          </td>
                          <td className="px-2 py-3 text-center font-bold text-accent-600">
                            {p.claude}
                          </td>
                          <td className="px-2 py-3 text-center font-bold text-accent-600">
                            {p.chatgpt}
                          </td>
                          <td className="px-2 py-3 text-center font-bold text-accent-600">
                            {p.gemini}
                          </td>
                          <td className="px-2 py-3 text-center font-bold text-accent-600">
                            {p.grok}
                          </td>
                          <td className="px-2 py-3 text-center font-bold text-accent-600">
                            {p.perplexity}
                          </td>
                          <td className="px-2 py-3 text-center">
                            <div className="font-bold text-secondary-600">{p.userRating}</div>
                            <div className="text-gray-900 text-xs">({p.userCount}명)</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 모바일: 카드 */}
                <div className="md:hidden space-y-4">
                  {/* 1위 - 특별 스타일 */}
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
                        <div className="text-2xl font-bold text-accent-600">
                          {politicians[0].totalScore}
                        </div>
                        <div className="text-sm font-bold mt-1">
                          {politicians[0].gradeEmoji}{' '}
                          <span className="text-accent-600">{politicians[0].grade}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={aiLogos.claude}
                            alt="Claude"
                            className="h-5 w-5 object-contain rounded"
                          />
                          <span className="text-xs text-gray-900">Claude</span>
                          <span className="ml-auto font-bold text-accent-600">
                            {politicians[0].claude}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <img
                            src={aiLogos.chatgpt}
                            alt="ChatGPT"
                            className="h-5 w-5 object-contain"
                          />
                          <span className="text-xs text-gray-900">ChatGPT</span>
                          <span className="ml-auto font-bold text-accent-600">
                            {politicians[0].chatgpt}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <img
                            src={aiLogos.gemini}
                            alt="Gemini"
                            className="h-5 w-5 object-contain"
                          />
                          <span className="text-xs text-gray-900">Gemini</span>
                          <span className="ml-auto font-bold text-accent-600">
                            {politicians[0].gemini}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <img src={aiLogos.grok} alt="Grok" className="h-5 w-5 object-contain" />
                          <span className="text-xs text-gray-900">Grok</span>
                          <span className="ml-auto font-bold text-accent-600">
                            {politicians[0].grok}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <img
                            src={aiLogos.perplexity}
                            alt="Perplexity"
                            className="h-5 w-5 object-contain"
                          />
                          <span className="text-xs text-gray-900">Perplexity</span>
                          <span className="ml-auto font-bold text-accent-600">
                            {politicians[0].perplexity}
                          </span>
                        </div>
                      </div>

                      <div className="text-center pt-2 border-t">
                        <div className="text-xs text-gray-600 mb-1">회원평점</div>
                        <div className="font-bold text-secondary-600">
                          {politicians[0].userRating}
                        </div>
                        <div className="text-xs text-gray-600">({politicians[0].userCount}명)</div>
                      </div>
                    </div>
                  </div>

                  {/* 2-3위 - 일반 카드 (상세) */}
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
                            <span className="font-medium">
                              {p.identity} {p.title && `• ${p.title}`}
                            </span>
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
                            <img
                              src={aiLogos.claude}
                              alt="Claude"
                              className="h-5 w-5 object-contain rounded"
                            />
                            <span className="text-xs text-gray-900">Claude</span>
                            <span className="ml-auto font-bold text-accent-600">{p.claude}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <img
                              src={aiLogos.chatgpt}
                              alt="ChatGPT"
                              className="h-5 w-5 object-contain"
                            />
                            <span className="text-xs text-gray-900">ChatGPT</span>
                            <span className="ml-auto font-bold text-accent-600">{p.chatgpt}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <img
                              src={aiLogos.gemini}
                              alt="Gemini"
                              className="h-5 w-5 object-contain"
                            />
                            <span className="text-xs text-gray-900">Gemini</span>
                            <span className="ml-auto font-bold text-accent-600">{p.gemini}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <img src={aiLogos.grok} alt="Grok" className="h-5 w-5 object-contain" />
                            <span className="text-xs text-gray-900">Grok</span>
                            <span className="ml-auto font-bold text-accent-600">{p.grok}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <img
                              src={aiLogos.perplexity}
                              alt="Perplexity"
                              className="h-5 w-5 object-contain"
                            />
                            <span className="text-xs text-gray-900">Perplexity</span>
                            <span className="ml-auto font-bold text-accent-600">
                              {p.perplexity}
                            </span>
                          </div>
                        </div>

                        <div className="text-center pt-2 border-t">
                          <div className="text-xs text-gray-600 mb-1">회원평점</div>
                          <div className="font-bold text-secondary-600">{p.userRating}</div>
                          <div className="text-xs text-gray-600">({p.userCount}명)</div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* 4-10위 - 간략 버전 */}
                  {politicians.slice(3).map((p) => (
                    <div
                      key={p.id}
                      className="bg-white border border-gray-200 rounded-lg p-3 shadow"
                    >
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
                {postsLoading ? (
                  <div className="p-8 text-center text-gray-500">
                    게시글을 불러오는 중...
                  </div>
                ) : politicianPosts.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    정치인 게시글이 없습니다
                  </div>
                ) : (
                  politicianPosts.map((post) => (
                    <Link key={post.id} href={`/community/posts/${post.id}`}>
                      <div className="p-4 hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 mb-1">
                              {post.title}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {post.content}
                            </p>
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
                                <span className="font-medium text-primary-600">
                                  {post.author}
                                </span>
                              )}
                              <span>{formatDate(post.created_at)}</span>
                              <span>조회 {post.view_count}</span>
                              <span className="text-red-600">👍 {post.like_count}</span>
                              <span className="text-gray-400">👎 0</span>
                              <span>댓글 {post.comment_count}</span>
                              <span className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                공유 0
                              </span>
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
                {postsLoading ? (
                  <div className="p-8 text-center text-gray-500">
                    게시글을 불러오는 중...
                  </div>
                ) : popularPosts.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    인기 게시글이 없습니다
                  </div>
                ) : (
                  popularPosts.map((post) => (
                    <Link key={post.id} href={`/community/posts/${post.id}`}>
                      <div className="p-4 hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {post.is_hot && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded">
                                  Hot
                                </span>
                              )}
                              {post.is_best && (
                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">
                                  Best
                                </span>
                              )}
                              <h3 className="font-bold text-gray-900">
                                {post.title}
                              </h3>
                            </div>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {post.content}
                            </p>
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
                                <>
                                  <span className="font-medium text-secondary-600">
                                    {post.author}
                                  </span>
                                  {post.member_level && (
                                    <span className="text-xs text-gray-900 font-medium" title={`활동 등급: ${post.member_level}`}>
                                      {post.member_level}
                                    </span>
                                  )}
                                  <span className="text-xs text-emerald-900 font-medium">🏰 영주</span>
                                </>
                              )}
                              <span>{formatDate(post.created_at)}</span>
                              <span>조회 {post.view_count}</span>
                              <span className="text-red-600">👍 {post.like_count}</span>
                              <span className="text-gray-400">👎 0</span>
                              <span>댓글 {post.comment_count}</span>
                              <span className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                공유 0
                              </span>
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
                <Link href="/notices" className="text-xs text-gray-500 hover:text-primary-600">
                  더보기 →
                </Link>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                {noticesLoading ? (
                  <p className="text-center text-gray-500">로딩 중...</p>
                ) : notices.length === 0 ? (
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
              <h3 className="font-bold text-xl mb-3 pb-2 border-b-2 border-primary-500 text-gray-900">
                📊 정치인 등록 현황
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">전체</span>
                  <span className="font-semibold text-gray-900">30명</span>
                </div>
                <div className="mt-3 pt-2 border-t">
                  <div className="font-semibold text-gray-900 mb-2">📋 신분별</div>
                  <div className="space-y-1 pl-2">
                    <div className="flex justify-between text-gray-700">
                      <span>현직</span>
                      <span className="font-medium text-gray-900">23명</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>후보자</span>
                      <span className="font-medium text-gray-900">3명</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>예비후보자</span>
                      <span className="font-medium text-gray-900">2명</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>출마자</span>
                      <span className="font-medium text-gray-900">2명</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t">
                  <div className="font-semibold text-gray-900 mb-2">🏛️ 출마직종별</div>
                  <div className="space-y-1 pl-2">
                    <div className="flex justify-between text-gray-700">
                      <span>국회의원</span>
                      <span className="font-medium text-gray-900">12명</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>광역단체장</span>
                      <span className="font-medium text-gray-900">5명</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>광역의원</span>
                      <span className="font-medium text-gray-900">4명</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>기초단체장</span>
                      <span className="font-medium text-gray-900">6명</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>기초의원</span>
                      <span className="font-medium text-gray-900">3명</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>교육감</span>
                      <span className="font-medium text-gray-900">2명</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 회원 통계 */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold text-xl mb-3 pb-2 border-b-2 border-secondary-500 text-gray-900">
                👥 회원 현황
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">전체</span>
                  <span className="font-semibold text-gray-900">20명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">이번 달 가입</span>
                  <span className="font-semibold text-gray-900">0명</span>
                </div>
                <div className="mt-3 pt-2 border-t">
                  <div className="font-semibold text-gray-900 mb-2">📊 레벨별 분포</div>
                  <div className="space-y-1 pl-2">
                    <div className="flex justify-between text-xs text-gray-700">
                      <span>ML5</span>
                      <span className="font-medium text-gray-900">1명</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-700">
                      <span>ML4</span>
                      <span className="font-medium text-gray-900">7명</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-700">
                      <span>ML3</span>
                      <span className="font-medium text-gray-900">11명</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-700">
                      <span>ML2</span>
                      <span className="font-medium text-gray-900">1명</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 커뮤니티 통계 */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold text-xl mb-3 pb-2 border-b-2 border-secondary-500 text-gray-900">
                💬 커뮤니티 활동
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <div className="font-semibold text-gray-900 mb-1">전체 게시글: 20개</div>
                  <div className="pl-2 space-y-1">
                    <div className="flex justify-between text-gray-700">
                      <span>정치인글</span>
                      <span className="font-medium text-gray-900">2개</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>회원글</span>
                      <span className="font-medium text-gray-900">18개</span>
                    </div>
                  </div>
                </div>
                <div className="pt-2">
                  <div className="font-semibold text-gray-900">전체 댓글: 59개</div>
                </div>
                <div className="mt-3 pt-2 border-t">
                  <div className="font-semibold text-gray-900 mb-1">📅 오늘</div>
                  <div className="pl-2 space-y-1">
                    <div className="flex justify-between text-gray-700">
                      <span>게시글</span>
                      <span className="font-medium text-gray-900">0개</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>댓글</span>
                      <span className="font-medium text-gray-900">4개</span>
                    </div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t">
                  <div className="font-semibold text-gray-900 mb-1">📅 이번 주</div>
                  <div className="pl-2 space-y-1">
                    <div className="flex justify-between text-gray-700">
                      <span>게시글</span>
                      <span className="font-medium text-gray-900">3개</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>댓글</span>
                      <span className="font-medium text-gray-900">12개</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 연결 */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold text-xl mb-3 pb-2 border-b-2 border-gray-700 text-gray-900">
                🔗 서비스 중개
              </h3>
              <div className="space-y-3 text-sm">
                <Link
                  href="/relay"
                  className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  <div className="font-semibold text-gray-900 mb-1">⚖️ 법률자문</div>
                  <p className="text-xs text-gray-600">정치 활동 관련 법률자문 서비스</p>
                </Link>
                <Link
                  href="/relay"
                  className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  <div className="font-semibold text-gray-900 mb-1">💼 컨설팅</div>
                  <p className="text-xs text-gray-600">선거 전략, 공약 개발 관련 컨설팅</p>
                </Link>
                <Link
                  href="/relay"
                  className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  <div className="font-semibold text-gray-900 mb-1">🎯 홍보</div>
                  <p className="text-xs text-gray-600">SNS 관리, 미디어 홍보, 브랜딩</p>
                </Link>
              </div>
              <div className="mt-3 pt-3 border-t text-center">
                <Link href="/relay" className="text-gray-700 hover:text-gray-900 font-medium text-sm">
                  전체 서비스 보기 →
                </Link>
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
                style={{
                  background: 'linear-gradient(135deg, #FFF8F3 0%, #FFEBE0 100%)',
                  border: '1px solid #FF6B35',
                }}
              >
                <div className="text-center">
                  <h4 className="font-bold text-lg" style={{ color: '#2C3E50' }}>
                    Claude 설치부터 기본 사용까지 완벽 가이드
                  </h4>
                  <p className="text-sm font-medium mt-2" style={{ color: '#FF6B35' }}>
                    국내 최초 Claude 4종 종합 설치 가이드북
                  </p>
                  <div
                    className="mt-4 px-6 py-2 inline-block bg-white rounded-full font-bold text-lg"
                    style={{ color: '#FF6B35', border: '1px solid #FF6B35' }}
                  >
                    ₩9,990
                  </div>
                  <p className="text-xs mt-3" style={{ color: '#546E7A' }}>
                    자세히 보기 및 구매하기
                  </p>
                </div>
              </a>
            </div>

            {/* 광고 배너 2 */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-xs text-gray-500 mb-2">광고</div>
              <div
                className="bg-gray-100 rounded-lg flex items-center justify-center"
                style={{ height: '150px' }}
              >
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
              <div
                className="bg-gray-100 rounded-lg flex items-center justify-center"
                style={{ height: '150px' }}
              >
                <div className="text-center text-gray-400">
                  <div className="text-3xl mb-1">📢</div>
                  <div className="text-sm">배너 광고 영역 3</div>
                  <div className="text-xs">(300x150)</div>
                </div>
              </div>
            </div>

            {/* 내 정보 (회원 등급 및 포인트) */}
            <div className="bg-white rounded-lg shadow p-3">
              <h3 className="font-bold text-xl mb-2 pb-1 border-b-2 border-secondary-500 text-gray-900">
                👤 나의 활동
              </h3>
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

      {/* 이용 방법 섹션 */}
      <section className="bg-white py-16 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">이용 방법</h2>
            <p className="text-gray-600">간단한 3단계로 시작하세요</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-secondary-600 text-white rounded-full text-3xl font-bold mb-4">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">회원가입</h3>
              <p className="text-gray-600">
                간단한 정보만 입력하면 손쉽게 회원 가입을 할 수 있습니다.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-secondary-600 text-white rounded-full text-3xl font-bold mb-4">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">정치인 검색</h3>
              <p className="text-gray-600">
                관심있는 정치인을 검색하고 AI가 산출한 평가점수와 내역을 확인해보세요.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-secondary-600 text-white rounded-full text-3xl font-bold mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">참여하기</h3>
              <p className="text-gray-600">
                정치인들에 대해서 평가하고, 정치와 관련된 다양한 주제에 대하여 자신의 주장을 하고
                토론하면서 보상 포인트를 모아보세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="bg-white py-16 border-t-4 border-secondary-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            더 나은 민주주의를 위한 첫 걸음, PoliticianFinder와 함께 하세요.
          </h2>
          <Link
            href="/auth/signup"
            className="inline-block px-8 py-4 bg-primary-500 text-white font-bold text-lg rounded-lg hover:bg-primary-600 transition shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            회원가입
          </Link>
        </div>
      </section>
    </main>
  );
}
