// ============================================================================
// 빠진 기능 테스트 - 정치인 평가, 다운보트, 관리자 페이지 데이터 확인
// ============================================================================

const SUPABASE_URL = 'https://ooddlafwdpzgxfefgsrx.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU';
const VALID_USER_ID = 'e79307b9-2981-434b-bf63-db7f0eba2e76';

const results = [];

function log(category, action, status, details = '') {
  results.push({ category, action, status, details });
  const icon = status === '✅ 성공' ? '✅' : status === '⚠️ 경고' ? '⚠️' : '❌';
  console.log(`${icon} [${category}] ${action}`);
  if (details) console.log(`   └─ ${details}`);
}

async function main() {
  console.log('═'.repeat(100));
  console.log(' '.repeat(35) + '빠진 기능 추가 테스트');
  console.log('═'.repeat(100));
  console.log();

  try {
    // ========================================
    // 1. 정치인 평가하기 (Rating) 테스트
    // ========================================
    console.log('⭐ SECTION 1: 회원 - 정치인 평가하기 (Rating)');
    console.log('─'.repeat(100));

    // 정치인 가져오기
    const politicianResponse = await fetch(`${SUPABASE_URL}/rest/v1/politicians?select=id,name&limit=1`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    });
    const politicians = await politicianResponse.json();
    const politicianId = politicians[0].id;
    const politicianName = politicians[0].name;

    console.log(`   대상 정치인: ${politicianName} (${politicianId})`);

    // Rating 테이블 스키마 먼저 확인
    const checkRatingResponse = await fetch(`${SUPABASE_URL}/rest/v1/politician_ratings?select=*&limit=1`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    });

    if (checkRatingResponse.ok) {
      const existingRatings = await checkRatingResponse.json();
      console.log(`   기존 평가 수: ${existingRatings.length}개`);

      if (existingRatings.length > 0) {
        console.log(`   스키마 확인: ${Object.keys(existingRatings[0]).join(', ')}`);
      }

      // 평가 추가
      const rating = {
        user_id: VALID_USER_ID,
        politician_id: politicianId,
        rating: 5,
      };

      const ratingResponse = await fetch(`${SUPABASE_URL}/rest/v1/politician_ratings`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(rating),
      });

      if (ratingResponse.ok) {
        const data = await ratingResponse.json();
        log('회원-정치인평가', '정치인 평가 등록 (CREATE)', '✅ 성공', `${politicianName}에게 5점 평가`);
      } else {
        const error = await ratingResponse.json();
        if (error.code === '23505') {
          // 이미 평가했으면 업데이트
          const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/politician_ratings?user_id=eq.${VALID_USER_ID}&politician_id=eq.${politicianId}`, {
            method: 'PATCH',
            headers: {
              'apikey': SERVICE_KEY,
              'Authorization': `Bearer ${SERVICE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation',
            },
            body: JSON.stringify({ rating: 5 }),
          });

          if (updateResponse.ok) {
            log('회원-정치인평가', '정치인 평가 수정 (UPDATE)', '✅ 성공', `${politicianName} 평가를 5점으로 수정`);
          } else {
            log('회원-정치인평가', '정치인 평가 등록/수정', '❌ 실패', error.message);
          }
        } else {
          log('회원-정치인평가', '정치인 평가 등록 (CREATE)', '❌ 실패', error.message);
        }
      }
    } else {
      log('회원-정치인평가', '정치인 평가 테이블 확인', '❌ 실패', 'politician_ratings 테이블 접근 불가');
    }

    // ========================================
    // 2. 게시글 다운보트 테스트
    // ========================================
    console.log('\n👎 SECTION 2: 회원 - 게시글 다운보트 (Downvote)');
    console.log('─'.repeat(100));

    // 테스트용 게시글 생성
    const testPost = {
      user_id: VALID_USER_ID,
      title: '다운보트 테스트용 게시글',
      content: '이 게시글은 다운보트 테스트를 위한 임시 게시글입니다.',
      category: 'general',
      is_pinned: false,
      upvotes: 0,
      downvotes: 0,
      moderation_status: 'approved',
    };

    const postResponse = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(testPost),
    });

    if (postResponse.ok) {
      const createdPost = (await postResponse.json())[0];
      console.log(`   생성된 게시글 ID: ${createdPost.id}`);

      // Downvote 추가
      const downvoteResponse = await fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${createdPost.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({ downvotes: 3 }),
      });

      if (downvoteResponse.ok) {
        const updated = (await downvoteResponse.json())[0];
        log('회원-게시글반대', '게시글 다운보트 (downvote)', '✅ 성공', `downvotes: 0 → ${updated.downvotes}`);
      } else {
        const error = await downvoteResponse.json();
        log('회원-게시글반대', '게시글 다운보트 (downvote)', '❌ 실패', error.message);
      }

      // 테스트 게시글 삭제
      await fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${createdPost.id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
        },
      });
      console.log(`   테스트 게시글 삭제 완료`);
    }

    // ========================================
    // 3. 관리자 페이지 데이터 정확성 확인
    // ========================================
    console.log('\n📊 SECTION 3: 관리자 페이지 데이터 정확성 확인');
    console.log('─'.repeat(100));

    // 3-1. 정치인 수 확인
    const allPoliticians = await fetch(`${SUPABASE_URL}/rest/v1/politicians?select=id`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    });
    const allPoliticiansData = await allPoliticians.json();
    const totalPoliticians = allPoliticiansData.length;

    const adminPoliticians = await fetch(`${SUPABASE_URL}/rest/v1/politicians?select=id&limit=20`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    });
    const adminPoliticiansData = await adminPoliticians.json();
    const adminShownPoliticians = adminPoliticiansData.length;

    if (totalPoliticians === adminShownPoliticians) {
      log('관리자-정치인관리', '정치인 수 정확성', '✅ 성공', `DB: ${totalPoliticians}명 = Admin 표시: ${adminShownPoliticians}명`);
    } else {
      log('관리자-정치인관리', '정치인 수 정확성', '⚠️ 경고', `DB: ${totalPoliticians}명 ≠ Admin 표시: ${adminShownPoliticians}명 (limit=20 때문)`);
    }

    // 3-2. 게시글 수 확인
    const allPosts = await fetch(`${SUPABASE_URL}/rest/v1/posts?select=id`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    });
    const allPostsData = await allPosts.json();
    const totalPosts = allPostsData.length;

    const adminPosts = await fetch(`${SUPABASE_URL}/rest/v1/posts?select=id&limit=20`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    });
    const adminPostsData = await adminPosts.json();
    const adminShownPosts = adminPostsData.length;

    if (totalPosts === adminShownPosts) {
      log('관리자-게시글관리', '게시글 수 정확성', '✅ 성공', `DB: ${totalPosts}개 = Admin 표시: ${adminShownPosts}개`);
    } else {
      log('관리자-게시글관리', '게시글 수 정확성', '⚠️ 경고', `DB: ${totalPosts}개 ≠ Admin 표시: ${adminShownPosts}개 (limit=20 때문)`);
    }

    // 3-3. 댓글 수 확인
    const allComments = await fetch(`${SUPABASE_URL}/rest/v1/comments?select=id`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    });
    const allCommentsData = await allComments.json();
    const totalComments = allCommentsData.length;

    const adminComments = await fetch(`${SUPABASE_URL}/rest/v1/comments?select=id&limit=20`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    });
    const adminCommentsData = await adminComments.json();
    const adminShownComments = adminCommentsData.length;

    if (totalComments === adminShownComments) {
      log('관리자-댓글관리', '댓글 수 정확성', '✅ 성공', `DB: ${totalComments}개 = Admin 표시: ${adminShownComments}개`);
    } else {
      log('관리자-댓글관리', '댓글 수 정확성', '⚠️ 경고', `DB: ${totalComments}개 ≠ Admin 표시: ${adminShownComments}개 (limit=20 때문)`);
    }

    // ========================================
    // 4. 관리자 댓글 관리 페이지 확인
    // ========================================
    console.log('\n💬 SECTION 4: 관리자 - 댓글 관리 페이지 확인');
    console.log('─'.repeat(100));

    // Admin Comments API 확인
    const adminCommentsPage = await fetch(`${SUPABASE_URL}/rest/v1/comments?select=id,content,user_id,post_id,is_deleted,created_at&limit=20&order=created_at.desc`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    });

    if (adminCommentsPage.ok) {
      const comments = await adminCommentsPage.json();
      log('관리자-댓글관리', '댓글 관리 페이지 API', '✅ 성공', `${comments.length}개 댓글 조회 가능`);

      // 삭제된 댓글 수
      const deletedCount = comments.filter(c => c.is_deleted).length;
      console.log(`   └─ 삭제된 댓글: ${deletedCount}개`);
      console.log(`   └─ 활성 댓글: ${comments.length - deletedCount}개`);
    } else {
      log('관리자-댓글관리', '댓글 관리 페이지 API', '❌ 실패', '댓글 조회 불가');
    }

    // ========================================
    // 최종 결과
    // ========================================
    console.log('\n═'.repeat(100));
    console.log(' '.repeat(40) + '최종 테스트 결과');
    console.log('═'.repeat(100));
    console.log();

    const successCount = results.filter(r => r.status === '✅ 성공').length;
    const warningCount = results.filter(r => r.status === '⚠️ 경고').length;
    const failCount = results.filter(r => r.status === '❌ 실패').length;
    const total = results.length;

    console.log(`📊 전체 결과:`);
    console.log(`   • 총 테스트: ${total}개`);
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
    console.log('═'.repeat(100));
    console.log('테스트 완료');
    console.log('═'.repeat(100));

  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    console.error(error.stack);
  }
}

main();
