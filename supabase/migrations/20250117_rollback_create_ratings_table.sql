-- P2D2: ratings 테이블 롤백 스크립트
-- ratings 테이블 및 관련 객체를 안전하게 제거
-- 작성일: 2025-01-17
-- 작성자: AI-only

-- ============================================
-- 롤백 전 확인 사항
-- ============================================

DO $$
DECLARE
  rating_count INTEGER;
BEGIN
  -- 테이블이 존재하는지 확인
  IF NOT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'ratings'
  ) THEN
    RAISE NOTICE 'ratings 테이블이 존재하지 않습니다. 롤백을 건너뜁니다.';
    RETURN;
  END IF;

  -- 데이터 개수 확인
  SELECT COUNT(*) INTO rating_count FROM ratings;
  RAISE NOTICE 'ratings 테이블에 % 개의 레코드가 있습니다.', rating_count;

  IF rating_count > 0 THEN
    RAISE WARNING '테이블에 데이터가 있습니다. 롤백 시 모든 데이터가 삭제됩니다.';
    -- 프로덕션에서는 여기서 중단하거나 백업을 권장
    -- RAISE EXCEPTION '데이터가 있는 테이블은 삭제할 수 없습니다. 먼저 백업하세요.';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 1. 트리거 제거
-- ============================================

-- updated_at 트리거 제거
DROP TRIGGER IF EXISTS update_ratings_updated_at ON ratings;

-- 트리거 함수 제거 (다른 테이블에서 사용 중일 수 있으므로 주의)
-- 다른 테이블에서 사용 여부 확인
DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger t
  JOIN pg_proc p ON t.tgfoid = p.oid
  WHERE p.proname = 'update_updated_at_column'
  AND t.tgrelid != 'ratings'::regclass;

  IF trigger_count = 0 THEN
    -- 다른 테이블에서 사용하지 않으면 함수 제거
    DROP FUNCTION IF EXISTS update_updated_at_column();
    RAISE NOTICE 'update_updated_at_column 함수가 제거되었습니다.';
  ELSE
    RAISE NOTICE 'update_updated_at_column 함수는 다른 테이블에서 사용 중이므로 유지됩니다.';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. 추가 인덱스 제거 (기존 마이그레이션에서 생성된 인덱스)
-- ============================================

-- P2D3에서 생성된 복합 인덱스들
DROP INDEX IF EXISTS idx_ratings_politician_category;
DROP INDEX IF EXISTS idx_ratings_user_category;
DROP INDEX IF EXISTS idx_ratings_politician_score_desc;

-- P2D3에서 생성된 부분 인덱스들
DROP INDEX IF EXISTS idx_ratings_recent;
DROP INDEX IF EXISTS idx_ratings_high_scores;
DROP INDEX IF EXISTS idx_ratings_with_comment;

-- P2D3에서 생성된 표현식 인덱스들
DROP INDEX IF EXISTS idx_ratings_comment_trgm;
DROP INDEX IF EXISTS idx_ratings_month;
DROP INDEX IF EXISTS idx_ratings_year;

-- ============================================
-- 3. 기본 인덱스 제거
-- ============================================

-- 테이블 생성 시 추가된 기본 인덱스들
DROP INDEX IF EXISTS idx_ratings_politician_created;
DROP INDEX IF EXISTS idx_ratings_politician_score;
DROP INDEX IF EXISTS idx_ratings_created_at;
DROP INDEX IF EXISTS idx_ratings_user_id;
DROP INDEX IF EXISTS idx_ratings_politician_id;

-- ============================================
-- 4. 테이블 제거
-- ============================================

-- CASCADE 옵션: 이 테이블을 참조하는 모든 객체도 함께 제거
-- RESTRICT 옵션: 참조하는 객체가 있으면 제거 실패 (안전)
DROP TABLE IF EXISTS ratings CASCADE;

-- ============================================
-- 5. 롤백 완료 확인
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'ratings'
  ) THEN
    RAISE NOTICE '✅ ratings 테이블이 성공적으로 제거되었습니다.';
  ELSE
    RAISE WARNING '⚠️ ratings 테이블 제거에 실패했습니다.';
  END IF;

  -- 남은 인덱스 확인
  IF EXISTS (
    SELECT FROM pg_indexes
    WHERE tablename = 'ratings'
  ) THEN
    RAISE WARNING '⚠️ 일부 인덱스가 여전히 존재합니다:';
    FOR r IN (
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'ratings'
    ) LOOP
      RAISE WARNING '  - %', r.indexname;
    END LOOP;
  ELSE
    RAISE NOTICE '✅ 모든 인덱스가 제거되었습니다.';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. 롤백 후 정리 작업
-- ============================================

-- 불필요한 공간 회수
-- VACUUM ANALYZE;

-- 통계 정보 업데이트
-- ANALYZE;

-- 롤백 완료 메시지
RAISE NOTICE '========================================';
RAISE NOTICE 'ratings 테이블 롤백이 완료되었습니다.';
RAISE NOTICE '필요시 백업에서 데이터를 복구하세요.';
RAISE NOTICE '========================================';