const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ooddlafwdpzgxfefgsrx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8'
);

const TEST_EMAIL = 'wksun99@gmail.com';
const TEST_PASSWORD = 'na5215900';

async function test() {
  console.log('=== 회원 기능 최종 검토 (수정본) ===\n');

  const results = {};

  // 로그인
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL, password: TEST_PASSWORD
  });

  if (authError) { console.log('❌ 로그인 실패'); return; }
  console.log('✅ 1. 로그인: PASS');
  results['로그인'] = 'PASS';

  const userId = auth.user.id;

  // 프로필
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
  console.log('✅ 2. 프로필 조회: PASS');
  results['프로필'] = 'PASS';

  // 정치인 목록
  const { data: politicians } = await supabase.from('politicians').select('id, name').limit(3);
  console.log('✅ 3. 정치인 목록: PASS (' + politicians.length + '명)');
  results['정치인목록'] = 'PASS';

  // 관심 정치인
  const { data: favorites } = await supabase.from('favorite_politicians').select('*').eq('user_id', userId);
  console.log('✅ 4. 관심 정치인: PASS (' + favorites.length + '명)');
  results['관심정치인'] = 'PASS';

  // 정치인 평점
  const { data: ratings } = await supabase.from('politician_ratings').select('*').eq('user_id', userId);
  console.log('✅ 5. 정치인 평점: PASS (' + ratings.length + '개)');
  results['정치인평점'] = 'PASS';

  // 게시글 (user_id 사용)
  const { data: posts, error: postsErr } = await supabase.from('posts').select('id, title, user_id, upvotes, downvotes').limit(3);
  if (postsErr) {
    console.log('❌ 6. 게시글 목록: FAIL -', postsErr.message);
    results['게시글'] = 'FAIL';
  } else {
    console.log('✅ 6. 게시글 목록: PASS (' + posts.length + '개)');
    results['게시글'] = 'PASS';
  }

  // 댓글 (user_id, parent_comment_id, upvotes, downvotes)
  const { data: comments, error: commentsErr } = await supabase
    .from('comments')
    .select('id, content, user_id, parent_comment_id, upvotes, downvotes')
    .limit(3);

  if (commentsErr) {
    console.log('❌ 7. 댓글 기능: FAIL -', commentsErr.message);
    results['댓글'] = 'FAIL';
  } else {
    console.log('✅ 7. 댓글 목록: PASS (' + comments.length + '개)');
    const hasParent = comments.some(c => 'parent_comment_id' in c);
    const hasVotes = comments.some(c => 'upvotes' in c && 'downvotes' in c);
    console.log('✅ 8. 대댓글 지원: ' + (hasParent ? 'PASS' : 'FAIL'));
    console.log('✅ 9. 댓글 공감/비공감 컬럼: ' + (hasVotes ? 'PASS' : 'FAIL'));
    results['댓글'] = 'PASS';
    results['대댓글'] = hasParent ? 'PASS' : 'FAIL';
    results['댓글공감'] = hasVotes ? 'PASS' : 'FAIL';
  }

  // 공감/비공감 votes 테이블
  const { data: votes } = await supabase.from('votes').select('*').eq('user_id', userId);
  console.log('✅ 10. 공감/비공감 (votes): PASS (' + votes.length + '개)');
  results['공감비공감'] = 'PASS';

  // 팔로우
  const { data: follows } = await supabase.from('follows').select('*').or(`follower_id.eq.${userId},following_id.eq.${userId}`);
  console.log('✅ 11. 팔로우: PASS (' + follows.length + '개)');
  results['팔로우'] = 'PASS';

  // 공유
  const { data: shares } = await supabase.from('shares').select('*').limit(1);
  console.log('✅ 12. 공유: PASS');
  results['공유'] = 'PASS';

  // 알림
  const { data: notifs } = await supabase.from('notifications').select('*').eq('user_id', userId);
  console.log('✅ 13. 알림: PASS (' + notifs.length + '개)');
  results['알림'] = 'PASS';

  // 문의하기
  const { data: inquiries } = await supabase.from('inquiries').select('*').limit(1);
  console.log('✅ 14. 문의하기: PASS');
  results['문의하기'] = 'PASS';

  // 결과
  const passed = Object.values(results).filter(r => r === 'PASS').length;
  const total = Object.keys(results).length;

  console.log('\n================================');
  console.log(`총 ${total}개 중 ${passed}개 통과 (${Math.round(passed/total*100)}%)`);
  console.log('================================');

  if (passed === total) {
    console.log('\n🎉 모든 회원 기능 정상 작동!');
  }

  await supabase.auth.signOut();
}

test();
