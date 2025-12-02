require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPosts() {
  // 회원 게시글 조회 (politician_id가 NULL)
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      user_id,
      politician_id,
      author_type,
      profiles:user_id (
        id,
        username
      )
    `)
    .is('politician_id', null)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`\n총 ${posts.length}개 회원 게시글:\n`);

  posts.forEach(post => {
    const hasProfile = post.profiles !== null;
    const username = post.profiles?.username || 'NULL';
    const status = hasProfile ? '✅' : '❌ 익명';
    const shortTitle = post.title.slice(0, 30);

    console.log(`${status} ${shortTitle}`);
    console.log(`   user_id: ${post.user_id}`);
    console.log(`   profiles: ${username}`);
    console.log('');
  });

  // 익명 게시글 찾기
  const anonymous = posts.filter(p => !p.profiles);
  if (anonymous.length > 0) {
    console.log(`\n⚠️ 익명 게시글 ${anonymous.length}개 발견:`);
    anonymous.forEach(p => {
      console.log(`- ID: ${p.id}, Title: ${p.title}, user_id: ${p.user_id}`);
    });
  }
}

checkPosts();
