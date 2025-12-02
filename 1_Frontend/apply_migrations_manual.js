// Supabase에 마이그레이션 수동 적용 스크립트
// Migration 052, 053 적용

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = 'https://ooddlafwdpzgxfefgsrx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 Supabase 마이그레이션 수동 적용\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function applyMigrations() {
  try {
    // Migration 052: Allow politician posts without auth
    console.log('📌 Migration 052: posts.title → subject, user_id NULLABLE\n');

    // 1. posts.title → subject
    console.log('   1/5: Renaming posts.title → posts.subject...');
    const { error: renameError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE posts RENAME COLUMN title TO subject;'
    });
    if (renameError && !renameError.message.includes('already exists')) {
      console.log(`   ⚠️ Warning: ${renameError.message}\n`);
    } else {
      console.log('   ✅ Column renamed\n');
    }

    // 2. posts.user_id → NULLABLE
    console.log('   2/5: Making posts.user_id NULLABLE...');
    const { error: postsNullableError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE posts ALTER COLUMN user_id DROP NOT NULL;'
    });
    if (postsNullableError) {
      console.log(`   ⚠️ Warning: ${postsNullableError.message}\n`);
    } else {
      console.log('   ✅ posts.user_id is now NULLABLE\n');
    }

    // 3. posts.author_type 추가
    console.log('   3/5: Adding posts.author_type column...');
    const { error: postsAuthorTypeError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE posts ADD COLUMN IF NOT EXISTS author_type TEXT DEFAULT 'user' CHECK (author_type IN ('user', 'politician'));`
    });
    if (postsAuthorTypeError) {
      console.log(`   ⚠️ Warning: ${postsAuthorTypeError.message}\n`);
    } else {
      console.log('   ✅ posts.author_type added\n');
    }

    // 4. comments.user_id → NULLABLE
    console.log('   4/5: Making comments.user_id NULLABLE...');
    const { error: commentsNullableError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE comments ALTER COLUMN user_id DROP NOT NULL;'
    });
    if (commentsNullableError) {
      console.log(`   ⚠️ Warning: ${commentsNullableError.message}\n`);
    } else {
      console.log('   ✅ comments.user_id is now NULLABLE\n');
    }

    // 5. comments.politician_id 추가
    console.log('   5/5: Adding comments.politician_id column...');
    const { error: commentsPoliticianIdError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE comments ADD COLUMN IF NOT EXISTS politician_id TEXT REFERENCES politicians(id) ON DELETE SET NULL;`
    });
    if (commentsPoliticianIdError) {
      console.log(`   ⚠️ Warning: ${commentsPoliticianIdError.message}\n`);
    } else {
      console.log('   ✅ comments.politician_id added\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Migration 053: Create politician_sessions table
    console.log('📌 Migration 053: politician_sessions 테이블 생성\n');

    console.log('   Creating politician_sessions table...');
    const createSessionsSQL = `
      CREATE TABLE IF NOT EXISTS politician_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        politician_id TEXT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
        session_token TEXT UNIQUE NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        last_used_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        ip_address TEXT,
        user_agent TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_politician_sessions_token ON politician_sessions(session_token);
      CREATE INDEX IF NOT EXISTS idx_politician_sessions_expires ON politician_sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_politician_sessions_politician ON politician_sessions(politician_id);
    `;

    const { error: sessionsError } = await supabase.rpc('exec_sql', {
      sql: createSessionsSQL
    });

    if (sessionsError) {
      console.log(`   ⚠️ Error: ${sessionsError.message}\n`);
    } else {
      console.log('   ✅ politician_sessions table created\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎉 마이그레이션 완료!\n');

    // 검증: 테이블 구조 확인
    console.log('📌 검증: 테이블 구조 확인\n');

    console.log('   Checking posts table...');
    const { data: postsColumns } = await supabase
      .from('posts')
      .select('*')
      .limit(0);

    console.log('   ✅ posts table verified\n');

    console.log('   Checking politician_sessions table...');
    const { data: sessionsData, error: sessionsCheckError } = await supabase
      .from('politician_sessions')
      .select('*')
      .limit(0);

    if (sessionsCheckError) {
      console.log(`   ❌ politician_sessions table check failed: ${sessionsCheckError.message}\n`);
    } else {
      console.log('   ✅ politician_sessions table verified\n');
    }

  } catch (error) {
    console.error('\n❌ Migration error:', error.message);
    console.error(error);
  }
}

applyMigrations();
