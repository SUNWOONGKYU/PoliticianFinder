// 신규 회원 기능 테스트 (Supabase 직접 연결)
// w2center@naver.com / na5215900

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ooddlafwdpzgxfefgsrx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8';

const TEST_EMAIL = 'w2center@naver.com';
const TEST_PASSWORD = 'na5215900';

async function main() {
  console.log('='.repeat(60));
  console.log('신규 회원 기능 테스트 (Supabase 직접 연결)');
  console.log('='.repeat(60));
  console.log(`계정: ${TEST_EMAIL}`);
  console.log('');

  // Supabase 클라이언트 생성
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // 1. 로그인
  console.log('=== 1. 로그인 ===');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });

  if (authError || !authData.user) {
    console.log('❌ 로그인 실패:', authError?.message);
    return;
  }

  const userId = authData.user.id;
  console.log('✅ 로그인 성공!');
  console.log(`   User ID: ${userId}`);
  console.log('');

  // 2. 프로필 조회 (users 테이블)
  console.log('=== 2. 프로필 조회 ===');
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.log('⚠️ 프로필 조회:', profileError.message);
  } else {
    console.log('✅ 프로필 조회 성공');
    console.log(`   이름: ${profile.name || 'N/A'}`);
    console.log(`   이메일: ${profile.email || 'N/A'}`);
  }
  console.log('');

  // 3. 관심 정치인 목록 조회
  console.log('=== 3. 관심 정치인 목록 조회 ===');
  const { data: favorites, error: favError } = await supabase
    .from('favorite_politicians')
    .select('*, politicians(*)')
    .eq('user_id', userId);

  if (favError) {
    console.log('⚠️ 관심 목록:', favError.message);
  } else {
    console.log('✅ 관심 정치인 목록 조회 성공');
    console.log(`   등록된 관심 정치인: ${favorites?.length || 0}명`);
  }
  console.log('');

  // 4. 관심 정치인 등록 (정원오: 17270f25)
  console.log('=== 4. 관심 정치인 등록 ===');
  const testPoliticianId = '17270f25'; // 정원오
  const { data: addFav, error: addFavError } = await supabase
    .from('favorite_politicians')
    .upsert({ user_id: userId, politician_id: testPoliticianId })
    .select();

  if (addFavError) {
    console.log('⚠️ 관심 등록:', addFavError.message);
  } else {
    console.log('✅ 관심 정치인 등록 성공 (정원오)');
  }
  console.log('');

  // 5. 정치인 평점 등록
  console.log('=== 5. 정치인 평점 등록 ===');
  const { data: rating, error: ratingError } = await supabase
    .from('politician_ratings')
    .upsert({
      user_id: userId,
      politician_id: testPoliticianId,
      rating: 4
    })
    .select();

  if (ratingError) {
    console.log('⚠️ 평점 등록:', ratingError.message);
  } else {
    console.log('✅ 평점 등록 성공 (4점)');
  }
  console.log('');

  // 6. 게시글 작성
  console.log('=== 6. 게시글 작성 ===');
  let createdPostId = null;
  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({
      user_id: userId,
      title: '신규 회원 테스트 게시글',
      content: '이것은 신규 회원 기능 테스트를 위한 게시글입니다.',
      category: 'free'
    })
    .select()
    .single();

  if (postError) {
    console.log('⚠️ 게시글 작성:', postError.message);
  } else {
    createdPostId = post.id;
    console.log('✅ 게시글 작성 성공');
    console.log(`   게시글 ID: ${createdPostId}`);
  }
  console.log('');

  // 7. 게시글 수정
  if (createdPostId) {
    console.log('=== 7. 게시글 수정 ===');
    const { error: updatePostError } = await supabase
      .from('posts')
      .update({
        title: '신규 회원 테스트 게시글 (수정됨)',
        content: '이것은 수정된 게시글입니다.'
      })
      .eq('id', createdPostId);

    if (updatePostError) {
      console.log('⚠️ 게시글 수정:', updatePostError.message);
    } else {
      console.log('✅ 게시글 수정 성공');
    }
    console.log('');
  }

  // 8. 댓글 작성
  console.log('=== 8. 댓글 작성 ===');
  let createdCommentId = null;
  const targetPostId = createdPostId || 1;

  // posts 테이블에 해당 게시글이 있는지 확인
  const { data: existingPost } = await supabase
    .from('posts')
    .select('id')
    .eq('id', targetPostId)
    .single();

  if (existingPost) {
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .insert({
        user_id: userId,
        post_id: targetPostId,
        content: '신규 회원 테스트 댓글입니다.'
      })
      .select()
      .single();

    if (commentError) {
      console.log('⚠️ 댓글 작성:', commentError.message);
    } else {
      createdCommentId = comment.id;
      console.log('✅ 댓글 작성 성공');
      console.log(`   댓글 ID: ${createdCommentId}`);
    }
  } else {
    console.log('⚠️ 댓글 작성: 대상 게시글이 없습니다.');
  }
  console.log('');

  // 9. 알림 목록 조회
  console.log('=== 9. 알림 목록 조회 ===');
  const { data: notifications, error: notiError } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (notiError) {
    console.log('⚠️ 알림 목록:', notiError.message);
  } else {
    console.log('✅ 알림 목록 조회 성공');
    console.log(`   알림 수: ${notifications?.length || 0}개`);
  }
  console.log('');

  // 10. 문의하기
  console.log('=== 10. 문의하기 ===');
  const { error: inquiryError } = await supabase
    .from('inquiries')
    .insert({
      user_id: userId,
      type: 'suggestion',
      title: '신규 회원 테스트 문의',
      content: '이것은 신규 회원 기능 테스트를 위한 문의입니다.',
      email: TEST_EMAIL,
      status: 'pending'
    });

  if (inquiryError) {
    console.log('⚠️ 문의 등록:', inquiryError.message);
  } else {
    console.log('✅ 문의 등록 성공');
  }
  console.log('');

  // 11. 팔로우 기능 테스트 - 다른 사용자 찾기
  console.log('=== 11. 팔로우 기능 ===');
  const { data: otherUsers, error: otherUsersError } = await supabase
    .from('users')
    .select('id, name')
    .neq('id', userId)
    .limit(1);

  if (otherUsersError || !otherUsers?.length) {
    console.log('⚠️ 팔로우할 사용자를 찾을 수 없습니다.');
  } else {
    const targetUserId = otherUsers[0].id;
    const { error: followError } = await supabase
      .from('follows')
      .upsert({
        follower_id: userId,
        following_id: targetUserId
      });

    if (followError) {
      console.log('⚠️ 팔로우:', followError.message);
    } else {
      console.log(`✅ 팔로우 성공 (${otherUsers[0].name})`);

      // 언팔로우
      const { error: unfollowError } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', userId)
        .eq('following_id', targetUserId);

      if (unfollowError) {
        console.log('⚠️ 언팔로우:', unfollowError.message);
      } else {
        console.log('✅ 언팔로우 성공');
      }
    }
  }
  console.log('');

  // 12. 관심 정치인 해제
  console.log('=== 12. 관심 정치인 해제 ===');
  const { error: removeFavError } = await supabase
    .from('favorite_politicians')
    .delete()
    .eq('user_id', userId)
    .eq('politician_id', testPoliticianId);

  if (removeFavError) {
    console.log('⚠️ 관심 해제:', removeFavError.message);
  } else {
    console.log('✅ 관심 정치인 해제 성공');
  }
  console.log('');

  // 13. 댓글 삭제
  if (createdCommentId) {
    console.log('=== 13. 댓글 삭제 ===');
    const { error: deleteCommentError } = await supabase
      .from('comments')
      .delete()
      .eq('id', createdCommentId);

    if (deleteCommentError) {
      console.log('⚠️ 댓글 삭제:', deleteCommentError.message);
    } else {
      console.log('✅ 댓글 삭제 성공');
    }
    console.log('');
  }

  // 14. 게시글 삭제
  if (createdPostId) {
    console.log('=== 14. 게시글 삭제 ===');
    const { error: deletePostError } = await supabase
      .from('posts')
      .delete()
      .eq('id', createdPostId);

    if (deletePostError) {
      console.log('⚠️ 게시글 삭제:', deletePostError.message);
    } else {
      console.log('✅ 게시글 삭제 성공');
    }
    console.log('');
  }

  // 15. 평점 삭제
  console.log('=== 15. 평점 삭제 ===');
  const { error: deleteRatingError } = await supabase
    .from('politician_ratings')
    .delete()
    .eq('user_id', userId)
    .eq('politician_id', testPoliticianId);

  if (deleteRatingError) {
    console.log('⚠️ 평점 삭제:', deleteRatingError.message);
  } else {
    console.log('✅ 평점 삭제 성공');
  }
  console.log('');

  // 16. 로그아웃
  console.log('=== 16. 로그아웃 ===');
  const { error: logoutError } = await supabase.auth.signOut();
  if (logoutError) {
    console.log('⚠️ 로그아웃:', logoutError.message);
  } else {
    console.log('✅ 로그아웃 성공');
  }
  console.log('');

  // 최종 결과
  console.log('='.repeat(60));
  console.log('신규 회원 기능 테스트 완료');
  console.log('='.repeat(60));
}

main().catch(console.error);
