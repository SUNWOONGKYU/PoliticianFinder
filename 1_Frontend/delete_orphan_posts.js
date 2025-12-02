require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteOrphanPosts() {
  console.log('\n익명 게시글 삭제 시작...\n');

  // user_id는 있지만 profiles가 없는 게시글 찾기
  const { data: allPosts, error: fetchError } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      user_id,
      politician_id,
      profiles:user_id (
        id,
        username
      )
    `)
    .is('politician_id', null)  // 회원 게시글만
    .not('user_id', 'is', null);  // user_id가 있는 것만

  if (fetchError) {
    console.error('Error fetching posts:', fetchError);
    return;
  }

  // profiles가 없는 게시글 필터링
  const orphanPosts = allPosts.filter(p => !p.profiles);

  if (orphanPosts.length === 0) {
    console.log('✅ 삭제할 익명 게시글이 없습니다.');
    return;
  }

  console.log(`⚠️ ${orphanPosts.length}개의 익명 게시글 발견:\n`);
  orphanPosts.forEach(p => {
    console.log(`- ID: ${p.id}`);
    console.log(`  제목: ${p.title}`);
    console.log(`  user_id: ${p.user_id} (프로필 없음)`);
    console.log('');
  });

  // 삭제 실행
  const postIds = orphanPosts.map(p => p.id);

  const { error: deleteError } = await supabase
    .from('posts')
    .delete()
    .in('id', postIds);

  if (deleteError) {
    console.error('❌ 삭제 실패:', deleteError);
    return;
  }

  console.log(`\n✅ ${postIds.length}개의 익명 게시글 삭제 완료!\n`);
  console.log('삭제된 게시글 ID:', postIds.join(', '));
}

deleteOrphanPosts();
