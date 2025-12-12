/**
 * 로컬 환경 기능 테스트
 */

const BASE_URL = 'http://localhost:3000';

const testResults = {
  timestamp: new Date().toISOString(),
  tests: []
};

function addTest(category, name, status, details = {}) {
  testResults.tests.push({ category, name, status, details, timestamp: new Date().toISOString() });
}

async function fetchAPI(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const method = options.method || 'GET';
  console.log(`\n📡 ${method} ${endpoint}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers }
    });

    const data = await response.json();
    console.log(`✅ ${response.status}`);

    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error(`❌ ${error.message}`);
    return { ok: false, status: 0, error: error.message };
  }
}

async function test1_HomeRatings() {
  console.log('\n=== 1. 홈 화면 별점 표시 ===');

  const result = await fetchAPI('/api/politicians');

  if (result.ok && result.data.success) {
    const politicians = result.data.data;
    const ohSehoon = politicians.find(p => p.id === '62e7b453');

    if (ohSehoon) {
      const stars = '★'.repeat(Math.round(ohSehoon.userRating || 0)) + '☆'.repeat(5 - Math.round(ohSehoon.userRating || 0));
      console.log(`\n오세훈:`);
      console.log(`  평점: ${ohSehoon.userRating || 0}`);
      console.log(`  평가수: ${ohSehoon.ratingCount || 0}`);
      console.log(`  별표시: ${stars}`);

      addTest('홈화면', '별점표시', 'pass', {
        politician: '오세훈',
        rating: ohSehoon.userRating,
        count: ohSehoon.ratingCount,
        stars
      });
    } else {
      addTest('홈화면', '별점표시', 'fail', { error: '오세훈 없음' });
    }
  } else {
    addTest('홈화면', '별점표시', 'fail', { error: 'API 실패' });
  }
}

async function test2_PoliticianDetail() {
  console.log('\n=== 2. 정치인 상세 ===');

  const result = await fetchAPI('/api/politicians/62e7b453');

  if (result.ok && result.data.success) {
    const p = result.data.politician;
    console.log(`\n오세훈 상세:`);
    console.log(`  이름: ${p.name}`);
    console.log(`  소속: ${p.party}`);
    console.log(`  직위: ${p.title}`);
    console.log(`  평점: ${p.userRating || 0}`);
    console.log(`  평가수: ${p.ratingCount || 0}`);

    addTest('정치인상세', '정보조회', 'pass', {
      name: p.name,
      rating: p.userRating,
      count: p.ratingCount
    });
  } else {
    addTest('정치인상세', '정보조회', 'fail', { error: 'API 실패' });
  }
}

async function test3_CommunityPosts() {
  console.log('\n=== 3. 커뮤니티 게시글 ===');

  const result = await fetchAPI('/api/posts?limit=20');

  if (result.ok && result.data.success) {
    const posts = result.data.posts;
    console.log(`\n게시글: ${posts.length}개`);

    if (posts.length > 0) {
      const p = posts[0];
      console.log(`  제목: ${p.title}`);
      console.log(`  작성자: ${p.author} (${p.author_type})`);

      addTest('커뮤니티', '게시글목록', 'pass', { count: posts.length });
    } else {
      addTest('커뮤니티', '게시글목록', 'pass', { count: 0, note: '게시글 없음' });
    }
  } else {
    addTest('커뮤니티', '게시글목록', 'fail', { error: 'API 실패' });
  }
}

function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 테스트 결과');
  console.log('='.repeat(60));

  const passed = testResults.tests.filter(t => t.status === 'pass').length;
  const failed = testResults.tests.filter(t => t.status === 'fail').length;

  console.log(`\n✅ 통과: ${passed}개`);
  console.log(`❌ 실패: ${failed}개`);

  testResults.tests.forEach((t, i) => {
    const icon = t.status === 'pass' ? '✅' : '❌';
    console.log(`\n${i+1}. [${icon}] ${t.category} - ${t.name}`);
    if (t.details) {
      Object.entries(t.details).forEach(([k, v]) => {
        console.log(`   ${k}: ${v}`);
      });
    }
  });

  console.log('\n' + '='.repeat(60));
}

async function runTests() {
  console.log('🚀 로컬 환경 테스트 시작\n');
  console.log(`시간: ${testResults.timestamp}`);
  console.log(`서버: ${BASE_URL}`);

  await test1_HomeRatings();
  await test2_PoliticianDetail();
  await test3_CommunityPosts();

  printSummary();

  require('fs').writeFileSync(
    'local_test_results.json',
    JSON.stringify(testResults, null, 2)
  );

  console.log('\n✅ 완료!\n');
}

runTests();
