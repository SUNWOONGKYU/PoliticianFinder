require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteNoticePosts() {
  console.log('\n공지사항 게시글 삭제 시작...\n');

  // 제목에 [공지] 또는 "공지"가 포함된 게시글 찾기
  const { data: posts, error: fetchError } = await supabase
    .from('posts')
    .select('id, title, user_id, category')
    .or('title.ilike.%[공지]%,title.ilike.%공지%');

  if (fetchError) {
    console.error('Error:', fetchError);
    return;
  }

  console.log(`${posts.length}개의 공지사항 게시글 발견:\n`);

  posts.forEach(p => {
    console.log(`- ID: ${p.id}`);
    console.log(`  제목: ${p.title}`);
    console.log(`  카테고리: ${p.category}`);
    console.log('');
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

  console.log(`\n✅ ${postIds.length}개의 공지사항 게시글 삭제 완료!`);
  console.log('\n공지사항은 관리자 페이지의 notices 테이블에서만 관리됩니다.\n');
}

deleteNoticePosts();
