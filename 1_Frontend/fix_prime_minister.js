// 김민석 현직 국무총리 수정
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fixPrimeMinister() {
  console.log('\n=== 김민석 현직 국무총리 수정 ===\n');

  try {
    const { data, error } = await supabase
      .from('politicians')
      .update({
        status: '현직',
        position: '국무총리'
      })
      .eq('id', 'f9e00370')
      .select('id, name, status, position');

    if (error) {
      console.error(`  ❌ 오류: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log(`  ✅ ${data[0].name}: ${data[0].status} ${data[0].position}`);
      console.log('\n=== 업데이트 완료 ===\n');
    }
  } catch (err) {
    console.error(`  ❌ 오류: ${err.message}`);
  }
}

fixPrimeMinister().catch(console.error);
