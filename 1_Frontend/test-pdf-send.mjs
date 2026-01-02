// Test PDF sending functionality
import { chromium } from 'playwright';

const PROD_URL = 'https://politician-finder-finder-world.vercel.app';

async function testPdfSend() {
  const browser = await chromium.launch({ headless: false }); // headless: false to see the action
  const context = await browser.newContext();

  // Set admin cookie
  await context.addCookies([{
    name: 'isAdmin',
    value: 'true',
    domain: 'politician-finder-finder-world.vercel.app',
    path: '/'
  }]);

  const page = await context.newPage();

  // Handle dialog (confirm)
  page.on('dialog', async dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    await dialog.accept(); // Click "확인" on confirm dialog
  });

  console.log('1. Navigating to /admin/report-sales...');
  await page.goto(`${PROD_URL}/admin/report-sales`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Take screenshot before clicking
  await page.screenshot({ path: 'pdf-send-before.png', fullPage: true });
  console.log('2. Screenshot saved: pdf-send-before.png');

  // Find and click the "발송하기" button
  console.log('3. Looking for 발송하기 button...');
  const sendButton = await page.locator('button:has-text("발송하기")').first();

  if (await sendButton.isVisible()) {
    console.log('4. Found 발송하기 button, clicking...');

    // Click the button and wait for response
    await sendButton.click();

    // Wait for the API call to complete (may take time for PDF generation)
    console.log('5. Waiting for PDF generation and email sending...');
    await page.waitForTimeout(15000); // Wait 15 seconds for PDF generation + email

    // Take screenshot after clicking
    await page.screenshot({ path: 'pdf-send-after.png', fullPage: true });
    console.log('6. Screenshot saved: pdf-send-after.png');

    // Check page content for success/error messages
    const pageContent = await page.content();

    if (pageContent.includes('발송되었습니다') || pageContent.includes('발송완료')) {
      console.log('✅ PDF 발송 성공!');
    } else if (pageContent.includes('실패') || pageContent.includes('오류')) {
      console.log('❌ PDF 발송 실패');
    } else {
      console.log('⏳ 결과 확인 필요 - 스크린샷 참조');
    }
  } else {
    console.log('❌ 발송하기 button not found');
  }

  await browser.close();
}

testPdfSend().catch(console.error);
