'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { LoadingSection } from '@/components/ui/Spinner';
import { formatInfluenceGrade, getInfluenceGrade } from '@/utils/memberLevel';

const MapModal = dynamic(() => import('@/components/map/MapModal'), { ssr: false });

// 정치인 데이터 타입 정의
interface Politician {
  id: number;
  rank: number;
  name: string;
  identity: string;  // 출마 신분 (출마예정자/예비후보자/후보자)
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
  gemini: number;  // Gemini AI 점수
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
  politician_identity?: string;  // P3F3: 출마 신분
  politician_title?: string;     // P3F3: 직책
  view_count: number;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  share_count: number;
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
      출마예정자: number;
      예비후보자: number;
      후보자: number;
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
        const response = await fetch('/api/statistics/sidebar', {
          next: { revalidate: 60 }, // 1분 캐싱 (통계 데이터)
        });
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
          next: { revalidate: 300 }, // 5분 캐싱 (정치인 랭킹은 자주 변경되지 않음)
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
              identity: p.identity || '출마예정자',  // 출마 신분: 출마예정자/예비후보자/후보자
              title: p.title || '',           // 직책: 성동구청장 등
              positionType: p.positionType || '',  // 출마직종: 국회의원/광역단체장/기초단체장/광역의원/기초의원/교육감
              party: p.party || '',
              region: p.region || '',         // 출마지역
              district: p.district || '',     // 출마지구
              totalScore: Math.round(totalScore),
              grade: p.grade || calculateGrade(totalScore),
              gradeEmoji: p.gradeEmoji || getGradeEmoji(p.grade || calculateGrade(totalScore)),
              // API에서 온 개별 AI 점수 사용 (없으면 0으로 설정하여 '-' 표시), 소수점 제거
              claude: p.claude !== undefined && p.claude !== null ? Math.round(p.claude) : 0,
              chatgpt: p.chatgpt !== undefined && p.chatgpt !== null ? Math.round(p.chatgpt) : 0,
              gemini: p.gemini !== undefined && p.gemini !== null ? Math.round(p.gemini) : 0,
              grok: p.grok !== undefined && p.grok !== null ? Math.round(p.grok) : 0,
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

  // API에서 게시글 데이터 가져오기 (병렬 처리로 성능 최적화)
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setPostsLoading(true);

        // 두 API를 병렬로 호출 (성능 최적화)
        const [politicianPostsResponse, popularPostsResponse] = await Promise.all([
          fetch('/api/posts?has_politician=true&limit=3&page=1'),
          fetch('/api/posts?limit=3&page=1&sort=-view_count')
        ]);

        // 정치인 최근 게시글 처리
        if (politicianPostsResponse.ok) {
          const politicianPostsData = await politicianPostsResponse.json();
          if (politicianPostsData.success && politicianPostsData.data) {
            const mappedPoliticianPosts = politicianPostsData.data.map((post: any) => {
              let politicianName = post.politicians?.name || '정치인';
              let politicianPosition = '국회의원';
              let politicianIdentity = post.politicians?.identity;
              let politicianTitle = post.politicians?.title;

              if (post.politician_id && post.politicians) {
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
                politician_identity: politicianIdentity,
                politician_title: politicianTitle,
                view_count: post.view_count || 0,
                upvotes: post.upvotes || 0,
                downvotes: post.downvotes || 0,
                comment_count: post.comment_count || 0,
                share_count: post.share_count || 0,
                created_at: post.created_at,
              };
            });
            setPoliticianPosts(mappedPoliticianPosts);
          }
        }

        // 커뮤니티 인기 게시글 처리
        if (popularPostsResponse.ok) {
          const popularPostsData = await popularPostsResponse.json();
          if (popularPostsData.success && popularPostsData.data) {
            const mappedPopularPosts = popularPostsData.data.map((post: any, index: number) => {
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
                politician_name: post.politicians?.name,
                politician_position: post.politicians?.position,
                politician_party: post.politicians?.party,
                view_count: post.view_count || 0,
                upvotes: post.upvotes || 0,
                downvotes: post.downvotes || 0,
                comment_count: post.comment_count || 0,
                share_count: post.share_count || 0,
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

  // 출마지역 풀네임 변환
  const getFullRegionName = (region: string): string => {
    const regionMap: Record<string, string> = {
      '서울': '서울특별시',
      '경기': '경기도',
      '인천': '인천광역시',
      '부산': '부산광역시',
      '대구': '대구광역시',
      '광주': '광주광역시',
      '대전': '대전광역시',
      '울산': '울산광역시',
      '세종': '세종특별자치시',
      '강원': '강원특별자치도',
      '충북': '충청북도',
      '충남': '충청남도',
      '전북': '전북특별자치도',
      '전남': '전라남도',
      '경북': '경상북도',
      '경남': '경상남도',
      '제주': '제주특별자치도',
    };
    return regionMap[region] || region;
  };

  // 텍스트 7글자 제한 (초과시 ...)
  const truncateText = (text: string, maxLength: number = 7): string => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  // AI 로고 URL (CDN)
  const aiLogos = {
    claude: 'https://cdn.brandfetch.io/idW5s392j1/w/338/h/338/theme/dark/icon.png?c=1bxid64Mup7aczewSAYMX&t=1738315794862',
    chatgpt: 'https://cdn.brandfetch.io/idR3duQxYl/theme/dark/symbol.svg?c=1bxid64Mup7aczewSAYMX',
    gemini: 'https://cdn.simpleicons.org/googlegemini',
    grok: 'https://cdn.simpleicons.org/x/000000',
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
    }
  };

  // Floating CTA Component - 모바일 최적화: 터치 타겟 확보, safe-area 대응
  const FloatingCTA = () => (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex gap-2 sm:gap-3 safe-area-bottom">
      {/* 검색 버튼 */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="bg-primary-600 text-white px-4 sm:px-5 py-2 min-h-[44px] rounded-full shadow-lg hover:bg-primary-700 transition-all active:scale-95 flex items-center gap-2 touch-manipulation"
        aria-label="맨 위로 스크롤하여 검색"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="hidden sm:inline">검색</span>
      </button>

      {/* 평가하기 버튼 - 정치인 목록 페이지로 이동 */}
      <button
        onClick={() => window.location.href = '/politicians'}
        className="bg-secondary-600 text-white p-2.5 min-w-[44px] min-h-[44px] rounded-full shadow-lg hover:bg-secondary-700 transition-all active:scale-95 flex items-center justify-center touch-manipulation"
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
    <main id="main-content" className="bg-gray-50" role="main">
      {/* 메인 레이아웃 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 메인 콘텐츠 (왼쪽) */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* 검색 섹션 */}
            <section className="bg-white rounded-lg shadow-lg p-3">
              <div className="space-y-4">
                <div className="relative flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="search"
                      inputMode="search"
                      id="index-search-input"
                      placeholder="정치인, 게시글 통합검색"
                      className="w-full px-4 py-2.5 pl-12 min-h-[44px] border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-gray-900 focus:ring-2 focus:ring-primary-200 text-base"
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
                    className="px-5 sm:px-6 py-2.5 min-h-[44px] min-w-[60px] bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-300 font-semibold text-sm shadow-sm touch-manipulation active:bg-primary-800"
                  >
                    검색
                  </button>
                </div>
              </div>
            </section>

            {/* 정치인 순위 섹션 - 모바일 최적화 */}
            <section className="bg-white rounded-lg shadow">
              <div className="px-3 sm:px-4 pt-3 sm:pt-4">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">🏆 정치인 순위 TOP 10</h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2 sm:line-clamp-none">
                  공개된 데이터를 기초로 AI가 객관적으로 평가한 점수를 기준으로 한 정치인 랭킹 (상위 10명)
                </p>
                <div className="w-full h-0.5 bg-primary-500 mt-2 sm:mt-3 mb-3 sm:mb-4"></div>
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
                  <table className="w-full text-[13px]">
                    <thead className="bg-gray-100 border-b-2 border-primary-500">
                      <tr>
                        <th className="px-1 py-2 text-center font-bold text-gray-900 w-10">순위</th>
                        <th className="px-2 py-2 text-left font-bold text-gray-900 min-w-[70px]">이름</th>
                        <th className="px-1 py-2 text-left font-bold text-gray-900 w-20">현 직책</th>
                        <th className="px-1 py-2 text-left font-bold text-gray-900 whitespace-nowrap">정당</th>
                        <th className="px-1 py-2 text-left font-bold text-gray-900 w-16">출마 신분</th>
                        <th className="px-1 py-2 text-left font-bold text-gray-900 whitespace-nowrap">출마직종</th>
                        <th className="px-1 py-2 text-left font-bold text-gray-900 w-20">출마지역</th>
                        <th className="px-1 py-2 text-left font-bold text-gray-900 w-20">출마지구</th>
                        <th className="px-1 py-2 text-center font-bold text-gray-900 whitespace-nowrap">평가등급</th>
                        <th className="px-1 py-2 text-center font-bold text-gray-900 whitespace-nowrap">종합평점</th>
                        <th className="px-1 py-2 text-center font-bold text-gray-900 w-16">
                          <div className="flex flex-col items-center">
                            <Image src={aiLogos.claude} alt="Claude" width={16} height={16} className="h-4 w-4 object-contain rounded" unoptimized />
                            <span className="whitespace-nowrap">Claude</span>
                          </div>
                        </th>
                        <th className="px-1 py-2 text-center font-bold text-gray-900 w-16">
                          <div className="flex flex-col items-center">
                            <Image src={aiLogos.chatgpt} alt="ChatGPT" width={16} height={16} className="h-4 w-4 object-contain" unoptimized />
                            <span className="whitespace-nowrap">GPT</span>
                          </div>
                        </th>
                        <th className="px-1 py-2 text-center font-bold text-gray-900 w-16">
                          <div className="flex flex-col items-center">
                            <Image src={aiLogos.gemini} alt="Gemini" width={16} height={16} className="h-4 w-4 object-contain" unoptimized />
                            <span className="whitespace-nowrap">Gemini</span>
                          </div>
                        </th>
                        <th className="px-1 py-2 text-center font-bold text-gray-900 w-16">
                          <div className="flex flex-col items-center">
                            <img src={aiLogos.grok} alt="Grok" className="h-3 w-3 max-h-3 max-w-3 object-contain" />
                            <span className="whitespace-nowrap">Grok</span>
                          </div>
                        </th>
                        <th className="px-1 py-2 text-center font-bold text-gray-900 whitespace-nowrap">회원평가</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {politicians.map((p) => (
                        <tr key={p.id} className="hover:bg-orange-50 cursor-pointer transition-colors">
                          <td className="px-1 py-2 text-center whitespace-nowrap">
                            <span className="font-bold text-gray-900">{p.rank}</span>
                          </td>
                          <td className="px-1 py-2 whitespace-nowrap">
                            <Link href={`/politicians/${p.id}`}>
                              <span className="font-bold text-primary-600 hover:text-primary-700">
                                {p.name} ›
                              </span>
                            </Link>
                          </td>
                          <td className="px-1 py-2 text-gray-600 whitespace-nowrap" title={p.title || '-'}>{truncateText(p.title || '')}</td>
                          <td className="px-1 py-2 text-gray-600 whitespace-nowrap">{p.party}</td>
                          <td className="px-1 py-2 text-gray-600 whitespace-nowrap">{p.identity}</td>
                          <td className="px-1 py-2 text-gray-600 whitespace-nowrap">{p.positionType || '-'}</td>
                          <td className="px-1 py-2 text-gray-600 whitespace-nowrap" title={getFullRegionName(p.region)}>{truncateText(getFullRegionName(p.region))}</td>
                          <td className="px-1 py-2 text-gray-600 whitespace-nowrap" title={p.district || '-'}>{truncateText(p.district || '')}</td>
                          <td className="px-1 py-2 text-center font-bold text-accent-600 whitespace-nowrap">{p.gradeEmoji} {p.grade}</td>
                          <td className="px-1 py-2 text-center font-bold text-accent-600 whitespace-nowrap">{p.totalScore > 0 ? p.totalScore : '-'}</td>
                          <td className="px-1 py-2 text-center font-bold text-accent-600 whitespace-nowrap">{p.claude > 0 ? p.claude : '-'}</td>
                          <td className="px-1 py-2 text-center font-bold text-accent-600 whitespace-nowrap">{p.chatgpt > 0 ? p.chatgpt : '-'}</td>
                          <td className="px-1 py-2 text-center font-bold text-accent-600 whitespace-nowrap">{p.gemini > 0 ? p.gemini : '-'}</td>
                          <td className="px-1 py-2 text-center font-bold text-accent-600 whitespace-nowrap">{p.grok > 0 ? p.grok : '-'}</td>
                          <td className="px-1 py-2 text-center whitespace-nowrap">
                            <div className="font-bold text-secondary-600" style={{ fontSize: '0.656rem' }}>
                              {'★'.repeat(Math.round(p.userRating))}{'☆'.repeat(5 - Math.round(p.userRating))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 모바일: 카드 */}
                <div className="md:hidden space-y-4">
                  {/* 1위 - 특별 스타일 (카드 전체 클릭 가능) */}
                  <Link
                    href={`/politicians/${politicians[0].id}`}
                    className="block bg-white border-2 border-primary-500 rounded-lg p-4 shadow-md hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl font-bold text-primary-700">1위</span>
                          <span className="text-xl font-bold text-gray-900">
                            {politicians[0].name}
                          </span>
                          {politicians[0].title && (
                            <span className="text-base font-medium text-gray-700">
                              {politicians[0].title}
                            </span>
                          )}
                        </div>
                        {/* 1줄: 정당 */}
                        <div className="text-sm text-gray-600">
                          <span>{politicians[0].party}</span>
                        </div>
                        {/* 2줄: 신분 + 출마직종 + 지역 + 지구 */}
                        <div className="text-sm text-gray-600">
                          {politicians[0].identity}
                          {politicians[0].positionType && ` • ${politicians[0].positionType}`}
                          {` • ${getFullRegionName(politicians[0].region)}`}
                          {politicians[0].district && ` • ${politicians[0].district}`}
                        </div>
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
                            {politicians[0].gemini || '-'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <img src={aiLogos.grok} alt="Grok" className="h-4 w-4 max-h-4 max-w-4 object-contain" />
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
                  </Link>

                  {/* 2-10위 - 일반 카드 (상세) (카드 전체 클릭 가능) */}
                  {politicians.slice(1).map((p) => (
                    <Link key={p.id} href={`/politicians/${p.id}`} className="block bg-white border border-gray-200 rounded-lg p-4 shadow hover:shadow-md hover:border-primary-300 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl font-bold text-gray-700">{p.rank}위</span>
                            <span className="text-lg font-bold text-gray-900">
                              {p.name}
                            </span>
                            {p.title && (
                              <span className="text-sm font-medium text-gray-700">
                                {p.title}
                              </span>
                            )}
                          </div>
                          {/* 1줄: 정당 */}
                          <div className="text-sm text-gray-600">
                            <span>{p.party}</span>
                          </div>
                          {/* 2줄: 신분 + 출마직종 + 지역 + 지구 */}
                          <div className="text-sm text-gray-600">
                            {p.identity}
                            {p.positionType && ` • ${p.positionType}`}
                            {` • ${getFullRegionName(p.region)}`}
                            {p.district && ` • ${p.district}`}
                          </div>
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
                            <img
                              src={aiLogos.gemini}
                              alt="Gemini"
                              className="h-5 w-5 object-contain"
                            />
                            <span className="text-xs text-gray-900">Gemini</span>
                            <span className="ml-auto font-bold text-accent-600">{p.gemini > 0 ? p.gemini : '-'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <img src={aiLogos.grok} alt="Grok" className="h-4 w-4 max-h-4 max-w-4 object-contain" />
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
                    </Link>
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

            {/* 정치인 최근 게시글 섹션 - 모바일 최적화 */}
            <section className="bg-white rounded-lg shadow">
              <div className="p-3 sm:p-4 border-b-2 border-primary-500">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">📝 정치인 최근 게시글</h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">정치인들이 작성한 최신 글</p>
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
                      <div className="p-3 sm:p-4 hover:bg-gray-50 cursor-pointer active:bg-gray-100 touch-manipulation">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 mb-1 text-sm sm:text-base truncate-2">
                              {post.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">
                              {post.content}
                            </p>
                            {/* 메타 정보 - 모바일: 2줄, 데스크탑: 1줄 */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-gray-500">
                              <div className="flex items-center gap-2 flex-wrap">
                                {post.politician_id ? (
                                  <Link
                                    href={`/politicians/${post.politician_id}`}
                                    className="font-medium text-primary-600 hover:text-primary-700 hover:underline truncate max-w-[200px]"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {post.politician_name} | {post.politician_position}
                                  </Link>
                                ) : (
                                  <span className="font-medium text-primary-600 truncate">
                                    {post.author}
                                  </span>
                                )}
                                <span className="hidden sm:inline">{formatDate(post.created_at)}</span>
                              </div>
                              <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs text-gray-500">
                                <span className="sm:hidden text-[10px]">{formatDate(post.created_at)}</span>
                                <span>조회 {post.view_count}</span>
                                <span className="text-red-500">👍 {post.upvotes}</span>
                                <span className="text-gray-400">👎 {post.downvotes}</span>
                                <span>댓글 {post.comment_count}</span>
                                <span>공유 {post.share_count}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </section>

            {/* 커뮤니티 인기 게시글 섹션 - 모바일 최적화 */}
            <section className="bg-white rounded-lg shadow">
              <div className="p-3 sm:p-4 border-b-2 border-secondary-500">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">🔥 커뮤니티 인기 게시글</h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">이번 주 가장 인기 있는 글</p>
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
                      <div className="p-3 sm:p-4 hover:bg-gray-50 cursor-pointer active:bg-gray-100 touch-manipulation">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 sm:gap-2 mb-1 flex-wrap">
                              {post.is_hot && (
                                <span className="px-1.5 sm:px-2 py-0.5 bg-red-100 text-red-600 text-[10px] sm:text-xs font-bold rounded">
                                  Hot
                                </span>
                              )}
                              {post.is_best && (
                                <span className="px-1.5 sm:px-2 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] sm:text-xs font-bold rounded">
                                  Best
                                </span>
                              )}
                              <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                                {post.title}
                              </h3>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">
                              {post.content}
                            </p>
                            {/* 메타 정보 - 모바일: 2줄, 데스크탑: 1줄 */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-gray-500">
                              <div className="flex items-center gap-2 flex-wrap">
                                {post.politician_id ? (
                                  <Link
                                    href={`/politicians/${post.politician_id}`}
                                    className="font-medium text-primary-600 hover:text-primary-700 hover:underline truncate max-w-[180px]"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {post.politician_name} | {post.politician_position}
                                  </Link>
                                ) : (
                                  <>
                                    <span className="font-medium text-secondary-600 truncate">
                                      {post.author}
                                    </span>
                                    {post.member_level && (
                                      <span className="text-[10px] sm:text-xs text-gray-900 font-medium" title={`활동 등급: ${post.member_level}`}>
                                        {post.member_level}
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                              <div className="flex items-center gap-2 sm:gap-3 flex-wrap text-xs text-gray-500">
                                <span className="text-[10px] sm:text-xs">{formatDate(post.created_at)}</span>
                                <span>조회 {post.view_count}</span>
                                <span className="text-red-500">👍 {post.upvotes}</span>
                                <span className="text-gray-400">👎 {post.downvotes}</span>
                                <span>댓글 {post.comment_count}</span>
                                <span>공유 {post.share_count}</span>
                              </div>
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

          {/* 우측 사이드바 - 모바일: 전체 너비, 데스크탑: 고정 320px */}
          <aside className="w-full lg:w-80 lg:flex-shrink-0 space-y-3 sm:space-y-4">
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
                  notices.map((notice) => (
                    <Link
                      key={notice.id}
                      href={`/notices/${notice.id}`}
                      className="block text-gray-900 hover:text-primary-600 line-clamp-1"
                    >
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
                    <div className="font-semibold text-gray-900 mb-2">📋 출마 신분별</div>
                    <div className="space-y-1 pl-2">
                      <div className="flex justify-between text-gray-700">
                        <span>출마예정자</span>
                        <span className="font-medium text-gray-900">{sidebarStats?.politicians.byIdentity.출마예정자 || 0}명</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>예비후보자</span>
                        <span className="font-medium text-gray-900">{sidebarStats?.politicians.byIdentity.예비후보자 || 0}명</span>
                      </div>
                      <div className="flex justify-between text-gray-700">
                        <span>후보자</span>
                        <span className="font-medium text-gray-900">{sidebarStats?.politicians.byIdentity.후보자 || 0}명</span>
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

            {/* 광고 1: Claude 완벽 가이드 */}
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

            {/* 광고 2: YouTube 영상 */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-xs text-gray-500 mb-2">광고</div>
              <div className="rounded-lg overflow-hidden aspect-video">
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube-nocookie.com/embed/NpK76bKELSs?rel=0"
                  title="YouTube video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="rounded-lg"
                ></iframe>
              </div>
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
                  <p className="text-sm text-gray-600">로그인하면 나의 활동 정보를 확인할 수 있습니다.</p>
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
                    className="block w-full bg-secondary-500 text-white font-medium py-2.5 min-h-[44px] rounded-lg hover:bg-secondary-600 transition text-sm text-center flex items-center justify-center"
                  >
                    마이페이지
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* 이용 방법 섹션 - 모바일 최적화 */}
      <section className="bg-white py-8 sm:py-12 md:py-16 mt-8 sm:mt-12 border-t-4 border-secondary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">이용 방법</h2>
            <p className="text-sm sm:text-base text-gray-600">간단한 3단계로 시작하세요</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 md:gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-secondary-600 text-white rounded-full text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">
                1
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">회원가입</h3>
              <p className="text-sm sm:text-base text-gray-600">
                간단한 정보만 입력하면 손쉽게 회원 가입을 할 수 있습니다.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-secondary-600 text-white rounded-full text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">
                2
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">정치인 검색</h3>
              <p className="text-sm sm:text-base text-gray-600">
                관심있는 정치인을 검색하고 AI가 산출한 평가점수와 내역을 확인해보세요.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-secondary-600 text-white rounded-full text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">
                3
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">참여하기</h3>
              <p className="text-sm sm:text-base text-gray-600">
                정치인들에 대해서 평가하고, 정치와 관련된 다양한 주제에 대하여 자신의 주장을 하고
                토론하면서 보상 포인트를 모아보세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Floating CTA Buttons */}
      <FloatingCTA />

    </main>
  );
}
