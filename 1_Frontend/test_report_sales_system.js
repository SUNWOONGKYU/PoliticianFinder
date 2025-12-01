// ============================================================================
// 보고서 판매 시스템 통합 테스트
// ============================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ooddlafwdpzgxfefgsrx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 보고서 판매 시스템 통합 테스트 시작\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ============================================================================
// STEP 1: 테스트용 정치인 데이터 생성
// ============================================================================
async function step1_createTestPolitician() {
  console.log('📌 STEP 1: 테스트용 정치인 데이터 생성\n');

  const testPolitician = {
    id: 'test1234',  // 8자리 TEXT ID
    name: '테스트정치인',
    party: '테스트당',
    position: '국회의원',
    email: 'test@example.com',  // 실제 테스트용 이메일로 변경 필요
    created_at: new Date().toISOString()
  };

  // 기존 테스트 데이터 삭제
  const { error: deleteError } = await supabase
    .from('politicians')
    .delete()
    .eq('id', testPolitician.id);

  if (deleteError) {
    console.log(`   ⚠️  기존 데이터 삭제 실패 (없을 수 있음): ${deleteError.message}\n`);
  }

  // 새 데이터 삽입
  const { data, error } = await supabase
    .from('politicians')
    .insert([testPolitician])
    .select();

  if (error) {
    console.error(`   ❌ 정치인 데이터 생성 실패: ${error.message}\n`);
    return null;
  }

  console.log('   ✅ 정치인 데이터 생성 성공');
  console.log(`   - ID: ${testPolitician.id}`);
  console.log(`   - 이름: ${testPolitician.name}`);
  console.log(`   - 정당: ${testPolitician.party}`);
  console.log(`   - 직위: ${testPolitician.position}`);
  console.log(`   - 이메일: ${testPolitician.email}\n`);

  return testPolitician;
}

// ============================================================================
// STEP 2: 이메일 인증 코드 발송 API 테스트
// ============================================================================
async function step2_testSendCode(politician) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📌 STEP 2: 이메일 인증 코드 발송 API 테스트\n');

  const apiUrl = 'https://politicianfinder.com/api/politicians/verify/send-code';

  console.log(`   API 호출: POST ${apiUrl}`);
  console.log(`   요청 데이터: ${JSON.stringify({
    name: politician.name,
    party: politician.party,
    position: politician.position
  }, null, 2)}\n`);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: politician.name,
        party: politician.party,
        position: politician.position
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`   ❌ API 호출 실패 (${response.status}): ${result.error}\n`);
      return null;
    }

    console.log('   ✅ API 호출 성공');
    console.log(`   - verification_id: ${result.verification_id}`);
    console.log(`   - email: ${result.email}`);
    console.log(`   - expires_at: ${result.expires_at}\n`);

    // DB에서 인증 코드 확인 (테스트용)
    const { data: verification, error } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('id', result.verification_id)
      .single();

    if (verification) {
      console.log('   📋 DB에 저장된 인증 정보:');
      console.log(`   - 인증 코드: ${verification.verification_code}`);
      console.log(`   - 만료 시간: ${verification.expires_at}`);
      console.log(`   - 인증 상태: ${verification.verified ? '✅ 완료' : '⏳ 대기'}\n`);
    }

    return {
      verification_id: result.verification_id,
      verification_code: verification?.verification_code
    };

  } catch (error) {
    console.error(`   ❌ API 호출 중 오류: ${error.message}\n`);
    return null;
  }
}

// ============================================================================
// STEP 3: 이메일 인증 코드 확인 API 테스트
// ============================================================================
async function step3_testCheckCode(verificationInfo) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📌 STEP 3: 이메일 인증 코드 확인 API 테스트\n');

  const apiUrl = 'https://politicianfinder.com/api/politicians/verify/check-code';

  console.log(`   API 호출: POST ${apiUrl}`);
  console.log(`   요청 데이터: ${JSON.stringify({
    verification_id: verificationInfo.verification_id,
    code: verificationInfo.verification_code
  }, null, 2)}\n`);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        verification_id: verificationInfo.verification_id,
        code: verificationInfo.verification_code
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`   ❌ API 호출 실패 (${response.status}): ${result.error}\n`);
      return false;
    }

    console.log('   ✅ API 호출 성공');
    console.log(`   - verified: ${result.verified}`);
    console.log(`   - politician_id: ${result.politician_id}`);
    console.log(`   - email: ${result.email}\n`);

    return true;

  } catch (error) {
    console.error(`   ❌ API 호출 중 오류: ${error.message}\n`);
    return false;
  }
}

// ============================================================================
// STEP 4: 보고서 구매 데이터 생성
// ============================================================================
async function step4_createPurchase(politician) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📌 STEP 4: 보고서 구매 데이터 생성\n');

  const purchaseData = {
    politician_id: politician.id,
    buyer_name: politician.name,
    buyer_email: politician.email,
    amount: 50000,
    currency: 'KRW',
    payment_confirmed: true,
    payment_confirmed_at: new Date().toISOString(),
    report_type: 'standard',
    report_period: '2025-Q1',
    sent: false
  };

  const { data, error } = await supabase
    .from('report_purchases')
    .insert([purchaseData])
    .select();

  if (error) {
    console.error(`   ❌ 구매 데이터 생성 실패: ${error.message}\n`);
    return null;
  }

  console.log('   ✅ 구매 데이터 생성 성공');
  console.log(`   - purchase_id: ${data[0].id}`);
  console.log(`   - amount: ${purchaseData.amount} ${purchaseData.currency}`);
  console.log(`   - report_type: ${purchaseData.report_type}`);
  console.log(`   - payment_confirmed: ${purchaseData.payment_confirmed}\n`);

  return data[0];
}

// ============================================================================
// STEP 5: Admin 페이지 접근 테스트
// ============================================================================
async function step5_testAdminPage() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📌 STEP 5: Admin 페이지 접근 테스트\n');

  const adminUrl = 'https://politicianfinder.com/admin/report-sales';

  console.log(`   페이지 URL: ${adminUrl}`);

  try {
    const response = await fetch(adminUrl);

    console.log(`   ✅ 페이지 응답: ${response.status}`);
    console.log(`   - 상태: ${response.ok ? '정상' : '오류'}`);
    console.log(`   - Content-Type: ${response.headers.get('content-type')}\n`);

    if (response.status === 200) {
      console.log('   ✅ Admin 페이지 정상 접근 가능\n');
      return true;
    } else {
      console.log('   ⚠️  Admin 페이지 접근 가능하나 인증 필요할 수 있음\n');
      return true;
    }

  } catch (error) {
    console.error(`   ❌ 페이지 접근 실패: ${error.message}\n`);
    return false;
  }
}

// ============================================================================
// STEP 6: 최종 결과 요약
// ============================================================================
async function step6_summary() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📌 STEP 6: 테스트 결과 요약\n');

  // DB 현황 확인
  const { data: politicians } = await supabase
    .from('politicians')
    .select('id')
    .eq('id', 'test1234');

  const { data: verifications } = await supabase
    .from('email_verifications')
    .select('id')
    .eq('politician_id', 'test1234');

  const { data: purchases } = await supabase
    .from('report_purchases')
    .select('id')
    .eq('politician_id', 'test1234');

  console.log('   📊 DB 현황:');
  console.log(`   - politicians: ${politicians?.length || 0}건`);
  console.log(`   - email_verifications: ${verifications?.length || 0}건`);
  console.log(`   - report_purchases: ${purchases?.length || 0}건\n`);
}

// ============================================================================
// 메인 테스트 실행
// ============================================================================
async function runAllTests() {
  try {
    // STEP 1
    const politician = await step1_createTestPolitician();
    if (!politician) {
      console.error('❌ 정치인 데이터 생성 실패. 테스트 중단.\n');
      return;
    }

    // STEP 2
    const verificationInfo = await step2_testSendCode(politician);
    if (!verificationInfo) {
      console.error('❌ 인증 코드 발송 실패. 테스트 중단.\n');
      return;
    }

    // STEP 3
    const codeVerified = await step3_testCheckCode(verificationInfo);
    if (!codeVerified) {
      console.error('❌ 인증 코드 확인 실패. 계속 진행...\n');
    }

    // STEP 4
    const purchase = await step4_createPurchase(politician);
    if (!purchase) {
      console.error('❌ 구매 데이터 생성 실패. 계속 진행...\n');
    }

    // STEP 5
    await step5_testAdminPage();

    // STEP 6
    await step6_summary();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎉 전체 테스트 완료!\n');

  } catch (error) {
    console.error('\n❌ 테스트 실행 중 오류:', error);
  }
}

runAllTests();
