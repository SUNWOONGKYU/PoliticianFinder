// 유승민 직책 원상복구
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function revertYooPosition() {
  console.log('\n=== 유승민 직책 원상복구 ===\n');

  try {
    const { data, error } = await supabase
      .from('politicians')
      .update({
        position: '전 국회의원'
      })
      .eq('id', '643d6bec')
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

revertYooPosition().catch(console.error);
