require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUser() {
  const userId = 'ca4c8eb8-9467-43c4-8255-e9894fbcbbb9';

  // profiles 테이블에서 확인
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  console.log('\nUser ID:', userId);
  console.log('Profile 존재 여부:', !!profile);

  if (profile) {
    console.log('Profile 데이터:', profile);
  } else {
    console.log('❌ Profile이 없습니다!');
    console.log('Error:', error);
  }

  // 이 user_id의 게시글 수
  const { count } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  console.log(`\n이 user_id로 작성된 게시글: ${count}개`);
}

checkUser();
