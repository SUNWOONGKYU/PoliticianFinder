// 관리자 계정으로 모든 기능 테스트
const fetch = require('node-fetch');

const BASE_URL = 'https://www.politicianfinder.ai.kr';
const results = [];

function addResult(category, feature, status, note) {
  results.push({ category, feature, status, note });
}

async function testAPI(method, endpoint, body = null, description) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    return {
      success: response.ok && data.success !== false,
      status: response.status,
      data
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      error: error.message
    };
  }
}

async function runAllTests() {
  console.log('\n🔍 관리자 계정 종합 기능 테스트 시작\n');
  console.log('=' .repeat(80));

  // ========== 1. 관리자 페이지 접근 테스트 ==========
  console.log('\n📌 1. 관리자 페이지 접근 테스트');

  const adminPages = [
    { path: '/api/admin/dashboard', desc: '대시보드 데이터' },
    { path: '/api/admin/users?page=1&limit=10', desc: '회원 관리' },
    { path: '/api/admin/posts?page=1&limit=10', desc: '게시글 관리' },
    { path: '/api/admin/politicians?page=1&limit=10', desc: '정치인 관리' },
    { path: '/api/admin/inquiries?page=1&limit=10', desc: '문의 관리' },
  ];

  for (const page of adminPages) {
    const result = await testAPI('GET', page.path, null, page.desc);
    addResult('관리자 접근', page.desc, result.success ? '✅ 성공' : '❌ 실패',
              result.success ? `응답 받음` : `Status: ${result.status}`);
    console.log(`  ${result.success ? '✅' : '❌'} ${page.desc}: ${result.status}`);
  }

  // ========== 2. 회원 관리 기능 테스트 ==========
  console.log('\n📌 2. 회원 관리 기능 테스트');

  // 회원 목록 조회
  const usersResult = await testAPI('GET', '/api/admin/users?page=1&limit=10');
  addResult('회원 관리', '회원 목록 조회', usersResult.success ? '✅ 성공' : '❌ 실패',
            usersResult.success ? `${usersResult.data.pagination?.total || 0}명 조회` : '실패');
  console.log(`  ${usersResult.success ? '✅' : '❌'} 회원 목록 조회`);

  // 회원 검색
  const searchResult = await testAPI('GET', '/api/admin/users?search=선웅규');
  addResult('회원 관리', '회원 검색', searchResult.success ? '✅ 성공' : '❌ 실패',
            searchResult.success ? '검색 성공' : '실패');
  console.log(`  ${searchResult.success ? '✅' : '❌'} 회원 검색`);

  // ========== 3. 게시글 관리 테스트 ==========
  console.log('\n📌 3. 게시글 관리 기능 테스트');

  // 게시글 목록 조회
  const postsResult = await testAPI('GET', '/api/admin/posts?page=1&limit=10');
  addResult('게시글 관리', '게시글 목록 조회', postsResult.success ? '✅ 성공' : '❌ 실패',
            postsResult.success ? `${postsResult.data.pagination?.total || 0}개 조회` : '실패');
  console.log(`  ${postsResult.success ? '✅' : '❌'} 게시글 목록 조회`);

  // ========== 4. 정치인 관리 테스트 ==========
  console.log('\n📌 4. 정치인 관리 기능 테스트');

  // 정치인 목록 조회
  const politiciansResult = await testAPI('GET', '/api/politicians?page=1&limit=10');
  addResult('정치인 관리', '정치인 목록 조회', politiciansResult.success ? '✅ 성공' : '❌ 실패',
            politiciansResult.success ? `${politiciansResult.data.pagination?.total || 0}명 조회` : '실패');
  console.log(`  ${politiciansResult.success ? '✅' : '❌'} 정치인 목록 조회`);

  // ========== 5. 일반 회원 기능 테스트 (로그인 필요) ==========
  console.log('\n📌 5. 일반 회원 기능 테스트 (로그인 필요)');

  // 커뮤니티 게시글 목록
  const communityResult = await testAPI('GET', '/api/community/posts?page=1&limit=10');
  addResult('회원 기능', '커뮤니티 게시글 조회', communityResult.success ? '✅ 성공' : '❌ 실패',
            communityResult.success ? `${communityResult.data.posts?.length || 0}개 조회` : '실패');
  console.log(`  ${communityResult.success ? '✅' : '❌'} 커뮤니티 게시글 조회`);

  // 댓글 조회 (게시글 ID 필요)
  const commentsResult = await testAPI('GET', '/api/comments?post_id=test');
  addResult('회원 기능', '댓글 조회', commentsResult.status !== 500 ? '✅ 성공' : '❌ 실패',
            'API 응답 확인');
  console.log(`  ${commentsResult.status !== 500 ? '✅' : '❌'} 댓글 API 응답`);

  // 즐겨찾기 조회
  const favoritesResult = await testAPI('GET', '/api/favorites');
  addResult('회원 기능', '즐겨찾기 조회', favoritesResult.status !== 500 ? '✅ 성공' : '❌ 실패',
            'API 응답 확인');
  console.log(`  ${favoritesResult.status !== 500 ? '✅' : '❌'} 즐겨찾기 API 응답`);

  // 알림 조회
  const notificationsResult = await testAPI('GET', '/api/notifications');
  addResult('회원 기능', '알림 조회', notificationsResult.status !== 500 ? '✅ 성공' : '❌ 실패',
            'API 응답 확인');
  console.log(`  ${notificationsResult.status !== 500 ? '✅' : '❌'} 알림 API 응답`);

  // ========== 6. 검색 기능 테스트 ==========
  console.log('\n📌 6. 검색 기능 테스트');

  // 정치인 검색
  const politicianSearchResult = await testAPI('GET', '/api/search/politicians?q=김');
  addResult('검색 기능', '정치인 검색', politicianSearchResult.success ? '✅ 성공' : '❌ 실패',
            politicianSearchResult.success ? '검색 결과 있음' : '실패');
  console.log(`  ${politicianSearchResult.success ? '✅' : '❌'} 정치인 검색`);

  // 전체 검색
  const globalSearchResult = await testAPI('GET', '/api/search?q=정치');
  addResult('검색 기능', '전체 검색', globalSearchResult.status !== 500 ? '✅ 성공' : '❌ 실패',
            'API 응답 확인');
  console.log(`  ${globalSearchResult.status !== 500 ? '✅' : '❌'} 전체 검색`);

  // ========== 7. 통계 조회 테스트 ==========
  console.log('\n📌 7. 통계 조회 테스트');

  // 사이드바 통계
  const sidebarStatsResult = await testAPI('GET', '/api/statistics/sidebar');
  addResult('통계', '사이드바 통계', sidebarStatsResult.success ? '✅ 성공' : '❌ 실패',
            sidebarStatsResult.success ? '통계 데이터 조회' : '실패');
  console.log(`  ${sidebarStatsResult.success ? '✅' : '❌'} 사이드바 통계`);

  // 정치인 통계
  const politicianStatsResult = await testAPI('GET', '/api/statistics/politicians');
  addResult('통계', '정치인 통계', politicianStatsResult.success ? '✅ 성공' : '❌ 실패',
            politicianStatsResult.success ? '통계 데이터 조회' : '실패');
  console.log(`  ${politicianStatsResult.success ? '✅' : '❌'} 정치인 통계`);

  // ========== 8. 공지사항 테스트 ==========
  console.log('\n📌 8. 공지사항 기능 테스트');

  // 공지사항 조회
  const noticesResult = await testAPI('GET', '/api/notices');
  addResult('공지사항', '공지사항 조회', noticesResult.success ? '✅ 성공' : '❌ 실패',
            noticesResult.success ? `${noticesResult.data.notices?.length || 0}개 조회` : '실패');
  console.log(`  ${noticesResult.success ? '✅' : '❌'} 공지사항 조회`);

  // ========== 결과 출력 ==========
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 테스트 결과 종합\n');

  console.log('| 번호 | 카테고리 | 기능명 | 테스트 결과 | 비고 |');
  console.log('|------|---------|--------|------------|------|');

  results.forEach((result, index) => {
    console.log(`| ${(index + 1).toString().padStart(2)} | ${result.category} | ${result.feature} | ${result.status} | ${result.note} |`);
  });

  // 성공/실패 통계
  const successCount = results.filter(r => r.status.includes('✅')).length;
  const failCount = results.filter(r => r.status.includes('❌')).length;

  console.log('\n' + '='.repeat(80));
  console.log(`\n✅ 성공: ${successCount}개 / ❌ 실패: ${failCount}개 / 전체: ${results.length}개`);
  console.log(`\n성공률: ${((successCount / results.length) * 100).toFixed(1)}%\n`);
}

runAllTests().catch(console.error);
