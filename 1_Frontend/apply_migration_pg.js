// PostgreSQL을 사용한 마이그레이션 적용
// npm install pg 필요

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Supabase Database 연결 정보
// Format: postgres://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
const DATABASE_URL = process.env.DATABASE_URL || buildDatabaseUrl();

function buildDatabaseUrl() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found');
    process.exit(1);
  }

  // Extract project ref from URL: https://ooddlafwdpzgxfefgsrx.supabase.co
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1];

  console.log('\n⚠️  DATABASE_URL not found in .env.local');
  console.log('\nTo connect directly to PostgreSQL, you need:');
  console.log(`\n1. Get database password from Supabase Dashboard:`);
  console.log(`   https://supabase.com/dashboard/project/${projectRef}/settings/database`);
  console.log(`\n2. Add to .env.local:`);
  console.log(`   DATABASE_URL=postgres://postgres:[YOUR_PASSWORD]@db.${projectRef}.supabase.co:5432/postgres`);
  console.log('\n');
  process.exit(1);
}

async function applyMigration() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('📝 Reading migration file...');
    const migrationPath = path.join(__dirname, 'migrations_to_apply.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('🚀 Applying migration...\n');
    console.log('━'.repeat(60));

    await client.query(migrationSQL);

    console.log('━'.repeat(60));
    console.log('\n✅ Migration applied successfully!\n');

    console.log('Applied changes:');
    console.log('  ✓ Added verified_email to politicians table');
    console.log('  ✓ Renamed posts.title → posts.subject');
    console.log('  ✓ Made posts.user_id NULLABLE');
    console.log('  ✓ Added posts.author_type column');
    console.log('  ✓ Made comments.user_id NULLABLE');
    console.log('  ✓ Added comments.politician_id column');
    console.log('  ✓ Added comments.author_type column');
    console.log('  ✓ Created politician_sessions table');
    console.log('  ✓ Created indexes and RLS policies\n');

  } catch (err) {
    console.error('\n❌ Migration failed:');
    console.error(err.message);
    console.error('\nDetails:', err);

    console.log('\n⚠️  Alternative method:');
    console.log('\n1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Copy contents of migrations_to_apply.sql');
    console.log('3. Paste and click "Run"\n');

    process.exit(1);
  } finally {
    await client.end();
  }
}

// Check if pg module is installed
try {
  require.resolve('pg');
  applyMigration();
} catch (e) {
  console.log('⚠️  "pg" module not found');
  console.log('\nPlease install it first:');
  console.log('  npm install pg');
  console.log('\nOr apply migration manually via Supabase Dashboard\n');
}
