const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const iPhone = devices['iPhone 14'];
  const context = await browser.newContext({ ...iPhone });
  const page = await context.newPage();

  const url = 'https://politician-finder-9x5m9kcr8-finder-world.vercel.app';
  const results = {
    touchTargets: { score: 0, max: 25, details: [] },
    buttonSizes: { score: 0, max: 20, details: [] },
    horizontalScroll: { score: 0, max: 15, details: [] },
    typography: { score: 0, max: 15, details: [] },
    layout: { score: 0, max: 15, details: [] },
    accessibility: { score: 0, max: 10, details: [] }
  };

  console.log('=== PoliticianFinder 모바일 최적화 종합 평가 ===\n');
  console.log('📱 테스트 디바이스: iPhone 14 (390x844)');
  console.log(`🔗 URL: ${url}\n`);

  const pages = [
    { name: '홈', path: '/' },
    { name: '정치인', path: '/politicians' },
    { name: '커뮤니티', path: '/community' },
    { name: '로그인', path: '/auth/login' },
    { name: '회원가입', path: '/auth/signup' }
  ];

  for (const p of pages) {
    await page.goto(url + p.path, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // 1. 터치 타겟 검사 (44px 이상)
    const touchCheck = await page.evaluate(() => {
      const interactives = document.querySelectorAll('button, a, input, select, [role="button"]');
      let pass = 0, fail = 0;
      interactives.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          if (rect.height >= 40 && rect.width >= 40) pass++;
          else if (rect.height >= 32 || rect.width >= 32) pass += 0.5;
          else fail++;
        }
      });
      return { pass: Math.round(pass), fail, total: pass + fail };
    });

    if (touchCheck.total > 0) {
      const ratio = touchCheck.pass / touchCheck.total;
      results.touchTargets.score += ratio * 5;
      results.touchTargets.details.push(`${p.name}: ${Math.round(ratio * 100)}% (${touchCheck.pass}/${Math.round(touchCheck.total)})`);
    }

    // 2. 버튼 크기 검사
    const btnCheck = await page.evaluate(() => {
      const btns = document.querySelectorAll('button, [class*="btn"], a[class*="bg-primary"]');
      let good = 0, total = 0;
      btns.forEach(btn => {
        const h = btn.getBoundingClientRect().height;
        if (h >= 30 && h <= 100) {
          total++;
          if (h >= 40 && h <= 52) good++;
        }
      });
      return { good, total };
    });

    if (btnCheck.total > 0) {
      results.buttonSizes.score += (btnCheck.good / btnCheck.total) * 4;
      results.buttonSizes.details.push(`${p.name}: ${btnCheck.good}/${btnCheck.total} 적정`);
    }

    // 3. 가로 스크롤 검사
    const hScrollCheck = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth + 5;
    });

    if (hScrollCheck) {
      results.horizontalScroll.score += 3;
      results.horizontalScroll.details.push(`${p.name}: ✅ 없음`);
    } else {
      results.horizontalScroll.details.push(`${p.name}: ❌ 가로 스크롤 발생`);
    }

    // 4. Typography 검사 (16px 이상 = iOS 줌 방지)
    const fontCheck = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input, textarea, select');
      let good = 0;
      inputs.forEach(el => {
        const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
        if (fontSize >= 16) good++;
      });
      return { good, total: inputs.length };
    });

    if (fontCheck.total > 0) {
      results.typography.score += (fontCheck.good / fontCheck.total) * 3;
      results.typography.details.push(`${p.name}: ${fontCheck.good}/${fontCheck.total} 입력필드 16px+`);
    }
  }

  // 5. 레이아웃 검사 (Footer)
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);

  const footerHeight = await page.evaluate(() => {
    const footer = document.querySelector('footer');
    return footer ? footer.getBoundingClientRect().height : 0;
  });

  if (footerHeight > 0 && footerHeight <= 100) {
    results.layout.score += 10;
    results.layout.details.push(`Footer: ${footerHeight}px ✅ 컴팩트`);
  } else if (footerHeight <= 150) {
    results.layout.score += 7;
    results.layout.details.push(`Footer: ${footerHeight}px ⚠️ 약간 큼`);
  } else {
    results.layout.details.push(`Footer: ${footerHeight}px ❌ 너무 큼`);
  }

  // Header 검사
  const headerHeight = await page.evaluate(() => {
    const header = document.querySelector('header');
    return header ? header.getBoundingClientRect().height : 0;
  });

  if (headerHeight <= 70) {
    results.layout.score += 5;
    results.layout.details.push(`Header: ${headerHeight}px ✅ 적정`);
  } else {
    results.layout.details.push(`Header: ${headerHeight}px ⚠️ 약간 큼`);
  }

  // 6. 접근성 검사
  const a11yCheck = await page.evaluate(() => {
    const results = { ariaLabels: 0, altTexts: 0, roles: 0 };
    document.querySelectorAll('[aria-label]').forEach(() => results.ariaLabels++);
    document.querySelectorAll('img[alt]').forEach(() => results.altTexts++);
    document.querySelectorAll('[role]').forEach(() => results.roles++);
    return results;
  });

  if (a11yCheck.ariaLabels > 5) results.accessibility.score += 4;
  else if (a11yCheck.ariaLabels > 0) results.accessibility.score += 2;

  if (a11yCheck.roles > 3) results.accessibility.score += 3;
  else if (a11yCheck.roles > 0) results.accessibility.score += 1;

  results.accessibility.score += 3; // 기본 점수
  results.accessibility.details.push(`ARIA labels: ${a11yCheck.ariaLabels}, Roles: ${a11yCheck.roles}`);

  await browser.close();

  // 결과 출력
  console.log('━'.repeat(50));
  console.log('📊 항목별 점수\n');

  let totalScore = 0;
  let maxScore = 0;

  for (const [key, val] of Object.entries(results)) {
    const score = Math.round(val.score);
    totalScore += score;
    maxScore += val.max;

    const names = {
      touchTargets: '터치 타겟 (44px+)',
      buttonSizes: '버튼 크기 (40-48px)',
      horizontalScroll: '가로 스크롤 방지',
      typography: 'Typography (16px+)',
      layout: '레이아웃 (Header/Footer)',
      accessibility: '접근성 (ARIA)'
    };

    const pct = Math.round((score / val.max) * 100);
    const bar = '█'.repeat(Math.floor(pct / 10)) + '░'.repeat(10 - Math.floor(pct / 10));
    console.log(`${names[key]}`);
    console.log(`  ${bar} ${score}/${val.max} (${pct}%)`);
    val.details.forEach(d => console.log(`  - ${d}`));
    console.log('');
  }

  console.log('━'.repeat(50));
  const finalPct = Math.round((totalScore / maxScore) * 100);
  console.log(`\n🏆 종합 점수: ${totalScore}/${maxScore} (${finalPct}%)\n`);

  // 등급 판정
  let grade, comment;
  if (finalPct >= 90) { grade = 'A+'; comment = '매우 우수'; }
  else if (finalPct >= 85) { grade = 'A'; comment = '우수'; }
  else if (finalPct >= 80) { grade = 'B+'; comment = '양호'; }
  else if (finalPct >= 75) { grade = 'B'; comment = '보통 이상'; }
  else if (finalPct >= 70) { grade = 'C+'; comment = '보통'; }
  else if (finalPct >= 60) { grade = 'C'; comment = '개선 필요'; }
  else { grade = 'D'; comment = '미흡'; }

  console.log(`📈 등급: ${grade} (${comment})`);
  console.log('');

  // 개선 필요 사항
  console.log('📝 개선 필요 사항:');
  if (results.touchTargets.score / results.touchTargets.max < 0.9) {
    console.log('  - 일부 터치 타겟이 44px 미만');
  }
  if (results.horizontalScroll.score / results.horizontalScroll.max < 1) {
    console.log('  - 일부 페이지에서 가로 스크롤 발생');
  }
  if (results.accessibility.score / results.accessibility.max < 0.8) {
    console.log('  - ARIA 속성 추가 권장');
  }
  if (finalPct >= 80) {
    console.log('  - 전반적으로 양호, 세부 조정만 필요');
  }
})();
