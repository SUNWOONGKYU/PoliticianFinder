const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStructure() {
  console.log('Checking posts and comments structure...\n');

  // Check posts
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('*')
    .limit(1);

  if (postsError) {
    console.log('Posts ERROR:', postsError.message);
  } else if (posts && posts.length > 0) {
    console.log('Posts columns:', Object.keys(posts[0]));
    console.log('Sample post ID:', posts[0].id);
  }

  // Check comments
  const { data: comments, error: commentsError } = await supabase
    .from('comments')
    .select('*')
    .limit(1);

  if (commentsError) {
    console.log('\nComments ERROR:', commentsError.message);
  } else if (comments && comments.length > 0) {
    console.log('\nComments columns:', Object.keys(comments[0]));
  } else {
    console.log('\nNo comments found - will check by trying insert');

    // Try to insert to see column names
    const { error: insertError } = await supabase
      .from('comments')
      .insert({ post_id: '00000000-0000-0000-0000-000000000000' });

    if (insertError) {
      console.log('Insert error (shows required columns):', insertError.message);
    }
  }

  // Get all posts to create comments for
  const { data: allPosts } = await supabase
    .from('posts')
    .select('id, title, user_id')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log('\n=== Available Posts ===');
  if (allPosts) {
    for (let idx = 0; idx < allPosts.length; idx++) {
      const p = allPosts[idx];
      console.log(`${idx + 1}. ${p.title} (ID: ${p.id})`);
    }
  }

  // Get users for comment authors
  const { data: users } = await supabase
    .from('users')
    .select('user_id, name, nickname')
    .limit(5);

  console.log('\n=== Available Users ===');
  if (users) {
    for (let idx = 0; idx < users.length; idx++) {
      const u = users[idx];
      console.log(`${idx + 1}. ${u.name || u.nickname} (ID: ${u.user_id})`);
    }
  }
}

checkStructure();
