-- ============================================
-- 모의 데이터 삽입 (Mock Data Insert)
-- Phase 5D6: 전체 기능 검증용
-- ============================================

-- 실행 전 확인사항:
-- 1. COMBINED_P2_MIGRATIONS_V2.sql 실행 완료
-- 2. Supabase Dashboard SQL Editor에서 실행
-- 3. SERVICE_ROLE_KEY 사용 권장

BEGIN;

-- ============================================
-- 1. 정치인 데이터 (30명)
-- ============================================

INSERT INTO politicians (name, party, region, position, status, profile_image_url, birth_date, education, career, contact, website) VALUES
('김철수', '국민의힘', '서울 강남구', '국회의원', 'incumbent', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kim1', '1970-03-15', '서울대학교 법학과', '제21대 국회의원, 前 검사', '02-1234-5678', 'https://example.com/kim1'),
('이영희', '민주당', '부산 해운대구', '국회의원', 'candidate', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lee1', '1975-07-20', '연세대학교 정치외교학과', '부산시의원 3선', '051-2345-6789', 'https://example.com/lee1'),
('박민수', '무소속', '서울특별시', '서울시장', 'incumbent', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Park1', '1968-11-05', '고려대학교 경영학과', '서울시장 2선', '02-3456-7890', 'https://example.com/park1'),
('정수진', '민주당', '경기 성남시', '국회의원', 'prospective', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jung1', '1980-04-12', '이화여대 사회학과', '성남시의원, 시민단체 대표', '031-4567-8901', 'https://example.com/jung1'),
('최동욱', '국민의힘', '대구 수성구', '국회의원', 'incumbent', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Choi1', '1972-09-28', '경북대학교 법학과', '제20-21대 국회의원', '053-5678-9012', 'https://example.com/choi1'),
('강민지', '민주당', '인천 남동구', '국회의원', 'candidate', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kang1', '1983-01-16', '서울대학교 경제학과', '인천시의원, 前 기자', '032-6789-0123', 'https://example.com/kang1'),
('윤상현', '정의당', '광주 동구', '국회의원', 'incumbent', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yoon1', '1978-06-08', '전남대학교 사회학과', '광주시의원, 노동운동가', '062-7890-1234', 'https://example.com/yoon1'),
('임지혜', '국민의힘', '경기 고양시', '경기도지사', 'candidate', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lim1', '1976-12-22', '성균관대학교 행정학과', '고양시장, 前 공무원', '031-8901-2345', 'https://example.com/lim1'),
('한준호', '무소속', '대전 유성구', '대전시장', 'incumbent', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Han1', '1969-05-30', '카이스트 전산학과', 'IT 기업 CEO, 대전시장', '042-9012-3456', 'https://example.com/han1'),
('신예은', '민주당', '울산 남구', '울산시장', 'prospective', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Shin1', '1982-08-14', '부산대학교 법학과', '울산시의원, 변호사', '052-0123-4567', 'https://example.com/shin1'),
('조성민', '국민의힘', '강원 춘천시', '국회의원', 'incumbent', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jo1', '1974-02-18', '강원대학교 정치학과', '강원도의원, 춘천시장', '033-1234-5678', 'https://example.com/jo1'),
('배지연', '민주당', '충북 청주시', '충청북도지사', 'candidate', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bae1', '1977-10-25', '충북대학교 행정학과', '청주시의원, 교육감', '043-2345-6789', 'https://example.com/bae1'),
('황재석', '정의당', '충남 천안시', '국회의원', 'incumbent', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hwang1', '1971-04-03', '공주대학교 사회학과', '천안시의원, 시민운동가', '041-3456-7890', 'https://example.com/hwang1'),
('서미라', '국민의힘', '전북 전주시', '전라북도지사', 'prospective', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Seo1', '1979-07-19', '전북대학교 경영학과', '전주시의원, 기업인', '063-4567-8901', 'https://example.com/seo1'),
('안태영', '민주당', '전남 목포시', '국회의원', 'incumbent', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahn1', '1973-11-11', '목포대학교 법학과', '목포시장, 前 검사', '061-5678-9012', 'https://example.com/ahn1'),
('권나영', '무소속', '경북 포항시', '포항시장', 'candidate', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kwon1', '1981-03-07', '포항공대 화학공학과', '포항시의원, 연구원', '054-6789-0123', 'https://example.com/kwon1'),
('오진우', '국민의힘', '경남 창원시', '경상남도지사', 'incumbent', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oh1', '1970-09-23', '경남대학교 정치학과', '창원시장, 경남도의원', '055-7890-1234', 'https://example.com/oh1'),
('송하늘', '민주당', '제주 제주시', '제주특별자치도지사', 'prospective', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Song1', '1975-12-01', '제주대학교 관광학과', '제주시의원, 관광사업가', '064-8901-2345', 'https://example.com/song1'),
('노준혁', '정의당', '세종시', '국회의원', 'candidate', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Noh1', '1984-05-17', 'KAIST 경영학과', '세종시의원, 사회혁신가', '044-9012-3456', 'https://example.com/noh1'),
('양서영', '국민의힘', '서울 송파구', '국회의원', 'incumbent', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yang1', '1972-08-09', '서울대학교 의학과', '의사, 제21대 국회의원', '02-0123-4567', 'https://example.com/yang1'),
('홍진호', '민주당', '서울 마포구', '국회의원', 'prospective', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hong1', '1980-01-28', '홍익대학교 경영학과', '마포구의원, 스타트업 대표', '02-1234-5678', 'https://example.com/hong1'),
('유경민', '무소속', '부산 남구', '부산시장', 'candidate', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yoo1', '1976-06-14', '부산대학교 토목공학과', '부산시의원, 건축사', '051-2345-6789', 'https://example.com/yoo1'),
('문재인', '민주당', '경기 수원시', '국회의원', 'incumbent', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Moon1', '1973-04-05', '수원대학교 법학과', '수원시의원, 변호사', '031-3456-7890', 'https://example.com/moon1'),
('장서희', '국민의힘', '인천 부평구', '인천시장', 'prospective', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jang1', '1978-10-20', '인천대학교 경제학과', '부평구청장, 공무원', '032-4567-8901', 'https://example.com/jang1'),
('하동훈', '정의당', '대구 북구', '국회의원', 'candidate', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ha1', '1982-02-11', '대구대학교 사회복지학과', '사회복지사, 시민운동가', '053-5678-9012', 'https://example.com/ha1'),
('고민정', '민주당', '광주 서구', '광주시장', 'incumbent', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Go1', '1974-07-26', '전남대학교 행정학과', '광주시의원, 광주시장', '062-6789-0123', 'https://example.com/go1'),
('표창원', '국민의힘', '경기 안양시', '국회의원', 'prospective', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pyo1', '1971-11-08', '경찰대학교', '前 경찰, 안양시의원', '031-7890-1234', 'https://example.com/pyo1'),
('진선미', '무소속', '울산 동구', '국회의원', 'candidate', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jin1', '1979-03-22', '울산대학교 정치학과', '울산시의원, 교사', '052-8901-2345', 'https://example.com/jin1'),
('나경원', '국민의힘', '서울 동작구', '국회의원', 'incumbent', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Na1', '1970-12-15', '서울대학교 법학과', '제19-21대 국회의원', '02-9012-3456', 'https://example.com/na1'),
('이재명', '민주당', '경기 성남시', '경기도지사', 'prospective', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lee2', '1973-05-30', '중앙대학교 법학과', '성남시장, 경기도지사', '031-0123-4567', 'https://example.com/lee2')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. AI 평점 데이터 (5 AI × 30명 = 150개)
-- ============================================

INSERT INTO ai_scores (politician_id, ai_name, score, reasoning, evaluated_at)
SELECT
  p.id,
  ai.name,
  85 + (RANDOM() * 10)::INTEGER as score,
  CASE ai.name
    WHEN 'claude' THEN '정책 실현 가능성과 소통 능력이 우수함'
    WHEN 'gpt' THEN '공약 이행률과 청렴도가 높음'
    WHEN 'gemini' THEN '전문성과 경력이 검증됨'
    WHEN 'grok' THEN '혁신성과 추진력이 뛰어남'
    WHEN 'perplexity' THEN '균형잡힌 시각과 협상 능력 보유'
  END as reasoning,
  NOW() - (RANDOM() * INTERVAL '30 days') as evaluated_at
FROM politicians p
CROSS JOIN (VALUES ('claude'), ('gpt'), ('gemini'), ('grok'), ('perplexity')) AS ai(name)
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. 게시글 데이터 (50개)
-- ============================================

INSERT INTO posts (title, content, category, view_count, upvotes, downvotes, created_at, user_id)
SELECT
  CASE (gs % 10)
    WHEN 0 THEN '정치개혁 토론: ' || gs || '번째 의견'
    WHEN 1 THEN '[질문] 지역 발전 정책 문의 #' || gs
    WHEN 2 THEN '최근 국회 소식 정리 (' || gs || ')'
    WHEN 3 THEN '시민과의 소통 중요성 - Part ' || gs
    WHEN 4 THEN '[뉴스] 지역 정치인 활동 근황 ' || gs
    WHEN 5 THEN '청년 정책 개선 방안 제안 #' || gs
    WHEN 6 THEN '[토론] 복지 정책 어떻게 생각하세요?'
    WHEN 7 THEN '우리 지역 정치인 평가해봅시다'
    WHEN 8 THEN '[자유] 정치에 관심 갖게 된 계기'
    ELSE '일반 게시글 제목 ' || gs
  END as title,
  '이것은 게시글 #' || gs || '의 내용입니다. 다양한 의견과 토론을 환영합니다. 건전한 정치 문화를 만들어 갑시다.' as content,
  CASE (gs % 4)
    WHEN 0 THEN 'free'
    WHEN 1 THEN 'policy'
    WHEN 2 THEN 'news'
    ELSE 'qna'
  END as category,
  CASE WHEN gs <= 10 THEN 500 + (RANDOM() * 500)::INTEGER ELSE (RANDOM() * 200)::INTEGER END as view_count,
  CASE WHEN gs <= 10 THEN 20 + (RANDOM() * 30)::INTEGER ELSE (RANDOM() * 10)::INTEGER END as upvotes,
  (RANDOM() * 5)::INTEGER as downvotes,
  NOW() - (gs || ' hours')::INTERVAL as created_at,
  NULL as user_id
FROM generate_series(1, 50) gs
ON CONFLICT DO NOTHING;

-- ============================================
-- 4. 댓글 데이터 (100개)
-- ============================================

INSERT INTO comments (post_id, content, created_at, user_id)
SELECT
  (1 + (RANDOM() * 49)::INTEGER) as post_id,
  CASE (gs % 5)
    WHEN 0 THEN '좋은 의견입니다. 공감합니다!'
    WHEN 1 THEN '저는 조금 다른 생각인데요...'
    WHEN 2 THEN '구체적인 정책 설명이 필요할 것 같아요'
    WHEN 3 THEN '이 부분은 재고가 필요해 보입니다'
    ELSE '정보 공유 감사합니다 👍'
  END as content,
  NOW() - (gs || ' hours')::INTERVAL as created_at,
  NULL as user_id
FROM generate_series(1, 100) gs
ON CONFLICT DO NOTHING;

-- ============================================
-- 5. 정치인 공식 글 데이터 (30명 × 3개 = 90개)
-- ============================================

INSERT INTO politician_posts (politician_id, title, content, source_url, platform, published_at, view_count, like_count, share_count)
SELECT
  p.id,
  CASE (gs % 3)
    WHEN 0 THEN p.name || '의 ' || p.region || ' 발전 계획'
    WHEN 1 THEN '[공지] ' || p.name || ' 시민 간담회 일정'
    ELSE p.name || '의 최근 활동 보고'
  END as title,
  '안녕하세요, ' || p.name || '입니다. ' || p.region || ' 발전을 위해 노력하고 있습니다. 시민 여러분의 의견을 듣고 싶습니다.' as content,
  'https://example.com/' || p.id || '/' || gs as source_url,
  CASE (gs % 3)
    WHEN 0 THEN 'twitter'
    WHEN 1 THEN 'facebook'
    ELSE 'blog'
  END as platform,
  NOW() - (gs || ' days')::INTERVAL as published_at,
  (RANDOM() * 1000)::INTEGER as view_count,
  (RANDOM() * 100)::INTEGER as like_count,
  (RANDOM() * 50)::INTEGER as share_count
FROM politicians p
CROSS JOIN generate_series(1, 3) gs
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. connected_services 데이터
-- ============================================

INSERT INTO connected_services (service_name, service_url, icon_url, status, last_sync) VALUES
('국회의원 현황', 'https://open.assembly.go.kr', NULL, 'active', NOW()),
('선거관리위원회', 'https://www.nec.go.kr', NULL, 'active', NOW()),
('정치자금넷', 'https://www.nesdc.go.kr', NULL, 'active', NOW()),
('정부24', 'https://www.gov.kr', NULL, 'active', NOW()),
('대한민국 정책브리핑', 'https://www.korea.kr', NULL, 'active', NOW())
ON CONFLICT (service_name) DO UPDATE SET
  last_sync = NOW(),
  status = 'active';

-- ============================================
-- 7. hot_score 업데이트
-- ============================================

SELECT update_all_hot_scores();

COMMIT;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 모의 데이터 삽입 완료!';
  RAISE NOTICE '📊 정치인: 30명';
  RAISE NOTICE '📊 AI 평점: 150개';
  RAISE NOTICE '📊 게시글: 50개';
  RAISE NOTICE '📊 댓글: 100개';
  RAISE NOTICE '📊 정치인 글: 90개';
  RAISE NOTICE '📊 연결 서비스: 5개';
END $$;
