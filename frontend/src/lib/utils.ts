// PoliticianFinder Utility Functions

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LEVEL_SYSTEM } from './constants';
import { LevelInfo } from '@/types';

// Tailwind CSS 클래스 병합 (shadcn/ui 스타일)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 숫자 포맷팅 (12300 → 12.3K)
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// 시간 경과 표시 (2시간 전, 3일 전 등)
export function formatTimeAgo(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return '방금 전';
  } else if (diffMins < 60) {
    return `${diffMins}분 전`;
  } else if (diffHours < 24) {
    return `${diffHours}시간 전`;
  } else if (diffDays < 7) {
    return `${diffDays}일 전`;
  } else {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks}주일 전`;
  }
}

// 날짜 포맷팅 (YYYY-MM-DD)
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

// 날짜 시간 포맷팅 (YYYY-MM-DD HH:MM)
export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

// 레벨 정보 조회
export function getLevelInfo(level: number): LevelInfo {
  return LEVEL_SYSTEM.find((l) => l.level === level) || LEVEL_SYSTEM[0];
}

// 다음 레벨까지 남은 XP 계산
export function getXpToNextLevel(
  currentLevel: number,
  currentXp: number
): number {
  const nextLevel = LEVEL_SYSTEM.find((l) => l.level === currentLevel + 1);
  if (!nextLevel) return 0;

  const currentLevelInfo = getLevelInfo(currentLevel);
  const totalXpForNextLevel = LEVEL_SYSTEM.slice(0, currentLevel)
    .reduce((sum, level) => sum + level.xpRequired, 0) + nextLevel.xpRequired;

  return totalXpForNextLevel - currentXp;
}

// 현재 레벨 내 XP 진행률 계산
export function getXpProgress(currentLevel: number, currentXp: number): number {
  const currentLevelInfo = getLevelInfo(currentLevel);
  const totalXpForCurrentLevel = LEVEL_SYSTEM.slice(0, currentLevel - 1).reduce(
    (sum, level) => sum + level.xpRequired,
    0
  );

  const xpInCurrentLevel = currentXp - totalXpForCurrentLevel;
  const progress = (xpInCurrentLevel / currentLevelInfo.xpRequired) * 100;

  return Math.min(Math.max(progress, 0), 100);
}

// 별점 표시 생성 (1-5점)
export function getStarDisplay(rating: number): string {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    '⭐'.repeat(fullStars) +
    (halfStar ? '⭐' : '') +
    '☆'.repeat(emptyStars)
  );
}

// 텍스트 자르기 (말줄임표)
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

// URL 쿼리 파라미터 파싱
export function parseQueryParams(search: string): Record<string, string> {
  const params = new URLSearchParams(search);
  const result: Record<string, string> = {};

  params.forEach((value, key) => {
    result[key] = value;
  });

  return result;
}

// 숫자를 소수점 첫째 자리까지 포맷팅
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

// 안전한 JSON 파싱
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

// 배열 섞기 (Fisher-Yates shuffle)
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// 디바운스 함수
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// 쓰로틀 함수
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
