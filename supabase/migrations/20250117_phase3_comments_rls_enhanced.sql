-- =================================================================
-- Phase 3 Enhanced Comments RLS Policies
-- =================================================================
-- 작업 ID: P3E1
-- 작성일: 2025-01-17
-- 설명: Phase 3 향상된 댓글 보안 정책 구현
-- =================================================================

-- ===========================
-- 1. 테이블 생성 (없는 경우)
-- ===========================
CREATE TABLE IF NOT EXISTS comments (
  id BIGSERIAL PRIMARY KEY,
  politician_id BIGINT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'deleted', 'reported')),
  like_count INT DEFAULT 0,
  reply_count INT DEFAULT 0,
  report_count INT DEFAULT 0,
  depth INT DEFAULT 0 CHECK (depth >= 0 AND depth <= 2),
  ip_address INET,
  user_agent TEXT,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- 2. 인덱스 생성
-- ===========================
CREATE INDEX IF NOT EXISTS idx_comments_politician_id ON comments(politician_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_like_count ON comments(like_count DESC) WHERE status = 'active';

-- ===========================
-- 3. RLS 정책 재설정
-- ===========================
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "comments_select_policy" ON comments;
DROP POLICY IF EXISTS "comments_insert_policy" ON comments;
DROP POLICY IF EXISTS "comments_update_policy" ON comments;
DROP POLICY IF EXISTS "comments_delete_policy" ON comments;

-- ===========================
-- 4. SELECT 정책 - 계층적 조회
-- ===========================
CREATE POLICY "comments_select_policy"
ON comments FOR SELECT
USING (
  CASE
    -- 활성 댓글은 모두 공개
    WHEN status = 'active' THEN true
    -- 숨김/신고 댓글은 작성자와 관리자만 조회
    WHEN status IN ('hidden', 'reported') THEN (
      auth.uid() = user_id OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'moderator')
      )
    )
    -- 삭제된 댓글은 관리자만 조회
    WHEN status = 'deleted' THEN EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
    ELSE false
  END
);

-- ===========================
-- 5. INSERT 정책 - Rate Limiting 포함
-- ===========================
CREATE POLICY "comments_insert_policy"
ON comments FOR INSERT
WITH CHECK (
  -- 인증된 사용자만
  auth.uid() IS NOT NULL
  -- 본인 명의로만 작성
  AND auth.uid() = user_id
  -- Rate Limiting: 1분 내 5개 이상 작성 불가
  AND NOT EXISTS (
    SELECT 1 FROM comments c
    WHERE c.user_id = auth.uid()
    AND c.created_at > NOW() - INTERVAL '1 minute'
    GROUP BY c.user_id
    HAVING COUNT(*) >= 5
  )
  -- 24시간 내 50개 이상 작성 불가
  AND NOT EXISTS (
    SELECT 1 FROM comments c
    WHERE c.user_id = auth.uid()
    AND c.created_at > NOW() - INTERVAL '24 hours'
    GROUP BY c.user_id
    HAVING COUNT(*) >= 50
  )
  -- 차단된 사용자 제외
  AND NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND (banned = true OR status = 'suspended')
  )
);

-- ===========================
-- 6. UPDATE 정책 - 수정 이력 관리
-- ===========================
CREATE POLICY "comments_update_policy"
ON comments FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND (
    -- 작성자 본인
    auth.uid() = user_id
    -- 또는 관리자
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  )
  -- 24시간 이내만 수정 가능 (관리자 제외)
  AND (
    created_at > NOW() - INTERVAL '24 hours'
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  )
)
WITH CHECK (
  -- 구조적 필드는 변경 불가
  politician_id = OLD.politician_id
  AND user_id = OLD.user_id
  AND (parent_id IS NULL AND OLD.parent_id IS NULL OR parent_id = OLD.parent_id)
  AND depth = OLD.depth
  -- 수정 시 edited_at 업데이트 필수
  AND edited_at IS NOT NULL
  AND edited_at > OLD.created_at
);

-- ===========================
-- 7. DELETE 정책 - 소프트 삭제
-- ===========================
CREATE POLICY "comments_delete_policy"
ON comments FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND (
    -- 작성자 본인
    auth.uid() = user_id
    -- 게시글(정치인 평가) 작성자
    OR EXISTS (
      SELECT 1 FROM ratings r
      WHERE r.politician_id = comments.politician_id
      AND r.user_id = auth.uid()
    )
    -- 관리자
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  )
);

-- ===========================
-- 8. 트리거: 자동 업데이트
-- ===========================
CREATE OR REPLACE FUNCTION update_comment_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- 수정 시 updated_at 자동 갱신
  NEW.updated_at = NOW();

  -- 수정 시 edited_at 설정
  IF TG_OP = 'UPDATE' AND OLD.content != NEW.content THEN
    NEW.edited_at = NOW();
  END IF;

  -- IP 주소 기록 (개인정보 보호 고려)
  IF TG_OP = 'INSERT' THEN
    NEW.ip_address = inet_client_addr();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
DROP TRIGGER IF EXISTS comment_metadata_trigger ON comments;
CREATE TRIGGER comment_metadata_trigger
BEFORE INSERT OR UPDATE ON comments
FOR EACH ROW EXECUTE FUNCTION update_comment_metadata();

-- ===========================
-- 9. 신고 시스템 함수
-- ===========================
CREATE OR REPLACE FUNCTION report_comment(
  p_comment_id BIGINT,
  p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_comment comments%ROWTYPE;
  v_result JSONB;
BEGIN
  -- 댓글 조회 및 잠금
  SELECT * INTO v_comment
  FROM comments
  WHERE id = p_comment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Comment not found'
    );
  END IF;

  -- 신고 횟수 증가
  UPDATE comments
  SET
    report_count = report_count + 1,
    status = CASE
      WHEN report_count >= 4 THEN 'hidden'
      WHEN report_count >= 9 THEN 'deleted'
      ELSE status
    END
  WHERE id = p_comment_id;

  -- 신고 로그 기록
  INSERT INTO comment_reports (
    comment_id,
    reporter_id,
    reason,
    created_at
  ) VALUES (
    p_comment_id,
    auth.uid(),
    p_reason,
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Comment reported successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================
-- 10. 성능 모니터링 뷰
-- ===========================
CREATE OR REPLACE VIEW comment_statistics AS
SELECT
  politician_id,
  COUNT(*) as total_comments,
  COUNT(DISTINCT user_id) as unique_commenters,
  AVG(LENGTH(content)) as avg_comment_length,
  SUM(like_count) as total_likes,
  COUNT(CASE WHEN status = 'reported' THEN 1 END) as reported_count,
  COUNT(CASE WHEN status = 'deleted' THEN 1 END) as deleted_count,
  DATE_TRUNC('day', created_at) as date
FROM comments
GROUP BY politician_id, DATE_TRUNC('day', created_at);

-- 권한 설정
GRANT SELECT ON comment_statistics TO authenticated;

-- ===========================
-- 11. 보안 검증 쿼리
-- ===========================
DO $$
DECLARE
  v_policy_count INT;
BEGIN
  -- RLS 활성화 확인
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE tablename = 'comments'
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS is not enabled on comments table';
  END IF;

  -- 정책 개수 확인
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE tablename = 'comments';

  IF v_policy_count != 4 THEN
    RAISE WARNING 'Expected 4 policies but found %', v_policy_count;
  END IF;

  RAISE NOTICE 'Comments RLS setup completed successfully';
END $$;

-- ===========================
-- 12. 테스트 데이터 (개발 환경용)
-- ===========================
-- 주석 처리: 프로덕션에서는 실행하지 않음
/*
-- 테스트 사용자 생성
INSERT INTO auth.users (id, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'test1@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'test2@example.com');

-- 테스트 댓글
INSERT INTO comments (politician_id, user_id, content) VALUES
  (1, '11111111-1111-1111-1111-111111111111', '첫 번째 테스트 댓글'),
  (1, '22222222-2222-2222-2222-222222222222', '두 번째 테스트 댓글');

-- RLS 테스트
SET SESSION auth.uid = '11111111-1111-1111-1111-111111111111';
SELECT * FROM comments; -- 모든 댓글 조회 가능
UPDATE comments SET content = '수정됨' WHERE user_id = auth.uid(); -- 성공
UPDATE comments SET content = '해킹' WHERE user_id != auth.uid(); -- 실패
*/