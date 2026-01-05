-- ============================================================================
-- collected_data 테이블에 source_type 필드 추가
-- V15.0 데이터 출처 분류 (OFFICIAL 60% + PUBLIC 40%)
-- ============================================================================

-- source_type 컬럼 추가
ALTER TABLE collected_data
ADD COLUMN source_type VARCHAR(20)
  CHECK (source_type IN ('OFFICIAL', 'PUBLIC'));

-- 인덱스 생성
CREATE INDEX idx_collected_data_source_type ON collected_data(source_type);

-- 코멘트 추가
COMMENT ON COLUMN collected_data.source_type IS 'OFFICIAL: 공식 데이터 (60%), PUBLIC: 공개 데이터 (40%)';

-- ============================================================================
-- 데이터 출처 분류 기준
-- ============================================================================
--
-- OFFICIAL (공식 데이터) - 60%:
--   - 정부/공공기관 발표 자료
--   - 국회/지방의회 공식 기록
--   - 법원 판결문/검찰 기소장
--   - 선거관리위원회 공식 자료
--   - 정부 통계/보고서
--   - 공공기관 감사 결과
--
-- PUBLIC (공개 데이터) - 40%:
--   - 언론 보도 (신문/방송/온라인)
--   - 시민단체 보고서
--   - 학술 논문/연구 자료
--   - SNS 공식 계정 발언
--   - 공개 인터뷰/토론회 발언
--
-- ============================================================================

-- 기존 데이터의 source_type을 NULL로 유지 (추후 수동 분류 또는 재수집)
-- 새로 수집되는 데이터는 반드시 source_type 지정 필요

-- 검증 쿼리: 정치인별 출처 비율 확인
/*
SELECT
  politician_id,
  COUNT(*) as total_count,
  COUNT(CASE WHEN source_type = 'OFFICIAL' THEN 1 END) as official_count,
  COUNT(CASE WHEN source_type = 'PUBLIC' THEN 1 END) as public_count,
  ROUND(COUNT(CASE WHEN source_type = 'OFFICIAL' THEN 1 END) * 100.0 / COUNT(*), 2) as official_pct,
  ROUND(COUNT(CASE WHEN source_type = 'PUBLIC' THEN 1 END) * 100.0 / COUNT(*), 2) as public_pct
FROM collected_data
WHERE source_type IS NOT NULL
GROUP BY politician_id
ORDER BY politician_id;
*/
