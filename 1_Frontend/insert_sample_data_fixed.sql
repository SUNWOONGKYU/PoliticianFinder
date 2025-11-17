-- 공지사항 샘플 데이터 (notices 테이블)
INSERT INTO notices (title, content, author_id, created_at, updated_at) VALUES
('🎉 PoliticianFinder 서비스 오픈 안내', '안녕하세요. PoliticianFinder 팀입니다.

우리 지역 정치인을 쉽게 찾고 소통할 수 있는 PoliticianFinder 서비스를 공식 오픈하게 되었습니다.

주요 기능:
- 지역별, 당별 정치인 검색
- 정치인 활동 내역 및 공약 확인
- 커뮤니티를 통한 시민 의견 교류
- 정치인과의 직접 소통 창구

많은 관심과 이용 부탁드립니다. 감사합니다.', NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

('📢 서비스 이용약관 변경 안내', '2025년 2월 1일부터 변경된 서비스 이용약관이 적용됩니다.

주요 변경사항:
1. 개인정보 처리방침 업데이트
2. 커뮤니티 게시글 작성 가이드라인 추가
3. 정치인 인증 절차 강화

자세한 내용은 공지사항 상세 페이지에서 확인하실 수 있습니다.

변경된 약관에 동의하지 않으시는 경우, 서비스 이용이 제한될 수 있습니다.', NULL, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

('🔧 시스템 점검 안내 (2025.02.05)', '안녕하세요. PoliticianFinder 운영팀입니다.

서비스 품질 향상을 위한 시스템 점검을 실시합니다.

[점검 일시]
2025년 2월 5일 (수) 02:00 ~ 06:00 (약 4시간)

[점검 내용]
- 서버 안정화 작업
- 검색 성능 개선
- 보안 패치 적용

점검 시간 동안 서비스 이용이 일시 중단됩니다.
이용에 불편을 드려 죄송합니다.', NULL, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),

('✨ 새로운 기능 업데이트 안내', '사용자 여러분의 의견을 반영하여 새로운 기능들을 추가했습니다.

[업데이트 내용]
1. 정치인 프로필 페이지 개선
2. 커뮤니티 게시글 검색 기능 추가
3. 알림 설정 세부화
4. 모바일 UI/UX 개선

계속해서 더 나은 서비스를 제공하기 위해 노력하겠습니다.
감사합니다.', NULL, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),

('📱 모바일 앱 출시 예정', 'PoliticianFinder 모바일 앱이 곧 출시됩니다!

[출시 예정일]
- Android: 2025년 3월 초
- iOS: 2025년 3월 중순

모바일 앱에서는 더욱 편리하게 정치인 정보를 확인하고,
푸시 알림을 통해 중요한 소식을 빠르게 받아보실 수 있습니다.

많은 기대 부탁드립니다!', NULL, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days');

-- 알림 샘플 데이터 (notifications 테이블)
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- admin 또는 첫 번째 사용자 ID 가져오기
    SELECT user_id INTO target_user_id 
    FROM users 
    WHERE role = 'admin' OR role = 'user'
    ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END
    LIMIT 1;
    
    -- 사용자가 있으면 알림 데이터 삽입
    IF target_user_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, message, link, is_read, created_at) VALUES
        (target_user_id, 'system', '🎉 PoliticianFinder에 오신 것을 환영합니다', '회원가입을 축하드립니다! PoliticianFinder에서 우리 지역 정치인을 만나보세요.', '/politicians', false, NOW() - INTERVAL '1 hour'),
        (target_user_id, 'system', '📢 새로운 공지사항이 등록되었습니다', '서비스 이용약관 변경 안내 - 2025년 2월 1일부터 변경된 약관이 적용됩니다.', '/notices', false, NOW() - INTERVAL '3 hours'),
        (target_user_id, 'comment', '💬 새 댓글이 달렸습니다', '회원님이 작성한 게시글에 새로운 댓글이 달렸습니다.', '/community/posts', false, NOW() - INTERVAL '5 hours'),
        (target_user_id, 'post_like', '👍 게시글에 공감을 받았습니다', '회원님의 게시글에 3명이 공감을 표시했습니다.', '/community/posts', false, NOW() - INTERVAL '8 hours'),
        (target_user_id, 'system', '🔔 알림 설정을 확인해주세요', '알림 수신 설정을 통해 원하는 알림만 받아보실 수 있습니다.', '/settings', true, NOW() - INTERVAL '1 day'),
        (target_user_id, 'follow', '✨ 새로운 정치인 활동', '관심 정치인이 새로운 게시글을 작성했습니다.', '/politicians', true, NOW() - INTERVAL '2 days'),
        (target_user_id, 'system', '📱 모바일 앱 출시 예정 안내', 'PoliticianFinder 모바일 앱이 3월에 출시됩니다!', '/notices', true, NOW() - INTERVAL '3 days');
        
        RAISE NOTICE 'Inserted notifications for user_id: %', target_user_id;
    ELSE
        RAISE NOTICE 'No users found. Skipping notifications insertion.';
    END IF;
END $$;
