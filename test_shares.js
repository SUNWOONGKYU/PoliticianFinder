const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ooddlafwdpzgxfefgsrx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8'
);

const TEST_EMAIL = 'wksun99@gmail.com';
const TEST_PASSWORD = 'na5215900';

async function testShares() {
  console.log('=== 공유 기능 테스트 ===\n');

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

  // 기존 게시글 가져오기
  const { data: posts } = await supabase.from('posts').select('id').limit(1);
  if (!posts || posts.length === 0) {
    console.log('❌ 테스트할 게시글이 없습니다');
    return;
  }
  const postId = posts[0].id;
  console.log('테스트 게시글 ID:', postId);

  // 공유 등록 (올바른 컬럼 사용: post_id)
  const { data: share, error: shareError } = await supabase
    .from('shares')
    .insert({
      user_id: auth.user.id,
      post_id: postId,
      platform: 'link'
    })
    .select()
    .single();

  if (shareError) {
    console.log('❌ 공유 등록 실패:', shareError.message);
  } else {
    console.log('✅ 공유 등록 성공:', share.id);
  }

  // 공유 목록 조회
  const { data: shares, error: sharesError } = await supabase
    .from('shares')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (sharesError) {
    console.log('❌ 공유 목록 조회 실패:', sharesError.message);
  } else {
    console.log('\n현재 공유 기록 (최근 5개):');
    shares.forEach(s => {
      console.log(`  - ${s.platform} | post:${s.post_id?.substring(0,8) || 'N/A'} | pol:${s.politician_id || 'N/A'} | ${s.created_at}`);
    });
  }

  // 정치인 공유 테스트
  console.log('\n=== 정치인 공유 테스트 ===');
  const { data: share2, error: share2Error } = await supabase
    .from('shares')
    .insert({
      user_id: auth.user.id,
      politician_id: '17270f25', // 정원오
      platform: 'kakao'
    })
    .select()
    .single();

  if (share2Error) {
    console.log('❌ 정치인 공유 등록 실패:', share2Error.message);
  } else {
    console.log('✅ 정치인 공유 등록 성공:', share2.id);
  }
}

testShares();
