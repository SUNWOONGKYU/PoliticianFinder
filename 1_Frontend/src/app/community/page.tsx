'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';

interface CommunityPost {
  id: number;
  title: string;
  content: string;
  category: 'all' | 'politician_post' | 'general';
  author: string;
  author_id: string;
  author_type: 'user' | 'politician';
  politician_id?: number | null;
  politician_tag?: string;
  politician_status?: string;
  politician_position?: string;
  member_level?: string;
  upvotes: number;
  downvotes: number;
  score: number;
  views: number;
  comment_count: number;
  tags: string[];
  is_pinned: boolean;
  is_best: boolean;
  is_hot: boolean;
  created_at: string;
  share_count?: number;
}

const SAMPLE_POSTS: CommunityPost[] = [
  {
    id: 1,
    title: '청년 일자리 공약, 실현 가능성은?',
    content: '최근 여러 정치인들이 청년 일자리 창출을 공약으로 내세우고 있습니다. 하지만 구체적인 실행 계획이 부족해 보입니다. 여러분의 의견은 어떠신가요?',
    category: 'general',
    author: '정치는우리의것',
    author_id: 'user_7659',
    author_type: 'user',
    politician_id: null,
    upvotes: 12,
    downvotes: 2,
    score: 10,
    views: 157,
    comment_count: 4,
    tags: ['청년정책', '일자리', '공약검증'],
    is_pinned: true,
    is_best: false,
    is_hot: false,
    created_at: '2025-10-13T19:58:04.407753Z',
  },
  {
    id: 2,
    title: '지역 교통 인프라 개선 예산안에 대해',
    content: '우리 지역 교통 인프라 개선을 위한 예산안이 통과되었습니다. 시민들의 실생활에 큰 도움이 될 것으로 기대됩니다.',
    category: 'general',
    author: '투명한정치',
    author_id: 'user_2572',
    author_type: 'user',
    politician_id: null,
    upvotes: 76,
    downvotes: 4,
    score: 72,
    views: 766,
    comment_count: 2,
    tags: ['교통', '인프라', '예산'],
    is_pinned: false,
    is_best: false,
    is_hot: false,
    created_at: '2025-10-18T23:58:04.407753Z',
  },
  {
    id: 3,
    title: '정치인 평가 시스템, 어떻게 개선할 수 있을까요?',
    content: '현재 플랫폼의 정치인 평가 시스템에 대한 의견을 나누고 싶습니다. AI 평가와 회원 평가의 균형을 어떻게 맞춰야 할까요?',
    category: 'general',
    author: '투명한정치',
    author_id: 'user_6952',
    author_type: 'user',
    politician_id: null,
    upvotes: 79,
    downvotes: 13,
    score: 66,
    views: 480,
    comment_count: 4,
    tags: ['평가시스템', '개선제안', 'AI'],
    is_pinned: false,
    is_best: false,
    is_hot: true,
    created_at: '2025-10-23T12:58:04.407753Z',
  },
  {
    id: 4,
    title: '중소기업 지원 정책의 실효성',
    content: '중소기업 지원 정책들이 많이 발표되지만, 실제로 중소기업을 운영하는 입장에서는 체감이 잘 안 됩니다. 현장의 목소리를 정책에 반영할 방법이 필요합니다.',
    category: 'general',
    author: '시민참여자',
    author_id: 'user_6952',
    author_type: 'user',
    politician_id: null,
    upvotes: 26,
    downvotes: 1,
    score: 25,
    views: 153,
    comment_count: 1,
    tags: ['중소기업', '경제정책', '현장목소리'],
    is_pinned: false,
    is_best: false,
    is_hot: false,
    created_at: '2025-09-25T11:58:04.407753Z',
  },
  {
    id: 5,
    title: '교육 개혁안, 찬반 의견 나눠봐요',
    content: '새로운 교육 개혁안이 발표되었습니다. 학생, 학부모, 교사 모두의 입장에서 다양한 의견을 듣고 싶습니다.',
    category: 'general',
    author: '민주시민',
    author_id: 'user_8649',
    author_type: 'user',
    politician_id: null,
    upvotes: 13,
    downvotes: 2,
    score: 11,
    views: 138,
    comment_count: 3,
    tags: ['교육', '개혁안', '토론'],
    is_pinned: false,
    is_best: false,
    is_hot: false,
    created_at: '2025-10-06T14:58:04.407753Z',
  },
  {
    id: 6,
    title: '복지 정책 확대, 재원 마련은?',
    content: '복지 정책 확대에는 모두 찬성하지만, 재원 마련 방안에 대해서는 의견이 분분합니다. 증세 vs 재정 효율화, 어떤 방법이 더 합리적일까요?',
    category: 'general',
    author: '투표하는시민',
    author_id: 'user_7348',
    author_type: 'user',
    politician_id: null,
    upvotes: 52,
    downvotes: 11,
    score: 41,
    views: 490,
    comment_count: 2,
    tags: ['복지', '재정', '증세'],
    is_pinned: false,
    is_best: false,
    is_hot: false,
    created_at: '2025-10-04T13:58:04.407753Z',
  },
  {
    id: 7,
    title: '환경 정책 공약 비교 분석',
    content: '각 정당의 환경 정책 공약을 비교 분석해봤습니다. 실현 가능성과 효과성 측면에서 평가해보고 싶습니다.',
    category: 'general',
    author: '정치는우리의것',
    author_id: 'user_9507',
    author_type: 'user',
    politician_id: null,
    upvotes: 112,
    downvotes: 22,
    score: 90,
    views: 939,
    comment_count: 6,
    tags: ['환경', '기후변화', '공약비교'],
    is_pinned: false,
    is_best: true,
    is_hot: false,
    created_at: '2025-10-12T20:58:04.407753Z',
  },
  {
    id: 8,
    title: '지역 발전 정책에 대한 의견',
    content: '우리 지역 발전을 위한 정책들이 필요합니다. 지역 주민들의 실질적인 의견을 모아 정치인들에게 전달하면 좋겠습니다.',
    category: 'general',
    author: '민생이우선',
    author_id: 'user_6505',
    author_type: 'user',
    politician_id: null,
    upvotes: 132,
    downvotes: 25,
    score: 107,
    views: 779,
    comment_count: 2,
    tags: ['지역발전', '주민참여', '정책제안'],
    is_pinned: false,
    is_best: true,
    is_hot: false,
    created_at: '2025-10-01T06:58:04.407753Z',
  },
  {
    id: 9,
    title: '공공의료 확대 정책 어떻게 보시나요?',
    content: '공공의료 확대 정책이 발표되었습니다. 의료 접근성 향상에 도움이 될지, 의료 서비스 질에는 어떤 영향이 있을지 토론해봅시다.',
    category: 'general',
    author: '미래세대',
    author_id: 'user_4493',
    author_type: 'user',
    politician_id: null,
    upvotes: 50,
    downvotes: 7,
    score: 43,
    views: 575,
    comment_count: 4,
    tags: ['의료', '공공의료', '보건정책'],
    is_pinned: false,
    is_best: false,
    is_hot: false,
    created_at: '2025-10-02T04:58:04.407753Z',
  },
  {
    id: 10,
    title: '부동산 정책, 실수요자 보호는?',
    content: '최근 부동산 정책들이 연이어 발표되고 있습니다. 투기 억제도 중요하지만 실수요자 보호 방안도 충분히 고려되었는지 궁금합니다.',
    category: 'general',
    author: '투표하는시민',
    author_id: 'user_9585',
    author_type: 'user',
    politician_id: null,
    upvotes: 27,
    downvotes: 1,
    score: 26,
    views: 369,
    comment_count: 1,
    tags: ['부동산', '주택정책', '실수요자'],
    is_pinned: false,
    is_best: false,
    is_hot: false,
    created_at: '2025-10-01T17:58:04.407753Z',
  },
  {
    id: 11,
    title: '디지털 전환 정책, 소외계층 배려는?',
    content: '정부의 디지털 전환 정책이 빠르게 진행되고 있습니다. 하지만 디지털 소외계층에 대한 배려가 부족해 보입니다.',
    category: 'general',
    author: '변화를원해',
    author_id: 'user_1065',
    author_type: 'user',
    politician_id: null,
    upvotes: 36,
    downvotes: 6,
    score: 30,
    views: 322,
    comment_count: 4,
    tags: ['디지털', '포용정책', '소외계층'],
    is_pinned: false,
    is_best: false,
    is_hot: false,
    created_at: '2025-10-06T02:58:04.407753Z',
  },
  {
    id: 12,
    title: '국방 정책 방향성에 대해',
    content: '변화하는 안보 환경 속에서 우리나라 국방 정책의 방향성에 대한 토론이 필요합니다.',
    category: 'general',
    author: '시민참여자',
    author_id: 'user_9116',
    author_type: 'user',
    politician_id: null,
    upvotes: 113,
    downvotes: 28,
    score: 85,
    views: 1040,
    comment_count: 4,
    tags: ['국방', '안보', '정책방향'],
    is_pinned: false,
    is_best: true,
    is_hot: false,
    created_at: '2025-10-09T16:58:04.407753Z',
  },
  {
    id: 13,
    title: '지방 소멸 위기, 어떻게 해결할까?',
    content: '지방 소멸 위기가 심각합니다. 청년 유출을 막고 지역 경제를 살릴 수 있는 실질적인 정책이 필요합니다.',
    category: 'general',
    author: '시민참여자',
    author_id: 'user_2493',
    author_type: 'user',
    politician_id: null,
    upvotes: 31,
    downvotes: 5,
    score: 26,
    views: 219,
    comment_count: 3,
    tags: ['지방소멸', '인구정책', '지역경제'],
    is_pinned: false,
    is_best: false,
    is_hot: false,
    created_at: '2025-10-08T19:58:04.407753Z',
  },
  {
    id: 14,
    title: '정치 투명성 제고 방안',
    content: '정치 자금, 정책 결정 과정 등 정치의 투명성을 높이기 위한 방안들을 함께 논의해봅시다.',
    category: 'general',
    author: '변화를원해',
    author_id: 'user_3924',
    author_type: 'user',
    politician_id: null,
    upvotes: 99,
    downvotes: 5,
    score: 94,
    views: 1119,
    comment_count: 2,
    tags: ['투명성', '정치개혁', '시민참여'],
    is_pinned: false,
    is_best: true,
    is_hot: false,
    created_at: '2025-10-12T23:58:04.407753Z',
  },
  {
    id: 15,
    title: '기후 위기 대응 정책 긴급합니다',
    content: '기후 위기가 현실이 되고 있습니다. 더 늦기 전에 실질적인 대응 정책이 필요합니다.',
    category: 'general',
    author: '깨어있는시민',
    author_id: 'user_3580',
    author_type: 'user',
    politician_id: null,
    upvotes: 34,
    downvotes: 0,
    score: 34,
    views: 250,
    comment_count: 4,
    tags: ['기후위기', '환경', '긴급대응'],
    is_pinned: false,
    is_best: false,
    is_hot: false,
    created_at: '2025-10-02T20:58:04.407753Z',
  },
  {
    id: 16,
    title: '스타트업 지원 정책, 현장의 목소리',
    content: '스타트업 지원 정책들이 많지만 실제 스타트업 현장에서는 체감이 어렵습니다. 실질적인 지원 방안을 제안합니다.',
    category: 'general',
    author: '정책분석가',
    author_id: 'user_9107',
    author_type: 'user',
    politician_id: null,
    upvotes: 60,
    downvotes: 13,
    score: 47,
    views: 593,
    comment_count: 5,
    tags: ['스타트업', '창업지원', '현장목소리'],
    is_pinned: false,
    is_best: false,
    is_hot: false,
    created_at: '2025-09-29T00:58:04.407753Z',
  },
  {
    id: 17,
    title: '농업 정책, 농민들의 실질적 도움 될까?',
    content: '농업 정책들이 발표되고 있지만 실제 농민들에게 얼마나 도움이 될지 의문입니다. 농촌 현장의 목소리를 들어야 합니다.',
    category: 'general',
    author: '시민참여자',
    author_id: 'user_3258',
    author_type: 'user',
    politician_id: null,
    upvotes: 137,
    downvotes: 33,
    score: 104,
    views: 1668,
    comment_count: 2,
    tags: ['농업', '농촌정책', '농민'],
    is_pinned: false,
    is_best: true,
    is_hot: false,
    created_at: '2025-10-20T19:58:04.407753Z',
  },
  {
    id: 18,
    title: '[공식] 청년 일자리 창출 정책 설명',
    content: '안녕하세요. 청년 일자리 2만개 창출 공약에 대해 구체적인 실행 계획을 말씀드리겠습니다. 중소기업 인턴십 프로그램 1만개, 공공부문 신규 채용 5천개, 창업 지원 5천개로 구성됩니다.',
    category: 'general',
    author: '정치관심러',
    author_id: 'user_8918',
    author_type: 'user',
    politician_id: null,
    upvotes: 16,
    downvotes: 5,
    score: 11,
    views: 109,
    comment_count: 1,
    tags: ['청년정책', '일자리', '공약설명'],
    is_pinned: false,
    is_best: false,
    is_hot: false,
    created_at: '2025-10-12T02:58:04.407753Z',
  },
  {
    id: 19,
    title: '육아 지원 정책 확대 필요성',
    content: '저출산 문제 해결을 위해서는 실질적인 육아 지원 정책 확대가 필수입니다. 보육비 지원, 육아휴직 확대 등이 필요합니다.',
    category: 'politician_post',
    author: '🏛️ 임승현',
    author_id: 'politician_24',
    author_type: 'politician',
    politician_id: 26,
    upvotes: 10,
    downvotes: 0,
    score: 10,
    views: 133,
    comment_count: 2,
    tags: ['육아', '저출산', '복지정책'],
    is_pinned: false,
    is_best: false,
    is_hot: false,
    created_at: '2025-10-05T07:58:04.407753Z',
  },
  {
    id: 20,
    title: '문화 예술 지원 정책 어떻게 보시나요?',
    content: '문화 예술 분야에 대한 지원 정책이 부족하다는 의견이 많습니다. 예술인들의 안정적인 창작 활동을 위한 지원 방안이 필요합니다.',
    category: 'politician_post',
    author: '🏛️ 신지민',
    author_id: 'politician_15',
    author_type: 'politician',
    politician_id: 4,
    upvotes: 10,
    downvotes: 0,
    score: 10,
    views: 57,
    comment_count: 3,
    tags: ['문화', '예술', '지원정책'],
    is_pinned: false,
    is_best: false,
    is_hot: false,
    created_at: '2025-10-12T11:58:04.407753Z',
  },
];

export default function CommunityPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentCategory, setCurrentCategory] = useState<'all' | 'politician_post' | 'general'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'views'>('latest');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [followedUsers, setFollowedUsers] = useState<Set<string>>(new Set());
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Sample user nicknames
  const sampleNicknames = [
    '정치는우리의것', '투명한정치', '민주시민', '시민참여자', '투표하는시민',
    '민생이우선', '변화를원해', '미래세대', '깨어있는시민', '정책분석가'
  ];

  // Fetch posts from API
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/posts?page=${currentPage}&limit=20`);

        if (!response.ok) {
          throw new Error('게시글을 불러오는데 실패했습니다.');
        }

        const result = await response.json();

        if (result.success && result.data) {
          // Map API response to CommunityPost interface
          const mappedPosts: CommunityPost[] = result.data.map((post: any, index: number) => {
            // Generate consistent nickname based on user_id
            const userIdHash = post.user_id ? post.user_id.split('-')[0].charCodeAt(0) : index;
            const nicknameIndex = userIdHash % 10;

            return {
            id: post.id,
            title: post.title,
            content: post.content,
            category: post.category === 'general' ? 'general' : 'politician_post',
            author: sampleNicknames[nicknameIndex],
            author_id: post.user_id,
            author_type: 'user' as const,
            politician_id: post.politician_id,
            politician_tag: undefined,
            politician_status: undefined,
            politician_position: undefined,
            member_level: undefined,
            upvotes: post.like_count || 0,
            downvotes: 0,
            score: post.like_count || 0,
            views: post.view_count || 0,
            comment_count: post.comment_count || 0,
            tags: post.tags || [],
            is_pinned: post.is_pinned || false,
            is_best: false,
            is_hot: (post.view_count || 0) > 100,
            created_at: post.created_at,
            share_count: post.share_count || 0,
          };
          });

          setPosts(mappedPosts);

          // Set total pages from pagination
          if (result.pagination) {
            setTotalPages(result.pagination.totalPages);
          }
        }
      } catch (err) {
        console.error('[커뮤니티 페이지] 게시글 조회 오류:', err);
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [currentPage]);

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    let postsToFilter = posts;

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      postsToFilter = postsToFilter.filter(post =>
        post.title.toLowerCase().includes(searchLower) ||
        post.content.toLowerCase().includes(searchLower) ||
        post.author.toLowerCase().includes(searchLower)
      );
    }

    // Filter by category
    if (currentCategory !== 'all') {
      postsToFilter = postsToFilter.filter(post => post.category === currentCategory);
    }

    // Sort posts
    const sorted = [...postsToFilter];
    if (sortBy === 'latest') {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'popular') {
      sorted.sort((a, b) => b.score - a.score);
    } else if (sortBy === 'views') {
      sorted.sort((a, b) => b.views - a.views);
    }

    return sorted;
  }, [posts, searchTerm, currentCategory, sortBy]);

  const handleFollow = (userId: string) => {
    const newFollowed = new Set(followedUsers);
    if (newFollowed.has(userId)) {
      newFollowed.delete(userId);
    } else {
      newFollowed.add(userId);
    }
    setFollowedUsers(newFollowed);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <p className="text-lg text-gray-600">정치 관련 자신의 주장을 하고 다양한 의견을 나누면서 토론해 보세요</p>
        </div>

        {/* Search Section */}
        <section className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="제목, 내용, 작성자 등으로 게시글 통합검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-12 border-2 border-primary-300 rounded-lg focus:outline-none focus:border-primary-500 text-gray-900 focus:ring-2 focus:ring-primary-200"
              />
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button className="px-8 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-300 font-semibold text-sm shadow-sm">
              검색
            </button>
          </div>
        </section>

        {/* Tab Menu + Write Button */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center space-x-4 overflow-x-auto">
            <button
              onClick={() => setCurrentCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap text-center min-w-[160px] transition ${
                currentCategory === 'all'
                  ? 'bg-primary-500 text-white hover:bg-primary-600'
                  : 'bg-white text-gray-700 border-2 border-primary-500 hover:bg-gray-100'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setCurrentCategory('politician_post')}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap text-center min-w-[160px] transition ${
                currentCategory === 'politician_post'
                  ? 'bg-primary-500 text-white hover:bg-primary-600'
                  : 'bg-white text-gray-700 border-2 border-primary-500 hover:bg-gray-100'
              }`}
            >
              🏛️ 정치인 게시판
            </button>
            <button
              onClick={() => setCurrentCategory('general')}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap text-center min-w-[160px] transition ${
                currentCategory === 'general'
                  ? 'bg-secondary-500 text-white hover:bg-secondary-600'
                  : 'bg-white text-gray-700 border-2 border-secondary-500 hover:bg-gray-100'
              }`}
            >
              💬 회원 자유게시판
            </button>
          </div>

          <button
            onClick={() => setShowCategoryModal(true)}
            className={`px-6 py-2 text-white rounded-lg font-medium hover:bg-opacity-90 transition whitespace-nowrap shadow-md ${
              currentCategory === 'general' ? 'bg-secondary-500' : 'bg-primary-500'
            }`}
          >
            글쓰기
          </button>
        </div>

        {/* Sort Options */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            총 <span className="font-bold text-gray-900">{filteredPosts.length}</span>개의 게시글
            {totalPages > 1 && <span className="ml-2 text-gray-500">({currentPage}/{totalPages} 페이지)</span>}
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'latest' | 'popular' | 'views')}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              <option value="latest">최신순</option>
              <option value="popular">공감순</option>
              <option value="views">조회순</option>
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            <p className="text-gray-500 text-lg mt-4">게시글을 불러오는 중...</p>
          </div>
        ) : error ? (
          /* Error State */
          <div className="text-center py-16">
            <p className="text-red-500 text-lg mb-2">⚠️ {error}</p>
            <p className="text-gray-500 text-sm">잠시 후 다시 시도해 주세요.</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">게시글이 없습니다</p>
          </div>
        ) : (
          /* Post List */
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <Link key={post.id} href={`/community/posts/${post.id}`}>
                <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {post.is_hot && <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">Hot</span>}
                      {post.is_best && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">Best</span>}
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2 hover:text-primary-600">{post.title}</h3>

                  {post.politician_tag && (
                    <div className="mb-2">
                      <span className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded border border-primary-300">
                        🏷️ {post.politician_tag} | {post.politician_status || '현직'} {post.politician_position || '국회의원'} | 정치인에 대해서
                      </span>
                    </div>
                  )}

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{post.content}</p>

                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs text-gray-500 border-t pt-3 flex-wrap">
                    {post.author_type === 'politician' ? (
                      <Link href={`/politicians/${post.politician_id}`} className="font-medium text-primary-600 hover:text-primary-700 hover:underline" onClick={(e) => e.stopPropagation()}>
                        {post.author} | {post.politician_status || '현직'} {post.politician_position || '국회의원'}
                      </Link>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Link href={`/users/${post.author_id}/profile`} className="font-medium text-secondary-600 hover:text-secondary-700 hover:underline" onClick={(e) => e.stopPropagation()}>
                          {post.author}
                        </Link>
                        {post.member_level && <span className="text-xs text-gray-900 font-medium">ML{post.member_level.replace('ML', '')}</span>}
                        <span className="text-xs text-emerald-900 font-medium">🏰 영주</span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleFollow(post.author_id);
                          }}
                          className={`ml-1 px-3 py-1 border-2 rounded-md text-xs transition ${
                            followedUsers.has(post.author_id)
                              ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                              : 'border-emerald-700 text-emerald-900 hover:bg-gray-50'
                          }`}
                        >
                          {followedUsers.has(post.author_id) ? '✓ 팔로우중' : '+ 팔로우'}
                        </button>
                      </div>
                    )}
                    <span>{formatDate(post.created_at)}</span>
                    <span>조회수 {post.views}</span>
                    <span className="text-red-600">👍 {post.upvotes}</span>
                    <span className="text-gray-400">👎 {post.downvotes}</span>
                    <span>댓글 {post.comment_count}</span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      <span>공유 {post.share_count || 0}</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination - 하단 */}
        {!loading && !error && filteredPosts.length > 0 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                currentPage === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
            >
              이전
            </button>
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  currentPage === pageNum
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                currentPage >= totalPages
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
            >
              다음
            </button>
          </div>
        )}
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowCategoryModal(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">카테고리 선택</h2>
            <p className="text-gray-600 mb-6">어떤 게시판에 글을 작성하시겠습니까?</p>

            <div className="space-y-3">
              <Link href="/community/posts/create-politician" className="block w-full px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition text-center font-medium shadow-sm border-4 border-primary-600">
                🏛️ 정치인 게시판
              </Link>
              <Link href="/community/posts/create" className="block w-full px-6 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition text-center font-medium shadow-sm border-4 border-secondary-700">
                💬 회원 자유게시판
              </Link>
            </div>

            <button onClick={() => setShowCategoryModal(false)} className="mt-4 w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium">
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
