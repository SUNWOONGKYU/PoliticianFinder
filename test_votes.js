const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ooddlafwdpzgxfefgsrx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8'
);

const TEST_EMAIL = 'wksun99@gmail.com';
const TEST_PASSWORD = 'na5215900';

async function testVotes() {
  console.log('=== 공감/비공감 기능 테스트 ===\n');

  // 로그인
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });

  if (authError) {
    console.log('❌ 로그인 실패:', authError.message);
    return;
  }
  console.log('✅ 로그인 성공\n');

  // 테스트할 게시글 가져오기
  const { data: posts } = await supabase.from('posts').select('id, upvotes, downvotes').limit(1);
  if (!posts || posts.length === 0) {
    console.log('❌ 테스트할 게시글이 없습니다');
    return;
  }
  const postId = posts[0].id;
  console.log('테스트 게시글:', postId.substring(0,8), '(공감:', posts[0].upvotes, '/ 비공감:', posts[0].downvotes, ')');

  // 1. 게시글 공감 테스트
  console.log('\n--- 게시글 공감 테스트 ---');
  const { data: vote1, error: vote1Error } = await supabase
    .from('votes')
    .upsert({
      user_id: auth.user.id,
      post_id: postId,
      vote_type: 'upvote'
    }, { onConflict: 'user_id, post_id' })
    .select()
    .single();

  if (vote1Error) {
    console.log('❌ 공감 실패:', vote1Error.message);
  } else {
    console.log('✅ 공감 성공:', vote1.id.substring(0,8));
  }

  // 2. 게시글 비공감으로 변경 테스트
  console.log('\n--- 게시글 비공감으로 변경 ---');
  const { data: vote2, error: vote2Error } = await supabase
    .from('votes')
    .update({ vote_type: 'downvote' })
    .eq('user_id', auth.user.id)
    .eq('post_id', postId)
    .select()
    .single();

  if (vote2Error) {
    console.log('❌ 비공감 변경 실패:', vote2Error.message);
  } else {
    console.log('✅ 비공감으로 변경 성공:', vote2.vote_type);
  }

  // 3. 테스트할 댓글 가져오기
  const { data: comments } = await supabase.from('comments').select('id').limit(1);
  if (!comments || comments.length === 0) {
    console.log('\n❌ 테스트할 댓글이 없습니다');
    return;
  }
  const commentId = comments[0].id;
  console.log('\n테스트 댓글:', commentId.substring(0,8));

  // 4. 댓글 공감 테스트
  console.log('\n--- 댓글 공감 테스트 ---');
  const { data: vote3, error: vote3Error } = await supabase
    .from('votes')
    .insert({
      user_id: auth.user.id,
      comment_id: commentId,
      vote_type: 'upvote'
    })
    .select()
    .single();

  if (vote3Error) {
    console.log('❌ 댓글 공감 실패:', vote3Error.message);
  } else {
    console.log('✅ 댓글 공감 성공:', vote3.id.substring(0,8));
  }

  // 5. 투표 목록 조회
  console.log('\n--- 내 투표 목록 ---');
  const { data: myVotes, error: myVotesError } = await supabase
    .from('votes')
    .select('*')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  if (myVotesError) {
    console.log('❌ 투표 목록 조회 실패:', myVotesError.message);
  } else {
    console.log('내 투표 수:', myVotes.length);
    myVotes.forEach(v => {
      const target = v.post_id ? `게시글:${v.post_id.substring(0,8)}` : `댓글:${v.comment_id?.substring(0,8)}`;
      console.log(`  - ${target} | ${v.vote_type === 'upvote' || v.vote_type === 'like' ? '공감' : '비공감'}`);
    });
  }

  // 6. 테스트 데이터 정리
  console.log('\n--- 테스트 데이터 정리 ---');
  await supabase.from('votes').delete().eq('user_id', auth.user.id).eq('post_id', postId);
  await supabase.from('votes').delete().eq('user_id', auth.user.id).eq('comment_id', commentId);
  console.log('✅ 테스트 투표 삭제 완료');
}

testVotes();
