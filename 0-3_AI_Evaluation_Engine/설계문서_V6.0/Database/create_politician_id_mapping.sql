-- ============================================================================
-- politician_id_mapping 테이블 생성 스크립트
-- V15.0 UUID-INT ID 매핑 브릿지 테이블
-- ============================================================================

-- 기존 테이블이 있다면 삭제 (주의: 데이터 손실)
DROP TABLE IF EXISTS politician_id_mapping;

-- politician_id_mapping 테이블 생성
CREATE TABLE politician_id_mapping (
  -- 기본 키 (정수 ID)
  integer_id INT PRIMARY KEY,

  -- 정치인 정보
  name VARCHAR(100) NOT NULL,              -- 정치인 이름
  name_en VARCHAR(100),                    -- 영문 이름
  party VARCHAR(100),                      -- 소속 정당
  position VARCHAR(100),                   -- 직위

  -- UUID 매핑 (FK to politicians.id)
  uuid_id UUID REFERENCES politicians(id), -- politicians 테이블의 UUID

  -- 메타 정보
  created_at TIMESTAMP DEFAULT NOW(),      -- 생성 일시
  updated_at TIMESTAMP DEFAULT NOW(),      -- 업데이트 일시

  -- 제약 조건
  CONSTRAINT unique_name UNIQUE(name),
  CONSTRAINT unique_uuid UNIQUE(uuid_id)
);

-- 인덱스 생성
CREATE INDEX idx_politician_id_mapping_integer_id ON politician_id_mapping(integer_id);
CREATE INDEX idx_politician_id_mapping_uuid_id ON politician_id_mapping(uuid_id);
CREATE INDEX idx_politician_id_mapping_name ON politician_id_mapping(name);

-- 코멘트 추가
COMMENT ON TABLE politician_id_mapping IS 'V15.0 정치인 ID 매핑 테이블 (UUID ↔ INT 브릿지)';
COMMENT ON COLUMN politician_id_mapping.integer_id IS '정수 ID (1~11, collected_data와 매칭)';
COMMENT ON COLUMN politician_id_mapping.uuid_id IS 'UUID (politicians 테이블 FK)';

-- ============================================================================
-- 사용 목적
-- ============================================================================
--
-- 문제점:
-- - politicians.id: UUID (cd8c0263-500b-4af8-9301-174b487038a2)
-- - collected_data.politician_id: INT (1, 2, 3, ...)
-- - politician_scores.politician_id: INT (1, 2, 3, ...)
--
-- 해결책:
-- - politician_id_mapping 테이블로 UUID ↔ INT 매핑
-- - 3-way JOIN 쿼리에서 중간 브릿지로 사용
--
-- ============================================================================

-- 3-way JOIN 예시 (상세평가보고서 생성)
/*
SELECT
  -- 1. 기본 정보 (politicians via mapping)
  p.name AS politician_name,
  p.party,
  p.position,

  -- 2. 종합 점수 (politician_scores)
  ps.final_score,
  ps.grade,

  -- 3. 상세 데이터 (collected_data)
  cd.category_name,
  cd.data_title,
  cd.rating

FROM politician_id_mapping m
LEFT JOIN politicians p ON m.uuid_id = p.id
LEFT JOIN politician_scores ps ON m.integer_id = ps.politician_id
LEFT JOIN collected_data cd ON m.integer_id = cd.politician_id

WHERE m.integer_id = 1
ORDER BY cd.category_name, cd.rating DESC;
*/

-- ============================================================================
-- 서울시장 후보 11명 등록
-- ============================================================================
-- 다음 파일 참조: insert_seoul_mayor_candidates.sql
-- ============================================================================
