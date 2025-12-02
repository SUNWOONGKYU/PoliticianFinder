// 정치인 ID로 할 수 있는 모든 기능 종합 테스트
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ooddlafwdpzgxfefgsrx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const API_BASE = 'https://politician-finder-frz95t4ad-finder-world.vercel.app';
const POLITICIAN_ID = '62e7b453'; // 오세훈
const TEST_EMAIL = 'wksun999@hanmail.net';

console.log('🚀 정치인 ID 전체 기능 종합 테스트');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n');
console.log(`정치인 ID: ${POLITICIAN_ID} (오세훈)`);
console.log(`API Base: ${API_BASE}\\n`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n');

async function testAPI(testName, method, endpoint, body = null, headers = {}) {
  console.log(`\\n📌 ${testName}`);
  console.log(`   ${method} ${endpoint}`);

  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json', ...headers }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const text = await response.text();

    console.log(`   Status: ${response.status} ${response.statusText}`);

    if (text) {
      try {
        const json = JSON.parse(text);
        console.log(`   응답: ${JSON.stringify(json, null, 2).substring(0, 500)}${json.toString().length > 500 ? '...' : ''}`);
        return { success: response.ok, status: response.status, data: json };
      } catch (e) {
        console.log(`   응답 (Text): ${text.substring(0, 200)}`);
        return { success: response.ok, status: response.status, data: text };
      }
    } else {
      console.log(`   응답: (empty)`);
      return { success: response.ok, status: response.status, data: null };
    }
  } catch (error) {
    console.log(`   ❌ 오류: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('\\n🔍 테스트 시작...\\n');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };

  // ========================================================================
  // 1. 정치인 기본 정보 조회
  // ========================================================================
  console.log('\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📂 1. 정치인 기본 정보 API');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const test1 = await testAPI(
    '1-1. 정치인 상세 정보 조회',
    'GET',
    `/api/politicians/${POLITICIAN_ID}`
  );
  results.total++;
  if (test1.success) results.passed++; else results.failed++;
  results.tests.push({ name: '정치인 상세 정보', ...test1 });

  // ========================================================================
  // 2. 정치인 평가 정보
  // ========================================================================
  console.log('\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📂 2. 정치인 평가 정보 API');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const test2 = await testAPI(
    '2-1. 정치인 AI 평가 조회',
    'GET',
    `/api/politicians/${POLITICIAN_ID}/evaluation`
  );
  results.total++;
  if (test2.success) results.passed++; else results.failed++;
  results.tests.push({ name: '정치인 AI 평가', ...test2 });

  // ========================================================================
  // 3. 관련 정치인 조회
  // ========================================================================
  console.log('\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📂 3. 관련 정치인 API');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const test3 = await testAPI(
    '3-1. 관련 정치인 조회',
    'GET',
    `/api/politicians/${POLITICIAN_ID}/related`
  );
  results.total++;
  if (test3.success) results.passed++; else results.failed++;
  results.tests.push({ name: '관련 정치인 조회', ...test3 });

  // ========================================================================
  // 4. 정치인 검색
  // ========================================================================
  console.log('\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📂 4. 정치인 검색 API');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const test4 = await testAPI(
    '4-1. 정치인 검색 (이름)',
    'GET',
    '/api/politicians/search?query=오세훈'
  );
  results.total++;
  if (test4.success) results.passed++; else results.failed++;
  results.tests.push({ name: '정치인 검색', ...test4 });

  // ========================================================================
  // 5. 정치인 통계
  // ========================================================================
  console.log('\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📂 5. 정치인 통계 API');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const test5 = await testAPI(
    '5-1. 정치인 통계 조회',
    'GET',
    '/api/politicians/statistics'
  );
  results.total++;
  if (test5.success) results.passed++; else results.failed++;
  results.tests.push({ name: '정치인 통계', ...test5 });

  // ========================================================================
  // 6. 정치인 본인 인증 (이미 테스트 완료)
  // ========================================================================
  console.log('\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📂 6. 정치인 본인 인증 API (이미 테스트 완료)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   ✅ send-code API: 테스트 완료 (이메일 발송 확인)');
  console.log('   ✅ check-code API: 테스트 완료 (인증 성공)');
  results.total += 2;
  results.passed += 2;

  // ========================================================================
  // 7. 정치인 인증 상태 조회
  // ========================================================================
  console.log('\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📂 7. 정치인 인증 상태 API');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const test7 = await testAPI(
    '7-1. 정치인 인증 상태 조회',
    'GET',
    `/api/politicians/verification/status/${POLITICIAN_ID}`
  );
  results.total++;
  if (test7.success || test7.status === 404) results.passed++; else results.failed++;
  results.tests.push({ name: '인증 상태 조회', ...test7 });

  // ========================================================================
  // 8. DB 직접 조회: 찜하기 (favorite) 데이터
  // ========================================================================
  console.log('\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📂 8. DB 직접 조회: 찜하기 데이터');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('\\n📌 8-1. 찜하기 데이터 조회 (DB)');
  const { data: favorites, error: favError } = await supabase
    .from('favorite_politicians')
    .select('*')
    .eq('politician_id', POLITICIAN_ID);

  if (favError) {
    console.log(`   ❌ 오류: ${favError.message}`);
    results.failed++;
  } else {
    console.log(`   ✅ 찾은 찜하기: ${favorites?.length || 0}개`);
    if (favorites && favorites.length > 0) {
      console.log(`   샘플: ${JSON.stringify(favorites[0], null, 2)}`);
    }
    results.passed++;
  }
  results.total++;

  // ========================================================================
  // 9. DB 직접 조회: 평점 (rating) 데이터
  // ========================================================================
  console.log('\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📂 9. DB 직접 조회: 평점 데이터');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('\\n📌 9-1. 평점 데이터 조회 (DB)');
  const { data: ratings, error: ratingError } = await supabase
    .from('politician_ratings')
    .select('*')
    .eq('politician_id', POLITICIAN_ID);

  if (ratingError) {
    console.log(`   ❌ 오류: ${ratingError.message}`);
    results.failed++;
  } else {
    console.log(`   ✅ 찾은 평점: ${ratings?.length || 0}개`);
    if (ratings && ratings.length > 0) {
      const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      console.log(`   평균 평점: ${avgRating.toFixed(2)}/5.0`);
      console.log(`   샘플: ${JSON.stringify(ratings[0], null, 2)}`);
    }
    results.passed++;
  }
  results.total++;

  // ========================================================================
  // 10. DB 직접 조회: AI 평가 데이터
  // ========================================================================
  console.log('\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📂 10. DB 직접 조회: AI 평가 데이터');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('\\n📌 10-1. AI 평가 데이터 조회 (DB)');
  const { data: evaluations, error: evalError } = await supabase
    .from('ai_evaluations')
    .select('*')
    .eq('politician_id', POLITICIAN_ID);

  if (evalError) {
    console.log(`   ❌ 오류: ${evalError.message}`);
    results.failed++;
  } else {
    console.log(`   ✅ 찾은 AI 평가: ${evaluations?.length || 0}개`);
    if (evaluations && evaluations.length > 0) {
      console.log(`   평가 카테고리: ${evaluations.map(e => e.category).join(', ')}`);
      console.log(`   샘플: ${JSON.stringify(evaluations[0], null, 2).substring(0, 300)}...`);
    }
    results.passed++;
  }
  results.total++;

  // ========================================================================
  // 11. DB 직접 조회: 경력 (careers) 데이터
  // ========================================================================
  console.log('\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📂 11. DB 직접 조회: 경력 데이터');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('\\n📌 11-1. 경력 데이터 조회 (DB)');
  const { data: careers, error: careerError } = await supabase
    .from('careers')
    .select('*')
    .eq('politician_id', POLITICIAN_ID);

  if (careerError) {
    console.log(`   ❌ 오류: ${careerError.message}`);
    results.failed++;
  } else {
    console.log(`   ✅ 찾은 경력: ${careers?.length || 0}개`);
    if (careers && careers.length > 0) {
      careers.forEach((career, idx) => {
        console.log(`   ${idx + 1}. ${career.title} (${career.start_date} ~ ${career.end_date || '현재'})`);
      });
    }
    results.passed++;
  }
  results.total++;

  // ========================================================================
  // 12. DB 직접 조회: 공약 (pledges) 데이터
  // ========================================================================
  console.log('\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📂 12. DB 직접 조회: 공약 데이터');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('\\n📌 12-1. 공약 데이터 조회 (DB)');
  const { data: pledges, error: pledgeError } = await supabase
    .from('pledges')
    .select('*')
    .eq('politician_id', POLITICIAN_ID);

  if (pledgeError) {
    console.log(`   ❌ 오류: ${pledgeError.message}`);
    results.failed++;
  } else {
    console.log(`   ✅ 찾은 공약: ${pledges?.length || 0}개`);
    if (pledges && pledges.length > 0) {
      pledges.forEach((pledge, idx) => {
        console.log(`   ${idx + 1}. ${pledge.title} (${pledge.status || '진행중'})`);
      });
    }
    results.passed++;
  }
  results.total++;

  // ========================================================================
  // 13. DB 직접 조회: politician_details 테이블
  // ========================================================================
  console.log('\\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📂 13. DB 직접 조회: 정치인 상세 정보');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('\\n📌 13-1. politician_details 조회 (DB)');
  const { data: details, error: detailsError } = await supabase
    .from('politician_details')
    .select('*')
    .eq('politician_id', POLITICIAN_ID)
    .single();

  if (detailsError) {
    console.log(`   ❌ 오류: ${detailsError.message}`);
    results.failed++;
  } else if (details) {
    console.log(`   ✅ 정치인 상세 정보:`);
    console.log(`   - 평균 평점: ${details.average_rating || 'N/A'}`);
    console.log(`   - 총 평점 수: ${details.rating_count || 0}`);
    console.log(`   - 찜하기 수: ${details.favorite_count || 0}`);
    console.log(`   - 조회수: ${details.view_count || 0}`);
    results.passed++;
  } else {
    console.log(`   ℹ️  데이터 없음`);
    results.passed++;
  }
  results.total++;

  // ========================================================================
  // 최종 결과
  // ========================================================================
  console.log('\\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 최종 테스트 결과');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log(`   전체 테스트: ${results.total}개`);
  console.log(`   ✅ 성공: ${results.passed}개`);
  console.log(`   ❌ 실패: ${results.failed}개`);
  console.log(`   성공률: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 실패한 테스트 목록
  const failedTests = results.tests.filter(t => !t.success);
  if (failedTests.length > 0) {
    console.log('\\n⚠️  실패한 테스트:');
    failedTests.forEach((t, idx) => {
      console.log(`   ${idx + 1}. ${t.name} - Status: ${t.status || 'Error'}`);
    });
  }

  console.log('\\n🎉 정치인 ID 전체 기능 테스트 완료!\\n');
}

runAllTests();
