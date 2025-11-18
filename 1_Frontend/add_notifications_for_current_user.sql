-- ===========================
-- 현재 로그인한 사용자에게 알림 추가
-- ===========================
-- 실행 전: Supabase Dashboard에서 로그인한 사용자의 ID를 확인하세요
-- auth.users 테이블에서 email로 검색하여 id를 복사하세요

-- 여기에 현재 로그인한 사용자의 ID를 입력하세요
-- 예: DO $$ DECLARE current_user_id UUID := 'YOUR-USER-ID-HERE';

DO $$
DECLARE
    -- 방법 1: 이메일로 사용자 찾기
    current_user_id UUID;
BEGIN
    -- 사용자 ID 가져오기 (첫 번째 사용자 또는 특정 이메일)
    -- 옵션 1: 첫 번째 사용자
    SELECT id INTO current_user_id FROM auth.users ORDER BY created_at LIMIT 1;

    -- 옵션 2: 특정 이메일로 찾기 (아래 주석 해제하고 이메일 입력)
    -- SELECT id INTO current_user_id FROM auth.users WHERE email = 'your-email@example.com';

    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found!';
    END IF;

    RAISE NOTICE 'Adding notifications for user: %', current_user_id;

    -- 기존 알림 삭제 (선택사항)
    DELETE FROM notifications WHERE user_id = current_user_id;

    -- 새 알림 추가
    INSERT INTO notifications (user_id, type, content, target_url, is_read, created_at) VALUES
    (current_user_id, 'system', '🎉 PoliticianFinder에 오신 것을 환영합니다! 우리 지역 정치인을 만나보세요.', '/politicians', false, NOW() - INTERVAL '1 hour'),
    (current_user_id, 'system', '📢 새로운 공지사항이 등록되었습니다. 서비스 이용약관 변경 안내를 확인해주세요.', '/notices', false, NOW() - INTERVAL '3 hours'),
    (current_user_id, 'comment', '💬 새 댓글이 달렸습니다. 회원님이 작성한 게시글에 새로운 댓글이 달렸습니다.', '/community/posts', false, NOW() - INTERVAL '5 hours'),
    (current_user_id, 'reply', '💭 댓글에 답글이 달렸습니다. 회원님의 댓글에 3명이 답글을 작성했습니다.', '/community/posts', false, NOW() - INTERVAL '8 hours'),
    (current_user_id, 'system', '🔔 알림 설정을 확인해주세요. 원하는 알림만 받아보실 수 있습니다.', '/settings', true, NOW() - INTERVAL '1 day'),
    (current_user_id, 'mention', '✨ 게시글에서 언급되었습니다. 관심 있는 게시글에서 회원님이 언급되었습니다.', '/community/posts', true, NOW() - INTERVAL '2 days'),
    (current_user_id, 'system', '📱 모바일 앱 출시 예정 안내. PoliticianFinder 모바일 앱이 3월에 출시됩니다!', '/notices', true, NOW() - INTERVAL '3 days');

    RAISE NOTICE 'Successfully added 7 notifications!';
END $$;
