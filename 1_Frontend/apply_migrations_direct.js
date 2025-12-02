/**
 * Supabase 마이그레이션 직접 적용 스크립트
 * PostgreSQL 클라이언트를 통해 직접 SQL 실행
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// PostgreSQL 클라이언트
const { Client } = require('pg');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function applyMigrations() {
  log('\n========================================', 'cyan');
  log('Supabase 마이그레이션 적용 (PostgreSQL 직접 연결)', 'cyan');
  log('========================================\n', 'cyan');

  // Supabase 연결 정보
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1];

  log('연결 정보:', 'blue');
  log(`  Project ID: ${projectId}`, 'yellow');
  log(`  Host: db.${projectId}.supabase.co`, 'yellow');
  log(`  Database: postgres`, 'yellow');
  log('', 'reset');

  // PostgreSQL 클라이언트 생성
  // 주의: 비밀번호는 Supabase Dashboard > Settings > Database > Connection String에서 확인
  const client = new Client({
    host: `db.${projectId}.supabase.co`,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: process.env.SUPABASE_DB_PASSWORD || process.env.POSTGRES_PASSWORD,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    log('데이터베이스 연결 중...', 'blue');
    await client.connect();
    log('✅ 데이터베이스 연결 성공', 'green');

    // Migration 053 실행
    log('\n' + '='.repeat(60), 'cyan');
    log('Migration 053: politician_sessions 테이블 생성', 'cyan');
    log('='.repeat(60), 'cyan');

    const migration053Path = path.join(__dirname, '..', '0-4_Database', 'Supabase', 'migrations', '053_create_politician_sessions.sql');
    const migration053 = fs.readFileSync(migration053Path, 'utf8');

    log('SQL 실행 중...', 'yellow');
    await client.query(migration053);
    log('✅ Migration 053 완료', 'green');

    // Migration 054 실행
    log('\n' + '='.repeat(60), 'cyan');
    log('Migration 054: posts/comments 스키마 수정', 'cyan');
    log('='.repeat(60), 'cyan');

    const migration054Path = path.join(__dirname, '..', '0-4_Database', 'Supabase', 'migrations', '054_fix_politician_posting_schema.sql');
    const migration054 = fs.readFileSync(migration054Path, 'utf8');

    log('SQL 실행 중...', 'yellow');
    await client.query(migration054);
    log('✅ Migration 054 완료', 'green');

    // 검증
    log('\n' + '='.repeat(60), 'cyan');
    log('검증', 'cyan');
    log('='.repeat(60) + '\n', 'cyan');

    // 1. politician_sessions 테이블 확인
    log('1. politician_sessions 테이블 확인', 'blue');
    const sessionsResult = await client.query('SELECT COUNT(*) FROM politician_sessions');
    log(`  ✅ politician_sessions 테이블 존재 (행 수: ${sessionsResult.rows[0].count})`, 'green');

    // 2. posts 테이블 스키마 확인
    log('\n2. posts 테이블 author_type 컬럼 확인', 'blue');
    const postsSchemaResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'posts' AND column_name IN ('user_id', 'author_type', 'politician_id')
      ORDER BY column_name
    `);
    postsSchemaResult.rows.forEach(row => {
      log(`  - ${row.column_name}: ${row.data_type} (NULL 허용: ${row.is_nullable})`, 'yellow');
    });
    log('  ✅ posts 테이블 스키마 확인 완료', 'green');

    // 3. comments 테이블 스키마 확인
    log('\n3. comments 테이블 author_type 컬럼 확인', 'blue');
    const commentsSchemaResult = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'comments' AND column_name IN ('user_id', 'author_type', 'politician_id')
      ORDER BY column_name
    `);
    commentsSchemaResult.rows.forEach(row => {
      log(`  - ${row.column_name}: ${row.data_type} (NULL 허용: ${row.is_nullable})`, 'yellow');
    });
    log('  ✅ comments 테이블 스키마 확인 완료', 'green');

    log('\n' + '='.repeat(60), 'cyan');
    log('✅ 모든 마이그레이션 적용 완료!', 'green');
    log('='.repeat(60) + '\n', 'cyan');

    log('다음 단계:', 'blue');
    log('  1. 테스트 실행:', 'yellow');
    log('     cd 1_Frontend && node test_politician_posting_simple.js', 'cyan');
    log('', 'reset');
    log('  2. 데이터베이스 타입 재생성 (선택):', 'yellow');
    log('     supabase gen types typescript --project-id yqihnwqljtrddxhvmpkz > src/lib/database.types.ts', 'cyan');

  } catch (error) {
    log('\n' + '='.repeat(60), 'red');
    log('❌ 마이그레이션 적용 실패!', 'red');
    log('='.repeat(60) + '\n', 'red');
    log(`오류: ${error.message}`, 'red');

    if (error.message.includes('password')) {
      log('\n데이터베이스 비밀번호 설정이 필요합니다:', 'yellow');
      log('  1. Supabase Dashboard 접속', 'cyan');
      log('  2. Settings > Database > Connection String', 'cyan');
      log('  3. 비밀번호 확인', 'cyan');
      log('  4. .env.local 파일에 추가:', 'cyan');
      log('     SUPABASE_DB_PASSWORD=your-password', 'yellow');
    } else if (error.message.includes('already exists')) {
      log('\n테이블/컬럼이 이미 존재합니다. 정상적인 상황일 수 있습니다.', 'yellow');
      log('검증을 실행해보세요:', 'cyan');
      log('  node test_politician_posting_simple.js', 'yellow');
    } else {
      console.error('\n상세 오류:', error);
    }

    log('\n대안 - Supabase Dashboard를 통한 수동 적용:', 'yellow');
    log('  1. https://supabase.com/dashboard 접속', 'cyan');
    log('  2. SQL Editor 열기', 'cyan');
    log('  3. 053_create_politician_sessions.sql 복사 붙여넣기 → Run', 'cyan');
    log('  4. 054_fix_politician_posting_schema.sql 복사 붙여넣기 → Run', 'cyan');

    process.exit(1);
  } finally {
    await client.end();
  }
}

// 실행
applyMigrations();
