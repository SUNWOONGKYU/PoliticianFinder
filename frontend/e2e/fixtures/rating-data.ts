/**
 * Rating Test Data Fixtures
 *
 * This module provides test data for rating system E2E tests
 */

import { CreateRatingRequest, UpdateRatingRequest } from '@/types/database'

/**
 * Sample politician data for testing
 */
export const TEST_POLITICIAN = {
  id: 1,
  name: '홍길동',
  party: '더불어민주당',
  region: '서울 강남구 갑',
  position: '국회의원',
  avg_rating: 4.2,
  total_ratings: 15,
}

/**
 * Valid rating data for creation
 */
export const VALID_RATING_DATA: CreateRatingRequest = {
  politician_id: 1,
  score: 5,
  comment: '정책이 훌륭하고 지역구민들을 위해 열심히 일하고 계십니다.',
  category: 'overall',
}

/**
 * Multiple rating samples with different scores and categories
 */
export const RATING_SAMPLES = {
  excellent: {
    politician_id: 1,
    score: 5,
    comment: '매우 만족스럽습니다. 공약을 잘 이행하고 있습니다.',
    category: 'policy',
  },
  good: {
    politician_id: 1,
    score: 4,
    comment: '대체로 좋습니다. 소통이 활발합니다.',
    category: 'communication',
  },
  average: {
    politician_id: 1,
    score: 3,
    comment: '보통입니다. 더 노력해주셨으면 좋겠습니다.',
    category: 'overall',
  },
  poor: {
    politician_id: 1,
    score: 2,
    comment: '아쉽습니다. 공약 이행률이 낮습니다.',
    category: 'policy',
  },
  veryPoor: {
    politician_id: 1,
    score: 1,
    comment: '매우 실망스럽습니다.',
    category: 'integrity',
  },
}

/**
 * Rating data without comments
 */
export const RATING_WITHOUT_COMMENT: CreateRatingRequest = {
  politician_id: 1,
  score: 4,
  category: 'overall',
}

/**
 * Rating data with maximum length comment
 */
export const RATING_WITH_LONG_COMMENT: CreateRatingRequest = {
  politician_id: 1,
  score: 5,
  comment: '정말 훌륭한 정치인입니다. '.repeat(50), // Creates a long comment
  category: 'overall',
}

/**
 * Invalid rating data (for validation tests)
 */
export const INVALID_RATING_DATA = {
  tooLowScore: {
    politician_id: 1,
    score: 0, // Invalid: score should be 1-5
    comment: '점수가 범위를 벗어났습니다.',
    category: 'overall',
  },
  tooHighScore: {
    politician_id: 1,
    score: 6, // Invalid: score should be 1-5
    comment: '점수가 범위를 벗어났습니다.',
    category: 'overall',
  },
  missingPoliticianId: {
    score: 5,
    comment: '정치인 ID가 없습니다.',
    category: 'overall',
  },
  invalidCategory: {
    politician_id: 1,
    score: 5,
    comment: '유효하지 않은 카테고리입니다.',
    category: 'invalid_category',
  },
}

/**
 * Update rating data
 */
export const UPDATE_RATING_DATA: UpdateRatingRequest = {
  score: 4,
  comment: '수정된 평가입니다. 재평가 후 점수를 조정했습니다.',
  category: 'policy',
}

/**
 * Category labels in Korean
 */
export const CATEGORY_LABELS = {
  overall: '종합',
  policy: '정책',
  integrity: '청렴도',
  communication: '소통',
}

/**
 * Sort options for rating list
 */
export const SORT_OPTIONS = {
  latest: '최신순',
  oldest: '오래된순',
  highest: '평점 높은순',
  lowest: '평점 낮은순',
}

/**
 * Expected rating distribution for a politician with multiple ratings
 */
export const EXPECTED_RATING_DISTRIBUTION = {
  5: 5,
  4: 3,
  3: 2,
  2: 3,
  1: 2,
}

/**
 * Expected average rating calculation
 */
export function calculateExpectedAverage(distribution: { [key: number]: number }): number {
  let totalScore = 0
  let totalCount = 0

  for (const [score, count] of Object.entries(distribution)) {
    totalScore += parseInt(score) * count
    totalCount += count
  }

  return totalCount > 0 ? totalScore / totalCount : 0
}

/**
 * Generate multiple rating data for bulk testing
 */
export function generateRatings(count: number, politicianId: number = 1): CreateRatingRequest[] {
  const categories = ['overall', 'policy', 'integrity', 'communication']
  const ratings: CreateRatingRequest[] = []

  for (let i = 0; i < count; i++) {
    const score = Math.floor(Math.random() * 5) + 1 // Random score 1-5
    const categoryIndex = Math.floor(Math.random() * categories.length)

    ratings.push({
      politician_id: politicianId,
      score,
      comment: `테스트 평가 ${i + 1}번입니다. 점수는 ${score}점입니다.`,
      category: categories[categoryIndex],
    })
  }

  return ratings
}

/**
 * Mock rating response data (as it would come from API)
 */
export const MOCK_RATING_RESPONSE = {
  id: 1,
  user_id: 'test-user-uuid',
  politician_id: 1,
  score: 5,
  comment: '정책이 훌륭하고 지역구민들을 위해 열심히 일하고 계십니다.',
  category: 'overall',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  profiles: {
    username: 'testuser',
    avatar_url: null,
  },
}

/**
 * Mock ratings list response
 */
export const MOCK_RATINGS_LIST_RESPONSE = {
  data: [
    {
      ...MOCK_RATING_RESPONSE,
      id: 1,
      score: 5,
      comment: '첫 번째 평가입니다.',
    },
    {
      ...MOCK_RATING_RESPONSE,
      id: 2,
      score: 4,
      comment: '두 번째 평가입니다.',
    },
    {
      ...MOCK_RATING_RESPONSE,
      id: 3,
      score: 3,
      comment: '세 번째 평가입니다.',
    },
  ],
  pagination: {
    page: 1,
    limit: 10,
    total: 15,
    totalPages: 2,
  },
}

/**
 * Mock rating statistics response
 */
export const MOCK_RATING_STATS_RESPONSE = {
  politician_id: 1,
  total_count: 15,
  average_score: 4.2,
  score_distribution: EXPECTED_RATING_DISTRIBUTION,
  category_breakdown: {
    overall: { count: 5, average: 4.0 },
    policy: { count: 4, average: 4.5 },
    integrity: { count: 3, average: 4.0 },
    communication: { count: 3, average: 4.3 },
  },
}
