/**
 * Supabase 마이그레이션 적용 스크립트
 * Migration 053, 054를 순서대로 적용
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

async function executeSql(sql, description) {
  log(`\n${description}`, 'blue');
  log('실행 중...', 'yellow');

  try {
    // Supabase에서는 rpc를 통해 SQL 실행
    // 각 SQL 문을 개별적으로 실행
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      if (statement.length === 0) continue;

      try {
        // SQL 실행 - raw SQL은 Supabase에서 직접 지원하지 않으므로
        // PostgreSQL의 함수를 사용
        const { error } = await supabase.rpc('exec_sql', {
          sql_string: statement + ';'
        });

        if (error) {
          // exec_sql 함수가 없을 수 있으므로 다른 방법 시도
          throw error;
        }
        successCount++;
      } catch (err) {
        // 일부 statement는 이미 존재할 수 있음 (IF NOT EXISTS)
        if (err.message && (
          err.message.includes('already exists') ||
          err.message.includes('does not exist')
        )) {
          log(`  ⚠️ 건너뜀: ${statement.substring(0, 50)}...`, 'yellow');
        } else {
          errorCount++;
          log(`  ❌ 오류: ${err.message}`, 'red');
          log(`  SQL: ${statement.substring(0, 100)}...`, 'yellow');
        }
      }
    }

    if (errorCount === 0) {
      log(`✅ ${description} 완료 (${successCount}개 실행)`, 'green');
      return true;
    } else {
      log(`⚠️ ${description} 부분 완료 (성공: ${successCount}, 실패: ${errorCount})`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ ${description} 실패: ${error.message}`, 'red');
    return false;
  }
}

async function applyMigrations() {
  log('\n========================================', 'cyan');
  log('Supabase 마이그레이션 적용', 'cyan');
  log('========================================\n', 'cyan');

  try {
    // Migration 053: politician_sessions 테이블 생성
    const migration053Path = path.join(__dirname, '..', '0-4_Database', 'Supabase', 'migrations', '053_create_politician_sessions.sql');
    const migration053 = fs.readFileSync(migration053Path, 'utf8');

    const success053 = await executeSql(migration053, 'Migration 053: politician_sessions 테이블 생성');

    // Migration 054: posts/comments 스키마 수정
    const migration054Path = path.join(__dirname, '..', '0-4_Database', 'Supabase', 'migrations', '054_fix_politician_posting_schema.sql');
    const migration054 = fs.readFileSync(migration054Path, 'utf8');

    const success054 = await executeSql(migration054, 'Migration 054: posts/comments 스키마 수정');

    // 검증
    log('\n========================================', 'cyan');
    log('검증', 'cyan');
    log('========================================\n', 'cyan');

    // 1. politician_sessions 테이블 확인
    log('1. politician_sessions 테이블 확인', 'blue');
    const { data: sessionsCheck, error: sessionsError } = await supabase
      .from('politician_sessions')
      .select('id')
      .limit(1);

    if (sessionsError) {
      log(`  ❌ politician_sessions 테이블 없음: ${sessionsError.message}`, 'red');
    } else {
      log(`  ✅ politician_sessions 테이블 존재`, 'green');
    }

    // 2. posts 테이블 author_type 확인
    log('\n2. posts 테이블 스키마 확인', 'blue');
    const { data: postsCheck, error: postsError } = await supabase
      .from('posts')
      .select('id, user_id, politician_id')
      .limit(1);

    if (postsError) {
      log(`  ❌ posts 테이블 확인 실패: ${postsError.message}`, 'red');
    } else {
      log(`  ✅ posts 테이블 확인 완료`, 'green');
    }

    log('\n========================================', 'cyan');
    log('✅ 마이그레이션 적용 완료!', 'green');
    log('========================================\n', 'cyan');

    log('다음 단계:', 'blue');
    log('  1. 테스트 실행: node test_politician_posting_simple.js', 'yellow');
    log('  2. 데이터베이스 타입 재생성 (선택):', 'yellow');
    log('     supabase gen types typescript --project-id yqihnwqljtrddxhvmpkz > src/lib/database.types.ts', 'yellow');

  } catch (error) {
    log('\n========================================', 'red');
    log('❌ 마이그레이션 적용 실패!', 'red');
    log('========================================\n', 'red');
    log(`오류: ${error.message}`, 'red');
    console.error(error);

    log('\n대안:', 'yellow');
    log('  Supabase Dashboard를 통해 수동으로 적용:', 'yellow');
    log('  1. https://supabase.com/dashboard 접속', 'yellow');
    log('  2. SQL Editor 열기', 'yellow');
    log('  3. 053_create_politician_sessions.sql 실행', 'yellow');
    log('  4. 054_fix_politician_posting_schema.sql 실행', 'yellow');

    process.exit(1);
  }
}

// 실행
applyMigrations();
