const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ooddlafwdpzgxfefgsrx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8'
);

async function checkTables() {
  // 테이블 확인
  const tables = ['post_likes', 'comment_likes', 'likes', 'reports', 'shares'];

  console.log('=== 테이블 존재 여부 확인 ===\n');

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    console.log(`${table}: ${error ? '❌ ' + error.message.substring(0, 60) : '✅ 존재 (' + data.length + '개 샘플)'}`);
  }

  // posts 테이블의 likes_count 컬럼 확인
  console.log('\n=== posts 테이블 컬럼 확인 ===\n');
  const { data: posts, error: postsError } = await supabase.from('posts').select('id, likes_count, view_count, share_count').limit(1);
  if (postsError) {
    console.log('posts 컬럼: ❌ ' + postsError.message);
  } else {
    console.log('posts 컬럼: ✅', Object.keys(posts[0] || {}).join(', '));
  }

  // comments 테이블의 likes_count 컬럼 확인
  console.log('\n=== comments 테이블 컬럼 확인 ===\n');
  const { data: comments, error: commentsError } = await supabase.from('comments').select('id, likes_count').limit(1);
  if (commentsError) {
    console.log('comments.likes_count: ❌ ' + commentsError.message);
  } else {
    console.log('comments.likes_count: ✅ 존재');
  }

  // shares 테이블 컬럼 확인
  console.log('\n=== shares 테이블 컬럼 확인 ===\n');
  const { data: shares, error: sharesError } = await supabase.from('shares').select('*').limit(1);
  if (sharesError) {
    console.log('shares: ❌ ' + sharesError.message);
  } else {
    console.log('shares 컬럼: ✅', shares.length > 0 ? Object.keys(shares[0]).join(', ') : '(비어있음)');

    // 빈 테이블이면 insert로 컬럼 확인
    if (shares.length === 0) {
      const { error: insertError } = await supabase.from('shares').insert({
        target_type: 'post',
        target_id: '00000000-0000-0000-0000-000000000000',
        platform: 'link'
      });
      if (insertError) {
        console.log('shares insert 테스트: ', insertError.message);
      }
    }
  }
}

checkTables();
