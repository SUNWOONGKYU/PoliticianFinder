-- =================================================================
-- Phase 2 Posts Table Extension
-- =================================================================
-- 작업 ID: P2D4
-- 작성일: 2025-10-19
-- 설명: 게시판 기능을 위한 posts 테이블 확장
-- =================================================================

-- ===========================
-- 1. 필요한 컬럼 추가
-- ===========================

-- 카테고리 필드 추가 (general, politics, question 등)
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general'
CHECK (category IN ('general', 'politics', 'question', 'review'));

-- 핀고정 및 인기글 표시
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

ALTER TABLE posts
ADD COLUMN IF NOT EXISTS is_hot BOOLEAN DEFAULT FALSE;

-- ===========================
-- 2. 인덱스 생성
-- ===========================

-- 카테고리별 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_posts_category
ON posts(category)
WHERE status = 'published';

-- 인기글 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_posts_hot
ON posts(is_hot)
WHERE is_hot = true AND status = 'published';

-- 핀고정 글 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_posts_pinned
ON posts(is_pinned)
WHERE is_pinned = true AND status = 'published';

-- 정렬 최적화를 위한 복합 인덱스
CREATE INDEX IF NOT EXISTS idx_posts_category_created
ON posts(category, created_at DESC)
WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_posts_category_views
ON posts(category, view_count DESC)
WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_posts_category_likes
ON posts(category, like_count DESC)
WHERE status = 'published';

-- ===========================
-- 3. 트리거 함수 생성 (HOT 게시글 자동 설정)
-- ===========================

CREATE OR REPLACE FUNCTION update_post_hot_status()
RETURNS TRIGGER AS $$
BEGIN
  -- 조회수 100 이상 또는 좋아요 10개 이상인 글을 자동으로 HOT으로 설정
  IF NEW.view_count >= 100 OR NEW.like_count >= 10 THEN
    NEW.is_hot := TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_post_hot_status ON posts;
CREATE TRIGGER trigger_update_post_hot_status
  BEFORE UPDATE OF view_count, like_count ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_post_hot_status();

-- ===========================
-- 4. RLS 정책 추가 (카테고리별 권한)
-- ===========================

-- 관리자만 게시글 고정 가능
CREATE POLICY IF NOT EXISTS "Admin can pin posts"
  ON posts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ===========================
-- 5. 뷰 생성 (카테고리별 게시글 조회)
-- ===========================

CREATE OR REPLACE VIEW posts_by_category AS
SELECT
  p.*,
  pol.name as politician_name,
  pol.party as politician_party,
  prof.username as author_name,
  prof.avatar_url as author_avatar
FROM posts p
LEFT JOIN politicians pol ON p.politician_id = pol.id
LEFT JOIN profiles prof ON p.user_id = prof.id
WHERE p.status = 'published'
ORDER BY
  p.is_pinned DESC,
  p.is_hot DESC,
  p.created_at DESC;

-- ===========================
-- 6. 함수 생성 (조회수 증가)
-- ===========================

CREATE OR REPLACE FUNCTION increment_post_view_count(post_id BIGINT)
RETURNS void AS $$
BEGIN
  UPDATE posts
  SET view_count = view_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================
-- 7. 함수 생성 (좋아요 토글)
-- ===========================

CREATE OR REPLACE FUNCTION toggle_post_like(p_post_id BIGINT, p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_exists BOOLEAN;
  v_result JSONB;
BEGIN
  -- likes 테이블이 있는지 확인하고 처리
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'likes'
  ) THEN
    -- 이미 좋아요가 있는지 확인
    SELECT EXISTS(
      SELECT 1 FROM likes
      WHERE post_id = p_post_id
      AND user_id = p_user_id
    ) INTO v_exists;

    IF v_exists THEN
      -- 좋아요 제거
      DELETE FROM likes
      WHERE post_id = p_post_id AND user_id = p_user_id;

      -- like_count 감소
      UPDATE posts
      SET like_count = GREATEST(0, like_count - 1)
      WHERE id = p_post_id;

      v_result := jsonb_build_object('liked', false, 'message', 'Like removed');
    ELSE
      -- 좋아요 추가
      INSERT INTO likes (post_id, user_id)
      VALUES (p_post_id, p_user_id);

      -- like_count 증가
      UPDATE posts
      SET like_count = like_count + 1
      WHERE id = p_post_id;

      v_result := jsonb_build_object('liked', true, 'message', 'Like added');
    END IF;
  ELSE
    -- likes 테이블이 없으면 단순히 like_count만 토글
    UPDATE posts
    SET like_count = like_count + 1
    WHERE id = p_post_id;

    v_result := jsonb_build_object('liked', true, 'message', 'Like count increased');
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================
-- 8. 통계 함수 생성
-- ===========================

CREATE OR REPLACE FUNCTION get_post_statistics()
RETURNS TABLE(
  category TEXT,
  total_posts BIGINT,
  total_views BIGINT,
  total_likes BIGINT,
  hot_posts BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.category,
    COUNT(*)::BIGINT as total_posts,
    SUM(p.view_count)::BIGINT as total_views,
    SUM(p.like_count)::BIGINT as total_likes,
    COUNT(*) FILTER (WHERE p.is_hot = true)::BIGINT as hot_posts
  FROM posts p
  WHERE p.status = 'published'
  GROUP BY p.category
  ORDER BY total_posts DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ===========================
-- 9. 권한 부여
-- ===========================

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION increment_post_view_count(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_post_like(BIGINT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_post_statistics() TO authenticated, anon;

-- 뷰 조회 권한 부여
GRANT SELECT ON posts_by_category TO authenticated, anon;

-- ===========================
-- 10. 마이그레이션 검증
-- ===========================

DO $$
BEGIN
  -- 컬럼 존재 확인
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'category'
  ) THEN
    RAISE EXCEPTION 'Migration failed: category column not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'is_pinned'
  ) THEN
    RAISE EXCEPTION 'Migration failed: is_pinned column not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'is_hot'
  ) THEN
    RAISE EXCEPTION 'Migration failed: is_hot column not created';
  END IF;

  RAISE NOTICE 'Phase 2 posts extension migration completed successfully';
END;
$$;