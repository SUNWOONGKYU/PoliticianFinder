import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'https://politician-finder-a2fujo8kl-finder-world.vercel.app';

// Device configurations
const devices = [
  { name: 'iPhone SE', width: 320, height: 568, isMobile: true },
  { name: 'iPhone 14', width: 390, height: 844, isMobile: true },
  { name: 'iPad Mini', width: 768, height: 1024, isMobile: false },
  { name: 'Desktop', width: 1280, height: 720, isMobile: false }
];

// Test pages
const pages = [
  { name: 'Homepage', path: '/', selectors: ['nav', 'footer', 'main'] },
  { name: 'Politicians List', path: '/politicians', selectors: ['nav', 'footer', '.politician-card, [class*="politician"]'] },
  { name: 'Community', path: '/community', selectors: ['nav', 'footer', 'main'] },
  { name: 'Login', path: '/auth/login', selectors: ['nav', 'footer', 'form, input[type="email"], input[type="password"]'] }
];

interface TestResult {
  device: string;
  page: string;
  layoutOk: boolean;
  noHorizontalScroll: boolean;
  interactiveElements: boolean;
  noTextClipping: boolean;
  footerVisible: boolean;
  issues: string[];
  screenshot?: string;
}

const results: TestResult[] = [];

// Helper function to check horizontal scroll
async function hasHorizontalScroll(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
}

// Helper function to check if elements are clipped
async function checkTextClipping(page: Page): Promise<{ hasClipping: boolean; clippedElements: string[] }> {
  return await page.evaluate(() => {
    const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button, label');
    const clipped: string[] = [];

    elements.forEach((el) => {
      const elem = el as HTMLElement;
      if (elem.scrollWidth > elem.clientWidth || elem.scrollHeight > elem.clientHeight) {
        const identifier = elem.className || elem.tagName || 'unknown';
        clipped.push(identifier);
      }
    });

    return {
      hasClipping: clipped.length > 0,
      clippedElements: clipped.slice(0, 5) // Return first 5
    };
  });
}

// Helper function to check footer visibility
async function isFooterVisible(page: Page): Promise<boolean> {
  const footer = await page.locator('footer').first();
  if (await footer.count() === 0) return false;

  const isVisible = await footer.isVisible();
  return isVisible;
}

// Helper function to check interactive elements
async function checkInteractiveElements(page: Page): Promise<{ ok: boolean; issues: string[] }> {
  const issues: string[] = [];

  // Check buttons
  const buttons = await page.locator('button, a[role="button"], input[type="submit"]').all();
  for (const button of buttons.slice(0, 10)) { // Check first 10
    const box = await button.boundingBox();
    if (box && (box.width < 44 || box.height < 44)) {
      const text = await button.textContent();
      issues.push(`Button too small: "${text?.substring(0, 20)}" (${box.width}x${box.height})`);
    }
  }

  // Check links
  const links = await page.locator('a').all();
  for (const link of links.slice(0, 10)) { // Check first 10
    const box = await link.boundingBox();
    if (box && (box.width < 44 || box.height < 44)) {
      const text = await link.textContent();
      issues.push(`Link too small: "${text?.substring(0, 20)}" (${box.width}x${box.height})`);
    }
  }

  return {
    ok: issues.length === 0,
    issues
  };
}

// Main test suite
for (const device of devices) {
  for (const pageInfo of pages) {
    test(`${device.name} - ${pageInfo.name}`, async ({ page }) => {
      // Set viewport
      await page.setViewportSize({ width: device.width, height: device.height });

      const result: TestResult = {
        device: device.name,
        page: pageInfo.name,
        layoutOk: false,
        noHorizontalScroll: true,
        interactiveElements: false,
        noTextClipping: true,
        footerVisible: false,
        issues: []
      };

      try {
        // Navigate to page
        const url = `${BASE_URL}${pageInfo.path}`;
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

        // Wait for main content to load
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000); // Allow time for rendering

        // Check if main selectors are present
        let layoutOk = true;
        for (const selector of pageInfo.selectors) {
          const count = await page.locator(selector).count();
          if (count === 0) {
            result.issues.push(`Missing element: ${selector}`);
            layoutOk = false;
          }
        }
        result.layoutOk = layoutOk;

        // Check horizontal scroll
        const hasScroll = await hasHorizontalScroll(page);
        result.noHorizontalScroll = !hasScroll;
        if (hasScroll) {
          result.issues.push('Horizontal scroll detected');
        }

        // Check text clipping
        const clippingCheck = await checkTextClipping(page);
        result.noTextClipping = !clippingCheck.hasClipping;
        if (clippingCheck.hasClipping) {
          result.issues.push(`Text clipping: ${clippingCheck.clippedElements.join(', ')}`);
        }

        // Check interactive elements
        const interactiveCheck = await checkInteractiveElements(page);
        result.interactiveElements = interactiveCheck.ok;
        if (!interactiveCheck.ok) {
          result.issues.push(...interactiveCheck.issues);
        }

        // Check footer visibility
        result.footerVisible = await isFooterVisible(page);
        if (!result.footerVisible) {
          result.issues.push('Footer not visible');
        }

        // Take screenshot
        const screenshotPath = `test-results/${device.name.replace(/\s+/g, '-')}-${pageInfo.name.replace(/\s+/g, '-')}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        result.screenshot = screenshotPath;

        // Store result
        results.push(result);

        // Assertions
        expect(result.layoutOk, `Layout should be OK on ${device.name} - ${pageInfo.name}`).toBe(true);
        expect(result.noHorizontalScroll, `No horizontal scroll on ${device.name} - ${pageInfo.name}`).toBe(true);
        expect(result.interactiveElements, `Interactive elements should be accessible on ${device.name} - ${pageInfo.name}`).toBe(true);
        expect(result.footerVisible, `Footer should be visible on ${device.name} - ${pageInfo.name}`).toBe(true);

      } catch (error) {
        result.issues.push(`Test error: ${error}`);
        results.push(result);
        throw error;
      }
    });
  }
}

// Generate report after all tests
test.afterAll(async () => {
  // Generate markdown report
  let report = '# PoliticianFinder Multi-Device UI/UX Test Report\n\n';
  report += `Test Date: ${new Date().toISOString()}\n\n`;
  report += `Base URL: ${BASE_URL}\n\n`;

  // Summary by device
  report += '## Summary by Device\n\n';
  report += '| Device | Total Tests | Passed | Failed | Issues |\n';
  report += '|--------|-------------|--------|--------|--------|\n';

  for (const device of devices) {
    const deviceResults = results.filter(r => r.device === device.name);
    const passed = deviceResults.filter(r => r.layoutOk && r.noHorizontalScroll && r.interactiveElements && r.footerVisible).length;
    const failed = deviceResults.length - passed;
    const totalIssues = deviceResults.reduce((sum, r) => sum + r.issues.length, 0);

    report += `| ${device.name} (${device.width}px) | ${deviceResults.length} | ${passed} | ${failed} | ${totalIssues} |\n`;
  }

  // Detailed results
  report += '\n## Detailed Results\n\n';

  for (const pageInfo of pages) {
    report += `### ${pageInfo.name}\n\n`;
    report += '| Device | Layout | No H-Scroll | Interactive | Text OK | Footer | Issues |\n';
    report += '|--------|--------|-------------|-------------|---------|--------|--------|\n';

    for (const device of devices) {
      const result = results.find(r => r.device === device.name && r.page === pageInfo.name);
      if (result) {
        const check = (val: boolean) => val ? '✅' : '❌';
        report += `| ${device.name} | ${check(result.layoutOk)} | ${check(result.noHorizontalScroll)} | ${check(result.interactiveElements)} | ${check(result.noTextClipping)} | ${check(result.footerVisible)} | ${result.issues.length} |\n`;
      }
    }
    report += '\n';
  }

  // Issues details
  report += '## Issues by Device and Page\n\n';

  for (const result of results) {
    if (result.issues.length > 0) {
      report += `### ${result.device} - ${result.page}\n\n`;
      result.issues.forEach(issue => {
        report += `- ${issue}\n`;
      });
      report += '\n';
    }
  }

  // Screenshots
  report += '## Screenshots\n\n';
  for (const result of results) {
    if (result.screenshot) {
      report += `### ${result.device} - ${result.page}\n`;
      report += `![Screenshot](${result.screenshot})\n\n`;
    }
  }

  // Save report
  const fs = require('fs');
  fs.writeFileSync('test-results/multi-device-report.md', report);

  console.log('\n' + report);
});
