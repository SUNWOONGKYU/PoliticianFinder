// 최신 Vercel 배포 URL 테스트
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ooddlafwdpzgxfefgsrx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const LATEST_DEPLOYMENT_URL = 'https://politician-finder-frz95t4ad-finder-world.vercel.app';
const TEST_EMAIL = 'wksun999@hanmail.net';
const POLITICIAN_ID = '62e7b453';

console.log('🚀 최신 Vercel 배포 테스트\\n');
console.log(`배포 URL: ${LATEST_DEPLOYMENT_URL}`);
console.log(`테스트 이메일: ${TEST_EMAIL}\\n`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n');

async function testLatestDeployment() {
  try {
    // 1. 정치인 데이터 준비
    console.log('📌 STEP 1: 정치인 데이터 준비\\n');

    const politicianData = {
      id: POLITICIAN_ID,
      name: '오세훈',
      party: '국민의힘',
      position: '서울특별시장',
      email: TEST_EMAIL
    };

    const { data: politician, error } = await supabase
      .from('politicians')
      .upsert([politicianData], { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error(`   ❌ 실패: ${error.message}\\n`);
      return;
    }

    console.log(`   ✅ 정치인: ${politician.name} (${politician.party})\\n`);

    // 2. send-code API 테스트
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n');
    console.log('📌 STEP 2: send-code API 테스트\\n');

    const sendUrl = `${LATEST_DEPLOYMENT_URL}/api/politicians/verify/send-code`;
    console.log(`   API: POST ${sendUrl}\\n`);

    const sendResponse = await fetch(sendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: politician.name,
        party: politician.party,
        position: politician.position
      })
    });

    console.log(`   HTTP Status: ${sendResponse.status}`);

    const sendText = await sendResponse.text();

    if (!sendResponse.ok) {
      console.log(`   ❌ API 실패\\n`);
      console.log(`   응답: ${sendText}\\n`);
      return;
    }

    const sendResult = JSON.parse(sendText);
    console.log('   ✅ API 성공!\\n');
    console.log(`   응답: ${JSON.stringify(sendResult, null, 2)}\\n`);

    // 3. DB에서 인증 코드 확인
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n');
    console.log('📌 STEP 3: DB 인증 코드 확인\\n');

    const { data: verification } = await supabase
      .from('email_verifications')
      .select('*')
      .eq('id', sendResult.verification_id)
      .single();

    if (verification) {
      console.log(`   ✅ 인증 코드: ${verification.verification_code}`);
      console.log(`   ✅ 만료 시간: ${verification.expires_at}\\n`);

      console.log(`   📧 이메일 발송됨: ${TEST_EMAIL}\\n`);

      // 4. check-code API 테스트
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n');
      console.log('📌 STEP 4: check-code API 테스트\\n');

      const checkUrl = `${LATEST_DEPLOYMENT_URL}/api/politicians/verify/check-code`;
      console.log(`   API: POST ${checkUrl}\\n`);

      const checkResponse = await fetch(checkUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verification_id: sendResult.verification_id,
          code: verification.verification_code
        })
      });

      console.log(`   HTTP Status: ${checkResponse.status}`);

      const checkText = await checkResponse.text();

      if (!checkResponse.ok) {
        console.log(`   ❌ API 실패\\n`);
        console.log(`   응답: ${checkText}\\n`);
        return;
      }

      const checkResult = JSON.parse(checkText);
      console.log('   ✅ API 성공!\\n');
      console.log(`   응답: ${JSON.stringify(checkResult, null, 2)}\\n`);

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n');
      console.log('🎉 최신 배포 테스트 성공!\\n');
      console.log('✅ send-code API: 정상 작동');
      console.log('✅ check-code API: 정상 작동');
      console.log('✅ 이메일 발송: 완료');
      console.log('✅ 인증 처리: 완료\\n');
    }

  } catch (error) {
    console.error('\\n❌ 테스트 오류:', error.message);
  }
}

testLatestDeployment();
