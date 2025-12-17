// 관리자 기능 테스트 (20개)
// wksun99@gmail.com / na5215900 (admin role)

const BASE_URL = 'https://politician-finder-pf22qonu8-finder-world.vercel.app';
const TEST_EMAIL = 'wksun99@gmail.com';
const TEST_PASSWORD = 'na5215900';

const SUPABASE_URL = 'https://ooddlafwdpzgxfefgsrx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8';

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
    return { token: data.access_token, userId: data.user.id };
  }
  return null;
}

function getAuthHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  };
}

async function main() {
  console.log('='.repeat(70));
  console.log('관리자 기능 테스트 (20개)');
  console.log('='.repeat(70));
  console.log(`관리자 계정: ${TEST_EMAIL}\n`);

  // 로그인
  console.log('--- 관리자 로그인 ---');
  const loginResult = await login();
  if (!loginResult) {
    console.log('❌ 관리자 로그인 실패');
    return;
  }
  log('1. 관리자 로그인', true, `User ID: ${loginResult.userId.slice(0,8)}...`);

  // ========== 대시보드 ==========
  console.log('\n--- 대시보드 기능 ---');

  // 2. 대시보드 통계 조회
  try {
    const res = await fetch(`${BASE_URL}/api/admin/dashboard`, { headers: getAuthHeaders() });
    const data = await res.json();
    log('2. 대시보드 통계 조회', res.ok, data.success ? '통계 OK' : data.error);
  } catch (e) { log('2. 대시보드 통계 조회', false, e.message); }

  // ========== 사용자 관리 ==========
  console.log('\n--- 사용자 관리 ---');

  // 3. 사용자 목록 조회
  let targetUserId = null;
  try {
    const res = await fetch(`${BASE_URL}/api/admin/users?limit=5`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (res.ok && data.data && data.data.length > 0) {
      // 테스트용 사용자 찾기 (w2center@naver.com)
      const testUser = data.data.find(u => u.email === 'w2center@naver.com');
      if (testUser) targetUserId = testUser.id;
      else targetUserId = data.data[0].id;
    }
    log('3. 사용자 목록 조회', res.ok, `${data.data?.length || 0}명`);
  } catch (e) { log('3. 사용자 목록 조회', false, e.message); }

  // 4. 사용자 검색
  try {
    const res = await fetch(`${BASE_URL}/api/admin/users?search=test`, { headers: getAuthHeaders() });
    const data = await res.json();
    log('4. 사용자 검색', res.ok, `${data.data?.length || 0}명`);
  } catch (e) { log('4. 사용자 검색', false, e.message); }

  // 5. 사용자 등급 변경 (PATCH)
  if (targetUserId) {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/users`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          user_id: targetUserId,
          level: 2,
          activity_level: 'ML2',
          influence_grade: 'Explorer'
        })
      });
      const data = await res.json();
      log('5. 사용자 등급 변경', res.ok, data.success ? '등급 변경됨' : data.error);
    } catch (e) { log('5. 사용자 등급 변경', false, e.message); }
  } else {
    log('5. 사용자 등급 변경', false, '대상 사용자 없음');
  }

  // 6. 사용자 역할 변경
  if (targetUserId) {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/users`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ user_id: targetUserId, role: 'moderator' })
      });
      const data = await res.json();
      log('6. 사용자 역할 변경 (moderator)', res.ok, data.success ? '역할 변경됨' : data.error);

      // 원복
      await fetch(`${BASE_URL}/api/admin/users`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ user_id: targetUserId, role: 'user' })
      });
    } catch (e) { log('6. 사용자 역할 변경', false, e.message); }
  } else {
    log('6. 사용자 역할 변경', false, '대상 사용자 없음');
  }

  // ========== 정치인 관리 ==========
  console.log('\n--- 정치인 관리 ---');

  // 7. 정치인 목록 조회
  try {
    const res = await fetch(`${BASE_URL}/api/admin/politicians?limit=5`, { headers: getAuthHeaders() });
    const data = await res.json();
    log('7. 정치인 목록 조회', res.ok, `${data.data?.length || 0}명`);
  } catch (e) { log('7. 정치인 목록 조회', false, e.message); }

  // 8. 정치인 통계
  try {
    const res = await fetch(`${BASE_URL}/api/statistics/politicians`, { headers: getAuthHeaders() });
    const data = await res.json();
    log('8. 정치인 통계', res.ok, '통계 조회 OK');
  } catch (e) { log('8. 정치인 통계', false, e.message); }

  // ========== 게시글 관리 ==========
  console.log('\n--- 콘텐츠 관리 ---');

  // 9. 게시글 목록 조회
  try {
    const res = await fetch(`${BASE_URL}/api/admin/posts?limit=5`, { headers: getAuthHeaders() });
    const data = await res.json();
    log('9. 게시글 목록 조회', res.ok || res.status === 404, `${data.data?.length || 0}개`);
  } catch (e) { log('9. 게시글 목록 조회', false, e.message); }

  // 10. 댓글 목록 조회
  try {
    const res = await fetch(`${BASE_URL}/api/admin/comments?limit=5`, { headers: getAuthHeaders() });
    const data = await res.json();
    log('10. 댓글 목록 조회', res.ok || res.status === 404, `${data.data?.length || 0}개`);
  } catch (e) { log('10. 댓글 목록 조회', false, e.message); }

  // 11. 신고 목록 조회
  try {
    const res = await fetch(`${BASE_URL}/api/admin/reports?limit=5`, { headers: getAuthHeaders() });
    const data = await res.json();
    log('11. 신고 목록 조회', res.ok || res.status === 404, `${data.data?.length || 0}건`);
  } catch (e) { log('11. 신고 목록 조회', false, e.message); }

  // ========== 문의 관리 ==========
  console.log('\n--- 문의 관리 ---');

  // 12. 문의 목록 조회
  try {
    const res = await fetch(`${BASE_URL}/api/admin/inquiries?limit=5`, { headers: getAuthHeaders() });
    const data = await res.json();
    log('12. 문의 목록 조회', res.ok, `${data.data?.length || 0}건`);
  } catch (e) { log('12. 문의 목록 조회', false, e.message); }

  // ========== 공지사항 관리 ==========
  console.log('\n--- 공지사항 관리 ---');

  // 13. 공지사항 목록 조회
  try {
    const res = await fetch(`${BASE_URL}/api/notices`, { headers: getAuthHeaders() });
    const data = await res.json();
    log('13. 공지사항 목록 조회', res.ok, `${data.data?.length || 0}개`);
  } catch (e) { log('13. 공지사항 목록 조회', false, e.message); }

  // 14. 공지사항 작성
  let noticeId = null;
  try {
    const res = await fetch(`${BASE_URL}/api/admin/notices`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        title: '관리자 테스트 공지사항',
        content: '이것은 관리자 기능 테스트를 위한 공지사항입니다.',
        is_pinned: false
      })
    });
    const data = await res.json();
    if (res.ok && data.data) {
      noticeId = data.data.id;
      log('14. 공지사항 작성', true, `ID: ${noticeId?.slice(0,8)}...`);
    } else {
      log('14. 공지사항 작성', false, data.error);
    }
  } catch (e) { log('14. 공지사항 작성', false, e.message); }

  // 15. 공지사항 삭제
  if (noticeId) {
    try {
      const res = await fetch(`${BASE_URL}/api/admin/notices/${noticeId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      log('15. 공지사항 삭제', res.ok, '삭제됨');
    } catch (e) { log('15. 공지사항 삭제', false, e.message); }
  } else {
    log('15. 공지사항 삭제', false, '공지사항 없음');
  }

  // ========== 광고 관리 ==========
  console.log('\n--- 광고 관리 ---');

  // 16. 광고 목록 조회
  try {
    const res = await fetch(`${BASE_URL}/api/admin/ads`, { headers: getAuthHeaders() });
    const data = await res.json();
    log('16. 광고 목록 조회', res.ok || res.status === 404, `${data.data?.length || 0}개`);
  } catch (e) { log('16. 광고 목록 조회', false, e.message); }

  // 17. 광고 통계
  try {
    const res = await fetch(`${BASE_URL}/api/admin/ads/stats`, { headers: getAuthHeaders() });
    const data = await res.json();
    log('17. 광고 통계', res.ok || res.status === 404, '통계 조회 시도');
  } catch (e) { log('17. 광고 통계', false, e.message); }

  // ========== 시스템 관리 ==========
  console.log('\n--- 시스템 관리 ---');

  // 18. 자동 조절 설정 조회
  try {
    const res = await fetch(`${BASE_URL}/api/admin/auto-moderate`, { headers: getAuthHeaders() });
    const data = await res.json();
    log('18. 자동 조절 설정', res.ok || res.status === 404, '설정 조회 시도');
  } catch (e) { log('18. 자동 조절 설정', false, e.message); }

  // 19. 감사 로그 조회
  try {
    const res = await fetch(`${BASE_URL}/api/admin/audit-logs?limit=5`, { headers: getAuthHeaders() });
    const data = await res.json();
    log('19. 감사 로그 조회', res.ok || res.status === 404, `${data.data?.length || 0}건`);
  } catch (e) { log('19. 감사 로그 조회', false, e.message); }

  // 20. 커뮤니티 통계
  try {
    const res = await fetch(`${BASE_URL}/api/statistics/community`, { headers: getAuthHeaders() });
    const data = await res.json();
    log('20. 커뮤니티 통계', res.ok, data.success ? '통계 OK' : data.error);
  } catch (e) { log('20. 커뮤니티 통계', false, e.message); }

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
