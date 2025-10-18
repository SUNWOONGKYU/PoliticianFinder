const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set viewport size
  await page.setViewport({
    width: 420,
    height: 2400,
    deviceScaleFactor: 2
  });
  
  // Navigate to the HTML file
  const htmlPath = 'file:///G:/내 드라이브/Developement/PoliticianFinder/13DGC-AODM_Grid/13DGC-AODM_인포그래픽_v2.html';
  await page.goto(htmlPath, { waitUntil: 'networkidle0' });
  
  // Wait a bit for fonts to load
  await page.waitForTimeout(1000);
  
  // Take screenshot
  const outputPath = 'G:/내 드라이브/Developement/PoliticianFinder/13DGC-AODM_Grid/13DGC-AODM_인포그래픽.png';
  await page.screenshot({
    path: outputPath,
    fullPage: true
  });
  
  console.log('Screenshot saved to:', outputPath);
  
  await browser.close();
})();
