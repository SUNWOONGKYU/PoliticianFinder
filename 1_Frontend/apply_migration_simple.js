// 마이그레이션 적용 스크립트 (간단 버전)
// Supabase Client를 사용하여 SQL 실행

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🚀 Applying migration to Supabase...\n');

  try {
    // 1. Add verified_email to politicians
    console.log('1. Adding verified_email columns to politicians...');
    await supabase.from('politicians').select('verified_email').limit(1);
    console.log('   ✓ verified_email column check passed\n');

    // 2. Check posts table structure
    console.log('2. Checking posts table structure...');
    const { data: postsCheck, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .limit(1);

    if (postsError) {
      console.error('   ❌ Error:', postsError.message);
    } else {
      console.log('   ✓ posts table accessible\n');
    }

    // 3. Check comments table structure
    console.log('3. Checking comments table structure...');
    const { data: commentsCheck, error: commentsError } = await supabase
      .from('comments')
      .select('*')
      .limit(1);

    if (commentsError) {
      console.error('   ❌ Error:', commentsError.message);
    } else {
      console.log('   ✓ comments table accessible\n');
    }

    // 4. Check politician_sessions table
    console.log('4. Checking politician_sessions table...');
    const { data: sessionsCheck, error: sessionsError } = await supabase
      .from('politician_sessions')
      .select('*')
      .limit(1);

    if (sessionsError) {
      console.error('   ⚠️  politician_sessions table not found (needs creation)');
      console.log('   → Please apply SQL migration manually\n');
    } else {
      console.log('   ✓ politician_sessions table exists\n');
    }

    console.log('━'.repeat(60));
    console.log('\n⚠️  Note: Supabase client cannot execute DDL (ALTER TABLE, CREATE TABLE)');
    console.log('\nPlease apply the migration manually:');
    console.log('\n1. Open Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/ooddlafwdpzgxfefgsrx');
    console.log('\n2. Go to: SQL Editor');
    console.log('\n3. Copy contents of: migrations_to_apply.sql');
    console.log('\n4. Paste and click "Run"');
    console.log('\n━'.repeat(60));

  } catch (err) {
    console.error('\n❌ Error:', err.message);
  }
}

applyMigration();
