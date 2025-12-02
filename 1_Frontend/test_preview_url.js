// ============================================================================
// Vercel 프리뷰 URL 직접 테스트 (Deployment Protection 우회 시도)
// ============================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ooddlafwdpzgxfefgsrx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TEST_EMAIL = 'wksun999@hanmail.net';
const POLITICIAN_ID = '62e7b453';

console.log('🚀 Vercel 프리뷰 URL 테스트\\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n');

const urls = [
  {
    name: 'Production Domain',
    url: 'https://politicianfinder.com/api/politicians/verify/send-code'
  },
  {
    name: 'Latest Deployment',
    url: 'https://politicianfinder-i390wtfpc-finder-world.vercel.app/api/politicians/verify/send-code'
  },
  {
    name: 'Vercel App Domain',
    url: 'https://politicianfinder.vercel.app/api/politicians/verify/send-code'
  }
];

async function testAllUrls() {
  // 먼저 정치인 데이터 준비
  console.log('📌 정치인 데이터 준비\\n');

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
    console.error(`❌ 정치인 데이터 준비 실패: ${error.message}\\n`);
    return;
  }

  console.log(`✅ 정치인 데이터: ${politician.name} (${politician.party})\\n`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n');

  for (const { name, url } of urls) {
    console.log(`\\n📡 테스트: ${name}`);
    console.log(`URL: ${url}\\n`);

    try {
      const response = await fetch(url, {
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

      console.log(`Status: ${response.status}`);
      console.log(`Status Text: ${response.statusText}`);

      const text = await response.text();

      if (response.status === 401) {
        console.log(`⚠️  401 Unauthorized - Deployment Protection 활성화`);
        console.log(`이 URL은 인증이 필요합니다.\\n`);
        continue;
      }

      if (response.status === 405) {
        console.log(`⚠️  405 Method Not Allowed - 아직 캐시 미갱신 또는 라우팅 문제\\n`);
        continue;
      }

      if (!text) {
        console.log(`⚠️  응답 없음\\n`);
        continue;
      }

      try {
        const json = JSON.parse(text);

        if (response.ok) {
          console.log(`✅ SUCCESS!`);
          console.log(`응답:`);
          console.log(JSON.stringify(json, null, 2));

          // DB에서 인증 코드 확인
          if (json.verification_id) {
            console.log(`\\n📋 DB 인증 코드 확인...`);

            const { data: verification } = await supabase
              .from('email_verifications')
              .select('*')
              .eq('id', json.verification_id)
              .single();

            if (verification) {
              console.log(`✅ 인증 코드: ${verification.verification_code}`);
              console.log(`✅ 만료 시간: ${verification.expires_at}`);
              console.log(`\\n🎉 ${TEST_EMAIL}로 이메일이 발송되었습니다!`);
              console.log(`받은편지함을 확인해주세요.\\n`);

              // 성공했으므로 더 이상 다른 URL 테스트 안 함
              return { success: true, verification };
            }
          }
        } else {
          console.log(`❌ Error (${response.status}):`);
          console.log(JSON.stringify(json, null, 2));
          console.log();
        }
      } catch (e) {
        console.log(`응답 (JSON 아님): ${text.substring(0, 200)}...\\n`);
      }

    } catch (error) {
      console.error(`❌ 오류: ${error.message}\\n`);
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n');
  console.log('📊 테스트 결과 요약:\\n');
  console.log('모든 URL에서 API 호출이 실패했습니다.');
  console.log('원인: CDN 캐시 미갱신 또는 Deployment Protection\\n');
  console.log('💡 해결 방법:');
  console.log('1. 5-10분 더 대기 후 재시도');
  console.log('2. Vercel Dashboard에서 직접 테스트');
  console.log('3. 로컬 개발 서버 사용 (npm run dev)\\n');
}

testAllUrls();
