const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ooddlafwdpzgxfefgsrx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8'
);

async function checkColumns() {
  console.log('=== posts 컬럼 ===');
  const { data: post } = await supabase.from('posts').select('*').limit(1);
  if (post?.[0]) {
    console.log(Object.keys(post[0]).join(', '));
  }

  console.log('\n=== comments 컬럼 ===');
  const { data: comment } = await supabase.from('comments').select('*').limit(1);
  if (comment?.[0]) {
    console.log(Object.keys(comment[0]).join(', '));
  }
}

checkColumns();
