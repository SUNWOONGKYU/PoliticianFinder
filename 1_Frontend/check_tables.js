const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  console.log('Checking database tables...\n');
  
  // Check notices table
  const { data: noticesData, error: noticesError } = await supabase
    .from('notices')
    .select('*')
    .limit(1);
  
  console.log('notices table:', noticesError ? 'NOT FOUND' : 'EXISTS');
  if (noticesError) console.log('Error:', noticesError.message);
  
  // Check notifications table
  const { data: notificationsData, error: notificationsError } = await supabase
    .from('notifications')
    .select('*')
    .limit(1);
  
  console.log('notifications table:', notificationsError ? 'NOT FOUND' : 'EXISTS');
  if (notificationsError) console.log('Error:', notificationsError.message);
  
  // Check users table
  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('id, role')
    .limit(1);
  
  console.log('users table:', usersError ? 'NOT FOUND' : 'EXISTS');
  if (usersError) console.log('Error:', usersError.message);
  else console.log('Sample user:', usersData);
}

checkTables();
