const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testInsert() {
  // Get valid IDs first
  const { data: posts } = await supabase.from('posts').select('id').limit(1);
  const { data: users } = await supabase.from('users').select('user_id').limit(1);

  if (!posts || !users) {
    console.log('No posts or users found');
    return;
  }

  const postId = posts[0].id;
  const userId = users[0].user_id;

  console.log('Testing comment insert with post_id:', postId);
  console.log('Using user_id:', userId);

  // Test 1: Basic insert
  const { error: e1 } = await supabase.from('comments').insert({
    post_id: postId,
    user_id: userId,
    content: 'test comment'
  });

  if (e1) {
    console.log('\nX Basic insert error:', e1.message);
  } else {
    console.log('\nOK Basic insert works!');
    await supabase.from('comments').delete().eq('content', 'test comment');
  }

  // Test 2: With like_count
  const { error: e2 } = await supabase.from('comments').insert({
    post_id: postId,
    user_id: userId,
    content: 'test comment 2',
    like_count: 5
  });

  if (e2) {
    console.log('X like_count column does not exist');
  } else {
    console.log('OK like_count column exists');
    await supabase.from('comments').delete().eq('content', 'test comment 2');
  }

  // Test 3: With likes_count
  const { error: e3 } = await supabase.from('comments').insert({
    post_id: postId,
    user_id: userId,
    content: 'test comment 3',
    likes_count: 5
  });

  if (e3) {
    console.log('X likes_count column does not exist');
  } else {
    console.log('OK likes_count column exists');
    await supabase.from('comments').delete().eq('content', 'test comment 3');
  }
}

testInsert();
