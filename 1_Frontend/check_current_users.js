const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

(async () => {
  const { data: users, error } = await supabase
    .from('users')
    .select('user_id, name, email, role, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('\n현재 DB에 있는 사용자 수:', users.length);
    console.log('');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
      console.log(`   ID: ${user.user_id}`);
      console.log(`   가입일: ${new Date(user.created_at).toLocaleDateString('ko-KR')}`);
      console.log('');
    });
  }
})();
