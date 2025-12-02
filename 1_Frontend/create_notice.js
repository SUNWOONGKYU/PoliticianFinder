require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createNotice() {
  console.log('\n공지사항 생성 시작...\n');

  let authorId = null;

  // 관리자 사용자 ID 확인
  const { data: adminUser, error: adminError } = await supabase
    .from('profiles')
    .select('id, username, email')
    .eq('is_admin', true)
    .limit(1)
    .single();

  if (adminError || !adminUser) {
    console.log('⚠️ 관리자 계정이 없습니다. 첫 번째 사용자를 관리자로 설정합니다.');

    // 첫 번째 사용자를 관리자로 설정
    const { data: firstUser } = await supabase
      .from('profiles')
      .select('id, username, email')
      .limit(1)
      .single();

    if (firstUser) {
      await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', firstUser.id);

      console.log(`✅ ${firstUser.email || firstUser.username}를 관리자로 설정했습니다.\n`);
      authorId = firstUser.id;
    }
  } else {
    authorId = adminUser.id;
  }

  // 공지사항 생성
  const notice = {
    title: 'PoliticianFinder 사이트 오픈 안내',
    content: `안녕하세요, PoliticianFinder 관리팀입니다.

정치인 정보 플랫폼 PoliticianFinder가 정식 오픈했습니다.

주요 기능:
- 정치인 프로필 및 활동 내역 조회
- 정치인 평가 및 리뷰
- 커뮤니티 토론 및 의견 공유
- 정책 제안 및 투표

많은 이용 부탁드립니다.

감사합니다.`
  };

  const { data: createdNotice, error: noticeError } = await supabase
    .from('notices')
    .insert(notice)
    .select()
    .single();

  if (noticeError) {
    console.error('❌ 공지사항 생성 실패:', noticeError);
    return;
  }

  console.log('✅ 공지사항 생성 성공!\n');
  console.log('ID:', createdNotice.id);
  console.log('제목:', createdNotice.title);
  console.log('고정:', createdNotice.is_pinned ? '예' : '아니오');
  console.log('\n공지사항 페이지에서 확인하실 수 있습니다.\n');
}

createNotice();
