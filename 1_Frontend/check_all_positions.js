// 모든 정치인의 position과 title 확인
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkPositions() {
  console.log('\n=== 정치인 position과 title 데이터 확인 ===\n');

  const { data: politicians } = await supabase
    .from('politicians')
    .select('id, name, status, position, title')
    .limit(10);

  if (politicians) {
    console.log('샘플 10명:');
    politicians.forEach((p, i) => {
      console.log(`\n${i+1}. ${p.name}:`);
      console.log(`   status (신분): ${p.status || 'null'}`);
      console.log(`   position: ${p.position || 'null'}`);
      console.log(`   title: ${p.title || 'null'}`);
    });

    // position 값 종류
    console.log('\n=== position 필드 고유값 ===');
    const { data: positions } = await supabase
      .from('politicians')
      .select('position')
      .not('position', 'is', null);

    const uniquePositions = [...new Set(positions?.map(p => p.position))];
    console.log('발견된 position 값들:', uniquePositions);

    // title 값 종류
    console.log('\n=== title 필드 고유값 ===');
    const { data: titles } = await supabase
      .from('politicians')
      .select('title')
      .not('title', 'is', null);

    const uniqueTitles = [...new Set(titles?.map(p => p.title))];
    console.log('발견된 title 값들:', uniqueTitles.length > 0 ? uniqueTitles : '(모두 null)');
  }

  console.log('\n=== 확인 완료 ===\n');
}

checkPositions().catch(console.error);
