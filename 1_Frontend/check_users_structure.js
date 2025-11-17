const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUsersStructure() {
  console.log('Checking users table structure...\n');
  
  // Try to get one user with all columns
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('Error:', error.message);
    console.log('Code:', error.code);
    console.log('Details:', error.details);
    console.log('Hint:', error.hint);
  } else if (data && data.length > 0) {
    console.log('Sample user data:');
    console.log(data[0]);
    console.log('\nColumn names:');
    console.log(Object.keys(data[0]));
  } else {
    console.log('No users found in the table');
  }
}

checkUsersStructure();
