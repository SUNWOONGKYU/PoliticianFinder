const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testWithUserId() {
  // Get a valid user_id first
  const { data: users } = await supabase
    .from('users')
    .select('user_id')
    .limit(1);

  if (!users || users.length === 0) {
    console.log('No users found');
    return;
  }

  const testUserId = users[0].user_id;
  console.log('Using user_id:', testUserId);
  console.log('\nTesting notification types:\n');

  const testTypes = ['like', 'comment', 'follow', 'mention', 'reply', 'system', 'payment', 'post_like'];

  for (const type of testTypes) {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: testUserId,
        type: type,
        content: 'test notification',
        is_read: false
      });

    if (error) {
      if (error.message.includes('violates check constraint')) {
        console.log(`X ${type} - NOT ALLOWED`);
      } else {
        console.log(`? ${type} - Error: ${error.message.substring(0, 60)}`);
      }
    } else {
      console.log(`OK ${type} - ALLOWED`);
      await supabase.from('notifications').delete().eq('content', 'test notification').eq('type', type);
    }
  }
}

testWithUserId();
