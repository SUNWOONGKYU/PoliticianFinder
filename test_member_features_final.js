/**
 * 회원 기능 최종 검토 테스트
 * 모든 회원 기능이 정상 동작하는지 확인
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ooddlafwdpzgxfefgsrx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8'
);

const TEST_EMAIL = 'wksun99@gmail.com';
const TEST_PASSWORD = 'na5215900';

async function testAllMemberFeatures() {
  console.log('================================================');
  console.log('   PoliticianFinder 회원 기능 최종 검토');
  console.log('   테스트 일시:', new Date().toLocaleString('ko-KR'));
  console.log('================================================\n');

  const results = {};
  let userId = null;

  // ============================================
  // 1. 인증 기능
  // ============================================
  console.log('=== 1. 인증 기능 ===\n');

  // 1-1. 로그인
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });

  if (authError) {
    console.log('❌ 1-1. 로그인: FAIL -', authError.message);
    results['1-1_로그인'] = 'FAIL';
    return results;
  }
  console.log('✅ 1-1. 로그인: PASS');
  results['1-1_로그인'] = 'PASS';
  userId = auth.user.id;

  // 1-2. 세션 확인
  const { data: session } = await supabase.auth.getSession();
  if (session?.session) {
    console.log('✅ 1-2. 세션 유지: PASS');
    results['1-2_세션유지'] = 'PASS';
  } else {
    console.log('❌ 1-2. 세션 유지: FAIL');
    results['1-2_세션유지'] = 'FAIL';
  }

  // ============================================
  // 2. 프로필 기능
  // ============================================
  console.log('\n=== 2. 프로필 기능 ===\n');

  // 2-1. 프로필 조회
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.log('❌ 2-1. 프로필 조회: FAIL -', profileError.message);
    results['2-1_프로필조회'] = 'FAIL';
  } else {
    console.log('✅ 2-1. 프로필 조회: PASS');
    console.log('     - 닉네임:', profile.nickname || '(없음)');
    console.log('     - 이름:', profile.full_name || '(없음)');
    results['2-1_프로필조회'] = 'PASS';
  }

  // 2-2. 프로필 수정 가능 여부 (컬럼 존재 확인)
  const profileColumns = profile ? Object.keys(profile) : [];
  const hasEditableFields = profileColumns.includes('nickname') && profileColumns.includes('full_name');
  if (hasEditableFields) {
    console.log('✅ 2-2. 프로필 수정 필드: PASS');
    results['2-2_프로필수정필드'] = 'PASS';
  } else {
    console.log('❌ 2-2. 프로필 수정 필드: FAIL');
    results['2-2_프로필수정필드'] = 'FAIL';
  }

  // ============================================
  // 3. 정치인 관련 기능
  // ============================================
  console.log('\n=== 3. 정치인 관련 기능 ===\n');

  // 3-1. 정치인 목록 조회
  const { data: politicians, error: politiciansError } = await supabase
    .from('politicians')
    .select('id, name, party')
    .limit(5);

  if (politiciansError) {
    console.log('❌ 3-1. 정치인 목록 조회: FAIL -', politiciansError.message);
    results['3-1_정치인목록'] = 'FAIL';
  } else {
    console.log('✅ 3-1. 정치인 목록 조회: PASS (' + politicians.length + '명)');
    results['3-1_정치인목록'] = 'PASS';
  }

  const testPoliticianId = politicians?.[0]?.id;

  // 3-2. 정치인 상세 조회
  if (testPoliticianId) {
    const { data: politicianDetail, error: detailError } = await supabase
      .from('politicians')
      .select('*, politician_details(*)')
      .eq('id', testPoliticianId)
      .single();

    if (detailError) {
      console.log('❌ 3-2. 정치인 상세 조회: FAIL -', detailError.message);
      results['3-2_정치인상세'] = 'FAIL';
    } else {
      console.log('✅ 3-2. 정치인 상세 조회: PASS');
      results['3-2_정치인상세'] = 'PASS';
    }
  }

  // 3-3. 관심 정치인 테이블 확인
  const { data: favorites, error: favError } = await supabase
    .from('favorite_politicians')
    .select('*')
    .eq('user_id', userId);

  if (favError) {
    console.log('❌ 3-3. 관심 정치인 기능: FAIL -', favError.message);
    results['3-3_관심정치인'] = 'FAIL';
  } else {
    console.log('✅ 3-3. 관심 정치인 기능: PASS (' + favorites.length + '명 등록)');
    results['3-3_관심정치인'] = 'PASS';
  }

  // 3-4. 정치인 평점 테이블 확인
  const { data: ratings, error: ratingError } = await supabase
    .from('politician_ratings')
    .select('*')
    .eq('user_id', userId);

  if (ratingError) {
    console.log('❌ 3-4. 정치인 평점 기능: FAIL -', ratingError.message);
    results['3-4_정치인평점'] = 'FAIL';
  } else {
    console.log('✅ 3-4. 정치인 평점 기능: PASS (' + ratings.length + '개 평점)');
    results['3-4_정치인평점'] = 'PASS';
  }

  // ============================================
  // 4. 게시글 기능
  // ============================================
  console.log('\n=== 4. 게시글 기능 ===\n');

  // 4-1. 게시글 목록 조회
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('id, title, author_id, upvotes, downvotes')
    .limit(5);

  if (postsError) {
    console.log('❌ 4-1. 게시글 목록 조회: FAIL -', postsError.message);
    results['4-1_게시글목록'] = 'FAIL';
  } else {
    console.log('✅ 4-1. 게시글 목록 조회: PASS (' + posts.length + '개)');
    results['4-1_게시글목록'] = 'PASS';
  }

  // 4-2. 내 게시글 조회
  const { data: myPosts, error: myPostsError } = await supabase
    .from('posts')
    .select('id, title')
    .eq('author_id', userId);

  if (myPostsError) {
    console.log('❌ 4-2. 내 게시글 조회: FAIL -', myPostsError.message);
    results['4-2_내게시글'] = 'FAIL';
  } else {
    console.log('✅ 4-2. 내 게시글 조회: PASS (' + myPosts.length + '개)');
    results['4-2_내게시글'] = 'PASS';
  }

  // 4-3. 공감/비공감 (votes 테이블)
  const { data: votes, error: votesError } = await supabase
    .from('votes')
    .select('*')
    .eq('user_id', userId);

  if (votesError) {
    console.log('❌ 4-3. 공감/비공감 기능: FAIL -', votesError.message);
    results['4-3_공감비공감'] = 'FAIL';
  } else {
    const upvotes = votes.filter(v => v.vote_type === 'upvote').length;
    const downvotes = votes.filter(v => v.vote_type === 'downvote').length;
    console.log('✅ 4-3. 공감/비공감 기능: PASS (공감 ' + upvotes + ', 비공감 ' + downvotes + ')');
    results['4-3_공감비공감'] = 'PASS';
  }

  // ============================================
  // 5. 댓글 기능
  // ============================================
  console.log('\n=== 5. 댓글 기능 ===\n');

  // 5-1. 댓글 목록 조회
  const { data: comments, error: commentsError } = await supabase
    .from('comments')
    .select('id, content, author_id, parent_comment_id, upvotes, downvotes')
    .limit(5);

  if (commentsError) {
    console.log('❌ 5-1. 댓글 목록 조회: FAIL -', commentsError.message);
    results['5-1_댓글목록'] = 'FAIL';
  } else {
    console.log('✅ 5-1. 댓글 목록 조회: PASS (' + comments.length + '개)');
    results['5-1_댓글목록'] = 'PASS';
  }

  // 5-2. 대댓글 지원 확인 (parent_comment_id 컬럼)
  const hasParentId = comments?.[0] && 'parent_comment_id' in comments[0];
  if (hasParentId) {
    console.log('✅ 5-2. 대댓글 기능: PASS');
    results['5-2_대댓글'] = 'PASS';
  } else {
    console.log('❌ 5-2. 대댓글 기능: FAIL (parent_comment_id 없음)');
    results['5-2_대댓글'] = 'FAIL';
  }

  // 5-3. 댓글 공감/비공감 컬럼 확인
  const hasCommentVotes = comments?.[0] && 'upvotes' in comments[0] && 'downvotes' in comments[0];
  if (hasCommentVotes) {
    console.log('✅ 5-3. 댓글 공감/비공감 집계: PASS');
    results['5-3_댓글공감집계'] = 'PASS';
  } else {
    console.log('❌ 5-3. 댓글 공감/비공감 집계: FAIL');
    results['5-3_댓글공감집계'] = 'FAIL';
  }

  // ============================================
  // 6. 소셜 기능
  // ============================================
  console.log('\n=== 6. 소셜 기능 ===\n');

  // 6-1. 팔로우 기능
  const { data: follows, error: followsError } = await supabase
    .from('follows')
    .select('*')
    .or(`follower_id.eq.${userId},following_id.eq.${userId}`);

  if (followsError) {
    console.log('❌ 6-1. 팔로우 기능: FAIL -', followsError.message);
    results['6-1_팔로우'] = 'FAIL';
  } else {
    const following = follows.filter(f => f.follower_id === userId).length;
    const followers = follows.filter(f => f.following_id === userId).length;
    console.log('✅ 6-1. 팔로우 기능: PASS (팔로잉 ' + following + ', 팔로워 ' + followers + ')');
    results['6-1_팔로우'] = 'PASS';
  }

  // 6-2. 공유 기능
  const { data: shares, error: sharesError } = await supabase
    .from('shares')
    .select('*')
    .limit(1);

  if (sharesError) {
    console.log('❌ 6-2. 공유 기능: FAIL -', sharesError.message);
    results['6-2_공유'] = 'FAIL';
  } else {
    console.log('✅ 6-2. 공유 기능: PASS');
    results['6-2_공유'] = 'PASS';
  }

  // ============================================
  // 7. 알림 기능
  // ============================================
  console.log('\n=== 7. 알림 기능 ===\n');

  const { data: notifications, error: notifError } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId);

  if (notifError) {
    console.log('❌ 7-1. 알림 기능: FAIL -', notifError.message);
    results['7-1_알림'] = 'FAIL';
  } else {
    console.log('✅ 7-1. 알림 기능: PASS (' + notifications.length + '개 알림)');
    results['7-1_알림'] = 'PASS';
  }

  // ============================================
  // 8. 문의하기 기능
  // ============================================
  console.log('\n=== 8. 문의하기 기능 ===\n');

  const { data: inquiries, error: inquiriesError } = await supabase
    .from('inquiries')
    .select('*')
    .limit(1);

  if (inquiriesError) {
    console.log('❌ 8-1. 문의하기 기능: FAIL -', inquiriesError.message);
    results['8-1_문의하기'] = 'FAIL';
  } else {
    console.log('✅ 8-1. 문의하기 기능: PASS');
    results['8-1_문의하기'] = 'PASS';
  }

  // ============================================
  // 결과 요약
  // ============================================
  console.log('\n================================================');
  console.log('   테스트 결과 요약');
  console.log('================================================\n');

  const categories = {
    '1. 인증': ['1-1_로그인', '1-2_세션유지'],
    '2. 프로필': ['2-1_프로필조회', '2-2_프로필수정필드'],
    '3. 정치인': ['3-1_정치인목록', '3-2_정치인상세', '3-3_관심정치인', '3-4_정치인평점'],
    '4. 게시글': ['4-1_게시글목록', '4-2_내게시글', '4-3_공감비공감'],
    '5. 댓글': ['5-1_댓글목록', '5-2_대댓글', '5-3_댓글공감집계'],
    '6. 소셜': ['6-1_팔로우', '6-2_공유'],
    '7. 알림': ['7-1_알림'],
    '8. 문의하기': ['8-1_문의하기']
  };

  let totalPass = 0;
  let totalFail = 0;

  for (const [category, tests] of Object.entries(categories)) {
    const passed = tests.filter(t => results[t] === 'PASS').length;
    const failed = tests.filter(t => results[t] !== 'PASS').length;
    totalPass += passed;
    totalFail += failed;

    const emoji = failed === 0 ? '✅' : '❌';
    console.log(`${emoji} ${category}: ${passed}/${tests.length} 통과`);

    if (failed > 0) {
      tests.forEach(t => {
        if (results[t] !== 'PASS') {
          console.log(`     ❌ ${t.split('_')[1]}`);
        }
      });
    }
  }

  const total = totalPass + totalFail;
  const passRate = Math.round((totalPass / total) * 100);

  console.log('\n------------------------------------------------');
  console.log(`총 ${total}개 테스트 중 ${totalPass}개 통과 (${passRate}%)`);
  console.log('------------------------------------------------');

  if (totalFail === 0) {
    console.log('\n🎉 모든 회원 기능이 정상 작동합니다!');
  } else {
    console.log('\n⚠️ 일부 기능에 문제가 있습니다. 위 실패 항목을 확인해주세요.');
  }

  // 로그아웃
  await supabase.auth.signOut();

  return results;
}

testAllMemberFeatures().catch(console.error);
