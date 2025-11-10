// 프론트엔드 페이지 렌더링 테스트
const baseUrl = 'http://localhost:3002';

const testPages = [
  '/',
  '/politicians',
  '/community',
  '/search',
  '/mypage',
  '/admin/login',
  '/privacy',
  '/terms',
];

async function testPage(path) {
  try {
    const response = await fetch(`${baseUrl}${path}`);
    const status = response.status;
    const statusText = response.ok ? 'OK' : 'ERROR';

    console.log(`[${statusText}] ${path} - ${status}`);

    return { path, status, ok: response.ok };
  } catch (error) {
    console.log(`[FAIL] ${path} - ${error.message}`);
    return { path, status: 'FAIL', ok: false, error: error.message };
  }
}

async function runTests() {
  console.log('='.repeat(80));
  console.log('프론트엔드 페이지 렌더링 테스트');
  console.log('='.repeat(80));

  const results = [];

  for (const path of testPages) {
    const result = await testPage(path);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\n' + '='.repeat(80));
  console.log('테스트 결과 요약');
  console.log('='.repeat(80));

  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;

  console.log(`총 ${results.length}개 페이지 테스트`);
  console.log(`성공: ${passed}개`);
  console.log(`실패: ${failed}개`);
  console.log('='.repeat(80));
}

runTests();
