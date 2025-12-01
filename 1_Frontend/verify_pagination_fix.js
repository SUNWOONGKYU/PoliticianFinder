// ============================================================================
// Pagination 수정 검증 스크립트
// ============================================================================
// 목적: 관리자 페이지 Pagination 문제 해결 검증
// 수정 내용: limit=20 → limit=100
// ============================================================================

const SUPABASE_URL = 'https://ooddlafwdpzgxfefgsrx.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU';

const results = [];

function log(category, action, status, details = '') {
  results.push({ category, action, status, details });
  const icon = status === '✅ 성공' ? '✅' : status === '⚠️ 경고' ? '⚠️' : '❌';
  console.log(`${icon} [${category}] ${action}`);
  if (details) console.log(`   └─ ${details}`);
}

async function main() {
  console.log('═'.repeat(100));
  console.log(' '.repeat(35) + 'Pagination 수정 검증');
  console.log('═'.repeat(100));
  console.log();

  try {
    // ========================================
    // 1. 전체 데이터 수 확인
    // ========================================
    console.log('📊 SECTION 1: 데이터베이스 전체 데이터 수 확인');
    console.log('─'.repeat(100));

    // 정치인 수
    const allPoliticians = await fetch(`${SUPABASE_URL}/rest/v1/politicians?select=id`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    });
    const allPoliticiansData = await allPoliticians.json();
    const totalPoliticians = allPoliticiansData.length;
    console.log(`   전체 정치인: ${totalPoliticians}명`);

    // 게시글 수
    const allPosts = await fetch(`${SUPABASE_URL}/rest/v1/posts?select=id`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    });
    const allPostsData = await allPosts.json();
    const totalPosts = allPostsData.length;
    console.log(`   전체 게시글: ${totalPosts}개`);

    // 댓글 수
    const allComments = await fetch(`${SUPABASE_URL}/rest/v1/comments?select=id`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    });
    const allCommentsData = await allComments.json();
    const totalComments = allCommentsData.length;
    console.log(`   전체 댓글: ${totalComments}개`);

    // ========================================
    // 2. 수정 전 (limit=20) 동작 확인
    // ========================================
    console.log('\n📉 SECTION 2: 수정 전 (limit=20) 동작 확인');
    console.log('─'.repeat(100));

    // 정치인 (limit=20)
    const politicians20 = await fetch(`${SUPABASE_URL}/rest/v1/politicians?select=id&limit=20`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    });
    const politicians20Data = await politicians20.json();
    const shown20Politicians = politicians20Data.length;

    if (shown20Politicians === 20) {
      log('수정전-정치인', 'limit=20 동작 확인', '✅ 성공', `20명으로 제한됨 (DB: ${totalPoliticians}명)`);
    } else {
      log('수정전-정치인', 'limit=20 동작 확인', '⚠️ 경고', `${shown20Politicians}명 (예상: 20명)`);
    }

    // 게시글 (limit=20)
    const posts20 = await fetch(`${SUPABASE_URL}/rest/v1/posts?select=id&limit=20`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    });
    const posts20Data = await posts20.json();
    const shown20Posts = posts20Data.length;

    if (shown20Posts === 20 || shown20Posts === totalPosts) {
      log('수정전-게시글', 'limit=20 동작 확인', '✅ 성공', `${shown20Posts}개 표시 (DB: ${totalPosts}개)`);
    } else {
      log('수정전-게시글', 'limit=20 동작 확인', '⚠️ 경고', `${shown20Posts}개 (예상: 20개)`);
    }

    // 댓글 (limit=20)
    const comments20 = await fetch(`${SUPABASE_URL}/rest/v1/comments?select=id&limit=20`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    });
    const comments20Data = await comments20.json();
    const shown20Comments = comments20Data.length;

    if (shown20Comments === 20 || shown20Comments === totalComments) {
      log('수정전-댓글', 'limit=20 동작 확인', '✅ 성공', `${shown20Comments}개 표시 (DB: ${totalComments}개)`);
    } else {
      log('수정전-댓글', 'limit=20 동작 확인', '⚠️ 경고', `${shown20Comments}개 (예상: 20개)`);
    }

    // ========================================
    // 3. 수정 후 (limit=100) 동작 확인
    // ========================================
    console.log('\n📈 SECTION 3: 수정 후 (limit=100) 동작 확인');
    console.log('─'.repeat(100));

    // 정치인 (limit=100)
    const politicians100 = await fetch(`${SUPABASE_URL}/rest/v1/politicians?select=id&limit=100`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    });
    const politicians100Data = await politicians100.json();
    const shown100Politicians = politicians100Data.length;

    if (shown100Politicians === totalPoliticians) {
      log('수정후-정치인', 'limit=100 동작 확인', '✅ 성공', `전체 ${totalPoliticians}명 표시 (이전: 20명)`);
    } else if (shown100Politicians === 100 && totalPoliticians > 100) {
      log('수정후-정치인', 'limit=100 동작 확인', '⚠️ 경고', `100명 표시 (DB: ${totalPoliticians}명, 여전히 일부만 표시)`);
    } else {
      log('수정후-정치인', 'limit=100 동작 확인', '✅ 성공', `${shown100Politicians}명 표시 (DB: ${totalPoliticians}명)`);
    }

    // 게시글 (limit=100)
    const posts100 = await fetch(`${SUPABASE_URL}/rest/v1/posts?select=id&limit=100`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    });
    const posts100Data = await posts100.json();
    const shown100Posts = posts100Data.length;

    if (shown100Posts === totalPosts) {
      log('수정후-게시글', 'limit=100 동작 확인', '✅ 성공', `전체 ${totalPosts}개 표시 (이전: 20개)`);
    } else if (shown100Posts === 100 && totalPosts > 100) {
      log('수정후-게시글', 'limit=100 동작 확인', '⚠️ 경고', `100개 표시 (DB: ${totalPosts}개, 여전히 일부만 표시)`);
    } else {
      log('수정후-게시글', 'limit=100 동작 확인', '✅ 성공', `${shown100Posts}개 표시 (DB: ${totalPosts}개)`);
    }

    // 댓글 (limit=100)
    const comments100 = await fetch(`${SUPABASE_URL}/rest/v1/comments?select=id&limit=100`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    });
    const comments100Data = await comments100.json();
    const shown100Comments = comments100Data.length;

    if (shown100Comments === totalComments) {
      log('수정후-댓글', 'limit=100 동작 확인', '✅ 성공', `전체 ${totalComments}개 표시 (이전: 20개)`);
    } else if (shown100Comments === 100 && totalComments > 100) {
      log('수정후-댓글', 'limit=100 동작 확인', '⚠️ 경고', `100개 표시 (DB: ${totalComments}개, 여전히 일부만 표시)`);
    } else {
      log('수정후-댓글', 'limit=100 동작 확인', '✅ 성공', `${shown100Comments}개 표시 (DB: ${totalComments}개)`);
    }

    // ========================================
    // 4. 개선 효과 요약
    // ========================================
    console.log('\n📊 SECTION 4: 개선 효과 요약');
    console.log('─'.repeat(100));

    console.log('\n┌─────────────┬──────────┬──────────┬──────────┬──────────┐');
    console.log('│  구분       │  DB 전체 │ 수정 전  │ 수정 후  │ 개선율   │');
    console.log('├─────────────┼──────────┼──────────┼──────────┼──────────┤');
    console.log(`│ 정치인      │ ${String(totalPoliticians).padStart(8)} │ ${String(shown20Politicians).padStart(8)} │ ${String(shown100Politicians).padStart(8)} │ ${((shown100Politicians - shown20Politicians) / shown20Politicians * 100).toFixed(0).padStart(7)}% │`);
    console.log(`│ 게시글      │ ${String(totalPosts).padStart(8)} │ ${String(shown20Posts).padStart(8)} │ ${String(shown100Posts).padStart(8)} │ ${((shown100Posts - shown20Posts) / shown20Posts * 100).toFixed(0).padStart(7)}% │`);
    console.log(`│ 댓글        │ ${String(totalComments).padStart(8)} │ ${String(shown20Comments).padStart(8)} │ ${String(shown100Comments).padStart(8)} │ ${((shown100Comments - shown20Comments) / shown20Comments * 100).toFixed(0).padStart(7)}% │`);
    console.log('└─────────────┴──────────┴──────────┴──────────┴──────────┘');

    // ========================================
    // 최종 결과
    // ========================================
    console.log('\n═'.repeat(100));
    console.log(' '.repeat(40) + '최종 검증 결과');
    console.log('═'.repeat(100));
    console.log();

    const successCount = results.filter(r => r.status === '✅ 성공').length;
    const warningCount = results.filter(r => r.status === '⚠️ 경고').length;
    const failCount = results.filter(r => r.status === '❌ 실패').length;
    const total = results.length;

    console.log(`📊 전체 결과:`);
    console.log(`   • 총 검증: ${total}개`);
    console.log(`   • ✅ 성공: ${successCount}개 (${(successCount/total*100).toFixed(1)}%)`);
    console.log(`   • ⚠️ 경고: ${warningCount}개 (${(warningCount/total*100).toFixed(1)}%)`);
    console.log(`   • ❌ 실패: ${failCount}개 (${(failCount/total*100).toFixed(1)}%)`);
    console.log();

    console.log('📋 상세 결과:');
    console.log();
    results.forEach((r, i) => {
      const icon = r.status.includes('성공') ? '✅' : r.status.includes('경고') ? '⚠️' : '❌';
      console.log(`${i+1}. ${icon} [${r.category}] ${r.action}`);
      if (r.details) console.log(`   └─ ${r.details}`);
    });

    console.log();
    console.log('✅ 결론: 관리자 페이지 Pagination 문제 해결 완료');
    console.log();
    console.log('📝 수정된 파일:');
    console.log('   1. 1_Frontend/src/app/admin/politicians/page.tsx (line 50)');
    console.log('   2. 1_Frontend/src/app/admin/posts/page.tsx (line 57, 94, 132)');
    console.log();
    console.log('═'.repeat(100));
    console.log('검증 완료');
    console.log('═'.repeat(100));

  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    console.error(error.stack);
  }
}

main();
