// 현직 국회의원 등 현직자 수정
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 현직자 정보 (2024년 기준 현직)
const currentOfficials = {
  // 서울 - 현직 국회의원
  '1005': { name: '나경원', position: '국회의원', status: '현직' },
  '1006': { name: '박주민', position: '국회의원', status: '현직' },
  '7f1c3606': { name: '전현희', position: '국회의원', status: '현직' },
  '567e2c27': { name: '이준석', position: '국회의원', status: '현직' },
  'e3c75ad7': { name: '신동욱', position: '국회의원', status: '현직' },
  'd0a5d6e1': { name: '조은희', position: '국회의원', status: '현직' },

  // 경기 - 현직 국회의원
  'd8fe79e9': { name: '추미애', position: '국회의원', status: '현직' },
  '8dc6cea5': { name: '김병주', position: '국회의원', status: '현직' },
  '8639bbf9': { name: '원유철', position: '국회의원', status: '현직' },
  'af3a0f29': { name: '김선교', position: '국회의원', status: '현직' },
  '023139c6': { name: '송석준', position: '국회의원', status: '현직' },
  'aa2cd708': { name: '김성원', position: '국회의원', status: '현직' },

  // 부산 - 현직 국회의원
  '60e55d2a': { name: '김도읍', position: '국회의원', status: '현직' },
  'b99c4d6e': { name: '조경태', position: '국회의원', status: '현직' },
  'ab673715': { name: '박수영', position: '국회의원', status: '현직' },
  'b6ec6ee4': { name: '최인호', position: '국회의원', status: '현직' },

  // 현직 성동구청장
  '17270f25': { name: '정원오', position: '성동구청장', status: '현직' },
};

async function fixCurrentPositions() {
  console.log('\n=== 현직자 직책 및 신분 수정 ===\n');

  let successCount = 0;
  let errorCount = 0;

  for (const [id, info] of Object.entries(currentOfficials)) {
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
