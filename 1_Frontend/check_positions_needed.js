const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

(async () => {
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
    .select('id, name, position, status')
    .in('id', allIds)
    .order('name');

  console.log('\n=== 직책 확인이 필요한 정치인 ===\n');

  const needUpdate = data.filter(p => {
    if (p.status === '현직') return false;

    const pos = p.position || '';
    return pos === '경기도지사' ||
           pos === '국회의원' ||
           pos === '국무총리' ||
           pos.includes('지역위원장');
  });

  needUpdate.forEach(p => {
    console.log(`${p.name} (ID: ${p.id})`);
    console.log(`  현재 직책: ${p.position || '없음'}`);
    console.log('');
  });

  console.log(`총 ${needUpdate.length}명 업데이트 필요\n`);
})();
