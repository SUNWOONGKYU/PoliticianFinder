const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const iPhone = devices['iPhone 14'];
  const context = await browser.newContext({ ...iPhone });
  const page = await context.newPage();

  const url = 'https://politician-finder-9x5m9kcr8-finder-world.vercel.app';
  const results = [];

  console.log('=== PoliticianFinder 정치인/관리자 기능 테스트 ===\n');

  // Part 1: 정치인 관련 기능 (회원으로 로그인하여 테스트)
  console.log('[ Part 1: 정치인 관련 기능 테스트 ]\n');

  // 1. 로그인
  console.log('1. 회원 로그인...');
  await page.goto(url + '/auth/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.fill('input[name="email"]', 'wksun999@naver.com');
  await page.fill('input[name="password"]', 'na5215900');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  const loginOk = !page.url().includes('login');
  results.push({ name: '회원 로그인', pass: loginOk, category: '정치인' });
  console.log('   ' + (loginOk ? '✅' : '❌') + ' 로그인');

  // 2. 정치인 상세 페이지
  console.log('2. 정치인 상세...');
  await page.goto(url + '/politicians/9dc9f3b4', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const polDetailContent = await page.content();
  const polDetailOk = polDetailContent.includes('안태준') || polDetailContent.includes('평가');
  results.push({ name: '정치인 상세 페이지', pass: polDetailOk, category: '정치인' });
  console.log('   ' + (polDetailOk ? '✅' : '❌') + ' 정치인 상세');

  // 3. 정치인 평가 UI
  console.log('3. 정치인 평가 UI...');
  const hasRatingUI = polDetailContent.includes('평가') || polDetailContent.includes('별점') ||
                      polDetailContent.includes('점수') || polDetailContent.includes('star');
  results.push({ name: '정치인 평가 UI', pass: hasRatingUI, category: '정치인' });
  console.log('   ' + (hasRatingUI ? '✅' : '❌') + ' 평가 UI');

  // 4. 정치인 프로필 탭
  console.log('4. 정치인 프로필 탭...');
  await page.goto(url + '/politicians/9dc9f3b4/profile', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const profileContent = await page.content();
  const profileTabOk = profileContent.includes('프로필') || profileContent.includes('경력') ||
                       profileContent.includes('이력') || profileContent.includes('안태준');
  results.push({ name: '정치인 프로필 탭', pass: profileTabOk, category: '정치인' });
  console.log('   ' + (profileTabOk ? '✅' : '❌') + ' 프로필 탭');

  // 5. 정치인 댓글 기능
  console.log('5. 정치인 댓글 UI...');
  const hasCommentUI = polDetailContent.includes('댓글') || polDetailContent.includes('의견') ||
                       polDetailContent.includes('comment');
  results.push({ name: '정치인 댓글 UI', pass: hasCommentUI, category: '정치인' });
  console.log('   ' + (hasCommentUI ? '✅' : '❌') + ' 댓글 UI');

  // Part 2: 관리자 기능 테스트
  console.log('\n[ Part 2: 관리자 기능 테스트 ]\n');

  // 6. 관리자 로그인 페이지
  console.log('6. 관리자 로그인 페이지...');
  await page.goto(url + '/admin/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const adminLoginContent = await page.content();
  const adminLoginPageOk = adminLoginContent.includes('관리자') || adminLoginContent.includes('비밀번호');
  results.push({ name: '관리자 로그인 페이지', pass: adminLoginPageOk, category: '관리자' });
  console.log('   ' + (adminLoginPageOk ? '✅' : '❌') + ' 관리자 로그인 페이지');

  // 7. 관리자 로그인
  console.log('7. 관리자 로그인...');
  await page.fill('input[type="password"]', 'admin1234');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  const adminLoginOk = page.url().includes('/admin') && !page.url().includes('login');
  results.push({ name: '관리자 로그인', pass: adminLoginOk, category: '관리자' });
  console.log('   ' + (adminLoginOk ? '✅' : '❌') + ' 관리자 로그인');

  // 8. 관리자 대시보드
  console.log('8. 관리자 대시보드...');
  await page.goto(url + '/admin', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const adminContent = await page.content();
  const adminDashOk = adminContent.includes('관리') || adminContent.includes('대시보드') ||
                      adminContent.includes('통계') || adminContent.includes('Dashboard');
  results.push({ name: '관리자 대시보드', pass: adminDashOk, category: '관리자' });
  console.log('   ' + (adminDashOk ? '✅' : '❌') + ' 대시보드');

  // 9. 사용자 관리
  console.log('9. 사용자 관리...');
  await page.goto(url + '/admin/users', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const usersContent = await page.content();
  const usersOk = usersContent.includes('사용자') || usersContent.includes('회원') ||
                  usersContent.includes('user') || usersContent.includes('목록');
  results.push({ name: '사용자 관리', pass: usersOk, category: '관리자' });
  console.log('   ' + (usersOk ? '✅' : '❌') + ' 사용자 관리');

  // 10. 게시글 관리
  console.log('10. 게시글 관리...');
  await page.goto(url + '/admin/posts', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const postsContent = await page.content();
  const postsOk = postsContent.includes('게시글') || postsContent.includes('글') ||
                  postsContent.includes('post') || postsContent.includes('관리');
  results.push({ name: '게시글 관리', pass: postsOk, category: '관리자' });
  console.log('   ' + (postsOk ? '✅' : '❌') + ' 게시글 관리');

  // 11. 정치인 관리
  console.log('11. 정치인 관리...');
  await page.goto(url + '/admin/politicians', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const polAdminContent = await page.content();
  const polAdminOk = polAdminContent.includes('정치인') || polAdminContent.includes('관리') ||
                     polAdminContent.includes('politician');
  results.push({ name: '정치인 관리', pass: polAdminOk, category: '관리자' });
  console.log('   ' + (polAdminOk ? '✅' : '❌') + ' 정치인 관리');

  // 12. 문의 관리
  console.log('12. 문의 관리...');
  await page.goto(url + '/admin/inquiries', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const inquiriesContent = await page.content();
  const inquiriesOk = inquiriesContent.includes('문의') || inquiriesContent.includes('질문') ||
                      inquiriesContent.includes('inquiry') || inquiriesContent.includes('관리');
  results.push({ name: '문의 관리', pass: inquiriesOk, category: '관리자' });
  console.log('   ' + (inquiriesOk ? '✅' : '❌') + ' 문의 관리');

  await browser.close();

  // 결과 요약
  console.log('\n' + '='.repeat(50));
  console.log('📊 정치인/관리자 기능 테스트 결과\n');

  const polResults = results.filter(r => r.category === '정치인');
  const adminResults = results.filter(r => r.category === '관리자');

  console.log('[ 정치인 관련 기능 ]');
  console.log('| 기능 | 결과 |');
  console.log('|------|------|');
  polResults.forEach(r => {
    console.log('| ' + r.name + ' | ' + (r.pass ? '✅ 통과' : '❌ 실패') + ' |');
  });
  const polPassed = polResults.filter(r => r.pass).length;
  console.log('소계: ' + polPassed + '/' + polResults.length + '\n');

  console.log('[ 관리자 기능 ]');
  console.log('| 기능 | 결과 |');
  console.log('|------|------|');
  adminResults.forEach(r => {
    console.log('| ' + r.name + ' | ' + (r.pass ? '✅ 통과' : '❌ 실패') + ' |');
  });
  const adminPassed = adminResults.filter(r => r.pass).length;
  console.log('소계: ' + adminPassed + '/' + adminResults.length + '\n');

  const totalPassed = results.filter(r => r.pass).length;
  const total = results.length;
  console.log('🏆 종합: ' + totalPassed + '/' + total + ' 통과 (' + Math.round(totalPassed/total*100) + '%)');
})();
