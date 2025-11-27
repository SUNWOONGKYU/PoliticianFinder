import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Check comments table
const { data: comments, error: commentsError } = await supabase
  .from('comments')
  .select('*')
  .limit(1);

if (commentsError) {
  console.error('Comments Error:', commentsError.message);
} else {
  console.log('Comments columns:', comments[0] ? Object.keys(comments[0]) : 'No data');
}

// Check posts table
const { data: posts, error: postsError } = await supabase
  .from('posts')
  .select('*')
  .limit(1);

if (postsError) {
  console.error('Posts Error:', postsError.message);
} else {
  console.log('Posts columns:', posts[0] ? Object.keys(posts[0]) : 'No data');
}
