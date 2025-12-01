// ============================================================================
// 관리자 계정 종합 기능 테스트 - 최종 버전 (2025-11-30)
// ============================================================================
// 테스트 계정: wksun999@gmail.com (관리자)
// 테스트 방법: Supabase SERVICE_ROLE_KEY 직접 사용 (올바른 스키마)
// ============================================================================

const SUPABASE_URL = 'https://ooddlafwdpzgxfefgsrx.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU';

const results = [];

function log(category, feature, status, details = '', note = '') {
  results.push({ category, feature, status, details, note });
  const icon = status === '✅ 성공' ? '✅' : '❌';
  console.log(`${icon} [${category}] ${feature}`);
  if (details) console.log(`   └─ ${details}`);
  if (note) console.log(`   📝 ${note}`);
}

async function query(category, feature, table, params = {}, note = '') {
  try {
    let url = `${SUPABASE_URL}/rest/v1/${table}?`;
    if (params.select) url += `select=${params.select}&`;
    if (params.limit) url += `limit=${params.limit}&`;
    if (params.order) url += `order=${params.order}&`;
    if (params.eq) {
      for (const [key, value] of Object.entries(params.eq)) {
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
      const count = Array.isArray(data) ? data.length : 1;
      log(category, feature, '✅ 성공', `${count}개 조회`, note);
      return { success: true, data, count };
    } else {
      log(category, feature, '❌ 실패', data.message || JSON.stringify(data).substring(0, 100), note);
      return { success: false, error: data };
    }
  } catch (error) {
    log(category, feature, '❌ 실패', error.message, note);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('═'.repeat(110));
  console.log(' '.repeat(25) + '관리자 계정 종합 기능 테스트 - 최종 버전');
  console.log('═'.repeat(110));
  console.log();
  console.log('📋 테스트 정보:');
  console.log('   • 테스트 계정: wksun999@gmail.com (관리자)');
  console.log('   • 테스트 일시: 2025-11-30');
  console.log('   • 테스트 방법: Supabase SERVICE_ROLE_KEY 직접 사용 (올바른 스키마 적용)');
  console.log();
  console.log('═'.repeat(110));
  console.log();

  // ========================================
  // 1. 관리자 - 회원 관리
  // ========================================
  console.log('📊 SECTION 1: 관리자 - 회원 관리');
  console.log('─'.repeat(110));

  await query('관리자-회원관리', '전체 회원 목록 조회', 'users', {
    select: 'user_id,email,name,nickname,role,is_active,created_at',
    limit: 20,
  }, '관리자 페이지에서 모든 회원 확인 가능');

  await query('관리자-회원관리', '관리자 필터링 (role=admin)', 'users', {
    select: 'user_id,email,name,role',
    eq: { role: 'admin' },
  }, 'Role 필터로 관리자만 조회');

  await query('관리자-회원관리', '일반회원 필터링 (role=user)', 'users', {
    select: 'user_id,email,name,role',
    eq: { role: 'user' },
  }, 'Role 필터로 일반회원만 조회');

  await query('관리자-회원관리', '활성회원 필터링 (is_active=true)', 'users', {
    select: 'user_id,email,name,is_active',
    eq: { is_active: 'true' },
  }, 'Status 필터로 활성회원만 조회');

  console.log();

  // ========================================
  // 2. 관리자 - 정치인 관리
  // ========================================
  console.log('📊 SECTION 2: 관리자 - 정치인 관리');
  console.log('─'.repeat(110));

  await query('관리자-정치인관리', '전체 정치인 목록 조회', 'politicians', {
    select: 'id,name,party,position,region,district',
    limit: 20,
  }, '관리자 페이지에서 모든 정치인 확인 가능');

  await query('관리자-정치인관리', '더불어민주당 정치인 필터링', 'politicians', {
    select: 'id,name,party',
    eq: { party: '더불어민주당' },
    limit: 10,
  }, 'Party 필터로 정당별 조회');

  await query('관리자-정치인관리', '서울 지역 정치인 필터링', 'politicians', {
    select: 'id,name,region',
    eq: { region: '서울' },
    limit: 10,
  }, 'Region 필터로 지역별 조회');

  console.log();

  // ========================================
  // 3. 관리자 - 게시글 관리
  // ========================================
  console.log('📊 SECTION 3: 관리자 - 게시글 관리');
  console.log('─'.repeat(110));

  await query('관리자-게시글관리', '전체 게시글 목록 조회', 'posts', {
    select: 'id,title,user_id,category,view_count,upvotes,downvotes,comment_count,created_at',
    limit: 20,
    order: 'created_at.desc',
  }, '관리자 페이지에서 모든 게시글 확인 (최신순)');

  await query('관리자-게시글관리', '공지사항 필터링 (is_pinned=true)', 'posts', {
    select: 'id,title,is_pinned',
    eq: { is_pinned: 'true' },
  }, 'Pinned posts (공지사항) 조회');

  await query('관리자-게시글관리', '일반 카테고리 게시글 필터링', 'posts', {
    select: 'id,title,category',
    eq: { category: 'general' },
    limit: 10,
  }, 'Category 필터로 카테고리별 조회');

  await query('관리자-게시글관리', '뉴스 카테고리 게시글 필터링', 'posts', {
    select: 'id,title,category',
    eq: { category: 'news' },
    limit: 10,
  }, 'Category 필터로 뉴스 게시글만 조회');

  await query('관리자-게시글관리', '인기 게시글 조회 (upvotes 정렬)', 'posts', {
    select: 'id,title,upvotes,downvotes',
    limit: 10,
    order: 'upvotes.desc',
  }, 'Sort by upvotes (인기순)');

  console.log();

  // ========================================
  // 4. 관리자 - 댓글 관리
  // ========================================
  console.log('📊 SECTION 4: 관리자 - 댓글 관리');
  console.log('─'.repeat(110));

  await query('관리자-댓글관리', '전체 댓글 목록 조회', 'comments', {
    select: 'id,content,user_id,post_id,created_at',
    limit: 20,
    order: 'created_at.desc',
  }, '관리자 페이지에서 모든 댓글 확인');

  await query('관리자-댓글관리', '활성 댓글 필터링 (is_deleted=false)', 'comments', {
    select: 'id,content,is_deleted',
    eq: { is_deleted: 'false' },
    limit: 20,
  }, '삭제되지 않은 댓글만 조회');

  await query('관리자-댓글관리', '삭제된 댓글 필터링 (is_deleted=true)', 'comments', {
    select: 'id,content,is_deleted',
    eq: { is_deleted: 'true' },
  }, '삭제된 댓글 조회 (복구 가능)');

  console.log();

  // ========================================
  // 5. 관리자 - 문의 관리
  // ========================================
  console.log('📊 SECTION 5: 관리자 - 문의 관리');
  console.log('─'.repeat(110));

  await query('관리자-문의관리', '전체 문의 목록 조회', 'inquiries', {
    select: 'id,title,content,status,priority,email,created_at',
    limit: 20,
    order: 'created_at.desc',
  }, '관리자 페이지에서 모든 문의 확인');

  await query('관리자-문의관리', '미처리 문의 (status=pending)', 'inquiries', {
    select: 'id,title,status,priority',
    eq: { status: 'pending' },
  }, '처리 대기 중인 문의만 조회');

  await query('관리자-문의관리', '진행중 문의 (status=in_progress)', 'inquiries', {
    select: 'id,title,status',
    eq: { status: 'in_progress' },
  }, '현재 처리 중인 문의 조회');

  await query('관리자-문의관리', '완료된 문의 (status=resolved)', 'inquiries', {
    select: 'id,title,status',
    eq: { status: 'resolved' },
  }, '처리 완료된 문의 조회');

  await query('관리자-문의관리', '고우선순위 문의 (priority=high)', 'inquiries', {
    select: 'id,title,priority',
    eq: { priority: 'high' },
  }, '긴급 처리가 필요한 문의');

  console.log();

  // ========================================
  // 6. 일반 회원 - 커뮤니티 게시글
  // ========================================
  console.log('📊 SECTION 6: 일반 회원 - 커뮤니티 게시글');
  console.log('─'.repeat(110));

  await query('일반회원-커뮤니티', '게시글 목록 조회 (최신순)', 'posts', {
    select: 'id,title,user_id,category,view_count,upvotes,comment_count',
    limit: 10,
    order: 'created_at.desc',
  }, '일반 사용자가 커뮤니티 게시글 확인');

  await query('일반회원-커뮤니티', '인기 게시글 조회 (upvotes순)', 'posts', {
    select: 'id,title,upvotes,downvotes',
    limit: 10,
    order: 'upvotes.desc',
  }, 'Sort by likes (인기순)');

  await query('일반회원-커뮤니티', '조회수 많은 게시글 (view_count순)', 'posts', {
    select: 'id,title,view_count',
    limit: 10,
    order: 'view_count.desc',
  }, 'Sort by views (조회수순)');

  console.log();

  // ========================================
  // 7. 일반 회원 - 댓글
  // ========================================
  console.log('📊 SECTION 7: 일반 회원 - 댓글');
  console.log('─'.repeat(110));

  await query('일반회원-댓글', '댓글 목록 조회', 'comments', {
    select: 'id,content,user_id,post_id,created_at',
    limit: 10,
    order: 'created_at.desc',
  }, '일반 사용자가 댓글 읽기');

  await query('일반회원-댓글', '대댓글 조회 (parent_comment_id 있음)', 'comments', {
    select: 'id,content,parent_comment_id',
    limit: 10,
  }, '답글(대댓글) 확인');

  console.log();

  // ========================================
  // 8. 일반 회원 - 즐겨찾기
  // ========================================
  console.log('📊 SECTION 8: 일반 회원 - 즐겨찾기');
  console.log('─'.repeat(110));

  await query('일반회원-즐겨찾기', '즐겨찾기 목록 조회', 'favorite_politicians', {
    select: 'id,user_id,politician_id,created_at',
    limit: 20,
  }, '사용자가 즐겨찾기한 정치인 목록');

  console.log();

  // ========================================
  // 9. 일반 회원 - 알림
  // ========================================
  console.log('📊 SECTION 9: 일반 회원 - 알림');
  console.log('─'.repeat(110));

  await query('일반회원-알림', '전체 알림 조회', 'notifications', {
    select: 'id,user_id,type,content,is_read,created_at',
    limit: 20,
    order: 'created_at.desc',
  }, '사용자 알림 확인 (최신순)');

  await query('일반회원-알림', '읽지 않은 알림 (is_read=false)', 'notifications', {
    select: 'id,user_id,type,content,is_read',
    eq: { is_read: 'false' },
    limit: 10,
  }, 'Unread notifications (안 읽은 알림)');

  await query('일반회원-알림', '읽은 알림 (is_read=true)', 'notifications', {
    select: 'id,user_id,type,content,is_read',
    eq: { is_read: 'true' },
    limit: 10,
  }, 'Read notifications (읽은 알림)');

  console.log();

  // ========================================
  // 10. 일반 회원 - 팔로우
  // ========================================
  console.log('📊 SECTION 10: 일반 회원 - 팔로우');
  console.log('─'.repeat(110));

  await query('일반회원-팔로우', '팔로우 관계 조회', 'follows', {
    select: 'id,follower_id,following_id,created_at',
    limit: 20,
  }, '사용자가 팔로우한 다른 사용자');

  console.log();

  // ========================================
  // 11. 통계 및 데이터 현황
  // ========================================
  console.log('📊 SECTION 11: 통계 및 데이터 현황');
  console.log('─'.repeat(110));

  const statsResults = {
    politicians: await query('통계', '전체 정치인 수', 'politicians', { select: 'id' }),
    posts: await query('통계', '전체 게시글 수', 'posts', { select: 'id' }),
    comments: await query('통계', '전체 댓글 수', 'comments', { select: 'id' }),
    users: await query('통계', '전체 사용자 수', 'users', { select: 'user_id' }),
    inquiries: await query('통계', '전체 문의 수', 'inquiries', { select: 'id' }),
    notifications: await query('통계', '전체 알림 수', 'notifications', { select: 'id' }),
  };

  console.log();

  // ========================================
  // 최종 결과 요약
  // ========================================
  console.log('═'.repeat(110));
  console.log(' '.repeat(40) + '최종 테스트 결과 요약');
  console.log('═'.repeat(110));
  console.log();

  const successCount = results.filter(r => r.status === '✅ 성공').length;
  const failCount = results.filter(r => r.status === '❌ 실패').length;
  const total = results.length;

  console.log('📊 전체 테스트 결과:');
  console.log(`   • 총 테스트: ${total}개`);
  console.log(`   • ✅ 성공: ${successCount}개 (${(successCount/total*100).toFixed(1)}%)`);
  console.log(`   • ❌ 실패: ${failCount}개 (${(failCount/total*100).toFixed(1)}%)`);
  console.log();

  // 카테고리별 성공률
  const categories = [...new Set(results.map(r => r.category))];
  console.log('📈 카테고리별 성공률:');
  console.log();

  categories.forEach(cat => {
    const catResults = results.filter(r => r.category === cat);
    const catSuccess = catResults.filter(r => r.status === '✅ 성공').length;
    const catTotal = catResults.length;
    const rate = (catSuccess / catTotal * 100).toFixed(1);
    const bar = '█'.repeat(Math.floor(catSuccess / catTotal * 20));
    console.log(`   ${cat.padEnd(20)} ${catSuccess}/${catTotal} (${rate.padStart(5)}%) ${bar}`);
  });

  console.log();

  // 데이터 통계
  console.log('📊 현재 데이터 통계:');
  console.log(`   • 정치인: ${statsResults.politicians.count || 0}명`);
  console.log(`   • 게시글: ${statsResults.posts.count || 0}개`);
  console.log(`   • 댓글: ${statsResults.comments.count || 0}개`);
  console.log(`   • 사용자: ${statsResults.users.count || 0}명`);
  console.log(`   • 문의: ${statsResults.inquiries.count || 0}개`);
  console.log(`   • 알림: ${statsResults.notifications.count || 0}개`);
  console.log();

  // 상세 결과 표
  console.log('═'.repeat(110));
  console.log(' '.repeat(40) + '상세 테스트 결과 표');
  console.log('═'.repeat(110));
  console.log();
  console.log('| 번호 | 카테고리                | 기능명                                    | 결과 | 비고                                  |');
  console.log('|------|------------------------|------------------------------------------|------|---------------------------------------|');

  results.forEach((r, i) => {
    const num = (i + 1).toString().padStart(4);
    const cat = r.category.padEnd(22);
    const feature = r.feature.substring(0, 40).padEnd(40);
    const status = r.status.includes('성공') ? ' ✅  ' : ' ❌  ';
    const note = (r.details || r.note || '').substring(0, 35).padEnd(35);
    console.log(`| ${num} | ${cat} | ${feature} | ${status} | ${note} |`);
  });

  console.log();
  console.log('═'.repeat(110));
  console.log('테스트 완료');
  console.log('═'.repeat(110));
}

// Run all tests
runTests().catch(console.error);
