/**
 * Supabase 설정 확인 스크립트
 * - Auth 설정 확인
 * - 이메일 인증 설정 확인
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// .env.local 수동 파싱
const envPath = resolve(__dirname, '../.env.local');
const envFile = readFileSync(envPath, 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    env[key] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkSupabaseSettings() {
  try {
    console.log('🔍 Supabase Auth 설정 확인 중...\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 테스트 회원가입을 통한 실제 동작 확인
    const testEmail = `test_verification_${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    console.log('📝 테스트 회원가입 시도...');
    console.log(`   이메일: ${testEmail}\n`);

    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Test User',
        },
        emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      },
    });

    if (error) {
      console.error('❌ 회원가입 실패:', error.message);
      return;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Supabase 응답 분석\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 1. User 정보
    if (data.user) {
      console.log('👤 사용자 정보:');
      console.log(`   - ID: ${data.user.id}`);
      console.log(`   - Email: ${data.user.email}`);
      console.log(`   - Created: ${new Date(data.user.created_at).toLocaleString('ko-KR')}\n`);

      // 2. 이메일 인증 상태 (핵심!)
      console.log('📧 이메일 인증 상태:');
      if (data.user.email_confirmed_at) {
        console.log('   ❌ CONFIRMED AT: ' + new Date(data.user.email_confirmed_at).toLocaleString('ko-KR'));
        console.log('   ⚠️  문제 발견: 회원가입 즉시 이메일 인증 완료됨\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔴 진단 결과: 이메일 인증이 비활성화되어 있습니다!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      } else {
        console.log('   ✅ CONFIRMED AT: null (미인증 상태)');
        console.log('   ✅ 정상: 이메일 인증 대기 중\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ 진단 결과: 이메일 인증이 정상적으로 활성화되어 있습니다!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      }

      // 3. Session 정보
      console.log('🔐 세션 정보:');
      if (data.session) {
        console.log('   ⚠️  세션 즉시 생성됨 (이메일 인증 비활성화 신호)');
        console.log(`   - Access Token: ${data.session.access_token.substring(0, 20)}...`);
      } else {
        console.log('   ✅ 세션 없음 (이메일 인증 완료 후 생성됨)');
      }
      console.log('');

      // 4. Confirmation sent 여부
      console.log('📬 이메일 발송 정보:');
      console.log(`   - Confirmation sent at: ${data.user.confirmation_sent_at ? new Date(data.user.confirmation_sent_at).toLocaleString('ko-KR') : 'null'}`);

      if (data.user.confirmation_sent_at) {
        console.log('   ✅ 인증 이메일 발송됨');
      } else {
        console.log('   ❌ 인증 이메일 발송되지 않음 (인증 비활성화)');
      }
      console.log('');
    }

    // 요약
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 요약\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (data.user.email_confirmed_at) {
      console.log('🔴 이메일 인증: 비활성화');
      console.log('   회원가입 즉시 인증 완료로 처리됨');
      console.log('   → Supabase에서 "Enable email confirmations" 설정 필요\n');
    } else {
      console.log('✅ 이메일 인증: 활성화');
      console.log('   정상적으로 인증 메일 발송 및 인증 대기 중\n');
    }

    if (data.session) {
      console.log('🔴 세션 생성: 즉시 생성됨');
      console.log('   이메일 인증 없이 바로 로그인 가능\n');
    } else {
      console.log('✅ 세션 생성: 인증 후 생성');
      console.log('   이메일 인증 완료 후에만 로그인 가능\n');
    }

    // 환경 변수 확인
    console.log('🔧 환경 변수 설정:');
    console.log(`   - NEXT_PUBLIC_SITE_URL: ${env.NEXT_PUBLIC_SITE_URL || '미설정'}`);
    console.log(`   - Redirect URL: ${env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback\n`);

    // 테스트 사용자 삭제
    console.log('🧹 테스트 사용자 삭제 중...');
    const { error: deleteError } = await supabase.auth.admin.deleteUser(data.user.id);
    if (!deleteError) {
      console.log('✅ 테스트 사용자 삭제 완료\n');
    }

  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

checkSupabaseSettings();
