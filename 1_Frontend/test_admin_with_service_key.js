// 관리자 기능 테스트 - Supabase Service Role Key 사용
// 브라우저 세션 없이 직접 Supabase API 호출

const SUPABASE_URL = 'https://ooddlafwdpzgxfefgsrx.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU';

const results = [];

function log(category, feature, status, details = '') {
  const result = { category, feature, status, details };
  results.push(result);

  const statusIcon = status === 'success' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${statusIcon} [${category}] ${feature}: ${details}`);
}

async function testSupabaseQuery(description, table, query = {}) {
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
      },
    });

    const data = await response.json();

    if (response.ok) {
      log('Supabase Direct', description, 'success', `${Array.isArray(data) ? data.length : '1'} records`);
      return { success: true, data };
    } else {
      log('Supabase Direct', description, 'fail', data.message || JSON.stringify(data));
      return { success: false, error: data };
    }
  } catch (error) {
    log('Supabase Direct', description, 'fail', error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('='.repeat(80));
  console.log('관리자 기능 테스트 - Supabase Service Role Key 직접 사용');
  console.log('='.repeat(80));
  console.log();

  // ========================================
  // 1. Users 테이블 조회
  // ========================================
  console.log('📊 1. 사용자 관리 테스트');
  console.log('-'.repeat(80));

  await testSupabaseQuery('전체 사용자 조회', 'users', {
    select: 'user_id,email,name,nickname,role,is_active',
    limit: 10,
  });

  await testSupabaseQuery('관리자 사용자 조회', 'users', {
    select: 'user_id,email,name,role',
    eq: { role: 'admin' },
  });

  await testSupabaseQuery('활성 사용자 조회', 'users', {
    select: 'user_id,email,name,is_active',
    eq: { is_active: 'true' },
  });

  console.log();

  // ========================================
  // 2. Politicians 테이블 조회
  // ========================================
  console.log('📊 2. 정치인 관리 테스트');
  console.log('-'.repeat(80));

  await testSupabaseQuery('전체 정치인 조회', 'politicians', {
    select: 'id,name,party,position',
    limit: 10,
  });

  await testSupabaseQuery('서울 정치인 조회', 'politicians', {
    select: 'id,name,election_region',
    eq: { election_region: '서울' },
    limit: 5,
  });

  console.log();

  // ========================================
  // 3. Community Posts 테이블 조회
  // ========================================
  console.log('📊 3. 커뮤니티 게시글 관리 테스트');
  console.log('-'.repeat(80));

  await testSupabaseQuery('전체 게시글 조회', 'community_posts', {
    select: 'id,title,author_id,created_at',
    limit: 10,
    order: 'created_at.desc',
  });

  await testSupabaseQuery('공지사항 조회', 'community_posts', {
    select: 'id,title,is_notice',
    eq: { is_notice: 'true' },
  });

  console.log();

  // ========================================
  // 4. Comments 테이블 조회
  // ========================================
  console.log('📊 4. 댓글 관리 테스트');
  console.log('-'.repeat(80));

  await testSupabaseQuery('전체 댓글 조회', 'comments', {
    select: 'id,content,author_id,created_at',
    limit: 10,
  });

  console.log();

  // ========================================
  // 5. Inquiries 테이블 조회
  // ========================================
  console.log('📊 5. 문의 관리 테스트');
  console.log('-'.repeat(80));

  await testSupabaseQuery('전체 문의 조회', 'inquiries', {
    select: 'id,title,status,created_at',
    limit: 10,
  });

  await testSupabaseQuery('미처리 문의 조회', 'inquiries', {
    select: 'id,title,status',
    eq: { status: 'pending' },
  });

  console.log();

  // ========================================
  // 6. Favorites 테이블 조회
  // ========================================
  console.log('📊 6. 즐겨찾기 테스트');
  console.log('-'.repeat(80));

  await testSupabaseQuery('전체 즐겨찾기 조회', 'favorite_politicians', {
    select: 'id,user_id,politician_id',
    limit: 10,
  });

  console.log();

  // ========================================
  // 7. Notifications 테이블 조회
  // ========================================
  console.log('📊 7. 알림 테스트');
  console.log('-'.repeat(80));

  await testSupabaseQuery('전체 알림 조회', 'notifications', {
    select: 'id,user_id,type,is_read',
    limit: 10,
  });

  console.log();

  // ========================================
  // 최종 결과 요약
  // ========================================
  console.log('='.repeat(80));
  console.log('테스트 결과 요약');
  console.log('='.repeat(80));
  console.log();

  const successCount = results.filter(r => r.status === 'success').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  const total = results.length;

  console.log(`총 테스트: ${total}개`);
  console.log(`성공: ${successCount}개 (${(successCount/total*100).toFixed(1)}%)`);
  console.log(`실패: ${failCount}개 (${(failCount/total*100).toFixed(1)}%)`);
  console.log();

  console.log('📋 전체 테스트 목록:');
  console.log();
  results.forEach((r, i) => {
    const icon = r.status === 'success' ? '✅' : '❌';
    console.log(`${i+1}. ${icon} [${r.category}] ${r.feature}`);
    if (r.details) console.log(`   └─ ${r.details}`);
  });
}

// Node.js 18+ 에서 fetch 사용 가능
runTests().catch(console.error);
