// 30명 최종 검증
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function finalVerify() {
  const allIds = [
    '62e7b453', 'f9e00370', '1005', '1006', '17270f25',
    '7f1c3606', '7abadf92', '567e2c27', 'e3c75ad7', 'd0a5d6e1',
    '0756ec15', 'd8fe79e9', 'be4f6b92', '8dc6cea5', '266c6671',
    '643d6bec', '8639bbf9', 'af3a0f29', '023139c6', 'aa2cd708',
    '81fafa15', 'd756cb91', '60e55d2a', 'b99c4d6e', 'ab673715',
    'b6ec6ee4', '3ee57024', 'ea36290f', 'adaaadc3', '935ea93a'
  ];

  const { data } = await supabase
    .from('politicians')
    .select('id, name, status, position, title, region, district')
    .in('id', allIds)
    .order('region', { ascending: true })
    .order('name', { ascending: true });

  console.log('\n=== 30명 정치인 최종 데이터 ===\n');

  let currentRegion = '';
  data.forEach(p => {
    if (p.region !== currentRegion) {
      currentRegion = p.region;
      console.log(`\n📍 ${currentRegion}\n`);
    }

    console.log(`${p.name}:`);
    console.log(`  신분: ${p.status}`);
    console.log(`  직책: ${p.position || '없음'}`);
    console.log(`  출마직종: ${p.title}`);
    console.log(`  출마지역: ${p.region}`);
    console.log(`  출마지구: ${p.district || '-'}`);
    console.log('');
  });

  // 통계
  console.log('\n=== 통계 ===');
  const stats = {
    현직: data.filter(p => p.status === '현직').length,
    출마자: data.filter(p => p.status === '출마자').length,
    광역단체장: data.filter(p => p.title === '광역단체장').length,
  };

  console.log(`\n신분:`);
  console.log(`  현직: ${stats.현직}명`);
  console.log(`  출마자: ${stats.출마자}명`);
  console.log(`\n출마직종:`);
  console.log(`  광역단체장: ${stats.광역단체장}명`);

  console.log(`\n총 ${data.length}명\n`);
}

finalVerify().catch(console.error);
