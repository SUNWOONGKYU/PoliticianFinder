WITH sample_users AS (
  SELECT user_id, ROW_NUMBER() OVER (ORDER BY email) as user_num
  FROM users WHERE email LIKE 'user%@example.com'
  LIMIT 10
),
sample_politicians AS (
  SELECT id, name, ROW_NUMBER() OVER (ORDER BY created_at DESC) as pol_num
  FROM politicians
  ORDER BY created_at DESC
  LIMIT 10
)
INSERT INTO posts (user_id, politician_id, title, content, category, tags, view_count, like_count, comment_count, is_pinned, created_at, moderation_status)
SELECT
  u.user_id,
  p.id,
  t.title, t.content, t.category, t.tags, t.view_count, t.like_count, t.comment_count, t.is_pinned, t.created_at, t.moderation_status
FROM (VALUES
  (1, '김민수 의원의 청년 일자리 공약 평가', '김민수 의원이 발표한 청년 일자리 2만개 창출 공약에 대해 분석해봤습니다. 중소기업 인턴십 1만개는 실현 가능해 보이지만, 공공부문 5천개는 예산 확보가 관건입니다.', 'general', ARRAY['김민수', '청년정책', '일자리', '공약분석'], 234, 28, 5, FALSE, '2025-10-15T10:30:00Z'::timestamptz, 'approved'),
  (2, '이지혜 의원 부산 교통 개선안 어떻게 생각하세요?', '이지혜 의원이 부산 해운대 교통 체증 해소를 위한 개선안을 제시했습니다. 실현 가능성과 효과에 대한 의견을 나눠요.', 'general', ARRAY['이지혜', '교통', '부산', '인프라'], 189, 22, 3, FALSE, '2025-10-14T15:20:00Z'::timestamptz, 'approved'),
  (3, '박준호 의원의 환경 정책, 실천 가능할까?', '박준호 의원의 탄소 중립 로드맵이 발표되었습니다. 구체적인 실행 계획이 있는지 검토가 필요합니다.', 'general', ARRAY['박준호', '환경', '탄소중립', '기후변화'], 312, 45, 7, FALSE, '2025-10-13T09:15:00Z'::timestamptz, 'approved'),
  (4, '최서영 시장 인천 발전 계획 기대됩니다', '최서영 시장의 인천 경제자유구역 확대 계획이 발표되었습니다. 지역 경제 활성화에 큰 도움이 될 것 같습니다.', 'general', ARRAY['최서영', '인천', '경제정책', '지역발전'], 567, 89, 12, TRUE, '2025-10-12T14:45:00Z'::timestamptz, 'approved'),
  (5, '정태우 지사의 경기도 복지 정책 분석', '정태우 지사가 추진 중인 경기도 복지 확대 정책의 재원 마련 방안에 대해 논의가 필요합니다.', 'general', ARRAY['정태우', '복지', '경기도', '재정'], 423, 56, 9, FALSE, '2025-10-11T11:30:00Z'::timestamptz, 'approved'),
  (6, '강은미 의원 소상공인 지원법 발의', '강은미 의원이 소상공인 지원 확대를 위한 법안을 발의했습니다. 실질적인 도움이 될지 기대됩니다.', 'general', ARRAY['강은미', '소상공인', '입법', '경제'], 298, 38, 6, FALSE, '2025-10-10T16:50:00Z'::timestamptz, 'approved'),
  (7, '윤성호 의원 과학기술 정책 어떻게 보시나요?', '윤성호 의원이 대전을 R&D 혁신 허브로 만들겠다는 공약을 발표했습니다. 구체적인 계획이 궁금합니다.', 'general', ARRAY['윤성호', '과학기술', '대전', 'R&D'], 201, 25, 4, FALSE, '2025-10-09T13:25:00Z'::timestamptz, 'approved'),
  (8, '한지원 의원 문화예술 진흥 정책', '한지원 의원의 광주 문화예술 진흥 5개년 계획이 발표되었습니다. 예술인 지원 확대가 기대됩니다.', 'general', ARRAY['한지원', '문화', '예술', '광주'], 345, 52, 8, FALSE, '2025-10-08T10:10:00Z'::timestamptz, 'approved'),
  (9, '오현준 시장 대구 스마트시티 프로젝트', '오현준 시장이 추진하는 대구 스마트시티 프로젝트의 진행 상황과 향후 계획을 공유합니다.', 'general', ARRAY['오현준', '스마트시티', '대구', 'IT'], 489, 67, 11, FALSE, '2025-10-07T17:40:00Z'::timestamptz, 'approved'),
  (10, '임소라 의원 청년 주거 정책 제안', '임소라 의원이 청년 주거 안정을 위한 공공임대주택 확대안을 발표했습니다. 실현 가능성을 논의해봅시다.', 'general', ARRAY['임소라', '주거', '청년', '부동산'], 412, 58, 10, FALSE, '2025-10-06T12:55:00Z'::timestamptz, 'approved')
) AS t(pol_num, title, content, category, tags, view_count, like_count, comment_count, is_pinned, created_at, moderation_status)
JOIN sample_politicians p ON p.pol_num = t.pol_num
JOIN sample_users u ON u.user_num = t.pol_num;

SELECT COUNT(*) as total_politician_posts FROM posts WHERE politician_id IS NOT NULL;
SELECT p.name, COUNT(po.id) as post_count
FROM politicians p
LEFT JOIN posts po ON p.id = po.politician_id
GROUP BY p.name
ORDER BY post_count DESC;
