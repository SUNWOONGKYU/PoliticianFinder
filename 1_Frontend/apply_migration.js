// 마이그레이션 적용 스크립트
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Supabase credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('📝 Reading migration file...');

  const migrationPath = path.join(__dirname, 'migrations_to_apply.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('🚀 Applying migration to Supabase...');
  console.log('━'.repeat(60));

  try {
    // Supabase SQL 실행
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Migration failed:', error);

      // 대체 방법: psql을 사용하여 직접 실행
      console.log('\n⚠️  Direct SQL execution failed. Please apply the migration manually:');
      console.log('\n1. Go to Supabase Dashboard > SQL Editor');
      console.log('2. Copy and paste the contents of migrations_to_apply.sql');
      console.log('3. Click "Run" to execute');
      console.log('\n📄 Migration file location:');
      console.log(migrationPath);

      process.exit(1);
    }

    console.log('✅ Migration applied successfully!');
    console.log('━'.repeat(60));
    console.log('\nApplied changes:');
    console.log('  ✓ Added verified_email to politicians table');
    console.log('  ✓ Renamed posts.title → posts.subject');
    console.log('  ✓ Made posts.user_id NULLABLE');
    console.log('  ✓ Added posts.author_type column');
    console.log('  ✓ Made comments.user_id NULLABLE');
    console.log('  ✓ Added comments.politician_id column');
    console.log('  ✓ Added comments.author_type column');
    console.log('  ✓ Created politician_sessions table');
    console.log('  ✓ Created indexes and RLS policies');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    console.log('\n⚠️  Please apply the migration manually via Supabase Dashboard');
    process.exit(1);
  }
}

// 실행
applyMigration();
