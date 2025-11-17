const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function detectColumns() {
  console.log('Testing possible column combinations...\n');

  const testCases = [
    { user_id: '00000000-0000-0000-0000-000000000000', type: 'system', title: 'test', message: 'test', link: '/test', is_read: false },
    { user_id: '00000000-0000-0000-0000-000000000000', type: 'system', message: 'test', link: '/test', is_read: false },
    { user_id: '00000000-0000-0000-0000-000000000000', type: 'system', content: 'test', target_url: '/test', is_read: false },
    { user_id: '00000000-0000-0000-0000-000000000000', type: 'system', message: 'test', link_url: '/test', is_read: false },
  ];

  for (const testData of testCases) {
    const columnList = Object.keys(testData).join(', ');
    const { error } = await supabase
      .from('notifications')
      .insert(testData)
      .select();

    if (error) {
      console.log('Failed with columns:', columnList);
      console.log('Error:', error.message);
      console.log('');
    } else {
      console.log('SUCCESS with columns:', columnList);
      console.log('');
      // Delete the test record
      await supabase.from('notifications').delete().eq('user_id', '00000000-0000-0000-0000-000000000000');
      break;
    }
  }
}

detectColumns();
