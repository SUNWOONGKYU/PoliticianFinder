/**
 * 회원가입 프로세스 10회 반복 테스트
 * - 각 단계별 상세 로깅
 * - 이메일 발송 여부 확인
 * - 인증 상태 확인
 * - 최종 통계 및 성공률 분석
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

const results = [];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testSignup(testNumber) {
  console.log(`\n${'━'.repeat(60)}`);
  console.log(`🧪 테스트 #${testNumber}/10`);
  console.log(`${'━'.repeat(60)}\n`);

  const testEmail = `test_round${testNumber}_${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testNickname = `TestUser${testNumber}`;

  const result = {
    testNumber,
    email: testEmail,
    timestamp: new Date().toISOString(),
    steps: {}
  };

  try {
    // Step 1: API 호출
    console.log('📝 STEP 1: 회원가입 API 호출');
    console.log(`   이메일: ${testEmail}`);
    console.log(`   닉네임: ${testNickname}\n`);

    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: testNickname,
          marketing_agreed: false,
        },
        emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      },
    });

    if (error) {
      console.error(`   ❌ 실패: ${error.message}\n`);
      result.steps.signup = { success: false, error: error.message };
      return result;
    }

    console.log('   ✅ 회원가입 API 성공\n');
    result.steps.signup = { success: true };

    // Step 2: 이메일 인증 상태 확인
    console.log('📧 STEP 2: 이메일 인증 상태');
    if (data.user.email_confirmed_at) {
      console.log(`   ❌ 즉시 인증됨: ${new Date(data.user.email_confirmed_at).toLocaleString('ko-KR')}`);
      result.steps.emailVerification = {
        success: false,
        issue: '즉시 인증됨 (설정 문제)'
      };
    } else {
      console.log('   ✅ 미인증 상태 (정상)');
      result.steps.emailVerification = {
        success: true,
        status: '인증 대기 중'
      };
    }

    // Step 3: 인증 이메일 발송 여부
    console.log('\n📬 STEP 3: 인증 이메일 발송 확인');
    if (data.user.confirmation_sent_at) {
      console.log(`   ✅ 발송됨: ${new Date(data.user.confirmation_sent_at).toLocaleString('ko-KR')}`);
      result.steps.emailSent = {
        success: true,
        sentAt: data.user.confirmation_sent_at
      };
    } else {
      console.log('   ❌ 발송 안됨');
      result.steps.emailSent = {
        success: false,
        issue: '이메일 미발송'
      };
    }

    // Step 4: 세션 생성 여부
    console.log('\n🔐 STEP 4: 세션 생성 확인');
    if (data.session) {
      console.log('   ❌ 세션 즉시 생성됨 (이메일 인증 우회됨)');
      result.steps.session = {
        success: false,
        issue: '즉시 세션 생성'
      };
    } else {
      console.log('   ✅ 세션 없음 (인증 후 생성 예정)');
      result.steps.session = {
        success: true,
        status: '인증 후 생성'
      };
    }

    // 종합 결과
    const allSuccess = !data.user.email_confirmed_at &&
                       data.user.confirmation_sent_at &&
                       !data.session;

    result.userId = data.user.id;
    result.overallSuccess = allSuccess;

    console.log('\n' + '━'.repeat(60));
    console.log(allSuccess ? '✅ 테스트 통과!' : '⚠️  일부 문제 발견');
    console.log('━'.repeat(60));

    return result;

  } catch (error) {
    console.error(`\n❌ 테스트 #${testNumber} 중 예외 발생:`, error.message);
    result.steps.exception = { error: error.message };
    result.overallSuccess = false;
    return result;
  }
}

async function runAllTests() {
  console.log('\n');
  console.log('╔' + '═'.repeat(58) + '╗');
  console.log('║' + ' '.repeat(10) + '회원가입 프로세스 10회 반복 테스트' + ' '.repeat(12) + '║');
  console.log('╚' + '═'.repeat(58) + '╝');

  for (let i = 1; i <= 10; i++) {
    const result = await testSignup(i);
    results.push(result);

    // 다음 테스트 전 대기 (Rate limit 방지)
    if (i < 10) {
      console.log('\n⏳ 다음 테스트까지 5초 대기...\n');
      await sleep(5000);
    }
  }

  // 최종 종합 보고서
  console.log('\n\n');
  console.log('╔' + '═'.repeat(58) + '╗');
  console.log('║' + ' '.repeat(20) + '최종 종합 보고서' + ' '.repeat(21) + '║');
  console.log('╚' + '═'.repeat(58) + '╝');
  console.log('\n');

  let successCount = 0;
  let failCount = 0;

  results.forEach((result, index) => {
    console.log(`\n테스트 #${index + 1}:`);
    console.log(`  이메일: ${result.email}`);
    console.log(`  User ID: ${result.userId || 'N/A'}`);
    console.log(`  전체 성공: ${result.overallSuccess ? '✅' : '❌'}`);

    if (result.overallSuccess) {
      successCount++;
    } else {
      failCount++;
    }

    // 문제 발생한 단계 표시
    if (!result.overallSuccess) {
      console.log('  문제 발견:');
      Object.entries(result.steps).forEach(([step, data]) => {
        if (data.success === false || data.issue) {
          console.log(`    - ${step}: ${data.issue || data.error || 'Failed'}`);
        }
      });
    }
  });

  console.log('\n' + '━'.repeat(60));
  console.log('📊 통계');
  console.log('━'.repeat(60));
  console.log(`  전체 테스트: 10회`);
  console.log(`  성공: ${successCount}회 ✅`);
  console.log(`  실패: ${failCount}회 ❌`);
  console.log(`  성공률: ${(successCount / 10 * 100).toFixed(1)}%`);
  console.log('━'.repeat(60));

  // 공통 문제점 분석
  console.log('\n🔍 공통 문제점 분석:');

  const issues = {
    emailNotSent: 0,
    immediateConfirmation: 0,
    sessionCreated: 0,
  };

  results.forEach(result => {
    if (result.steps.emailSent?.success === false) issues.emailNotSent++;
    if (result.steps.emailVerification?.issue?.includes('즉시')) issues.immediateConfirmation++;
    if (result.steps.session?.issue) issues.sessionCreated++;
  });

  if (issues.immediateConfirmation > 0) {
    console.log(`  ⚠️  즉시 인증됨: ${issues.immediateConfirmation}건 - Supabase 설정 문제`);
  }
  if (issues.emailNotSent > 0) {
    console.log(`  ⚠️  이메일 미발송: ${issues.emailNotSent}건 - 이메일 서비스 문제`);
  }
  if (issues.sessionCreated > 0) {
    console.log(`  ⚠️  즉시 세션 생성: ${issues.sessionCreated}건 - 인증 우회 문제`);
  }

  if (Object.values(issues).every(v => v === 0)) {
    console.log('  ✅ 공통 문제점 없음 - 모든 프로세스 정상!\n');
  }

  console.log('\n🧹 테스트 사용자 정리 중...');
  let deletedCount = 0;
  for (const result of results) {
    if (result.userId) {
      const { error } = await supabase.auth.admin.deleteUser(result.userId);
      if (!error) deletedCount++;
    }
  }
  console.log(`✅ ${deletedCount}명의 테스트 사용자 삭제 완료\n`);

  // 최종 판정
  console.log('\n' + '═'.repeat(60));
  if (successCount === 10) {
    console.log('🎉 완벽! 10/10 모든 테스트 통과!');
    console.log('✅ 회원가입 프로세스가 안정적으로 작동하고 있습니다.');
  } else if (successCount >= 8) {
    console.log('⚠️  거의 통과! ' + successCount + '/10 테스트 성공');
    console.log('일부 개선이 필요합니다.');
  } else {
    console.log('❌ 주의 필요! ' + successCount + '/10만 성공');
    console.log('회원가입 프로세스에 중대한 문제가 있습니다.');
  }
  console.log('═'.repeat(60) + '\n');
}

runAllTests();
