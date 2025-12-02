import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ooddlafwdpzgxfefgsrx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 실제 정치인 데이터로 테스트 시작\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function testWithRealPolitician() {
  // Step 1: DB에서 실제 정치인 찾기
  console.log('📌 STEP 1: DB에서 정치인 데이터 조회\n');

  const politicianId = '62e7b453'; // 오세훈

  let { data: politician, error } = await supabase
    .from('politicians')
    .select('*')
    .eq('id', politicianId)
    .single();

  if (error || !politician) {
    console.log(`   ❌ 정치인을 찾을 수 없습니다: ${error?.message}\n`);
    console.log('   💡 테스트용 정치인 데이터를 생성합니다...\n');

    // 테스트용 데이터 생성
    const testPolitician = {
      id: politicianId,
      name: '오세훈',
      party: '국민의힘',
      position: '서울특별시장',
      email: 'test@politicianfinder.com',
      created_at: new Date().toISOString()
    };

    const { data: created, error: createError } = await supabase
      .from('politicians')
      .upsert([testPolitician])
      .select()
      .single();

    if (createError) {
      console.error(`   ❌ 생성 실패: ${createError.message}\n`);
      return;
    }

    console.log('   ✅ 테스트용 정치인 데이터 생성 완료\n');
    politician = created;
  }

  console.log('   ✅ 정치인 정보:');
  console.log(`   - ID: ${politician.id}`);
  console.log(`   - 이름: ${politician.name}`);
  console.log(`   - 정당: ${politician.party}`);
  console.log(`   - 직위: ${politician.position}`);
  console.log(`   - 이메일: ${politician.email || '(없음)'}\n`);

  // Step 2: Production API 테스트 (send-code)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📌 STEP 2: 이메일 인증 코드 발송 API 테스트\n');

  const apiUrl = 'https://politicianfinder.com/api/politicians/verify/send-code';

  console.log(`   API 호출: POST ${apiUrl}`);
  console.log(`   요청 데이터:`);
  console.log(`   {`);
  console.log(`     name: "${politician.name}",`);
  console.log(`     party: "${politician.party}",`);
  console.log(`     position: "${politician.position}"`);
  console.log(`   }\n`);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: politician.name,
        party: politician.party,
        position: politician.position
      })
    });

    console.log(`   HTTP Status: ${response.status}`);

    if (response.status === 405) {
      console.log(`   ⚠️  405 Method Not Allowed - CDN 캐시 미갱신\n`);
      console.log('   💡 해결 방법:');
      console.log('   1. 5-15분 대기 후 재시도');
      console.log('   2. Vercel Dashboard에서 수동 테스트\n');
      return;
    }

    const text = await response.text();

    if (!text) {
      console.log(`   ⚠️  응답 없음\n`);
      return;
    }

    try {
      const result = JSON.parse(text);

      if (!response.ok) {
        console.log(`   ❌ API 오류 (${response.status}):`);
        console.log(`   ${JSON.stringify(result, null, 2)}\n`);
        return;
      }

      console.log('   ✅ API 호출 성공!');
      console.log(`   응답:`);
      console.log(`   ${JSON.stringify(result, null, 2)}\n`);

      // Step 3: DB에서 생성된 인증 코드 확인
      if (result.verification_id) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('📌 STEP 3: 생성된 인증 코드 확인\n');

        const { data: verification } = await supabase
          .from('email_verifications')
          .select('*')
          .eq('id', result.verification_id)
          .single();

        if (verification) {
          console.log('   ✅ DB 확인:');
          console.log(`   - 인증 코드: ${verification.verification_code}`);
          console.log(`   - 만료 시간: ${verification.expires_at}`);
          console.log(`   - 인증 상태: ${verification.verified ? '✅ 완료' : '⏳ 대기'}\n`);

          // Step 4: check-code API 테스트
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          console.log('📌 STEP 4: 인증 코드 확인 API 테스트\n');

          const checkUrl = 'https://politicianfinder.com/api/politicians/verify/check-code';
          console.log(`   API 호출: POST ${checkUrl}`);
          console.log(`   요청: verification_id + code\n`);

          const checkResponse = await fetch(checkUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              verification_id: result.verification_id,
              code: verification.verification_code
            })
          });

          console.log(`   HTTP Status: ${checkResponse.status}`);

          if (checkResponse.status === 405) {
            console.log(`   ⚠️  405 Method Not Allowed - CDN 캐시 미갱신\n`);
            return;
          }

          const checkText = await checkResponse.text();

          if (checkText) {
            try {
              const checkResult = JSON.parse(checkText);
              console.log('   ✅ 응답:');
              console.log(`   ${JSON.stringify(checkResult, null, 2)}\n`);
            } catch (e) {
              console.log(`   응답: ${checkText}\n`);
            }
          }
        }
      }

    } catch (e) {
      console.log(`   ⚠️  JSON 파싱 실패`);
      console.log(`   응답: ${text}\n`);
    }

  } catch (error) {
    console.error(`   ❌ 오류: ${error.message}\n`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('🎉 테스트 완료!\n');
}

testWithRealPolitician();
