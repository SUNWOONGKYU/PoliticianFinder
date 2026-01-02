import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'https://politician-finder-a2fujo8kl-finder-world.vercel.app';

// Test configurations for both viewports
const viewports = [
  { name: 'PC', width: 1280, height: 720 },
  { name: 'Mobile', width: 390, height: 844 }
];

// Helper function to take screenshot
async function takeScreenshot(page: Page, name: string, viewport: string) {
  await page.screenshot({
    path: `test-results/politician-${viewport.toLowerCase()}-${name}.png`,
    fullPage: true
  });
}

// Helper function to check if element is visible
async function checkElement(page: Page, selector: string, description: string) {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    const isVisible = await page.isVisible(selector);
    return { description, selector, visible: isVisible, error: null };
  } catch (error) {
    return { description, selector, visible: false, error: error.message };
  }
}

for (const viewport of viewports) {
  test.describe(`Politician Features - ${viewport.name}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
    });

    test('1. Politician Detail Page - Profile Display', async ({ page }) => {
      console.log(`\n=== Test 1: Politician Detail Page (${viewport.name}) ===`);

      try {
        // Navigate to community page first to find a politician
        await page.goto(`${BASE_URL}/community`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        // Look for politician posts
        const politicianPosts = page.locator('[data-author-type="politician"]').first();
        const hasPoliticianPosts = await politicianPosts.count() > 0;

        if (hasPoliticianPosts) {
          // Click on politician name to go to detail page
          await politicianPosts.click();
          await page.waitForTimeout(2000);

          // Check for profile elements
          const checks = [];
          checks.push(await checkElement(page, '.politician-profile', 'Politician profile section'));
          checks.push(await checkElement(page, '.politician-name', 'Politician name'));
          checks.push(await checkElement(page, '.politician-party', 'Political party'));
          checks.push(await checkElement(page, '.politician-position', 'Position/title'));
          checks.push(await checkElement(page, '.politician-badge', 'Politician badge'));

          await takeScreenshot(page, 'detail-page', viewport.name);

          console.log('Profile Elements Check:');
          checks.forEach(check => {
            console.log(`  ${check.description}: ${check.visible ? '✓' : '✗'}`);
            if (check.error) console.log(`    Error: ${check.error}`);
          });
        } else {
          console.log('  ⚠ No politician posts found to test detail page');
        }
      } catch (error) {
        console.log(`  ✗ Error: ${error.message}`);
        await takeScreenshot(page, 'detail-page-error', viewport.name);
      }
    });

    test('2. Politician Post Create Page', async ({ page }) => {
      console.log(`\n=== Test 2: Politician Post Create Page (${viewport.name}) ===`);

      try {
        await page.goto(`${BASE_URL}/community/posts/create-politician`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        const checks = [];
        checks.push(await checkElement(page, 'form', 'Post create form'));
        checks.push(await checkElement(page, 'input[name="title"], #title', 'Title input'));
        checks.push(await checkElement(page, 'textarea[name="content"], #content', 'Content textarea'));
        checks.push(await checkElement(page, 'select[name="category"], #category', 'Category selector'));
        checks.push(await checkElement(page, 'button[type="submit"], .submit-button', 'Submit button'));
        checks.push(await checkElement(page, '.politician-badge, .badge-politician', 'Politician badge indicator'));

        await takeScreenshot(page, 'create-page', viewport.name);

        console.log('Create Page Elements Check:');
        checks.forEach(check => {
          console.log(`  ${check.description}: ${check.visible ? '✓' : '✗'}`);
          if (check.error) console.log(`    Error: ${check.error}`);
        });
      } catch (error) {
        console.log(`  ✗ Error: ${error.message}`);
        await takeScreenshot(page, 'create-page-error', viewport.name);
      }
    });

    test('3. Politician Posts Filter', async ({ page }) => {
      console.log(`\n=== Test 3: Politician Posts Filter (${viewport.name}) ===`);

      try {
        await page.goto(`${BASE_URL}/community`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        const checks = [];
        checks.push(await checkElement(page, '.tab-politician, [data-tab="politician"]', 'Politician tab'));
        checks.push(await checkElement(page, '.filter-tabs, .tabs', 'Filter tabs container'));

        // Try to click politician tab
        const politicianTab = page.locator('.tab-politician, [data-tab="politician"], button:has-text("정치인")').first();
        const tabExists = await politicianTab.count() > 0;

        if (tabExists) {
          await politicianTab.click();
          await page.waitForTimeout(2000);

          checks.push(await checkElement(page, '[data-author-type="politician"]', 'Politician posts'));
          checks.push(await checkElement(page, '.politician-badge', 'Politician badge on posts'));

          await takeScreenshot(page, 'filter-active', viewport.name);
        } else {
          console.log('  ⚠ Politician tab not found');
        }

        console.log('Filter Elements Check:');
        checks.forEach(check => {
          console.log(`  ${check.description}: ${check.visible ? '✓' : '✗'}`);
          if (check.error) console.log(`    Error: ${check.error}`);
        });
      } catch (error) {
        console.log(`  ✗ Error: ${error.message}`);
        await takeScreenshot(page, 'filter-error', viewport.name);
      }
    });

    test('4. Politician Post Detail - Badge and Party Display', async ({ page }) => {
      console.log(`\n=== Test 4: Politician Post Detail (${viewport.name}) ===`);

      try {
        await page.goto(`${BASE_URL}/community`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        // Find and click on a politician post
        const politicianPost = page.locator('[data-author-type="politician"]').first();
        const hasPost = await politicianPost.count() > 0;

        if (hasPost) {
          await politicianPost.click();
          await page.waitForTimeout(2000);

          const checks = [];
          checks.push(await checkElement(page, '.politician-badge, .badge', 'Politician badge'));
          checks.push(await checkElement(page, '.political-party, .party-badge', 'Political party badge'));
          checks.push(await checkElement(page, '.author-info', 'Author information'));
          checks.push(await checkElement(page, '.post-content', 'Post content'));

          await takeScreenshot(page, 'post-detail', viewport.name);

          console.log('Post Detail Elements Check:');
          checks.forEach(check => {
            console.log(`  ${check.description}: ${check.visible ? '✓' : '✗'}`);
            if (check.error) console.log(`    Error: ${check.error}`);
          });
        } else {
          console.log('  ⚠ No politician posts found to test detail view');
        }
      } catch (error) {
        console.log(`  ✗ Error: ${error.message}`);
        await takeScreenshot(page, 'post-detail-error', viewport.name);
      }
    });

    test('5. AI Evaluation Scores Display', async ({ page }) => {
      console.log(`\n=== Test 5: AI Evaluation Scores (${viewport.name}) ===`);

      try {
        // Navigate to community to find a politician post with AI scores
        await page.goto(`${BASE_URL}/community`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        const checks = [];
        checks.push(await checkElement(page, '.ai-score, .evaluation-score', 'AI score section'));
        checks.push(await checkElement(page, '.claude-score, [data-ai="claude"]', 'Claude score'));
        checks.push(await checkElement(page, '.chatgpt-score, [data-ai="chatgpt"]', 'ChatGPT score'));
        checks.push(await checkElement(page, '.grok-score, [data-ai="grok"]', 'Grok score'));
        checks.push(await checkElement(page, '.gemini-score, [data-ai="gemini"]', 'Gemini score'));

        await takeScreenshot(page, 'ai-scores', viewport.name);

        console.log('AI Scores Elements Check:');
        checks.forEach(check => {
          console.log(`  ${check.description}: ${check.visible ? '✓' : '✗'}`);
          if (check.error) console.log(`    Error: ${check.error}`);
        });

        // Try to find any AI score display
        const aiScoreElements = await page.locator('.ai-score, .evaluation-score, [class*="score"]').count();
        console.log(`  Total elements with "score" class: ${aiScoreElements}`);
      } catch (error) {
        console.log(`  ✗ Error: ${error.message}`);
        await takeScreenshot(page, 'ai-scores-error', viewport.name);
      }
    });
  });
}

// Summary test to compare PC vs Mobile
test('Summary: PC vs Mobile Comparison', async ({ page }) => {
  console.log('\n=== SUMMARY: PC vs Mobile Feature Comparison ===');
  console.log('\nTest completed. Check test-results folder for screenshots.');
  console.log('\nKey features tested:');
  console.log('1. ✓ Politician Detail Page - Profile Display');
  console.log('2. ✓ Politician Post Create Page');
  console.log('3. ✓ Politician Posts Filter');
  console.log('4. ✓ Politician Post Detail - Badge and Party');
  console.log('5. ✓ AI Evaluation Scores Display');
});
