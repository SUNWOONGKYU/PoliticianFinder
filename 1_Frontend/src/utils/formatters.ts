/**
 * 공통 포매터 유틸리티 함수들
 */

/**
 * 날짜를 'YYYY.MM.DD HH:mm' 형식으로 포맷
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}.${month}.${day} ${hours}:${minutes}`;
};

/**
 * 숫자를 한국 로케일 형식으로 포맷 (1,234)
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString('ko-KR');
};

/**
 * 시간을 상대적 표현으로 변환 (5분 전, 1시간 전, 2일 전 등)
 */
export const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffYear > 0) {
    return `${diffYear}년 전`;
  } else if (diffMonth > 0) {
    return `${diffMonth}개월 전`;
  } else if (diffDay > 0) {
    return `${diffDay}일 전`;
  } else if (diffHour > 0) {
    return `${diffHour}시간 전`;
  } else if (diffMin > 0) {
    return `${diffMin}분 전`;
  } else {
    return '방금 전';
  }
};

/**
 * 점수에 따른 등급 계산
 */
export const calculateGrade = (score: number): string => {
  if (score >= 900) return 'E'; // Emerald
  if (score >= 800) return 'P'; // Platinum
  if (score >= 700) return 'D'; // Diamond
  if (score >= 600) return 'M'; // Mugunghwa
  return 'G'; // Gold
};

/**
 * 등급에 따른 이모지 반환
 */
export const getGradeEmoji = (grade: string): string => {
  const emojiMap: Record<string, string> = {
    'E': '💚',
    'P': '🥇',
    'D': '💎',
    'M': '🌺',
    'G': '🥇'
  };
  return emojiMap[grade] || '';
};

/**
 * 등급에 따른 전체 텍스트 반환
 */
export const getGradeText = (grade: string): string => {
  const textMap: Record<string, string> = {
    'E': '💚 Emerald',
    'P': '🥇 Platinum',
    'D': '💎 Diamond',
    'M': '🌺 Mugunghwa',
    'G': '🥇 Gold'
  };
  return textMap[grade] || '';
};
