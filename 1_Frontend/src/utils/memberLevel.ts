/**
 * 회원 등급 시스템 유틸리티
 *
 * 두 가지 독립적인 체계:
 * 1. 활동 레벨 (Activity Level, ML1~ML10): 포인트 기반
 * 2. 영향력 그레이드 (Influence Grade, 방랑자~군주): 팔로워 수 + 지역구 순위 기반
 */

// ============================================================================
// 1. 활동 레벨 (Activity Level) - ML1 ~ ML10 (포인트 기반)
// ============================================================================

export interface ActivityLevel {
  level: number;
  name: string;      // ML1, ML2, ... ML10
  minPoints: number;
  maxPoints: number;
}

/**
 * 활동 레벨 기준표 (포인트 → 레벨)
 * | 레벨 | 필요 포인트 |
 * |------|------------|
 * | ML1  | 0-99       |
 * | ML2  | 100-299    |
 * | ML3  | 300-599    |
 * | ML4  | 600-999    |
 * | ML5  | 1,000-1,999|
 * | ML6  | 2,000-3,999|
 * | ML7  | 4,000-7,999|
 * | ML8  | 8,000-15,999|
 * | ML9  | 16,000-31,999|
 * | ML10 | 32,000+    |
 */
export function getActivityLevel(points: number): ActivityLevel {
  if (points < 100) return { level: 1, name: 'ML1', minPoints: 0, maxPoints: 99 };
  if (points < 300) return { level: 2, name: 'ML2', minPoints: 100, maxPoints: 299 };
  if (points < 600) return { level: 3, name: 'ML3', minPoints: 300, maxPoints: 599 };
  if (points < 1000) return { level: 4, name: 'ML4', minPoints: 600, maxPoints: 999 };
  if (points < 2000) return { level: 5, name: 'ML5', minPoints: 1000, maxPoints: 1999 };
  if (points < 4000) return { level: 6, name: 'ML6', minPoints: 2000, maxPoints: 3999 };
  if (points < 8000) return { level: 7, name: 'ML7', minPoints: 4000, maxPoints: 7999 };
  if (points < 16000) return { level: 8, name: 'ML8', minPoints: 8000, maxPoints: 15999 };
  if (points < 32000) return { level: 9, name: 'ML9', minPoints: 16000, maxPoints: 31999 };
  return { level: 10, name: 'ML10', minPoints: 32000, maxPoints: Infinity };
}

/**
 * 활동 레벨 표시 문자열
 * 예: "ML5"
 */
export function formatActivityLevel(points: number): string {
  return getActivityLevel(points).name;
}

// ============================================================================
// 2. 영향력 그레이드 (Influence Grade) - 방랑자 ~ 군주 (팔로워/영향력 기반)
// ============================================================================

export type InfluenceGradeType = 'Wanderer' | 'Knight' | 'Lord' | 'Duke' | 'Monarch';

export interface InfluenceGrade {
  type: InfluenceGradeType;
  title: string;       // 한글명
  titleEn: string;     // 영문명
  emoji: string;
  minFollowers: number;
  percentileRequired: number | null;  // null = 순위 조건 없음
}

/**
 * 영향력 그레이드 정의 (팔로워 + 지역구 순위 → 그레이드)
 *
 * | 그레이드 | 한글명 | 이모지 | 기준                           |
 * |----------|--------|--------|--------------------------------|
 * | Wanderer | 방랑자 | 🚶     | 팔로워 < 10명                   |
 * | Knight   | 기사   | ⚔️     | 팔로워 ≥ 10명                   |
 * | Lord     | 영주   | 🏰     | 지역구 상위 20% + 팔로워 ≥ 50명 |
 * | Duke     | 공작   | 👑     | 지역구 상위 5% + 팔로워 ≥ 200명 |
 * | Monarch  | 군주   | 🌟     | 지역구 1위 + 팔로워 ≥ 500명     |
 */
const INFLUENCE_GRADES: Record<InfluenceGradeType, InfluenceGrade> = {
  Wanderer: {
    type: 'Wanderer',
    title: '방랑자',
    titleEn: 'Wanderer',
    emoji: '🚶',
    minFollowers: 0,
    percentileRequired: null,
  },
  Knight: {
    type: 'Knight',
    title: '기사',
    titleEn: 'Knight',
    emoji: '⚔️',
    minFollowers: 10,
    percentileRequired: null,
  },
  Lord: {
    type: 'Lord',
    title: '영주',
    titleEn: 'Lord',
    emoji: '🏰',
    minFollowers: 50,
    percentileRequired: 20,  // 상위 20%
  },
  Duke: {
    type: 'Duke',
    title: '공작',
    titleEn: 'Duke',
    emoji: '👑',
    minFollowers: 200,
    percentileRequired: 5,   // 상위 5%
  },
  Monarch: {
    type: 'Monarch',
    title: '군주',
    titleEn: 'Monarch',
    emoji: '🌟',
    minFollowers: 500,
    percentileRequired: 0,   // 1위 (상위 0%)
  },
};

/**
 * 영향력 그레이드 계산
 * @param followerCount 팔로워 수
 * @param districtPercentile 지역구 내 상위 퍼센트 (0 = 1위, 100 = 최하위)
 * @param isTopInDistrict 지역구 내 1위 여부
 */
export function getInfluenceGrade(
  followerCount: number,
  districtPercentile: number | null = null,
  isTopInDistrict: boolean = false
): InfluenceGrade {
  // 군주: 지역구 1위 + 팔로워 500명 이상
  if (isTopInDistrict && followerCount >= 500) {
    return INFLUENCE_GRADES.Monarch;
  }

  // 공작: 상위 5% + 팔로워 200명 이상
  if (districtPercentile !== null && districtPercentile <= 5 && followerCount >= 200) {
    return INFLUENCE_GRADES.Duke;
  }

  // 영주: 상위 20% + 팔로워 50명 이상
  if (districtPercentile !== null && districtPercentile <= 20 && followerCount >= 50) {
    return INFLUENCE_GRADES.Lord;
  }

  // 기사: 팔로워 10명 이상
  if (followerCount >= 10) {
    return INFLUENCE_GRADES.Knight;
  }

  // 방랑자: 기본
  return INFLUENCE_GRADES.Wanderer;
}

/**
 * 영향력 그레이드 표시 문자열
 * 예: "🏰 영주" 또는 "⚔️ 기사"
 */
export function formatInfluenceGrade(
  followerCount: number,
  districtPercentile: number | null = null,
  isTopInDistrict: boolean = false
): string {
  const grade = getInfluenceGrade(followerCount, districtPercentile, isTopInDistrict);
  return `${grade.emoji} ${grade.title}`;
}

/**
 * 기본 영향력 그레이드 (데이터 없을 때)
 * 팔로워 데이터가 없으면 "방랑자"로 표시
 */
export function getDefaultInfluenceGrade(): InfluenceGrade {
  return INFLUENCE_GRADES.Wanderer;
}

/**
 * 기본 영향력 그레이드 표시 문자열
 */
export function formatDefaultInfluenceGrade(): string {
  const grade = getDefaultInfluenceGrade();
  return `${grade.emoji} ${grade.title}`;
}

// ============================================================================
// 3. 통합 회원 정보 (레벨 + 그레이드)
// ============================================================================

export interface MemberInfo {
  activityLevel: ActivityLevel;    // 포인트 기반 레벨
  influenceGrade: InfluenceGrade;  // 영향력 기반 그레이드
}

/**
 * 전체 회원 정보 조회
 */
export function getMemberInfo(
  points: number,
  followerCount: number,
  districtPercentile: number | null = null,
  isTopInDistrict: boolean = false
): MemberInfo {
  return {
    activityLevel: getActivityLevel(points),
    influenceGrade: getInfluenceGrade(followerCount, districtPercentile, isTopInDistrict),
  };
}

/**
 * 전체 표시 문자열
 * 예: "ML5 🏰 영주"
 */
export function formatMemberInfo(
  points: number,
  followerCount: number,
  districtPercentile: number | null = null,
  isTopInDistrict: boolean = false
): string {
  const level = formatActivityLevel(points);
  const grade = formatInfluenceGrade(followerCount, districtPercentile, isTopInDistrict);
  return `${level} ${grade}`;
}

// ============================================================================
// 하위 호환성을 위한 별칭 (deprecated, 추후 제거 예정)
// ============================================================================

/** @deprecated Use ActivityLevel instead */
export type ActivityGrade = ActivityLevel;

/** @deprecated Use getActivityLevel instead */
export const getActivityGrade = getActivityLevel;

/** @deprecated Use formatActivityLevel instead */
export const formatActivityGrade = formatActivityLevel;

/** @deprecated Use MemberInfo instead */
export type MemberGradeInfo = MemberInfo;

/** @deprecated Use getMemberInfo instead */
export const getMemberGradeInfo = getMemberInfo;

/** @deprecated Use formatMemberInfo instead */
export const formatMemberGrades = formatMemberInfo;
