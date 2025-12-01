// ============================================================================
// 관리자 & 회원 CRUD 종합 테스트
// CREATE, READ, UPDATE, DELETE 모두 테스트
// ============================================================================

const SUPABASE_URL = 'https://ooddlafwdpzgxfefgsrx.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU';

const results = [];

function log(category, action, status, details = '') {
  results.push({ category, action, status, details });
  const icon = status === '✅ 성공' ? '✅' : '❌';
  console.log(`${icon} [${category}] ${action}`);
  if (details) console.log(`   └─ ${details}`);
}

// ============================================================================
// 1. 관리자 - 공지사항 작성 (CREATE)
// ============================================================================
async function testAdminCreateNotice() {
  console.log('\n📝 SECTION 1: 관리자 - 공지사항 작성 (CREATE)');
  console.log('─'.repeat(100));

  // 기존 user 중 하나 사용
  const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?select=user_id&limit=1`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
  });
  const users = await userResponse.json();
  const userId = users[0].user_id;

  const notice = {
    user_id: userId,
    title: '[공지] PoliticianFinder 사이트 오픈 안내',
    content: `안녕하세요! PoliticianFinder가 정식 오픈했습니다.

주요 기능:
- 정치인 검색 및 정보 확인
- 커뮤니티 게시글 및 댓글
- AI 기반 정치인 평가

많은 이용 부탁드립니다!`,
    category: 'general',
    is_pinned: true,
    is_locked: false,
    upvotes: 0,
    downvotes: 0,
    moderation_status: 'approved',
  };

  const response = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(notice),
  });

  if (response.ok) {
    const data = await response.json();
    log('관리자-공지사항', '공지사항 작성 (CREATE)', '✅ 성공', `게시글 ID: ${data[0].id}`);
    return data[0];
  } else {
    const error = await response.json();
    log('관리자-공지사항', '공지사항 작성 (CREATE)', '❌ 실패', error.message);
    return null;
  }
}

// ============================================================================
// 2. 관리자 - 게시글 수정 (UPDATE)
// ============================================================================
async function testAdminUpdatePost(postId) {
  console.log('\n✏️ SECTION 2: 관리자 - 게시글 수정 (UPDATE)');
  console.log('─'.repeat(100));

  const updates = {
    title: '[공지] PoliticianFinder 사이트 오픈 안내 (수정)',
    content: `안녕하세요! PoliticianFinder가 정식 오픈했습니다.

주요 기능:
- 정치인 검색 및 정보 확인
- 커뮤니티 게시글 및 댓글
- AI 기반 정치인 평가
- 즐겨찾기 기능 추가! (NEW)

많은 이용 부탁드립니다!`,
  };

  const response = await fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${postId}`, {
    method: 'PATCH',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(updates),
  });

  if (response.ok) {
    const data = await response.json();
    log('관리자-게시글관리', '게시글 수정 (UPDATE)', '✅ 성공', `수정된 제목: ${data[0].title}`);
    return true;
  } else {
    const error = await response.json();
    log('관리자-게시글관리', '게시글 수정 (UPDATE)', '❌ 실패', error.message);
    return false;
  }
}

// ============================================================================
// 3. 회원 - 게시글 작성 (CREATE)
// ============================================================================
async function testUserCreatePost() {
  console.log('\n📝 SECTION 3: 회원 - 게시글 작성 (CREATE)');
  console.log('─'.repeat(100));

  const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?role=eq.user&select=user_id&limit=1`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
  });
  const users = await userResponse.json();
  const userId = users[0].user_id;

  const post = {
    user_id: userId,
    title: '정치인 평가 기능이 정말 유용하네요!',
    content: `AI 기반 정치인 평가 기능을 사용해봤는데 정말 객관적이고 좋은 것 같아요.

다양한 평가 지표를 한눈에 볼 수 있어서 정치인을 선택하는데 도움이 될 것 같습니다.

특히 공약 이행률과 의정활동 평가가 인상적이었습니다!`,
    category: 'general',
    is_pinned: false,
    upvotes: 0,
    downvotes: 0,
    moderation_status: 'approved',
  };

  const response = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(post),
  });

  if (response.ok) {
    const data = await response.json();
    log('회원-커뮤니티', '게시글 작성 (CREATE)', '✅ 성공', `게시글 ID: ${data[0].id}`);
    return data[0];
  } else {
    const error = await response.json();
    log('회원-커뮤니티', '게시글 작성 (CREATE)', '❌ 실패', error.message);
    return null;
  }
}

// ============================================================================
// 4. 회원 - 댓글 작성 (CREATE)
// ============================================================================
async function testUserCreateComment(postId) {
  console.log('\n💬 SECTION 4: 회원 - 댓글 작성 (CREATE)');
  console.log('─'.repeat(100));

  const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?role=eq.user&select=user_id&limit=1`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
  });
  const users = await userResponse.json();
  const userId = users[0].user_id;

  const comment = {
    post_id: postId,
    user_id: userId,
    content: '저도 이 기능 사용해봤는데 정말 유용하더라고요! 추천합니다 👍',
    is_deleted: false,
    moderation_status: 'approved',
  };

  const response = await fetch(`${SUPABASE_URL}/rest/v1/comments`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(comment),
  });

  if (response.ok) {
    const data = await response.json();
    log('회원-댓글', '댓글 작성 (CREATE)', '✅ 성공', `댓글 ID: ${data[0].id}`);
    return data[0];
  } else {
    const error = await response.json();
    log('회원-댓글', '댓글 작성 (CREATE)', '❌ 실패', error.message);
    return null;
  }
}

// ============================================================================
// 5. 회원 - 게시글 추천 (UPDATE upvotes)
// ============================================================================
async function testUserUpvotePost(postId) {
  console.log('\n👍 SECTION 5: 회원 - 게시글 추천 (UPDATE)');
  console.log('─'.repeat(100));

  // 먼저 현재 upvotes 확인
  const getResponse = await fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${postId}&select=upvotes`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
  });
  const currentData = await getResponse.json();
  const currentUpvotes = currentData[0].upvotes;

  // upvotes 증가
  const response = await fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${postId}`, {
    method: 'PATCH',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({ upvotes: currentUpvotes + 1 }),
  });

  if (response.ok) {
    const data = await response.json();
    log('회원-게시글추천', '게시글 추천 (upvote)', '✅ 성공', `${currentUpvotes} → ${data[0].upvotes}`);
    return true;
  } else {
    const error = await response.json();
    log('회원-게시글추천', '게시글 추천 (upvote)', '❌ 실패', error.message);
    return false;
  }
}

// ============================================================================
// 6. 회원 - 즐겨찾기 추가 (CREATE)
// ============================================================================
async function testUserAddFavorite() {
  console.log('\n⭐ SECTION 6: 회원 - 즐겨찾기 추가 (CREATE)');
  console.log('─'.repeat(100));

  const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?role=eq.user&select=user_id&limit=1`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
  });
  const users = await userResponse.json();
  const userId = users[0].user_id;

  // 첫 번째 정치인 가져오기
  const politicianResponse = await fetch(`${SUPABASE_URL}/rest/v1/politicians?select=id,name&limit=1`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
  });
  const politicians = await politicianResponse.json();
  const politicianId = politicians[0].id;
  const politicianName = politicians[0].name;

  const favorite = {
    user_id: userId,
    politician_id: politicianId,
  };

  const response = await fetch(`${SUPABASE_URL}/rest/v1/favorite_politicians`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(favorite),
  });

  if (response.ok) {
    const data = await response.json();
    log('회원-즐겨찾기', '즐겨찾기 추가 (CREATE)', '✅ 성공', `정치인: ${politicianName}`);
    return data[0];
  } else {
    const error = await response.json();
    log('회원-즐겨찾기', '즐겨찾기 추가 (CREATE)', '❌ 실패', error.message);
    return null;
  }
}

// ============================================================================
// 7. 관리자 - 게시글 삭제 (DELETE)
// ============================================================================
async function testAdminDeletePost(postId) {
  console.log('\n🗑️ SECTION 7: 관리자 - 게시글 삭제 (DELETE)');
  console.log('─'.repeat(100));

  const response = await fetch(`${SUPABASE_URL}/rest/v1/posts?id=eq.${postId}`, {
    method: 'DELETE',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
  });

  if (response.ok || response.status === 204) {
    log('관리자-게시글관리', '게시글 삭제 (DELETE)', '✅ 성공', `게시글 ID: ${postId}`);
    return true;
  } else {
    const error = await response.json();
    log('관리자-게시글관리', '게시글 삭제 (DELETE)', '❌ 실패', error.message);
    return false;
  }
}

// ============================================================================
// 8. 회원 - 댓글 수정 (UPDATE)
// ============================================================================
async function testUserUpdateComment(commentId) {
  console.log('\n✏️ SECTION 8: 회원 - 댓글 수정 (UPDATE)');
  console.log('─'.repeat(100));

  const updates = {
    content: '저도 이 기능 사용해봤는데 정말 유용하더라고요! 강력 추천합니다 👍👍 (수정됨)',
  };

  const response = await fetch(`${SUPABASE_URL}/rest/v1/comments?id=eq.${commentId}`, {
    method: 'PATCH',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(updates),
  });

  if (response.ok) {
    const data = await response.json();
    log('회원-댓글', '댓글 수정 (UPDATE)', '✅ 성공', '내용 업데이트 완료');
    return true;
  } else {
    const error = await response.json();
    log('회원-댓글', '댓글 수정 (UPDATE)', '❌ 실패', error.message);
    return false;
  }
}

// ============================================================================
// 9. 회원 - 댓글 삭제 (Soft Delete)
// ============================================================================
async function testUserDeleteComment(commentId) {
  console.log('\n🗑️ SECTION 9: 회원 - 댓글 삭제 (Soft Delete)');
  console.log('─'.repeat(100));

  const updates = {
    is_deleted: true,
    content: '[삭제된 댓글입니다]',
  };

  const response = await fetch(`${SUPABASE_URL}/rest/v1/comments?id=eq.${commentId}`, {
    method: 'PATCH',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(updates),
  });

  if (response.ok) {
    const data = await response.json();
    log('회원-댓글', '댓글 삭제 (Soft Delete)', '✅ 성공', 'is_deleted = true');
    return true;
  } else {
    const error = await response.json();
    log('회원-댓글', '댓글 삭제 (Soft Delete)', '❌ 실패', error.message);
    return false;
  }
}

// ============================================================================
// MAIN
// ============================================================================
async function main() {
  console.log('═'.repeat(100));
  console.log(' '.repeat(30) + '관리자 & 회원 CRUD 종합 테스트');
  console.log('═'.repeat(100));
  console.log();

  let createdNotice = null;
  let createdPost = null;
  let createdComment = null;

  try {
    // 1. 관리자 - 공지사항 작성
    createdNotice = await testAdminCreateNotice();

    if (createdNotice) {
      // 2. 관리자 - 게시글 수정
      await testAdminUpdatePost(createdNotice.id);
    }

    // 3. 회원 - 게시글 작성
    createdPost = await testUserCreatePost();

    if (createdPost) {
      // 4. 회원 - 댓글 작성
      createdComment = await testUserCreateComment(createdPost.id);

      // 5. 회원 - 게시글 추천
      await testUserUpvotePost(createdPost.id);
    }

    // 6. 회원 - 즐겨찾기 추가
    await testUserAddFavorite();

    if (createdComment) {
      // 8. 회원 - 댓글 수정
      await testUserUpdateComment(createdComment.id);

      // 9. 회원 - 댓글 삭제
      await testUserDeleteComment(createdComment.id);
    }

    // 7. 관리자 - 게시글 삭제 (테스트용 게시글만 삭제)
    if (createdPost) {
      await testAdminDeletePost(createdPost.id);
    }

    // ========================================
    // 최종 결과 요약
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
    results.forEach((r, i) => {
      const icon = r.status.includes('성공') ? '✅' : '❌';
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
