-- P2D1: AI 평점 시스템 확장
-- mockup-d4 디자인을 위한 AI 평점 시스템 완전 재구축

-- 1. 기존 ai_scores 테이블 구조 확인 및 확장
DO $$
BEGIN
  -- composite_score 컬럼 추가 (AI종합평점)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_scores' AND column_name = 'composite_score'
  ) THEN
    ALTER TABLE ai_scores ADD COLUMN composite_score DECIMAL(4,1);
  END IF;

  -- gpt_score 컬럼 추가 (추후 사용)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_scores' AND column_name = 'gpt_score'
  ) THEN
    ALTER TABLE ai_scores ADD COLUMN gpt_score DECIMAL(4,1);
  END IF;

  -- gemini_score 컬럼 추가 (추후 사용)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_scores' AND column_name = 'gemini_score'
  ) THEN
    ALTER TABLE ai_scores ADD COLUMN gemini_score DECIMAL(4,1);
  END IF;

  -- grok_score 컬럼 추가 (추후 사용)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_scores' AND column_name = 'grok_score'
  ) THEN
    ALTER TABLE ai_scores ADD COLUMN grok_score DECIMAL(4,1);
  END IF;

  -- perplexity_score 컬럼 추가 (추후 사용)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_scores' AND column_name = 'perplexity_score'
  ) THEN
    ALTER TABLE ai_scores ADD COLUMN perplexity_score DECIMAL(4,1);
  END IF;

  -- claude_score는 기존에 있다고 가정
END $$;

-- 2. composite_score 자동 계산 함수
CREATE OR REPLACE FUNCTION calculate_composite_score(
  claude DECIMAL,
  gpt DECIMAL DEFAULT NULL,
  gemini DECIMAL DEFAULT NULL,
  grok DECIMAL DEFAULT NULL,
  perp DECIMAL DEFAULT NULL
) RETURNS DECIMAL AS $$
DECLARE
  total DECIMAL := 0;
  count INTEGER := 0;
BEGIN
  -- 현재는 Claude만 사용
  IF claude IS NOT NULL THEN
    total := total + claude;
    count := count + 1;
  END IF;

  -- 추후 다른 AI 평점 추가 시
  IF gpt IS NOT NULL THEN
    total := total + gpt;
    count := count + 1;
  END IF;

  IF gemini IS NOT NULL THEN
    total := total + gemini;
    count := count + 1;
  END IF;

  IF grok IS NOT NULL THEN
    total := total + grok;
    count := count + 1;
  END IF;

  IF perp IS NOT NULL THEN
    total := total + perp;
    count := count + 1;
  END IF;

  IF count > 0 THEN
    RETURN ROUND(total / count, 1);
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. composite_score 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_composite_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.composite_score := calculate_composite_score(
    NEW.claude_score,
    NEW.gpt_score,
    NEW.gemini_score,
    NEW.grok_score,
    NEW.perplexity_score
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_composite_score ON ai_scores;
CREATE TRIGGER trigger_update_composite_score
  BEFORE INSERT OR UPDATE ON ai_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_composite_score();

-- 4. 필요한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_ai_scores_composite_desc
  ON ai_scores(composite_score DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_ai_scores_politician_composite
  ON ai_scores(politician_id, composite_score DESC);

CREATE INDEX IF NOT EXISTS idx_ai_scores_claude_desc
  ON ai_scores(claude_score DESC NULLS LAST);

-- 5. AI 평점 랭킹 뷰 생성 (TOP 10용)
CREATE OR REPLACE VIEW v_ai_ranking_top10 AS
SELECT
  p.id,
  p.name,
  p.party,
  p.region,
  p.position,
  p.status,
  p.profile_image_url,
  a.claude_score,
  a.gpt_score,
  a.gemini_score,
  a.grok_score,
  a.perplexity_score,
  a.composite_score,
  COALESCE(r.avg_rating, 0) as member_rating,
  COALESCE(r.rating_count, 0) as member_rating_count
FROM politicians p
LEFT JOIN ai_scores a ON p.id = a.politician_id
LEFT JOIN (
  SELECT
    politician_id,
    AVG(score) as avg_rating,
    COUNT(*) as rating_count
  FROM ratings
  GROUP BY politician_id
) r ON p.id = r.politician_id
WHERE a.composite_score IS NOT NULL
ORDER BY a.composite_score DESC
LIMIT 10;

-- 6. 기존 데이터의 composite_score 업데이트
UPDATE ai_scores
SET composite_score = calculate_composite_score(
  claude_score,
  gpt_score,
  gemini_score,
  grok_score,
  perplexity_score
)
WHERE composite_score IS NULL;

-- 7. RLS 정책 (읽기는 모두 허용, 쓰기는 admin만)
ALTER TABLE ai_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "AI scores are viewable by everyone" ON ai_scores;
CREATE POLICY "AI scores are viewable by everyone"
  ON ai_scores FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only admins can insert AI scores" ON ai_scores;
CREATE POLICY "Only admins can insert AI scores"
  ON ai_scores FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Only admins can update AI scores" ON ai_scores;
CREATE POLICY "Only admins can update AI scores"
  ON ai_scores FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- 완료
COMMENT ON TABLE ai_scores IS 'AI 평가 점수 (Claude, GPT, Gemini, Grok, Perplexity)';
COMMENT ON COLUMN ai_scores.composite_score IS 'AI 종합 평점 (평균)';
COMMENT ON VIEW v_ai_ranking_top10 IS '메인 페이지 AI 평점 랭킹 TOP 10';
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
-- P2D4: 사이드바 위젯 시스템
-- mockup-d4 메인 페이지 사이드바 8개 위젯을 위한 데이터 시스템

-- 1. 정치인 통계 뷰 (위젯 1: 정치인 등록 현황)
CREATE OR REPLACE VIEW v_politician_stats AS
SELECT
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE status = '현직') as active_count,
  COUNT(*) FILTER (WHERE status = '후보자') as candidate_count,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_this_week
FROM politicians;

-- 2. 급상승 정치인 계산 함수 (위젯 2: 평점 급상승 정치인)
-- 일주일간 평점 변화량 기준
CREATE TABLE IF NOT EXISTS politician_score_history (
  id BIGSERIAL PRIMARY KEY,
  politician_id INTEGER NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  composite_score DECIMAL(4,1),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_score_history_politician_recorded
  ON politician_score_history(politician_id, recorded_at DESC);

-- 점수 변화량 계산 뷰
CREATE OR REPLACE VIEW v_trending_politicians AS
WITH recent_scores AS (
  SELECT
    politician_id,
    composite_score as current_score,
    LAG(composite_score, 1) OVER (
      PARTITION BY politician_id
      ORDER BY recorded_at DESC
    ) as last_week_score
  FROM politician_score_history
  WHERE recorded_at > NOW() - INTERVAL '8 days'
),
score_changes AS (
  SELECT
    politician_id,
    current_score,
    last_week_score,
    COALESCE(current_score - last_week_score, 0) as score_change
  FROM recent_scores
  WHERE last_week_score IS NOT NULL
)
SELECT
  p.id,
  p.name,
  p.party,
  p.position,
  p.status,
  p.profile_image_url,
  sc.current_score,
  sc.score_change
FROM score_changes sc
JOIN politicians p ON sc.politician_id = p.id
WHERE sc.score_change > 0
ORDER BY sc.score_change DESC
LIMIT 3;

-- 3. 명예의 전당 뷰 (위젯 3)
CREATE OR REPLACE VIEW v_hall_of_fame AS
SELECT
  p.id,
  p.name,
  p.party,
  p.position,
  p.profile_image_url,
  a.composite_score,
  COALESCE(r.avg_rating, 0) as member_rating
FROM politicians p
JOIN ai_scores a ON p.id = a.politician_id
LEFT JOIN (
  SELECT politician_id, AVG(score) as avg_rating
  FROM ratings
  GROUP BY politician_id
) r ON p.id = r.politician_id
WHERE a.composite_score >= 90 -- 90점 이상만
ORDER BY a.composite_score DESC, r.avg_rating DESC
LIMIT 3;

-- 4. 사용자 레벨 시스템 (위젯 4: 내 프로필)
-- profiles 테이블에 이미 user_level, points 컬럼이 있다고 가정

CREATE OR REPLACE FUNCTION get_user_level_info(p_points INTEGER)
RETURNS TABLE (
  level INTEGER,
  level_name VARCHAR,
  current_points INTEGER,
  next_level_points INTEGER,
  progress_percentage INTEGER
) AS $$
DECLARE
  v_level INTEGER;
  v_level_name VARCHAR;
  v_next_points INTEGER;
BEGIN
  -- 레벨 계산
  v_level := FLOOR(p_points / 1000) + 1;

  -- 레벨명
  v_level_name := CASE
    WHEN v_level >= 10 THEN '정치 마스터'
    WHEN v_level >= 7 THEN '정치 전문가'
    WHEN v_level >= 5 THEN '정치 애호가'
    WHEN v_level >= 3 THEN '관심 시민'
    ELSE '새내기'
  END;

  -- 다음 레벨까지 필요한 포인트
  v_next_points := v_level * 1000;

  RETURN QUERY SELECT
    v_level,
    v_level_name,
    p_points,
    v_next_points,
    ((p_points % 1000) * 100 / 1000)::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. 실시간 통계 뷰 (위젯 5)
CREATE OR REPLACE VIEW v_realtime_stats AS
SELECT
  (SELECT COUNT(*) FROM posts WHERE created_at > NOW() - INTERVAL '1 hour') as posts_last_hour,
  (SELECT COUNT(*) FROM comments WHERE created_at > NOW() - INTERVAL '1 hour') as comments_last_hour,
  (SELECT COUNT(DISTINCT user_id) FROM posts WHERE created_at > NOW() - INTERVAL '24 hours') as active_users_24h,
  (SELECT COUNT(*) FROM ratings WHERE created_at > NOW() - INTERVAL '24 hours') as ratings_24h;

-- 6. 최근 댓글 뷰 (위젯 6)
CREATE OR REPLACE VIEW v_recent_comments_widget AS
SELECT
  c.id,
  c.content,
  c.created_at,
  c.post_id,
  p.title as post_title,
  prof.username as author_username,
  prof.avatar_url as author_avatar
FROM comments c
JOIN posts p ON c.post_id = p.id
JOIN profiles prof ON c.user_id = prof.id
ORDER BY c.created_at DESC
LIMIT 5;

-- 7. 연결 서비스 테이블 (위젯 7)
CREATE TABLE IF NOT EXISTS connected_services (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  website_url VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_connected_services_active
  ON connected_services(is_active, display_order);

-- 샘플 데이터
INSERT INTO connected_services (name, category, description, icon, display_order)
VALUES
  ('법률자문', 'legal', '정치인을 위한 법률자문 서비스', '⚖️', 1),
  ('홍보', 'marketing', '정치인의 홍보활동 지원', '📢', 2),
  ('컨설팅', 'consulting', '선거전략 수립, 컨설팅', '💼', 3)
ON CONFLICT DO NOTHING;

-- 8. 광고 테이블 (위젯 8)
CREATE TABLE IF NOT EXISTS widget_ads (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(200),
  content TEXT,
  image_url VARCHAR(500),
  link_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  display_start TIMESTAMP WITH TIME ZONE,
  display_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_widget_ads_active
  ON widget_ads(is_active) WHERE is_active = true;

-- 9. 사이드바 전체 데이터 조회 함수
CREATE OR REPLACE FUNCTION get_sidebar_data(p_user_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'stats', (SELECT row_to_json(v_politician_stats.*) FROM v_politician_stats),
    'trendingPoliticians', (SELECT json_agg(row_to_json(t.*)) FROM v_trending_politicians t),
    'hallOfFame', (SELECT json_agg(row_to_json(h.*)) FROM v_hall_of_fame h),
    'userProfile', CASE
      WHEN p_user_id IS NOT NULL THEN (
        SELECT json_build_object(
          'username', username,
          'avatar_url', avatar_url,
          'user_level', user_level,
          'points', points,
          'posts_count', (SELECT COUNT(*) FROM posts WHERE user_id = p_user_id),
          'upvotes_received', (SELECT COALESCE(SUM(upvotes), 0) FROM posts WHERE user_id = p_user_id)
        )
        FROM profiles WHERE id = p_user_id
      )
      ELSE NULL
    END,
    'realtimeStats', (SELECT row_to_json(v_realtime_stats.*) FROM v_realtime_stats),
    'recentComments', (SELECT json_agg(row_to_json(c.*)) FROM v_recent_comments_widget c),
    'connectedServices', (
      SELECT json_agg(row_to_json(s.*))
      FROM connected_services s
      WHERE is_active = true
      ORDER BY display_order
      LIMIT 3
    ),
    'ad', (
      SELECT row_to_json(a.*)
      FROM widget_ads a
      WHERE is_active = true
        AND (display_start IS NULL OR display_start <= NOW())
        AND (display_end IS NULL OR display_end >= NOW())
      ORDER BY RANDOM()
      LIMIT 1
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- 10. 점수 히스토리 자동 기록 (매일 실행)
CREATE OR REPLACE FUNCTION record_daily_scores()
RETURNS void AS $$
BEGIN
  INSERT INTO politician_score_history (politician_id, composite_score)
  SELECT politician_id, composite_score
  FROM ai_scores
  WHERE composite_score IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- 완료
COMMENT ON VIEW v_politician_stats IS '위젯 1: 정치인 등록 현황';
COMMENT ON VIEW v_trending_politicians IS '위젯 2: 평점 급상승 정치인 TOP 3';
COMMENT ON VIEW v_hall_of_fame IS '위젯 3: 명예의 전당 TOP 3';
COMMENT ON FUNCTION get_user_level_info IS '위젯 4: 사용자 레벨 정보';
COMMENT ON VIEW v_realtime_stats IS '위젯 5: 실시간 통계';
COMMENT ON VIEW v_recent_comments_widget IS '위젯 6: 최근 댓글 5개';
COMMENT ON TABLE connected_services IS '위젯 7: 연결 서비스';
COMMENT ON TABLE widget_ads IS '위젯 8: 광고';
COMMENT ON FUNCTION get_sidebar_data IS '사이드바 전체 데이터 한번에 조회';
