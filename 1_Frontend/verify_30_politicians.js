// 30명 정치인 데이터 검증
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verifyPoliticians() {
  console.log('\n=== 30명 정치인 데이터 검증 ===\n');

  // 샘플로 각 지역에서 2명씩 확인
  const sampleIds = [
    '62e7b453',  // 오세훈 (서울)
    'f9e00370',  // 김민석 (서울)
    '0756ec15',  // 김동연 (경기)
    'd8fe79e9',  // 추미애 (경기)
    '81fafa15',  // 전재수 (부산)
    'd756cb91',  // 박형준 (부산)
  ];

  for (const id of sampleIds) {
    const { data, error } = await supabase
      .from('politicians')
      .select('id, name, position, title, region, district')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`❌ ${id}: ${error.message}`);
    } else if (data) {
      console.log(`\n${data.name} (${data.id}):`);
      console.log(`  직책 (position): ${data.position || '없음'}`);
      console.log(`  출마직종 (title): ${data.title || '없음'}`);
      console.log(`  출마지역 (region): ${data.region || '없음'}`);
      console.log(`  출마지구 (district): ${data.district || '없음'}`);
    }
  }

  // 전체 30명 통계
  console.log('\n\n=== 전체 통계 ===');

  const { data: allData } = await supabase
    .from('politicians')
    .select('title, region')
    .in('id', [
      // 서울
      '62e7b453', 'f9e00370', '1005', '1006', '17270f25',
      '7f1c3606', '7abadf92', '567e2c27', 'e3c75ad7', 'd0a5d6e1',
      // 경기
      '0756ec15', 'd8fe79e9', 'be4f6b92', '8dc6cea5', '266c6671',
      '643d6bec', '8639bbf9', 'af3a0f29', '023139c6', 'aa2cd708',
      // 부산
      '81fafa15', 'd756cb91', '60e55d2a', 'b99c4d6e', 'ab673715',
      'b6ec6ee4', '3ee57024', 'ea36290f', 'adaaadc3', '935ea93a'
    ]);

  const seoul = allData.filter(p => p.region === '서울').length;
  const gyeonggi = allData.filter(p => p.region === '경기').length;
  const busan = allData.filter(p => p.region === '부산').length;
  const metropolitan = allData.filter(p => p.title === '광역단체장').length;

  console.log(`\n📊 출마지역별 분포:`);
  console.log(`  서울: ${seoul}명`);
  console.log(`  경기: ${gyeonggi}명`);
  console.log(`  부산: ${busan}명`);
  console.log(`\n📊 출마직종:`);
  console.log(`  광역단체장: ${metropolitan}명`);

  console.log('\n=== 검증 완료 ===\n');
}

verifyPoliticians().catch(console.error);
