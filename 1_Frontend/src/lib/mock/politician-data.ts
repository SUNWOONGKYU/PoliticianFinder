// Mock data for politician profile development and testing

import { PoliticianProfile, CareerItem, Pledge } from '@/types/politician'

/**
 * Sample Career Data
 */
export const mockCareer: CareerItem[] = [
  {
    period: '2020 - 현재',
    title: '제21대 국회의원',
    description: '서울 강남구 국회의원으로 활동 중'
  },
  {
    period: '2018 - 2020',
    title: '서울시의회 의원',
    description: '서울시의회 교육위원회 위원장'
  },
  {
    period: '2016 - 2018',
    title: '정당 정책위원회 부위원장',
    description: '주요 정책 수립 및 조정'
  },
  {
    period: '2014 - 2016',
    title: '민간 기업 CEO',
    description: 'IT 스타트업 대표이사'
  },
  {
    period: '2010 - 2014',
    title: '변호사',
    description: '법무법인 소속 변호사'
  }
]

/**
 * Sample Pledge Data
 */
export const mockPledges: Pledge[] = [
  {
    id: 1,
    title: '대중교통 요금 동결',
    description: '임기 동안 지하철 및 버스 요금을 동결하여 서민 교통비 부담을 완화하겠습니다.',
    category: '교통',
    status: 'completed'
  },
  {
    id: 2,
    title: '청년 일자리 1만개 창출',
    description: '청년 일자리 지원 프로그램을 통해 1만개의 양질의 일자리를 창출하겠습니다.',
    category: '일자리',
    status: 'in_progress'
  },
  {
    id: 3,
    title: '초등학교 무상급식 확대',
    description: '관내 모든 초등학교에 무상급식을 전면 확대 시행하겠습니다.',
    category: '교육',
    status: 'completed'
  },
  {
    id: 4,
    title: '도심 공원 5곳 조성',
    description: '주거 밀집 지역에 주민 휴식 공간인 도심 공원 5곳을 새로 조성하겠습니다.',
    category: '환경',
    status: 'in_progress'
  },
  {
    id: 5,
    title: '소상공인 금융 지원 확대',
    description: '코로나19로 어려움을 겪는 소상공인에게 저금리 대출 지원을 확대하겠습니다.',
    category: '경제',
    status: 'in_progress'
  },
  {
    id: 6,
    title: '어린이집 입소 대기시간 단축',
    description: '국공립 어린이집을 증설하여 입소 대기시간을 50% 단축하겠습니다.',
    category: '보육',
    status: 'pending'
  }
]

/**
 * Sample Politician Profile
 */
export const mockPoliticianProfile: PoliticianProfile = {
  id: 1,
  name: '김민주',
  profile_image_url: null,
  party: '더불어민주당',
  position: '국회의원',
  region: '서울 강남구',
  is_verified: true,
  bio: '국민과 소통하며, 실질적인 변화를 만들어가는 정치인입니다. 청년과 중소기업, 교육 분야에 특별한 관심을 가지고 활동하고 있습니다.',
  birth_date: '1975-03-15',
  education: [
    '서울대학교 법과대학 법학과 학사',
    'Harvard University 공공정책대학원 석사',
    '서울대학교 법학전문대학원 박사'
  ],
  career: mockCareer,
  pledges: mockPledges,
  ai_score: 847,
  followers_count: 12847,
  ratings_count: 1543,
  avg_rating: 4.3,
  website_url: 'https://example.com',
  email: 'contact@example.com',
  phone: '02-1234-5678',
  social_media: {
    twitter: 'https://twitter.com/example',
    facebook: 'https://facebook.com/example',
    instagram: 'https://instagram.com/example',
    youtube: 'https://youtube.com/@example'
  }
}

/**
 * Additional mock profiles for different scenarios
 */
export const mockProfiles = {
  // Verified politician with high ratings
  verified: mockPoliticianProfile,

  // Unverified politician
  unverified: {
    ...mockPoliticianProfile,
    id: 2,
    name: '이정희',
    party: '국민의힘',
    is_verified: false,
    ai_score: 672,
    followers_count: 5423,
    ratings_count: 234,
    avg_rating: 3.8
  },

  // New politician with minimal data
  minimal: {
    id: 3,
    name: '박준영',
    profile_image_url: null,
    party: '정의당',
    position: '시의원',
    region: '부산 해운대구',
    is_verified: false,
    bio: null,
    birth_date: null,
    education: [],
    career: [],
    pledges: [],
    ai_score: null,
    followers_count: 52,
    ratings_count: 5,
    avg_rating: 4.0,
    website_url: null
  }
}

/**
 * Get mock profile by ID
 */
export function getMockProfile(id: number): PoliticianProfile | null {
  const profiles = Object.values(mockProfiles)
  return profiles.find(p => p.id === id) || null
}

/**
 * Simulate API delay
 */
export function simulateApiDelay(ms: number = 500): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
