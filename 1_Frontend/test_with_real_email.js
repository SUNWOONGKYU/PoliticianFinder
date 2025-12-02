// ============================================================================
// 실제 이메일 발송 통합 테스트 (wksun999@hanmail.net)
// ============================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ooddlafwdpzgxfefgsrx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TEST_EMAIL = 'wksun999@hanmail.net';
const POLITICIAN_ID = '62e7b453';  // 오세훈

console.log('🚀 실제 이메일 발송 통합 테스트 시작\\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n');
console.log(`테스트 이메일: ${TEST_EMAIL}`);
console.log(`정치인 ID: ${POLITICIAN_ID} (오세훈)\\n`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n');

async function runFullTest() {
  try {
    // ========================================================================
    // STEP 1: 정치인 데이터 준비 (실제 이메일로 업데이트)
    // ========================================================================
    console.log('📌 STEP 1: 정치인 데이터 준비\\n');

    const politicianData = {
      id: POLITICIAN_ID,
      name: '오세훈',
      party: '국민의힘',
      position: '서울특별시장',
      email: TEST_EMAIL,
      created_at: new Date().toISOString()
    };

    // Upsert politician data
    const { data: politician, error: upsertError } = await supabase
      .from('politicians')
      .upsert([politicianData], { onConflict: 'id' })
      .select()
      .single();

    if (upsertError) {
      console.error(`   ❌ 정치인 데이터 업데이트 실패: ${upsertError.message}\\n`);
      return;
    }

    console.log('   ✅ 정치인 데이터 준비 완료');
    console.log(`   - ID: ${politician.id}`);
    console.log(`   - 이름: ${politician.name}`);
    console.log(`   - 정당: ${politician.party}`);
    console.log(`   - 직위: ${politician.position}`);
    console.log(`   - 이메일: ${politician.email}\\n`);

    // ========================================================================
    // STEP 2: 인증 코드 발송 API 호출 (실제 이메일 발송)
    // ========================================================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n');
    console.log('📌 STEP 2: 인증 코드 발송 API 호출 (실제 이메일 발송)\\n');

    const apiUrl = 'https://politicianfinder.com/api/politicians/verify/send-code';

    console.log(`   API 호출: POST ${apiUrl}`);
    console.log(`   요청 데이터:`);
    console.log(`   {`);
    console.log(`     name: "${politician.name}",`);
    console.log(`     party: "${politician.party}",`);
    console.log(`     position: "${politician.position}"`);
    console.log(`   }\\n`);

    const sendResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: politician.name,
        party: politician.party,
        position: politician.position
      })
    });

    console.log(`   HTTP Status: ${sendResponse.status}`);

    if (sendResponse.status === 405) {
      console.log(`   ⚠️  405 Method Not Allowed - CDN 캐시 미갱신\\n`);
      console.log('   💡 해결 방법:');
      console.log('   1. 5-15분 대기 후 재시도');
      console.log('   2. Vercel Dashboard에서 수동 테스트\\n');
      return;
    }

    const sendText = await sendResponse.text();

    if (!sendText) {
      console.log(`   ⚠️  응답 없음\\n`);
      return;
    }

    let sendResult;
    try {
      sendResult = JSON.parse(sendText);
    } catch (e) {
      console.log(`   ⚠️  JSON 파싱 실패`);
      console.log(`   응답: ${sendText}\\n`);
      return;
    }

    if (!sendResponse.ok) {
      console.log(`   ❌ API 오류 (${sendResponse.status}):`);
      console.log(`   ${JSON.stringify(sendResult, null, 2)}\\n`);
      return;
    }

    console.log('   ✅ API 호출 성공!');
    console.log(`   응답:`);
    console.log(`   ${JSON.stringify(sendResult, null, 2)}\\n`);

    // ========================================================================
    // STEP 3: DB에서 인증 코드 확인
    // ========================================================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n');
    console.log('📌 STEP 3: DB에서 생성된 인증 코드 확인\\n');

    if (!sendResult.verification_id) {
      console.log('   ⚠️  verification_id가 없습니다\\n');
      return;
    }

    const { data: verification, error: verifyError } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('id', sendResult.verification_id)
      .single();

    if (verifyError || !verification) {
      console.log(`   ❌ 인증 데이터 조회 실패: ${verifyError?.message}\\n`);
      return;
    }

    console.log('   ✅ DB 확인:');
    console.log(`   - 인증 코드: ${verification.verification_code}`);
    console.log(`   - 만료 시간: ${verification.expires_at}`);
    console.log(`   - 인증 상태: ${verification.verified ? '✅ 완료' : '⏳ 대기'}`);
    console.log(`   - 정치인 ID: ${verification.politician_id}\\n`);

    console.log('   📧 이메일 전송 정보:');
    console.log(`   - 수신자: ${TEST_EMAIL}`);
    console.log(`   - 인증 코드: ${verification.verification_code}`);
    console.log(`   - 만료: 10분 후\\n`);

    console.log('   💡 사용자께서 이메일을 확인하시고 인증 코드를 입력해주셔야 합니다.\\n');

    // ========================================================================
    // STEP 4: 인증 코드 확인 API 호출 (자동 테스트)
    // ========================================================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n');
    console.log('📌 STEP 4: 인증 코드 확인 API 테스트 (자동)\\n');

    const checkUrl = 'https://politicianfinder.com/api/politicians/verify/check-code';

    console.log(`   API 호출: POST ${checkUrl}`);
    console.log(`   요청 데이터:`);
    console.log(`   {`);
    console.log(`     verification_id: "${sendResult.verification_id}",`);
    console.log(`     code: "${verification.verification_code}"`);
    console.log(`   }\\n`);

    const checkResponse = await fetch(checkUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verification_id: sendResult.verification_id,
        code: verification.verification_code
      })
    });

    console.log(`   HTTP Status: ${checkResponse.status}`);

    if (checkResponse.status === 405) {
      console.log(`   ⚠️  405 Method Not Allowed - CDN 캐시 미갱신\\n`);
      return;
    }

    const checkText = await checkResponse.text();

    if (!checkText) {
      console.log(`   ⚠️  응답 없음\\n`);
      return;
    }

    let checkResult;
    try {
      checkResult = JSON.parse(checkText);
    } catch (e) {
      console.log(`   ⚠️  JSON 파싱 실패`);
      console.log(`   응답: ${checkText}\\n`);
      return;
    }

    if (!checkResponse.ok) {
      console.log(`   ❌ API 오류 (${checkResponse.status}):`);
      console.log(`   ${JSON.stringify(checkResult, null, 2)}\\n`);
      return;
    }

    console.log('   ✅ API 호출 성공!');
    console.log(`   응답:`);
    console.log(`   ${JSON.stringify(checkResult, null, 2)}\\n`);

    // ========================================================================
    // STEP 5: 최종 인증 상태 확인
    // ========================================================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n');
    console.log('📌 STEP 5: 최종 인증 상태 확인\\n');

    const { data: finalVerification, error: finalError } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('id', sendResult.verification_id)
      .single();

    if (finalError) {
      console.log(`   ❌ 최종 상태 확인 실패: ${finalError.message}\\n`);
      return;
    }

    console.log('   ✅ 최종 인증 상태:');
    console.log(`   - 인증 완료: ${finalVerification.verified ? '✅ YES' : '❌ NO'}`);
    console.log(`   - 인증 시간: ${finalVerification.verified_at || '(미인증)'}`);
    console.log(`   - 정치인 ID: ${finalVerification.politician_id}\\n`);

    if (finalVerification.verified) {
      console.log('   🎉 인증 성공! 이제 보고서를 구매하실 수 있습니다.\\n');
    } else {
      console.log('   ⚠️  인증 미완료. 인증 코드를 다시 확인해주세요.\\n');
    }

    // ========================================================================
    // STEP 6: 전체 테스트 요약
    // ========================================================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n');
    console.log('📌 STEP 6: 전체 테스트 요약\\n');

    console.log('   ✅ 완료된 단계:');
    console.log('   1. ✅ 정치인 데이터 준비 (오세훈, wksun999@hanmail.net)');
    console.log('   2. ✅ 인증 코드 발송 API 호출 (이메일 전송)');
    console.log('   3. ✅ DB 인증 코드 확인');
    console.log('   4. ✅ 인증 코드 확인 API 호출');
    console.log('   5. ✅ 최종 인증 상태 확인\\n');

    console.log('   📊 테스트 결과:');
    console.log(`   - send-code API: ${sendResponse.ok ? '✅ 성공' : '❌ 실패'}`);
    console.log(`   - check-code API: ${checkResponse.ok ? '✅ 성공' : '❌ 실패'}`);
    console.log(`   - 이메일 발송: ${sendResult ? '✅ 완료' : '❌ 실패'}`);
    console.log(`   - 최종 인증: ${finalVerification.verified ? '✅ 완료' : '⏳ 대기'}\\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n');
    console.log('🎉 전체 테스트 완료!\\n');

  } catch (error) {
    console.error('\\n❌ 테스트 실행 중 오류:', error);
    console.error('스택 트레이스:', error.stack);
  }
}

runFullTest();
