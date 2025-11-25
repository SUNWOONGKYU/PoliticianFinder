/**
 * 모바일 UI/UX 스크린샷 자동화 스크립트
 * 모든 주요 페이지를 모바일 뷰포트로 캡처하여 검토용 이미지 생성
 *
 * 실행: node scripts/mobile-screenshot.mjs
 */

import { chromium, devices } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:3000';

// 캡처할 페이지 목록
const PAGES_TO_CAPTURE = [
  { path: '/', name: 'home', description: '홈페이지' },
  { path: '/politicians', name: 'politicians-list', description: '정치인 목록' },
  { path: '/politicians/17270f25', name: 'politician-detail', description: '정치인 상세' },
  { path: '/community', name: 'community', description: '커뮤니티' },
  { path: '/auth/login', name: 'login', description: '로그인' },
  { path: '/auth/signup', name: 'signup', description: '회원가입' },
  { path: '/search', name: 'search', description: '검색' },
  { path: '/mypage', name: 'mypage', description: '마이페이지' },
  { path: '/favorites', name: 'favorites', description: '관심 정치인' },
  { path: '/notifications', name: 'notifications', description: '알림' },
  { path: '/settings', name: 'settings', description: '설정' },
  { path: '/notices', name: 'notices', description: '공지사항' },
  { path: '/support', name: 'support', description: '고객지원' },
  { path: '/terms', name: 'terms', description: '이용약관' },
  { path: '/privacy', name: 'privacy', description: '개인정보처리방침' },
];

// 모바일 디바이스 설정
const MOBILE_DEVICES = [
  { name: 'iPhone-14', device: devices['iPhone 14'] },
  { name: 'Galaxy-S9', device: devices['Galaxy S9+'] },
];

// 결과 저장용
const results = [];
const issues = [];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function setDarkMode(page, enabled) {
  await page.evaluate((darkMode) => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, enabled);
  await delay(500);
}

async function checkPageIssues(page, pageName) {
  const pageIssues = [];

  // 1. 가로 스크롤 체크
  const hasHorizontalScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  if (hasHorizontalScroll) {
    pageIssues.push('가로 스크롤 발생 - 컨텐츠가 화면 밖으로 넘침');
    issues.push({ page: pageName, description: '가로 스크롤 발생', severity: 'high' });
  }

  // 2. 터치 타겟 크기 체크 (44px 미만)
  const smallTouchTargets = await page.evaluate(() => {
    const clickables = document.querySelectorAll('button, a, input, select, [role="button"]');
    const small = [];
    clickables.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        if (rect.width < 44 || rect.height < 44) {
          const text = (el.textContent || '').trim().substring(0, 20);
          small.push(`${el.tagName.toLowerCase()}(${Math.round(rect.width)}x${Math.round(rect.height)}): "${text}"`);
        }
      }
    });
    return small.slice(0, 5);
  });
  if (smallTouchTargets.length > 0) {
    pageIssues.push(`작은 터치 타겟 발견: ${smallTouchTargets.join(', ')}`);
    issues.push({ page: pageName, description: `작은 터치 타겟 ${smallTouchTargets.length}개`, severity: 'medium' });
  }

  // 3. 텍스트 크기 체크 (12px 미만)
  const smallText = await page.evaluate(() => {
    const allText = document.querySelectorAll('p, span, div, a, button, label');
    let smallCount = 0;
    allText.forEach((el) => {
      const style = window.getComputedStyle(el);
      const fontSize = parseFloat(style.fontSize);
      if (fontSize < 12 && el.textContent && el.textContent.trim().length > 0) {
        smallCount++;
      }
    });
    return smallCount;
  });
  if (smallText > 5) {
    pageIssues.push(`작은 텍스트(12px 미만) ${smallText}개 발견`);
    issues.push({ page: pageName, description: `작은 텍스트 ${smallText}개`, severity: 'low' });
  }

  // 4. 이미지 alt 텍스트 체크
  const imagesWithoutAlt = await page.evaluate(() => {
    const images = document.querySelectorAll('img');
    let count = 0;
    images.forEach((img) => {
      if (!img.alt || img.alt.trim() === '') {
        count++;
      }
    });
    return count;
  });
  if (imagesWithoutAlt > 0) {
    pageIssues.push(`alt 텍스트 없는 이미지 ${imagesWithoutAlt}개`);
    issues.push({ page: pageName, description: `접근성: alt 텍스트 누락 ${imagesWithoutAlt}개`, severity: 'medium' });
  }

  // 5. 빈 컨텐츠 체크
  const hasEmptyContent = await page.evaluate(() => {
    const main = document.querySelector('main') || document.body;
    const text = main.textContent || '';
    return text.trim().length < 50;
  });
  if (hasEmptyContent) {
    pageIssues.push('페이지 컨텐츠가 거의 없음');
    issues.push({ page: pageName, description: '빈 페이지 또는 컨텐츠 부족', severity: 'high' });
  }

  // 6. 오버플로우 요소 체크
  const overflowElements = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    let count = 0;
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.right > window.innerWidth + 10) {
        count++;
      }
    });
    return count;
  });
  if (overflowElements > 0) {
    pageIssues.push(`화면 밖으로 넘치는 요소 ${overflowElements}개`);
  }

  return pageIssues;
}

async function captureFullPage(page, filePath) {
  // 전체 페이지 스크롤하여 lazy load 컨텐츠 로드
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 300;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          window.scrollTo(0, 0);
          resolve();
        }
      }, 100);
    });
  });

  await delay(500);
  await page.screenshot({ path: filePath, fullPage: true });
}

async function runScreenshots() {
  console.log('🚀 모바일 스크린샷 자동화 시작...\n');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const outputDir = path.join(__dirname, '..', 'screenshots', timestamp);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  for (const deviceConfig of MOBILE_DEVICES) {
    console.log(`📱 디바이스: ${deviceConfig.name}`);

    const context = await browser.newContext({
      ...deviceConfig.device,
      locale: 'ko-KR',
    });

    const page = await context.newPage();

    for (const pageConfig of PAGES_TO_CAPTURE) {
      console.log(`  📄 ${pageConfig.description} (${pageConfig.path})`);

      for (const theme of ['light', 'dark']) {
        try {
          await page.goto(`${BASE_URL}${pageConfig.path}`, {
            waitUntil: 'networkidle',
            timeout: 30000
          });

          await setDarkMode(page, theme === 'dark');
          await delay(1000);

          // 이슈 체크
          const pageIssues = await checkPageIssues(page, `${pageConfig.name}-${theme}`);

          // 스크린샷 저장
          const fileName = `${deviceConfig.name}_${pageConfig.name}_${theme}.png`;
          const filePath = path.join(outputDir, fileName);

          await captureFullPage(page, filePath);

          results.push({
            page: pageConfig.description,
            device: deviceConfig.name,
            theme,
            path: fileName,
            issues: pageIssues,
          });

          console.log(`    ✅ ${theme} 모드 캡처 완료${pageIssues.length > 0 ? ` (이슈 ${pageIssues.length}개)` : ''}`);

        } catch (error) {
          console.log(`    ❌ ${theme} 모드 실패: ${error.message}`);
          issues.push({
            page: pageConfig.name,
            description: `페이지 로드 실패: ${error.message}`,
            severity: 'high'
          });
        }
      }
    }

    await context.close();
  }

  await browser.close();

  // 결과 리포트 생성
  const reportPath = path.join(outputDir, 'REPORT.md');
  generateReport(reportPath, timestamp);

  // JSON 결과도 저장
  const jsonPath = path.join(outputDir, 'results.json');
  fs.writeFileSync(jsonPath, JSON.stringify({ results, issues }, null, 2), 'utf-8');

  console.log(`\n✅ 스크린샷 완료!`);
  console.log(`📁 저장 위치: ${outputDir}`);
  console.log(`📋 리포트: ${reportPath}`);
  console.log(`\n발견된 이슈: ${issues.length}개`);

  if (issues.length > 0) {
    console.log('\n⚠️ 주요 이슈:');
    const highIssues = issues.filter(i => i.severity === 'high');
    const mediumIssues = issues.filter(i => i.severity === 'medium');

    if (highIssues.length > 0) {
      console.log('  🔴 높음:');
      highIssues.forEach(i => console.log(`     - [${i.page}] ${i.description}`));
    }
    if (mediumIssues.length > 0) {
      console.log('  🟡 중간:');
      mediumIssues.forEach(i => console.log(`     - [${i.page}] ${i.description}`));
    }
  }

  return { outputDir, issues };
}

function generateReport(filePath, timestamp) {
  let report = `# 모바일 UI/UX 스크린샷 리포트

**생성 시간**: ${timestamp}
**검사 페이지**: ${PAGES_TO_CAPTURE.length}개
**디바이스**: ${MOBILE_DEVICES.map(d => d.name).join(', ')}
**테마**: Light / Dark

---

## 📊 요약

- **총 스크린샷**: ${results.length}개
- **발견된 이슈**: ${issues.length}개
  - 🔴 높음: ${issues.filter(i => i.severity === 'high').length}개
  - 🟡 중간: ${issues.filter(i => i.severity === 'medium').length}개
  - 🟢 낮음: ${issues.filter(i => i.severity === 'low').length}개

---

## ⚠️ 발견된 이슈

`;

  if (issues.length === 0) {
    report += '이슈가 발견되지 않았습니다! 🎉\n';
  } else {
    const highIssues = issues.filter(i => i.severity === 'high');
    const mediumIssues = issues.filter(i => i.severity === 'medium');
    const lowIssues = issues.filter(i => i.severity === 'low');

    if (highIssues.length > 0) {
      report += '### 🔴 높은 심각도\n\n';
      highIssues.forEach(i => {
        report += `- **[${i.page}]** ${i.description}\n`;
      });
      report += '\n';
    }

    if (mediumIssues.length > 0) {
      report += '### 🟡 중간 심각도\n\n';
      mediumIssues.forEach(i => {
        report += `- **[${i.page}]** ${i.description}\n`;
      });
      report += '\n';
    }

    if (lowIssues.length > 0) {
      report += '### 🟢 낮은 심각도\n\n';
      lowIssues.forEach(i => {
        report += `- **[${i.page}]** ${i.description}\n`;
      });
      report += '\n';
    }
  }

  report += `---

## 📸 스크린샷 목록

| 페이지 | 디바이스 | 테마 | 파일명 | 이슈 |
|--------|----------|------|--------|------|
`;

  results.forEach(r => {
    const issueCount = r.issues.length > 0 ? `⚠️ ${r.issues.length}개` : '✅';
    report += `| ${r.page} | ${r.device} | ${r.theme} | ${r.path} | ${issueCount} |\n`;
  });

  report += `
---

## 📝 페이지별 상세 이슈

`;

  const pageGroups = new Map();
  results.forEach(r => {
    const key = r.page;
    if (!pageGroups.has(key)) {
      pageGroups.set(key, []);
    }
    pageGroups.get(key).push(r);
  });

  pageGroups.forEach((pageResults, pageName) => {
    const allIssues = pageResults.flatMap(r => r.issues);
    if (allIssues.length > 0) {
      report += `### ${pageName}\n\n`;
      const uniqueIssues = [...new Set(allIssues)];
      uniqueIssues.forEach(issue => {
        report += `- ${issue}\n`;
      });
      report += '\n';
    }
  });

  report += `---

## 🔧 권장 수정 사항

### 가로 스크롤 문제
- \`overflow-x: hidden\` 또는 컨테이너 \`max-width: 100%\` 확인
- 고정 너비 요소를 반응형으로 변경

### 작은 터치 타겟
- 버튼/링크 최소 크기: 44x44px
- \`min-h-touch\`, \`min-w-touch\` 클래스 적용

### 작은 텍스트
- 최소 폰트 크기: 14px (본문), 12px (보조)
- \`text-sm\` 이상 사용 권장

### 접근성 (alt 텍스트)
- 모든 이미지에 의미 있는 alt 텍스트 추가
- 장식용 이미지는 \`alt=""\` 사용

---

*이 리포트는 Playwright 자동화 스크립트로 생성되었습니다.*
`;

  fs.writeFileSync(filePath, report, 'utf-8');
}

// 실행
runScreenshots().catch(console.error);
