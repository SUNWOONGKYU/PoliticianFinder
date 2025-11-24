const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('=== POLITICIANS PAGE TEST ===\n');

  // 페이지 로드
  console.log('1. Loading politicians page...');
  await page.goto('https://www.politicianfinder.ai.kr/politicians', {
    waitUntil: 'networkidle',
    timeout: 30000
  });

  await page.waitForTimeout(3000);

  // 테이블 확인
  console.log('\n2. Checking for table...');
  const tableExists = await page.$('table tbody tr');
  if (tableExists) {
    console.log('   ✓ Table found');

    // 행 개수 확인
    const rowCount = await page.$$eval('table tbody tr', rows => rows.length);
    console.log(`   ✓ Rows: ${rowCount}`);

    // 첫 번째 행 클릭 테스트
    console.log('\n3. Testing first row click...');
    const firstRow = await page.$('table tbody tr:first-child');
    if (firstRow) {
      console.log('   ✓ First row found');

      // 클릭 전 URL
      const urlBefore = page.url();
      console.log(`   Before click: ${urlBefore}`);

      // 클릭
      await firstRow.click();
      await page.waitForTimeout(2000);

      // 클릭 후 URL
      const urlAfter = page.url();
      console.log(`   After click: ${urlAfter}`);

      if (urlBefore !== urlAfter) {
        console.log('   ✓ Navigation SUCCESS!');
      } else {
        console.log('   ✗ Navigation FAILED - URL did not change');
      }
    } else {
      console.log('   ✗ First row not found');
    }
  } else {
    console.log('   ✗ Table not found');

    // 에러 메시지 확인
    const errorMsg = await page.textContent('body');
    console.log(`\n   Page content: ${errorMsg.substring(0, 200)}...`);
  }

  console.log('\n\nBrowser will close in 10 seconds...');
  await page.waitForTimeout(10000);
  await browser.close();
})();
