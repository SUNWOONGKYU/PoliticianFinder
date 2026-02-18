-- 마이그레이션: politicians 테이블에 previous_position 필드 추가
-- 작성일: 2026-01-26
-- 목적: 정치인 전 직책 정보 저장

-- 1. previous_position 컬럼 추가
ALTER TABLE politicians
ADD COLUMN IF NOT EXISTS previous_position TEXT;

-- 2. 컬럼 설명 추가
COMMENT ON COLUMN politicians.previous_position IS '전 직책 (예: 서초구청장, 장관, 청와대 비서관 등)';

-- 3. 조은희 전 직책 업데이트
UPDATE politicians
SET previous_position = '서초구청장'
WHERE id = 'd0a5d6e1';

-- 4. 확인
SELECT
    name,
    position AS "현 직책",
    previous_position AS "전 직책",
    party AS "정당",
    district AS "출마 지역",
    title AS "출마 직종"
FROM politicians
WHERE id = 'd0a5d6e1';
