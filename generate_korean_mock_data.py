#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json

# 30명의 가명 한글 정치인
korean_names = [
    '이준호', '한민정', '오수진', '이재민', '심상정', '박영순', '김혜정', '조동현', '윤주미', '정광호',
    '이민숙', '박준영', '허민진', '강석호', '유영미', '이성국', '박지수', '김동욱', '서정우', '이하나',
    '조무성', '김현진', '박승준', '이선영', '정다운', '이현민', '김미소', '박범수', '유정현', '이동한'
]

# 8가지 직종 (category_type)
category_types = ['특별시장', '광역시장', '도지사', '시장', '구청장', '군수', '광역의원', '기초의원']

# 5가지 신분 (political_status)
political_statuses = ['출마자', '예비후보자', '후보자', '당선자', '현직']

# 한글 지역
regions = [
    '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
    '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
]

# 한글 정당
parties = ['국민의힘', '더불어민주당', '정의당', '개혁신당', '조국혁신당']

# 직책 조합 (지역 + 직종)
positions = [
    '서울특별시장', '부산광역시장', '대구광역시장', '인천광역시장', '광주광역시장',
    '대전광역시장', '울산광역시장', '세종시장',
    '경기도지사', '강원도지사', '충청북도지사', '충청남도지사', '전라북도지사', '전라남도지사', '경상북도지사', '경상남도지사', '제주도지사',
    '서울시의원', '부산시의원', '대구시의원', '인천시의원', '광주시의원', '대전시의원', '울산시의원',
    '서울시의원', '부산시의원', '대구시의원', '인천시의원', '광주시의원', '대전시의원', '울산시의원'
]

# Mock 데이터 생성
politicians = []
for i in range(30):
    politician = {
        'id': i + 1,
        'name': korean_names[i],
        'party': parties[i % len(parties)],
        'region': regions[i % len(regions)],
        'position': positions[i % len(positions)],
        'category_type': category_types[i % len(category_types)],
        'political_status': political_statuses[i % len(political_statuses)],
        'status': '활동중',
        'claude_score': round(3.5 + (i % 10) * 0.1, 1),
        'gpt_score': round(3.4 + (i % 10) * 0.1, 1),
        'gemini_score': round(3.6 + (i % 10) * 0.1, 1),
        'grok_score': round(3.3 + (i % 10) * 0.1, 1),
        'perplexity_score': round(3.5 + (i % 10) * 0.1, 1),
        'composite_score': round(3.46 + (i % 10) * 0.1, 2),
        'member_rating': round(3.2 + (i % 10) * 0.08, 2),
        'member_rating_count': 2 + (i % 3),
    }
    politicians.append(politician)

# 파일 쓰기
output = """/**
 * Mock Data Adapter - Using local mock data for development
 * This adapter bridges frontend UI with mock data from the seed database
 * Expanded with 30 politicians for complete UI display
 * Updated with Korean names and data (v7.0)
 */

import type { PoliticianRanking, HotPost, PoliticianPost } from './home';

// Mock data based on seed data - 30 Politicians (Korean)
export const MOCK_POLITICIANS: PoliticianRanking[] = [
"""

for politician in politicians:
    output += f"""  {{
    id: {politician['id']},
    name: '{politician['name']}',
    party: '{politician['party']}',
    region: '{politician['region']}',
    position: '{politician['position']}',
    category_type: '{politician['category_type']}',
    political_status: '{politician['political_status']}',
    status: '{politician['status']}',
    claude_score: {politician['claude_score']},
    gpt_score: {politician['gpt_score']},
    gemini_score: {politician['gemini_score']},
    grok_score: {politician['grok_score']},
    perplexity_score: {politician['perplexity_score']},
    composite_score: {politician['composite_score']},
    member_rating: {politician['member_rating']},
    member_rating_count: {politician['member_rating_count']},
  }},
"""

output += """];

// Mock Hot Posts - 15 posts
export const MOCK_HOT_POSTS: HotPost[] = [
  {
    id: 1,
    title: '2024년 정치인 평가: 신뢰도 높은 리더십',
    content: '전문가 평가에 따르면 신뢰도 높은 리더십이 중요합니다. 민간 여론조사에서도 높은 지지율을 보이고 있습니다.',
    author: '정치 전문가',
    created_at: '2024-10-15',
    views: 1250,
    likes: 234,
    comments: 45,
    shares: 67,
    category: '정치 분석',
    image_url: 'https://via.placeholder.com/300x200',
  },
  {
    id: 2,
    title: '새로운 정책 발표: 청년 지원 확대',
    content: '정부가 청년층을 위한 새로운 지원 정책을 발표했습니다. 이번 정책은 취업과 창업을 동시에 지원합니다.',
    author: '정책 뉴스',
    created_at: '2024-10-14',
    views: 980,
    likes: 187,
    comments: 38,
    shares: 52,
    category: '정책',
    image_url: 'https://via.placeholder.com/300x200',
  },
  {
    id: 3,
    title: '국회 특별위원회 구성 현황',
    content: '국회에서 새로운 특별위원회가 구성되었습니다. 국방, 경제, 교육 분야에서 중점 추진될 예정입니다.',
    author: '정치부 기자',
    created_at: '2024-10-13',
    views: 850,
    likes: 156,
    comments: 32,
    shares: 44,
    category: '정치',
    image_url: 'https://via.placeholder.com/300x200',
  },
  {
    id: 4,
    title: '지역 발전과 정치인의 역할',
    content: '지역 사회 발전에 있어 정치인의 역할이 얼마나 중요한지에 대해 살펴봅니다.',
    author: '지역 분석가',
    created_at: '2024-10-12',
    views: 720,
    likes: 134,
    comments: 28,
    shares: 38,
    category: '지역 정치',
    image_url: 'https://via.placeholder.com/300x200',
  },
  {
    id: 5,
    title: '선거 제도 개혁 논의',
    content: '더욱 공정한 선거 제도를 위한 개혁안이 논의 중입니다. 투명성과 효율성을 동시에 추구합니다.',
    author: '선거 제도 전문가',
    created_at: '2024-10-11',
    views: 645,
    likes: 121,
    comments: 24,
    shares: 35,
    category: '제도 개혁',
    image_url: 'https://via.placeholder.com/300x200',
  },
  {
    id: 6,
    title: '여야 교육 정책 비교',
    content: '여당과 야당의 교육 정책을 비교 분석합니다. 각 당의 차별화된 정책 방향을 알아봅니다.',
    author: '교육 정책 분석가',
    created_at: '2024-10-10',
    views: 580,
    likes: 109,
    comments: 20,
    shares: 31,
    category: '정책 비교',
    image_url: 'https://via.placeholder.com/300x200',
  },
  {
    id: 7,
    title: '차기 지도자상 여론조사 결과',
    content: '최근 여론조사에서 차기 지도자가 갖춰야 할 덕목에 대해 국민 의견을 수렴했습니다.',
    author: '여론조사 기관',
    created_at: '2024-10-09',
    views: 520,
    likes: 98,
    comments: 18,
    shares: 28,
    category: '여론조사',
    image_url: 'https://via.placeholder.com/300x200',
  },
  {
    id: 8,
    title: '국제 관계와 한국 외교',
    content: '국제 정세 변화 속에서 한국의 외교 정책이 어떻게 전개되는지 살펴봅니다.',
    author: '외교 전문가',
    created_at: '2024-10-08',
    views: 465,
    likes: 87,
    comments: 16,
    shares: 25,
    category: '외교',
    image_url: 'https://via.placeholder.com/300x200',
  },
  {
    id: 9,
    title: '정치인 신뢰도 평가 지표',
    content: '정치인의 신뢰도를 평가하는 다양한 지표들을 분석합니다. AI 평가 시스템의 역할도 살펴봅니다.',
    author: '신뢰도 분석가',
    created_at: '2024-10-07',
    views: 410,
    likes: 76,
    comments: 14,
    shares: 22,
    category: '평가',
    image_url: 'https://via.placeholder.com/300x200',
  },
  {
    id: 10,
    title: '지속가능 발전과 정책',
    content: '환경과 경제의 균형을 맞추는 지속가능 발전 정책에 대해 논의합니다.',
    author: '지속가능 발전 전문가',
    created_at: '2024-10-06',
    views: 360,
    likes: 65,
    comments: 12,
    shares: 19,
    category: '환경',
    image_url: 'https://via.placeholder.com/300x200',
  },
  {
    id: 11,
    title: '청년세대와 정치 참여',
    content: '청년세대의 정치 참여도 증가 추세를 보이고 있습니다. 그들의 관심사와 요구사항을 알아봅니다.',
    author: '사회학자',
    created_at: '2024-10-05',
    views: 315,
    likes: 54,
    comments: 10,
    shares: 16,
    category: '세대',
    image_url: 'https://via.placeholder.com/300x200',
  },
  {
    id: 12,
    title: '정치 커뮤니케이션의 미래',
    content: '디지털 시대의 정치 커뮤니케이션이 어떻게 변화하고 있는지 살펴봅니다.',
    author: '커뮤니케이션 전문가',
    created_at: '2024-10-04',
    views: 270,
    likes: 43,
    comments: 8,
    shares: 13,
    category: '미디어',
    image_url: 'https://via.placeholder.com/300x200',
  },
  {
    id: 13,
    title: '복지 정책 효과 분석',
    content: '최근 시행된 복지 정책들의 실제 효과를 분석합니다. 시민 만족도도 함께 조사했습니다.',
    author: '사회복지 전문가',
    created_at: '2024-10-03',
    views: 225,
    likes: 32,
    comments: 6,
    shares: 10,
    category: '복지',
    image_url: 'https://via.placeholder.com/300x200',
  },
  {
    id: 14,
    title: '도시 재생 사업 현황',
    content: '전국의 도시 재생 사업이 순조롭게 진행 중입니다. 주요 사업 현황을 소개합니다.',
    author: '도시 계획가',
    created_at: '2024-10-02',
    views: 180,
    likes: 21,
    comments: 4,
    shares: 7,
    category: '도시',
    image_url: 'https://via.placeholder.com/300x200',
  },
  {
    id: 15,
    title: '과학 기술 정책 방향',
    content: '미래 먹거리 산업 발전을 위한 과학 기술 정책의 방향을 제시합니다.',
    author: '과학 정책가',
    created_at: '2024-10-01',
    views: 135,
    likes: 10,
    comments: 2,
    shares: 4,
    category: '과학',
    image_url: 'https://via.placeholder.com/300x200',
  },
];

// Mock Politician Posts - 9 posts
export const MOCK_POLITICIAN_POSTS: PoliticianPost[] = [
  {
    id: 1,
    title: '주민 소통 간담회 개최',
    content: '지난주 주민 소통 간담회를 개최하여 지역 주민들의 의견을 청취했습니다. 주로 교육과 교통에 대한 의견이 많았습니다.',
    author: '정치인',
    created_at: '2024-10-15',
    views: 450,
    likes: 89,
    comments: 15,
    shares: 23,
  },
  {
    id: 2,
    title: '지역 발전 기금 조성',
    content: '지역 발전을 위한 기금을 조성하여 사회복지시설 개선에 사용할 예정입니다.',
    author: '정치인',
    created_at: '2024-10-14',
    views: 380,
    likes: 72,
    comments: 12,
    shares: 18,
  },
  {
    id: 3,
    title: '교육 시설 확충 사업',
    content: '지역 내 학교 시설을 현대화하고 도서관을 확충하는 사업을 추진 중입니다.',
    author: '정치인',
    created_at: '2024-10-13',
    views: 320,
    likes: 58,
    comments: 10,
    shares: 15,
  },
  {
    id: 4,
    title: '환경 보호 캠페인',
    content: '지역의 환경 보호를 위한 캠페인을 전개하고 있습니다. 모든 주민의 참여를 부탁드립니다.',
    author: '정치인',
    created_at: '2024-10-12',
    views: 280,
    likes: 45,
    comments: 8,
    shares: 12,
  },
  {
    id: 5,
    title: '일자리 창출 계획',
    content: '지역 내 중소기업 지원을 통해 일자리 창출을 적극 추진하고 있습니다.',
    author: '정치인',
    created_at: '2024-10-11',
    views: 240,
    likes: 34,
    comments: 6,
    shares: 9,
  },
  {
    id: 6,
    title: '교통 인프라 개선',
    content: '지역의 교통 혼잡을 해소하기 위해 새로운 버스 노선을 개설합니다.',
    author: '정치인',
    created_at: '2024-10-10',
    views: 200,
    likes: 23,
    comments: 4,
    shares: 6,
  },
  {
    id: 7,
    title: '주민 안전 강화',
    content: '지역의 주민 안전을 위해 보안 시설을 확충하고 순찰을 강화합니다.',
    author: '정치인',
    created_at: '2024-10-09',
    views: 160,
    likes: 12,
    comments: 2,
    shares: 3,
  },
  {
    id: 8,
    title: '문화 사업 지원',
    content: '지역 문화 발전을 위해 문화 센터 건립과 문화 행사를 지원합니다.',
    author: '정치인',
    created_at: '2024-10-08',
    views: 120,
    likes: 8,
    comments: 1,
    shares: 2,
  },
  {
    id: 9,
    title: '보건 의료 서비스 개선',
    content: '지역 보건 의료 서비스를 확대하여 주민 건강 관리에 적극 나서겠습니다.',
    author: '정치인',
    created_at: '2024-10-07',
    views: 80,
    likes: 4,
    comments: 0,
    shares: 1,
  },
];

// Mock API Adapter Functions
export const mockAdapterApi = {
  async getHomeData() {
    return {
      aiRanking: MOCK_POLITICIANS.slice(0, 10),
      hotPosts: MOCK_HOT_POSTS,
      politicianPosts: MOCK_POLITICIAN_POSTS.slice(0, 3),
    };
  },

  async getPoliticians() {
    return MOCK_POLITICIANS;
  },

  async getPoliticianById(id: number) {
    const politician = MOCK_POLITICIANS.find((p) => p.id === id);
    if (politician) {
      return {
        id: politician.id,
        name: politician.name,
        party: politician.party,
        region: politician.region,
        position: politician.position,
        category_type: politician.category_type,
        political_status: politician.political_status,
        status: politician.status,
        claude_score: politician.claude_score,
        gpt_score: politician.gpt_score,
        gemini_score: politician.gemini_score,
        grok_score: politician.grok_score,
        perplexity_score: politician.perplexity_score,
        composite_score: politician.composite_score,
        member_rating: politician.member_rating,
        member_rating_count: politician.member_rating_count,
      };
    }
    return null;
  },

  async getHotPosts() {
    return MOCK_HOT_POSTS;
  },

  async getPostById(id: number) {
    // First check in hot posts
    const hotPost = MOCK_HOT_POSTS.find((p) => p.id === id);
    if (hotPost) {
      return hotPost;
    }
    // Then check in politician posts
    const politicianPost = MOCK_POLITICIAN_POSTS.find((p) => p.id === id);
    return politicianPost || null;
  },

  async getCommunityPosts() {
    return [...MOCK_HOT_POSTS, ...MOCK_POLITICIAN_POSTS];
  },

  async getPoliticianPosts() {
    return MOCK_POLITICIAN_POSTS;
  },
};

// Public functions for API compatibility
export async function getHomeData() {
  return mockAdapterApi.getHomeData();
}

export async function getPoliticians() {
  return mockAdapterApi.getPoliticians();
}

export async function getPoliticianById(id: number) {
  return mockAdapterApi.getPoliticianById(id);
}

export async function getHotPosts() {
  return mockAdapterApi.getHotPosts();
}

export async function getPostById(id: number) {
  return mockAdapterApi.getPostById(id);
}

export async function getCommunityPosts() {
  return mockAdapterApi.getCommunityPosts();
}

export async function getPoliticianPosts() {
  return mockAdapterApi.getPoliticianPosts();
}
"""

# 파일 저장 (UTF-8 인코딩)
with open("C:/PoliticianFinder/frontend/src/lib/api/mock-adapter.ts", "w", encoding="utf-8") as f:
    f.write(output)

print("[OK] mock-adapter.ts file generated successfully!")
print(f"Total {len(politicians)} politicians data included")
print(f"File size: {len(output)} bytes")
