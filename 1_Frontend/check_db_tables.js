// Supabase DB 테이블 확인 스크립트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('\n=== Supabase DB 테이블 확인 ===\n');

  // 1. ai_evaluations 테이블 확인
  console.log('1️⃣ ai_evaluations 테이블:');
  const { data: aiEval, error: aiEvalError, count: aiEvalCount } = await supabase
    .from('ai_evaluations')
    .select('*', { count: 'exact', head: false })
    .limit(1);

  if (aiEvalError) {
    console.log(`   ❌ 테이블 없음 또는 에러: ${aiEvalError.message}`);
  } else {
    console.log(`   ✅ 테이블 존재, 데이터: ${aiEvalCount}개`);
    if (aiEval && aiEval.length > 0) {
      console.log('   샘플 데이터:', JSON.stringify(aiEval[0], null, 2));
    }
  }

  // 2. evaluation_snapshots 테이블 확인
  console.log('\n2️⃣ evaluation_snapshots 테이블:');
  const { data: snapshots, error: snapshotsError, count: snapshotsCount } = await supabase
    .from('evaluation_snapshots')
    .select('*', { count: 'exact', head: false })
    .limit(1);

  if (snapshotsError) {
    console.log(`   ❌ 테이블 없음 또는 에러: ${snapshotsError.message}`);
  } else {
    console.log(`   ✅ 테이블 존재, 데이터: ${snapshotsCount}개`);
    if (snapshots && snapshots.length > 0) {
      console.log('   샘플 데이터:', JSON.stringify(snapshots[0], null, 2));
    }
  }

  // 3. ai_final_scores 테이블 확인
  console.log('\n3️⃣ ai_final_scores 테이블:');
  const { data: finalScores, error: finalScoresError, count: finalScoresCount } = await supabase
    .from('ai_final_scores')
    .select('*', { count: 'exact', head: false })
    .limit(1);

  if (finalScoresError) {
    console.log(`   ❌ 테이블 없음 또는 에러: ${finalScoresError.message}`);
  } else {
    console.log(`   ✅ 테이블 존재, 데이터: ${finalScoresCount}개`);
    if (finalScores && finalScores.length > 0) {
      console.log('   샘플 데이터:', JSON.stringify(finalScores[0], null, 2));
    }
  }

  // 4. politician_details 테이블 확인
  console.log('\n4️⃣ politician_details 테이블:');
  const { data: details, error: detailsError, count: detailsCount } = await supabase
    .from('politician_details')
    .select('politician_id, user_rating, rating_count', { count: 'exact', head: false })
    .limit(3);

  if (detailsError) {
    console.log(`   ❌ 테이블 없음 또는 에러: ${detailsError.message}`);
  } else {
    console.log(`   ✅ 테이블 존재, 데이터: ${detailsCount}개`);
    if (details && details.length > 0) {
      console.log('   샘플 데이터:', JSON.stringify(details, null, 2));
    }
  }

  // 5. politicians 테이블의 평가 관련 컬럼 확인
  console.log('\n5️⃣ politicians 테이블 (평가 점수 컬럼):');
  const { data: politicians, error: politiciansError } = await supabase
    .from('politicians')
    .select('id, name, evaluation_score, evaluation_grade')
    .limit(3);

  if (politiciansError) {
    console.log(`   ❌ 에러: ${politiciansError.message}`);
  } else {
    console.log(`   ✅ 데이터:`);
    if (politicians && politicians.length > 0) {
      politicians.forEach(p => {
        console.log(`   - ${p.name}: score=${p.evaluation_score}, grade=${p.evaluation_grade}`);
      });
    }
  }

  console.log('\n=== 확인 완료 ===\n');
}

checkTables().catch(console.error);
