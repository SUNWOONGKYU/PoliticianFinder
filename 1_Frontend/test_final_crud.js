// ============================================================================
// 최종 CRUD 종합 테스트 - profiles 외래키 해결
// ============================================================================

const SUPABASE_URL = 'https://ooddlafwdpzgxfefgsrx.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU';

// 기존 posts에서 사용 중인 user_id (profiles 테이블에 존재)
const VALID_USER_ID = 'e79307b9-2981-434b-bf63-db7f0eba2e76';

const results = [];

function log(category, action, status, details = '') {
  results.push({ category, action, status, details });
  const icon = status === '✅ 성공' ? '✅' : '❌';
  console.log(`${icon} [${category}] ${action}`);
  if (details) console.log(`   └─ ${details}`);
}

async function main() {
  console.log('═'.repeat(100));
  console.log(' '.repeat(30) + '관리자 & 회원 CRUD 최종 테스트');
  console.log('═'.repeat(100));
  console.log();

  let createdNotice = null;
  let createdPost = null;
  let createdComment = null;

  try {
    // ========================================
    // 1. 관리자 - 공지사항 작성 (CREATE)
    // ========================================
    console.log('📝 SECTION 1: 관리자 - 공지사항 작성 (CREATE)');
    console.log('─'.repeat(100));

    const notice = {
      user_id: VALID_USER_ID,
      title: '[공지] PoliticianFinder 사이트 오픈 안내',
      content: `안녕하세요! PoliticianFinder가 정식 오픈했습니다.

주요 기능:
- 정치인 검색 및 정보 확인
- 커뮤니티 게시글 및 댓글
- AI 기반 정치인 평가
- 즐겨찾기 기능

많은 이용 부탁드립니다!`,
      category: 'general',
      is_pinned: true,
      is_locked: false,
      upvotes: 0,
      downvotes: 0,
      moderation_status: 'approved',
    };

    const noticeResponse = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(notice),
    });

    if (noticeResponse.ok) {
      createdNotice = (await noticeResponse.json())[0];
      log('관리자-공지사항', '공지사항 작성 (CREATE)', '✅ 성공', `게시글 ID: ${createdNotice.id}, is_pinned: true`);
    } else {
      const error = await noticeResponse.json();
      log('관리자-공지사항', '공지사항 작성 (CREATE)', '❌ 실패', error.message);
    }

    // ========================================
    // 2. 관리자 - 공지사항 수정 (UPDATE)
    // ========================================
    if (createdNotice) {
      console.log('\n✏️ SECTION 2: 관리자 - 공지사항 수정 (UPDATE)');
      console.log('─'.repeat(100));

      const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${createdNotice.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          title: '[공지] PoliticianFinder 사이트 오픈 안내 (업데이트)',
          content: notice.content + '\n\n**2025-11-30 업데이트**: 신규 회원 포인트 지급 이벤트 진행 중!',
        }),
      });

      if (updateResponse.ok) {
        const updated = (await updateResponse.json())[0];
        log('관리자-공지사항', '공지사항 수정 (UPDATE)', '✅ 성공', `제목 업데이트 완료`);
      } else {
        const error = await updateResponse.json();
        log('관리자-공지사항', '공지사항 수정 (UPDATE)', '❌ 실패', error.message);
      }
    }

    // ========================================
    // 3. 회원 - 일반 게시글 작성 (CREATE)
    // ========================================
    console.log('\n📝 SECTION 3: 회원 - 일반 게시글 작성 (CREATE)');
    console.log('─'.repeat(100));

    const post = {
      user_id: VALID_USER_ID,
      title: 'AI 정치인 평가 기능 후기',
      content: `AI 기반 정치인 평가 기능을 사용해보았습니다.

✅ 좋은 점:
- 객관적인 데이터 기반 평가
- 다양한 평가 지표 (공약 이행률, 의정활동 등)
- 시각적으로 잘 정리된 UI

개선 제안:
- 평가 지표에 대한 상세 설명 추가
- 시간대별 평가 변화 그래프

전반적으로 매우 유용한 기능입니다!`,
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
      body: JSON.stringify(post),
    });

    if (postResponse.ok) {
      createdPost = (await postResponse.json())[0];
      log('회원-커뮤니티', '게시글 작성 (CREATE)', '✅ 성공', `게시글 ID: ${createdPost.id}`);
    } else {
      const error = await postResponse.json();
      log('회원-커뮤니티', '게시글 작성 (CREATE)', '❌ 실패', error.message);
    }

    // ========================================
    // 4. 회원 - 댓글 작성 (CREATE)
    // ========================================
    if (createdPost) {
      console.log('\n💬 SECTION 4: 회원 - 댓글 작성 (CREATE)');
      console.log('─'.repeat(100));

      const comment = {
        post_id: createdPost.id,
        user_id: VALID_USER_ID,
        content: '저도 동감합니다! 특히 공약 이행률 평가가 정말 유용하더라고요 👍',
        is_deleted: false,
        moderation_status: 'approved',
      };

      const commentResponse = await fetch(`${SUPABASE_URL}/rest/v1/comments`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(comment),
      });

      if (commentResponse.ok) {
        createdComment = (await commentResponse.json())[0];
        log('회원-댓글', '댓글 작성 (CREATE)', '✅ 성공', `댓글 ID: ${createdComment.id}`);
      } else {
        const error = await commentResponse.json();
        log('회원-댓글', '댓글 작성 (CREATE)', '❌ 실패', error.message);
      }
    }

    // ========================================
    // 5. 회원 - 게시글 추천 (UPDATE upvotes)
    // ========================================
    if (createdPost) {
      console.log('\n👍 SECTION 5: 회원 - 게시글 추천 (UPDATE)');
      console.log('─'.repeat(100));

      const upvoteResponse = await fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${createdPost.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({ upvotes: 5 }),
      });

      if (upvoteResponse.ok) {
        const updated = (await upvoteResponse.json())[0];
        log('회원-게시글추천', '게시글 추천 (upvote)', '✅ 성공', `0 → ${updated.upvotes}`);
      } else {
        const error = await upvoteResponse.json();
        log('회원-게시글추천', '게시글 추천 (upvote)', '❌ 실패', error.message);
      }
    }

    // ========================================
    // 6. 회원 - 즐겨찾기 추가 (CREATE)
    // ========================================
    console.log('\n⭐ SECTION 6: 회원 - 즐겨찾기 추가 (CREATE)');
    console.log('─'.repeat(100));

    const politicianResponse = await fetch(`${SUPABASE_URL}/rest/v1/politicians?select=id,name&limit=1`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    });
    const politicians = await politicianResponse.json();

    const favorite = {
      user_id: VALID_USER_ID,
      politician_id: politicians[0].id,
    };

    const favoriteResponse = await fetch(`${SUPABASE_URL}/rest/v1/favorite_politicians`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(favorite),
    });

    if (favoriteResponse.ok) {
      const fav = (await favoriteResponse.json())[0];
      log('회원-즐겨찾기', '즐겨찾기 추가 (CREATE)', '✅ 성공', `정치인: ${politicians[0].name}`);
    } else {
      const error = await favoriteResponse.json();
      // 이미 존재하면 무시
      if (error.code === '23505') {
        log('회원-즐겨찾기', '즐겨찾기 추가 (CREATE)', '✅ 성공', `이미 추가됨: ${politicians[0].name}`);
      } else {
        log('회원-즐겨찾기', '즐겨찾기 추가 (CREATE)', '❌ 실패', error.message);
      }
    }

    // ========================================
    // 7. 회원 - 댓글 수정 (UPDATE)
    // ========================================
    if (createdComment) {
      console.log('\n✏️ SECTION 7: 회원 - 댓글 수정 (UPDATE)');
      console.log('─'.repeat(100));

      const commentUpdateResponse = await fetch(`${SUPABASE_URL}/rest/v1/comments?id=eq.${createdComment.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          content: '저도 동감합니다! 특히 공약 이행률 평가가 정말 유용하더라고요 👍👍 (수정됨)',
        }),
      });

      if (commentUpdateResponse.ok) {
        log('회원-댓글', '댓글 수정 (UPDATE)', '✅ 성공', '내용 업데이트 완료');
      } else {
        const error = await commentUpdateResponse.json();
        log('회원-댓글', '댓글 수정 (UPDATE)', '❌ 실패', error.message);
      }
    }

    // ========================================
    // 8. 회원 - 댓글 삭제 (Soft Delete)
    // ========================================
    if (createdComment) {
      console.log('\n🗑️ SECTION 8: 회원 - 댓글 삭제 (Soft Delete)');
      console.log('─'.repeat(100));

      const commentDeleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/comments?id=eq.${createdComment.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          is_deleted: true,
          content: '[삭제된 댓글입니다]',
        }),
      });

      if (commentDeleteResponse.ok) {
        log('회원-댓글', '댓글 삭제 (Soft Delete)', '✅ 성공', 'is_deleted = true');
      } else {
        const error = await commentDeleteResponse.json();
        log('회원-댓글', '댓글 삭제 (Soft Delete)', '❌ 실패', error.message);
      }
    }

    // ========================================
    // 9. 관리자 - 게시글 삭제 (DELETE)
    // ========================================
    if (createdPost) {
      console.log('\n🗑️ SECTION 9: 관리자 - 테스트 게시글 삭제 (DELETE)');
      console.log('─'.repeat(100));

      const deleteResponse = await fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${createdPost.id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
        },
      });

      if (deleteResponse.ok || deleteResponse.status === 204) {
        log('관리자-게시글관리', '게시글 삭제 (DELETE)', '✅ 성공', `테스트 게시글 삭제 완료`);
      } else {
        const error = await deleteResponse.json();
        log('관리자-게시글관리', '게시글 삭제 (DELETE)', '❌ 실패', error.message);
      }
    }

    // ========================================
    // 10. 공지사항 확인
    // ========================================
    console.log('\n📋 SECTION 10: 공지사항 조회 확인');
    console.log('─'.repeat(100));

    const noticesResponse = await fetch(`${SUPABASE_URL}/rest/v1/posts?is_pinned=eq.true&select=id,title,is_pinned`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    });

    if (noticesResponse.ok) {
      const notices = await noticesResponse.json();
      log('관리자-공지사항', '공지사항 조회', '✅ 성공', `${notices.length}개 공지사항 확인`);
      console.log();
      notices.forEach((n, i) => {
        console.log(`   ${i+1}. ${n.title} (ID: ${n.id})`);
      });
    }

    // ========================================
    // 최종 결과
    // ========================================
    console.log('\n═'.repeat(100));
    console.log(' '.repeat(40) + '최종 테스트 결과');
    console.log('═'.repeat(100));
    console.log();

    const successCount = results.filter(r => r.status === '✅ 성공').length;
    const failCount = results.filter(r => r.status === '❌ 실패').length;
    const total = results.length;

    console.log(`📊 전체 결과:`);
    console.log(`   • 총 테스트: ${total}개`);
    console.log(`   • ✅ 성공: ${successCount}개 (${(successCount/total*100).toFixed(1)}%)`);
    console.log(`   • ❌ 실패: ${failCount}개 (${(failCount/total*100).toFixed(1)}%)`);
    console.log();

    console.log('📋 상세 결과:');
    console.log();

    const categories = {
      '관리자-공지사항': [],
      '관리자-게시글관리': [],
      '회원-커뮤니티': [],
      '회원-댓글': [],
      '회원-게시글추천': [],
      '회원-즐겨찾기': [],
    };

    results.forEach(r => {
      if (categories[r.category]) {
        categories[r.category].push(r);
      }
    });

    Object.entries(categories).forEach(([cat, items]) => {
      if (items.length > 0) {
        console.log(`\n${cat}:`);
        items.forEach((r, i) => {
          const icon = r.status.includes('성공') ? '✅' : '❌';
          console.log(`  ${icon} ${r.action}`);
          if (r.details) console.log(`     └─ ${r.details}`);
        });
      }
    });

    console.log();
    console.log('═'.repeat(100));
    console.log('✅ 테스트 완료!');
    console.log('═'.repeat(100));

  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    console.error(error.stack);
  }
}

main();
