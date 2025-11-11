-- 10명의 샘플 사용자 생성

INSERT INTO users (email, name, role, points, level, bio, location, is_banned)
VALUES
  ('user1@example.com', '정치는우리의것', 'user', 150, 2, '정치에 관심이 많은 시민입니다.', '서울', FALSE),
  ('user2@example.com', '투명한정치', 'user', 320, 3, '정치의 투명성을 추구합니다.', '부산', FALSE),
  ('user3@example.com', '민주시민', 'user', 280, 3, '민주주의를 사랑하는 시민', '인천', FALSE),
  ('user4@example.com', '시민참여자', 'user', 450, 4, '시민 참여가 중요합니다.', '대전', FALSE),
  ('user5@example.com', '투표하는시민', 'user', 200, 2, '투표는 권리이자 의무', '광주', FALSE),
  ('user6@example.com', '민생이우선', 'user', 180, 2, '민생을 최우선으로', '대구', FALSE),
  ('user7@example.com', '변화를원해', 'user', 390, 3, '더 나은 사회를 만들기 위해', '울산', FALSE),
  ('user8@example.com', '미래세대', 'user', 220, 2, '미래 세대를 생각합니다.', '세종', FALSE),
  ('user9@example.com', '깨어있는시민', 'user', 310, 3, '깨어있는 시민의식', '경기', FALSE),
  ('user10@example.com', '정책분석가', 'user', 520, 5, '정책을 분석하고 공유합니다.', '서울', FALSE)
ON CONFLICT (email) DO NOTHING;

-- 생성된 사용자 확인
SELECT id, email, name, level FROM users ORDER BY created_at DESC LIMIT 10;
