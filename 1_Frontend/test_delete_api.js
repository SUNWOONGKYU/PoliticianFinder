// DELETE API 직접 테스트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testDeleteAPI() {
  console.log('\n=== DELETE API 직접 테스트 ===\n');

  // 테스트용 사용자 ID (testuser1)
  const testUserId = 'a9a0d5a9-1d57-4033-b470-3028ccee7051';

  console.log('🔍 테스트할 user_id:', testUserId);

  // 1. 사용자 존재 확인
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('user_id, name, email')
    .eq('user_id', testUserId)
    .single();

  console.log('\n1. 사용자 조회 결과:');
  console.log('   Data:', user);
  console.log('   Error:', fetchError);

  if (!user) {
    console.log('\n❌ 사용자를 찾을 수 없습니다!');
    return;
  }

  console.log(`\n✅ 사용자 찾음: ${user.name} (${user.email})`);

  // 2. 삭제 시도
  console.log('\n2. 삭제 시도...');
  const { error: deleteError } = await supabase
    .from('users')
    .delete()
    .eq('user_id', testUserId);

  console.log('   Delete Error:', deleteError);

  if (deleteError) {
    console.log('\n❌ 삭제 실패:', deleteError.message);
  } else {
    console.log('\n✅ 삭제 성공!');

    // 3. 삭제 확인
    const { data: checkUser } = await supabase
      .from('users')
      .select('user_id')
      .eq('user_id', testUserId)
      .single();

    if (checkUser) {
      console.log('⚠️  사용자가 여전히 존재합니다!');
    } else {
      console.log('✅ 사용자가 완전히 삭제되었습니다!');
    }
  }
}

testDeleteAPI().catch(console.error);
