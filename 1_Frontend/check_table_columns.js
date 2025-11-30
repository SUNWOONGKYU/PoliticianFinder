// politicians 테이블 컬럼 확인
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkColumns() {
  console.log('\n=== politicians 테이블 컬럼 확인 ===\n');

  // 한 명의 정치인 데이터를 가져와서 컬럼 확인
  const { data, error } = await supabase
    .from('politicians')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.error('Error:', error);
  } else if (data) {
    console.log('테이블 컬럼 목록:');
    Object.keys(data).sort().forEach(key => {
      console.log(`  - ${key}: ${typeof data[key]} = ${JSON.stringify(data[key])}`);
    });
  }

  console.log('\n=== 확인 완료 ===\n');
}

checkColumns().catch(console.error);
