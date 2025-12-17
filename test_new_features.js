const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ooddlafwdpzgxfefgsrx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8'
);

const TEST_EMAIL = 'wksun99@gmail.com';
const TEST_PASSWORD = 'na5215900';

async function testNewFeatures() {
  console.log('========================================');
  console.log('   신규 기능 테스트');
  console.log('========================================\n');

  // 로그인
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });

  if (authError) {
    console.log('❌ 로그인 실패:', authError.message);
    return;
  }
  console.log('✅ 로그인 성공\n');

  const results = {};

  // ============================================
  // 1. 신고 기능 테스트
  // ============================================
  console.log('=== 1. 신고 기능 테스트 ===');

  // 테스트할 게시글 가져오기
  const { data: posts } = await supabase.from('posts').select('id').limit(1);

  if (posts && posts.length > 0) {
    const postId = posts[0].id;

    // 신고 등록
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        reporter_id: auth.user.id,
        target_type: 'post',
        target_id: postId,
        reason: 'spam',
        description: '테스트 신고입니다.'
      })
      .select()
      .single();

    if (reportError) {
      console.log('❌ 신고 등록 실패:', reportError.message);
      results.reports = 'FAIL';
    } else {
      console.log('✅ 신고 등록 성공:', report.id.substring(0, 8));

      // 내 신고 목록 조회
      const { data: myReports, error: myReportsError } = await supabase
        .from('reports')
        .select('*')
        .eq('reporter_id', auth.user.id);

      if (myReportsError) {
        console.log('❌ 신고 목록 조회 실패:', myReportsError.message);
      } else {
        console.log('✅ 신고 목록 조회 성공 (' + myReports.length + '개)');
      }

      // 테스트 신고 삭제
      await supabase.from('reports').delete().eq('id', report.id);
      console.log('✅ 테스트 신고 삭제 완료');
      results.reports = 'PASS';
    }
  } else {
    console.log('⚠️ 테스트할 게시글이 없습니다');
    results.reports = 'SKIP';
  }

  // ============================================
  // 2. 댓글 공감/비공감 집계 테스트
  // ============================================
  console.log('\n=== 2. 댓글 공감/비공감 집계 테스트 ===');

  const { data: comments, error: commentsError } = await supabase
    .from('comments')
    .select('id, upvotes, downvotes')
    .limit(5);

  if (commentsError) {
    console.log('❌ 댓글 조회 실패:', commentsError.message);
    results.comment_votes = 'FAIL';
  } else {
    console.log('✅ 댓글 upvotes/downvotes 컬럼 존재');
    comments.forEach(c => {
      console.log(`  - ${c.id.substring(0, 8)}: 공감 ${c.upvotes || 0} / 비공감 ${c.downvotes || 0}`);
    });
    results.comment_votes = 'PASS';
  }

  // ============================================
  // 3. 정치인 프로필 수정 필드 테스트
  // ============================================
  console.log('\n=== 3. 정치인 프로필 수정 필드 테스트 ===');

  const { data: politicianDetails, error: pdError } = await supabase
    .from('politician_details')
    .select('politician_id, contact_email, contact_phone, office_address, website_url, social_links, self_introduction')
    .limit(1);

  if (pdError) {
    console.log('❌ 정치인 상세 조회 실패:', pdError.message);
    results.politician_profile = 'FAIL';
  } else {
    console.log('✅ 정치인 프로필 수정 필드 존재');
    console.log('  - contact_email, contact_phone, office_address');
    console.log('  - website_url, social_links, self_introduction');
    results.politician_profile = 'PASS';
  }

  // 정치인 프로필 수정 이력 테이블 확인
  const { data: editHistory, error: ehError } = await supabase
    .from('politician_profile_edits')
    .select('*')
    .limit(1);

  if (ehError) {
    console.log('❌ 수정 이력 테이블 조회 실패:', ehError.message);
  } else {
    console.log('✅ 정치인 프로필 수정 이력 테이블 존재');
  }

  // ============================================
  // 결과 요약
  // ============================================
  console.log('\n========================================');
  console.log('   테스트 결과 요약');
  console.log('========================================');
  console.log(`  신고 기능: ${results.reports}`);
  console.log(`  댓글 공감/비공감: ${results.comment_votes}`);
  console.log(`  정치인 프로필 수정: ${results.politician_profile}`);

  const passed = Object.values(results).filter(r => r === 'PASS').length;
  const total = Object.keys(results).length;
  console.log(`\n총 ${total}개 중 ${passed}개 통과`);
}

testNewFeatures();
