-- ============================================================================
-- 서울시장 후보 11명 등록 스크립트
-- V15.0 2026년 서울시장 선거 주요 후보
-- ============================================================================

-- ============================================================================
-- 서울시장 후보 11명 (ID: 1 ~ 11)
-- ============================================================================

-- 1번: 오세훈 (현 서울시장, 국민의힘)
INSERT INTO politician_id_mapping (
  integer_id, name, name_en, party, position
) VALUES (
  1,
  '오세훈',
  'Oh Se-hoon',
  '국민의힘',
  '서울특별시장'
);

-- 2번: 박주민 (국회의원, 더불어민주당)
INSERT INTO politician_id_mapping (
  integer_id, name, name_en, party, position
) VALUES (
  2,
  '박주민',
  'Park Joo-min',
  '더불어민주당',
  '국회의원'
);

-- 3번: 금태섭 (전 국회의원, 무소속)
INSERT INTO politician_id_mapping (
  integer_id, name, name_en, party, position
) VALUES (
  3,
  '금태섭',
  'Keum Tae-seop',
  '무소속',
  '전 국회의원'
);

-- 4번: 나경원 (전 국회의원, 국민의힘)
INSERT INTO politician_id_mapping (
  integer_id, name, name_en, party, position
) VALUES (
  4,
  '나경원',
  'Na Kyung-won',
  '국민의힘',
  '전 국회의원'
);

-- 5번: 안철수 (국회의원, 국민의힘)
INSERT INTO politician_id_mapping (
  integer_id, name, name_en, party, position
) VALUES (
  5,
  '안철수',
  'Ahn Cheol-soo',
  '국민의힘',
  '국회의원'
);

-- 6번: 김은혜 (경기도지사 권한대행, 국민의힘)
INSERT INTO politician_id_mapping (
  integer_id, name, name_en, party, position
) VALUES (
  6,
  '김은혜',
  'Kim Eun-hye',
  '국민의힘',
  '경기도지사 권한대행'
);

-- 7번: 김진표 (전 국회의장, 더불어민주당)
INSERT INTO politician_id_mapping (
  integer_id, name, name_en, party, position
) VALUES (
  7,
  '김진표',
  'Kim Jin-pyo',
  '더불어민주당',
  '전 국회의장'
);

-- 8번: 박영선 (전 중소벤처기업부 장관, 더불어민주당)
INSERT INTO politician_id_mapping (
  integer_id, name, name_en, party, position
) VALUES (
  8,
  '박영선',
  'Park Young-sun',
  '더불어민주당',
  '전 중소벤처기업부 장관'
);

-- 9번: 우상호 (국회의원, 더불어민주당)
INSERT INTO politician_id_mapping (
  integer_id, name, name_en, party, position
) VALUES (
  9,
  '우상호',
  'Woo Sang-ho',
  '더불어민주당',
  '국회의원'
);

-- 10번: 정청래 (국회의원, 더불어민주당)
INSERT INTO politician_id_mapping (
  integer_id, name, name_en, party, position
) VALUES (
  10,
  '정청래',
  'Chung Chung-rae',
  '더불어민주당',
  '국회의원'
);

-- 11번: 진성준 (국회의원, 더불어민주당)
INSERT INTO politician_id_mapping (
  integer_id, name, name_en, party, position
) VALUES (
  11,
  '진성준',
  'Jin Sung-joon',
  '더불어민주당',
  '국회의원'
);

-- ============================================================================
-- 검증 쿼리
-- ============================================================================

-- 1. 전체 등록 현황 확인
/*
SELECT
  integer_id,
  name,
  party,
  position,
  created_at
FROM politician_id_mapping
ORDER BY integer_id;
*/

-- 2. 정당별 후보 수
/*
SELECT
  party,
  COUNT(*) as candidate_count
FROM politician_id_mapping
GROUP BY party
ORDER BY candidate_count DESC;
*/

-- 3. UUID 매핑 확인 (politicians 테이블과 연결 후)
/*
SELECT
  m.integer_id,
  m.name,
  m.uuid_id,
  p.name as politician_table_name
FROM politician_id_mapping m
LEFT JOIN politicians p ON m.uuid_id = p.id
ORDER BY m.integer_id;
*/

-- ============================================================================
-- 참고 사항
-- ============================================================================
--
-- 1. 정당별 분포:
--    - 국민의힘: 5명 (오세훈, 나경원, 안철수, 김은혜, + 금태섭은 무소속)
--    - 더불어민주당: 6명 (박주민, 김진표, 박영선, 우상호, 정청래, 진성준)
--    - 무소속: 1명 (금태섭)
--
-- 2. uuid_id는 NULL로 시작:
--    - politicians 테이블에 정치인 정보가 등록된 후
--    - UPDATE 쿼리로 uuid_id를 매핑해야 함
--
-- 3. collected_data와 politician_scores 테이블:
--    - 이미 integer_id (1, 2, 3, ...)를 사용 중
--    - 즉시 연동 가능
--
-- ============================================================================
