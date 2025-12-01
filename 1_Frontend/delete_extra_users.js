// 커뮤니티 작성자 3명 + 관리자 1명을 제외한 나머지 삭제
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function deleteExtraUsers() {
  console.log('\n=== 커뮤니티 작성자 3명 + 관리자 1명 제외 나머지 삭제 ===\n');

  // 보존할 사용자 ID
  const keepUserIds = [
    'fd96b732-ea3c-4f4f-89dc-81654b8189bc', // 정치는우리의것 (user1)
    '3c8e4e6b-0f17-452d-8e51-1057bcf12c36', // 투명한정치 (user2)
    'e79307b9-2981-434b-bf63-db7f0eba2e76', // 민주시민 (user3)
    '6a000ddb-5cb5-4a24-85e5-5789d9b93b6a', // 선웅규 (wksun999@gmail.com)
  ];

  console.log('📌 보존할 사용자 (4명):');
  console.log('  1. 정치는우리의것 (user1@example.com)');
  console.log('  2. 투명한정치 (user2@example.com)');
  console.log('  3. 민주시민 (user3@example.com)');
  console.log('  4. 선웅규 (wksun999@gmail.com) - 관리자\n');

  // 전체 사용자 조회
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('user_id, name, email');

  if (usersError) {
    console.error('❌ Users 조회 오류:', usersError);
    return;
  }

  // 삭제할 사용자 필터링
  const usersToDelete = users.filter(u => !keepUserIds.includes(u.user_id));

  console.log(`🗑️  삭제할 사용자: ${usersToDelete.length}명\n`);

  if (usersToDelete.length === 0) {
    console.log('✅ 삭제할 사용자가 없습니다.');
    return;
  }

  // 삭제 진행
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

  // 최종 확인
  const { data: remainingUsers } = await supabase
    .from('users')
    .select('user_id, name, email, role')
    .order('name', { ascending: true });

  console.log(`\n📊 최종 남은 사용자: ${remainingUsers.length}명\n`);

  remainingUsers.forEach((user, index) => {
    const badge = user.role === 'admin' ? ' 🔑 (관리자)' : '';
    console.log(`${index + 1}. ${user.name} (${user.email})${badge}`);
    console.log(`   ID: ${user.user_id}`);
    console.log('');
  });
}

deleteExtraUsers().catch(console.error);
