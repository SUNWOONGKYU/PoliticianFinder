/**
 * 모든 테스트 사용자 계정 삭제 스크립트
 *
 * 실행 방법:
 * node scripts/delete_all_users.mjs
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
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '설정됨' : '없음');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function deleteAllUsers() {
  try {
    console.log('🔍 모든 사용자 조회 중...');

    // 1. Auth users 조회
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('❌ 사용자 조회 실패:', listError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('✅ 삭제할 사용자가 없습니다.');
      return;
    }

    console.log(`📋 총 ${users.length}명의 사용자를 찾았습니다.\n`);

    // 2. 각 사용자별로 삭제
    for (const user of users) {
      console.log(`🗑️  삭제 중: ${user.email} (ID: ${user.id})`);

      // 2-1. users 테이블에서 삭제
      const { error: profileError } = await supabase
        .from('users')
        .delete()
        .eq('user_id', user.id);

      if (profileError) {
        console.error(`  ⚠️  users 테이블 삭제 실패:`, profileError.message);
      } else {
        console.log(`  ✅ users 테이블에서 삭제 완료`);
      }

      // 2-2. Auth에서 사용자 삭제
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);

      if (authError) {
        console.error(`  ❌ Auth 삭제 실패:`, authError.message);
      } else {
        console.log(`  ✅ Auth에서 삭제 완료`);
      }

      console.log('');
    }

    console.log(`\n🎉 총 ${users.length}명의 사용자 계정 삭제 완료!`);
  } catch (error) {
    console.error('❌ 스크립트 실행 중 오류:', error);
  }
}

deleteAllUsers();
