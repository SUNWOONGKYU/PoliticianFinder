import { Page } from '@playwright/test';

/**
 * Viewport Helper for Responsive Testing
 * Provides utilities for testing across different screen sizes
 */

export const VIEWPORTS = {
  // Desktop viewports
  desktop: {
    width: 1920,
    height: 1080,
  },
  desktopSmall: {
    width: 1366,
    height: 768,
  },

  // Tablet viewports
  tablet: {
    width: 768,
    height: 1024,
  },
  tabletLandscape: {
    width: 1024,
    height: 768,
  },

  // Mobile viewports
  mobile: {
    width: 375,
    height: 667,
  },
  mobileLarge: {
    width: 414,
    height: 896,
  },
} as const;

export type ViewportName = keyof typeof VIEWPORTS;

/**
 * Set viewport size for a page
 */
export async function setViewport(page: Page, viewportName: ViewportName) {
  await page.setViewportSize(VIEWPORTS[viewportName]);
}

/**
 * Test a callback function across multiple viewports
 */
export async function testAcrossViewports(
  page: Page,
  viewports: ViewportName[],
  callback: (viewportName: ViewportName) => Promise<void>
) {
  for (const viewport of viewports) {
    await setViewport(page, viewport);
    await callback(viewport);
  }
}

/**
 * Check if element is visible in current viewport
 */
export async function isElementInViewport(page: Page, selector: string): Promise<boolean> {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }, selector);
}

/**
 * Scroll element into view
 */
export async function scrollIntoView(page: Page, selector: string) {
  await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, selector);
}

/**
 * Wait for images to load
 */
export async function waitForImages(page: Page) {
  await page.evaluate(() => {
    return Promise.all(
      Array.from(document.images)
        .filter(img => !img.complete)
        .map(img => new Promise(resolve => {
          img.onload = img.onerror = resolve;
        }))
    );
  });
}

/**
 * Check if page is mobile viewport
 */
export function isMobileViewport(viewportName: ViewportName): boolean {
  return viewportName === 'mobile' || viewportName === 'mobileLarge';
}

/**
 * Check if page is tablet viewport
 */
export function isTabletViewport(viewportName: ViewportName): boolean {
  return viewportName === 'tablet' || viewportName === 'tabletLandscape';
}

/**
 * Check if page is desktop viewport
 */
export function isDesktopViewport(viewportName: ViewportName): boolean {
  return viewportName === 'desktop' || viewportName === 'desktopSmall';
}
