require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteTestPosts() {
  console.log('\n테스트 게시글 삭제 시작...\n');

  // 테스트 게시글 찾기 (제목에 [테스트], [의견], [질문] 포함)
  const { data: posts, error: fetchError } = await supabase
    .from('posts')
    .select('id, title, user_id')
    .or('title.ilike.%[테스트]%,title.ilike.%[의견]%,title.ilike.%[질문]%');

  if (fetchError) {
    console.error('Error:', fetchError);
    return;
  }

  console.log(`${posts.length}개의 테스트 게시글 발견:\n`);

  posts.forEach(p => {
    console.log(`- ID: ${p.id}, 제목: ${p.title}`);
  });

  if (posts.length === 0) {
    console.log('\n삭제할 게시글이 없습니다.');
    return;
  }

  // 삭제 실행
  const postIds = posts.map(p => p.id);

  const { error: deleteError } = await supabase
    .from('posts')
    .delete()
    .in('id', postIds);

  if (deleteError) {
    console.error('\n❌ 삭제 실패:', deleteError);
    return;
  }

  console.log(`\n✅ ${postIds.length}개의 테스트 게시글 삭제 완료!\n`);
}

deleteTestPosts();
