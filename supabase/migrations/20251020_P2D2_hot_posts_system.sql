-- P2D2: 실시간 인기글 시스템
-- mockup-d4 메인 페이지의 실시간 인기글 15개 표시를 위한 시스템

-- 1. posts 테이블에 hot_score 컬럼 추가
DO $$
BEGIN
  -- hot_score: 인기도 점수 (조회수, 추천수, 댓글수, 시간 감쇠 고려)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'hot_score'
  ) THEN
    ALTER TABLE posts ADD COLUMN hot_score DECIMAL(10,2) DEFAULT 0;
  END IF;

  -- trending_rank: 현재 순위 (캐시용)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'trending_rank'
  ) THEN
    ALTER TABLE posts ADD COLUMN trending_rank INTEGER;
  END IF;

  -- is_hot: HOT 뱃지 표시 여부
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'is_hot'
  ) THEN
    ALTER TABLE posts ADD COLUMN is_hot BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 2. Hot Score 계산 함수
CREATE OR REPLACE FUNCTION calculate_hot_score(
  p_view_count INTEGER,
  p_upvotes INTEGER,
  p_downvotes INTEGER,
  p_comment_count INTEGER,
  p_created_at TIMESTAMP WITH TIME ZONE
) RETURNS DECIMAL AS $$
DECLARE
  time_hours DECIMAL;
  time_decay DECIMAL;
  base_score DECIMAL;
  controversy_factor DECIMAL;
BEGIN
  -- 경과 시간 (시간 단위)
  time_hours := EXTRACT(EPOCH FROM (NOW() - p_created_at)) / 3600;

  -- 시간 감쇠 계산 (24시간 반감기)
  -- e^(-t/24)
  time_decay := EXP(-time_hours / 24);

  -- 기본 점수 계산
  -- 조회수(0.1배) + 추천수(3배) + 댓글수(2배)
  base_score := (COALESCE(p_view_count, 0) * 0.1) +
                (COALESCE(p_upvotes, 0) * 3) +
                (COALESCE(p_comment_count, 0) * 2);

  -- 논쟁도 반영 (반대가 많으면 가중치)
  IF p_downvotes > 0 AND p_upvotes > 0 THEN
    controversy_factor := 1 + (LEAST(p_downvotes::DECIMAL / p_upvotes, 1) * 0.3);
  ELSE
    controversy_factor := 1;
  END IF;

  -- 최종 점수 = 기본점수 * 논쟁도 * 시간감쇠
  RETURN ROUND(base_score * controversy_factor * time_decay, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Hot Score 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_hot_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.hot_score := calculate_hot_score(
    NEW.view_count,
    NEW.upvotes,
    NEW.downvotes,
    COALESCE((SELECT COUNT(*) FROM comments WHERE post_id = NEW.id), 0),
    NEW.created_at
  );

  -- HOT 뱃지: hot_score가 50 이상이고 24시간 이내 글
  NEW.is_hot := (
    NEW.hot_score >= 50 AND
    NEW.created_at > NOW() - INTERVAL '24 hours'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_hot_score ON posts;
CREATE TRIGGER trigger_update_hot_score
  BEFORE INSERT OR UPDATE OF view_count, upvotes, downvotes ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_hot_score();

-- 4. 댓글 추가/삭제 시 hot_score 업데이트
CREATE OR REPLACE FUNCTION update_post_hot_score_on_comment()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts
    SET hot_score = calculate_hot_score(
      view_count,
      upvotes,
      downvotes,
      (SELECT COUNT(*) FROM comments WHERE post_id = NEW.post_id),
      created_at
    )
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts
    SET hot_score = calculate_hot_score(
      view_count,
      upvotes,
      downvotes,
      (SELECT COUNT(*) FROM comments WHERE post_id = OLD.post_id),
      created_at
    )
    WHERE id = OLD.post_id;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_comment_hot_score ON comments;
CREATE TRIGGER trigger_comment_hot_score
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_hot_score_on_comment();

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_posts_hot_score_desc
  ON posts(hot_score DESC) WHERE hot_score > 0;

CREATE INDEX IF NOT EXISTS idx_posts_trending_rank
  ON posts(trending_rank) WHERE trending_rank IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_posts_is_hot
  ON posts(is_hot) WHERE is_hot = true;

CREATE INDEX IF NOT EXISTS idx_posts_created_hot
  ON posts(created_at DESC, hot_score DESC);

-- 6. 실시간 인기글 TOP 15 뷰 생성
CREATE OR REPLACE VIEW v_hot_posts_top15 AS
SELECT
  p.id,
  p.title,
  p.content,
  p.category,
  p.view_count,
  p.upvotes,
  p.downvotes,
  p.created_at,
  p.hot_score,
  p.is_hot,
  p.user_id,
  prof.username as author_username,
  prof.avatar_url as author_avatar,
  COALESCE(c.comment_count, 0) as comment_count
FROM posts p
LEFT JOIN profiles prof ON p.user_id = prof.id
LEFT JOIN (
  SELECT post_id, COUNT(*) as comment_count
  FROM comments
  GROUP BY post_id
) c ON p.id = c.post_id
WHERE p.created_at > NOW() - INTERVAL '7 days' -- 최근 7일 이내
ORDER BY p.hot_score DESC, p.created_at DESC
LIMIT 15;

-- 7. 순위 캐시 업데이트 함수 (5분마다 실행 예정)
CREATE OR REPLACE FUNCTION update_trending_ranks()
RETURNS void AS $$
BEGIN
  WITH ranked_posts AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY hot_score DESC, created_at DESC) as rank
    FROM posts
    WHERE created_at > NOW() - INTERVAL '7 days'
      AND hot_score > 0
    LIMIT 100
  )
  UPDATE posts p
  SET trending_rank = rp.rank
  FROM ranked_posts rp
  WHERE p.id = rp.id;

  -- 100위 밖은 NULL로
  UPDATE posts
  SET trending_rank = NULL
  WHERE id NOT IN (
    SELECT id FROM posts
    WHERE trending_rank IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql;

-- 8. 기존 데이터의 hot_score 계산
UPDATE posts
SET hot_score = calculate_hot_score(
  view_count,
  upvotes,
  downvotes,
  (SELECT COUNT(*) FROM comments WHERE post_id = posts.id),
  created_at
)
WHERE hot_score = 0;

-- 9. 순위 초기 계산
SELECT update_trending_ranks();

-- 10. RLS는 posts 테이블에 이미 설정되어 있음

-- 완료
COMMENT ON COLUMN posts.hot_score IS '인기도 점수 (조회수, 추천수, 댓글수, 시간 감쇠 반영)';
COMMENT ON COLUMN posts.trending_rank IS '실시간 순위 (캐시)';
COMMENT ON COLUMN posts.is_hot IS 'HOT 뱃지 표시 여부';
COMMENT ON FUNCTION calculate_hot_score IS '게시글 인기도 점수 계산';
COMMENT ON VIEW v_hot_posts_top15 IS '메인 페이지 실시간 인기글 TOP 15';
