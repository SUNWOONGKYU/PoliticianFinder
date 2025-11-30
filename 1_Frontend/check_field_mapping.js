// 필드 매핑 확인 스크립트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkFieldMapping() {
  console.log('\n=== 정치인 필드 매핑 확인 ===\n');

  const { data: politicians } = await supabase
    .from('politicians')
    .select('id, name, identity, title, position, position_type, region, district')
    .limit(10);

  if (politicians) {
    console.log('샘플 데이터:');
    politicians.forEach((p, i) => {
      console.log(`\n${i+1}. ${p.name}:`);
      console.log(`   identity (신분): ${p.identity || '없음'}`);
      console.log(`   title (직책): ${p.title || '없음'}`);
      console.log(`   position (??): ${p.position || '없음'}`);
      console.log(`   position_type (출마직종): ${p.position_type || '없음'}`);
      console.log(`   region (지역): ${p.region || '없음'}`);
      console.log(`   district (지역구): ${p.district || '없음'}`);
    });

    // identity 값 종류 확인
    console.log('\n=== identity 필드 고유값 ===');
    const { data: identities } = await supabase
      .from('politicians')
      .select('identity')
      .not('identity', 'is', null);

    const uniqueIdentities = [...new Set(identities?.map(p => p.identity))];
    console.log('발견된 identity 값들:', uniqueIdentities);

    // position_type 값 종류 확인
    console.log('\n=== position_type 필드 고유값 ===');
    const { data: positionTypes } = await supabase
      .from('politicians')
      .select('position_type')
      .not('position_type', 'is', null);

    const uniquePositionTypes = [...new Set(positionTypes?.map(p => p.position_type))];
    console.log('발견된 position_type 값들:', uniquePositionTypes);
  }

  console.log('\n=== 확인 완료 ===\n');
}

checkFieldMapping().catch(console.error);
