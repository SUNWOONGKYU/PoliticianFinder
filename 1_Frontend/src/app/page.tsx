'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { LoadingSection } from '@/components/ui/Spinner';
import { formatInfluenceGrade, getInfluenceGrade } from '@/utils/memberLevel';

// 정치인 데이터 타입 정의
interface Politician {
  id: number;
  rank: number;
  name: string;
  identity: string;  // 신분 (현직/후보자/예비후보자/출마자)
  title?: string;    // 직책 (성동구청장 등)
  positionType: string;  // 출마직종 (국회의원/광역단체장/기초단체장/광역의원/기초의원/교육감)
  party: string;
  region: string;      // 출마지역
  district?: string;   // 출마지구
  totalScore: number;
  grade: string;
  gradeEmoji: string;
  claude: number;
  chatgpt: number;
  grok: number;
  userRating: number;
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
  politician_party?: string;     // 정당
  politician_identity?: string;  // P3F3: 신분
  politician_title?: string;     // P3F3: 직책
  view_count: number;
  upvotes: number;
  downvotes: number;
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

// 사이드바 통계 타입 정의
interface SidebarStats {
  politicians: {
    total: number;
    byIdentity: {
      현직: number;
      후보자: number;
      예비후보자: number;
      출마자: number;
    };
    byPosition: {
      국회의원: number;
      광역단체장: number;
      광역의원: number;
      기초단체장: number;
      기초의원: number;
      교육감: number;
    };
  };
  users: {
    total: number;
    thisMonth: number;
    byLevel: Record<string, number>;
  };
  community: {
    posts: {
      total: number;
      politician: number;
      user: number;
    };
    comments: {
      total: number;
    };
    today: {
      posts: number;
      comments: number;
    };
    thisWeek: {
      posts: number;
      comments: number;
    };
  };
}

// 사용자 통계 타입 정의
interface UserStats {
  activity: {
    level: string;
    points: number;
  };
  influence: {
    grade: string;
    title: string;
    emoji: string;
  };
  followers: {
    count: number;
    following_count: number;
  };
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
  const [statistics, setStatistics] = useState({
    politicians: 0,
    users: 0,
    posts: 0,
    ratings: 0,
  });

  // 사이드바 통계 상태
  const [sidebarStats, setSidebarStats] = useState<SidebarStats | null>(null);
  const [sidebarLoading, setSidebarLoading] = useState(true);

  // 로그인 사용자 통계 상태
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userStatsLoading, setUserStatsLoading] = useState(false);

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

  // 사이드바 통계 데이터 가져오기
  useEffect(() => {
    const fetchSidebarStats = async () => {
      try {
        setSidebarLoading(true);
        const response = await fetch('/api/statistics/sidebar');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setSidebarStats(data.data);
          }
        }
      } catch (err) {
        console.error('Error fetching sidebar stats:', err);
      } finally {
        setSidebarLoading(false);
      }
    };

    fetchSidebarStats();
  }, []);

  // 로그인 사용자 확인 및 통계 가져오기
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        // 먼저 현재 로그인 사용자 확인 (/api/auth/me 사용)
        const meResponse = await fetch('/api/auth/me');
        const meData = await meResponse.json();

        // 로그인되지 않은 경우 (401 또는 success: false)
        if (!meData.success || !meData.user?.id) return;

        const userId = meData.user.id;
        setCurrentUserId(userId);
        setUserStatsLoading(true);

        // 사용자 통계 가져오기
        const statsResponse = await fetch(`/api/users/${userId}/stats`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          if (statsData.success && statsData.data) {
            setUserStats(statsData.data);
          }
        }
      } catch (err) {
        console.error('Error fetching user stats:', err);
      } finally {
        setUserStatsLoading(false);
      }
    };

    fetchUserStats();
  }, []);

  // API에서 TOP 10 정치인 데이터 가져오기
  useEffect(() => {
    const fetchTopPoliticians = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/politicians?limit=10&page=1&sort=totalScore&order=desc', {
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
            const totalScore = p.totalScore || p.claudeScore || 0;

            return {
              id: p.id || index + 1,
              rank: index + 1,
              name: p.name,
              identity: p.identity || '현직',  // 신분: 현직/후보자/예비후보자/출마자
              title: p.title || '',           // 직책: 성동구청장 등
              positionType: p.positionType || '',  // 출마직종: 국회의원/광역단체장/기초단체장/광역의원/기초의원/교육감
              party: p.party || '',
              region: p.region || '',         // 출마지역
              district: p.district || '',     // 출마지구
              totalScore: totalScore,
              grade: p.grade || calculateGrade(totalScore),
              gradeEmoji: p.gradeEmoji || getGradeEmoji(p.grade || calculateGrade(totalScore)),
              // API에서 온 개별 AI 점수 사용 (없으면 totalScore 사용)
              claude: p.claude !== undefined ? p.claude : totalScore,
              chatgpt: p.chatgpt !== undefined ? p.chatgpt : totalScore,
              grok: p.grok !== undefined ? p.grok : totalScore,
              userRating: p.userRating || 0,
              userCount: p.ratingCount || 0,
            };
          });
          setPoliticians(transformedData);
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching politicians:', err);
        }
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
                  politician_party: post.politicians?.party,
                  politician_identity: politicianIdentity,  // P3F3
                  politician_title: politicianTitle,        // P3F3
                  view_count: post.view_count || 0,
                  upvotes: post.upvotes || 0,
                  downvotes: post.downvotes || 0,
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
                politician_name: post.politicians?.name,
                politician_position: post.politicians?.position,
                politician_party: post.politicians?.party,
                view_count: post.view_count || 0,
                upvotes: post.upvotes || 0,
                downvotes: post.downvotes || 0,
                comment_count: post.comment_count || 0,
                created_at: post.created_at,
                is_hot: (post.view_count || 0) > 100,
                is_best: (post.upvotes || 0) > 50,
              };
            });
            setPopularPosts(mappedPopularPosts);
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching posts:', err);
        }
      } finally {
        setPostsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // API에서 통계 데이터 가져오기
  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await fetch('/api/statistics/overview', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch statistics');
        }

        const data = await response.json();

        if (data.success && data.data) {
          setStatistics({
            politicians: data.data.total.politicians || 0,
            users: data.data.total.users || 0,
            posts: data.data.total.posts || 0,
            ratings: data.data.total.ratings || 0,
          });
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching statistics:', err);
        }
      }
    };

    fetchStatistics();
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
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching notices:', err);
        }
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

  // AI 로고 URL
  const aiLogos = {
    claude: 'https://cdn.brandfetch.io/idW5s392j1/w/338/h/338/theme/dark/icon.png?c=1bxid64Mup7aczewSAYMX&t=1738315794862',
    chatgpt: 'https://cdn.brandfetch.io/idR3duQxYl/theme/dark/symbol.svg?c=1bxid64Mup7aczewSAYMX',
    grok: 'https://cdn.simpleicons.org/x/000000',
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
    }
  };

  // Floating CTA Component
  const FloatingCTA = () => (
    <div className="fixed bottom-6 right-6 z-50 flex gap-3">
      {/* 검색 버튼 */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="bg-primary-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-primary-600 transition-all hover:scale-105 flex items-center gap-2"
        aria-label="맨 위로 스크롤하여 검색"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>검색</span>
      </button>

      {/* 평가하기 버튼 - 정치인 목록 페이지로 이동 */}
      <button
        onClick={() => window.location.href = '/politicians'}
        className="bg-secondary-600 text-white p-3 rounded-full shadow-lg hover:bg-secondary-700 transition-all hover:scale-105"
        title="정치인 평가하기"
        aria-label="정치인 평가하기"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </button>
    </div>
  );

  return (
    <main className="bg-gray-50">
      {/* 메인 레이아웃 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 메인 콘텐츠 (왼쪽) */}
          <div className="lg:col-span-9 space-y-6">
            {/* 검색 섹션 */}
            <section className="bg-white rounded-lg shadow-lg p-3">
              <div className="space-y-4">
                <div className="relative flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="search"
                      inputMode="search"
                      id="index-search-input"
                      placeholder="정치인과 게시글을 통합 검색하세요"
                      className="w-full px-4 py-3 pl-12 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-gray-900 focus:ring-2 focus:ring-primary-200 text-base"
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

            {/* 통계 섹션 */}
            <section className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg shadow-lg p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {/* 등록된 정치인 */}
                <div className="text-center bg-white/70 backdrop-blur-sm rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="text-4xl md:text-5xl font-bold text-primary-600 mb-2">
                    {statistics.politicians > 0 ? `${statistics.politicians.toLocaleString()}+` : '...'}
                  </div>
                  <div className="text-sm md:text-base text-gray-700 font-medium">
                    등록된 정치인
                  </div>
                </div>

                {/* 회원 */}
                <div className="text-center bg-white/70 backdrop-blur-sm rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="text-4xl md:text-5xl font-bold text-secondary-600 mb-2">
                    {statistics.users > 0 ? `${statistics.users.toLocaleString()}+` : '...'}
                  </div>
                  <div className="text-sm md:text-base text-gray-700 font-medium">
                    회원
                  </div>
                </div>

                {/* 커뮤니티 글 */}
                <div className="text-center bg-white/70 backdrop-blur-sm rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">
                    {statistics.posts > 0 ? `${statistics.posts.toLocaleString()}+` : '...'}
                  </div>
                  <div className="text-sm md:text-base text-gray-700 font-medium">
                    커뮤니티 글
                  </div>
                </div>

                {/* 평가 참여자 */}
                <div className="text-center bg-white/70 backdrop-blur-sm rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                    {statistics.ratings > 0 ? `${statistics.ratings.toLocaleString()}+` : '...'}
                  </div>
                  <div className="text-sm md:text-base text-gray-700 font-medium">
                    평가 참여자
                  </div>
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
                  <LoadingSection message="데이터를 불러오는 중..." height="h-48" />
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
                        <th className="px-1 py-2 text-center font-bold text-gray-900 whitespace-nowrap">순위</th>
                        <th className="px-1 py-2 text-left font-bold text-gray-900 whitespace-nowrap">이름</th>
                        <th className="px-1 py-2 text-left font-bold text-gray-900 max-w-16">직책</th>
                        <th className="px-1 py-2 text-left font-bold text-gray-900 max-w-20">정당</th>
                        <th className="px-1 py-2 text-left font-bold text-gray-900 whitespace-nowrap">신분</th>
                        <th className="px-1 py-2 text-left font-bold text-gray-900 whitespace-nowrap">출마직종</th>
                        <th className="px-1 py-2 text-left font-bold text-gray-900 w-16">출마지역</th>
                        <th className="px-1 py-2 text-left font-bold text-gray-900 w-28">출마지구</th>
                        <th className="px-1 py-2 text-center font-bold text-gray-900">평가등급</th>
                        <th className="px-1 py-2 text-center font-bold text-gray-900">종합평점</th>
                        <th className="px-1 py-2 text-center font-bold text-gray-900">
                          <div className="flex flex-col items-center">
                            <img src={aiLogos.claude} alt="Claude" className="h-4 w-4 object-contain rounded" />
                            <span className="text-xs whitespace-nowrap">Claude</span>
                          </div>
                        </th>
                        <th className="px-1 py-2 text-center font-bold text-gray-900">
                          <div className="flex flex-col items-center">
                            <img src={aiLogos.chatgpt} alt="ChatGPT" className="h-4 w-4 object-contain" />
                            <span className="text-xs whitespace-nowrap">GPT</span>
                          </div>
                        </th>
                        <th className="px-1 py-2 text-center font-bold text-gray-900">
                          <div className="flex flex-col items-center">
                            <img src={aiLogos.grok} alt="Grok" className="h-4 w-4 object-contain" />
                            <span className="text-xs whitespace-nowrap">Grok</span>
                          </div>
                        </th>
                        <th className="px-1 py-2 text-center font-bold text-gray-900">회원평가</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {politicians.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50 cursor-pointer">
                          <td className="px-1 py-2 text-center whitespace-nowrap">
                            <span className="font-bold text-gray-900 text-sm">{p.rank}</span>
                          </td>
                          <td className="px-1 py-2 whitespace-nowrap">
                            <Link href={`/politicians/${p.id}`}>
                              <span className="font-bold text-primary-600 hover:text-primary-700 text-sm">
                                {p.name} <span className="text-xs">›</span>
                              </span>
                            </Link>
                          </td>
                          <td className="px-1 py-2 text-gray-600 text-xs whitespace-nowrap max-w-16 truncate">{p.title || '-'}</td>
                          <td className="px-1 py-2 text-gray-600 text-xs whitespace-nowrap max-w-20 truncate">{p.party}</td>
                          <td className="px-1 py-2 text-gray-600 text-xs whitespace-nowrap">{p.identity}</td>
                          <td className="px-1 py-2 text-gray-600 text-xs whitespace-nowrap">{p.positionType || '-'}</td>
                          <td className="px-1 py-2 text-gray-600 text-xs whitespace-nowrap w-16">{p.region}</td>
                          <td className="px-1 py-2 text-gray-600 text-xs whitespace-nowrap w-28">{p.district || '-'}</td>
                          <td className="px-1 py-2 text-center text-xs font-semibold text-accent-600 whitespace-nowrap">{p.gradeEmoji} {p.grade}</td>
                          <td className="px-1 py-2 text-center font-bold text-accent-600 text-sm whitespace-nowrap">{p.totalScore > 0 ? p.totalScore : '-'}</td>
                          <td className="px-1 py-2 text-center font-bold text-accent-600 text-sm whitespace-nowrap">{p.claude > 0 ? p.claude : '-'}</td>
                          <td className="px-1 py-2 text-center font-bold text-accent-600 text-sm whitespace-nowrap">{p.chatgpt > 0 ? p.chatgpt : '-'}</td>
                          <td className="px-1 py-2 text-center font-bold text-accent-600 text-sm whitespace-nowrap">{p.grok > 0 ? p.grok : '-'}</td>
                          <td className="px-1 py-2 text-center whitespace-nowrap">
                            <div className="font-bold text-secondary-600" style={{ fontSize: '0.6rem' }}>
                              {'★'.repeat(Math.round(p.userRating))}{'☆'.repeat(5 - Math.round(p.userRating))}
                            </div>
                            <div className="text-gray-500" style={{ fontSize: '0.55rem' }}>
                              ({p.userCount || 0}명)
                            </div>
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
                          <img src={aiLogos.grok} alt="Grok" className="h-5 w-5 object-contain" />
                          <span className="text-xs text-gray-900">Grok</span>
                          <span className="ml-auto font-bold text-accent-600">
                            {politicians[0].grok}
                          </span>
                        </div>
                      </div>

                      <div className="text-center pt-2 border-t">
                        <div className="text-xs text-gray-600 mb-1">회원평가</div>
                        {politicians[0].userCount > 0 ? (
                          <>
                            <div className="font-bold text-secondary-600">
                              {'★'.repeat(Math.round(politicians[0].userRating))}{'☆'.repeat(5 - Math.round(politicians[0].userRating))}
                            </div>
                            <div className="text-xs text-gray-600">({politicians[0].userCount}명 평가)</div>
                          </>
                        ) : (
                          <div className="text-xs text-gray-400">평가 없음</div>
                        )}
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
                            <span className="ml-auto font-bold text-accent-600">{p.claude > 0 ? p.claude : '-'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <img
                              src={aiLogos.chatgpt}
                              alt="ChatGPT"
                              className="h-5 w-5 object-contain"
                            />
                            <span className="text-xs text-gray-900">ChatGPT</span>
                            <span className="ml-auto font-bold text-accent-600">{p.chatgpt > 0 ? p.chatgpt : '-'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <img src={aiLogos.grok} alt="Grok" className="h-5 w-5 object-contain" />
                            <span className="text-xs text-gray-900">Grok</span>
                            <span className="ml-auto font-bold text-accent-600">{p.grok > 0 ? p.grok : '-'}</span>
                          </div>
                        </div>

                        <div className="text-center pt-2 border-t">
                          <div className="text-xs text-gray-600 mb-1">회원평가</div>
                          {p.userCount > 0 ? (
                            <>
                              <div className="font-bold text-secondary-600">
                                {'★'.repeat(Math.round(p.userRating))}{'☆'.repeat(5 - Math.round(p.userRating))}
                              </div>
                              <div className="text-xs text-gray-600">({p.userCount}명 평가)</div>
                            </>
                          ) : (
                            <div className="text-xs text-gray-400">평가 없음</div>
                          )}
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
                          {p.userCount > 0 ? (
                            <div className="text-xs text-secondary-600 mt-1">
                              {'★'.repeat(Math.round(p.userRating))}{'☆'.repeat(5 - Math.round(p.userRating))} ({p.userCount}명)
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400 mt-1">평가 없음</div>
                          )}
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
                                  {post.politician_name} | {post.politician_position} • {post.politician_party}
                                </Link>
                              ) : (
                                <span className="font-medium text-primary-600">
                                  {post.author}
                                </span>
                              )}
                              <span>{formatDate(post.created_at)}</span>
                              <span>조회 {post.view_count}</span>
                              <span className="text-red-600">👍 {post.upvotes}</span>
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
                                  {post.politician_name} | {post.politician_position} • {post.politician_party}
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
                                  <span className="text-xs text-emerald-900 font-medium">
                                    {formatInfluenceGrade(0)}
                                  </span>
                                </>
                              )}
                              <span>{formatDate(post.created_at)}</span>
                              <span>조회 {post.view_count}</span>
                              <span className="text-red-600">👍 {post.upvotes}</span>
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
              {sidebarLoading ? (
                <p className="text-center text-gray-500 text-sm">로딩 중...</p>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">전체</span>
                    <span className="font-semibold text-gray-900">{sidebarStats?.politicians.total || 0}명</span>
                  </div>
                  <div className="mt-3 pt-2 border-t">
                    <div className="font-semibold text-gray-900 mb-2">📋 신분별</div>
                    <div className="space-y-1 pl-2">
                      <div className="flex justify-between text-gray-700">
                        <span>현직</span>
                        <span className="font-medium text-gray-900">{sidebarStats?.politicians.byIdentity.현직 || 0}명</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>후보자</span>
                        <span className="font-medium text-gray-900">{sidebarStats?.politicians.byIdentity.후보자 || 0}명</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>예비후보자</span>
                        <span className="font-medium text-gray-900">{sidebarStats?.politicians.byIdentity.예비후보자 || 0}명</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>출마자</span>
                        <span className="font-medium text-gray-900">{sidebarStats?.politicians.byIdentity.출마자 || 0}명</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t">
                    <div className="font-semibold text-gray-900 mb-2">🏛️ 출마직종별</div>
                    <div className="space-y-1 pl-2">
                      <div className="flex justify-between text-gray-700">
                        <span>국회의원</span>
                        <span className="font-medium text-gray-900">{sidebarStats?.politicians.byPosition.국회의원 || 0}명</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>광역단체장</span>
                        <span className="font-medium text-gray-900">{sidebarStats?.politicians.byPosition.광역단체장 || 0}명</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>광역의원</span>
                        <span className="font-medium text-gray-900">{sidebarStats?.politicians.byPosition.광역의원 || 0}명</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>기초단체장</span>
                        <span className="font-medium text-gray-900">{sidebarStats?.politicians.byPosition.기초단체장 || 0}명</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>기초의원</span>
                        <span className="font-medium text-gray-900">{sidebarStats?.politicians.byPosition.기초의원 || 0}명</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>교육감</span>
                        <span className="font-medium text-gray-900">{sidebarStats?.politicians.byPosition.교육감 || 0}명</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 회원 통계 */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold text-xl mb-3 pb-2 border-b-2 border-secondary-500 text-gray-900">
                👥 회원 현황
              </h3>
              {sidebarLoading ? (
                <p className="text-center text-gray-500 text-sm">로딩 중...</p>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">전체</span>
                    <span className="font-semibold text-gray-900">{sidebarStats?.users.total || 0}명</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">이번 달 가입</span>
                    <span className="font-semibold text-gray-900">{sidebarStats?.users.thisMonth || 0}명</span>
                  </div>
                  <div className="mt-3 pt-2 border-t">
                    <div className="font-semibold text-gray-900 mb-2">📊 레벨별 분포</div>
                    <div className="space-y-1 pl-2">
                      {sidebarStats?.users.byLevel && Object.entries(sidebarStats.users.byLevel).map(([level, count]) => (
                        <div key={level} className="flex justify-between text-xs text-gray-700">
                          <span>{level}</span>
                          <span className="font-medium text-gray-900">{count}명</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 커뮤니티 통계 */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold text-xl mb-3 pb-2 border-b-2 border-secondary-500 text-gray-900">
                💬 커뮤니티 활동
              </h3>
              {sidebarLoading ? (
                <p className="text-center text-gray-500 text-sm">로딩 중...</p>
              ) : (
                <div className="space-y-2 text-sm">
                  <div>
                    <div className="font-semibold text-gray-900 mb-1">전체 게시글: {sidebarStats?.community.posts.total || 0}개</div>
                    <div className="pl-2 space-y-1">
                      <div className="flex justify-between text-gray-700">
                        <span>정치인글</span>
                        <span className="font-medium text-gray-900">{sidebarStats?.community.posts.politician || 0}개</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>회원글</span>
                        <span className="font-medium text-gray-900">{sidebarStats?.community.posts.user || 0}개</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="font-semibold text-gray-900">전체 댓글: {sidebarStats?.community.comments.total || 0}개</div>
                  </div>
                  <div className="mt-3 pt-2 border-t">
                    <div className="font-semibold text-gray-900 mb-1">📅 오늘</div>
                    <div className="pl-2 space-y-1">
                      <div className="flex justify-between text-gray-700">
                        <span>게시글</span>
                        <span className="font-medium text-gray-900">{sidebarStats?.community.today.posts || 0}개</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>댓글</span>
                        <span className="font-medium text-gray-900">{sidebarStats?.community.today.comments || 0}개</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t">
                    <div className="font-semibold text-gray-900 mb-1">📅 이번 주</div>
                    <div className="pl-2 space-y-1">
                      <div className="flex justify-between text-gray-700">
                        <span>게시글</span>
                        <span className="font-medium text-gray-900">{sidebarStats?.community.thisWeek.posts || 0}개</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>댓글</span>
                        <span className="font-medium text-gray-900">{sidebarStats?.community.thisWeek.comments || 0}개</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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

            {/* 내 정보 (회원 등급 및 포인트) */}
            <div className="bg-white rounded-lg shadow p-3">
              <h3 className="font-bold text-xl mb-2 pb-1 border-b-2 border-secondary-500 text-gray-900">
                👤 나의 활동
              </h3>
              {userStatsLoading ? (
                <p className="text-center text-gray-500 text-sm py-4">로딩 중...</p>
              ) : !currentUserId ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 mb-3">로그인하면 나의 활동 정보를 확인할 수 있습니다.</p>
                  <Link
                    href="/login"
                    className="inline-block bg-secondary-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-secondary-600 transition text-sm"
                  >
                    로그인하기
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <div className="bg-secondary-50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-900">활동 등급</span>
                      <span className="text-sm font-bold text-gray-900">{userStats?.activity.level || 'ML1'}</span>
                    </div>
                  </div>

                  <div className="bg-secondary-50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-900">활동 포인트</span>
                      <span className="text-sm font-bold text-gray-900">{(userStats?.activity.points || 0).toLocaleString()} P</span>
                    </div>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-900">영향력 등급</span>
                      <span className="text-sm font-bold text-emerald-900">
                        {userStats?.influence.emoji || '🚶'} {userStats?.influence.title || '방랑자'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      팔로워 {userStats?.followers.count || 0}명
                    </div>
                  </div>

                  <Link
                    href="/mypage"
                    className="block w-full bg-secondary-500 text-white font-medium py-3 rounded-lg hover:bg-secondary-600 transition text-sm text-center"
                  >
                    마이페이지
                  </Link>
                </div>
              )}
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

      {/* Floating CTA Buttons */}
      <FloatingCTA />
    </main>
  );
}
