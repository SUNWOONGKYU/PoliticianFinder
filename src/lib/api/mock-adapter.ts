/**
 * Mock Data Adapter - Using local mock data for development
 * This adapter bridges frontend UI with mock data from the seed database
 */

import type { PoliticianRanking, HotPost, PoliticianPost } from './home';

// Mock data based on seed data
export const MOCK_POLITICIANS: PoliticianRanking[] = [
  {
    id: 1,
    name: 'Lee Junseok',
    party: 'PEOPLE_POWER',
    region: 'Seoul',
    position: 'National Assembly',
    status: 'active',
    claude_score: 4.2,
    gpt_score: 4.1,
    gemini_score: 4.3,
    grok_score: 4.0,
    perplexity_score: 4.2,
    composite_score: 4.16,
    member_rating: 4.04,
    member_rating_count: 3,
  },
  {
    id: 2,
    name: 'Han Dong-hoon',
    party: 'PEOPLE_POWER',
    region: 'Seoul',
    position: 'National Assembly',
    status: 'active',
    claude_score: 4.0,
    gpt_score: 3.9,
    gemini_score: 4.1,
    grok_score: 3.8,
    perplexity_score: 4.0,
    composite_score: 3.96,
    member_rating: 3.82,
    member_rating_count: 3,
  },
  {
    id: 3,
    name: 'Oh Se-hoon',
    party: 'PEOPLE_POWER',
    region: 'Seoul',
    position: 'Mayor',
    status: 'active',
    claude_score: 3.8,
    gpt_score: 3.7,
    gemini_score: 3.9,
    grok_score: 3.6,
    perplexity_score: 3.8,
    composite_score: 3.76,
    member_rating: 3.6,
    member_rating_count: 3,
  },
  {
    id: 4,
    name: 'Lee Jae-myung',
    party: 'DEMOCRATIC',
    region: 'Gyeonggi',
    position: 'Governor',
    status: 'active',
    claude_score: 3.9,
    gpt_score: 3.8,
    gemini_score: 4.0,
    grok_score: 3.7,
    perplexity_score: 3.9,
    composite_score: 3.86,
    member_rating: 3.5,
    member_rating_count: 2,
  },
  {
    id: 5,
    name: 'Shim Sang-jeung',
    party: 'JUSTICE',
    region: 'Seoul',
    position: 'National Assembly',
    status: 'active',
    claude_score: 4.1,
    gpt_score: 4.0,
    gemini_score: 4.2,
    grok_score: 3.9,
    perplexity_score: 4.1,
    composite_score: 4.06,
    member_rating: 3.9,
    member_rating_count: 2,
  },
  {
    id: 6,
    name: 'Park Young-sun',
    party: 'DEMOCRATIC',
    region: 'Seoul',
    position: 'National Assembly',
    status: 'active',
    claude_score: 3.95,
    gpt_score: 3.85,
    gemini_score: 4.05,
    grok_score: 3.75,
    perplexity_score: 3.95,
    composite_score: 3.91,
    member_rating: 3.7,
    member_rating_count: 2,
  },
];

export const MOCK_HOT_POSTS: HotPost[] = [
  {
    id: 1,
    title: '이준석 의원 정책 발표 - AI 경제 정책 분석',
    content: 'AI 기술을 활용한 경제 정책에 대한 종합 분석',
    category: 'politics',
    view_count: 2543,
    upvotes: 456,
    downvotes: 23,
    comment_count: 123,
    hot_score: 8.5,
    is_hot: true,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
    author_username: 'user1',
  },
  {
    id: 2,
    title: '한동훈 장관 출마 공식 선언',
    content: '한동훈 전 법무부 장관이 대선 출마를 공식 선언',
    category: 'breaking',
    view_count: 4521,
    upvotes: 892,
    downvotes: 45,
    comment_count: 287,
    hot_score: 9.2,
    is_hot: true,
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    author_username: 'news_bot',
  },
  {
    id: 3,
    title: '오세훈 서울시장, 교통 정책 대개혁 발표',
    content: '서울 지하철 요금 인상 및 버스 개편안 공개',
    category: 'policy',
    view_count: 3124,
    upvotes: 567,
    downvotes: 234,
    comment_count: 145,
    hot_score: 7.8,
    is_hot: false,
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    author_username: 'admin',
  },
  {
    id: 4,
    title: '야권 정치인들 AI 활용 정책 대담',
    content: 'AI 정책을 중심으로 한 야권 정치인 좌담회',
    category: 'interview',
    view_count: 1876,
    upvotes: 345,
    downvotes: 12,
    comment_count: 98,
    hot_score: 6.9,
    is_hot: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    author_username: 'journalist_kim',
  },
  {
    id: 5,
    title: '정치인 평가 플랫폼 AI 모델 비교 분석',
    content: 'Claude vs GPT vs Gemini 평가 모델 비교 검토',
    category: 'analysis',
    view_count: 2341,
    upvotes: 678,
    downvotes: 34,
    comment_count: 156,
    hot_score: 8.1,
    is_hot: false,
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    author_username: 'tech_analyst',
  },
];

export const MOCK_POLITICIAN_POSTS: PoliticianPost[] = [
  {
    id: 101,
    politician_id: 1,
    politician_name: 'Lee Junseok',
    politician_party: 'PEOPLE_POWER',
    politician_position: 'National Assembly',
    politician_status: 'active',
    content: '국민과의 대화 시간을 통해 지난주 경제 정책에 대해 설명했습니다. 여러분의 의견을 듣고 더 나은 정책을 만들겠습니다.',
    view_count: 543,
    upvotes: 78,
    comment_count: 23,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 102,
    politician_id: 2,
    politician_name: 'Han Dong-hoon',
    politician_party: 'PEOPLE_POWER',
    politician_position: 'National Assembly',
    politician_status: 'active',
    content: '법치주의 강화를 위한 사법 개혁안을 국회에 제출했습니다. 전문가와 국민의 다양한 의견을 수렴하겠습니다.',
    view_count: 621,
    upvotes: 92,
    comment_count: 34,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: 103,
    politician_id: 3,
    politician_name: 'Oh Se-hoon',
    politician_party: 'PEOPLE_POWER',
    politician_position: 'Mayor',
    politician_status: 'active',
    content: '서울 지하철 9호선 연장 사업이 순조롭게 진행 중입니다. 올해 상반기 개통을 목표로 추진 중이니 기대해주세요.',
    view_count: 854,
    upvotes: 145,
    comment_count: 56,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
  },
];

export const MOCK_SIDEBAR_DATA = {
  stats: {
    total_count: 6,
    active_count: 6,
    candidate_count: 0,
    new_this_week: 1,
  },
  trendingPoliticians: [
    {
      id: 1,
      name: 'Lee Junseok',
      position: 'National Assembly',
      party: 'PEOPLE_POWER',
      score_change: 0.3,
    },
    {
      id: 5,
      name: 'Shim Sang-jeung',
      position: 'National Assembly',
      party: 'JUSTICE',
      score_change: 0.2,
    },
  ],
  realtimeStats: {
    posts_last_hour: 12,
    comments_last_hour: 45,
    active_users_24h: 234,
  },
  connectedServices: [
    {
      id: 1,
      name: 'National Assembly',
      icon: '🏛️',
      description: '국회 공식 데이터 연동',
    },
    {
      id: 2,
      name: 'News API',
      icon: '📰',
      description: '실시간 뉴스 데이터',
    },
  ],
  ad: null,
};

// Export adapter functions
export const mockAdapterApi = {
  getHomeData: async () => {
    return {
      aiRanking: MOCK_POLITICIANS,
      hotPosts: MOCK_HOT_POSTS,
      politicianPosts: MOCK_POLITICIAN_POSTS,
      sidebar: MOCK_SIDEBAR_DATA,
    };
  },

  getAIRanking: async (options?: {
    limit?: number;
    filterType?: 'region' | 'party' | 'position';
    filterValue?: string;
  }) => {
    let result = [...MOCK_POLITICIANS];

    if (options?.filterType && options?.filterValue) {
      const filterKey = options.filterType as keyof typeof MOCK_POLITICIANS[0];
      result = result.filter((p) => {
        const value = p[filterKey];
        return value === options.filterValue || String(value).includes(options.filterValue);
      });
    }

    result = result.sort((a, b) => (b.composite_score || 0) - (a.composite_score || 0));

    return result.slice(0, options?.limit || 10);
  },

  getHotPosts: async (limit = 15) => {
    return MOCK_HOT_POSTS.slice(0, limit);
  },

  getPoliticianPosts: async (limit = 9) => {
    return MOCK_POLITICIAN_POSTS.slice(0, limit);
  },

  getSidebarData: async () => {
    return MOCK_SIDEBAR_DATA;
  },
};

// Extended functions for filtering
mockAdapterApi.getPoliticiansWithFiltering = (filters: any, page: number = 1, itemsPerPage: number = 12) => {
  let result = [...MOCK_POLITICIANS];

  if (filters.searchName) {
    result = result.filter((p) =>
      p.name.toLowerCase().includes(filters.searchName.toLowerCase())
    );
  }
  if (filters.searchParty) {
    result = result.filter((p) =>
      p.party.toLowerCase().includes(filters.searchParty.toLowerCase())
    );
  }
  if (filters.searchRegion) {
    result = result.filter((p) =>
      p.region.toLowerCase().includes(filters.searchRegion.toLowerCase())
    );
  }

  if (filters.parties && filters.parties.length > 0) {
    result = result.filter((p) => filters.parties.includes(p.party));
  }
  if (filters.regions && filters.regions.length > 0) {
    result = result.filter((p) => filters.regions.includes(p.region));
  }
  if (filters.positions && filters.positions.length > 0) {
    result = result.filter((p) => filters.positions.includes(p.position));
  }

  if (filters.sortBy === 'name') {
    result.sort((a, b) =>
      filters.sortOrder === 'desc'
        ? b.name.localeCompare(a.name, 'ko-KR')
        : a.name.localeCompare(b.name, 'ko-KR')
    );
  } else if (filters.sortBy === 'rating') {
    result.sort((a, b) =>
      filters.sortOrder === 'desc'
        ? (b.member_rating || 0) - (a.member_rating || 0)
        : (a.member_rating || 0) - (b.member_rating || 0)
    );
  } else if (filters.sortBy === 'popularity') {
    result.sort((a, b) =>
      filters.sortOrder === 'desc'
        ? (b.member_rating_count || 0) - (a.member_rating_count || 0)
        : (a.member_rating_count || 0) - (b.member_rating_count || 0)
    );
  }

  const total = result.length;
  const from = (page - 1) * itemsPerPage;
  const to = from + itemsPerPage;
  const data = result.slice(from, to);

  return { data, total };
};

mockAdapterApi.getPoliticianById = (id: number) => {
  return MOCK_POLITICIANS.find((p) => p.id === id);
};

// Community Posts Mock Data
export const MOCK_COMMUNITY_POSTS = [
  {
    id: 1,
    title: '이준석 의원의 최신 정책 평가하기',
    content: '이준석 의원의 최근 AI 경제 정책에 대해 어떻게 생각하시나요? 긍정적인 의견과 비판적 의견을 모두 환영합니다.',
    category: 'discussion',
    author_username: 'user1',
    author_avatar: '👤',
    view_count: 342,
    comment_count: 28,
    upvotes: 87,
    downvotes: 3,
    is_hot: true,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 2,
    title: '[질문] 정치인 평가 플랫폼 사용 방법을 알려주세요',
    content: '처음 이 플랫폼을 사용하는데 정치인을 검색하고 평가하는 방법이 잘 모르겠습니다. 누가 좀 알려줄 수 있나요?',
    category: 'question',
    author_username: 'newuser_2024',
    author_avatar: '👤',
    view_count: 156,
    comment_count: 12,
    upvotes: 34,
    downvotes: 1,
    is_hot: false,
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 3,
    title: '한동훈 장관 출마 선언에 대한 평가',
    content: '한동훈 전 법무부 장관이 대선 출마를 선언했습니다. 정치인 평가 플랫폼에서의 그의 평점을 보니 상당히 높네요. 실제로 어떻게 평가하시나요?',
    category: 'news',
    author_username: 'politics_fan',
    author_avatar: '👤',
    view_count: 523,
    comment_count: 45,
    upvotes: 156,
    downvotes: 23,
    is_hot: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 4,
    title: '오세훈 서울시장 교통 정책 평가하기',
    content: '서울 지하철 요금 인상에 대해 어떻게 생각하세요? 예전보다 서비스가 좋아졌나요?',
    category: 'discussion',
    author_username: 'seoul_resident',
    author_avatar: '👤',
    view_count: 289,
    comment_count: 34,
    upvotes: 67,
    downvotes: 12,
    is_hot: false,
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: 5,
    title: '[자유게시판] AI 평가 시스템의 정확도에 대해서',
    content: '이 플랫폼의 AI 모델들이 정치인을 공정하게 평가할 수 있을까요? 다양한 AI 모델의 평가를 비교해보니 차이가 꽤 크네요.',
    category: 'general',
    author_username: 'tech_discussion',
    author_avatar: '👤',
    view_count: 412,
    comment_count: 56,
    upvotes: 134,
    downvotes: 18,
    is_hot: false,
    created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
  },
  {
    id: 6,
    title: '[뉴스] 새로운 정치인 5명 플랫폼에 추가되었습니다',
    content: '정치인 찾기 플랫폼에 새로운 정치인 5명이 추가되었습니다. 지역 정치인들도 추가되어 더 많은 정치인을 평가할 수 있게 되었습니다.',
    category: 'news',
    author_username: 'admin_news',
    author_avatar: '👤',
    view_count: 678,
    comment_count: 78,
    upvotes: 245,
    downvotes: 8,
    is_hot: true,
    created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
  },
  {
    id: 7,
    title: '[토론] 정치인 평가 기준은 무엇이어야 할까?',
    content: '정치인을 평가할 때 어떤 기준을 가장 중요하게 생각하시나요? 정책 실적? 도덕성? 소통 능력? 토론을 나누고 싶습니다.',
    category: 'discussion',
    author_username: 'thoughtful_citizen',
    author_avatar: '👤',
    view_count: 234,
    comment_count: 42,
    upvotes: 89,
    downvotes: 5,
    is_hot: false,
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
  },
  {
    id: 8,
    title: '정치인 평가 플랫폼 개선 의견 모으기',
    content: '이 플랫폼을 더 좋게 만들 수 있는 아이디어가 있으신가요? 다양한 의견을 환영합니다. 개발팀이 참고할 예정입니다.',
    category: 'general',
    author_username: 'feedback_team',
    author_avatar: '👤',
    view_count: 145,
    comment_count: 23,
    upvotes: 56,
    downvotes: 2,
    is_hot: false,
    created_at: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
  },
];

// Add getCommunityPosts function to mockAdapterApi
mockAdapterApi.getCommunityPosts = (category = 'all', searchTerm = '', page = 1, limit = 20) => {
  let posts = [...MOCK_COMMUNITY_POSTS];

  // Filter by category
  if (category !== 'all') {
    posts = posts.filter(post => post.category === category);
  }

  // Filter by search term
  if (searchTerm) {
    posts = posts.filter(post =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  // Sort by created_at (latest first)
  posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Pagination
  const total = posts.length;
  const from = (page - 1) * limit;
  const to = from + limit;
  const data = posts.slice(from, to);

  return { data, total, page, limit };
};
