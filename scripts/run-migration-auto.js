#!/usr/bin/env node

/**
 * Supabase 마이그레이션 자동 실행 (SERVICE_ROLE_KEY 사용)
 * AI-only 개발 원칙: 완전 자동화
 */

const fs = require('fs');
const path = require('path');

// 환경 변수 로드
const envPath = path.join(__dirname, '../frontend/.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const SUPABASE_URL = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const SERVICE_ROLE_KEY = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ 환경 변수를 찾을 수 없습니다.');
  console.error('SUPABASE_URL:', SUPABASE_URL);
  console.error('SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? 'Found' : 'Not found');
  process.exit(1);
}

async function runMigration() {
  console.log('🚀 마이그레이션 자동 실행 시작...\n');

  // 마이그레이션 파일 읽기
  const migrationPath = path.join(__dirname, '../supabase/COMBINED_P2_MIGRATIONS_FIXED.sql');

  if (!fs.existsSync(migrationPath)) {
    console.error('❌ 마이그레이션 파일을 찾을 수 없습니다:', migrationPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('📄 마이그레이션 파일 로드 완료');
  console.log('📝 SQL 길이:', sql.length, 'bytes');
  console.log('🔑 SERVICE_ROLE_KEY 사용\n');

  // SQL을 여러 개의 statement로 분리
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log('📊 총', statements.length, '개의 SQL 구문 실행 예정\n');

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ';';

    // DO $$ 블록은 전체가 하나의 구문
    if (stmt.includes('DO $$')) {
      const fullBlock = sql.substring(
        sql.indexOf(stmt.split(';')[0]),
        sql.indexOf('END $$;') + 'END $$;'.length
      );

      try {
        await executeSQL(SUPABASE_URL, SERVICE_ROLE_KEY, fullBlock);
        console.log(`✅ [${i + 1}/${statements.length}] DO 블록 실행 완료`);
        successCount++;

        // DO 블록 내부 구문들은 스킵
        while (i < statements.length && !statements[i].includes('END $$')) {
          i++;
        }
      } catch (error) {
        console.error(`❌ [${i + 1}/${statements.length}] 에러:`, error.message);
        errorCount++;
      }
      continue;
    }

    // 일반 구문 실행
    if (stmt.length > 10) {
      try {
        await executeSQL(SUPABASE_URL, SERVICE_ROLE_KEY, stmt);
        const preview = stmt.substring(0, 50).replace(/\n/g, ' ');
        console.log(`✅ [${i + 1}/${statements.length}] ${preview}...`);
        successCount++;
      } catch (error) {
        console.error(`❌ [${i + 1}/${statements.length}] 에러:`, error.message);
        errorCount++;
      }
    }

    // 너무 빠른 요청 방지
    await sleep(100);
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 실행 결과:');
  console.log('   성공:', successCount, '개');
  console.log('   실패:', errorCount, '개');
  console.log('='.repeat(50));

  if (errorCount === 0) {
    console.log('\n🎉 마이그레이션 완료!');
  } else {
    console.log('\n⚠️  일부 에러가 발생했지만 계속 진행되었습니다.');
  }
}

async function executeSQL(url, key, sql) {
  const response = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return await response.json();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 실행
runMigration().catch(console.error);
