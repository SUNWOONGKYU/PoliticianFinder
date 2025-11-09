// Setup Supabase Database for PROJECT_GRID_REVISED
// Executes all SQL files in order

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase credentials
const SUPABASE_URL = 'https://ooddlafwdpzgxfefgsrx.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// SQL files to execute in order
const SQL_FILES = [
  'project_grid_revised_36_schema.sql',
  'phase_gates_schema.sql',
  'project_grid_revised_36_data.sql',
  'phase_gates_data.sql'
];

async function executeSQLFile(filename) {
  console.log(`\n📄 Executing ${filename}...`);

  try {
    const filePath = path.join(__dirname, filename);
    const sql = fs.readFileSync(filePath, 'utf8');

    // Split SQL into individual statements (simple split by semicolon)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`   Found ${statements.length} SQL statements`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`   Executing statement ${i + 1}/${statements.length}...`);

      // Use rpc call to execute raw SQL
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });

      if (error) {
        // Try direct query if rpc fails
        const { error: queryError } = await supabase.from('_sql').select().throwOnError();
        if (queryError) {
          console.error(`   ❌ Error:`, error.message);
          throw error;
        }
      }
    }

    console.log(`✅ ${filename} executed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to execute ${filename}:`, error.message);
    return false;
  }
}

async function setupDatabase() {
  console.log('🚀 Starting PROJECT_GRID_REVISED Database Setup...\n');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log(`📁 Working directory: ${__dirname}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const filename of SQL_FILES) {
    const success = await executeSQLFile(filename);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('='.repeat(50));

  if (failCount === 0) {
    console.log('\n🎉 DATABASE SETUP COMPLETE!');
    console.log('\nNext steps:');
    console.log('1. Verify tables in Supabase Dashboard');
    console.log('2. Check project_grid_tasks_revised table has 36 rows');
    console.log('3. Check phase_gates table has 6 rows');
  } else {
    console.log('\n⚠️  Some SQL files failed to execute.');
    console.log('Please check the errors above and try again.');
  }
}

// Run setup
setupDatabase().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
