// 신규 회원 기능 테스트
// w2center@naver.com / na5215900

const BASE_URL = 'https://politician-finder-pf22qonu8-finder-world.vercel.app';
const TEST_EMAIL = 'w2center@naver.com';
const TEST_PASSWORD = 'na5215900';

// Supabase 설정
const SUPABASE_URL = 'https://ooddlafwdpzgxfefgsrx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8';
const PROJECT_REF = 'ooddlafwdpzgxfefgsrx';

async function main() {
  console.log('='.repeat(60));
  console.log('신규 회원 기능 테스트');
  console.log('='.repeat(60));
  console.log(`계정: ${TEST_EMAIL}`);
  console.log('');

  // 1. 로그인해서 토큰 받기
  console.log('=== 1. 로그인 ===');
  const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY
    },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    })
  });

  const loginData = await loginRes.json();
  if (!loginData.access_token) {
    console.log('❌ 로그인 실패:', loginData);
    return;
  }

  const accessToken = loginData.access_token;
  const refreshToken = loginData.refresh_token;
  const userId = loginData.user.id;
  console.log('✅ 로그인 성공!');
  console.log(`   User ID: ${userId}`);
  console.log('');

  // Authorization 헤더로 토큰 전달 (Bearer token)
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  };

  // 2. 프로필 조회
  console.log('=== 2. 프로필 조회 ===');
  try {
    const profileRes = await fetch(`${BASE_URL}/api/user/profile`, {
      headers: authHeaders
    });
    const profileData = await profileRes.json();
    if (profileRes.ok) {
      console.log('✅ 프로필 조회 성공');
      const user = profileData.data?.user || profileData;
      console.log(`   이름: ${user.name || 'N/A'}`);
      console.log(`   이메일: ${user.email || 'N/A'}`);
    } else {
      console.log('⚠️ 프로필 조회:', profileData.error || profileData);
    }
  } catch (e) {
    console.log('❌ 프로필 조회 오류:', e.message);
  }
  console.log('');

  // 3. 관심 정치인 목록 조회
  console.log('=== 3. 관심 정치인 목록 조회 ===');
  try {
    const favRes = await fetch(`${BASE_URL}/api/favorites`, {
      headers: authHeaders
    });
    const favData = await favRes.json();
    if (favRes.ok) {
      console.log('✅ 관심 정치인 목록 조회 성공');
      console.log(`   등록된 관심 정치인: ${favData.data?.favorites?.length || favData.favorites?.length || 0}명`);
    } else {
      console.log('⚠️ 관심 목록:', favData.error || favData);
    }
  } catch (e) {
    console.log('❌ 관심 목록 오류:', e.message);
  }
  console.log('');

  // 4. 관심 정치인 등록 (정원오: 17270f25)
  console.log('=== 4. 관심 정치인 등록 ===');
  const testPoliticianId = '17270f25'; // 정원오
  try {
    const addFavRes = await fetch(`${BASE_URL}/api/favorites`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ politician_id: testPoliticianId })
    });
    const addFavData = await addFavRes.json();
    if (addFavRes.ok) {
      console.log('✅ 관심 정치인 등록 성공 (정원오)');
    } else {
      console.log('⚠️ 관심 등록:', addFavData.error || addFavData);
    }
  } catch (e) {
    console.log('❌ 관심 등록 오류:', e.message);
  }
  console.log('');

  // 5. 정치인 평점 등록
  console.log('=== 5. 정치인 평점 등록 ===');
  try {
    const ratingRes = await fetch(`${BASE_URL}/api/ratings/${testPoliticianId}`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ rating: 4 })
    });
    const ratingData = await ratingRes.json();
    if (ratingRes.ok) {
      console.log('✅ 평점 등록 성공 (4점)');
    } else {
      console.log('⚠️ 평점 등록:', ratingData.error || ratingData);
    }
  } catch (e) {
    console.log('❌ 평점 등록 오류:', e.message);
  }
  console.log('');

  // 6. 게시글 작성
  console.log('=== 6. 게시글 작성 ===');
  let createdPostId = null;
  try {
    const postRes = await fetch(`${BASE_URL}/api/posts`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        subject: '신규 회원 테스트 게시글입니다', // 최소 5자
        content: '이것은 신규 회원 기능 테스트를 위한 게시글입니다. 테스트 내용 추가합니다.', // 최소 10자
        category: 'general',
        politician_id: testPoliticianId
      })
    });
    const postData = await postRes.json();
    if (postRes.ok && postData.success && postData.data) {
      createdPostId = postData.data.id || postData.data.post?.id;
      console.log('✅ 게시글 작성 성공');
      console.log(`   게시글 ID: ${createdPostId}`);
    } else {
      console.log('⚠️ 게시글 작성:', postData.error || postData);
    }
  } catch (e) {
    console.log('❌ 게시글 작성 오류:', e.message);
  }
  console.log('');

  // 7. 게시글 수정
  if (createdPostId) {
    console.log('=== 7. 게시글 수정 ===');
    try {
      const updatePostRes = await fetch(`${BASE_URL}/api/posts/${createdPostId}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
          subject: '신규 회원 테스트 게시글 (수정됨)',
          content: '이것은 수정된 게시글입니다. 수정된 테스트 내용을 추가합니다.'
        })
      });
      const updatePostData = await updatePostRes.json();
      if (updatePostRes.ok) {
        console.log('✅ 게시글 수정 성공');
      } else {
        console.log('⚠️ 게시글 수정:', updatePostData.error || updatePostData);
      }
    } catch (e) {
      console.log('❌ 게시글 수정 오류:', e.message);
    }
    console.log('');
  }

  // 8. 댓글 작성
  console.log('=== 8. 댓글 작성 ===');
  let createdCommentId = null;
  const targetPostId = createdPostId ? String(createdPostId) : null;
  if (targetPostId) {
    try {
      const commentRes = await fetch(`${BASE_URL}/api/comments`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          post_id: targetPostId, // 문자열로 전달
          content: '신규 회원 테스트 댓글입니다.'
        })
      });
      const commentData = await commentRes.json();
      if (commentRes.ok && commentData.success && commentData.data) {
        createdCommentId = commentData.data.id || commentData.data.comment?.id;
        console.log('✅ 댓글 작성 성공');
        console.log(`   댓글 ID: ${createdCommentId}`);
      } else {
        console.log('⚠️ 댓글 작성:', commentData.error || commentData);
      }
    } catch (e) {
      console.log('❌ 댓글 작성 오류:', e.message);
    }
  } else {
    console.log('⚠️ 댓글 작성: 테스트할 게시글이 없습니다.');
  }
  console.log('');

  // 9. 알림 목록 조회
  console.log('=== 9. 알림 목록 조회 ===');
  try {
    const notiRes = await fetch(`${BASE_URL}/api/notifications`, {
      headers: authHeaders
    });
    const notiData = await notiRes.json();
    if (notiRes.ok) {
      console.log('✅ 알림 목록 조회 성공');
      console.log(`   알림 수: ${notiData.data?.notifications?.length || notiData.notifications?.length || 0}개`);
    } else {
      console.log('⚠️ 알림 목록:', notiData.error || notiData);
    }
  } catch (e) {
    console.log('❌ 알림 목록 오류:', e.message);
  }
  console.log('');

  // 10. 문의하기
  console.log('=== 10. 문의하기 ===');
  try {
    const inquiryRes = await fetch(`${BASE_URL}/api/inquiries`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'w2center',
        email: TEST_EMAIL,
        phone: '',
        subject: '신규 회원 테스트 문의',
        message: '이것은 신규 회원 기능 테스트를 위한 문의입니다.'
      })
    });
    const inquiryData = await inquiryRes.json();
    if (inquiryRes.ok) {
      console.log('✅ 문의 등록 성공');
    } else {
      console.log('⚠️ 문의 등록:', inquiryData.error || inquiryData);
    }
  } catch (e) {
    console.log('❌ 문의 등록 오류:', e.message);
  }
  console.log('');

  // 11. 관심 정치인 해제
  console.log('=== 11. 관심 정치인 해제 ===');
  try {
    const removeFavRes = await fetch(`${BASE_URL}/api/favorites?politician_id=${testPoliticianId}`, {
      method: 'DELETE',
      headers: authHeaders
    });
    const removeFavData = await removeFavRes.json();
    if (removeFavRes.ok) {
      console.log('✅ 관심 정치인 해제 성공');
    } else {
      console.log('⚠️ 관심 해제:', removeFavData.error || removeFavData);
    }
  } catch (e) {
    console.log('❌ 관심 해제 오류:', e.message);
  }
  console.log('');

  // 12. 댓글 삭제
  if (createdCommentId) {
    console.log('=== 12. 댓글 삭제 ===');
    try {
      const deleteCommentRes = await fetch(`${BASE_URL}/api/comments/${createdCommentId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      const deleteCommentData = await deleteCommentRes.json();
      if (deleteCommentRes.ok) {
        console.log('✅ 댓글 삭제 성공');
      } else {
        console.log('⚠️ 댓글 삭제:', deleteCommentData.error || deleteCommentData);
      }
    } catch (e) {
      console.log('❌ 댓글 삭제 오류:', e.message);
    }
    console.log('');
  }

  // 13. 게시글 삭제
  if (createdPostId) {
    console.log('=== 13. 게시글 삭제 ===');
    try {
      const deletePostRes = await fetch(`${BASE_URL}/api/posts/${createdPostId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      const deletePostData = await deletePostRes.json();
      if (deletePostRes.ok) {
        console.log('✅ 게시글 삭제 성공');
      } else {
        console.log('⚠️ 게시글 삭제:', deletePostData.error || deletePostData);
      }
    } catch (e) {
      console.log('❌ 게시글 삭제 오류:', e.message);
    }
    console.log('');
  }

  // 최종 결과
  console.log('='.repeat(60));
  console.log('신규 회원 기능 테스트 완료');
  console.log('='.repeat(60));
}

main().catch(console.error);
