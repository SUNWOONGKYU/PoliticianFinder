import { PoliticianDetail } from '../../src/types/politician';
import { RatingWithProfile } from '../../src/types/database';

/**
 * Test Fixtures for Politician Data
 * Mock data for E2E testing
 */

export const mockPoliticianDetail: PoliticianDetail = {
  id: 1,
  name: '홍길동',
  party: '더불어민주당',
  region: '서울 강남구 갑',
  position: '국회의원',
  profile_image_url: 'https://via.placeholder.com/200',
  biography: '대한민국 제21대 국회의원. 서울대학교 법학과 졸업, 사법시험 합격 후 변호사 활동.',
  official_website: 'https://example.com',
  avg_rating: 4.2,
  total_ratings: 150,
  ai_scores: {
    claude: 4.5,
    gpt: 4.3,
    gemini: 4.1,
  },
  rating_distribution: {
    5: 60,
    4: 50,
    3: 25,
    2: 10,
    1: 5,
  },
  total_posts: 45,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-10-17T00:00:00Z',
};

export const mockPoliticianNotFound: PoliticianDetail = {
  id: 999999,
  name: '',
  party: '',
  region: '',
  position: '',
  profile_image_url: '',
  biography: '',
  official_website: '',
  avg_rating: 0,
  total_ratings: 0,
  ai_scores: {},
  rating_distribution: {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  },
  total_posts: 0,
  created_at: '',
  updated_at: '',
};

export const mockRatings: RatingWithProfile[] = [
  {
    id: 1,
    user_id: 'user-1',
    politician_id: 1,
    score: 5,
    comment: '정책이 매우 합리적이고 실현 가능성이 높습니다. 지역구 주민들을 위해 많은 노력을 하고 계십니다.',
    category: 'overall',
    created_at: '2024-10-17T10:00:00Z',
    updated_at: '2024-10-17T10:00:00Z',
    profiles: {
      username: '시민1',
      avatar_url: 'https://via.placeholder.com/40',
    },
  },
  {
    id: 2,
    user_id: 'user-2',
    politician_id: 1,
    score: 4,
    comment: '전반적으로 좋은 활동을 하고 계시지만, 소통이 좀 더 필요할 것 같습니다.',
    category: 'communication',
    created_at: '2024-10-16T15:30:00Z',
    updated_at: '2024-10-16T15:30:00Z',
    profiles: {
      username: '시민2',
      avatar_url: null,
    },
  },
  {
    id: 3,
    user_id: 'user-3',
    politician_id: 1,
    score: 3,
    comment: '보통입니다. 더 적극적인 활동을 기대합니다.',
    category: 'policy',
    created_at: '2024-10-15T09:15:00Z',
    updated_at: '2024-10-15T09:15:00Z',
    profiles: {
      username: '시민3',
      avatar_url: 'https://via.placeholder.com/40',
    },
  },
  {
    id: 4,
    user_id: 'user-4',
    politician_id: 1,
    score: 5,
    comment: '청렴하고 도덕적인 모습이 인상적입니다.',
    category: 'integrity',
    created_at: '2024-10-14T14:20:00Z',
    updated_at: '2024-10-14T14:20:00Z',
    profiles: {
      username: '시민4',
      avatar_url: null,
    },
  },
  {
    id: 5,
    user_id: 'user-5',
    politician_id: 1,
    score: 4,
    comment: '정책 실행력이 좋습니다.',
    category: 'policy',
    created_at: '2024-10-13T11:45:00Z',
    updated_at: '2024-10-13T11:45:00Z',
    profiles: {
      username: '시민5',
      avatar_url: 'https://via.placeholder.com/40',
    },
  },
];

export const mockRatingsPaginated = {
  data: mockRatings,
  pagination: {
    page: 1,
    limit: 10,
    total: 5,
    totalPages: 1,
  },
};

export const mockEmptyRatings = {
  data: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

/**
 * Generate mock politicians for list testing
 */
export function generateMockPoliticians(count: number): PoliticianDetail[] {
  return Array.from({ length: count }, (_, i) => ({
    ...mockPoliticianDetail,
    id: i + 1,
    name: `정치인${i + 1}`,
    avg_rating: 3 + Math.random() * 2,
    total_ratings: Math.floor(Math.random() * 200),
  }));
}

/**
 * Generate mock ratings for pagination testing
 */
export function generateMockRatings(count: number, politicianId: number): RatingWithProfile[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    user_id: `user-${i + 1}`,
    politician_id: politicianId,
    score: Math.floor(Math.random() * 5) + 1,
    comment: `테스트 평가 ${i + 1}`,
    category: ['overall', 'policy', 'integrity', 'communication'][Math.floor(Math.random() * 4)],
    created_at: new Date(Date.now() - i * 86400000).toISOString(),
    updated_at: new Date(Date.now() - i * 86400000).toISOString(),
    profiles: {
      username: `사용자${i + 1}`,
      avatar_url: i % 2 === 0 ? 'https://via.placeholder.com/40' : null,
    },
  }));
}

/**
 * Mock API response helpers
 */
export const mockApiResponses = {
  politicianSuccess: (politician: PoliticianDetail = mockPoliticianDetail) => ({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(politician),
  }),

  politicianNotFound: () => ({
    status: 404,
    contentType: 'application/json',
    body: JSON.stringify({
      error: 'Not Found',
      message: '정치인을 찾을 수 없습니다.',
    }),
  }),

  ratingsSuccess: (ratings = mockRatingsPaginated) => ({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(ratings),
  }),

  ratingsEmpty: () => ({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(mockEmptyRatings),
  }),

  serverError: () => ({
    status: 500,
    contentType: 'application/json',
    body: JSON.stringify({
      error: 'Internal Server Error',
      message: '서버 오류가 발생했습니다.',
    }),
  }),
};
