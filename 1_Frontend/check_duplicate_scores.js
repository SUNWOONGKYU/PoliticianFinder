// AI 점수 중복 확인
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkDuplicateScores() {
  console.log('\n=== AI 점수 중복 확인 ===\n');

  // 여러 정치인의 AI별 점수 확인
  const { data: politicians } = await supabase
    .from('politicians')
    .select('id, name')
    .limit(5);

  if (politicians) {
    for (const politician of politicians) {
      console.log(`\n정치인: ${politician.name} (${politician.id})`);
      
      const { data: scores } = await supabase
        .from('ai_final_scores')
        .select('ai_name, total_score, grade_code')
        .eq('politician_id', politician.id)
        .in('ai_name', ['Claude', 'ChatGPT', 'Grok']);

      if (scores && scores.length > 0) {
        scores.forEach(s => {
          console.log(`  ${s.ai_name}: ${s.total_score}점 (${s.grade_code})`);
        });
        
        // 점수가 모두 같은지 확인
        const uniqueScores = [...new Set(scores.map(s => s.total_score))];
        if (uniqueScores.length === 1 && scores.length > 1) {
          console.log(`  ⚠️ 경고: 모든 AI 점수가 동일함 (${uniqueScores[0]})`);
        }
      } else {
        console.log('  점수 없음');
      }
    }
  }

  console.log('\n=== 확인 완료 ===\n');
}

checkDuplicateScores().catch(console.error);
