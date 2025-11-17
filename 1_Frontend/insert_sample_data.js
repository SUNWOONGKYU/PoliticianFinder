// Insert sample data into Supabase (notices and notifications)
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/\s/g, '');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function insertSampleData() {
  console.log('Starting data insertion...\n');

  try {
    // 1. Insert notices
    console.log('Inserting notices...');
    const noticesData = [
      {
        title: '🎉 PoliticianFinder 서비스 오픈 안내',
        content: `안녕하세요. PoliticianFinder 팀입니다.

우리 지역 정치인을 쉽게 찾고 소통할 수 있는 PoliticianFinder 서비스를 공식 오픈하게 되었습니다.

주요 기능:
- 지역별, 당별 정치인 검색
- 정치인 활동 내역 및 공약 확인
- 커뮤니티를 통한 시민 의견 교류
- 정치인과의 직접 소통 창구

많은 관심과 이용 부탁드립니다. 감사합니다.`,
        author_id: null,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: '📢 서비스 이용약관 변경 안내',
        content: `2025년 2월 1일부터 변경된 서비스 이용약관이 적용됩니다.

주요 변경사항:
1. 개인정보 처리방침 업데이트
2. 커뮤니티 게시글 작성 가이드라인 추가
3. 정치인 인증 절차 강화

자세한 내용은 공지사항 상세 페이지에서 확인하실 수 있습니다.

변경된 약관에 동의하지 않으시는 경우, 서비스 이용이 제한될 수 있습니다.`,
        author_id: null,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: '🔧 시스템 점검 안내 (2025.02.05)',
        content: `안녕하세요. PoliticianFinder 운영팀입니다.

서비스 품질 향상을 위한 시스템 점검을 실시합니다.

[점검 일시]
2025년 2월 5일 (수) 02:00 ~ 06:00 (약 4시간)

[점검 내용]
- 서버 안정화 작업
- 검색 성능 개선
- 보안 패치 적용

점검 시간 동안 서비스 이용이 일시 중단됩니다.
이용에 불편을 드려 죄송합니다.`,
        author_id: null,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: '✨ 새로운 기능 업데이트 안내',
        content: `사용자 여러분의 의견을 반영하여 새로운 기능들을 추가했습니다.

[업데이트 내용]
1. 정치인 프로필 페이지 개선
2. 커뮤니티 게시글 검색 기능 추가
3. 알림 설정 세부화
4. 모바일 UI/UX 개선

계속해서 더 나은 서비스를 제공하기 위해 노력하겠습니다.
감사합니다.`,
        author_id: null,
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        title: '📱 모바일 앱 출시 예정',
        content: `PoliticianFinder 모바일 앱이 곧 출시됩니다!

[출시 예정일]
- Android: 2025년 3월 초
- iOS: 2025년 3월 중순

모바일 앱에서는 더욱 편리하게 정치인 정보를 확인하고,
푸시 알림을 통해 중요한 소식을 빠르게 받아보실 수 있습니다.

많은 기대 부탁드립니다!`,
        author_id: null,
        created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const { data: noticesInserted, error: noticesError } = await supabase
      .from('notices')
      .insert(noticesData)
      .select();

    if (noticesError) {
      console.error('Error inserting notices:', noticesError);
    } else {
      console.log(`✅ Successfully inserted ${noticesInserted.length} notices\n`);
    }

    // 2. Get user IDs for notifications
    console.log('Fetching user IDs...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, role')
      .limit(2);

    if (usersError || !users || users.length === 0) {
      console.error('No users found. Skipping notifications insertion.');
      console.log('Please create at least one user account first.');
      return;
    }

    // Use first user (preferably admin, otherwise any user)
    const targetUser = users.find(u => u.role === 'admin') || users[0];
    console.log(`Using user ID: ${targetUser.id} (role: ${targetUser.role})\n`);

    // 3. Insert notifications
    console.log('Inserting notifications...');
    const notificationsData = [
      {
        user_id: targetUser.id,
        type: 'system',
        title: '🎉 PoliticianFinder에 오신 것을 환영합니다',
        message: '회원가입을 축하드립니다! PoliticianFinder에서 우리 지역 정치인을 만나보세요.',
        link: '/politicians',
        is_read: false,
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      },
      {
        user_id: targetUser.id,
        type: 'system',
        title: '📢 새로운 공지사항이 등록되었습니다',
        message: '서비스 이용약관 변경 안내 - 2025년 2월 1일부터 변경된 약관이 적용됩니다.',
        link: '/notices',
        is_read: false,
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      },
      {
        user_id: targetUser.id,
        type: 'comment',
        title: '💬 새 댓글이 달렸습니다',
        message: '회원님이 작성한 게시글에 새로운 댓글이 달렸습니다.',
        link: '/community/posts',
        is_read: false,
        created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      },
      {
        user_id: targetUser.id,
        type: 'post_like',
        title: '👍 게시글에 공감을 받았습니다',
        message: '회원님의 게시글에 3명이 공감을 표시했습니다.',
        link: '/community/posts',
        is_read: false,
        created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      },
      {
        user_id: targetUser.id,
        type: 'system',
        title: '🔔 알림 설정을 확인해주세요',
        message: '알림 수신 설정을 통해 원하는 알림만 받아보실 수 있습니다.',
        link: '/settings',
        is_read: true,
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        user_id: targetUser.id,
        type: 'follow',
        title: '✨ 새로운 정치인 활동',
        message: '관심 정치인이 새로운 게시글을 작성했습니다.',
        link: '/politicians',
        is_read: true,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        user_id: targetUser.id,
        type: 'system',
        title: '📱 모바일 앱 출시 예정 안내',
        message: 'PoliticianFinder 모바일 앱이 3월에 출시됩니다!',
        link: '/notices',
        is_read: true,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const { data: notificationsInserted, error: notificationsError } = await supabase
      .from('notifications')
      .insert(notificationsData)
      .select();

    if (notificationsError) {
      console.error('Error inserting notifications:', notificationsError);
    } else {
      console.log(`✅ Successfully inserted ${notificationsInserted.length} notifications\n`);
    }

    console.log('✅ All sample data inserted successfully!');
    console.log('\nYou can now view:');
    console.log('- Notices: https://www.politicianfinder.ai.kr/notices');
    console.log('- Notifications: https://www.politicianfinder.ai.kr/notifications');
  } catch (error) {
    console.error('Error:', error);
  }
}

insertSampleData();
