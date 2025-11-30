// 신분 정확히 수정 - 현직은 3명만 (광역단체장 재출마자)
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 현직 광역단체장 3명 (재출마)
const incumbents = [
  { id: '62e7b453', name: '오세훈', position: '서울특별시장' },
  { id: '0756ec15', name: '김동연', position: '경기도지사' },
  { id: 'd756cb91', name: '박형준', position: '부산시장' }
];

// 나머지 27명 모두 출마자 (국회의원 포함)
const candidates = [
  // 서울
  { id: 'f9e00370', name: '김민석', position: '국무총리' },
  { id: '1005', name: '나경원', position: '국회의원' },
  { id: '1006', name: '박주민', position: '국회의원' },
  { id: '17270f25', name: '정원오', position: '성동구청장' },
  { id: '7f1c3606', name: '전현희', position: '국회의원' },
  { id: '7abadf92', name: '한동훈', position: '전 당대표' },
  { id: '567e2c27', name: '이준석', position: '국회의원' },
  { id: 'e3c75ad7', name: '신동욱', position: '국회의원' },
  { id: 'd0a5d6e1', name: '조은희', position: '국회의원' },

  // 경기
  { id: 'd8fe79e9', name: '추미애', position: '국회의원' },
  { id: 'be4f6b92', name: '한준호', position: '국회의원' },
  { id: '8dc6cea5', name: '김병주', position: '국회의원' },
  { id: '266c6671', name: '염태영', position: '국회의원' },
  { id: '643d6bec', name: '유승민', position: '전 국회의원' },
  { id: '8639bbf9', name: '원유철', position: '국회의원' },
  { id: 'af3a0f29', name: '김선교', position: '국회의원' },
  { id: '023139c6', name: '송석준', position: '국회의원' },
  { id: 'aa2cd708', name: '김성원', position: '국회의원' },

  // 부산
  { id: '81fafa15', name: '전재수', position: '해양수산부 장관' },
  { id: '60e55d2a', name: '김도읍', position: '국회의원' },
  { id: 'b99c4d6e', name: '조경태', position: '국회의원' },
  { id: 'ab673715', name: '박수영', position: '국회의원' },
  { id: 'b6ec6ee4', name: '최인호', position: '국회의원' },
  { id: '3ee57024', name: '이재성', position: '더불어민주당 부산시당 위원장' },
  { id: 'ea36290f', name: '차정인', position: '국가교육위원회 위원장' },
  { id: 'adaaadc3', name: '홍순헌', position: '전 해운대구청장' },
  { id: '935ea93a', name: '이진복', position: '전 대통령실 정무수석' }
];

async function fixStatusCorrect() {
  console.log('\n=== 신분 정확히 수정 ===\n');

  let successCount = 0;
  let errorCount = 0;

  // 현직 3명
  console.log('📍 현직 광역단체장 (3명):\n');
  for (const person of incumbents) {
    try {
      const { data, error } = await supabase
        .from('politicians')
        .update({
          status: '현직',
          position: person.position
        })
        .eq('id', person.id)
        .select('id, name, status, position');

      if (error) {
        console.error(`  ❌ ${person.name}: ${error.message}`);
        errorCount++;
      } else if (data && data.length > 0) {
        console.log(`  ✅ ${person.name}: 현직 ${person.position}`);
        successCount++;
      }
    } catch (err) {
      console.error(`  ❌ ${person.name}: ${err.message}`);
      errorCount++;
    }
  }

  // 출마자 27명
  console.log('\n📍 출마자 (27명):\n');
  for (const person of candidates) {
    try {
      const { data, error } = await supabase
        .from('politicians')
        .update({
          status: '출마자',
          position: person.position
        })
        .eq('id', person.id)
        .select('id, name, status, position');

      if (error) {
        console.error(`  ❌ ${person.name}: ${error.message}`);
        errorCount++;
      } else if (data && data.length > 0) {
        console.log(`  ✅ ${person.name}: 출마자 (${person.position})`);
        successCount++;
      }
    } catch (err) {
      console.error(`  ❌ ${person.name}: ${err.message}`);
      errorCount++;
    }
  }

  console.log('\n=== 업데이트 완료 ===');
  console.log(`✅ 성공: ${successCount}명`);
  console.log(`❌ 실패: ${errorCount}명\n`);
}

fixStatusCorrect().catch(console.error);
