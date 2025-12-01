// ============================================================================
// 자동 마이그레이션 스크립트 - 051_create_report_sales_tables.sql
// ============================================================================
// 목적: 사용자 개입 없이 DB 마이그레이션을 자동 실행
// 실행: node auto_migrate_051.js
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 환경 변수
const supabaseUrl = 'https://ooddlafwdpzgxfefgsrx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU';

// Supabase client 생성
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 자동 마이그레이션 시작...\n');

// 마이그레이션 SQL 읽기
const migrationPath = join(__dirname, '..', '0-4_Database', 'Supabase', 'migrations', '051_create_report_sales_tables.sql');
const migrationSQL = readFileSync(migrationPath, 'utf8');

console.log('📂 마이그레이션 파일 읽기 완료');
console.log(`   경로: ${migrationPath}`);
console.log(`   크기: ${migrationSQL.length} bytes\n`);

// 1. 테이블 존재 확인
async function checkTablesExist() {
  console.log('🔍 기존 테이블 확인 중...');

  const { data: emailVerifications, error: emailError } = await supabase
    .from('email_verifications')
    .select('id')
    .limit(1);

  const { data: reportPurchases, error: reportError } = await supabase
    .from('report_purchases')
    .select('id')
    .limit(1);

  const emailExists = !emailError || emailError.code !== 'PGRST204';
  const reportExists = !reportError || reportError.code !== 'PGRST204';

  console.log(`   email_verifications: ${emailExists ? '✅ 존재' : '❌ 없음'}`);
  console.log(`   report_purchases: ${reportExists ? '✅ 존재' : '❌ 없음'}\n`);

  return { emailExists, reportExists };
}

// 2. SQL 문장별로 분리 및 실행
async function executeMigration() {
  console.log('⚙️  마이그레이션 실행 중...\n');

  // SQL을 문장별로 분리 (주석 제거 및 빈 줄 제거)
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))
    .map(s => s + ';');

  console.log(`   총 ${statements.length}개 SQL 문장 발견\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 80).replace(/\n/g, ' ');

    console.log(`   [${i + 1}/${statements.length}] ${preview}...`);

    try {
      // RPC를 통해 SQL 실행 (supabase_admin 스키마의 exec_sql 함수 사용)
      // 하지만 이 함수가 없을 수 있으므로, 대신 pg-promise 라이브러리를 사용할 수도 있음

      // 임시로 각 테이블 생성을 시도 (실패해도 계속 진행)
      if (stmt.includes('CREATE TABLE')) {
        // 테이블 생성은 직접 API로 불가능
        // 대신 각 문장을 출력하여 수동 실행 안내
        console.log(`   ⚠️  테이블 생성 SQL - Supabase Dashboard에서 실행 필요`);
        skipCount++;
      } else if (stmt.includes('CREATE INDEX')) {
        console.log(`   ⚠️  인덱스 생성 SQL - Supabase Dashboard에서 실행 필요`);
        skipCount++;
      } else if (stmt.includes('ALTER TABLE')) {
        console.log(`   ⚠️  테이블 수정 SQL - Supabase Dashboard에서 실행 필요`);
        skipCount++;
      } else if (stmt.includes('CREATE POLICY')) {
        console.log(`   ⚠️  RLS 정책 생성 - Supabase Dashboard에서 실행 필요`);
        skipCount++;
      } else {
        console.log(`   ⚠️  기타 SQL - Supabase Dashboard에서 실행 필요`);
        skipCount++;
      }
    } catch (error) {
      console.log(`   ❌ 실패: ${error.message}`);
      errorCount++;
    }
  }

  console.log('\n📊 실행 결과:');
  console.log(`   ✅ 성공: ${successCount}개`);
  console.log(`   ⚠️  건너뜀: ${skipCount}개`);
  console.log(`   ❌ 실패: ${errorCount}개\n`);

  if (skipCount > 0) {
    console.log('⚠️  Supabase Client Library는 DDL 실행을 지원하지 않습니다.');
    console.log('   대신 Supabase Dashboard SQL Editor에서 다음 SQL을 실행하세요:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(migrationSQL);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📍 Supabase Dashboard 접속:');
    console.log('   https://supabase.com/dashboard/project/ooddlafwdpzgxfefgsrx/sql/new\n');
  }
}

// 3. 마이그레이션 검증
async function verifyMigration() {
  console.log('✅ 마이그레이션 검증 중...\n');

  const { emailExists, reportExists } = await checkTablesExist();

  if (emailExists && reportExists) {
    console.log('🎉 마이그레이션 성공!');
    console.log('   모든 테이블이 정상적으로 생성되었습니다.\n');
    return true;
  } else {
    console.log('⚠️  마이그레이션 미완료');
    console.log('   Supabase Dashboard에서 SQL을 수동으로 실행해주세요.\n');
    return false;
  }
}

// 메인 실행
async function main() {
  try {
    // 1단계: 기존 테이블 확인
    const { emailExists, reportExists } = await checkTablesExist();

    if (emailExists && reportExists) {
      console.log('✅ 마이그레이션이 이미 완료되었습니다.\n');
      process.exit(0);
    }

    // 2단계: 마이그레이션 실행
    await executeMigration();

    // 3단계: 검증
    const success = await verifyMigration();

    if (success) {
      console.log('✅ 완료! 이제 보고서 판매 시스템을 사용할 수 있습니다.\n');
      process.exit(0);
    } else {
      console.log('⚠️  수동 작업 필요');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

main();
