// AI 점수 상세 확인
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkAIScores() {
  console.log('\n=== AI 점수 데이터 확인 ===\n');

  // 1. ai_final_scores에서 AI별 점수 확인
  console.log('1️⃣ ai_final_scores 테이블 - AI별 데이터:');
  const { data: scores, error } = await supabase
    .from('ai_final_scores')
    .select('politician_id, ai_name, total_score, grade_code')
    .limit(10);

  if (error) {
    console.log(`   ❌ 에러: ${error.message}`);
  } else if (scores) {
    console.log(`   총 ${scores.length}개 데이터:`);
    
    // AI별로 그룹화
    const byAI = {};
    scores.forEach(s => {
      if (!byAI[s.ai_name]) byAI[s.ai_name] = [];
      byAI[s.ai_name].push(s);
    });
    
    Object.keys(byAI).forEach(aiName => {
      console.log(`\n   ${aiName}: ${byAI[aiName].length}개`);
      console.log(`   샘플:`, byAI[aiName][0]);
    });
  }

  // 2. politician_id별로 AI 점수 확인
  console.log('\n\n2️⃣ 특정 정치인의 AI별 점수:');
  const { data: politicianScores } = await supabase
    .from('ai_final_scores')
    .select('politician_id, ai_name, total_score, grade_code')
    .eq('politician_id', '8dc6cea5');

  if (politicianScores && politicianScores.length > 0) {
    console.log(`   정치인 ID: 8dc6cea5`);
    politicianScores.forEach(s => {
      console.log(`   - ${s.ai_name}: ${s.total_score}점 (${s.grade_code})`);
    });
  }

  // 3. 각 AI별 데이터 개수 확인
  console.log('\n\n3️⃣ AI별 데이터 개수:');
  const { data: allScores } = await supabase
    .from('ai_final_scores')
    .select('ai_name');

  if (allScores) {
    const counts = {};
    allScores.forEach(s => {
      counts[s.ai_name] = (counts[s.ai_name] || 0) + 1;
    });
    
    Object.keys(counts).forEach(ai => {
      console.log(`   ${ai}: ${counts[ai]}개`);
    });
  }

  console.log('\n=== 확인 완료 ===\n');
}

checkAIScores().catch(console.error);
