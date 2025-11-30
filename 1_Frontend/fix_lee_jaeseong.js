// 이재성 정당 및 직책 수정
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fixLeeJaeseong() {
  console.log('\n=== 이재성 정당 및 직책 수정 ===\n');

  try {
    const { data, error } = await supabase
      .from('politicians')
      .update({
        position: '더불어민주당 부산시당 위원장',
        party: '더불어민주당'
      })
      .eq('id', '3ee57024')
      .select('id, name, position, party');

    if (error) {
      console.error(`  ❌ 오류: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log(`  ✅ ${data[0].name}`);
      console.log(`     정당: ${data[0].party}`);
      console.log(`     직책: ${data[0].position}`);
      console.log('\n=== 업데이트 완료 ===\n');
    }
  } catch (err) {
    console.error(`  ❌ 오류: ${err.message}`);
  }
}

fixLeeJaeseong().catch(console.error);
