/**
 * Supabase 이메일 발송 로그 확인 시도
 */

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

// Supabase project ID 추출
const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

console.log('🔍 Supabase 이메일 발송 상태 확인 시도\n');
console.log('━'.repeat(60));
console.log(`Project ID: ${projectId}`);
console.log(`Supabase URL: ${supabaseUrl}`);
console.log('━'.repeat(60));

console.log('\n📧 이메일 발송 로그 확인 방법:\n');
console.log('1. Supabase Dashboard 접속');
console.log('   https://app.supabase.com/project/' + projectId);
console.log('\n2. 왼쪽 메뉴에서 "Logs" 또는 "Project Logs" 선택');
console.log('\n3. 검색 필터:');
console.log('   - "auth" 로그 선택');
console.log('   - "email" 또는 "mail" 키워드 검색');
console.log('\n4. 확인 사항:');
console.log('   - Email sent successfully');
console.log('   - SMTP connection');
console.log('   - Email delivery status');

console.log('\n━'.repeat(60));
console.log('⚠️  제한사항');
console.log('━'.repeat(60));
console.log('\nSupabase는 API를 통한 이메일 로그 조회를 제공하지 않습니다.');
console.log('이메일 발송 로그는 Dashboard에서만 확인 가능합니다.\n');

// Management API 시도
console.log('━'.repeat(60));
console.log('🔧 Management API 확인 시도');
console.log('━'.repeat(60) + '\n');

try {
  // Auth admin API로 최근 이벤트 확인 시도
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/audit`, {
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    }
  });

  if (response.ok) {
    const data = await response.json();
    console.log('✅ Audit logs 조회 성공:\n');
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(`❌ Audit logs 조회 실패: ${response.status} ${response.statusText}`);
    if (response.status === 404) {
      console.log('   (이 엔드포인트는 지원되지 않을 수 있습니다)');
    }
  }
} catch (error) {
  console.log(`❌ API 호출 실패: ${error.message}`);
}

console.log('\n━'.repeat(60));
console.log('📊 대안적인 확인 방법');
console.log('━'.repeat(60) + '\n');

console.log('1. 테스트 이메일 직접 발송:');
console.log('   - Supabase Dashboard → Authentication → Users');
console.log('   - 사용자 선택 → "Send password reset email"');
console.log('   - 이메일이 오는지 확인');

console.log('\n2. SMTP 설정 상태 확인:');
console.log('   - Supabase Dashboard → Settings → Auth');
console.log('   - SMTP Settings 섹션 확인');
console.log('   - Custom SMTP가 설정되어 있는지 확인');

console.log('\n3. 이메일 제공자 확인:');
console.log('   - Supabase 기본: noreply@mail.app.supabase.io');
console.log('   - 이 발신자가 차단되었을 수 있음');

console.log('\n━'.repeat(60));
console.log('💡 결론');
console.log('━'.repeat(60) + '\n');

console.log('API를 통해서는 실제 이메일 발송 여부를 확인할 수 없습니다.');
console.log('Supabase Dashboard에서 직접 로그를 확인하셔야 합니다.\n');
console.log('Dashboard URL:');
console.log(`https://app.supabase.com/project/${projectId}/logs/explorer\n`);
