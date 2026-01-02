const { chromium } = require('playwright');

const BASE_URL = 'https://politician-finder-a2fujo8kl-finder-world.vercel.app';

const viewports = [
  { name: 'PC', width: 1280, height: 720 },
  { name: 'Mobile', width: 390, height: 844 }
];

const results = {
  PC: {},
  Mobile: {}
};

async function checkElement(page, selector, description, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout, state: 'visible' });
    return { description, selector, visible: true, error: null };
  } catch (error) {
    // Try alternative check
    const element = await page.$(selector);
    if (element) {
      return { description, selector, visible: false, error: 'Element exists but not visible' };
    }
    return { description, selector, visible: false, error: 'Element not found' };
  }
}

async function testPoliticianDetailPage(page, viewportName) {
  console.log(`\n=== Test 1: Politician Detail Page (${viewportName}) ===`);
  const testResults = { name: 'Politician Detail Page', checks: [] };

  try {
    await page.goto(`${BASE_URL}/community`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Try to find politician link
    const politicianLinks = await page.$$('a[href*="/politicians/"]');

    if (politicianLinks.length > 0) {
      await politicianLinks[0].click();
      await page.waitForTimeout(3000);

      testResults.checks.push(await checkElement(page, 'h1, .politician-name', 'Politician name'));
      testResults.checks.push(await checkElement(page, '.party, .political-party', 'Political party'));
      testResults.checks.push(await checkElement(page, '.profile, .politician-profile', 'Profile section'));

      await page.screenshot({
        path: `test-results/politician-${viewportName.toLowerCase()}-detail.png`,
        fullPage: true
      });
      testResults.success = true;
    } else {
      testResults.success = false;
      testResults.error = 'No politician links found';
    }
  } catch (error) {
    testResults.success = false;
    testResults.error = error.message;
    await page.screenshot({
      path: `test-results/politician-${viewportName.toLowerCase()}-detail-error.png`
    });
  }

  return testResults;
}

async function testPoliticianCreatePage(page, viewportName) {
  console.log(`\n=== Test 2: Politician Post Create Page (${viewportName}) ===`);
  const testResults = { name: 'Politician Post Create', checks: [] };

  try {
    await page.goto(`${BASE_URL}/community/posts/create-politician`, {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(2000);

    testResults.checks.push(await checkElement(page, 'form', 'Post create form'));
    testResults.checks.push(await checkElement(page, 'input[type="text"], input[name="title"]', 'Title input'));
    testResults.checks.push(await checkElement(page, 'textarea', 'Content textarea'));
    testResults.checks.push(await checkElement(page, 'button[type="submit"]', 'Submit button'));

    await page.screenshot({
      path: `test-results/politician-${viewportName.toLowerCase()}-create.png`,
      fullPage: true
    });
    testResults.success = true;
  } catch (error) {
    testResults.success = false;
    testResults.error = error.message;
    await page.screenshot({
      path: `test-results/politician-${viewportName.toLowerCase()}-create-error.png`
    });
  }

  return testResults;
}

async function testPoliticianFilter(page, viewportName) {
  console.log(`\n=== Test 3: Politician Posts Filter (${viewportName}) ===`);
  const testResults = { name: 'Politician Filter', checks: [] };

  try {
    await page.goto(`${BASE_URL}/community`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for filter tabs
    testResults.checks.push(await checkElement(page, '.tabs, [role="tablist"]', 'Filter tabs'));

    // Try to find politician tab
    const politicianTab = await page.$('button:has-text("정치인"), [data-tab="politician"]');
    if (politicianTab) {
      testResults.checks.push({ description: 'Politician tab', visible: true, error: null });
      await politicianTab.click();
      await page.waitForTimeout(2000);

      testResults.checks.push(await checkElement(page, '.post-item, article', 'Post items'));
    } else {
      testResults.checks.push({ description: 'Politician tab', visible: false, error: 'Tab not found' });
    }

    await page.screenshot({
      path: `test-results/politician-${viewportName.toLowerCase()}-filter.png`,
      fullPage: true
    });
    testResults.success = true;
  } catch (error) {
    testResults.success = false;
    testResults.error = error.message;
    await page.screenshot({
      path: `test-results/politician-${viewportName.toLowerCase()}-filter-error.png`
    });
  }

  return testResults;
}

async function testPoliticianPostDetail(page, viewportName) {
  console.log(`\n=== Test 4: Politician Post Detail (${viewportName}) ===`);
  const testResults = { name: 'Politician Post Detail', checks: [] };

  try {
    await page.goto(`${BASE_URL}/community`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Find any post
    const postLinks = await page.$$('a[href*="/community/posts/"]');

    if (postLinks.length > 0) {
      await postLinks[0].click();
      await page.waitForTimeout(3000);

      testResults.checks.push(await checkElement(page, '.author-info, .post-author', 'Author info'));
      testResults.checks.push(await checkElement(page, '.badge, .politician-badge', 'Politician badge'));
      testResults.checks.push(await checkElement(page, '.party, .political-party', 'Party badge'));
      testResults.checks.push(await checkElement(page, '.post-content', 'Post content'));

      await page.screenshot({
        path: `test-results/politician-${viewportName.toLowerCase()}-post-detail.png`,
        fullPage: true
      });
      testResults.success = true;
    } else {
      testResults.success = false;
      testResults.error = 'No post links found';
    }
  } catch (error) {
    testResults.success = false;
    testResults.error = error.message;
    await page.screenshot({
      path: `test-results/politician-${viewportName.toLowerCase()}-post-detail-error.png`
    });
  }

  return testResults;
}

async function testAIScores(page, viewportName) {
  console.log(`\n=== Test 5: AI Evaluation Scores (${viewportName}) ===`);
  const testResults = { name: 'AI Evaluation Scores', checks: [] };

  try {
    await page.goto(`${BASE_URL}/community`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    testResults.checks.push(await checkElement(page, '.score, .ai-score', 'AI score section', 3000));
    testResults.checks.push(await checkElement(page, '[data-ai="claude"], .claude', 'Claude score', 3000));
    testResults.checks.push(await checkElement(page, '[data-ai="chatgpt"], .chatgpt', 'ChatGPT score', 3000));
    testResults.checks.push(await checkElement(page, '[data-ai="grok"], .grok', 'Grok score', 3000));
    testResults.checks.push(await checkElement(page, '[data-ai="gemini"], .gemini', 'Gemini score', 3000));

    await page.screenshot({
      path: `test-results/politician-${viewportName.toLowerCase()}-ai-scores.png`,
      fullPage: true
    });
    testResults.success = true;
  } catch (error) {
    testResults.success = false;
    testResults.error = error.message;
    await page.screenshot({
      path: `test-results/politician-${viewportName.toLowerCase()}-ai-scores-error.png`
    });
  }

  return testResults;
}

async function runTests() {
  const browser = await chromium.launch({ headless: true });

  for (const viewport of viewports) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing ${viewport.name} viewport (${viewport.width}x${viewport.height})`);
    console.log('='.repeat(60));

    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      userAgent: viewport.name === 'Mobile'
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
        : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });

    const page = await context.newPage();

    results[viewport.name].detailPage = await testPoliticianDetailPage(page, viewport.name);
    results[viewport.name].createPage = await testPoliticianCreatePage(page, viewport.name);
    results[viewport.name].filter = await testPoliticianFilter(page, viewport.name);
    results[viewport.name].postDetail = await testPoliticianPostDetail(page, viewport.name);
    results[viewport.name].aiScores = await testAIScores(page, viewport.name);

    await context.close();
  }

  await browser.close();

  // Print summary
  console.log('\n\n' + '='.repeat(80));
  console.log('TEST RESULTS SUMMARY: PC vs Mobile Comparison');
  console.log('='.repeat(80));

  const features = [
    'detailPage',
    'createPage',
    'filter',
    'postDetail',
    'aiScores'
  ];

  features.forEach(feature => {
    const pcResult = results.PC[feature];
    const mobileResult = results.Mobile[feature];

    console.log(`\n${pcResult.name}:`);
    console.log(`  PC:     ${pcResult.success ? '✓ PASS' : '✗ FAIL'}${pcResult.error ? ` (${pcResult.error})` : ''}`);
    console.log(`  Mobile: ${mobileResult.success ? '✓ PASS' : '✗ FAIL'}${mobileResult.error ? ` (${mobileResult.error})` : ''}`);

    if (pcResult.checks && pcResult.checks.length > 0) {
      console.log(`\n  Element Checks:`);
      pcResult.checks.forEach((check, idx) => {
        const mobileCheck = mobileResult.checks[idx];
        console.log(`    ${check.description}:`);
        console.log(`      PC:     ${check.visible ? '✓' : '✗'}${check.error ? ` (${check.error})` : ''}`);
        console.log(`      Mobile: ${mobileCheck?.visible ? '✓' : '✗'}${mobileCheck?.error ? ` (${mobileCheck.error})` : ''}`);
      });
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log('Screenshots saved in test-results/ directory');
  console.log('='.repeat(80) + '\n');
}

runTests().catch(console.error);
