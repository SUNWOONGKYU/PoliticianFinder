-- 댓글 샘플 데이터 삽입
-- 게시글들에 다양한 댓글 추가

DO $$
DECLARE
    -- 게시글 IDs
    post1_id UUID := '49601956-baeb-43ec-892e-f032b9b66ae7'; -- 교육 개혁 추진 현황
    post2_id UUID := 'a9a925e0-06e6-4ff8-8ecb-8a9545566818'; -- 의료 접근성 개선 방안
    post3_id UUID := '20c5c875-bdc6-4771-9e83-f5be6532a26b'; -- 청년 일자리 공약 실행 계획
    post4_id UUID := 'cafc0c81-02f5-4be0-8309-af57549b28aa'; -- 강은미 의원 교통 정책 질문
    post5_id UUID := '46366325-3a02-4baf-bbb6-1aeb046f5f97'; -- 박주민 의원 복지 정책 질문
    
    -- 사용자 IDs
    user1_id UUID := 'fd96b732-ea3c-4f4f-89dc-81654b8189bc'; -- 정치는우리의것
    user2_id UUID := '3c8e4e6b-0f17-452d-8e51-1057bcf12c36'; -- 투명한정치
    user3_id UUID := 'e79307b9-2981-434b-bf63-db7f0eba2e76'; -- 민주시민
    user4_id UUID := '9b7a33d3-ead2-4a6b-94bf-98b7ca442f89'; -- 시민참여자
    user5_id UUID := 'a67beb5d-86aa-4beb-8688-5ff6e0a8645d'; -- 투표하는시민
    
    comment1_id UUID;
    comment2_id UUID;
BEGIN
    -- 게시글 1번에 댓글들
    INSERT INTO comments (post_id, user_id, content, like_count, created_at) VALUES
    (post1_id, user1_id, '교육 개혁 방향이 매우 바람직해 보입니다. 특히 사교육 부담 경감 정책이 현실적으로 잘 설계된 것 같네요.', 12, NOW() - INTERVAL '2 hours')
    RETURNING id INTO comment1_id;
    
    -- 위 댓글에 대한 답글
    INSERT INTO comments (post_id, user_id, parent_comment_id, content, like_count, created_at) VALUES
    (post1_id, user2_id, comment1_id, '동의합니다! 다만 실행 예산 확보가 관건일 것 같습니다.', 5, NOW() - INTERVAL '1 hour 30 minutes');
    
    INSERT INTO comments (post_id, user_id, content, like_count, created_at) VALUES
    (post1_id, user3_id, '교육 현장의 목소리도 더 많이 반영되었으면 합니다. 교사들과의 소통이 중요해요.', 8, NOW() - INTERVAL '3 hours'),
    (post1_id, user4_id, '구체적인 실행 일정이 궁금합니다. 언제부터 시행되나요?', 3, NOW() - INTERVAL '5 hours');
    
    -- 게시글 2번에 댓글들
    INSERT INTO comments (post_id, user_id, content, like_count, created_at) VALUES
    (post2_id, user2_id, '의료 접근성 개선은 정말 시급한 문제입니다. 농어촌 지역 주민들이 특히 어려움을 겪고 있어요.', 15, NOW() - INTERVAL '1 day')
    RETURNING id INTO comment2_id;
    
    INSERT INTO comments (post_id, user_id, parent_comment_id, content, like_count, created_at) VALUES
    (post2_id, user3_id, comment2_id, '맞습니다. 우리 동네는 병원까지 가는데 1시간 이상 걸려요.', 7, NOW() - INTERVAL '20 hours');
    
    INSERT INTO comments (post_id, user_id, content, like_count, created_at) VALUES
    (post2_id, user5_id, '원격 의료 도입도 검토해주시면 좋겠습니다.', 10, NOW() - INTERVAL '1 day 2 hours'),
    (post2_id, user1_id, '응급 의료 시스템 개선도 함께 추진되어야 할 것 같아요.', 6, NOW() - INTERVAL '22 hours');
    
    -- 게시글 3번에 댓글들
    INSERT INTO comments (post_id, user_id, content, like_count, created_at) VALUES
    (post3_id, user4_id, '청년 일자리 창출에 실질적인 도움이 되길 기대합니다. 양질의 일자리가 많이 생겼으면 좋겠어요.', 20, NOW() - INTERVAL '6 hours'),
    (post3_id, user5_id, '중소기업 지원도 함께 이루어져야 청년들이 더 많은 기회를 얻을 수 있을 것 같습니다.', 9, NOW() - INTERVAL '8 hours'),
    (post3_id, user2_id, '일자리 질도 중요합니다. 임금과 복지 수준도 개선되어야 해요.', 13, NOW() - INTERVAL '10 hours'),
    (post3_id, user3_id, '구체적인 지원 프로그램에 대한 정보를 더 알고 싶습니다.', 4, NOW() - INTERVAL '12 hours');
    
    -- 게시글 4번에 댓글들
    INSERT INTO comments (post_id, user_id, content, like_count, created_at) VALUES
    (post4_id, user1_id, '교통 정책에 대해 의원님께서 적극적으로 대응해주셔서 감사합니다.', 7, NOW() - INTERVAL '2 days'),
    (post4_id, user3_id, '대중교통 개선이 시급합니다. 버스 배차 간격을 줄여주세요!', 11, NOW() - INTERVAL '2 days 3 hours'),
    (post4_id, user5_id, '자전거 도로 확충도 함께 고려해주시면 좋겠습니다.', 5, NOW() - INTERVAL '2 days 5 hours');
    
    -- 게시글 5번에 댓글들
    INSERT INTO comments (post_id, user_id, content, like_count, created_at) VALUES
    (post5_id, user2_id, '복지 정책이 더욱 촘촘해졌으면 합니다. 사각지대를 없애야 해요.', 14, NOW() - INTERVAL '3 days'),
    (post5_id, user4_id, '기초 생활 보장 수준을 현실에 맞게 상향 조정해주세요.', 8, NOW() - INTERVAL '3 days 2 hours'),
    (post5_id, user1_id, '복지 예산 확충이 필요합니다. 재원 마련 방안도 함께 제시해주시면 좋겠어요.', 6, NOW() - INTERVAL '3 days 4 hours');
    
    RAISE NOTICE 'Successfully inserted sample comments!';
END $$;

-- 게시글별 comment_count 업데이트
UPDATE posts SET comment_count = (
    SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id
) WHERE id IN (
    '49601956-baeb-43ec-892e-f032b9b66ae7',
    'a9a925e0-06e6-4ff8-8ecb-8a9545566818',
    '20c5c875-bdc6-4771-9e83-f5be6532a26b',
    'cafc0c81-02f5-4be0-8309-af57549b28aa',
    '46366325-3a02-4baf-bbb6-1aeb046f5f97'
);
