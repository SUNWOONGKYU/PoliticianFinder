/**
 * PoliticianFinder Mobile Test - iPhone 14 (390x844)
 * 일반 회원 관점 전체 기능 테스트
 */

const { test, expect } = require('@playwright/test');

const BASE_URL = 'https://politician-finder-a2fujo8kl-finder-world.vercel.app';
const MOBILE_VIEWPORT = { width: 390, height: 844 };
const MIN_TOUCH_TARGET = 44; // 최소 터치 타겟 크기 (px)

test.describe('PoliticianFinder Mobile Tests - iPhone 14', () => {
  test.use({
    viewport: MOBILE_VIEWPORT,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
  });

  test('1. 홈페이지 - 모바일 카드 레이아웃, 터치 반응', async ({ page }) => {
    console.log('=== 1. 홈페이지 테스트 시작 ===');

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // 모바일 뷰포트 확인
    const viewport = page.viewportSize();
    expect(viewport.width).toBe(390);
    expect(viewport.height).toBe(844);

    // 가로 스크롤 체크
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(390);
    console.log(`Body width: ${bodyWidth}px (should be <= 390px)`);

    // 카드 레이아웃 확인
    const cards = page.locator('.politician-card, [class*="card"]').first();
    if (await cards.count() > 0) {
      const cardBox = await cards.boundingBox();
      if (cardBox) {
        expect(cardBox.width).toBeLessThanOrEqual(390);
        console.log(`Card width: ${cardBox.width}px`);
      }
    }

    // 터치 반응 테스트 (첫 번째 카드 탭)
    const firstCard = page.locator('.politician-card, [class*="card"]').first();
    if (await firstCard.count() > 0) {
      await firstCard.tap();
      console.log('Card tap successful');
    }

    console.log('✅ 홈페이지 테스트 완료');
  });

  test('2. Header - 햄버거 메뉴, 모바일 네비게이션', async ({ page }) => {
    console.log('=== 2. Header 테스트 시작 ===');

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // 햄버거 메뉴 버튼 찾기
    const hamburgerSelectors = [
      'button.hamburger',
      'button[aria-label*="menu"]',
      'button[aria-label*="메뉴"]',
      '.menu-toggle',
      '[class*="hamburger"]',
      'header button'
    ];

    let hamburgerButton = null;
    for (const selector of hamburgerSelectors) {
      const btn = page.locator(selector).first();
      if (await btn.count() > 0) {
        hamburgerButton = btn;
        console.log(`Found hamburger button: ${selector}`);
        break;
      }
    }

    if (hamburgerButton) {
      // 터치 타겟 크기 확인
      const buttonBox = await hamburgerButton.boundingBox();
      if (buttonBox) {
        expect(buttonBox.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        expect(buttonBox.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        console.log(`Hamburger button size: ${buttonBox.width}x${buttonBox.height}px`);
      }

      // 메뉴 토글 테스트
      await hamburgerButton.tap();
      await page.waitForTimeout(500);
      console.log('Hamburger menu tapped');

      // 메뉴 닫기
      await hamburgerButton.tap();
      await page.waitForTimeout(500);
    } else {
      console.log('⚠️ Hamburger button not found - may be desktop-only navigation');
    }

    console.log('✅ Header 테스트 완료');
  });

  test('3. 정치인 목록 - 모바일 카드 뷰, 필터 토글', async ({ page }) => {
    console.log('=== 3. 정치인 목록 테스트 시작 ===');

    await page.goto(`${BASE_URL}/politicians`);
    await page.waitForLoadState('networkidle');

    // 정치인 카드 확인
    const politicianCards = page.locator('[class*="politician"], [class*="card"]');
    const cardCount = await politicianCards.count();
    console.log(`Found ${cardCount} politician cards`);

    if (cardCount > 0) {
      // 첫 번째 카드 크기 확인
      const firstCard = politicianCards.first();
      const cardBox = await firstCard.boundingBox();
      if (cardBox) {
        expect(cardBox.width).toBeLessThanOrEqual(390);
        console.log(`Card width: ${cardBox.width}px`);
      }
    }

    // 필터 버튼 찾기
    const filterSelectors = [
      'button[class*="filter"]',
      'button[aria-label*="filter"]',
      'button[aria-label*="필터"]',
      '.filter-toggle',
      '[class*="filter-button"]'
    ];

    let filterButton = null;
    for (const selector of filterSelectors) {
      const btn = page.locator(selector).first();
      if (await btn.count() > 0) {
        filterButton = btn;
        console.log(`Found filter button: ${selector}`);
        break;
      }
    }

    if (filterButton) {
      // 터치 타겟 크기 확인
      const buttonBox = await filterButton.boundingBox();
      if (buttonBox) {
        expect(buttonBox.width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        console.log(`Filter button size: ${buttonBox.width}x${buttonBox.height}px`);
      }

      // 필터 토글 테스트
      await filterButton.tap();
      await page.waitForTimeout(500);
      console.log('Filter toggled');
    } else {
      console.log('⚠️ Filter button not found');
    }

    console.log('✅ 정치인 목록 테스트 완료');
  });

  test('4. 정치인 상세 - 탭 스와이프, 모바일 레이아웃', async ({ page }) => {
    console.log('=== 4. 정치인 상세 테스트 시작 ===');

    // 정치인 목록 페이지로 이동
    await page.goto(`${BASE_URL}/politicians`);
    await page.waitForLoadState('networkidle');

    // 첫 번째 정치인 카드 클릭
    const firstCard = page.locator('[class*="politician"], [class*="card"], a[href*="politician"]').first();
    if (await firstCard.count() > 0) {
      await firstCard.tap();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // 탭 요소 찾기
      const tabSelectors = [
        '[role="tab"]',
        '.tab',
        '[class*="tab"]',
        'button[class*="tab"]'
      ];

      let tabs = null;
      for (const selector of tabSelectors) {
        const tabElements = page.locator(selector);
        if (await tabElements.count() > 0) {
          tabs = tabElements;
          console.log(`Found tabs: ${selector}, count: ${await tabElements.count()}`);
          break;
        }
      }

      if (tabs && await tabs.count() > 1) {
        // 첫 번째 탭 크기 확인
        const firstTab = tabs.first();
        const tabBox = await firstTab.boundingBox();
        if (tabBox) {
          expect(tabBox.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
          console.log(`Tab size: ${tabBox.width}x${tabBox.height}px`);
        }

        // 두 번째 탭 클릭
        if (await tabs.count() > 1) {
          await tabs.nth(1).tap();
          await page.waitForTimeout(500);
          console.log('Tab switched successfully');
        }
      } else {
        console.log('⚠️ Tabs not found on detail page');
      }

      // 가로 스크롤 체크
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(390);
      console.log(`Detail page body width: ${bodyWidth}px`);
    } else {
      console.log('⚠️ No politician cards found to navigate to detail');
    }

    console.log('✅ 정치인 상세 테스트 완료');
  });

  test('5. 커뮤니티 - 모바일 게시글 목록, 탭 전환', async ({ page }) => {
    console.log('=== 5. 커뮤니티 테스트 시작 ===');

    await page.goto(`${BASE_URL}/community`);
    await page.waitForLoadState('networkidle');

    // 게시글 목록 확인
    const postSelectors = [
      '[class*="post"]',
      '[class*="article"]',
      '.community-item',
      '[class*="board"]'
    ];

    let posts = null;
    for (const selector of postSelectors) {
      const postElements = page.locator(selector);
      if (await postElements.count() > 0) {
        posts = postElements;
        console.log(`Found posts: ${selector}, count: ${await postElements.count()}`);
        break;
      }
    }

    if (posts && await posts.count() > 0) {
      const firstPost = posts.first();
      const postBox = await firstPost.boundingBox();
      if (postBox) {
        expect(postBox.width).toBeLessThanOrEqual(390);
        console.log(`Post width: ${postBox.width}px`);
      }
    }

    // 탭 전환 테스트
    const tabs = page.locator('[role="tab"], .tab, [class*="tab"]');
    if (await tabs.count() > 1) {
      await tabs.nth(1).tap();
      await page.waitForTimeout(500);
      console.log('Community tab switched');
    }

    // 가로 스크롤 체크
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(390);
    console.log(`Community page body width: ${bodyWidth}px`);

    console.log('✅ 커뮤니티 테스트 완료');
  });

  test('6. 로그인/회원가입 - 44px 터치 타겟, 입력 필드', async ({ page }) => {
    console.log('=== 6. 로그인/회원가입 테스트 시작 ===');

    // 로그인 페이지
    await page.goto(`${BASE_URL}/auth/login`);
    await page.waitForLoadState('networkidle');

    // 입력 필드 확인
    const emailInput = page.locator('input[type="email"], input[name*="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    if (await emailInput.count() > 0) {
      const emailBox = await emailInput.boundingBox();
      if (emailBox) {
        expect(emailBox.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        console.log(`Email input height: ${emailBox.height}px`);
      }
    }

    if (await passwordInput.count() > 0) {
      const passwordBox = await passwordInput.boundingBox();
      if (passwordBox) {
        expect(passwordBox.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        console.log(`Password input height: ${passwordBox.height}px`);
      }
    }

    // 로그인 버튼
    const loginButton = page.locator('button[type="submit"], button:has-text("로그인")').first();
    if (await loginButton.count() > 0) {
      const buttonBox = await loginButton.boundingBox();
      if (buttonBox) {
        expect(buttonBox.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        console.log(`Login button size: ${buttonBox.width}x${buttonBox.height}px`);
      }
    }

    // 회원가입 페이지
    await page.goto(`${BASE_URL}/auth/signup`);
    await page.waitForLoadState('networkidle');

    // 회원가입 버튼
    const signupButton = page.locator('button[type="submit"], button:has-text("가입")').first();
    if (await signupButton.count() > 0) {
      const buttonBox = await signupButton.boundingBox();
      if (buttonBox) {
        expect(buttonBox.height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
        console.log(`Signup button size: ${buttonBox.width}x${buttonBox.height}px`);
      }
    }

    console.log('✅ 로그인/회원가입 테스트 완료');
  });

  test('7. Footer - 회사 정보 줄바꿈 확인', async ({ page }) => {
    console.log('=== 7. Footer 테스트 시작 ===');

    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Footer 찾기
    const footer = page.locator('footer').first();
    if (await footer.count() > 0) {
      const footerBox = await footer.boundingBox();
      if (footerBox) {
        expect(footerBox.width).toBeLessThanOrEqual(390);
        console.log(`Footer width: ${footerBox.width}px`);
      }

      // Footer 내 텍스트 확인
      const footerText = await footer.textContent();
      console.log(`Footer text length: ${footerText?.length || 0} characters`);

      // 가로 스크롤 체크
      const footerScrollWidth = await footer.evaluate(el => el.scrollWidth);
      const footerClientWidth = await footer.evaluate(el => el.clientWidth);
      expect(footerScrollWidth).toBeLessThanOrEqual(footerClientWidth + 5); // 5px tolerance
      console.log(`Footer scroll width: ${footerScrollWidth}px, client width: ${footerClientWidth}px`);
    } else {
      console.log('⚠️ Footer not found');
    }

    console.log('✅ Footer 테스트 완료');
  });

  test('8. 전체 페이지 가독성 테스트', async ({ page }) => {
    console.log('=== 8. 전체 페이지 가독성 테스트 시작 ===');

    const pages = [
      { url: BASE_URL, name: 'Home' },
      { url: `${BASE_URL}/politicians`, name: 'Politicians' },
      { url: `${BASE_URL}/community`, name: 'Community' },
      { url: `${BASE_URL}/auth/login`, name: 'Login' },
      { url: `${BASE_URL}/mypage`, name: 'MyPage' }
    ];

    for (const pageInfo of pages) {
      await page.goto(pageInfo.url);
      await page.waitForLoadState('networkidle');

      // 가로 스크롤 체크
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });

      console.log(`${pageInfo.name}: Horizontal scroll = ${hasHorizontalScroll ? '❌ YES' : '✅ NO'}`);
      expect(hasHorizontalScroll).toBe(false);

      // 폰트 크기 체크 (최소 14px 권장)
      const minFontSize = await page.evaluate(() => {
        const allElements = document.querySelectorAll('p, span, div, a, button');
        let minSize = Infinity;

        allElements.forEach(el => {
          const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
          if (fontSize > 0 && fontSize < minSize) {
            minSize = fontSize;
          }
        });

        return minSize;
      });

      console.log(`${pageInfo.name}: Min font size = ${minFontSize}px`);
      expect(minFontSize).toBeGreaterThanOrEqual(12); // 최소 12px
    }

    console.log('✅ 전체 페이지 가독성 테스트 완료');
  });
});
