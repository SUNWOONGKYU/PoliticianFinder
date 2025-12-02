require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixNullUsernames() {
  console.log('\n===== username이 NULL인 프로필 확인 및 수정 =====\n');

  // username이 null이지만 nickname이나 email이 있는 프로필 찾기
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, username, nickname, email')
    .is('username', null);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`총 ${profiles.length}개의 username이 NULL인 프로필:\n`);

  for (const profile of profiles) {
    console.log(`ID: ${profile.id}`);
    console.log(`  현재 username: ${profile.username}`);
    console.log(`  nickname: ${profile.nickname}`);
    console.log(`  email: ${profile.email}`);

    // username을 nickname 또는 email 앞부분으로 설정
    const newUsername = profile.nickname || profile.email?.split('@')[0] || `user_${profile.id.slice(0, 8)}`;

    console.log(`  → 새 username: ${newUsername}`);

    // 업데이트
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ username: newUsername })
      .eq('id', profile.id);

    if (updateError) {
      console.log(`  ❌ 업데이트 실패: ${updateError.message}`);
    } else {
      console.log(`  ✅ 업데이트 성공`);
    }
    console.log('');
  }

  console.log(`\n✅ 총 ${profiles.length}개 프로필 처리 완료\n`);
}

fixNullUsernames();
