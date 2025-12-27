const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const iPhone = devices['iPhone 14'];
  const context = await browser.newContext({ ...iPhone });
  const page = await context.newPage();

  const url = 'https://politician-finder-9x5m9kcr8-finder-world.vercel.app';
  const results = [];

  console.log('=== PoliticianFinder 회원 기능 종합 테스트 v2 ===\n');

  // 1. 로그인
  console.log('1. 로그인 테스트...');
  await page.goto(url + '/auth/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  await page.fill('input[name="email"]', 'wksun999@naver.com');
  await page.fill('input[name="password"]', 'na5215900');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  const currentUrl = page.url();
  const loginSuccess = !currentUrl.includes('login');
  results.push({ name: '로그인', pass: loginSuccess });
  console.log('   ' + (loginSuccess ? '✅' : '❌') + ' 로그인');

  // 2. 홈페이지
  console.log('2. 홈페이지...');
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const homeContent = await page.content();
  const homeOk = homeContent.includes('정치인') || homeContent.includes('PoliticianFinder');
  results.push({ name: '홈페이지', pass: homeOk });
  console.log('   ' + (homeOk ? '✅' : '❌') + ' 홈페이지');

  // 3. 정치인 목록
  console.log('3. 정치인 목록...');
  await page.goto(url + '/politicians', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const polContent = await page.content();
  const hasPoliticians = polContent.includes('안태준') || polContent.includes('김동연') ||
                         polContent.includes('오세훈') || polContent.includes('이준석');
  results.push({ name: '정치인 목록', pass: hasPoliticians });
  console.log('   ' + (hasPoliticians ? '✅' : '❌') + ' 정치인 목록');

  // 4. 정치인 상세
  console.log('4. 정치인 상세...');
  await page.goto(url + '/politicians/9dc9f3b4', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const detailContent = await page.content();
  const detailOk = detailContent.includes('안태준') || detailContent.includes('평가');
  results.push({ name: '정치인 상세', pass: detailOk });
  console.log('   ' + (detailOk ? '✅' : '❌') + ' 정치인 상세');

  // 5. 커뮤니티 목록
  console.log('5. 커뮤니티...');
  await page.goto(url + '/community', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const commContent = await page.content();
  const commOk = commContent.includes('커뮤니티') || commContent.includes('게시글');
  results.push({ name: '커뮤니티 목록', pass: commOk });
  console.log('   ' + (commOk ? '✅' : '❌') + ' 커뮤니티 목록');

  // 6. 게시글 작성 페이지 (정확한 경로: /community/posts/create)
  console.log('6. 게시글 작성...');
  await page.goto(url + '/community/posts/create', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const writeContent = await page.content();
  const writeOk = writeContent.includes('작성') || writeContent.includes('제목') ||
                  writeContent.includes('내용') || writeContent.includes('게시');
  results.push({ name: '게시글 작성', pass: writeOk });
  console.log('   ' + (writeOk ? '✅' : '❌') + ' 게시글 작성');

  // 7. 마이페이지
  console.log('7. 마이페이지...');
  await page.goto(url + '/mypage', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const mypageContent = await page.content();
  const mypageOk = mypageContent.includes('마이페이지') || mypageContent.includes('프로필') ||
                   mypageContent.includes('써니');
  results.push({ name: '마이페이지', pass: mypageOk });
  console.log('   ' + (mypageOk ? '✅' : '❌') + ' 마이페이지');

  // 8. 프로필 페이지 (/profile)
  console.log('8. 프로필...');
  await page.goto(url + '/profile', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const profileContent = await page.content();
  const profileOk = profileContent.includes('프로필') || profileContent.includes('닉네임') ||
                    profileContent.includes('써니') || profileContent.includes('정보');
  results.push({ name: '프로필', pass: profileOk });
  console.log('   ' + (profileOk ? '✅' : '❌') + ' 프로필');

  // 9. 알림
  console.log('9. 알림...');
  await page.goto(url + '/notifications', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const notiContent = await page.content();
  const notiOk = notiContent.includes('알림') || notiContent.includes('notification');
  results.push({ name: '알림', pass: notiOk });
  console.log('   ' + (notiOk ? '✅' : '❌') + ' 알림');

  // 10. 게시글 상세 (첫 번째 게시글)
  console.log('10. 게시글 상세...');
  await page.goto(url + '/community', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  // 게시글 클릭 시도
  const postLink = await page.$('a[href*="/community/posts/"]');
  let postDetailOk = false;
  if (postLink) {
    await postLink.click();
    await page.waitForTimeout(2000);
    const postContent = await page.content();
    postDetailOk = postContent.includes('댓글') || postContent.includes('좋아요') ||
                   postContent.includes('공유') || postContent.includes('작성자');
  }
  results.push({ name: '게시글 상세', pass: postDetailOk, note: postLink ? '' : '게시글 없음' });
  console.log('   ' + (postDetailOk ? '✅' : '❌') + ' 게시글 상세');

  await browser.close();

  // 결과 요약
  console.log('\n' + '='.repeat(50));
  console.log('📊 회원 기능 테스트 결과 v2\n');

  const passed = results.filter(r => r.pass).length;
  const total = results.length;

  console.log('| 기능 | 결과 | 비고 |');
  console.log('|------|------|------|');
  results.forEach(r => {
    const status = r.pass ? '✅ 통과' : '❌ 실패';
    const note = r.note || '';
    console.log('| ' + r.name + ' | ' + status + ' | ' + note + ' |');
  });

  console.log('\n🏆 종합: ' + passed + '/' + total + ' 통과 (' + Math.round(passed/total*100) + '%)');

  if (passed >= total * 0.8) {
    console.log('✅ 회원 기능 대부분 정상 작동');
  } else if (passed >= total * 0.6) {
    console.log('⚠️ 일부 기능 개선 필요');
  } else {
    console.log('❌ 주요 기능 수정 필요');
  }
})();
