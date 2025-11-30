// 커뮤니티 글 작성자 확인
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkCommunityAuthors() {
  console.log('\n=== 커뮤니티 글 작성자 확인 ===\n');

  // 커뮤니티 posts 테이블에서 작성자 목록 조회
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('user_id, title, created_at')
    .order('created_at', { ascending: false });

  if (postsError) {
    console.error('❌ Posts 조회 오류:', postsError);
    return;
  }

  // 고유한 작성자 ID 추출
  const authorIds = [...new Set(posts.map(p => p.user_id))];

  console.log(`📝 총 게시글 수: ${posts.length}개`);
  console.log(`👥 고유 작성자 수: ${authorIds.length}명\n`);

  // 작성자별 사용자 정보 가져오기
  const { data: authors } = await supabase
    .from('users')
    .select('user_id, name, email')
    .in('user_id', authorIds);

  console.log('=== 작성자 목록 ===\n');

  for (const authorId of authorIds) {
    const authorPosts = posts.filter(p => p.user_id === authorId);
    const author = authors?.find(a => a.user_id === authorId);

    console.log(`작성자: ${author?.name || '이름 없음'} (${author?.email || 'N/A'})`);
    console.log(`  ID: ${authorId}`);
    console.log(`  게시글 수: ${authorPosts.length}개`);
    console.log(`  최근 게시글: ${authorPosts[0].title}`);
    console.log('');
  }

  // 전체 사용자 목록 조회
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('user_id, name, email, created_at')
    .order('created_at', { ascending: false });

  if (usersError) {
    console.error('❌ Users 조회 오류:', usersError);
    return;
  }

  console.log('\n=== 전체 사용자 목록 ===\n');
  console.log(`총 사용자 수: ${users.length}명\n`);

  // 삭제 가능한 사용자 (커뮤니티 글 작성자 제외)
  const deletableUsers = users.filter(u => !authorIds.includes(u.user_id));

  console.log('=== 삭제 가능한 사용자 ===\n');
  console.log(`삭제 가능: ${deletableUsers.length}명\n`);

  deletableUsers.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name || '이름 없음'} (${user.email})`);
    console.log(`   ID: ${user.user_id}`);
    console.log(`   가입일: ${new Date(user.created_at).toLocaleDateString('ko-KR')}`);
    console.log('');
  });

  console.log('\n=== 보존할 사용자 (커뮤니티 작성자) ===\n');
  console.log(`보존: ${authorIds.length}명\n`);

  authorIds.forEach((authorId, index) => {
    const user = users.find(u => u.user_id === authorId);
    const postCount = posts.filter(p => p.user_id === authorId).length;

    if (user) {
      console.log(`${index + 1}. ${user.name || '이름 없음'} (${user.email})`);
      console.log(`   ID: ${user.user_id}`);
      console.log(`   게시글 수: ${postCount}개`);
      console.log('');
    } else {
      console.log(`${index + 1}. [사용자 정보 없음]`);
      console.log(`   ID: ${authorId}`);
      console.log(`   게시글 수: ${postCount}개`);
      console.log('');
    }
  });
}

checkCommunityAuthors().catch(console.error);
