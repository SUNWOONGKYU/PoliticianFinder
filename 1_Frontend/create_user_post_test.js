/**
 * 회원 게시글 생성 테스트
 * 일반 회원 게시글을 데이터베이스에 직접 삽입
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Supabase Admin Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yqihnwqljtrddxhvmpkz.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 테스트용 회원 게시글 데이터
const USER_POSTS = [
  {
    title: '[테스트] 청년 정책에 대한 의견',
    content: '최근 청년 정책들이 많이 나오고 있는데, 실효성이 있을지 궁금합니다. 여러분은 어떻게 생각하시나요?',
    category: 'general',
  },
  {
    title: '[질문] 지역구 의원 활동은 어디서 확인하나요?',
    content: '제가 사는 지역의 의원 활동 내역을 확인하고 싶은데 어디서 볼 수 있을까요?',
    category: 'general',
  },
  {
    title: '[의견] 정치인 평가 시스템 정말 좋네요',
    content: '이 사이트에서 정치인들을 객관적으로 평가할 수 있어서 좋습니다. 투표할 때 큰 도움이 될 것 같아요!',
    category: 'general',
  },
];

async function createUserPosts() {
  console.log('\\n========================================');
  console.log('회원 게시글 생성 테스트');
  console.log('========================================\\n');

  try {
    // 1. 테스트용 사용자 ID 가져오기 (첫 번째 사용자 사용)
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id, username')
      .limit(1);

    if (userError || !users || users.length === 0) {
      console.log('❌ 사용자를 찾을 수 없습니다. 먼저 회원가입을 해주세요.');
      return;
    }

    const testUser = users[0];
    console.log(`✅ 테스트 사용자: ${testUser.username} (${testUser.id})`);

    // 2. 회원 게시글 생성
    for (const postData of USER_POSTS) {
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: testUser.id,
          politician_id: null,  // 회원 게시글이므로 null
          author_type: 'user',
          title: postData.title,
          content: postData.content,
          category: postData.category,
          moderation_status: 'approved',  // 즉시 승인
        })
        .select()
        .single();

      if (postError) {
        console.log(`❌ 게시글 생성 실패: ${postError.message}`);
        continue;
      }

      console.log(`✅ 게시글 생성 성공: ${post.title}`);
    }

    console.log('\\n========================================');
    console.log('✅ 모든 회원 게시글 생성 완료!');
    console.log('========================================\\n');
    console.log('이제 커뮤니티 페이지에서 회원 게시글을 확인할 수 있습니다.');
    console.log('👉 https://politicianfinder.com/community\\n');

  } catch (error) {
    console.error('\\n❌ 오류 발생:', error.message);
    console.error(error);
  }
}

// 실행
createUserPosts();
