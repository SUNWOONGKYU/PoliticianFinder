/**
 * Filter Types for PoliticianFinder
 *
 * This file contains TypeScript type definitions for search and filter functionality
 */

/**
 * Search filter parameters
 */
export interface SearchFilterParams {
  // Search fields
  searchName?: string
  searchParty?: string
  searchRegion?: string

  // Filter options
  parties?: string[]
  regions?: string[]
  positions?: string[]
  minElectionCount?: number

  // Sort options
  sortBy?: SortOption
  sortOrder?: 'asc' | 'desc'
}

/**
 * Available sort options
 */
export type SortOption =
  | 'name'           // 이름순
  | 'avg_rating'     // 평점순
  | 'total_ratings'  // 평가 수순
  | 'created_at'     // 등록일순

/**
 * Sort option with label for UI
 */
export interface SortOptionItem {
  value: SortOption
  label: string
}

/**
 * Filter option for dropdowns
 */
export interface FilterOption {
  value: string
  label: string
  count?: number
}

/**
 * Available political parties
 */
export const POLITICAL_PARTIES: FilterOption[] = [
  { value: '더불어민주당', label: '더불어민주당' },
  { value: '국민의힘', label: '국민의힘' },
  { value: '정의당', label: '정의당' },
  { value: '개혁신당', label: '개혁신당' },
  { value: '진보당', label: '진보당' },
  { value: '무소속', label: '무소속' },
]

/**
 * Available regions (major cities and provinces)
 */
export const REGIONS: FilterOption[] = [
  { value: '서울', label: '서울특별시' },
  { value: '부산', label: '부산광역시' },
  { value: '대구', label: '대구광역시' },
  { value: '인천', label: '인천광역시' },
  { value: '광주', label: '광주광역시' },
  { value: '대전', label: '대전광역시' },
  { value: '울산', label: '울산광역시' },
  { value: '세종', label: '세종특별자치시' },
  { value: '경기', label: '경기도' },
  { value: '강원', label: '강원특별자치도' },
  { value: '충북', label: '충청북도' },
  { value: '충남', label: '충청남도' },
  { value: '전북', label: '전북특별자치도' },
  { value: '전남', label: '전라남도' },
  { value: '경북', label: '경상북도' },
  { value: '경남', label: '경상남도' },
  { value: '제주', label: '제주특별자치도' },
]

/**
 * Available positions
 */
export const POSITIONS: FilterOption[] = [
  { value: '국회의원', label: '국회의원' },
  { value: '시도지사', label: '시·도지사' },
  { value: '시장', label: '시장' },
  { value: '군수', label: '군수' },
  { value: '구청장', label: '구청장' },
]

/**
 * Available sort options
 */
export const SORT_OPTIONS: SortOptionItem[] = [
  { value: 'name', label: '이름순' },
  { value: 'avg_rating', label: '평점 높은순' },
  { value: 'total_ratings', label: '평가 많은순' },
  { value: 'created_at', label: '최신순' },
]

/**
 * Election count options
 */
export const ELECTION_COUNTS: FilterOption[] = [
  { value: '1', label: '1선' },
  { value: '2', label: '2선' },
  { value: '3', label: '3선' },
  { value: '4', label: '4선 이상' },
]
