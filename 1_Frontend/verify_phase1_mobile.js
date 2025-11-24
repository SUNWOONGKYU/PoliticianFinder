/**
 * Phase 1 Mobile Optimization Manual Verification Script
 *
 * This script performs automated checks on the code to verify:
 * - Filter tag implementation
 * - Touch target sizes
 * - iOS auto-zoom prevention
 * - FAB button routing
 * - Empty states
 * - 404 page navigation
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const results = {
  passed: [],
  failed: [],
  warnings: [],
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkPassed(test) {
  results.passed.push(test);
  log(`✅ PASS: ${test}`, colors.green);
}

function checkFailed(test, reason) {
  results.failed.push({ test, reason });
  log(`❌ FAIL: ${test}`, colors.red);
  log(`   Reason: ${reason}`, colors.red);
}

function checkWarning(test, reason) {
  results.warnings.push({ test, reason });
  log(`⚠️  WARN: ${test}`, colors.yellow);
  log(`   Reason: ${reason}`, colors.yellow);
}

function readFile(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    return fs.readFileSync(fullPath, 'utf8');
  } catch (err) {
    return null;
  }
}

// ============================================
// TEST SUITE 1: Politicians Page Filter Tags
// ============================================
log('\n' + '='.repeat(60), colors.cyan);
log('TEST SUITE 1: Politicians Page Filter Tags', colors.bold + colors.cyan);
log('='.repeat(60), colors.cyan);

const politiciansPage = readFile('src/app/politicians/page.tsx');

if (!politiciansPage) {
  checkFailed('Politicians Page File', 'File not found');
} else {
  // Test 1.1: Active Filters Display
  if (politiciansPage.includes('활성 필터:') && politiciansPage.includes('identityFilter ||')) {
    checkPassed('Filter tags container exists');
  } else {
    checkFailed('Filter tags container', 'Active filters section not found');
  }

  // Test 1.2: Individual Filter Remove Buttons
  const hasIdentityRemove = politiciansPage.includes('onClick={() => setIdentityFilter(\'\'\)}');
  const hasCategoryRemove = politiciansPage.includes('onClick={() => setCategoryFilter(\'\'\)}');
  const hasPartyRemove = politiciansPage.includes('onClick={() => setPartyFilter(\'\'\)}');
  const hasRegionRemove = politiciansPage.includes('onClick={() => setRegionFilter(\'\'\)}');
  const hasGradeRemove = politiciansPage.includes('onClick={() => setGradeFilter(\'\'\)}');

  if (hasIdentityRemove && hasCategoryRemove && hasPartyRemove && hasRegionRemove && hasGradeRemove) {
    checkPassed('All individual filter remove buttons implemented');
  } else {
    checkFailed('Individual filter remove buttons', 'Some remove buttons are missing');
  }

  // Test 1.3: Touch Target Size Classes
  const hasTouchClasses = politiciansPage.includes('min-w-touch') && politiciansPage.includes('min-h-touch');
  if (hasTouchClasses) {
    checkPassed('Touch target size classes (min-w-touch, min-h-touch) applied');
  } else {
    checkFailed('Touch target size classes', 'min-w-touch or min-h-touch classes not found');
  }

  // Test 1.4: Touch Manipulation Class
  const hasTouchManipulation = politiciansPage.includes('touch-manipulation');
  if (hasTouchManipulation) {
    checkPassed('touch-manipulation class applied for better mobile UX');
  } else {
    checkWarning('touch-manipulation class', 'Consider adding for better mobile performance');
  }

  // Test 1.5: Full Reset Button
  const hasResetButton = politiciansPage.includes('handleResetFilters') &&
                         politiciansPage.includes('전체 초기화');
  if (hasResetButton) {
    checkPassed('Full reset button ("전체 초기화") implemented');
  } else {
    checkFailed('Full reset button', 'Reset button not found');
  }

  // Test 1.6: Flex Wrap Layout
  const hasFlexWrap = politiciansPage.includes('flex-wrap');
  if (hasFlexWrap) {
    checkPassed('Flex wrap layout for filter tags (responsive)');
  } else {
    checkWarning('Flex wrap layout', 'Filter tags might not wrap properly on small screens');
  }

  // Test 1.7: Empty State with Reset Button
  const hasEmptyStateReset = politiciansPage.includes('필터 초기화') &&
                            politiciansPage.includes('검색 결과가 없습니다');
  if (hasEmptyStateReset) {
    checkPassed('Empty state with reset button implemented');
  } else {
    checkFailed('Empty state reset button', 'Empty state might be missing reset functionality');
  }
}

// ============================================
// TEST SUITE 2: Search Input iOS Auto-zoom Prevention
// ============================================
log('\n' + '='.repeat(60), colors.cyan);
log('TEST SUITE 2: Search Input iOS Auto-zoom Prevention', colors.bold + colors.cyan);
log('='.repeat(60), colors.cyan);

if (politiciansPage) {
  // Test 2.1: type="search"
  const hasTypeSearch = politiciansPage.match(/type=["']search["']/g);
  if (hasTypeSearch && hasTypeSearch.length >= 1) {
    checkPassed(`Search input has type="search" (${hasTypeSearch.length} instances)`);
  } else {
    checkFailed('type="search"', 'Search input missing type="search"');
  }

  // Test 2.2: inputMode="search"
  const hasInputModeSearch = politiciansPage.match(/inputMode=["']search["']/g);
  if (hasInputModeSearch && hasInputModeSearch.length >= 1) {
    checkPassed(`Search input has inputMode="search" (${hasInputModeSearch.length} instances)`);
  } else {
    checkFailed('inputMode="search"', 'Search input missing inputMode="search"');
  }

  // Test 2.3: Font size (text-base or larger)
  const hasTextBase = politiciansPage.includes('text-base');
  if (hasTextBase) {
    checkPassed('Search input has text-base class (16px, prevents iOS zoom)');
  } else {
    checkWarning('Font size', 'Search input might trigger iOS auto-zoom (needs 16px+ font)');
  }
}

// ============================================
// TEST SUITE 3: Community Page FAB Button
// ============================================
log('\n' + '='.repeat(60), colors.cyan);
log('TEST SUITE 3: Community Page FAB Button', colors.bold + colors.cyan);
log('='.repeat(60), colors.cyan);

const communityPage = readFile('src/app/community/page.tsx');

if (!communityPage) {
  checkFailed('Community Page File', 'File not found');
} else {
  // Test 3.1: FAB Button Exists
  const hasFAB = communityPage.includes('aria-label="글쓰기"') ||
                 communityPage.includes('title="글쓰기"');
  if (hasFAB) {
    checkPassed('FAB button exists with proper aria-label');
  } else {
    checkFailed('FAB button', 'FAB button not found or missing accessibility label');
  }

  // Test 3.2: Fixed Positioning
  const hasFixedPosition = communityPage.includes('fixed bottom-6 right-6');
  if (hasFixedPosition) {
    checkPassed('FAB button has fixed positioning');
  } else {
    checkFailed('FAB fixed positioning', 'FAB might not stay fixed on scroll');
  }

  // Test 3.3: Category-based Routing
  const hasModalLogic = communityPage.includes("currentCategory === 'all'") &&
                        communityPage.includes('setShowCategoryModal(true)');
  const hasPoliticianRoute = communityPage.includes("currentCategory === 'politician_post'") &&
                             communityPage.includes('/community/posts/create-politician');
  const hasGeneralRoute = communityPage.includes('/community/posts/create');

  if (hasModalLogic && hasPoliticianRoute && hasGeneralRoute) {
    checkPassed('FAB button has correct routing logic for all categories');
  } else {
    checkFailed('FAB routing logic', 'Category-based routing might be incomplete');
  }

  // Test 3.4: Touch Target Size
  const hasFABSize = communityPage.includes('w-14 h-14') ||
                     communityPage.includes('w-16 h-16');
  if (hasFABSize) {
    checkPassed('FAB button has adequate size (56px or 64px)');
  } else {
    checkWarning('FAB size', 'FAB button size might be too small for touch');
  }

  // Test 3.5: Category Modal
  const hasCategoryModal = communityPage.includes('showCategoryModal') &&
                          communityPage.includes('카테고리 선택');
  if (hasCategoryModal) {
    checkPassed('Category selection modal implemented');
  } else {
    checkFailed('Category modal', 'Modal for category selection not found');
  }

  // Test 3.6: Search Input Attributes
  const hasSearchInputMode = communityPage.includes('inputMode="search"');
  const hasSearchType = communityPage.includes('type="search"');
  if (hasSearchInputMode && hasSearchType) {
    checkPassed('Community page search input has correct mobile attributes');
  } else {
    checkWarning('Search attributes', 'Search input might trigger iOS auto-zoom');
  }
}

// ============================================
// TEST SUITE 4: Empty States
// ============================================
log('\n' + '='.repeat(60), colors.cyan);
log('TEST SUITE 4: Empty States', colors.bold + colors.cyan);
log('='.repeat(60), colors.cyan);

if (politiciansPage) {
  // Test 4.1: Politicians Page Empty State
  const hasPoliticiansEmptyState = politiciansPage.includes('검색 결과가 없습니다') &&
                                   politiciansPage.includes('다른 검색어나 필터 조건을 시도해보세요');
  if (hasPoliticiansEmptyState) {
    checkPassed('Politicians page empty state message');
  } else {
    checkFailed('Politicians empty state', 'Empty state message not found');
  }

  // Test 4.2: Politicians Empty State Action Button
  const hasPoliticiansEmptyAction = politiciansPage.includes('필터 초기화') &&
                                    politiciansPage.includes('min-h-touch');
  if (hasPoliticiansEmptyAction) {
    checkPassed('Politicians empty state has action button with touch target');
  } else {
    checkWarning('Politicians empty action', 'Empty state action button might be missing');
  }
}

if (communityPage) {
  // Test 4.3: Community Empty State Messages
  const hasAllEmptyMsg = communityPage.includes('게시글이 없습니다');
  const hasPoliticianEmptyMsg = communityPage.includes('정치인이 작성한 게시글이 없습니다');
  const hasGeneralEmptyMsg = communityPage.includes('회원이 작성한 게시글이 없습니다');

  if (hasAllEmptyMsg && hasPoliticianEmptyMsg && hasGeneralEmptyMsg) {
    checkPassed('Community page has category-specific empty state messages');
  } else {
    checkFailed('Community empty states', 'Some empty state messages are missing');
  }

  // Test 4.4: Community Empty State Action Button
  const hasCommunityEmptyAction = communityPage.includes('첫 게시글을 작성해보세요!') &&
                                  communityPage.includes('min-h-touch');
  if (hasCommunityEmptyAction) {
    checkPassed('Community empty state has action button with touch target');
  } else {
    checkWarning('Community empty action', 'Empty state action might not meet touch target size');
  }
}

// ============================================
// TEST SUITE 5: 404 Page Navigation
// ============================================
log('\n' + '='.repeat(60), colors.cyan);
log('TEST SUITE 5: 404 Page Navigation', colors.bold + colors.cyan);
log('='.repeat(60), colors.cyan);

const notFoundPage = readFile('src/app/not-found.tsx');

if (!notFoundPage) {
  checkFailed('404 Page File', 'not-found.tsx not found');
} else {
  // Test 5.1: 404 Message
  const has404Message = notFoundPage.includes('404') &&
                       notFoundPage.includes('페이지를 찾을 수 없습니다');
  if (has404Message) {
    checkPassed('404 page has proper error message');
  } else {
    checkFailed('404 message', '404 error message not found');
  }

  // Test 5.2: Home Button
  const hasHomeButton = notFoundPage.includes("router.push('/')") &&
                       notFoundPage.includes('홈으로 돌아가기');
  if (hasHomeButton) {
    checkPassed('404 page has home button');
  } else {
    checkFailed('Home button', 'Home button not found or not functional');
  }

  // Test 5.3: Politicians Search Button
  const hasPoliticiansButton = notFoundPage.includes("router.push('/politicians')") &&
                               notFoundPage.includes('정치인 검색하기');
  if (hasPoliticiansButton) {
    checkPassed('404 page has politicians search button');
  } else {
    checkFailed('Politicians button', 'Politicians search button not found');
  }

  // Test 5.4: Community Button
  const hasCommunityButton = notFoundPage.includes("router.push('/community')") &&
                            notFoundPage.includes('커뮤니티 보기');
  if (hasCommunityButton) {
    checkPassed('404 page has community button');
  } else {
    checkFailed('Community button', 'Community button not found');
  }

  // Test 5.5: Back Button
  const hasBackButton = notFoundPage.includes('router.back()') &&
                       notFoundPage.includes('이전 페이지로');
  if (hasBackButton) {
    checkPassed('404 page has back button');
  } else {
    checkFailed('Back button', 'Back button not found');
  }

  // Test 5.6: Touch Target Sizes
  const hasTouchTargets = notFoundPage.includes('min-h-touch');
  if (hasTouchTargets) {
    checkPassed('404 page buttons have touch target size classes');
  } else {
    checkWarning('Touch targets', '404 buttons might not meet minimum touch size');
  }

  // Test 5.7: Mobile-friendly Layout
  const hasResponsiveLayout = notFoundPage.includes('max-w-md') ||
                             notFoundPage.includes('px-4');
  if (hasResponsiveLayout) {
    checkPassed('404 page has mobile-friendly layout');
  } else {
    checkWarning('Mobile layout', '404 page might not be optimized for mobile');
  }
}

// ============================================
// TEST SUITE 6: Tailwind Config
// ============================================
log('\n' + '='.repeat(60), colors.cyan);
log('TEST SUITE 6: Tailwind Config', colors.bold + colors.cyan);
log('='.repeat(60), colors.cyan);

const tailwindConfig = readFile('tailwind.config.ts');

if (!tailwindConfig) {
  checkFailed('Tailwind Config', 'tailwind.config.ts not found');
} else {
  // Test 6.1: min-h-touch
  const hasMinHeightTouch = tailwindConfig.includes("'touch': '44px'") &&
                           tailwindConfig.includes('minHeight');
  if (hasMinHeightTouch) {
    checkPassed("Tailwind config has minHeight: { 'touch': '44px' }");
  } else {
    checkFailed('minHeight touch', 'Touch target minimum height not configured');
  }

  // Test 6.2: min-w-touch
  const hasMinWidthTouch = tailwindConfig.includes("'touch': '44px'") &&
                          tailwindConfig.includes('minWidth');
  if (hasMinWidthTouch) {
    checkPassed("Tailwind config has minWidth: { 'touch': '44px' }");
  } else {
    checkFailed('minWidth touch', 'Touch target minimum width not configured');
  }

  // Test 6.3: Comment explaining WCAG
  const hasWCAGComment = tailwindConfig.includes('WCAG') ||
                        tailwindConfig.includes('터치 타겟');
  if (hasWCAGComment) {
    checkPassed('Tailwind config has WCAG compliance comment');
  } else {
    checkWarning('WCAG comment', 'Consider adding comment explaining WCAG touch target requirement');
  }
}

// ============================================
// SUMMARY
// ============================================
log('\n' + '='.repeat(60), colors.bold);
log('TEST SUMMARY', colors.bold + colors.cyan);
log('='.repeat(60), colors.bold);

log(`\n${colors.green}✅ Passed: ${results.passed.length}${colors.reset}`);
results.passed.forEach(test => {
  log(`   • ${test}`, colors.green);
});

if (results.warnings.length > 0) {
  log(`\n${colors.yellow}⚠️  Warnings: ${results.warnings.length}${colors.reset}`);
  results.warnings.forEach(item => {
    log(`   • ${item.test}`, colors.yellow);
    log(`     ${item.reason}`, colors.yellow);
  });
}

if (results.failed.length > 0) {
  log(`\n${colors.red}❌ Failed: ${results.failed.length}${colors.reset}`);
  results.failed.forEach(item => {
    log(`   • ${item.test}`, colors.red);
    log(`     ${item.reason}`, colors.red);
  });
}

const totalTests = results.passed.length + results.warnings.length + results.failed.length;
const passRate = ((results.passed.length / totalTests) * 100).toFixed(1);

log(`\n${colors.bold}Overall: ${results.passed.length}/${totalTests} tests passed (${passRate}%)${colors.reset}`);

if (results.failed.length === 0) {
  log(`\n${colors.green}${colors.bold}🎉 All critical tests passed!${colors.reset}`);
  if (results.warnings.length > 0) {
    log(`${colors.yellow}   (${results.warnings.length} warnings to review)${colors.reset}`);
  }
} else {
  log(`\n${colors.red}${colors.bold}⚠️  ${results.failed.length} critical test(s) failed. Please review.${colors.reset}`);
}

log('\n' + '='.repeat(60) + '\n');

// Exit with appropriate code
process.exit(results.failed.length > 0 ? 1 : 0);
