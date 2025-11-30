// 등록된 정치인 수 확인
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkCount() {
  console.log('\n=== 정치인 데이터 확인 ===\n');

  // 전체 정치인 수
  const { count: totalCount } = await supabase
    .from('politicians')
    .select('*', { count: 'exact', head: true });

  console.log(`전체 정치인 수: ${totalCount}명`);

  // 검증된 정치인 수
  const { count: verifiedCount } = await supabase
    .from('politicians')
    .select('*', { count: 'exact', head: true })
    .eq('is_verified', true);

  console.log(`검증된 정치인: ${verifiedCount}명`);

  // 처음 50명의 이름 출력
  const { data: politicians } = await supabase
    .from('politicians')
    .select('id, name, party, region, status, is_verified')
    .order('created_at', { ascending: true })
    .limit(50);

  console.log('\n처음 50명:');
  politicians?.forEach((p, i) => {
    console.log(`${i+1}. ${p.name} (${p.party}) - ${p.region} - ${p.status || '상태없음'} - ${p.is_verified ? '검증됨' : '미검증'}`);
  });

  console.log('\n=== 확인 완료 ===\n');
}

checkCount().catch(console.error);
