// 관리자 계정 종합 기능 테스트 - Supabase Direct Access
// SERVICE_ROLE_KEY를 사용하여 모든 기능 테스트

const SUPABASE_URL = 'https://ooddlafwdpzgxfefgsrx.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU';

const results = [];

function log(category, feature, status, details = '', note = '') {
  const result = { category, feature, status, details, note };
  results.push(result);

  const statusIcon = status === '✅ 성공' ? '✅' : status === '❌ 실패' ? '❌' : '⚠️';
  console.log(`${statusIcon} [${category}] ${feature}`);
  if (details) console.log(`   └─ ${details}`);
  if (note) console.log(`   📝 ${note}`);
}

async function testSupabaseQuery(category, feature, table, query = {}, note = '') {
  try {
    let url = `${SUPABASE_URL}/rest/v1/${table}?`;

    // Build query params
    if (query.select) url += `select=${query.select}&`;
    if (query.limit) url += `limit=${query.limit}&`;
    if (query.order) url += `order=${query.order}&`;
    if (query.eq) {
      for (const [key, value] of Object.entries(query.eq)) {
        url += `${key}=eq.${value}&`;
      }
    }

    const response = await fetch(url, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
    });

    const data = await response.json();

    if (response.ok) {
      const count = Array.isArray(data) ? data.length : 1;
      log(category, feature, '✅ 성공', `${count}개 레코드 조회`, note);
      return { success: true, data, count };
    } else {
      log(category, feature, '❌ 실패', data.message || JSON.stringify(data), note);
      return { success: false, error: data };
    }
  } catch (error) {
    log(category, feature, '❌ 실패', error.message, note);
    return { success: false, error: error.message };
  }
}

async function testInsert(category, feature, table, record, note = '') {
  try {
    const url = `${SUPABASE_URL}/rest/v1/${table}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(record),
    });

    const data = await response.json();

    if (response.ok || response.status === 201) {
      log(category, feature, '✅ 성공', '데이터 생성 완료', note);
      return { success: true, data };
    } else {
      log(category, feature, '❌ 실패', data.message || JSON.stringify(data), note);
      return { success: false, error: data };
    }
  } catch (error) {
    log(category, feature, '❌ 실패', error.message, note);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('='.repeat(100));
  console.log('                  관리자 계정 종합 기능 테스트 (Supabase Direct Access)');
  console.log('='.repeat(100));
  console.log();
  console.log('테스트 계정: wksun999@gmail.com (관리자)');
  console.log('테스트 방법: Supabase SERVICE_ROLE_KEY 직접 사용');
  console.log();
  console.log('='.repeat(100));
  console.log();

  // ========================================
  // 1. 관리자 - 회원 관리
  // ========================================
  console.log('📊 1. 관리자 - 회원 관리');
  console.log('-'.repeat(100));

  await testSupabaseQuery('관리자 - 회원 관리', '전체 회원 목록 조회', 'users', {
    select: 'user_id,email,name,nickname,role,is_active,created_at',
    limit: 20,
  }, '관리자 페이지에서 회원 목록 확인');

  await testSupabaseQuery('관리자 - 회원 관리', '관리자 회원 필터링', 'users', {
    select: 'user_id,email,name,role',
    eq: { role: 'admin' },
  }, 'Role 필터: admin');

  await testSupabaseQuery('관리자 - 회원 관리', '일반 회원 필터링', 'users', {
    select: 'user_id,email,name,role',
    eq: { role: 'user' },
  }, 'Role 필터: user');

  await testSupabaseQuery('관리자 - 회원 관리', '활성 회원 필터링', 'users', {
    select: 'user_id,email,name,is_active',
    eq: { is_active: 'true' },
  }, 'Status 필터: active');

  console.log();

  // ========================================
  // 2. 관리자 - 정치인 관리
  // ========================================
  console.log('📊 2. 관리자 - 정치인 관리');
  console.log('-'.repeat(100));

  await testSupabaseQuery('관리자 - 정치인 관리', '전체 정치인 목록 조회', 'politicians', {
    select: 'id,name,party,position,region,district',
    limit: 20,
  }, '관리자 페이지에서 정치인 목록 확인');

  await testSupabaseQuery('관리자 - 정치인 관리', '정당별 필터링 (더불어민주당)', 'politicians', {
    select: 'id,name,party',
    eq: { party: '더불어민주당' },
    limit: 10,
  }, 'Party 필터');

  await testSupabaseQuery('관리자 - 정치인 관리', '지역별 필터링 (서울)', 'politicians', {
    select: 'id,name,region',
    eq: { region: '서울' },
    limit: 10,
  }, 'Region 필터');

  console.log();

  // ========================================
  // 3. 관리자 - 게시글 관리
  // ========================================
  console.log('📊 3. 관리자 - 게시글 관리');
  console.log('-'.repeat(100));

  await testSupabaseQuery('관리자 - 게시글 관리', '전체 게시글 목록 조회', 'posts', {
    select: 'id,title,user_id,category,view_count,like_count,comment_count,created_at',
    limit: 20,
    order: 'created_at.desc',
  }, '관리자 페이지에서 게시글 관리');

  await testSupabaseQuery('관리자 - 게시글 관리', '공지사항 필터링', 'posts', {
    select: 'id,title,is_pinned',
    eq: { is_pinned: 'true' },
  }, 'Pinned posts (공지사항)');

  await testSupabaseQuery('관리자 - 게시글 관리', '카테고리별 필터링 (일반)', 'posts', {
    select: 'id,title,category',
    eq: { category: 'general' },
    limit: 10,
  }, 'Category 필터');

  console.log();

  // ========================================
  // 4. 관리자 - 댓글 관리
  // ========================================
  console.log('📊 4. 관리자 - 댓글 관리');
  console.log('-'.repeat(100));

  await testSupabaseQuery('관리자 - 댓글 관리', '전체 댓글 목록 조회', 'comments', {
    select: 'id,content,user_id,post_id,like_count,created_at',
    limit: 20,
    order: 'created_at.desc',
  }, '관리자 페이지에서 댓글 관리');

  await testSupabaseQuery('관리자 - 댓글 관리', '삭제되지 않은 댓글만', 'comments', {
    select: 'id,content,is_deleted',
    eq: { is_deleted: 'false' },
    limit: 20,
  }, 'Active comments only');

  console.log();

  // ========================================
  // 5. 관리자 - 문의 관리
  // ========================================
  console.log('📊 5. 관리자 - 문의 관리');
  console.log('-'.repeat(100));

  await testSupabaseQuery('관리자 - 문의 관리', '전체 문의 목록 조회', 'inquiries', {
    select: 'id,title,content,status,category,created_at',
    limit: 20,
    order: 'created_at.desc',
  }, '관리자 페이지에서 문의 관리');

  await testSupabaseQuery('관리자 - 문의 관리', '미처리 문의', 'inquiries', {
    select: 'id,title,status',
    eq: { status: 'pending' },
  }, 'Status 필터: pending');

  await testSupabaseQuery('관리자 - 문의 관리', '처리 완료 문의', 'inquiries', {
    select: 'id,title,status',
    eq: { status: 'resolved' },
  }, 'Status 필터: resolved');

  console.log();

  // ========================================
  // 6. 일반 회원 - 커뮤니티 게시글 (읽기)
  // ========================================
  console.log('📊 6. 일반 회원 - 커뮤니티 게시글');
  console.log('-'.repeat(100));

  await testSupabaseQuery('일반 회원 - 커뮤니티', '게시글 목록 조회', 'posts', {
    select: 'id,title,user_id,category,view_count,like_count,comment_count',
    limit: 10,
    order: 'created_at.desc',
  }, '일반 사용자가 커뮤니티 게시글 목록 확인');

  await testSupabaseQuery('일반 회원 - 커뮤니티', '인기 게시글 조회', 'posts', {
    select: 'id,title,like_count',
    limit: 5,
    order: 'like_count.desc',
  }, 'Sort by likes');

  console.log();

  // ========================================
  // 7. 일반 회원 - 댓글 (읽기/쓰기)
  // ========================================
  console.log('📊 7. 일반 회원 - 댓글');
  console.log('-'.repeat(100));

  await testSupabaseQuery('일반 회원 - 댓글', '댓글 목록 조회', 'comments', {
    select: 'id,content,user_id,post_id,like_count',
    limit: 10,
  }, '일반 사용자가 댓글 읽기');

  console.log();

  // ========================================
  // 8. 일반 회원 - 즐겨찾기
  // ========================================
  console.log('📊 8. 일반 회원 - 즐겨찾기');
  console.log('-'.repeat(100));

  await testSupabaseQuery('일반 회원 - 즐겨찾기', '즐겨찾기 목록 조회', 'favorite_politicians', {
    select: 'id,user_id,politician_id,created_at',
    limit: 20,
  }, '사용자가 즐겨찾기한 정치인 목록');

  console.log();

  // ========================================
  // 9. 일반 회원 - 알림
  // ========================================
  console.log('📊 9. 일반 회원 - 알림');
  console.log('-'.repeat(100));

  await testSupabaseQuery('일반 회원 - 알림', '전체 알림 조회', 'notifications', {
    select: 'id,user_id,type,title,content,is_read,created_at',
    limit: 20,
    order: 'created_at.desc',
  }, '사용자 알림 확인');

  await testSupabaseQuery('일반 회원 - 알림', '읽지 않은 알림', 'notifications', {
    select: 'id,user_id,type,title,is_read',
    eq: { is_read: 'false' },
    limit: 10,
  }, 'Unread notifications');

  console.log();

  // ========================================
  // 10. 일반 회원 - 팔로우
  // ========================================
  console.log('📊 10. 일반 회원 - 팔로우');
  console.log('-'.repeat(100));

  await testSupabaseQuery('일반 회원 - 팔로우', '팔로우 목록 조회', 'follows', {
    select: 'id,follower_id,following_id,created_at',
    limit: 20,
  }, '사용자가 팔로우한 다른 사용자 목록');

  console.log();

  // ========================================
  // 11. 통계 및 기타
  // ========================================
  console.log('📊 11. 통계 및 기타');
  console.log('-'.repeat(100));

  // 정치인 통계
  const politiciansResult = await testSupabaseQuery('통계', '정치인 통계', 'politicians', {
    select: 'id',
  }, '전체 정치인 수');

  // 게시글 통계
  const postsResult = await testSupabaseQuery('통계', '게시글 통계', 'posts', {
    select: 'id',
  }, '전체 게시글 수');

  // 댓글 통계
  const commentsResult = await testSupabaseQuery('통계', '댓글 통계', 'comments', {
    select: 'id',
  }, '전체 댓글 수');

  // 사용자 통계
  const usersResult = await testSupabaseQuery('통계', '사용자 통계', 'users', {
    select: 'user_id',
  }, '전체 사용자 수');

  console.log();

  // ========================================
  // 최종 결과 요약
  // ========================================
  console.log('='.repeat(100));
  console.log('                                    최종 테스트 결과 요약');
  console.log('='.repeat(100));
  console.log();

  const successCount = results.filter(r => r.status === '✅ 성공').length;
  const failCount = results.filter(r => r.status === '❌ 실패').length;
  const total = results.length;

  console.log(`📊 전체 테스트 결과:`);
  console.log(`   • 총 테스트: ${total}개`);
  console.log(`   • ✅ 성공: ${successCount}개 (${(successCount/total*100).toFixed(1)}%)`);
  console.log(`   • ❌ 실패: ${failCount}개 (${(failCount/total*100).toFixed(1)}%)`);
  console.log();

  // 카테고리별 성공률
  const categories = [...new Set(results.map(r => r.category))];
  console.log(`📈 카테고리별 성공률:`);
  console.log();

  categories.forEach(cat => {
    const catResults = results.filter(r => r.category === cat);
    const catSuccess = catResults.filter(r => r.status === '✅ 성공').length;
    const catTotal = catResults.length;
    const successRate = (catSuccess / catTotal * 100).toFixed(1);
    console.log(`   ${cat}: ${catSuccess}/${catTotal} (${successRate}%)`);
  });

  console.log();

  // 통계 정보
  console.log(`📊 현재 데이터 통계:`);
  console.log(`   • 정치인: ${politiciansResult.count || 0}명`);
  console.log(`   • 게시글: ${postsResult.count || 0}개`);
  console.log(`   • 댓글: ${commentsResult.count || 0}개`);
  console.log(`   • 사용자: ${usersResult.count || 0}명`);
  console.log();

  // 상세 테스트 목록
  console.log('='.repeat(100));
  console.log('                                    상세 테스트 목록');
  console.log('='.repeat(100));
  console.log();

  results.forEach((r, i) => {
    const icon = r.status === '✅ 성공' ? '✅' : '❌';
    console.log(`${i+1}. ${icon} [${r.category}] ${r.feature}`);
    if (r.details) console.log(`   └─ ${r.details}`);
    if (r.note) console.log(`   📝 ${r.note}`);
  });

  console.log();
  console.log('='.repeat(100));
  console.log('테스트 완료');
  console.log('='.repeat(100));
}

// Run tests
runTests().catch(console.error);
