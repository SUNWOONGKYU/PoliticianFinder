// 신분 수정 검증
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verifyStatusFix() {
  console.log('\n=== 신분 수정 검증 ===\n');

  const allIds = [
    // 서울
    '62e7b453', 'f9e00370', '1005', '1006', '17270f25',
    '7f1c3606', '7abadf92', '567e2c27', 'e3c75ad7', 'd0a5d6e1',
    // 경기
    '0756ec15', 'd8fe79e9', 'be4f6b92', '8dc6cea5', '266c6671',
    '643d6bec', '8639bbf9', 'af3a0f29', '023139c6', 'aa2cd708',
    // 부산
    '81fafa15', 'd756cb91', '60e55d2a', 'b99c4d6e', 'ab673715',
    'b6ec6ee4', '3ee57024', 'ea36290f', 'adaaadc3', '935ea93a'
  ];

  const { data } = await supabase
    .from('politicians')
    .select('id, name, status, position, title, region')
    .in('id', allIds)
    .order('region', { ascending: true });

  // 신분별 통계
  const statusCounts = {};
  data.forEach(p => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
  });

  console.log('📊 신분별 분포:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}명`);
  });

  // 현직 3명 확인
  console.log('\n✅ 현직 3명:');
  const incumbents = data.filter(p => p.status === '현직');
  incumbents.forEach(p => {
    console.log(`  - ${p.name} (${p.position}, ${p.region})`);
  });

  // 출마자 샘플 확인
  console.log('\n📝 출마자 샘플 (각 지역 2명씩):');
  const candidates = data.filter(p => p.status === '출마자');

  const seoul = candidates.filter(p => p.region === '서울').slice(0, 2);
  const gyeonggi = candidates.filter(p => p.region === '경기').slice(0, 2);
  const busan = candidates.filter(p => p.region === '부산').slice(0, 2);

  console.log('\n  서울:');
  seoul.forEach(p => console.log(`    - ${p.name} (${p.position || '직책없음'}, 출마직종: ${p.title})`));

  console.log('\n  경기:');
  gyeonggi.forEach(p => console.log(`    - ${p.name} (${p.position || '직책없음'}, 출마직종: ${p.title})`));

  console.log('\n  부산:');
  busan.forEach(p => console.log(`    - ${p.name} (${p.position || '직책없음'}, 출마직종: ${p.title})`));

  // "예비후보", "후보" 남아있는지 확인
  console.log('\n🔍 "예비후보"/"후보" 키워드 확인:');
  const withKeyword = data.filter(p =>
    p.position && (p.position.includes('예비후보') || p.position.includes('후보'))
  );

  if (withKeyword.length > 0) {
    console.log('  ⚠️ 아직 남아있는 경우:');
    withKeyword.forEach(p => {
      console.log(`    - ${p.name}: ${p.position}`);
    });
  } else {
    console.log('  ✅ 모두 제거됨');
  }

  console.log('\n=== 검증 완료 ===\n');
}

verifyStatusFix().catch(console.error);
