// PoliticianFinder Constants

import { LevelInfo } from '@/types';

// 7단계 레벨 시스템
export const LEVEL_SYSTEM: LevelInfo[] = [
  {
    level: 1,
    name: '시민',
    shortName: '시민',
    bgColor: 'bg-gray-200',
    textColor: 'text-gray-500',
    xpRequired: 100,
  },
  {
    level: 2,
    name: '활동자',
    shortName: '활동',
    bgColor: 'bg-gray-300',
    textColor: 'text-gray-500',
    xpRequired: 250,
  },
  {
    level: 3,
    name: '참여자',
    shortName: '참여',
    bgColor: 'bg-brand-primary',
    textColor: 'text-brand-primary',
    xpRequired: 500,
  },
  {
    level: 4,
    name: '기여자',
    shortName: '기여',
    bgColor: 'bg-brand-dark',
    textColor: 'text-brand-dark',
    xpRequired: 1000,
  },
  {
    level: 5,
    name: '전문가',
    shortName: '전문',
    bgColor: 'bg-green-500',
    textColor: 'text-green-600',
    xpRequired: 2000,
  },
  {
    level: 6,
    name: '리더',
    shortName: '리더',
    bgColor: 'bg-amber-500',
    textColor: 'text-amber-600',
    xpRequired: 5000,
  },
  {
    level: 7,
    name: '마스터',
    shortName: '마스터',
    bgColor: 'bg-gradient-to-br from-amber-400 to-amber-600',
    textColor: 'text-amber-600',
    xpRequired: 10000,
  },
];

// 정치인 상태별 스타일
export const STATUS_STYLES = {
  현직: 'bg-green-100 text-green-700',
  후보자: 'bg-brand-light text-brand-dark',
  예비후보자: 'bg-amber-100 text-amber-700',
  출마자: 'bg-gray-100 text-gray-700',
} as const;

// AI 이름 표시
export const AI_NAMES = {
  claude: 'Claude',
  gpt: 'GPT',
  gemini: 'Gemini',
  perplexity: 'Perp',
  grok: 'Grok',
} as const;

// 게시글 카테고리 이름
export const CATEGORY_NAMES = {
  general: '일반',
  politician_post: '정치인 글',
  region: '지역',
  issue: '이슈',
  policy: '정책',
} as const;

// XP 획득 기준
export const XP_REWARDS = {
  RATE_POLITICIAN: 10, // 정치인 평가
  CREATE_POST: 20, // 게시글 작성
  CREATE_COMMENT: 5, // 댓글 작성
  RECEIVE_UPVOTE_POST: 2, // 게시글 추천 받기
  RECEIVE_UPVOTE_COMMENT: 1, // 댓글 추천 받기
  BEST_POST: 50, // 베스트 게시글 선정
} as const;

// 페이지네이션 설정
export const PAGINATION = {
  POSTS_PER_PAGE: 20,
  COMMENTS_PER_PAGE: 50,
  POLITICIANS_PER_PAGE: 30,
  HOT_POSTS_LIMIT: 3,
  TRENDING_TOPICS_LIMIT: 5,
} as const;
