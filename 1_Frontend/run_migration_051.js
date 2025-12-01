// Migration Runner: 051_create_report_sales_tables.sql
// Run: node run_migration_051.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase 설정
const supabaseUrl = 'https://ooddlafwdpzgxfefgsrx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Starting migration: 051_create_report_sales_tables.sql');

    // 마이그레이션 SQL 파일 읽기
    const migrationPath = path.join(__dirname, '../0-4_Database/Supabase/migrations/051_create_report_sales_tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // SQL 실행
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Migration failed:', error);

      // RPC 함수가 없으면 직접 실행 시도
      if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('⚠️  exec_sql function not found. Running SQL directly...');

        // SQL을 세미콜론으로 분리하여 각각 실행
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
          if (statement) {
            console.log(`Executing: ${statement.substring(0, 50)}...`);
            const { error: stmtError } = await supabase.rpc('exec', { sql: statement });
            if (stmtError) {
              console.error(`❌ Statement failed:`, stmtError);
              throw stmtError;
            }
          }
        }

        console.log('✅ Migration completed successfully (direct execution)');
      } else {
        throw error;
      }
    } else {
      console.log('✅ Migration completed successfully');
      console.log('Result:', data);
    }

    // 테이블 생성 확인
    console.log('\n📊 Verifying tables...');

    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['email_verifications', 'report_purchases']);

    if (tableError) {
      console.error('❌ Table verification failed:', tableError);
    } else {
      console.log('✅ Tables created:', tables.map(t => t.table_name).join(', '));
    }

  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

runMigration();
