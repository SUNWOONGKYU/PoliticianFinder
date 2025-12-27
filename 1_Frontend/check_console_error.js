const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const errors = [];
  const logs = [];

  // 콘솔 메시지 수집
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      errors.push(text);
    }
    logs.push(`[${type}] ${text}`);
  });

  // 페이지 에러 수집
  page.on('pageerror', error => {
    errors.push(`PageError: ${error.message}`);
  });

  console.log('=== 정치인 상세 페이지 콘솔 에러 확인 ===\n');

  try {
    await page.goto('https://politician-finder-9x5m9kcr8-finder-world.vercel.app/politicians/17270f25', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(5000);
  } catch (e) {
    console.log('Navigation error:', e.message);
  }

  console.log('=== 에러 목록 ===');
  if (errors.length === 0) {
    console.log('콘솔 에러 없음');
  } else {
    errors.forEach((err, i) => {
      console.log((i + 1) + '. ' + err.substring(0, 500));
    });
  }

  console.log('\n=== 전체 로그 (최근 20개) ===');
  logs.slice(-20).forEach(log => {
    console.log(log.substring(0, 300));
  });

  await browser.close();
})();
