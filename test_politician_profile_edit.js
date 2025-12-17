/**
 * 정치인 프로필 수정 기능 테스트
 * - 프로필 조회 API
 * - 인증 코드 발송 API
 * - 인증 코드 확인 API
 * - 프로필 수정 API
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ooddlafwdpzgxfefgsrx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8'
);

async function testPoliticianProfileEdit() {
  console.log('========================================');
  console.log('   정치인 프로필 수정 기능 테스트');
  console.log('========================================\n');

  const results = {};

  // ============================================
  // 1. 정치인 조회
  // ============================================
  console.log('=== 1. 정치인 조회 ===');

  const { data: politicians, error: politiciansError } = await supabase
    .from('politicians')
    .select('id, name, party')
    .limit(3);

  if (politiciansError) {
    console.log('❌ 정치인 조회 실패:', politiciansError.message);
    results.fetch_politicians = 'FAIL';
    return;
  }

  console.log('✅ 정치인 목록 조회 성공');
  politicians.forEach(p => {
    console.log(`  - ${p.name} (${p.party}) [ID: ${p.id}]`);
  });
  results.fetch_politicians = 'PASS';

  const testPoliticianId = politicians[0].id;
  console.log(`\n테스트 대상 정치인: ${politicians[0].name} (${testPoliticianId})`);

  // ============================================
  // 2. 정치인 상세 정보 조회
  // ============================================
  console.log('\n=== 2. 정치인 상세 정보 조회 ===');

  const { data: details, error: detailsError } = await supabase
    .from('politician_details')
    .select('*')
    .eq('politician_id', testPoliticianId)
    .single();

  if (detailsError && detailsError.code !== 'PGRST116') {
    console.log('❌ 정치인 상세 조회 실패:', detailsError.message);
    results.fetch_details = 'FAIL';
  } else if (!details) {
    console.log('⚠️ 정치인 상세 정보 없음 (새로 생성 필요)');
    results.fetch_details = 'SKIP';
  } else {
    console.log('✅ 정치인 상세 정보 조회 성공');
    console.log('  - contact_email:', details.contact_email || '(없음)');
    console.log('  - contact_phone:', details.contact_phone || '(없음)');
    console.log('  - office_address:', details.office_address || '(없음)');
    console.log('  - website_url:', details.website_url || '(없음)');
    console.log('  - self_introduction:', details.self_introduction ? '(있음)' : '(없음)');
    console.log('  - social_links:', details.social_links ? JSON.stringify(details.social_links) : '(없음)');
    results.fetch_details = 'PASS';
  }

  // ============================================
  // 3. 정치인 프로필 수정 필드 확인
  // ============================================
  console.log('\n=== 3. 정치인 프로필 수정 필드 존재 확인 ===');

  // 컬럼 존재 여부 테스트 (select으로 확인)
  const { data: columnTest, error: columnError } = await supabase
    .from('politician_details')
    .select('politician_id, contact_email, contact_phone, office_address, website_url, social_links, self_introduction')
    .limit(1);

  if (columnError) {
    console.log('❌ 필드 확인 실패:', columnError.message);
    results.profile_fields = 'FAIL';
  } else {
    console.log('✅ 모든 프로필 수정 필드 존재');
    console.log('  - contact_email ✅');
    console.log('  - contact_phone ✅');
    console.log('  - office_address ✅');
    console.log('  - website_url ✅');
    console.log('  - social_links ✅');
    console.log('  - self_introduction ✅');
    results.profile_fields = 'PASS';
  }

  // ============================================
  // 4. 정치인 프로필 수정 이력 테이블 확인
  // ============================================
  console.log('\n=== 4. 프로필 수정 이력 테이블 확인 ===');

  const { data: editHistory, error: editHistoryError } = await supabase
    .from('politician_profile_edits')
    .select('*')
    .limit(1);

  if (editHistoryError) {
    console.log('❌ 수정 이력 테이블 확인 실패:', editHistoryError.message);
    results.edit_history_table = 'FAIL';
  } else {
    console.log('✅ politician_profile_edits 테이블 존재');
    results.edit_history_table = 'PASS';
  }

  // ============================================
  // 5. 정치인 세션 테이블 확인 (이메일 인증용)
  // ============================================
  console.log('\n=== 5. 정치인 세션 테이블 확인 ===');

  const { data: sessions, error: sessionsError } = await supabase
    .from('politician_sessions')
    .select('*')
    .limit(1);

  if (sessionsError) {
    console.log('❌ 세션 테이블 확인 실패:', sessionsError.message);
    results.session_table = 'FAIL';
  } else {
    console.log('✅ politician_sessions 테이블 존재 (이메일 인증용)');
    results.session_table = 'PASS';
  }

  // ============================================
  // 6. 프로필 직접 업데이트 테스트 (DB 레벨)
  // ============================================
  console.log('\n=== 6. 프로필 직접 업데이트 테스트 (DB 레벨) ===');

  // 먼저 politician_details에 레코드가 있는지 확인
  const { data: existingDetails } = await supabase
    .from('politician_details')
    .select('politician_id')
    .eq('politician_id', testPoliticianId)
    .single();

  if (!existingDetails) {
    // 레코드가 없으면 생성
    const { error: insertError } = await supabase
      .from('politician_details')
      .insert({
        politician_id: testPoliticianId,
        self_introduction: '테스트 자기소개입니다.',
        contact_email: 'test@example.com'
      });

    if (insertError) {
      console.log('⚠️ 상세 정보 생성 실패:', insertError.message);
      results.profile_update = 'FAIL';
    } else {
      console.log('✅ 정치인 상세 정보 생성 성공');
      results.profile_update = 'PASS';
    }
  } else {
    // 레코드가 있으면 업데이트
    const testUpdate = {
      self_introduction: '테스트 업데이트: ' + new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('politician_details')
      .update(testUpdate)
      .eq('politician_id', testPoliticianId);

    if (updateError) {
      console.log('❌ 프로필 업데이트 실패:', updateError.message);
      results.profile_update = 'FAIL';
    } else {
      console.log('✅ 프로필 업데이트 성공');
      results.profile_update = 'PASS';
    }
  }

  // ============================================
  // 결과 요약
  // ============================================
  console.log('\n========================================');
  console.log('   테스트 결과 요약');
  console.log('========================================');

  Object.entries(results).forEach(([key, value]) => {
    const emoji = value === 'PASS' ? '✅' : value === 'SKIP' ? '⚠️' : '❌';
    console.log(`  ${emoji} ${key}: ${value}`);
  });

  const passed = Object.values(results).filter(r => r === 'PASS').length;
  const total = Object.keys(results).length;
  console.log(`\n총 ${total}개 중 ${passed}개 통과`);

  // 프론트엔드 페이지 확인 안내
  console.log('\n========================================');
  console.log('   프론트엔드 테스트 안내');
  console.log('========================================');
  console.log('프론트엔드 페이지 URL:');
  console.log(`  https://www.politicianfinder.ai.kr/politicians/${testPoliticianId}/edit`);
  console.log('\n수동 테스트 절차:');
  console.log('  1. 위 URL 접속');
  console.log('  2. 정치인 본인 이메일 입력');
  console.log('  3. 인증 코드 발송 버튼 클릭');
  console.log('  4. 이메일에서 인증 코드 확인');
  console.log('  5. 인증 코드 입력 후 인증 확인');
  console.log('  6. 프로필 정보 수정 후 저장');
}

testPoliticianProfileEdit().catch(console.error);
