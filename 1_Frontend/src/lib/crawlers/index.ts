// Task: P4BA1 - 선관위 크롤링 스크립트

/**
 * 선관위 크롤러 모듈
 *
 * Usage:
 * ```typescript
 * import { crawlNEC, createNECCrawler } from '@/lib/crawlers';
 *
 * // 빠른 실행
 * const result = await crawlNEC();
 *
 * // 커스텀 옵션
 * const crawler = createNECCrawler({
 *   headless: false,
 *   timeout: 60000,
 *   maxRetries: 5
 * });
 * const result = await crawler.crawl();
 * ```
 */

export {
  NECCrawler,
  createNECCrawler,
  crawlNEC,
  crawlAndSaveNEC,
} from './nec-crawler';

export type {
  PoliticianCrawlData,
  CareerItem,
  CrawlMetadata,
  CrawlerOptions,
  CrawlResult,
  CrawlError,
  CrawlStats,
  NECSelectors,
  CrawlProgress,
} from './types';

export {
  CrawlErrorCode,
  CrawlStage,
} from './types';

export {
  retry,
  sleep,
  cleanText,
  formatPhoneNumber,
  isValidEmail,
  parseCareer,
  createCrawlError,
  withTimeout,
  validatePoliticianData,
} from './utils';
