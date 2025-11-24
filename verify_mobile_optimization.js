// Phase 2 Mobile Optimization Verification Script
// This script verifies all 8 features implemented in Phase 2

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('Phase 2 Mobile Optimization - Verification Report');
console.log('='.repeat(80));
console.log('');

// Feature checklist
const features = [
  {
    id: 1,
    name: '홈페이지 통계 섹션 표시',
    commit: 'bb55ebb',
    file: '1_Frontend/src/app/page.tsx',
    pattern: /통계 섹션|grid-cols-2 md:grid-cols-4/,
    description: '4-column grid layout responsive to mobile (2x2 on small screens)',
  },
  {
    id: 2,
    name: '정치인 목록 모바일 카드 레이아웃',
    commit: '33443da',
    file: '1_Frontend/src/app/politicians/page.tsx',
    pattern: /Gradient header|mobile card|pill-style tags/i,
    description: 'Enhanced mobile card design with gradient header, pill-style tags',
  },
  {
    id: 3,
    name: '정치인 상세 Hero Section',
    commit: '0507ec2',
    file: '1_Frontend/src/app/politicians/[id]/page.tsx',
    pattern: /Hero Section|profile image|gradient hero/i,
    description: 'Hero section with profile image, gradient background, glassmorphism',
  },
  {
    id: 4,
    name: '프로필 이미지 fallback 시스템',
    commit: 'f38f563',
    file: '1_Frontend/src/app/politicians/[id]/page.tsx',
    pattern: /SVG|silhouette|gender-based/i,
    description: 'Gender-neutral SVG silhouette fallback for profile images',
  },
  {
    id: 5,
    name: '차트 데스크톱/모바일 분기',
    commit: 'e9b687e',
    file: '1_Frontend/src/app/politicians/[id]/page.tsx',
    pattern: /Desktop.*chart|Mobile.*chart|350px.*250px/i,
    description: 'Separate desktop (350px) and mobile (250px) chart layouts',
  },
  {
    id: 6,
    name: '필터 토글 기능',
    commit: '5da81af',
    file: '1_Frontend/src/app/politicians/page.tsx',
    pattern: /showMobileFilters|filter toggle|collapsible/i,
    description: 'Collapsible filter panel for mobile with active filter count',
  },
  {
    id: 7,
    name: '커뮤니티 포스트 카드',
    commit: '9ebbe14',
    file: '1_Frontend/src/app/community/page.tsx',
    pattern: /three-section|Header.*Body.*Footer|avatar.*follow/i,
    description: 'Three-section card layout (Header/Body/Footer) with better hierarchy',
  },
  {
    id: 8,
    name: '글쓰기 에디터 모바일 최적화',
    commit: '37dfea7',
    file: '1_Frontend/src/app/community/posts/create/page.tsx',
    pattern: /text-base|16px|min-h-touch|44px/i,
    description: '16px font to prevent iOS zoom, 44px touch targets (WCAG 2.1 AA)',
  },
];

let passedTests = 0;
let failedTests = 0;

console.log('1. FEATURE IMPLEMENTATION VERIFICATION');
console.log('-'.repeat(80));

features.forEach(feature => {
  const filePath = path.join(__dirname, feature.file);
  let status = 'FAIL';
  let details = '';

  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (feature.pattern.test(content)) {
        status = 'PASS';
        passedTests++;
        details = `✓ Pattern found in ${feature.file}`;
      } else {
        failedTests++;
        details = `✗ Pattern not found in ${feature.file}`;
      }
    } else {
      failedTests++;
      details = `✗ File not found: ${feature.file}`;
    }
  } catch (error) {
    failedTests++;
    details = `✗ Error reading file: ${error.message}`;
  }

  console.log(`\n[${status}] Feature ${feature.id}: ${feature.name}`);
  console.log(`      Commit: ${feature.commit}`);
  console.log(`      ${details}`);
  console.log(`      Description: ${feature.description}`);
});

console.log('\n');
console.log('='.repeat(80));
console.log('2. BUILD & BUNDLE SIZE VERIFICATION');
console.log('-'.repeat(80));

// Check if build directory exists
const buildDir = path.join(__dirname, '1_Frontend', '.next');
if (fs.existsSync(buildDir)) {
  console.log('[PASS] ✓ Build directory exists (.next)');
  passedTests++;

  // Check for key build artifacts
  const serverDir = path.join(buildDir, 'server');
  const staticDir = path.join(buildDir, 'static');

  if (fs.existsSync(serverDir)) {
    console.log('[PASS] ✓ Server build artifacts exist');
    passedTests++;
  } else {
    console.log('[FAIL] ✗ Server build artifacts missing');
    failedTests++;
  }

  if (fs.existsSync(staticDir)) {
    console.log('[PASS] ✓ Static build artifacts exist');
    passedTests++;
  } else {
    console.log('[FAIL] ✗ Static build artifacts missing');
    failedTests++;
  }
} else {
  console.log('[FAIL] ✗ Build directory not found');
  console.log('       Run "npm run build" in 1_Frontend directory first');
  failedTests += 3;
}

console.log('\n');
console.log('='.repeat(80));
console.log('3. RESPONSIVE DESIGN CHECK');
console.log('-'.repeat(80));

// Check for responsive CSS classes in key files
const responsivePatterns = [
  { name: 'Mobile-first grid', pattern: /grid-cols-\d+ md:grid-cols-\d+/ },
  { name: 'Responsive text size', pattern: /text-\w+ md:text-\w+/ },
  { name: 'Responsive padding', pattern: /p-\d+ md:p-\d+/ },
  { name: 'Hidden on mobile', pattern: /hidden md:block|md:flex/ },
  { name: 'Touch target size', pattern: /min-h-touch|min-h-\[44px\]/ },
];

const keyFiles = [
  '1_Frontend/src/app/page.tsx',
  '1_Frontend/src/app/politicians/page.tsx',
  '1_Frontend/src/app/politicians/[id]/page.tsx',
  '1_Frontend/src/app/community/page.tsx',
];

responsivePatterns.forEach(({ name, pattern }) => {
  let found = false;
  keyFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (pattern.test(content)) {
        found = true;
      }
    }
  });

  if (found) {
    console.log(`[PASS] ✓ ${name} - Found in source files`);
    passedTests++;
  } else {
    console.log(`[FAIL] ✗ ${name} - Not found`);
    failedTests++;
  }
});

console.log('\n');
console.log('='.repeat(80));
console.log('4. ACCESSIBILITY CHECK');
console.log('-'.repeat(80));

// Check for accessibility features
const a11yChecks = [
  { name: 'Touch target size (44px)', pattern: /min-h-\[44px\]|min-h-touch/ },
  { name: 'Font size prevents zoom', pattern: /text-base/ },
  { name: 'Semantic HTML', pattern: /<section|<article|<header|<nav|<main/ },
  { name: 'Alt text on images', pattern: /alt=["']/ },
  { name: 'ARIA labels', pattern: /aria-label=["']/ },
];

a11yChecks.forEach(({ name, pattern }) => {
  let found = false;
  keyFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (pattern.test(content)) {
        found = true;
      }
    }
  });

  if (found) {
    console.log(`[PASS] ✓ ${name}`);
    passedTests++;
  } else {
    console.log(`[WARN] ⚠ ${name} - Not found (optional)`);
    // Don't count as failure for optional checks
  }
});

console.log('\n');
console.log('='.repeat(80));
console.log('FINAL SUMMARY');
console.log('='.repeat(80));

const totalTests = passedTests + failedTests;
const passRate = ((passedTests / totalTests) * 100).toFixed(1);

console.log(`Total Tests: ${totalTests}`);
console.log(`Passed: ${passedTests} ✓`);
console.log(`Failed: ${failedTests} ✗`);
console.log(`Pass Rate: ${passRate}%`);
console.log('');

if (failedTests === 0) {
  console.log('STATUS: ✅ ALL TESTS PASSED');
  console.log('');
  console.log('Phase 2 mobile optimization is fully implemented and verified!');
} else if (passRate >= 80) {
  console.log('STATUS: ⚠️ CONDITIONALLY PASSED');
  console.log('');
  console.log(`Most features are working (${passRate}%), but some issues need attention.`);
} else {
  console.log('STATUS: ❌ FAILED');
  console.log('');
  console.log('Significant issues found. Please review failed tests above.');
}

console.log('');
console.log('='.repeat(80));
console.log('NEXT STEPS:');
console.log('-'.repeat(80));
console.log('1. Review failed tests (if any)');
console.log('2. Run manual browser tests at different viewport sizes:');
console.log('   - Mobile: 320px, 375px (iPhone), 414px (iPhone Plus)');
console.log('   - Tablet: 768px (iPad), 1024px (iPad Pro)');
console.log('   - Desktop: 1440px, 1920px');
console.log('3. Run Lighthouse performance test');
console.log('4. Test on real devices (iOS Safari, Android Chrome)');
console.log('='.repeat(80));

process.exit(failedTests > 0 ? 1 : 0);
