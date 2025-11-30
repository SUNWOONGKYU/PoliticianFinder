// 20명 정치인 실제 직책 업데이트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 실제 직책 정보 (최근 경력 기준)
const realPositions = {
  // 서울 (현직: 오세훈 제외)
  'f9e00370': { name: '김민석', position: '전 국무총리' },  // 김민석
  '1005': { name: '나경원', position: '전 국회의원' },     // 나경원
  '1006': { name: '박주민', position: '전 국회의원' },     // 박주민
  // '17270f25': 정원오 - 성동구청장 (이미 적절)
  '7f1c3606': { name: '전현희', position: '전 국회의원' },  // 전현희
  // '7abadf92': 한동훈 - 전 당대표 (이미 적절)
  '567e2c27': { name: '이준석', position: '전 국민의힘 당대표' },  // 이준석
  'e3c75ad7': { name: '신동욱', position: '전 국회의원' },  // 신동욱
  'd0a5d6e1': { name: '조은희', position: '전 양천구청장' },  // 조은희

  // 경기 (현직: 김동연 제외)
  'd8fe79e9': { name: '추미애', position: '전 국회의원' },  // 추미애
  'be4f6b92': { name: '한준호', position: '전 경기도 행정2부지사' },  // 한준호
  '8dc6cea5': { name: '김병주', position: '전 국회의원' },  // 김병주
  '266c6671': { name: '염태영', position: '전 수원시장' },  // 염태영
  '643d6bec': { name: '유승민', position: '전 국회의원' },  // 유승민
  '8639bbf9': { name: '원유철', position: '전 국회의원' },  // 원유철
  'af3a0f29': { name: '김선교', position: '전 국회의원' },  // 김선교
  '023139c6': { name: '송석준', position: '전 국회의원' },  // 송석준
  'aa2cd708': { name: '김성원', position: '전 국회의원' },  // 김성원

  // 부산 (현직: 박형준 제외)
  // '81fafa15': 전재수 - 해양수산부 장관 (이미 적절)
  '60e55d2a': { name: '김도읍', position: '전 국회의원' },  // 김도읍
  'b99c4d6e': { name: '조경태', position: '전 국회의원' },  // 조경태
  'ab673715': { name: '박수영', position: '전 국회의원' },  // 박수영
  // 'b6ec6ee4': 최인호 - 전 국회의원 (이미 적절)
  '3ee57024': { name: '이재성', position: '국민의힘 사하을 지역위원장' },  // 이재성
  // 'ea36290f': 차정인 - 전 부산대학교 총장 (이미 적절)
  // 'adaaadc3': 홍순헌 - 전 해운대구청장 (이미 적절)
  // '935ea93a': 이진복 - 전 대통령실 정무수석 (이미 적절)
};

async function updateRealPositions() {
  console.log('\n=== 실제 직책 업데이트 시작 ===\n');

  let successCount = 0;
  let errorCount = 0;

  for (const [id, info] of Object.entries(realPositions)) {
    try {
      const { data, error } = await supabase
        .from('politicians')
        .update({
          position: info.position
        })
        .eq('id', id)
        .select('id, name, position');

      if (error) {
        console.error(`  ❌ ${info.name}: ${error.message}`);
        errorCount++;
      } else if (data && data.length > 0) {
        console.log(`  ✅ ${info.name}: ${info.position}`);
        successCount++;
      }
    } catch (err) {
      console.error(`  ❌ ${info.name}: ${err.message}`);
      errorCount++;
    }
  }

  console.log('\n=== 업데이트 완료 ===');
  console.log(`✅ 성공: ${successCount}명`);
  console.log(`❌ 실패: ${errorCount}명\n`);
}

updateRealPositions().catch(console.error);
