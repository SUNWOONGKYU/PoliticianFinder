-- =================================================================
-- Phase 3 Posts/Ratings RLS Policies
-- =================================================================
-- 작업 ID: P3E2
-- 작성일: 2025-01-17
-- 설명: Posts(게시글) 및 Ratings 테이블 RLS 정책 구현
-- =================================================================

-- ===========================
-- 1. Posts 테이블 생성 (없는 경우)
-- ===========================
CREATE TABLE IF NOT EXISTS posts (
  id BIGSERIAL PRIMARY KEY,
  politician_id BIGINT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  post_type VARCHAR(50) DEFAULT 'review' CHECK (post_type IN ('review', 'analysis', 'news', 'opinion')),
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'hidden', 'deleted')),
  view_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  comment_count INT DEFAULT 0,
  share_count INT DEFAULT 0,
  report_count INT DEFAULT 0,

  -- SEO 및 메타데이터
  slug VARCHAR(250) UNIQUE,
  excerpt TEXT,
  featured_image_url TEXT,
  tags TEXT[],

  -- 보안 및 추적
  ip_address INET,
  user_agent TEXT,
  last_edited_by UUID REFERENCES auth.users(id),
  published_at TIMESTAMPTZ,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- 2. 인덱스 생성
-- ===========================
CREATE INDEX IF NOT EXISTS idx_posts_politician_id ON posts(politician_id);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_tags ON posts USING GIN(tags) WHERE tags IS NOT NULL;

-- ===========================
-- 3. Posts RLS 정책
-- ===========================
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "posts_select_policy" ON posts;
DROP POLICY IF EXISTS "posts_insert_policy" ON posts;
DROP POLICY IF EXISTS "posts_update_policy" ON posts;
DROP POLICY IF EXISTS "posts_delete_policy" ON posts;

-- SELECT 정책: 게시 상태에 따른 차별적 접근
CREATE POLICY "posts_select_policy"
ON posts FOR SELECT
USING (
  CASE
    -- 게시된 글은 모두 공개
    WHEN status = 'published' THEN true
    -- 초안은 작성자만
    WHEN status = 'draft' THEN auth.uid() = user_id
    -- 숨김/신고된 글은 작성자와 관리자만
    WHEN status IN ('hidden') THEN (
      auth.uid() = user_id OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'moderator')
      )
    )
    -- 삭제된 글은 관리자만
    WHEN status = 'deleted' THEN EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
    ELSE false
  END
);

-- INSERT 정책: Rate Limiting 및 스팸 방지
CREATE POLICY "posts_insert_policy"
ON posts FOR INSERT
WITH CHECK (
  -- 인증된 사용자만
  auth.uid() IS NOT NULL
  -- 본인 명의로만 작성
  AND auth.uid() = user_id
  -- Rate Limiting: 10분 내 3개 이상 작성 불가
  AND NOT EXISTS (
    SELECT 1 FROM posts p
    WHERE p.user_id = auth.uid()
    AND p.created_at > NOW() - INTERVAL '10 minutes'
    GROUP BY p.user_id
    HAVING COUNT(*) >= 3
  )
  -- 24시간 내 10개 이상 작성 불가
  AND NOT EXISTS (
    SELECT 1 FROM posts p
    WHERE p.user_id = auth.uid()
    AND p.created_at > NOW() - INTERVAL '24 hours'
    GROUP BY p.user_id
    HAVING COUNT(*) >= 10
  )
  -- 차단된 사용자 제외
  AND NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND (banned = true OR status = 'suspended')
  )
  -- 최소 글자 수 체크 (제목 10자, 내용 50자)
  AND LENGTH(title) >= 10
  AND LENGTH(content) >= 50
);

-- UPDATE 정책: 작성자 및 편집 권한
CREATE POLICY "posts_update_policy"
ON posts FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND (
    -- 작성자 본인
    (auth.uid() = user_id AND status IN ('draft', 'published'))
    -- 관리자/모더레이터
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  )
  -- 게시 후 7일 이내만 수정 가능 (관리자 제외)
  AND (
    status = 'draft'
    OR published_at > NOW() - INTERVAL '7 days'
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  )
)
WITH CHECK (
  -- 구조적 필드 변경 불가
  politician_id = OLD.politician_id
  AND user_id = OLD.user_id
  AND id = OLD.id
  -- 수정 시 메타데이터 업데이트
  AND edited_at IS NOT NULL
  AND last_edited_by = auth.uid()
);

-- DELETE 정책: 소프트 삭제 권한
CREATE POLICY "posts_delete_policy"
ON posts FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND (
    -- 작성자 본인 (게시 후 24시간 이내)
    (auth.uid() = user_id AND created_at > NOW() - INTERVAL '24 hours')
    -- 관리자
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  )
);

-- ===========================
-- 4. Ratings RLS 정책 (평가 테이블)
-- ===========================
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "ratings_select_policy" ON ratings;
DROP POLICY IF EXISTS "ratings_insert_policy" ON ratings;
DROP POLICY IF EXISTS "ratings_update_policy" ON ratings;
DROP POLICY IF EXISTS "ratings_delete_policy" ON ratings;

-- SELECT 정책: 모든 평가 공개
CREATE POLICY "ratings_select_policy"
ON ratings FOR SELECT
USING (true);

-- INSERT 정책: 사용자당 정치인별 1개 평가
CREATE POLICY "ratings_insert_policy"
ON ratings FOR INSERT
WITH CHECK (
  -- 인증된 사용자만
  auth.uid() IS NOT NULL
  -- 본인 명의로만
  AND auth.uid() = user_id
  -- 중복 평가 방지
  AND NOT EXISTS (
    SELECT 1 FROM ratings r
    WHERE r.user_id = auth.uid()
    AND r.politician_id = NEW.politician_id
  )
  -- 유효한 점수 범위 (1-5)
  AND rating_overall BETWEEN 1 AND 5
  AND rating_honesty BETWEEN 1 AND 5
  AND rating_ability BETWEEN 1 AND 5
  AND rating_communication BETWEEN 1 AND 5
);

-- UPDATE 정책: 본인 평가만 수정
CREATE POLICY "ratings_update_policy"
ON ratings FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND auth.uid() = user_id
  -- 30일 이내만 수정 가능
  AND created_at > NOW() - INTERVAL '30 days'
)
WITH CHECK (
  -- 구조 필드 변경 불가
  politician_id = OLD.politician_id
  AND user_id = OLD.user_id
  -- 유효한 점수 범위
  AND rating_overall BETWEEN 1 AND 5
  AND rating_honesty BETWEEN 1 AND 5
  AND rating_ability BETWEEN 1 AND 5
  AND rating_communication BETWEEN 1 AND 5
);

-- DELETE 정책: 본인 평가만 삭제
CREATE POLICY "ratings_delete_policy"
ON ratings FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND auth.uid() = user_id
);

-- ===========================
-- 5. 조회수 증가 함수 (봇 방지)
-- ===========================
CREATE OR REPLACE FUNCTION increment_post_view(
  p_post_id BIGINT,
  p_user_ip INET DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_last_view TIMESTAMPTZ;
BEGIN
  -- IP 기반 중복 조회 방지 (1시간)
  IF p_user_ip IS NOT NULL THEN
    SELECT MAX(viewed_at) INTO v_last_view
    FROM post_views
    WHERE post_id = p_post_id
    AND ip_address = p_user_ip
    AND viewed_at > NOW() - INTERVAL '1 hour';

    IF v_last_view IS NOT NULL THEN
      RETURN; -- 이미 조회함
    END IF;

    -- 조회 기록
    INSERT INTO post_views (post_id, user_id, ip_address, viewed_at)
    VALUES (p_post_id, auth.uid(), p_user_ip, NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- 조회수 증가
  UPDATE posts
  SET view_count = view_count + 1
  WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================
-- 6. 슬러그 생성 함수
-- ===========================
CREATE OR REPLACE FUNCTION generate_post_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL THEN
    NEW.slug = LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          NEW.title,
          '[^a-zA-Z0-9가-힣\s-]', '', 'g'
        ),
        '\s+', '-', 'g'
      )
    ) || '-' || NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS generate_post_slug_trigger ON posts;
CREATE TRIGGER generate_post_slug_trigger
AFTER INSERT ON posts
FOR EACH ROW EXECUTE FUNCTION generate_post_slug();

-- ===========================
-- 7. 게시글 통계 업데이트 함수
-- ===========================
CREATE OR REPLACE FUNCTION update_post_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'comments' THEN
    -- 댓글 수 업데이트
    IF TG_OP = 'INSERT' THEN
      UPDATE posts
      SET comment_count = comment_count + 1
      WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE posts
      SET comment_count = comment_count - 1
      WHERE id = OLD.post_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'likes' THEN
    -- 좋아요 수 업데이트
    IF TG_OP = 'INSERT' AND NEW.target_type = 'post' THEN
      UPDATE posts
      SET like_count = like_count + 1
      WHERE id = NEW.target_id;
    ELSIF TG_OP = 'DELETE' AND OLD.target_type = 'post' THEN
      UPDATE posts
      SET like_count = like_count - 1
      WHERE id = OLD.target_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ===========================
-- 8. 보안 검증
-- ===========================
DO $$
DECLARE
  v_posts_policies INT;
  v_ratings_policies INT;
BEGIN
  -- Posts RLS 확인
  SELECT COUNT(*) INTO v_posts_policies
  FROM pg_policies
  WHERE tablename = 'posts';

  -- Ratings RLS 확인
  SELECT COUNT(*) INTO v_ratings_policies
  FROM pg_policies
  WHERE tablename = 'ratings';

  RAISE NOTICE 'Posts policies: %, Ratings policies: %',
    v_posts_policies, v_ratings_policies;

  IF v_posts_policies < 4 OR v_ratings_policies < 4 THEN
    RAISE WARNING 'Some RLS policies may be missing';
  END IF;
END $$;

-- ===========================
-- 9. 보안 뷰: 안전한 게시글 목록
-- ===========================
CREATE OR REPLACE VIEW safe_posts_view AS
SELECT
  p.id,
  p.politician_id,
  p.title,
  p.excerpt,
  p.post_type,
  p.view_count,
  p.like_count,
  p.comment_count,
  p.published_at,
  p.featured_image_url,
  p.tags,
  pr.username as author_name,
  pr.avatar_url as author_avatar,
  pol.name as politician_name,
  pol.party as politician_party
FROM posts p
JOIN profiles pr ON p.user_id = pr.id
JOIN politicians pol ON p.politician_id = pol.id
WHERE p.status = 'published'
AND p.report_count < 5;

-- 권한 부여
GRANT SELECT ON safe_posts_view TO anon, authenticated;