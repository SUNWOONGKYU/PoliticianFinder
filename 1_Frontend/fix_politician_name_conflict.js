require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixConflict() {
  const userId = 'ca4c8eb8-9467-43c4-8255-e9894fbcbbb9';

  console.log('\n정치인 이름 충돌 해결...\n');

  // 현재 정보 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  console.log('현재 프로필:');
  console.log(`  username: ${profile.username}`);
  console.log(`  nickname: ${profile.nickname}`);
  console.log(`  email: ${profile.email}`);

  // username과 nickname을 일반 회원 이름으로 변경
  const newUsername = 'testuser_' + userId.slice(0, 8);
  const newNickname = '테스트회원';

  console.log('\n변경 후:');
  console.log(`  username: ${newUsername}`);
  console.log(`  nickname: ${newNickname}`);

  const { error } = await supabase
    .from('profiles')
    .update({
      username: newUsername,
      nickname: newNickname
    })
    .eq('id', userId);

  if (error) {
    console.error('\n❌ 업데이트 실패:', error);
  } else {
    console.log('\n✅ 프로필 업데이트 성공!');
  }
}

fixConflict();
