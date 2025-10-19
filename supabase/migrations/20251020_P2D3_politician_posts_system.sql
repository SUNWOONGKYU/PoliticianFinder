-- P2D3: 정치인 최근 글 시스템
-- mockup-d4 메인 페이지의 "정치인 최근 글" 9개 표시를 위한 시스템

-- 1. politician_posts 테이블 생성
CREATE TABLE IF NOT EXISTS politician_posts (
  id BIGSERIAL PRIMARY KEY,
  politician_id INTEGER NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  title VARCHAR(200),
  content TEXT NOT NULL,
  view_count INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_official BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT politician_posts_category_check CHECK (
    category IN ('공약', '활동', '입장표명', '공지', '소통', '보도자료', 'general')
  )
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_politician_posts_politician_id
  ON politician_posts(politician_id);

CREATE INDEX IF NOT EXISTS idx_politician_posts_created_desc
  ON politician_posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_politician_posts_politician_created
  ON politician_posts(politician_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_politician_posts_category
  ON politician_posts(category);

CREATE INDEX IF NOT EXISTS idx_politician_posts_is_pinned
  ON politician_posts(is_pinned) WHERE is_pinned = true;

-- 3. 댓글 수 컬럼 추가 (캐시용)
ALTER TABLE politician_posts ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- 4. 댓글 카운트 업데이트 트리거
CREATE OR REPLACE FUNCTION update_politician_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE politician_posts
    SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE politician_posts
    SET comment_count = GREATEST(0, comment_count - 1)
    WHERE id = OLD.post_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Note: comments 테이블에 politician_post_id 컬럼이 있다고 가정
-- 실제로는 posts와 통합하거나 별도 처리 필요

-- 5. updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_politician_post_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_politician_post_updated_at ON politician_posts;
CREATE TRIGGER trigger_politician_post_updated_at
  BEFORE UPDATE ON politician_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_politician_post_updated_at();

-- 6. 최근 정치인 글 TOP 9 뷰
CREATE OR REPLACE VIEW v_politician_posts_recent9 AS
SELECT
  pp.id,
  pp.politician_id,
  pp.category,
  pp.title,
  pp.content,
  pp.view_count,
  pp.upvotes,
  pp.downvotes,
  pp.comment_count,
  pp.is_pinned,
  pp.is_official,
  pp.created_at,
  p.name as politician_name,
  p.party as politician_party,
  p.position as politician_position,
  p.status as politician_status,
  p.profile_image_url as politician_avatar
FROM politician_posts pp
JOIN politicians p ON pp.politician_id = p.id
WHERE pp.created_at > NOW() - INTERVAL '30 days' -- 최근 30일
ORDER BY pp.is_pinned DESC, pp.created_at DESC
LIMIT 9;

-- 7. 정치인별 최근 글 함수
CREATE OR REPLACE FUNCTION get_politician_recent_posts(
  p_politician_id INTEGER,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id BIGINT,
  category VARCHAR,
  title VARCHAR,
  content TEXT,
  view_count INTEGER,
  upvotes INTEGER,
  comment_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pp.id,
    pp.category,
    pp.title,
    pp.content,
    pp.view_count,
    pp.upvotes,
    pp.comment_count,
    pp.created_at
  FROM politician_posts pp
  WHERE pp.politician_id = p_politician_id
  ORDER BY pp.is_pinned DESC, pp.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- 8. RLS 정책
ALTER TABLE politician_posts ENABLE ROW LEVEL SECURITY;

-- 모두 읽기 가능
DROP POLICY IF EXISTS "Politician posts are viewable by everyone" ON politician_posts;
CREATE POLICY "Politician posts are viewable by everyone"
  ON politician_posts FOR SELECT
  USING (true);

-- 정치인 본인과 admin만 작성 가능
DROP POLICY IF EXISTS "Politicians and admins can insert posts" ON politician_posts;
CREATE POLICY "Politicians and admins can insert posts"
  ON politician_posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.is_admin = true OR
        profiles.user_type = 'politician'
      )
    )
  );

-- 본인 글만 수정 가능
DROP POLICY IF EXISTS "Users can update own posts" ON politician_posts;
CREATE POLICY "Users can update own posts"
  ON politician_posts FOR UPDATE
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  ));

-- 본인 글만 삭제 가능
DROP POLICY IF EXISTS "Users can delete own posts" ON politician_posts;
CREATE POLICY "Users can delete own posts"
  ON politician_posts FOR DELETE
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  ));

-- 9. 샘플 데이터 삽입 (개발용)
-- 실제 환경에서는 제거

INSERT INTO politician_posts (politician_id, category, content, upvotes, comment_count)
SELECT
  p.id,
  (ARRAY['공약', '활동', '입장표명', '소통'])[floor(random() * 4 + 1)],
  '정치인의 최근 활동 및 입장을 공유합니다. 시민 여러분의 목소리를 듣고 있습니다...',
  floor(random() * 300)::INTEGER,
  floor(random() * 50)::INTEGER
FROM politicians p
LIMIT 50
ON CONFLICT DO NOTHING;

-- 완료
COMMENT ON TABLE politician_posts IS '정치인이 작성한 글 (공약, 활동, 입장표명 등)';
COMMENT ON COLUMN politician_posts.is_pinned IS '고정 여부 (정치인 페이지 상단 고정)';
COMMENT ON COLUMN politician_posts.is_official IS '공식 발표 여부';
COMMENT ON VIEW v_politician_posts_recent9 IS '메인 페이지 정치인 최근 글 TOP 9';
