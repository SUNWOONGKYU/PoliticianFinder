// 30명 정치인 신분 및 직책 수정
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fixPoliticiansStatus() {
  console.log('\n=== 30명 정치인 신분 및 직책 수정 ===\n');

  let successCount = 0;
  let errorCount = 0;

  // 현직 3명 (오세훈, 김동연, 박형준)
  console.log('📌 현직 3명 업데이트 중...');

  const incumbents = [
    { id: '62e7b453', name: '오세훈', position: '서울특별시장' },
    { id: '0756ec15', name: '김동연', position: '경기도지사' },
    { id: 'd756cb91', name: '박형준', position: '부산시장' }
  ];

  for (const politician of incumbents) {
    try {
      const { data, error } = await supabase
        .from('politicians')
        .update({
          status: '현직',
          position: politician.position  // 직책 명확화
        })
        .eq('id', politician.id)
        .select('id, name');

      if (error) {
        console.error(`  ❌ ${politician.name}: ${error.message}`);
        errorCount++;
      } else if (data && data.length > 0) {
        console.log(`  ✅ ${politician.name} - 현직 ${politician.position}`);
        successCount++;
      }
    } catch (err) {
      console.error(`  ❌ ${politician.name}: ${err.message}`);
      errorCount++;
    }
  }

  // 나머지 27명 - 출마자로 설정하고 직책에서 "예비후보", "후보" 등 제거
  console.log('\n📌 출마자 27명 업데이트 중...');

  const candidates = [
    // 서울 (7명 - 오세훈 제외)
    'f9e00370',  // 김민석
    '1005',      // 나경원
    '1006',      // 박주민
    '17270f25',  // 정원오
    '7f1c3606',  // 전현희
    '7abadf92',  // 한동훈
    '567e2c27',  // 이준석
    'e3c75ad7',  // 신동욱
    'd0a5d6e1',  // 조은희

    // 경기 (9명 - 김동연 제외)
    'd8fe79e9',  // 추미애
    'be4f6b92',  // 한준호
    '8dc6cea5',  // 김병주
    '266c6671',  // 염태영
    '643d6bec',  // 유승민
    '8639bbf9',  // 원유철
    'af3a0f29',  // 김선교
    '023139c6',  // 송석준
    'aa2cd708',  // 김성원

    // 부산 (9명 - 박형준 제외)
    '81fafa15',  // 전재수
    '60e55d2a',  // 김도읍
    'b99c4d6e',  // 조경태
    'ab673715',  // 박수영
    'b6ec6ee4',  // 최인호
    '3ee57024',  // 이재성
    'ea36290f',  // 차정인
    'adaaadc3',  // 홍순헌
    '935ea93a',  // 이진복
  ];

  for (const id of candidates) {
    try {
      // 먼저 현재 데이터 조회
      const { data: current } = await supabase
        .from('politicians')
        .select('id, name, position')
        .eq('id', id)
        .single();

      if (!current) {
        console.log(`  ⚠️ ${id}: 정치인을 찾을 수 없음`);
        errorCount++;
        continue;
      }

      // position에서 "예비후보", "후보", "지역위원장" 등 제거
      let cleanPosition = current.position || '';

      // "경기도지사 예비후보" → "경기도지사"
      // "경기도지사 후보" → "경기도지사"
      // "사하을 지역위원장" → "사하을 지역위원장" (그대로 유지 - 이전 직책)
      cleanPosition = cleanPosition
        .replace(/\s*예비후보$/, '')
        .replace(/\s*후보$/, '')
        .trim();

      // "전 XXX" 형태는 그대로 유지
      // 빈 문자열이면 null로 설정
      if (cleanPosition === '') {
        cleanPosition = null;
      }

      const { data, error } = await supabase
        .from('politicians')
        .update({
          status: '출마자',
          position: cleanPosition
        })
        .eq('id', id)
        .select('id, name, position');

      if (error) {
        console.error(`  ❌ ${current.name}: ${error.message}`);
        errorCount++;
      } else if (data && data.length > 0) {
        console.log(`  ✅ ${data[0].name} - 출마자 (직책: ${data[0].position || '없음'})`);
        successCount++;
      }
    } catch (err) {
      console.error(`  ❌ ${id}: ${err.message}`);
      errorCount++;
    }
  }

  console.log('\n=== 업데이트 완료 ===');
  console.log(`✅ 성공: ${successCount}명`);
  console.log(`❌ 실패: ${errorCount}명`);
  console.log(`📊 전체: ${successCount + errorCount}명\n`);
}

fixPoliticiansStatus().catch(console.error);
