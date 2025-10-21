/**
 * 정렬 옵션 타입 정의
 */

export type SortValue =
  | 'rating_desc'      // 평점 높은 순
  | 'rating_asc'       // 평점 낮은 순
  | 'name_asc'         // 이름 가나다 순
  | 'election_desc'    // 당선 횟수 많은 순
  | 'recent_rating';   // 최신 평가 순

export interface SortOption {
  value: SortValue;
  label: string;
  description?: string;
}

/**
 * 기본 정렬 옵션 목록
 */
export const DEFAULT_SORT_OPTIONS: SortOption[] = [
  {
    value: 'rating_desc',
    label: '평점 높은 순',
    description: '평균 평점이 높은 정치인부터 표시'
  },
  {
    value: 'rating_asc',
    label: '평점 낮은 순',
    description: '평균 평점이 낮은 정치인부터 표시'
  },
  {
    value: 'name_asc',
    label: '이름 가나다 순',
    description: '이름 순서대로 정렬'
  },
  {
    value: 'election_desc',
    label: '당선 횟수 많은 순',
    description: '당선 횟수가 많은 정치인부터 표시'
  },
  {
    value: 'recent_rating',
    label: '최신 평가 순',
    description: '최근 평가를 받은 정치인부터 표시'
  }
];

/**
 * SortDropdown 컴포넌트 Props 인터페이스
 */
export interface SortDropdownProps {
  value: SortValue;
  onChange: (sortBy: SortValue) => void;
  options?: SortOption[];
  className?: string;
  disabled?: boolean;
}
