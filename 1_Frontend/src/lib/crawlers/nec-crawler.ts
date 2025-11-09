// Task: P4BA1 - 선관위 크롤링 스크립트

import { chromium, Browser, Page } from 'playwright';
import {
  PoliticianCrawlData,
  CrawlerOptions,
  CrawlResult,
  CrawlStats,
  CrawlStage,
  CrawlErrorCode,
  NECSelectors,
} from './types';
import {
  DEFAULT_CRAWLER_OPTIONS,
  retry,
  sleep,
  cleanText,
  formatPhoneNumber,
  isValidEmail,
  parseCareer,
  createCrawlError,
  withTimeout,
  validatePoliticianData,
  safeText,
  log,
  logError,
  randomDelay,
} from './utils';

/**
 * 선관위 사이트 기본 URL
 */
const NEC_BASE_URL = 'https://www.nec.go.kr';

/**
 * 선관위 정치인 정보 페이지 URL
 * 실제 URL은 사이트 구조 분석 후 업데이트 필요
 */
const NEC_POLITICIAN_URL = `${NEC_BASE_URL}/portal/diminfo/list.do`;

/**
 * 선관위 사이트 선택자
 * 실제 사이트 구조 분석 후 업데이트 필요
 */
const NEC_SELECTORS: NECSelectors = {
  listContainer: '.list-wrap, .politician-list, table.board-list',
  politicianItem: 'tr.item, .politician-item, li.politician',
  name: '.name, td.name, .politician-name',
  party: '.party, td.party, .politician-party',
  district: '.district, td.district, .politician-district',
  contact: {
    phone: '.phone, td.phone, .contact-phone',
    email: '.email, td.email, .contact-email',
    office: '.office, td.office, .contact-office',
  },
  career: '.career, td.career, .politician-career',
  detailLink: 'a.detail, a.more, .detail-link',
};

/**
 * 선관위 크롤러 클래스
 */
export class NECCrawler {
  private browser: Browser | null = null;
  private options: Required<CrawlerOptions>;
  private stats: CrawlStats;

  constructor(options: CrawlerOptions = {}) {
    this.options = { ...DEFAULT_CRAWLER_OPTIONS, ...options };
    this.stats = this.initializeStats();
  }

  /**
   * 통계 초기화
   */
  private initializeStats(): CrawlStats {
    return {
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      itemsCollected: 0,
      itemsFailed: 0,
      retryCount: 0,
    };
  }

  /**
   * 브라우저 초기화
   */
  private async initBrowser(): Promise<void> {
    log('Initializing browser...');

    this.browser = await chromium.launch({
      headless: this.options.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
      ],
    });
  }

  /**
   * 브라우저 종료
   */
  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      log('Closing browser...');
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * 새 페이지 생성
   */
  private async createPage(): Promise<Page> {
    if (!this.browser) {
      await this.initBrowser();
    }

    const page = await this.browser!.newPage({
      userAgent: this.options.userAgent,
      viewport: { width: 1920, height: 1080 },
    });

    // 자동화 감지 회피
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });

    return page;
  }

  /**
   * 정치인 목록 페이지로 이동
   */
  private async navigateToListPage(page: Page): Promise<void> {
    log(`Navigating to ${NEC_POLITICIAN_URL}...`);

    await retry(
      async () => {
        await page.goto(NEC_POLITICIAN_URL, {
          waitUntil: 'networkidle',
          timeout: this.options.timeout,
        });

        // 페이지 로딩 대기
        await sleep(this.options.waitTime);
      },
      {
        maxRetries: this.options.maxRetries,
        retryDelay: this.options.retryDelay,
        onRetry: (error, attempt) => {
          this.stats.retryCount++;
          log(`Retry ${attempt} after navigation error:`, error.message);
        },
      }
    );
  }

  /**
   * 정치인 목록 추출
   */
  private async extractPoliticianList(page: Page): Promise<PoliticianCrawlData[]> {
    log('Extracting politician list...');

    const politicians: PoliticianCrawlData[] = [];

    try {
      // 목록 컨테이너 대기
      const listContainer = await page.waitForSelector(NEC_SELECTORS.listContainer, {
        timeout: this.options.timeout,
      });

      if (!listContainer) {
        throw new Error('List container not found');
      }

      // 정치인 항목 추출
      const items = await page.$$(NEC_SELECTORS.politicianItem);
      log(`Found ${items.length} politician items`);

      for (const [index, item] of items.entries()) {
        try {
          const politician = await this.extractPoliticianData(page, item);

          if (politician && validatePoliticianData(politician)) {
            politicians.push(politician);
            this.stats.itemsCollected++;
            log(`Extracted politician ${index + 1}/${items.length}: ${politician.name}`);
          } else {
            this.stats.itemsFailed++;
            logError(`Invalid data for politician ${index + 1}`);
          }

          // 랜덤 지연 (봇 감지 회피)
          await sleep(randomDelay(500, 1500));
        } catch (error) {
          this.stats.itemsFailed++;
          logError(`Failed to extract politician ${index + 1}:`, error as Error);
        }
      }
    } catch (error) {
      logError('Failed to extract politician list:', error as Error);
      throw error;
    }

    return politicians;
  }

  /**
   * 개별 정치인 데이터 추출
   */
  private async extractPoliticianData(
    page: Page,
    element: any
  ): Promise<PoliticianCrawlData | null> {
    try {
      // 기본 정보 추출
      const name = await this.extractText(element, NEC_SELECTORS.name);
      const party = await this.extractText(element, NEC_SELECTORS.party);
      const district = await this.extractText(element, NEC_SELECTORS.district);

      if (!name) {
        return null;
      }

      // 연락처 정보 추출
      const phone = await this.extractText(element, NEC_SELECTORS.contact.phone);
      const email = await this.extractText(element, NEC_SELECTORS.contact.email);
      const office = await this.extractText(element, NEC_SELECTORS.contact.office);

      // 약력 정보 추출
      const careerText = await this.extractText(element, NEC_SELECTORS.career);
      const career = careerText ? parseCareer(careerText) : [];

      // 상세 페이지 링크 (선택적)
      const detailLink = await this.extractDetailLink(element);

      // 상세 페이지가 있으면 추가 정보 크롤링
      if (detailLink && this.options.headless) {
        const detailData = await this.extractDetailPage(page, detailLink);
        if (detailData) {
          // 상세 정보로 업데이트
          Object.assign(career, detailData.career || []);
        }
      }

      const politicianData: PoliticianCrawlData = {
        name: cleanText(name),
        party: cleanText(party),
        district: cleanText(district),
        contact: {
          phone: phone ? formatPhoneNumber(phone) : undefined,
          email: email && isValidEmail(email) ? email : undefined,
          office: office ? cleanText(office) : undefined,
        },
        career,
        metadata: {
          crawledAt: new Date(),
          sourceUrl: detailLink || NEC_POLITICIAN_URL,
          confidence: this.calculateConfidence({
            name,
            party,
            district,
            phone,
            email,
            career,
          }),
        },
      };

      return politicianData;
    } catch (error) {
      logError('Failed to extract politician data:', error as Error);
      return null;
    }
  }

  /**
   * 텍스트 추출 헬퍼
   */
  private async extractText(element: any, selector: string): Promise<string> {
    try {
      const el = await element.$(selector);
      if (!el) return '';

      const text = await el.textContent();
      return safeText(text);
    } catch {
      return '';
    }
  }

  /**
   * 상세 링크 추출
   */
  private async extractDetailLink(element: any): Promise<string | null> {
    try {
      if (!NEC_SELECTORS.detailLink) return null;

      const link = await element.$(NEC_SELECTORS.detailLink);
      if (!link) return null;

      const href = await link.getAttribute('href');
      if (!href) return null;

      // 상대 경로를 절대 경로로 변환
      if (href.startsWith('http')) {
        return href;
      } else if (href.startsWith('/')) {
        return `${NEC_BASE_URL}${href}`;
      } else {
        return `${NEC_BASE_URL}/${href}`;
      }
    } catch {
      return null;
    }
  }

  /**
   * 상세 페이지 크롤링
   */
  private async extractDetailPage(page: Page, url: string): Promise<Partial<PoliticianCrawlData> | null> {
    try {
      log(`Extracting detail page: ${url}`);

      // 새 탭에서 열기
      const detailPage = await this.createPage();

      await detailPage.goto(url, {
        waitUntil: 'networkidle',
        timeout: this.options.timeout,
      });

      await sleep(this.options.waitTime);

      // 상세 정보 추출 (사이트 구조에 따라 커스터마이즈 필요)
      const careerText = await this.extractText(detailPage, '.detail-career, .career-detail');
      const career = careerText ? parseCareer(careerText) : [];

      await detailPage.close();

      return { career };
    } catch (error) {
      logError('Failed to extract detail page:', error as Error);
      return null;
    }
  }

  /**
   * 데이터 신뢰도 계산
   */
  private calculateConfidence(data: any): number {
    let score = 0;
    const weights = {
      name: 0.3,
      party: 0.2,
      district: 0.2,
      phone: 0.1,
      email: 0.1,
      career: 0.1,
    };

    if (data.name && data.name.trim().length > 0) score += weights.name;
    if (data.party && data.party.trim().length > 0) score += weights.party;
    if (data.district && data.district.trim().length > 0) score += weights.district;
    if (data.phone) score += weights.phone;
    if (data.email && isValidEmail(data.email)) score += weights.email;
    if (data.career && data.career.length > 0) score += weights.career;

    return Math.min(score, 1.0);
  }

  /**
   * 크롤링 실행
   */
  public async crawl(): Promise<CrawlResult> {
    this.stats = this.initializeStats();
    this.stats.startTime = new Date();

    let page: Page | null = null;

    try {
      log('Starting NEC crawler...');

      // 브라우저 초기화
      await this.initBrowser();

      // 페이지 생성
      page = await this.createPage();

      // 정치인 목록 페이지로 이동
      await this.navigateToListPage(page);

      // 정치인 목록 추출
      const politicians = await this.extractPoliticianList(page);

      // 통계 업데이트
      this.stats.endTime = new Date();
      this.stats.duration = this.stats.endTime.getTime() - this.stats.startTime.getTime();

      log(`Crawling completed: ${this.stats.itemsCollected} items collected, ${this.stats.itemsFailed} failed`);

      return {
        success: true,
        data: politicians,
        stats: this.stats,
      };
    } catch (error) {
      logError('Crawling failed:', error as Error);

      this.stats.endTime = new Date();
      this.stats.duration = this.stats.endTime.getTime() - this.stats.startTime.getTime();

      return {
        success: false,
        data: [],
        error: createCrawlError(
          CrawlErrorCode.UNKNOWN,
          `Crawling failed: ${(error as Error).message}`,
          error as Error
        ),
        stats: this.stats,
      };
    } finally {
      // 정리
      if (page) {
        await page.close();
      }
      await this.closeBrowser();
    }
  }

  /**
   * 크롤링 결과를 JSON 파일로 저장
   */
  public async crawlAndSave(outputPath: string): Promise<CrawlResult> {
    const result = await this.crawl();

    if (result.success) {
      try {
        const fs = await import('fs/promises');
        const path = await import('path');

        // 디렉토리 생성
        const dir = path.dirname(outputPath);
        await fs.mkdir(dir, { recursive: true });

        // JSON 저장
        await fs.writeFile(
          outputPath,
          JSON.stringify(
            {
              crawledAt: new Date().toISOString(),
              source: 'NEC (중앙선거관리위원회)',
              stats: result.stats,
              politicians: result.data,
            },
            null,
            2
          ),
          'utf-8'
        );

        log(`Results saved to: ${outputPath}`);
      } catch (error) {
        logError('Failed to save results:', error as Error);
      }
    }

    return result;
  }
}

/**
 * 크롤러 인스턴스 생성 헬퍼
 */
export function createNECCrawler(options?: CrawlerOptions): NECCrawler {
  return new NECCrawler(options);
}

/**
 * 빠른 크롤링 실행 (기본 옵션)
 */
export async function crawlNEC(options?: CrawlerOptions): Promise<CrawlResult> {
  const crawler = createNECCrawler(options);
  return crawler.crawl();
}

/**
 * 크롤링 후 JSON 파일로 저장
 */
export async function crawlAndSaveNEC(
  outputPath: string,
  options?: CrawlerOptions
): Promise<CrawlResult> {
  const crawler = createNECCrawler(options);
  return crawler.crawlAndSave(outputPath);
}
