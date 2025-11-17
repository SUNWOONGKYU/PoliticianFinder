const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkNotificationsStructure() {
  console.log('Checking notifications table structure...\n');
  
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('Error:', error.message);
  } else if (data && data.length > 0) {
    console.log('Sample notification:');
    console.log(data[0]);
    console.log('\nColumn names:');
    console.log(Object.keys(data[0]));
  } else {
    console.log('No notifications found. Checking with empty insert...');
    
    // Try to get table structure from error message
    const { error: insertError } = await supabase
      .from('notifications')
      .insert({ user_id: '00000000-0000-0000-0000-000000000000' })
      .select();
    
    if (insertError) {
      console.log('Insert error message (shows required columns):');
      console.log(insertError.message);
    }
  }
}

checkNotificationsStructure();
