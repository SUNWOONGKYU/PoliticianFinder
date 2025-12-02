require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data } = await supabase
    .from('posts')
    .select(\`
      id,
      title,
      user_id,
      profiles:user_id (
        username,
        nickname,
        email
      )
    \`)
    .is('politician_id', null)
    .limit(3);

  console.log(JSON.stringify(data, null, 2));
}

test();
