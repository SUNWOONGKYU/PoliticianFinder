// API 엔드포인트 테스트 스크립트
const baseUrl = 'http://localhost:3002';

const testAPIs = [
  { method: 'GET', url: '/api/health', desc: 'Health Check' },
  { method: 'GET', url: '/api/politicians', desc: '정치인 목록' },
  { method: 'GET', url: '/api/posts', desc: '게시글 목록' },
  { method: 'GET', url: '/api/notifications', desc: '알림 조회' },
  { method: 'GET', url: '/api/admin/dashboard', desc: '관리자 대시보드' },
];

async function testAPI(test) {
  try {
    const response = await fetch(`${baseUrl}${test.url}`, {
      method: test.method,
    });

    const status = response.status;
    const statusText = response.ok ? 'OK' : 'ERROR';

    console.log(`[${statusText}] ${test.method} ${test.url} - ${status} (${test.desc})`);

    return { ...test, status, ok: response.ok };
  } catch (error) {
    console.log(`[FAIL] ${test.method} ${test.url} - ${error.message} (${test.desc})`);
    return { ...test, status: 'FAIL', ok: false, error: error.message };
  }
}

async function runTests() {
  console.log('='.repeat(80));
  console.log('API 엔드포인트 테스트 시작');
  console.log('='.repeat(80));

  const results = [];

  for (const test of testAPIs) {
    const result = await testAPI(test);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
  }

  console.log('\n' + '='.repeat(80));
  console.log('테스트 결과 요약');
  console.log('='.repeat(80));

  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;

  console.log(`총 ${results.length}개 테스트`);
  console.log(`성공: ${passed}개`);
  console.log(`실패: ${failed}개`);
  console.log('='.repeat(80));
}

runTests();
