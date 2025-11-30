// 30명 정치인 출마직종/출마지역/출마지구 업데이트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 30명 정치인 ID 및 지역 정보
const politicians = {
  // 서울특별시 (10명) - 광역단체장 후보
  seoul: [
    '62e7b453',  // 오세훈
    'f9e00370',  // 김민석
    '1005',      // 나경원
    '1006',      // 박주민
    '17270f25',  // 정원오
    '7f1c3606',  // 전현희
    '7abadf92',  // 한동훈
    '567e2c27',  // 이준석
    'e3c75ad7',  // 신동욱
    'd0a5d6e1',  // 조은희
  ],

  // 경기도 (10명) - 광역단체장 후보
  gyeonggi: [
    '0756ec15',  // 김동연
    'd8fe79e9',  // 추미애
    'be4f6b92',  // 한준호
    '8dc6cea5',  // 김병주
    '266c6671',  // 염태영
    '643d6bec',  // 유승민
    '8639bbf9',  // 원유철
    'af3a0f29',  // 김선교
    '023139c6',  // 송석준
    'aa2cd708',  // 김성원
  ],

  // 부산광역시 (10명) - 광역단체장 후보
  busan: [
    '81fafa15',  // 전재수
    'd756cb91',  // 박형준
    '60e55d2a',  // 김도읍
    'b99c4d6e',  // 조경태
    'ab673715',  // 박수영
    'b6ec6ee4',  // 최인호
    '3ee57024',  // 이재성
    'ea36290f',  // 차정인
    'adaaadc3',  // 홍순헌
    '935ea93a',  // 이진복
  ]
};

async function updatePoliticians() {
  console.log('\n=== 30명 정치인 출마정보 업데이트 시작 ===\n');

  let successCount = 0;
  let errorCount = 0;

  // 서울특별시
  console.log('📍 서울특별시 (10명) 업데이트 중...');
  for (const id of politicians.seoul) {
    try {
      const { data, error } = await supabase
        .from('politicians')
        .update({
          title: '광역단체장',      // 출마직종 (DB의 title 컬럼)
          region: '서울',           // 출마지역
          district: null            // 출마지구 (광역단체장은 없음)
        })
        .eq('id', id)
        .select('id, name');

      if (error) {
        console.error(`  ❌ ${id}: ${error.message}`);
        errorCount++;
      } else if (data && data.length > 0) {
        console.log(`  ✅ ${data[0].name} (${id})`);
        successCount++;
      } else {
        console.log(`  ⚠️ ${id}: 정치인을 찾을 수 없음`);
        errorCount++;
      }
    } catch (err) {
      console.error(`  ❌ ${id}: ${err.message}`);
      errorCount++;
    }
  }

  // 경기도
  console.log('\n📍 경기도 (10명) 업데이트 중...');
  for (const id of politicians.gyeonggi) {
    try {
      const { data, error } = await supabase
        .from('politicians')
        .update({
          title: '광역단체장',      // 출마직종 (DB의 title 컬럼)
          region: '경기',           // 출마지역
          district: null            // 출마지구 (광역단체장은 없음)
        })
        .eq('id', id)
        .select('id, name');

      if (error) {
        console.error(`  ❌ ${id}: ${error.message}`);
        errorCount++;
      } else if (data && data.length > 0) {
        console.log(`  ✅ ${data[0].name} (${id})`);
        successCount++;
      } else {
        console.log(`  ⚠️ ${id}: 정치인을 찾을 수 없음`);
        errorCount++;
      }
    } catch (err) {
      console.error(`  ❌ ${id}: ${err.message}`);
      errorCount++;
    }
  }

  // 부산광역시
  console.log('\n📍 부산광역시 (10명) 업데이트 중...');
  for (const id of politicians.busan) {
    try {
      const { data, error } = await supabase
        .from('politicians')
        .update({
          title: '광역단체장',      // 출마직종 (DB의 title 컬럼)
          region: '부산',           // 출마지역
          district: null            // 출마지구 (광역단체장은 없음)
        })
        .eq('id', id)
        .select('id, name');

      if (error) {
        console.error(`  ❌ ${id}: ${error.message}`);
        errorCount++;
      } else if (data && data.length > 0) {
        console.log(`  ✅ ${data[0].name} (${id})`);
        successCount++;
      } else {
        console.log(`  ⚠️ ${id}: 정치인을 찾을 수 없음`);
        errorCount++;
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

updatePoliticians().catch(console.error);
