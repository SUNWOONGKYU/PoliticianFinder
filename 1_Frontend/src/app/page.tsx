'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { LoadingSection } from '@/components/ui/Spinner';

// 정치인 데이터 타입 정의
interface Politician {
  id: number;
  rank: number;
  name: string;
  identity: string;  // 신분 (현직/후보자/예비후보자/출마자)
  title?: string;    // 직책 (성동구청장 등)
  positionType: string;  // 출마직종 (국회의원/광역단체장/기초단체장/광역의원/기초의원/교육감)
  party: string;
  region: string;
  district?: string;  // 지역구
  totalScore: number;
  grade: string;
  gradeEmoji: string;
  claude: number;
  chatgpt: number;
  grok: number;
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
              region: p.region || '',
              district: p.district || '',     // 지역구
              totalScore: totalScore,
              grade: p.grade || calculateGrade(totalScore),
              gradeEmoji: p.gradeEmoji || getGradeEmoji(p.grade || calculateGrade(totalScore)),
              // API에서 온 개별 AI 점수 사용 (없으면 totalScore 사용)
              claude: p.claude !== undefined ? p.claude : totalScore,
              chatgpt: p.chatgpt !== undefined ? p.chatgpt : totalScore,
              grok: p.grok !== undefined ? p.grok : totalScore,
              userRating: '★'.repeat(Math.round(p.userRating || 0)) + '☆'.repeat(5 - Math.round(p.userRating || 0)),
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
      grok: 910,
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
      grok: 900,
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
      grok: 880,
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
      grok: 860,
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
      grok: 850,
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
      grok: 840,
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
      grok: 830,
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
      grok: 820,
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
      grok: 810,
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
      grok: 800,
      userRating: '★★★☆☆',
      userCount: 76,
    },
  ];

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
                        <th className="px-2 py-3 text-center font-bold text-gray-900 w-12">순위</th>
                        <th className="px-3 py-3 text-left font-bold text-gray-900 w-24">이름</th>
                        <th className="px-2 py-3 text-left font-bold text-gray-900 w-16">신분</th>
                        <th className="px-2 py-3 text-left font-bold text-gray-900 w-28">직책</th>
                        <th className="px-2 py-3 text-left font-bold text-gray-900 w-24">출마직종</th>
                        <th className="px-2 py-3 text-left font-bold text-gray-900 w-24">정당</th>
                        <th className="px-2 py-3 text-left font-bold text-gray-900 w-28">지역</th>
                        <th className="px-2 py-3 text-center font-bold text-gray-900 w-24">평가등급</th>
                        <th className="px-2 py-3 text-center font-bold text-gray-900 w-20">종합평점</th>
                        <th className="px-2 py-3 text-center font-bold text-gray-900 w-24">
                          <div className="flex items-center justify-center gap-1">
                            <img src={aiLogos.claude} alt="Claude" className="h-4 w-4 object-contain rounded" />
                            <span>Claude</span>
                          </div>
                        </th>
                        <th className="px-2 py-3 text-center font-bold text-gray-900 w-24">
                          <div className="flex items-center justify-center gap-1">
                            <img src={aiLogos.chatgpt} alt="ChatGPT" className="h-4 w-4 object-contain" />
                            <span>ChatGPT</span>
                          </div>
                        </th>
                        <th className="px-2 py-3 text-center font-bold text-gray-900 w-24">
                          <div className="flex items-center justify-center gap-1">
                            <img src={aiLogos.grok} alt="Grok" className="h-4 w-4 object-contain" />
                            <span>Grok</span>
                          </div>
                        </th>
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
                          <td className="px-2 py-3 text-gray-600 text-xs">
                            {p.identity}
                          </td>
                          <td className="px-2 py-3 text-gray-600 text-xs">
                            {p.title || '-'}
                          </td>
                          <td className="px-2 py-3 text-gray-600 text-xs">{p.positionType || '-'}</td>
                          <td className="px-2 py-3 text-gray-600 text-xs">{p.party}</td>
                          <td className="px-2 py-3 text-gray-600 text-xs">
                            {p.district ? `${p.region} ${p.district}` : p.region}
                          </td>
                          <td className="px-2 py-3 text-center text-xs font-semibold text-accent-600">
                            {p.gradeEmoji} {p.grade}
                          </td>
                          <td className="px-2 py-3 text-center font-bold text-accent-600">
                            {p.totalScore > 0 ? p.totalScore : '-'}
                          </td>
                          <td className="px-2 py-3 text-center font-bold text-accent-600">
                            {p.claude > 0 ? p.claude : '-'}
                          </td>
                          <td className="px-2 py-3 text-center font-bold text-accent-600">
                            {p.chatgpt > 0 ? p.chatgpt : '-'}
                          </td>
                          <td className="px-2 py-3 text-center font-bold text-accent-600">
                            {p.grok > 0 ? p.grok : '-'}
                          </td>
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

      {/* M5: 최근 활동 피드 섹션 */}
      <section className="bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 py-12 mt-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">최근 활동</h2>
            <Link
              href="/community"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
            >
              더보기
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* 활동 피드 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 새 게시글 알림 */}
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

            {/* 새 댓글 알림 */}
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

            {/* 정치인 평가 알림 */}
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

            {/* HOT 게시글 알림 */}
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

            {/* 신규 회원 알림 */}
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

            {/* 관심 정치인 알림 */}
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
