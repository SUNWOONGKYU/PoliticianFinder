// ============================================================================
// 자동 마이그레이션 스크립트 (REST API 버전) - 051_create_report_sales_tables.sql
// ============================================================================
// 목적: Supabase REST API를 통해 DB 마이그레이션 자동 실행
// 실행: node auto_migrate_051_rest.js
// ============================================================================

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 환경 변수
const supabaseUrl = 'https://ooddlafwdpzgxfefgsrx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU';
const projectRef = 'ooddlafwdpzgxfefgsrx';

console.log('🚀 자동 마이그레이션 시작 (REST API 방식)...\n');

// 마이그레이션 SQL 읽기
const migrationPath = join(__dirname, '..', '0-4_Database', 'Supabase', 'migrations', '051_create_report_sales_tables.sql');
const migrationSQL = readFileSync(migrationPath, 'utf8');

console.log('📂 마이그레이션 파일 읽기 완료');
console.log(`   경로: ${migrationPath}`);
console.log(`   크기: ${migrationSQL.length} bytes\n`);

// Supabase Management API를 통해 SQL 실행
async function executeSQLviaManagementAPI(sql) {
  const managementAPIUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  console.log('🔧 Supabase Management API 호출 중...');
  console.log(`   URL: ${managementAPIUrl}\n`);

  try {
    const response = await fetch(managementAPIUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Management API 호출 실패:', result);
      return false;
    }

    console.log('✅ SQL 실행 성공!\n');
    return true;

  } catch (error) {
    console.error('❌ Management API 호출 중 오류:', error.message);
    return false;
  }
}

// 대체 방법: PostgreSQL 직접 연결 (pg 라이브러리 사용)
async function executeSQLviaPostgreSQL(sql) {
  console.log('🔧 PostgreSQL 직접 연결 시도...\n');

  try {
    // pg 라이브러리 동적 임포트
    const { default: pkg } = await import('pg');
    const { Client } = pkg;

    // Connection string (환경 변수에서 읽기)
    const databasePassword = 'jqjw2HiOcKwE1Ugm'; // .env.local에서 읽은 값
    const connectionString = `postgresql://postgres.ooddlafwdpzgxfefgsrx:${databasePassword}@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`;

    const client = new Client({ connectionString });

    console.log('📡 PostgreSQL 연결 중...');
    await client.connect();
    console.log('✅ 연결 성공!\n');

    console.log('⚙️  SQL 실행 중...');
    await client.query(sql);
    console.log('✅ SQL 실행 성공!\n');

    await client.end();
    console.log('✅ 연결 종료\n');

    return true;

  } catch (error) {
    console.error('❌ PostgreSQL 연결 실패:', error.message);

    // pg 라이브러리가 없으면 설치 안내
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('\n📦 pg 라이브러리 설치 필요:');
      console.log('   npm install pg\n');
    }

    return false;
  }
}

// 메인 실행
async function main() {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 방법 1: Management API 시도
    console.log('📌 방법 1: Supabase Management API 시도\n');
    const managementSuccess = await executeSQLviaManagementAPI(migrationSQL);

    if (managementSuccess) {
      console.log('🎉 마이그레이션 완료! (Management API)\n');
      console.log('✅ 이제 보고서 판매 시스템을 사용할 수 있습니다.\n');
      process.exit(0);
    }

    console.log('⚠️  Management API 실패, 다른 방법 시도...\n\n');

    // 방법 2: PostgreSQL 직접 연결
    console.log('📌 방법 2: PostgreSQL 직접 연결 시도\n');
    const postgresSuccess = await executeSQLviaPostgreSQL(migrationSQL);

    if (postgresSuccess) {
      console.log('🎉 마이그레이션 완료! (PostgreSQL 직접 연결)\n');
      console.log('✅ 이제 보고서 판매 시스템을 사용할 수 있습니다.\n');
      process.exit(0);
    }

    console.log('⚠️  PostgreSQL 직접 연결도 실패\n\n');

    // 방법 3: 수동 실행 안내 (최후의 방법)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📌 방법 3: Supabase Dashboard에서 수동 실행 (최후의 방법)\n');
    console.log('모든 자동 실행 방법이 실패했습니다.');
    console.log('Supabase Dashboard SQL Editor에서 다음 SQL을 복사하여 실행해주세요:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(migrationSQL);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📍 Supabase Dashboard SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/ooddlafwdpzgxfefgsrx/sql/new\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(1);

  } catch (error) {
    console.error('\n❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

main();
