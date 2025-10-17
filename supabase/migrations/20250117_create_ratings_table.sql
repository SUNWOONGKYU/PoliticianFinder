-- P2D2: ratings 테이블 생성
-- 시민들의 정치인 평가를 저장하는 테이블
-- 작성일: 2025-01-17
-- 작성자: AI-only

-- ============================================
-- 1. 테이블 생성
-- ============================================

CREATE TABLE IF NOT EXISTS ratings (
  id BIGSERIAL PRIMARY KEY,

  -- 사용자 정보 (Supabase Auth)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 정치인 정보
  politician_id BIGINT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,

  -- 평가 내용
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  category VARCHAR(50) DEFAULT 'overall',

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 1인 1평가 제약조건
  CONSTRAINT unique_user_politician UNIQUE(user_id, politician_id)
);

-- 코멘트 길이 제한 (1000자)
ALTER TABLE ratings
ADD CONSTRAINT check_comment_length
CHECK (LENGTH(comment) <= 1000);

-- ============================================
-- 2. 테이블 설명 추가
-- ============================================

COMMENT ON TABLE ratings IS '시민의 정치인 평가 테이블';
COMMENT ON COLUMN ratings.id IS '평가 고유 식별자';
COMMENT ON COLUMN ratings.user_id IS '평가한 사용자 ID (Supabase Auth UUID)';
COMMENT ON COLUMN ratings.politician_id IS '평가받은 정치인 ID';
COMMENT ON COLUMN ratings.score IS '평점 (1-5)';
COMMENT ON COLUMN ratings.comment IS '평가 코멘트 (최대 1000자)';
COMMENT ON COLUMN ratings.category IS '평가 카테고리 (overall, policy, integrity, communication 등)';
COMMENT ON COLUMN ratings.created_at IS '평가 작성 시간';
COMMENT ON COLUMN ratings.updated_at IS '평가 수정 시간';

-- ============================================
-- 3. 기본 인덱스 생성
-- ============================================

-- 정치인별 평가 조회 최적화
CREATE INDEX idx_ratings_politician_id
ON ratings(politician_id);

-- 사용자별 평가 조회 최적화
CREATE INDEX idx_ratings_user_id
ON ratings(user_id);

-- 최신 평가순 정렬 최적화
CREATE INDEX idx_ratings_created_at
ON ratings(created_at DESC);

-- 정치인 + 평점 복합 인덱스 (통계 쿼리 최적화)
CREATE INDEX idx_ratings_politician_score
ON ratings(politician_id, score);

-- 정치인 + 생성일 복합 인덱스 (시간순 정렬)
CREATE INDEX idx_ratings_politician_created
ON ratings(politician_id, created_at DESC);

-- ============================================
-- 4. updated_at 자동 업데이트 트리거
-- ============================================

-- 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER update_ratings_updated_at
BEFORE UPDATE ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. 테이블 생성 확인
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'ratings'
  ) THEN
    RAISE NOTICE 'ratings 테이블이 성공적으로 생성되었습니다.';

    -- 제약조건 확인
    RAISE NOTICE '제약조건 목록:';
    FOR r IN (
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'ratings'
      ORDER BY constraint_type
    ) LOOP
      RAISE NOTICE '  - % (%)', r.constraint_name, r.constraint_type;
    END LOOP;

    -- 인덱스 확인
    RAISE NOTICE '인덱스 목록:';
    FOR r IN (
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'ratings'
      ORDER BY indexname
    ) LOOP
      RAISE NOTICE '  - %', r.indexname;
    END LOOP;
  ELSE
    RAISE EXCEPTION 'ratings 테이블 생성에 실패했습니다.';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. 샘플 데이터 (개발 환경용 - 프로덕션에서는 제거)
-- ============================================

-- 개발/테스트용 샘플 데이터 (주석 처리됨)
-- INSERT INTO ratings (user_id, politician_id, score, comment, category)
-- VALUES
--   ('550e8400-e29b-41d4-a716-446655440000', 1, 5, '훌륭한 정치인입니다. 공약을 성실히 이행하고 있습니다.', 'overall'),
--   ('550e8400-e29b-41d4-a716-446655440001', 1, 4, '정책 방향이 올바르다고 생각합니다.', 'policy'),
--   ('550e8400-e29b-41d4-a716-446655440002', 2, 3, '보통입니다. 더 노력이 필요해 보입니다.', 'overall'),
--   ('550e8400-e29b-41d4-a716-446655440003', 2, 2, '소통이 부족한 것 같습니다.', 'communication'),
--   ('550e8400-e29b-41d4-a716-446655440004', 3, 5, '청렴하고 성실한 정치인입니다.', 'integrity');