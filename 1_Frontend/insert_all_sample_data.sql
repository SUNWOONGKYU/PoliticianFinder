-- ===========================
-- 공지사항 + 알림 + 댓글 샘플 데이터 통합
-- ===========================

-- 1. 공지사항 데이터
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

자세한 내용은 공지사항 상세 페이지에서 확인하실 수 있습니다.', NULL, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

('🔧 시스템 점검 안내 (2025.02.05)', '안녕하세요. PoliticianFinder 운영팀입니다.

서비스 품질 향상을 위한 시스템 점검을 실시합니다.

[점검 일시]
2025년 2월 5일 (수) 02:00 ~ 06:00 (약 4시간)

점검 시간 동안 서비스 이용이 일시 중단됩니다.', NULL, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),

('✨ 새로운 기능 업데이트 안내', '사용자 여러분의 의견을 반영하여 새로운 기능들을 추가했습니다.

[업데이트 내용]
1. 정치인 프로필 페이지 개선
2. 커뮤니티 게시글 검색 기능 추가
3. 알림 설정 세부화
4. 모바일 UI/UX 개선

감사합니다.', NULL, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),

('📱 모바일 앱 출시 예정', 'PoliticianFinder 모바일 앱이 곧 출시됩니다!

[출시 예정일]
- Android: 2025년 3월 초
- iOS: 2025년 3월 중순

많은 기대 부탁드립니다!', NULL, NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days');

-- 2. 알림 데이터 (content + target_url 사용)
DO $$
DECLARE
    target_auth_id UUID;
BEGIN
    SELECT id INTO target_auth_id FROM auth.users LIMIT 1;
    
    IF target_auth_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, content, target_url, is_read, created_at) VALUES
        (target_auth_id, 'system', '🎉 PoliticianFinder에 오신 것을 환영합니다! 우리 지역 정치인을 만나보세요.', '/politicians', false, NOW() - INTERVAL '1 hour'),
        (target_auth_id, 'system', '📢 새로운 공지사항이 등록되었습니다. 서비스 이용약관 변경 안내를 확인해주세요.', '/notices', false, NOW() - INTERVAL '3 hours'),
        (target_auth_id, 'comment', '💬 새 댓글이 달렸습니다. 회원님이 작성한 게시글에 새로운 댓글이 달렸습니다.', '/community/posts', false, NOW() - INTERVAL '5 hours'),
        (target_auth_id, 'post_like', '👍 게시글에 공감을 받았습니다. 회원님의 게시글에 3명이 공감을 표시했습니다.', '/community/posts', false, NOW() - INTERVAL '8 hours'),
        (target_auth_id, 'system', '🔔 알림 설정을 확인해주세요. 원하는 알림만 받아보실 수 있습니다.', '/settings', true, NOW() - INTERVAL '1 day'),
        (target_auth_id, 'follow', '✨ 새로운 정치인 활동이 있습니다. 관심 정치인이 새로운 게시글을 작성했습니다.', '/politicians', true, NOW() - INTERVAL '2 days'),
        (target_auth_id, 'system', '📱 모바일 앱 출시 예정 안내. PoliticianFinder 모바일 앱이 3월에 출시됩니다!', '/notices', true, NOW() - INTERVAL '3 days');
        
        RAISE NOTICE 'Inserted notifications for user: %', target_auth_id;
    END IF;
END $$;

-- 3. 댓글 데이터
DO $$
DECLARE
    post1_id UUID := '49601956-baeb-43ec-892e-f032b9b66ae7';
    post2_id UUID := 'a9a925e0-06e6-4ff8-8ecb-8a9545566818';
    post3_id UUID := '20c5c875-bdc6-4771-9e83-f5be6532a26b';
    post4_id UUID := 'cafc0c81-02f5-4be0-8309-af57549b28aa';
    post5_id UUID := '46366325-3a02-4baf-bbb6-1aeb046f5f97';
    
    user1_id UUID := 'fd96b732-ea3c-4f4f-89dc-81654b8189bc';
    user2_id UUID := '3c8e4e6b-0f17-452d-8e51-1057bcf12c36';
    user3_id UUID := 'e79307b9-2981-434b-bf63-db7f0eba2e76';
    user4_id UUID := '9b7a33d3-ead2-4a6b-94bf-98b7ca442f89';
    user5_id UUID := 'a67beb5d-86aa-4beb-8688-5ff6e0a8645d';
    
    comment1_id UUID;
BEGIN
    -- 게시글 1번 댓글
    INSERT INTO comments (post_id, user_id, content, like_count, created_at) VALUES
    (post1_id, user1_id, '교육 개혁 방향이 매우 바람직해 보입니다. 특히 사교육 부담 경감 정책이 현실적으로 잘 설계된 것 같네요.', 12, NOW() - INTERVAL '2 hours')
    RETURNING id INTO comment1_id;
    
    INSERT INTO comments (post_id, user_id, parent_comment_id, content, like_count, created_at) VALUES
    (post1_id, user2_id, comment1_id, '동의합니다! 다만 실행 예산 확보가 관건일 것 같습니다.', 5, NOW() - INTERVAL '90 minutes');
    
    INSERT INTO comments (post_id, user_id, content, like_count, created_at) VALUES
    (post1_id, user3_id, '교육 현장의 목소리도 더 많이 반영되었으면 합니다.', 8, NOW() - INTERVAL '3 hours'),
    (post1_id, user4_id, '구체적인 실행 일정이 궁금합니다. 언제부터 시행되나요?', 3, NOW() - INTERVAL '5 hours');
    
    -- 게시글 2번 댓글
    INSERT INTO comments (post_id, user_id, content, like_count, created_at) VALUES
    (post2_id, user2_id, '의료 접근성 개선은 정말 시급한 문제입니다. 농어촌 지역 주민들이 특히 어려움을 겪고 있어요.', 15, NOW() - INTERVAL '1 day'),
    (post2_id, user5_id, '원격 의료 도입도 검토해주시면 좋겠습니다.', 10, NOW() - INTERVAL '26 hours'),
    (post2_id, user1_id, '응급 의료 시스템 개선도 함께 추진되어야 할 것 같아요.', 6, NOW() - INTERVAL '22 hours');
    
    -- 게시글 3번 댓글
    INSERT INTO comments (post_id, user_id, content, like_count, created_at) VALUES
    (post3_id, user4_id, '청년 일자리 창출에 실질적인 도움이 되길 기대합니다. 양질의 일자리가 많이 생겼으면 좋겠어요.', 20, NOW() - INTERVAL '6 hours'),
    (post3_id, user5_id, '중소기업 지원도 함께 이루어져야 청년들이 더 많은 기회를 얻을 수 있을 것 같습니다.', 9, NOW() - INTERVAL '8 hours'),
    (post3_id, user2_id, '일자리 질도 중요합니다. 임금과 복지 수준도 개선되어야 해요.', 13, NOW() - INTERVAL '10 hours');
    
    -- 게시글 4번 댓글
    INSERT INTO comments (post_id, user_id, content, like_count, created_at) VALUES
    (post4_id, user1_id, '교통 정책에 대해 의원님께서 적극적으로 대응해주셔서 감사합니다.', 7, NOW() - INTERVAL '2 days'),
    (post4_id, user3_id, '대중교통 개선이 시급합니다. 버스 배차 간격을 줄여주세요!', 11, NOW() - INTERVAL '51 hours');
    
    -- 게시글 5번 댓글
    INSERT INTO comments (post_id, user_id, content, like_count, created_at) VALUES
    (post5_id, user2_id, '복지 정책이 더욱 촘촘해졌으면 합니다. 사각지대를 없애야 해요.', 14, NOW() - INTERVAL '3 days'),
    (post5_id, user4_id, '기초 생활 보장 수준을 현실에 맞게 상향 조정해주세요.', 8, NOW() - INTERVAL '74 hours');
    
    RAISE NOTICE 'Inserted sample comments!';
END $$;

-- 4. 게시글 comment_count 업데이트
UPDATE posts SET comment_count = (
    SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id
) WHERE id IN (
    '49601956-baeb-43ec-892e-f032b9b66ae7',
    'a9a925e0-06e6-4ff8-8ecb-8a9545566818',
    '20c5c875-bdc6-4771-9e83-f5be6532a26b',
    'cafc0c81-02f5-4be0-8309-af57549b28aa',
    '46366325-3a02-4baf-bbb6-1aeb046f5f97'
);
