import { Page, Route } from '@playwright/test';
import { mockApiResponses, mockPoliticianDetail, mockRatingsPaginated } from '../fixtures/politician-data';

/**
 * API Mocking Helpers
 * Centralized functions for mocking API responses in E2E tests
 */

export interface MockOptions {
  politician?: any;
  ratings?: any;
  shouldFail?: boolean;
  delay?: number;
}

/**
 * Setup standard API mocks for politician detail page
 */
export async function setupStandardMocks(page: Page, options: MockOptions = {}) {
  const {
    politician = mockPoliticianDetail,
    ratings = mockRatingsPaginated,
    shouldFail = false,
    delay = 0,
  } = options;

  // Mock politician endpoint
  await page.route('**/api/politicians/*', async (route) => {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    if (shouldFail) {
      await route.fulfill(mockApiResponses.serverError());
    } else {
      const url = route.request().url();
      if (url.includes(`/politicians/${politician.id}`)) {
        await route.fulfill(mockApiResponses.politicianSuccess(politician));
      } else {
        await route.fulfill(mockApiResponses.politicianNotFound());
      }
    }
  });

  // Mock ratings endpoint
  await page.route('**/api/ratings**', async (route) => {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    if (shouldFail) {
      await route.fulfill(mockApiResponses.serverError());
    } else {
      await route.fulfill(mockApiResponses.ratingsSuccess(ratings));
    }
  });
}

/**
 * Mock 404 politician not found
 */
export async function mockPoliticianNotFound(page: Page) {
  await page.route('**/api/politicians/*', async (route) => {
    await route.fulfill(mockApiResponses.politicianNotFound());
  });
}

/**
 * Mock network error
 */
export async function mockNetworkError(page: Page) {
  await page.route('**/api/politicians/*', async (route) => {
    await route.abort('failed');
  });

  await page.route('**/api/ratings**', async (route) => {
    await route.abort('failed');
  });
}

/**
 * Mock slow network (for loading state testing)
 */
export async function mockSlowNetwork(page: Page, delayMs: number = 3000) {
  await setupStandardMocks(page, { delay: delayMs });
}

/**
 * Mock paginated ratings
 */
export async function mockPaginatedRatings(
  page: Page,
  totalPages: number,
  itemsPerPage: number = 10
) {
  await page.route('**/api/ratings**', async (route) => {
    const url = new URL(route.request().url());
    const pageParam = url.searchParams.get('page') || '1';
    const currentPage = parseInt(pageParam);

    // Generate mock data for the current page
    const startIndex = (currentPage - 1) * itemsPerPage;
    const mockData = Array.from({ length: itemsPerPage }, (_, i) => ({
      id: startIndex + i + 1,
      user_id: `user-${startIndex + i + 1}`,
      politician_id: 1,
      score: Math.floor(Math.random() * 5) + 1,
      comment: `평가 내용 ${startIndex + i + 1}`,
      category: 'overall',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profiles: {
        username: `사용자${startIndex + i + 1}`,
        avatar_url: null,
      },
    }));

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: mockData,
        pagination: {
          page: currentPage,
          limit: itemsPerPage,
          total: totalPages * itemsPerPage,
          totalPages,
        },
      }),
    });
  });
}

/**
 * Mock filtered ratings (by category)
 */
export async function mockFilteredRatings(page: Page, category: string) {
  await page.route('**/api/ratings**', async (route) => {
    const url = new URL(route.request().url());
    const categoryParam = url.searchParams.get('category');

    if (categoryParam === category || category === 'all') {
      const filteredData = mockRatingsPaginated.data.filter(
        rating => category === 'all' || rating.category === category
      );

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: filteredData,
          pagination: {
            page: 1,
            limit: 10,
            total: filteredData.length,
            totalPages: Math.ceil(filteredData.length / 10),
          },
        }),
      });
    } else {
      await route.fulfill(mockApiResponses.ratingsSuccess());
    }
  });
}

/**
 * Mock sorted ratings
 */
export async function mockSortedRatings(page: Page, sortBy: 'latest' | 'highest' | 'lowest') {
  await page.route('**/api/ratings**', async (route) => {
    let sortedData = [...mockRatingsPaginated.data];

    switch (sortBy) {
      case 'latest':
        sortedData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'highest':
        sortedData.sort((a, b) => b.score - a.score);
        break;
      case 'lowest':
        sortedData.sort((a, b) => a.score - b.score);
        break;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: sortedData,
        pagination: mockRatingsPaginated.pagination,
      }),
    });
  });
}

/**
 * Verify API was called with correct parameters
 */
export async function verifyApiCall(
  page: Page,
  endpoint: string,
  expectedParams: Record<string, string>
): Promise<boolean> {
  return new Promise((resolve) => {
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (url.pathname.includes(endpoint)) {
        const allParamsMatch = Object.entries(expectedParams).every(
          ([key, value]) => url.searchParams.get(key) === value
        );
        resolve(allParamsMatch);
      }
    });

    // Timeout after 5 seconds
    setTimeout(() => resolve(false), 5000);
  });
}

/**
 * Count API calls to a specific endpoint
 */
export function createApiCallCounter(page: Page, endpoint: string): () => number {
  let count = 0;

  page.on('request', (request) => {
    if (request.url().includes(endpoint)) {
      count++;
    }
  });

  return () => count;
}

/**
 * Wait for specific API call
 */
export async function waitForApiCall(page: Page, endpoint: string, timeout: number = 5000) {
  return page.waitForResponse(
    response => response.url().includes(endpoint) && response.status() === 200,
    { timeout }
  );
}
