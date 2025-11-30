// 커뮤니티 글 작성자 3명을 제외한 나머지 사용자 삭제
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function deleteNonAuthorUsers() {
  console.log('\n=== 커뮤니티 작성자 3명을 제외한 나머지 사용자 삭제 ===\n');

  // 1. 커뮤니티 글 작성자 ID 추출
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('user_id');

  if (postsError) {
    console.error('❌ Posts 조회 오류:', postsError);
    return;
  }

  const authorIds = [...new Set(posts.map(p => p.user_id))];

  console.log(`📝 보존할 작성자: ${authorIds.length}명`);
  console.log('보존할 ID:', authorIds);
  console.log('');

  // 2. 전체 사용자 목록 조회
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('user_id, name, email');

  if (usersError) {
    console.error('❌ Users 조회 오류:', usersError);
    return;
  }

  // 3. 삭제할 사용자 필터링 (작성자 제외)
  const usersToDelete = users.filter(u => !authorIds.includes(u.user_id));

  console.log(`🗑️  삭제할 사용자: ${usersToDelete.length}명\n`);

  // 4. 삭제 진행
  let successCount = 0;
  let errorCount = 0;

  for (const user of usersToDelete) {
    try {
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('user_id', user.user_id);

      if (deleteError) {
        console.error(`  ❌ ${user.name} (${user.email}): ${deleteError.message}`);
        errorCount++;
      } else {
        console.log(`  ✅ ${user.name} (${user.email}) 삭제 완료`);
        successCount++;
      }
    } catch (err) {
      console.error(`  ❌ ${user.name} (${user.email}): ${err.message}`);
      errorCount++;
    }
  }

  console.log('\n=== 삭제 완료 ===');
  console.log(`✅ 성공: ${successCount}명`);
  console.log(`❌ 실패: ${errorCount}명`);

  // 5. 최종 확인
  const { data: remainingUsers } = await supabase
    .from('users')
    .select('user_id, name, email');

  console.log(`\n📊 남은 사용자: ${remainingUsers.length}명\n`);

  remainingUsers.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name} (${user.email})`);
    console.log(`   ID: ${user.user_id}`);
    console.log('');
  });
}

deleteNonAuthorUsers().catch(console.error);
