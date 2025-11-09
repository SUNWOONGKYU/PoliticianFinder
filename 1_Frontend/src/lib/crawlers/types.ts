// Task: P4BA1 - 선관위 크롤링 스크립트

/**
 * 선관위 크롤링 데이터 타입 정의
 */

/**
 * 정치인 기본 정보
 */
export interface PoliticianCrawlData {
  /** 이름 */
  name: string;
  /** 정당 */
  party: string;
  /** 지역구 */
  district: string;
  /** 연락처 */
  contact: {
    phone?: string;
    email?: string;
    office?: string;
  };
  /** 약력 */
  career: CareerItem[];
  /** 크롤링 메타데이터 */
  metadata: CrawlMetadata;
}

/**
 * 약력 항목
 */
export interface CareerItem {
  /** 기간 (예: "2020-2024") */
  period: string;
  /** 직책/내용 */
  description: string;
}

/**
 * 크롤링 메타데이터
 */
export interface CrawlMetadata {
  /** 크롤링 일시 */
  crawledAt: Date;
  /** 출처 URL */
  sourceUrl: string;
  /** 데이터 신뢰도 (0-1) */
  confidence: number;
}

/**
 * 크롤링 설정 옵션
 */
export interface CrawlerOptions {
  /** 타임아웃 (밀리초) */
  timeout?: number;
  /** 재시도 횟수 */
  maxRetries?: number;
  /** 재시도 간격 (밀리초) */
  retryDelay?: number;
  /** 헤드리스 모드 */
  headless?: boolean;
  /** User Agent */
  userAgent?: string;
  /** 페이지 대기 시간 (밀리초) */
  waitTime?: number;
}

/**
 * 크롤링 결과
 */
export interface CrawlResult {
  /** 성공 여부 */
  success: boolean;
  /** 수집된 데이터 */
  data: PoliticianCrawlData[];
  /** 에러 정보 */
  error?: CrawlError;
  /** 크롤링 통계 */
  stats: CrawlStats;
}

/**
 * 크롤링 에러 정보
 */
export interface CrawlError {
  /** 에러 코드 */
  code: CrawlErrorCode;
  /** 에러 메시지 */
  message: string;
  /** 스택 트레이스 */
  stack?: string;
  /** 재시도 가능 여부 */
  retryable: boolean;
}

/**
 * 크롤링 에러 코드
 */
export enum CrawlErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  PARSING_ERROR = 'PARSING_ERROR',
  SELECTOR_NOT_FOUND = 'SELECTOR_NOT_FOUND',
  INVALID_DATA = 'INVALID_DATA',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN',
}

/**
 * 크롤링 통계
 */
export interface CrawlStats {
  /** 시작 시간 */
  startTime: Date;
  /** 종료 시간 */
  endTime: Date;
  /** 소요 시간 (밀리초) */
  duration: number;
  /** 수집된 항목 수 */
  itemsCollected: number;
  /** 실패한 항목 수 */
  itemsFailed: number;
  /** 재시도 횟수 */
  retryCount: number;
}

/**
 * 선관위 사이트 선택자
 */
export interface NECSelectors {
  /** 정치인 목록 컨테이너 */
  listContainer: string;
  /** 정치인 항목 */
  politicianItem: string;
  /** 이름 */
  name: string;
  /** 정당 */
  party: string;
  /** 지역구 */
  district: string;
  /** 연락처 */
  contact: {
    phone: string;
    email: string;
    office: string;
  };
  /** 약력 */
  career: string;
  /** 상세 페이지 링크 */
  detailLink?: string;
}

/**
 * 크롤링 진행 상태
 */
export interface CrawlProgress {
  /** 현재 단계 */
  stage: CrawlStage;
  /** 진행률 (0-100) */
  progress: number;
  /** 현재 처리 중인 항목 */
  currentItem?: string;
  /** 메시지 */
  message: string;
}

/**
 * 크롤링 단계
 */
export enum CrawlStage {
  INITIALIZING = 'INITIALIZING',
  NAVIGATING = 'NAVIGATING',
  LOADING = 'LOADING',
  PARSING = 'PARSING',
  COLLECTING = 'COLLECTING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}
