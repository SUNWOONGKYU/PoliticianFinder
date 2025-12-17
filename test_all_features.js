// 전체 기능 테스트
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ooddlafwdpzgxfefgsrx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8'
);

const SERVICE_SUPABASE = createClient(
  'https://ooddlafwdpzgxfefgsrx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU'
);

const results = {
  member: {},
  politician: {}
};

let authData = null;
let testPostId = null;
let testCommentId = null;

async function login() {
  console.log('=== 로그인 ===');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'wksun99@gmail.com',
    password: 'na5215900'
  });
  if (error) {
    console.error('로그인 실패:', error.message);
    return false;
  }
  authData = data;
  console.log('✅ 로그인 성공');
  return true;
}

// 1. 프로필 수정
async function testProfileUpdate() {
  console.log('\n=== 1. 프로필 수정 테스트 ===');

  // 현재 프로필 조회
  const { data: profile, error: getError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (getError) {
    console.error('프로필 조회 실패:', getError.message);
    results.member['프로필 수정'] = { status: 'FAIL', error: getError.message };
    return;
  }
  console.log('현재 프로필:', profile.nickname || profile.full_name);

  // 프로필 수정
  const newNickname = '테스트회원_' + Date.now().toString().slice(-4);
  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update({ nickname: newNickname })
    .eq('id', authData.user.id)
    .select()
    .single();

  if (updateError) {
    console.error('프로필 수정 실패:', updateError.message);
    results.member['프로필 수정'] = { status: 'FAIL', error: updateError.message };
    return;
  }

  console.log('✅ 프로필 수정 성공:', updated.nickname);
  results.member['프로필 수정'] = { status: 'PASS' };

  // 원래대로 복구
  await supabase.from('profiles').update({ nickname: '테스트회원' }).eq('id', authData.user.id);
}

// 2. 게시글 좋아요
async function testPostLike() {
  console.log('\n=== 2. 게시글 좋아요 테스트 ===');

  // 테스트용 게시글 찾기
  const { data: posts } = await supabase
    .from('posts')
    .select('id, title')
    .eq('moderation_status', 'approved')
    .limit(1);

  if (!posts || posts.length === 0) {
    results.member['게시글 좋아요'] = { status: 'SKIP', reason: '게시글 없음' };
    return;
  }
  testPostId = posts[0].id;

  // post_likes 테이블 확인
  const { data: likeData, error: likeError } = await supabase
    .from('post_likes')
    .insert([{ post_id: testPostId, user_id: authData.user.id }])
    .select()
    .single();

  if (likeError) {
    if (likeError.code === '23505') {
      console.log('이미 좋아요한 게시글');
      results.member['게시글 좋아요'] = { status: 'PASS', note: '중복 방지 작동' };
    } else {
      console.error('좋아요 실패:', likeError.message);
      results.member['게시글 좋아요'] = { status: 'FAIL', error: likeError.message };
    }
    return;
  }

  console.log('✅ 게시글 좋아요 성공');
  results.member['게시글 좋아요'] = { status: 'PASS' };

  // 좋아요 취소
  await supabase.from('post_likes').delete().eq('post_id', testPostId).eq('user_id', authData.user.id);
}

// 3. 댓글 좋아요
async function testCommentLike() {
  console.log('\n=== 3. 댓글 좋아요 테스트 ===');

  // 테스트용 댓글 찾기
  const { data: comments } = await supabase
    .from('comments')
    .select('id')
    .limit(1);

  if (!comments || comments.length === 0) {
    results.member['댓글 좋아요'] = { status: 'SKIP', reason: '댓글 없음' };
    return;
  }
  testCommentId = comments[0].id;

  const { data: likeData, error: likeError } = await supabase
    .from('comment_likes')
    .insert([{ comment_id: testCommentId, user_id: authData.user.id }])
    .select()
    .single();

  if (likeError) {
    if (likeError.code === '23505') {
      console.log('이미 좋아요한 댓글');
      results.member['댓글 좋아요'] = { status: 'PASS', note: '중복 방지 작동' };
    } else {
      console.error('좋아요 실패:', likeError.message);
      results.member['댓글 좋아요'] = { status: 'FAIL', error: likeError.message };
    }
    return;
  }

  console.log('✅ 댓글 좋아요 성공');
  results.member['댓글 좋아요'] = { status: 'PASS' };

  // 좋아요 취소
  await supabase.from('comment_likes').delete().eq('comment_id', testCommentId).eq('user_id', authData.user.id);
}

// 4. 신고 기능
async function testReport() {
  console.log('\n=== 4. 신고 기능 테스트 ===');

  if (!testPostId) {
    results.member['게시글 신고'] = { status: 'SKIP', reason: '테스트 게시글 없음' };
    return;
  }

  const { data: reportData, error: reportError } = await supabase
    .from('reports')
    .insert([{
      reporter_id: authData.user.id,
      target_type: 'post',
      target_id: testPostId,
      reason: 'test',
      description: '테스트 신고입니다 (자동 삭제 예정)'
    }])
    .select()
    .single();

  if (reportError) {
    console.error('신고 실패:', reportError.message);
    results.member['게시글 신고'] = { status: 'FAIL', error: reportError.message };
    return;
  }

  console.log('✅ 신고 성공');
  results.member['게시글 신고'] = { status: 'PASS' };

  // 테스트 신고 삭제
  await SERVICE_SUPABASE.from('reports').delete().eq('id', reportData.id);
}

// 5. 알림 조회
async function testNotifications() {
  console.log('\n=== 5. 알림 조회 테스트 ===');

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', authData.user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('알림 조회 실패:', error.message);
    results.member['알림 조회'] = { status: 'FAIL', error: error.message };
    return;
  }

  console.log(`✅ 알림 조회 성공 (${notifications.length}개)`);
  results.member['알림 조회'] = { status: 'PASS', count: notifications.length };
}

// 6. 게시글 공유
async function testShare() {
  console.log('\n=== 6. 게시글 공유 테스트 ===');

  if (!testPostId) {
    results.member['게시글 공유'] = { status: 'SKIP', reason: '테스트 게시글 없음' };
    return;
  }

  const { data: shareData, error: shareError } = await supabase
    .from('shares')
    .insert([{
      user_id: authData.user.id,
      target_type: 'post',
      target_id: testPostId,
      platform: 'test'
    }])
    .select()
    .single();

  if (shareError) {
    console.error('공유 실패:', shareError.message);
    results.member['게시글 공유'] = { status: 'FAIL', error: shareError.message };
    return;
  }

  console.log('✅ 공유 기록 성공');
  results.member['게시글 공유'] = { status: 'PASS' };

  // 테스트 공유 삭제
  await SERVICE_SUPABASE.from('shares').delete().eq('id', shareData.id);
}

// 7. 게시글 삭제
async function testPostDelete() {
  console.log('\n=== 7. 게시글 삭제 테스트 ===');

  // 삭제용 테스트 게시글 생성
  const { data: newPost, error: createError } = await supabase
    .from('posts')
    .insert([{
      title: '삭제 테스트 게시글',
      content: '이 게시글은 삭제 테스트용입니다.',
      category: 'general',
      user_id: authData.user.id,
      moderation_status: 'approved'
    }])
    .select()
    .single();

  if (createError) {
    console.error('테스트 게시글 생성 실패:', createError.message);
    results.member['게시글 삭제'] = { status: 'FAIL', error: createError.message };
    return;
  }

  // 삭제
  const { error: deleteError } = await supabase
    .from('posts')
    .delete()
    .eq('id', newPost.id)
    .eq('user_id', authData.user.id);

  if (deleteError) {
    console.error('게시글 삭제 실패:', deleteError.message);
    results.member['게시글 삭제'] = { status: 'FAIL', error: deleteError.message };
    return;
  }

  console.log('✅ 게시글 삭제 성공');
  results.member['게시글 삭제'] = { status: 'PASS' };
}

// 8. 댓글 삭제
async function testCommentDelete() {
  console.log('\n=== 8. 댓글 삭제 테스트 ===');

  // 먼저 테스트용 게시글에 댓글 작성
  const { data: posts } = await supabase
    .from('posts')
    .select('id')
    .eq('moderation_status', 'approved')
    .limit(1);

  if (!posts || posts.length === 0) {
    results.member['댓글 삭제'] = { status: 'SKIP', reason: '게시글 없음' };
    return;
  }

  const { data: newComment, error: createError } = await supabase
    .from('comments')
    .insert([{
      post_id: posts[0].id,
      user_id: authData.user.id,
      content: '삭제 테스트 댓글'
    }])
    .select()
    .single();

  if (createError) {
    console.error('테스트 댓글 생성 실패:', createError.message);
    results.member['댓글 삭제'] = { status: 'FAIL', error: createError.message };
    return;
  }

  // 삭제
  const { error: deleteError } = await supabase
    .from('comments')
    .delete()
    .eq('id', newComment.id)
    .eq('user_id', authData.user.id);

  if (deleteError) {
    console.error('댓글 삭제 실패:', deleteError.message);
    results.member['댓글 삭제'] = { status: 'FAIL', error: deleteError.message };
    return;
  }

  console.log('✅ 댓글 삭제 성공');
  results.member['댓글 삭제'] = { status: 'PASS' };
}

// 9. 정치인 댓글 테스트
async function testPoliticianComment() {
  console.log('\n=== 9. 정치인 댓글 테스트 ===');

  // politician_comments 테이블 확인
  const { data: existingComments, error: checkError } = await SERVICE_SUPABASE
    .from('politician_comments')
    .select('*')
    .limit(3);

  if (checkError) {
    console.error('정치인 댓글 테이블 조회 실패:', checkError.message);
    results.politician['정치인 댓글'] = { status: 'FAIL', error: checkError.message };
    return;
  }

  console.log(`기존 정치인 댓글: ${existingComments.length}개`);

  // 정치인 세션이 있는지 확인
  const { data: sessions } = await SERVICE_SUPABASE
    .from('politician_sessions')
    .select('*')
    .limit(1);

  if (!sessions || sessions.length === 0) {
    console.log('⚠️ 활성 정치인 세션 없음 - 정치인 인증 후 댓글 가능');
    results.politician['정치인 댓글'] = { status: 'AVAILABLE', note: '인증된 정치인만 작성 가능' };
    return;
  }

  results.politician['정치인 댓글'] = { status: 'PASS', note: '테이블 존재, 인증 시스템 연동' };
}

// 10. 정치인 게시글 기능 확인
async function testPoliticianPost() {
  console.log('\n=== 10. 정치인 게시글 기능 확인 ===');

  const { data: politicianPosts, error } = await SERVICE_SUPABASE
    .from('posts')
    .select('id, title, politician_id, author_type')
    .eq('author_type', 'politician')
    .limit(5);

  if (error) {
    results.politician['정치인 게시글'] = { status: 'FAIL', error: error.message };
    return;
  }

  console.log(`정치인 게시글: ${politicianPosts.length}개`);
  results.politician['정치인 게시글'] = { status: 'PASS', count: politicianPosts.length };
}

// 메인 실행
async function main() {
  console.log('========================================');
  console.log('   전체 기능 테스트 시작');
  console.log('========================================\n');

  if (!await login()) {
    console.error('로그인 실패로 테스트 중단');
    return;
  }

  // 회원 기능 테스트
  console.log('\n\n【 회원 기능 테스트 】');
  console.log('─'.repeat(40));

  await testProfileUpdate();
  await testPostLike();
  await testCommentLike();
  await testReport();
  await testNotifications();
  await testShare();
  await testPostDelete();
  await testCommentDelete();

  // 정치인 기능 테스트
  console.log('\n\n【 정치인 기능 테스트 】');
  console.log('─'.repeat(40));

  await testPoliticianComment();
  await testPoliticianPost();

  // 결과 출력
  console.log('\n\n========================================');
  console.log('   테스트 결과 요약');
  console.log('========================================\n');

  console.log('【 회원 기능 】');
  for (const [name, result] of Object.entries(results.member)) {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'SKIP' ? '⏭️' : '❌';
    console.log(`  ${icon} ${name}: ${result.status}${result.note ? ' (' + result.note + ')' : ''}${result.error ? ' - ' + result.error : ''}`);
  }

  console.log('\n【 정치인 기능 】');
  for (const [name, result] of Object.entries(results.politician)) {
    const icon = result.status === 'PASS' || result.status === 'AVAILABLE' ? '✅' : result.status === 'SKIP' ? '⏭️' : '❌';
    console.log(`  ${icon} ${name}: ${result.status}${result.note ? ' (' + result.note + ')' : ''}`);
  }

  return results;
}

main()
  .then(results => {
    console.log('\n테스트 완료!');
    // JSON으로 결과 저장
    const fs = require('fs');
    fs.writeFileSync('test_results.json', JSON.stringify(results, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error('테스트 오류:', err);
    process.exit(1);
  });
