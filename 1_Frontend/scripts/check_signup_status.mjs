/**
 * 회원가입 상태 확인 스크립트
 * - Supabase Auth에서 사용자 목록 조회
 * - 이메일 인증 상태 확인
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

async function checkSignupStatus() {
  try {
    console.log('🔍 Supabase Auth 사용자 목록 조회 중...\n');

    // Auth users 조회
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('❌ 사용자 조회 실패:', listError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('📋 등록된 사용자가 없습니다.\n');
      return;
    }

    console.log(`📋 총 ${users.length}명의 사용자 발견\n`);

    users.forEach((user, index) => {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`👤 사용자 #${index + 1}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📧 이메일: ${user.email}`);
      console.log(`🆔 ID: ${user.id}`);
      console.log(`📅 생성일: ${new Date(user.created_at).toLocaleString('ko-KR')}`);

      // 이메일 인증 상태
      if (user.email_confirmed_at) {
        console.log(`✅ 이메일 인증: 완료 (${new Date(user.email_confirmed_at).toLocaleString('ko-KR')})`);
      } else {
        console.log(`❌ 이메일 인증: 미완료`);
        console.log(`⚠️  인증 이메일이 발송되었지만 아직 클릭하지 않았거나,`);
        console.log(`⚠️  Supabase에서 이메일 발송에 실패했을 수 있습니다.`);
      }

      // 마지막 로그인
      if (user.last_sign_in_at) {
        console.log(`🔑 마지막 로그인: ${new Date(user.last_sign_in_at).toLocaleString('ko-KR')}`);
      } else {
        console.log(`🔑 마지막 로그인: 없음 (한 번도 로그인하지 않음)`);
      }

      // User metadata
      if (user.user_metadata && Object.keys(user.user_metadata).length > 0) {
        console.log(`📝 메타데이터: ${JSON.stringify(user.user_metadata, null, 2)}`);
      }
    });

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Supabase Project 설정 확인
    console.log('📌 Supabase 설정 확인사항:\n');
    console.log('1. Supabase Dashboard → Authentication → Settings');
    console.log('   - "Enable email confirmations" 활성화 여부 확인');
    console.log('   - Site URL: https://politician-finder.vercel.app 설정 확인');
    console.log('   - Redirect URLs에 https://politician-finder.vercel.app/auth/callback 추가 확인\n');
    console.log('2. Supabase Dashboard → Authentication → Email Templates');
    console.log('   - "Confirm signup" 템플릿 확인');
    console.log('   - {{ .ConfirmationURL }} 링크 포함 확인\n');
    console.log('3. Supabase Rate Limit');
    console.log('   - 무료 플랜: 시간당 이메일 발송 제한 있음');
    console.log('   - 제한 초과 시 이메일이 발송되지 않음\n');

  } catch (error) {
    console.error('❌ 스크립트 실행 중 오류:', error);
  }
}

checkSignupStatus();
