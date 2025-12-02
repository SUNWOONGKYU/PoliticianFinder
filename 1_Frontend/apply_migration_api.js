// Supabase REST API를 사용한 마이그레이션 적용
const https = require('https');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Supabase credentials not found');
  process.exit(1);
}

// Extract project ref
const PROJECT_REF = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)[1];

async function executeSQLViaAPI(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });

    const options = {
      hostname: `${PROJECT_REF}.supabase.co`,
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data: body });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function applyMigration() {
  console.log('\n⚠️  Supabase REST API does not support DDL execution (ALTER TABLE, CREATE TABLE)');
  console.log('\nYou must apply the migration manually via Supabase Dashboard:\n');
  console.log('━'.repeat(70));
  console.log('\n📋 Steps to apply migration:\n');
  console.log(`1. Open Supabase Dashboard:`);
  console.log(`   https://supabase.com/dashboard/project/${PROJECT_REF}\n`);
  console.log(`2. Go to: SQL Editor (left sidebar)\n`);
  console.log(`3. Click: "New Query"\n`);
  console.log(`4. Copy the entire contents of: migrations_to_apply.sql\n`);
  console.log(`5. Paste into the editor\n`);
  console.log(`6. Click: "Run" (or press Ctrl+Enter)\n`);
  console.log(`7. Wait for success message\n`);
  console.log('━'.repeat(70));
  console.log('\n📄 Migration file location:');
  console.log('   ' + require('path').join(__dirname, 'migrations_to_apply.sql'));
  console.log('\n✅ After successful migration, the following will be applied:\n');
  console.log('   ✓ Added verified_email to politicians table');
  console.log('   ✓ Renamed posts.title → posts.subject');
  console.log('   ✓ Made posts.user_id NULLABLE');
  console.log('   ✓ Added posts.author_type column');
  console.log('   ✓ Made comments.user_id NULLABLE');
  console.log('   ✓ Added comments.politician_id column');
  console.log('   ✓ Added comments.author_type column');
  console.log('   ✓ Created politician_sessions table');
  console.log('   ✓ Created indexes and RLS policies');
  console.log('\n');
}

applyMigration();
