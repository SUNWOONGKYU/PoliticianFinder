// ============================================================================
// 마이그레이션 직접 실행 스크립트
// ============================================================================
// Supabase REST API 대신 PostgreSQL 직접 연결 시도
// ============================================================================

const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://ooddlafwdpzgxfefgsrx.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU';

// 마이그레이션 SQL 읽기
const migrationPath = path.join(__dirname, '..', '0-4_Database', 'Supabase', 'migrations', '040_fix_politician_ratings_fk.sql');

console.log('═'.repeat(100));
console.log('마이그레이션 직접 실행 시도');
console.log('═'.repeat(100));
console.log();

console.log('📂 마이그레이션 파일 읽기...');
console.log(`   경로: ${migrationPath}`);

if (!fs.existsSync(migrationPath)) {
  console.error('❌ 마이그레이션 파일을 찾을 수 없습니다!');
  process.exit(1);
}

const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
console.log('✅ 마이그레이션 파일 로드 완료');
console.log();

console.log('─'.repeat(100));
console.log('실행할 SQL:');
console.log('─'.repeat(100));
console.log(migrationSQL);
console.log('─'.repeat(100));
console.log();

// Supabase Management API를 통한 실행 시도
async function executeViaManagementAPI() {
  console.log('🔧 방법 1: Supabase Management API 시도...');

  // Management API는 프로젝트 API key가 아닌 개인 access token이 필요함
  console.log('⚠️  Management API는 개인 access token이 필요합니다.');
  console.log('   https://supabase.com/dashboard/account/tokens에서 토큰 생성 필요');
  console.log();
  return false;
}

// Supabase Database REST API를 통한 실행 시도
async function executeViaRESTAPI() {
  console.log('🔧 방법 2: Supabase REST API로 RPC 함수 호출 시도...');

  return new Promise((resolve) => {
    // SQL을 실행할 수 있는 RPC 함수가 있는지 확인
    const data = JSON.stringify({
      query: migrationSQL
    });

    const options = {
      hostname: 'ooddlafwdpzgxfefgsrx.supabase.co',
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Length': data.length,
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('✅ SQL 실행 성공!');
          console.log('   응답:', body);
          resolve(true);
        } else {
          console.log(`❌ 실패 (${res.statusCode})`);
          console.log('   응답:', body);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ 요청 오류:', error.message);
      resolve(false);
    });

    req.write(data);
    req.end();
  });
}

// PostgREST를 통한 직접 DDL 실행 시도
async function executeViaPostgREST() {
  console.log('🔧 방법 3: PostgREST를 통한 DDL 실행 시도...');

  // PostgREST는 DDL을 지원하지 않음
  console.log('⚠️  PostgREST는 SELECT, INSERT, UPDATE, DELETE만 지원하며 DDL(ALTER TABLE)은 불가능합니다.');
  console.log();
  return false;
}

// Supabase CLI를 통한 실행 시도
async function executeViaCLI() {
  console.log('🔧 방법 4: Supabase CLI 확인...');

  const { execSync } = require('child_process');

  try {
    execSync('supabase --version', { stdio: 'pipe' });
    console.log('✅ Supabase CLI 설치됨');
    console.log();
    console.log('📝 Supabase CLI로 실행하려면:');
    console.log('   1. supabase link --project-ref ooddlafwdpzgxfefgsrx');
    console.log('   2. supabase db push');
    console.log();
    return false; // 자동 실행하지 않음
  } catch (error) {
    console.log('⚠️  Supabase CLI가 설치되지 않았습니다.');
    console.log('   설치: npm install -g supabase');
    console.log();
    return false;
  }
}

async function main() {
  const methods = [
    executeViaManagementAPI,
    executeViaRESTAPI,
    executeViaPostgREST,
    executeViaCLI,
  ];

  let success = false;

  for (const method of methods) {
    const result = await method();
    if (result) {
      success = true;
      break;
    }
  }

  if (!success) {
    console.log('═'.repeat(100));
    console.log('❌ 자동 실행 불가능');
    console.log('═'.repeat(100));
    console.log();
    console.log('🔴 모든 자동 실행 방법이 실패했습니다.');
    console.log();
    console.log('✅ 수동 실행 방법 (추천):');
    console.log();
    console.log('   1. https://supabase.com/dashboard 접속');
    console.log('   2. Project 선택: ooddlafwdpzgxfefgsrx');
    console.log('   3. SQL Editor 메뉴 클릭');
    console.log('   4. 다음 SQL을 복사 & 붙여넣기:');
    console.log();
    console.log('─'.repeat(100));
    console.log(migrationSQL);
    console.log('─'.repeat(100));
    console.log();
    console.log('   5. Run 버튼 클릭');
    console.log();
    console.log('═'.repeat(100));
  } else {
    console.log('═'.repeat(100));
    console.log('✅ 마이그레이션 실행 완료!');
    console.log('═'.repeat(100));
  }
}

main().catch(console.error);
