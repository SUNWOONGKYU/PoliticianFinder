const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ooddlafwdpzgxfefgsrx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8'
);

async function checkVotes() {
  console.log('=== 공감/비공감 시스템 확인 ===\n');

  // 1. votes 테이블 확인
  const { data: votes, error: votesError } = await supabase
    .from('votes')
    .select('*')
    .limit(3);

  if (votesError) {
    console.log('votes 테이블: ❌', votesError.message);
  } else {
    console.log('votes 테이블: ✅ 존재');
    if (votes.length > 0) {
      console.log('votes 컬럼:', Object.keys(votes[0]).join(', '));
    }
  }

  // 2. posts 테이블의 upvotes/downvotes 컬럼 확인
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('id, upvotes, downvotes')
    .limit(3);

  if (postsError) {
    console.log('\nposts.upvotes/downvotes: ❌', postsError.message);
  } else {
    console.log('\nposts.upvotes/downvotes: ✅ 존재');
    posts.forEach(p => {
      console.log(`  - ${p.id.substring(0,8)}: 공감 ${p.upvotes || 0} / 비공감 ${p.downvotes || 0}`);
    });
  }

  // 3. comments 테이블의 upvotes/downvotes 컬럼 확인
  const { data: comments, error: commentsError } = await supabase
    .from('comments')
    .select('id, upvotes, downvotes')
    .limit(3);

  if (commentsError) {
    console.log('\ncomments.upvotes/downvotes: ❌', commentsError.message);
  } else {
    console.log('\ncomments.upvotes/downvotes: ✅ 존재');
    comments.forEach(c => {
      console.log(`  - ${c.id.substring(0,8)}: 공감 ${c.upvotes || 0} / 비공감 ${c.downvotes || 0}`);
    });
  }
}

checkVotes();
