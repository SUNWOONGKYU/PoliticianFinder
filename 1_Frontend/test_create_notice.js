// 공지사항 작성 테스트
const SUPABASE_URL = 'https://ooddlafwdpzgxfefgsrx.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU';

async function getAdminUserId() {
  console.log('1️⃣ 관리자 user_id 확인 중...');
  const response = await fetch(`${SUPABASE_URL}/rest/v1/users?role=eq.admin&select=user_id,email,name`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
  });

  const data = await response.json();
  if (data && data.length > 0) {
    console.log(`✅ 관리자 발견: ${data[0].email} (${data[0].name})`);
    console.log(`   user_id: ${data[0].user_id}`);
    return data[0].user_id;
  }

  throw new Error('관리자 계정을 찾을 수 없습니다.');
}

async function createNotice(userId) {
  console.log('\n2️⃣ 공지사항 작성 중...');

  const notice = {
    user_id: userId,
    title: '[공지] 사이트 오픈 안내',
    content: `안녕하세요, PoliticianFinder 관리자입니다.

사이트가 정식으로 오픈되었습니다!

주요 기능:
- 정치인 검색 및 정보 확인
- 커뮤니티 게시글 작성 및 댓글
- 정치인 즐겨찾기
- AI 기반 정치인 평가

많은 이용 부탁드립니다.

감사합니다.`,
    category: 'general',
    is_pinned: true,  // 공지사항으로 설정
    is_locked: false,
    view_count: 0,
    comment_count: 0,
    share_count: 0,
    upvotes: 0,
    downvotes: 0,
    moderation_status: 'approved',
    politician_id: null,
    tags: ['공지', '안내'],
  };

  const response = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(notice),
  });

  const data = await response.json();

  if (response.ok) {
    console.log('✅ 공지사항 작성 성공!');
    console.log(`   게시글 ID: ${data[0].id}`);
    console.log(`   제목: ${data[0].title}`);
    console.log(`   is_pinned: ${data[0].is_pinned}`);
    return data[0];
  } else {
    console.log('❌ 공지사항 작성 실패:');
    console.log(JSON.stringify(data, null, 2));
    throw new Error('공지사항 작성 실패');
  }
}

async function verifyNotice() {
  console.log('\n3️⃣ 공지사항 조회 확인 중...');

  const response = await fetch(`${SUPABASE_URL}/rest/v1/posts?is_pinned=eq.true&select=id,title,is_pinned,created_at`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
  });

  const data = await response.json();

  if (response.ok && data.length > 0) {
    console.log(`✅ 공지사항 조회 성공! (${data.length}개)`);
    data.forEach((notice, i) => {
      console.log(`   ${i+1}. ${notice.title}`);
      console.log(`      ID: ${notice.id}`);
      console.log(`      is_pinned: ${notice.is_pinned}`);
    });
    return data;
  } else {
    console.log('⚠️ 공지사항이 없습니다.');
    return [];
  }
}

async function createMultipleNotices(userId) {
  console.log('\n4️⃣ 추가 공지사항 작성 중...');

  const notices = [
    {
      user_id: userId,
      title: '[공지] 커뮤니티 이용 규칙',
      content: `커뮤니티 이용 규칙을 안내드립니다.

1. 상호 존중: 다른 사용자를 존중해 주세요.
2. 정확한 정보: 사실에 기반한 정보를 공유해 주세요.
3. 건전한 토론: 건전한 정치 토론 문화를 만들어 갑시다.
4. 개인정보 보호: 개인정보를 공유하지 마세요.

위반 시 게시글 삭제 및 계정 정지될 수 있습니다.`,
      category: 'general',
      is_pinned: true,
      is_locked: true, // 댓글 잠금
      moderation_status: 'approved',
      upvotes: 0,
      downvotes: 0,
      tags: ['공지', '규칙'],
    },
    {
      user_id: userId,
      title: '[이벤트] 신규 회원 포인트 지급 이벤트',
      content: `🎉 신규 회원 가입 이벤트!

기간: 2025년 11월 30일 ~ 12월 31일
혜택:
- 신규 가입 시 1,000 포인트 지급
- 첫 게시글 작성 시 500 포인트 추가
- 첫 댓글 작성 시 200 포인트 추가

많은 참여 부탁드립니다!`,
      category: 'general',
      is_pinned: true,
      is_locked: false,
      moderation_status: 'approved',
      upvotes: 0,
      downvotes: 0,
      tags: ['이벤트', '포인트'],
    },
  ];

  const results = [];
  for (const notice of notices) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(notice),
    });

    const data = await response.json();
    if (response.ok) {
      console.log(`✅ "${data[0].title}" 작성 성공`);
      results.push(data[0]);
    } else {
      console.log(`❌ "${notice.title}" 작성 실패`);
    }
  }

  return results;
}

async function main() {
  console.log('═'.repeat(80));
  console.log('공지사항 작성 테스트');
  console.log('═'.repeat(80));
  console.log();

  try {
    // 1. 관리자 user_id 확인
    const adminUserId = await getAdminUserId();

    // 2. 첫 번째 공지사항 작성
    await createNotice(adminUserId);

    // 3. 공지사항 조회 확인
    await verifyNotice();

    // 4. 추가 공지사항 작성
    await createMultipleNotices(adminUserId);

    // 5. 최종 확인
    console.log('\n5️⃣ 최종 공지사항 목록 확인');
    console.log('─'.repeat(80));
    const finalNotices = await verifyNotice();

    console.log('\n═'.repeat(80));
    console.log('✅ 테스트 완료!');
    console.log(`   총 ${finalNotices.length}개의 공지사항이 작성되었습니다.`);
    console.log('═'.repeat(80));

  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
  }
}

main();
