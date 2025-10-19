#!/usr/bin/env node

/**
 * Supabase 마이그레이션 자동 실행 스크립트
 * AI-only 개발 원칙에 따라 사람 개입 없이 실행 가능
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 환경 변수 로드
require('dotenv').config({ path: path.join(__dirname, '../frontend/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase 환경 변수가 없습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runMigration() {
  console.log('🚀 마이그레이션 시작...\n');

  // 마이그레이션 파일 읽기
  const migrationPath = path.join(__dirname, '../supabase/COMBINED_P2_MIGRATIONS_FIXED.sql');

  if (!fs.existsSync(migrationPath)) {
    console.error('❌ 마이그레이션 파일을 찾을 수 없습니다:', migrationPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('📄 마이그레이션 파일 로드 완료');
  console.log('📝 SQL 길이:', sql.length, 'bytes\n');

  // Supabase RPC를 통한 SQL 실행 시도
  try {
    // 방법 1: sql() 함수 사용 (Supabase JS v2)
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

    if (error) {
      throw error;
    }

    console.log('✅ 마이그레이션 성공!');
    console.log('결과:', data);

  } catch (error) {
    console.error('❌ 에러 발생:', error.message);

    // 방법 2: fetch를 사용한 직접 요청
    console.log('\n🔄 대체 방법 시도 중...');

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        },
        body: JSON.stringify({ sql_string: sql })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ 대체 방법 성공!');
      console.log('결과:', result);

    } catch (fetchError) {
      console.error('❌ 대체 방법도 실패:', fetchError.message);
      console.log('\n⚠️  현재 Supabase 프로젝트 설정상 ANON_KEY로는 DDL 실행이 불가능합니다.');
      console.log('📋 해결 방법:');
      console.log('1. Supabase Dashboard → SQL Editor에서 수동 실행');
      console.log('2. SERVICE_ROLE_KEY를 .env에 추가 후 재시도');
      console.log('3. Supabase CLI: npx supabase link && npx supabase db push\n');

      // 마이그레이션 파일 위치 출력
      console.log('📁 마이그레이션 파일 위치:');
      console.log(migrationPath);

      process.exit(1);
    }
  }
}

// 실행
runMigration().catch(console.error);
