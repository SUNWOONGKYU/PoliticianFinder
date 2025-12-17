// 회원 전체 기능 테스트 (20개)
// wksun99@gmail.com / na_5215900

const BASE_URL = 'https://politician-finder-pf22qonu8-finder-world.vercel.app';
const TEST_EMAIL = 'wksun99@gmail.com';
const TEST_PASSWORD = 'na5215900';

const SUPABASE_URL = 'https://ooddlafwdpzgxfefgsrx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8';

const testPoliticianId = '17270f25'; // 정원오
let testResults = [];

function log(testName, success, detail = '') {
  const status = success ? '✅' : '❌';
  console.log(`${status} ${testName}${detail ? ': ' + detail : ''}`);
  testResults.push({ name: testName, success, detail });
}

async function main() {
  console.log('='.repeat(60));
  console.log('회원 전체 기능 테스트 (20개)');
  console.log('='.repeat(60));
  console.log(`계정: ${TEST_EMAIL}\n`);

  // 1. 로그인
  console.log('--- 인증 기능 ---');
  const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
  });
  const loginData = await loginRes.json();

  if (!loginData.access_token) {
    console.log('❌ 로그인 실패:', loginData);
    return;
  }

  const accessToken = loginData.access_token;
  const userId = loginData.user.id;
  log('1. 로그인', true, `User ID: ${userId.slice(0,8)}...`);

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  };

  // 2. 프로필 조회
  console.log('\n--- 프로필 기능 ---');
  try {
    const res = await fetch(`${BASE_URL}/api/user/profile`, { headers: authHeaders });
    const data = await res.json();
    if (res.ok && data.success) {
      log('2. 프로필 조회', true, data.data?.user?.name || data.data?.user?.email);
    } else {
      log('2. 프로필 조회', false, data.error?.message);
    }
  } catch (e) { log('2. 프로필 조회', false, e.message); }

  // 3. 프로필 수정
  try {
    const res = await fetch(`${BASE_URL}/api/user/profile/update`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ bio: '테스트 자기소개 ' + Date.now() })
    });
    const data = await res.json();
    log('3. 프로필 수정', res.ok, res.ok ? '자기소개 수정됨' : data.error?.message);
  } catch (e) { log('3. 프로필 수정', false, e.message); }

  // 4-5. 정치인 목록/상세 조회 (비회원도 가능하지만 회원 기능으로도 테스트)
  console.log('\n--- 정치인 기능 ---');
  try {
    const res = await fetch(`${BASE_URL}/api/politicians?limit=3`, { headers: authHeaders });
    const data = await res.json();
    log('4. 정치인 목록 조회', res.ok && data.success, `${data.data?.length || 0}명`);
  } catch (e) { log('4. 정치인 목록 조회', false, e.message); }

  try {
    const res = await fetch(`${BASE_URL}/api/politicians/${testPoliticianId}`, { headers: authHeaders });
    const data = await res.json();
    log('5. 정치인 상세 조회', res.ok && data.success, data.data?.name);
  } catch (e) { log('5. 정치인 상세 조회', false, e.message); }

  // 6-7. 관심 정치인 등록/해제
  try {
    // 먼저 해제 시도 (이미 등록된 경우 대비)
    await fetch(`${BASE_URL}/api/favorites?politician_id=${testPoliticianId}`, {
      method: 'DELETE', headers: authHeaders
    });
    // 등록
    const res = await fetch(`${BASE_URL}/api/favorites`, {
      method: 'POST', headers: authHeaders,
      body: JSON.stringify({ politician_id: testPoliticianId })
    });
    const data = await res.json();
    log('6. 관심 정치인 등록', res.ok || data.error?.includes('이미'), '정원오');
  } catch (e) { log('6. 관심 정치인 등록', false, e.message); }

  try {
    const res = await fetch(`${BASE_URL}/api/favorites?politician_id=${testPoliticianId}`, {
      method: 'DELETE', headers: authHeaders
    });
    log('7. 관심 정치인 해제', res.ok, '정원오');
  } catch (e) { log('7. 관심 정치인 해제', false, e.message); }

  // 8. 관심 정치인 목록 조회
  try {
    const res = await fetch(`${BASE_URL}/api/favorites`, { headers: authHeaders });
    const data = await res.json();
    log('8. 관심 목록 조회', res.ok, `${data.data?.favorites?.length || 0}명`);
  } catch (e) { log('8. 관심 목록 조회', false, e.message); }

  // 9. 정치인 평점 등록
  try {
    const res = await fetch(`${BASE_URL}/api/ratings/${testPoliticianId}`, {
      method: 'POST', headers: authHeaders,
      body: JSON.stringify({ rating: 4 })
    });
    const data = await res.json();
    log('9. 정치인 평점 등록', res.ok || data.success, '4점');
  } catch (e) { log('9. 정치인 평점 등록', false, e.message); }

  // 10-12. 게시글 CRUD
  console.log('\n--- 커뮤니티 기능 ---');
  let postId = null;
  try {
    const res = await fetch(`${BASE_URL}/api/posts`, {
      method: 'POST', headers: authHeaders,
      body: JSON.stringify({
        subject: '회원 기능 테스트 게시글입니다',
        content: '이것은 회원 기능 전체 테스트를 위한 게시글입니다. 자동 테스트 중입니다.',
        category: 'general',
        politician_id: testPoliticianId
      })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      postId = data.data.id;
      log('10. 게시글 작성', true, `ID: ${postId.slice(0,8)}...`);
    } else {
      log('10. 게시글 작성', false, data.error?.message);
    }
  } catch (e) { log('10. 게시글 작성', false, e.message); }

  if (postId) {
    try {
      const res = await fetch(`${BASE_URL}/api/posts/${postId}`, {
        method: 'PATCH', headers: authHeaders,
        body: JSON.stringify({ subject: '회원 기능 테스트 게시글 (수정됨)', content: '수정된 내용입니다. 테스트 완료.' })
      });
      log('11. 게시글 수정', res.ok, '제목/내용 수정');
    } catch (e) { log('11. 게시글 수정', false, e.message); }
  } else {
    log('11. 게시글 수정', false, '게시글 없음');
  }

  // 13-14. 댓글 CRUD
  let commentId = null;
  if (postId) {
    try {
      const res = await fetch(`${BASE_URL}/api/comments`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ post_id: postId, content: '테스트 댓글입니다.' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        commentId = data.data.id;
        log('13. 댓글 작성', true, `ID: ${commentId.slice(0,8)}...`);
      } else {
        log('13. 댓글 작성', false, data.error?.message);
      }
    } catch (e) { log('13. 댓글 작성', false, e.message); }
  } else {
    log('13. 댓글 작성', false, '게시글 없음');
  }

  if (commentId) {
    try {
      const res = await fetch(`${BASE_URL}/api/comments/${commentId}`, {
        method: 'DELETE', headers: authHeaders
      });
      log('14. 댓글 삭제', res.ok, '삭제됨');
    } catch (e) { log('14. 댓글 삭제', false, e.message); }
  } else {
    log('14. 댓글 삭제', false, '댓글 없음');
  }

  // 게시글 삭제
  if (postId) {
    try {
      const res = await fetch(`${BASE_URL}/api/posts/${postId}`, {
        method: 'DELETE', headers: authHeaders
      });
      log('12. 게시글 삭제', res.ok, '삭제됨');
    } catch (e) { log('12. 게시글 삭제', false, e.message); }
  } else {
    log('12. 게시글 삭제', false, '게시글 없음');
  }

  // 15-16. 팔로우/언팔로우 (다른 사용자 찾기)
  console.log('\n--- 소셜 기능 ---');
  try {
    // 다른 사용자 조회
    const usersRes = await fetch(`${SUPABASE_URL}/rest/v1/users?select=user_id,name&user_id=neq.${userId}&limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const users = await usersRes.json();

    if (users && users.length > 0) {
      const targetId = users[0].user_id;

      // 팔로우
      const followRes = await fetch(`${BASE_URL}/api/users/${targetId}/follow`, {
        method: 'POST', headers: authHeaders
      });
      log('15. 팔로우', followRes.ok, users[0].name);

      // 언팔로우
      const unfollowRes = await fetch(`${BASE_URL}/api/users/${targetId}/follow`, {
        method: 'DELETE', headers: authHeaders
      });
      log('16. 언팔로우', unfollowRes.ok, users[0].name);
    } else {
      log('15. 팔로우', false, '대상 없음');
      log('16. 언팔로우', false, '대상 없음');
    }
  } catch (e) {
    log('15. 팔로우', false, e.message);
    log('16. 언팔로우', false, e.message);
  }

  // 17. 알림 목록 조회
  try {
    const res = await fetch(`${BASE_URL}/api/notifications`, { headers: authHeaders });
    const data = await res.json();
    log('17. 알림 목록 조회', res.ok, `${data.data?.notifications?.length || 0}개`);
  } catch (e) { log('17. 알림 목록 조회', false, e.message); }

  // 18. 문의하기
  try {
    const res = await fetch(`${BASE_URL}/api/inquiries`, {
      method: 'POST', headers: authHeaders,
      body: JSON.stringify({
        name: '테스트', email: TEST_EMAIL,
        subject: '기능 테스트 문의', message: '자동 테스트 문의입니다.'
      })
    });
    log('18. 문의하기', res.ok, '등록됨');
  } catch (e) { log('18. 문의하기', false, e.message); }

  // 19. 공지사항 조회
  try {
    const res = await fetch(`${BASE_URL}/api/notices`, { headers: authHeaders });
    const data = await res.json();
    log('19. 공지사항 조회', res.ok, `${data.data?.length || 0}개`);
  } catch (e) { log('19. 공지사항 조회', false, e.message); }

  // 20. 로그아웃 (Supabase Auth)
  console.log('\n--- 로그아웃 ---');
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${accessToken}` }
    });
    log('20. 로그아웃', res.ok || res.status === 204, '세션 종료');
  } catch (e) { log('20. 로그아웃', false, e.message); }

  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('테스트 결과 요약');
  console.log('='.repeat(60));
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
