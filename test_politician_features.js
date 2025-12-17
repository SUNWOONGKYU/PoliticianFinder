// 정치인 핵심 기능 테스트 (실제 동작 확인된 API)
// 테스트 정치인: 17270f25 (정원오), cd8c0263 (노서현)

const BASE_URL = 'https://politician-finder-pf22qonu8-finder-world.vercel.app';
const SUPABASE_URL = 'https://ooddlafwdpzgxfefgsrx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8';

// 테스트용 정치인 ID
const TEST_POLITICIAN_1 = '17270f25'; // 정원오
const TEST_POLITICIAN_2 = 'cd8c0263'; // 노서현

// 회원 인증
const TEST_EMAIL = 'wksun99@gmail.com';
const TEST_PASSWORD = 'na5215900';

let testResults = [];
let accessToken = null;

function log(testName, success, detail = '') {
  const status = success ? '✅' : '❌';
  console.log(`${status} ${testName}${detail ? ': ' + detail : ''}`);
  testResults.push({ name: testName, success, detail });
}

async function login() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
  });
  const data = await res.json();
  if (data.access_token) {
    accessToken = data.access_token;
    return true;
  }
  return false;
}

function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  };
}

async function main() {
  console.log('='.repeat(70));
  console.log('정치인 핵심 기능 테스트 (20개)');
  console.log('='.repeat(70));
  console.log(`테스트 정치인 1: ${TEST_POLITICIAN_1} (정원오)`);
  console.log(`테스트 정치인 2: ${TEST_POLITICIAN_2} (노서현)`);
  console.log('');

  // ========== 비회원 기능 (Public) ==========
  console.log('--- 비회원 기능 (Public) ---');

  // 1. 정치인 목록 조회
  try {
    const res = await fetch(`${BASE_URL}/api/politicians?limit=5`);
    const data = await res.json();
    log('1. 정치인 목록 조회', res.ok && data.success, `${data.data?.length || 0}명`);
  } catch (e) { log('1. 정치인 목록 조회', false, e.message); }

  // 2. 정치인 상세 조회
  try {
    const res = await fetch(`${BASE_URL}/api/politicians/${TEST_POLITICIAN_1}`);
    const data = await res.json();
    log('2. 정치인 상세 조회', res.ok && data.success, data.data?.name);
  } catch (e) { log('2. 정치인 상세 조회', false, e.message); }

  // 3. 정치인 검색 (이름)
  try {
    const res = await fetch(`${BASE_URL}/api/politicians/search?q=김동연`);
    const data = await res.json();
    log('3. 정치인 검색', res.ok, `${data.data?.length || 0}명`);
  } catch (e) { log('3. 정치인 검색', false, e.message); }

  // 4. 정치인 필터 (정당)
  try {
    const res = await fetch(`${BASE_URL}/api/politicians?party=더불어민주당&limit=3`);
    const data = await res.json();
    log('4. 정치인 필터 (정당)', res.ok, `${data.data?.length || 0}명`);
  } catch (e) { log('4. 정치인 필터 (정당)', false, e.message); }

  // 5. 정치인 필터 (직위)
  try {
    const res = await fetch(`${BASE_URL}/api/politicians?position=국회의원&limit=3`);
    const data = await res.json();
    log('5. 정치인 필터 (직위)', res.ok, `${data.data?.length || 0}명`);
  } catch (e) { log('5. 정치인 필터 (직위)', false, e.message); }

  // 6. 정치인 필터 (지역)
  try {
    const res = await fetch(`${BASE_URL}/api/politicians?region=서울&limit=3`);
    const data = await res.json();
    log('6. 정치인 필터 (지역)', res.ok, `${data.data?.length || 0}명`);
  } catch (e) { log('6. 정치인 필터 (지역)', false, e.message); }

  // 7. 정치인 통계 상세
  try {
    const res = await fetch(`${BASE_URL}/api/statistics/politicians`);
    const data = await res.json();
    log('7. 정치인 통계', res.ok, data.success ? '통계 있음' : 'OK');
  } catch (e) { log('7. 정치인 통계', false, e.message); }

  // 8. 정치인 게시글 조회
  try {
    const res = await fetch(`${BASE_URL}/api/posts?politician_id=${TEST_POLITICIAN_1}&limit=5`);
    const data = await res.json();
    log('8. 정치인 게시글 조회', res.ok, `${data.data?.length || 0}개`);
  } catch (e) { log('8. 정치인 게시글 조회', false, e.message); }

  // ========== 회원 기능 (Authenticated) ==========
  console.log('\n--- 회원 기능 (Authenticated) ---');

  const loggedIn = await login();
  if (!loggedIn) {
    console.log('❌ 로그인 실패');
    return;
  }
  console.log('✅ 로그인 성공\n');

  // 9. 정치인 평점 등록
  try {
    const res = await fetch(`${BASE_URL}/api/ratings/${TEST_POLITICIAN_2}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ rating: 4 })
    });
    const data = await res.json();
    log('9. 평점 등록', res.ok || data.success, `${TEST_POLITICIAN_2}에 4점`);
  } catch (e) { log('9. 평점 등록', false, e.message); }

  // 10. 관심 정치인 등록
  try {
    await fetch(`${BASE_URL}/api/favorites?politician_id=${TEST_POLITICIAN_2}`, {
      method: 'DELETE', headers: getAuthHeaders()
    });
    const res = await fetch(`${BASE_URL}/api/favorites`, {
      method: 'POST', headers: getAuthHeaders(),
      body: JSON.stringify({ politician_id: TEST_POLITICIAN_2 })
    });
    // 이미 등록된 경우 (409)도 정상 응답으로 처리
    log('10. 관심 정치인 등록', res.ok || res.status === 409, TEST_POLITICIAN_2);
  } catch (e) { log('10. 관심 정치인 등록', false, e.message); }

  // 11. 관심 정치인 목록
  try {
    const res = await fetch(`${BASE_URL}/api/favorites`, { headers: getAuthHeaders() });
    const data = await res.json();
    log('11. 관심 정치인 목록', res.ok, `${data.data?.favorites?.length || 0}명`);
  } catch (e) { log('11. 관심 정치인 목록', false, e.message); }

  // 12. 관심 정치인 해제
  try {
    const res = await fetch(`${BASE_URL}/api/favorites?politician_id=${TEST_POLITICIAN_2}`, {
      method: 'DELETE', headers: getAuthHeaders()
    });
    log('12. 관심 정치인 해제', res.ok, TEST_POLITICIAN_2);
  } catch (e) { log('12. 관심 정치인 해제', false, e.message); }

  // 13. 정치인 관련 게시글 작성
  let postId = null;
  try {
    const res = await fetch(`${BASE_URL}/api/posts`, {
      method: 'POST', headers: getAuthHeaders(),
      body: JSON.stringify({
        subject: '정치인 기능 테스트 게시글',
        content: '이것은 정치인 기능 테스트를 위한 게시글입니다.',
        category: 'general',
        politician_id: TEST_POLITICIAN_1
      })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      postId = data.data.id;
      log('13. 정치인 관련 게시글 작성', true, `ID: ${postId?.slice(0,8)}...`);
    } else {
      log('13. 정치인 관련 게시글 작성', false, data.error?.message);
    }
  } catch (e) { log('13. 정치인 관련 게시글 작성', false, e.message); }

  // 14. 게시글 수정
  if (postId) {
    try {
      const res = await fetch(`${BASE_URL}/api/posts/${postId}`, {
        method: 'PATCH', headers: getAuthHeaders(),
        body: JSON.stringify({ subject: '정치인 기능 테스트 게시글 (수정됨)', content: '수정된 내용입니다.' })
      });
      log('14. 게시글 수정', res.ok, '수정됨');
    } catch (e) { log('14. 게시글 수정', false, e.message); }
  } else {
    log('14. 게시글 수정', false, '게시글 없음');
  }

  // 15. 게시글에 댓글 작성
  let commentId = null;
  if (postId) {
    try {
      const res = await fetch(`${BASE_URL}/api/comments`, {
        method: 'POST', headers: getAuthHeaders(),
        body: JSON.stringify({ post_id: postId, content: '정치인 관련 테스트 댓글입니다.' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        commentId = data.data.id;
        log('15. 댓글 작성', true, `ID: ${commentId?.slice(0,8)}...`);
      } else {
        log('15. 댓글 작성', false, data.error?.message);
      }
    } catch (e) { log('15. 댓글 작성', false, e.message); }
  } else {
    log('15. 댓글 작성', false, '게시글 없음');
  }

  // 16. 댓글 삭제
  if (commentId) {
    try {
      const res = await fetch(`${BASE_URL}/api/comments/${commentId}`, {
        method: 'DELETE', headers: getAuthHeaders()
      });
      log('16. 댓글 삭제', res.ok, '삭제됨');
    } catch (e) { log('16. 댓글 삭제', false, e.message); }
  } else {
    log('16. 댓글 삭제', false, '댓글 없음');
  }

  // 17. 게시글 삭제
  if (postId) {
    try {
      const res = await fetch(`${BASE_URL}/api/posts/${postId}`, {
        method: 'DELETE', headers: getAuthHeaders()
      });
      log('17. 게시글 삭제', res.ok, '삭제됨');
    } catch (e) { log('17. 게시글 삭제', false, e.message); }
  } else {
    log('17. 게시글 삭제', false, '게시글 없음');
  }

  // 18. 정치인 2번째 상세 조회
  try {
    const res = await fetch(`${BASE_URL}/api/politicians/${TEST_POLITICIAN_2}`);
    const data = await res.json();
    log('18. 두 번째 정치인 조회', res.ok && data.success, data.data?.name);
  } catch (e) { log('18. 두 번째 정치인 조회', false, e.message); }

  // 19. 다른 정당 필터
  try {
    const res = await fetch(`${BASE_URL}/api/politicians?party=국민의힘&limit=3`);
    const data = await res.json();
    log('19. 국민의힘 필터', res.ok, `${data.data?.length || 0}명`);
  } catch (e) { log('19. 국민의힘 필터', false, e.message); }

  // 20. 복합 필터 (정당 + 지역)
  try {
    const res = await fetch(`${BASE_URL}/api/politicians?party=더불어민주당&region=서울&limit=3`);
    const data = await res.json();
    log('20. 복합 필터 (정당+지역)', res.ok, `${data.data?.length || 0}명`);
  } catch (e) { log('20. 복합 필터 (정당+지역)', false, e.message); }

  // ========== 결과 요약 ==========
  console.log('\n' + '='.repeat(70));
  console.log('테스트 결과 요약');
  console.log('='.repeat(70));
  const passed = testResults.filter(r => r.success).length;
  const failed = testResults.filter(r => !r.success).length;
  console.log(`✅ 성공: ${passed}개`);
  console.log(`❌ 실패: ${failed}개`);
  console.log(`총: ${testResults.length}개`);

  if (failed > 0) {
    console.log('\n실패 항목:');
    testResults.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name}: ${r.detail}`);
    });
  }
}

main().catch(console.error);
