// Test report-sales page with admin cookie
import { chromium } from 'playwright';

const PROD_URL = 'https://politician-finder-finder-world.vercel.app';

async function testReportSales() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  // Set admin cookie
  await context.addCookies([{
    name: 'isAdmin',
    value: 'true',
    domain: 'politician-finder-finder-world.vercel.app',
    path: '/'
  }]);

  const page = await context.newPage();

  console.log('1. Navigating to /admin/report-sales...');
  await page.goto(`${PROD_URL}/admin/report-sales`, { waitUntil: 'networkidle' });

  // Wait for page load
  await page.waitForTimeout(3000);

  // Check if redirected to login (meaning cookie didn't work)
  const currentUrl = page.url();
  console.log('2. Current URL:', currentUrl);

  if (currentUrl.includes('/admin/login')) {
    console.log('❌ Redirected to login page - admin cookie not working');
    await browser.close();
    return;
  }

  // Check page content
  const pageContent = await page.content();

  // Check for title
  const hasTitle = pageContent.includes('보고서 판매 관리');
  console.log('3. Has title "보고서 판매 관리":', hasTitle);

  // Check for error message
  const hasError = pageContent.includes('데이터를 불러오는데 실패했습니다');
  console.log('4. Has error message:', hasError);

  // Check for loading
  const hasLoading = pageContent.includes('로딩 중');
  console.log('5. Has loading message:', hasLoading);

  // Check for stats cards (should be visible after data loads)
  const hasStatsCards = pageContent.includes('전체 구매') || pageContent.includes('입금 대기');
  console.log('6. Has stats cards:', hasStatsCards);

  // Check for table
  const hasTable = pageContent.includes('구매일') && pageContent.includes('구매자');
  console.log('7. Has table headers:', hasTable);

  // Check for test data
  const hasTestData = pageContent.includes('테스트 사용자') || pageContent.includes('wksun999@hanmail.net');
  console.log('8. Has test data:', hasTestData);

  // Take screenshot
  await page.screenshot({ path: 'report-sales-test.png', fullPage: true });
  console.log('9. Screenshot saved as report-sales-test.png');

  // Summary
  console.log('\n=== Summary ===');
  if (!hasError && hasStatsCards && hasTable) {
    console.log('✅ Page loaded successfully with data!');
  } else if (hasError) {
    console.log('❌ Page has error - data loading failed');
  } else if (hasLoading) {
    console.log('⏳ Page is still loading');
  } else {
    console.log('⚠️ Unexpected state');
  }

  await browser.close();
}

testReportSales().catch(console.error);
