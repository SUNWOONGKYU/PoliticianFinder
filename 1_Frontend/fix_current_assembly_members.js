// 현직 국회의원 및 기타 현직 직책 수정
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const currentPositions = {
  // 경기 - 현직 국회의원
  '266c6671': { name: '염태영', position: '국회의원', status: '현직' },
  'be4f6b92': { name: '한준호', position: '국회의원', status: '현직' },

  // 경기 - 대한체육회장
  '643d6bec': { name: '유승민', position: '대한체육회장', status: '출마자' },

  // 부산 - 국가교육위원회 위원장
  'ea36290f': { name: '차정인', position: '국가교육위원회 위원장', status: '출마자' },
};

async function fixCurrentPositions() {
  console.log('\n=== 현직 직책 수정 ===\n');

  let successCount = 0;
  let errorCount = 0;

  for (const [id, info] of Object.entries(currentPositions)) {
    try {
      const { data, error } = await supabase
        .from('politicians')
        .update({
          status: info.status,
          position: info.position
        })
        .eq('id', id)
        .select('id, name, status, position');

      if (error) {
        console.error(`  ❌ ${info.name}: ${error.message}`);
        errorCount++;
      } else if (data && data.length > 0) {
        console.log(`  ✅ ${info.name}: ${info.status} ${info.position}`);
        successCount++;
      }
    } catch (err) {
      console.error(`  ❌ ${info.name}: ${err.message}`);
      errorCount++;
    }
  }

  console.log('\n=== 업데이트 완료 ===');
  console.log(`✅ 성공: ${successCount}명`);
  console.log(`❌ 실패: ${errorCount}명\n`);
}

fixCurrentPositions().catch(console.error);
