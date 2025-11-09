// Task ID: P4BA15
// PDF Report Generator using Puppeteer

import 'server-only';
import puppeteer, { Browser, Page } from 'puppeteer';
import { generateReportHTML } from './html-generator';
import {
  PoliticianForReport,
  EvaluationForReport,
  EvaluationHistory,
  PDFGenerationOptions,
} from './types';

/**
 * Default PDF generation options
 */
const DEFAULT_OPTIONS: PDFGenerationOptions = {
  format: 'A4',
  orientation: 'portrait',
  printBackground: true,
  margin: {
    top: '15mm',
    right: '15mm',
    bottom: '20mm',
    left: '15mm',
  },
};

/**
 * Report Generator Class
 * Generates PDF reports from React components using Puppeteer
 */
export class ReportGenerator {
  private browser: Browser | null = null;

  /**
   * Initialize Puppeteer browser
   */
  private async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--disable-web-security',
        ],
      });
    }
    return this.browser;
  }

  /**
   * Close browser
   */
  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Generate PDF from politician and evaluation data
   */
  async generatePDF(
    politician: PoliticianForReport,
    evaluation: EvaluationForReport,
    history: EvaluationHistory[],
    options: PDFGenerationOptions = {}
  ): Promise<Buffer> {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    let page: Page | null = null;

    try {
      // 1. Generate HTML from data
      const fullHtml = generateReportHTML(politician, evaluation, history);

      // 2. Initialize browser
      const browser = await this.initBrowser();
      page = await browser.newPage();

      // 3. Set viewport for consistent rendering
      await page.setViewport({
        width: 1200,
        height: 1600,
        deviceScaleFactor: 2,
      });

      // 4. Set HTML content
      await page.setContent(fullHtml, {
        waitUntil: 'networkidle0',
        timeout: 60000,
      });

      // 5. Wait for fonts to load
      await page.evaluateHandle('document.fonts.ready');

      // 6. Generate PDF
      const pdfBuffer = await page.pdf({
        format: mergedOptions.format,
        printBackground: mergedOptions.printBackground,
        margin: mergedOptions.margin,
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `
          <div style="font-size: 9pt; color: #9ca3af; text-align: center; width: 100%; padding: 0 15mm;">
            <span class="pageNumber"></span> / <span class="totalPages"></span>
          </div>
        `,
        preferCSSPageSize: false,
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error('PDF generation failed:', error);
      throw new Error(
        `Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      // Clean up page
      if (page) {
        await page.close().catch(console.error);
      }
    }
  }

  /**
   * Generate PDF and return as base64 string
   */
  async generatePDFBase64(
    politician: PoliticianForReport,
    evaluation: EvaluationForReport,
    history: EvaluationHistory[],
    options: PDFGenerationOptions = {}
  ): Promise<string> {
    const buffer = await this.generatePDF(politician, evaluation, history, options);
    return buffer.toString('base64');
  }

  /**
   * Validate that evaluation data meets minimum requirements
   */
  validateEvaluationData(evaluation: EvaluationForReport): boolean {
    if (!evaluation.detailed_analysis) {
      return false;
    }

    // Check that all 10 criteria have evidence
    const requiredCriteria = [
      'integrity',
      'expertise',
      'communication',
      'leadership',
      'transparency',
      'responsiveness',
      'innovation',
      'collaboration',
      'constituency_service',
      'policy_impact',
    ];

    for (const criterion of requiredCriteria) {
      const evidenceKey = `${criterion}_evidence`;
      const evidence = (evaluation.detailed_analysis as any)[evidenceKey];

      // Each evidence should be at least 1000 characters (aiming for 3000+)
      if (!evidence || evidence.length < 1000) {
        console.warn(
          `Criterion ${criterion} has insufficient evidence: ${evidence?.length || 0} characters`
        );
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate total character count of evaluation
   */
  calculateTotalCharacters(evaluation: EvaluationForReport): number {
    let totalChars = 0;

    if (evaluation.summary) {
      totalChars += evaluation.summary.length;
    }

    if (evaluation.detailed_analysis) {
      const criteria = [
        'integrity',
        'expertise',
        'communication',
        'leadership',
        'transparency',
        'responsiveness',
        'innovation',
        'collaboration',
        'constituency_service',
        'policy_impact',
      ];

      for (const criterion of criteria) {
        const evidenceKey = `${criterion}_evidence`;
        const evidence = (evaluation.detailed_analysis as any)[evidenceKey];
        if (evidence) {
          totalChars += evidence.length;
        }
      }
    }

    return totalChars;
  }
}

/**
 * Create a singleton instance for reuse
 */
let generatorInstance: ReportGenerator | null = null;

/**
 * Get or create report generator instance
 */
export function getReportGenerator(): ReportGenerator {
  if (!generatorInstance) {
    generatorInstance = new ReportGenerator();
  }
  return generatorInstance;
}

/**
 * Clean up generator instance (call this on server shutdown)
 */
export async function cleanupReportGenerator(): Promise<void> {
  if (generatorInstance) {
    await generatorInstance.closeBrowser();
    generatorInstance = null;
  }
}
