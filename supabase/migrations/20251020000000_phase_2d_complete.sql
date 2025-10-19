-- P2D1-P2D4: 통합 마이그레이션 (기존 스키마 호환 버전)
-- 기존 ai_scores 테이블 구조 유지하면서 필요한 기능 추가

-- ============================================
-- P2D1: AI 평점 시스템 확장
-- ============================================

-- 1. politicians 테이블에 composite_score 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'politicians' AND column_name = 'composite_score'
  ) THEN
    ALTER TABLE politicians ADD COLUMN composite_score DECIMAL(4,1);
    COMMENT ON COLUMN politicians.composite_score IS 'AI 종합 평점 (모든 AI 평균)';
  END IF;
END $$;

-- 2. AI 점수 이력 테이블 (선택적)
CREATE TABLE IF NOT EXISTS politician_score_history (
  id SERIAL PRIMARY KEY,
  politician_id INTEGER REFERENCES politicians(id) ON DELETE CASCADE NOT NULL,
  ai_name TEXT NOT NULL,
  score DECIMAL(4,1) NOT NULL,
  change_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_score_history_politician
ON politician_score_history(politician_id, created_at DESC);

-- 3. composite_score 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_politician_composite_score()
RETURNS TRIGGER AS $$
BEGIN
  -- politicians 테이블의 composite_score를 ai_scores 평균으로 업데이트
  UPDATE politicians
  SET composite_score = (
    SELECT ROUND(AVG(score), 1)
    FROM ai_scores
    WHERE politician_id = NEW.politician_id
  ),
  updated_at = NOW()
  WHERE id = NEW.politician_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_composite_score ON ai_scores;
CREATE TRIGGER trigger_update_composite_score
AFTER INSERT OR UPDATE ON ai_scores
FOR EACH ROW
EXECUTE FUNCTION update_politician_composite_score();

-- 4. AI 평점 TOP 10 뷰
CREATE OR REPLACE VIEW v_ai_ranking_top10 AS
SELECT
  p.id,
  p.name,
  p.party,
  p.region,
  p.position,
  p.profile_image_url,
  p.composite_score,
  COUNT(DISTINCT a.ai_name) as ai_count,
  MAX(CASE WHEN a.ai_name = 'claude' THEN a.score END) as claude_score,
  MAX(CASE WHEN a.ai_name = 'gpt' THEN a.score END) as gpt_score,
  MAX(CASE WHEN a.ai_name = 'gemini' THEN a.score END) as gemini_score,
  MAX(CASE WHEN a.ai_name = 'grok' THEN a.score END) as grok_score,
  MAX(CASE WHEN a.ai_name = 'perplexity' THEN a.score END) as perplexity_score
FROM politicians p
LEFT JOIN ai_scores a ON p.id = a.politician_id
GROUP BY p.id, p.name, p.party, p.region, p.position, p.profile_image_url, p.composite_score
HAVING p.composite_score IS NOT NULL
ORDER BY p.composite_score DESC
LIMIT 10;

-- ============================================
-- P2D2: 실시간 인기글 시스템
-- ============================================

-- 1. posts 테이블에 인기글 관련 컬럼 추가
DO $$
BEGIN
  -- hot_score 컬럼 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'hot_score'
  ) THEN
    ALTER TABLE posts ADD COLUMN hot_score DECIMAL(10,2) DEFAULT 0;
  END IF;

  -- is_hot 컬럼 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'is_hot'
  ) THEN
    ALTER TABLE posts ADD COLUMN is_hot BOOLEAN DEFAULT false;
  END IF;

  -- trending_rank 컬럼 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'trending_rank'
  ) THEN
    ALTER TABLE posts ADD COLUMN trending_rank INTEGER;
  END IF;
END $$;

-- 2. hot_score 계산 함수
CREATE OR REPLACE FUNCTION calculate_hot_score(
  views INTEGER,
  upvotes INTEGER,
  downvotes INTEGER,
  comments INTEGER,
  post_time TIMESTAMPTZ
) RETURNS DECIMAL AS $$
DECLARE
  base_score DECIMAL;
  time_decay DECIMAL;
  controversy DECIMAL;
  hours_old DECIMAL;
BEGIN
  -- 기본 점수 계산
  base_score := (views * 0.1) + (upvotes * 3) + (comments * 2) - (downvotes * 1);

  -- 시간 감쇠 (24시간 반감기)
  hours_old := EXTRACT(EPOCH FROM (NOW() - post_time)) / 3600.0;
  time_decay := EXP(-hours_old / 24.0);

  -- 논쟁도 (찬반 비율)
  IF upvotes + downvotes > 0 THEN
    controversy := 1.0 + (LEAST(upvotes, downvotes)::DECIMAL / GREATEST(upvotes, downvotes, 1)::DECIMAL) * 0.5;
  ELSE
    controversy := 1.0;
  END IF;

  RETURN ROUND(base_score * time_decay * controversy, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. hot_score 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_post_hot_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.hot_score := calculate_hot_score(
    COALESCE(NEW.view_count, 0),
    COALESCE(NEW.upvotes, 0),
    COALESCE(NEW.downvotes, 0),
    COALESCE(NEW.comment_count, 0),
    NEW.created_at
  );

  -- HOT 뱃지 설정 (점수 50 이상 & 24시간 이내)
  NEW.is_hot := (
    NEW.hot_score >= 50 AND
    NEW.created_at > NOW() - INTERVAL '24 hours'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_hot_score ON posts;
CREATE TRIGGER trigger_update_hot_score
BEFORE INSERT OR UPDATE OF view_count, upvotes, downvotes, comment_count
ON posts
FOR EACH ROW
EXECUTE FUNCTION update_post_hot_score();

-- 4. 실시간 인기글 TOP 15 뷰
CREATE OR REPLACE VIEW v_hot_posts_top15 AS
SELECT
  p.id,
  p.title,
  p.content,
  p.category,
  p.view_count,
  p.upvotes,
  p.downvotes,
  p.comment_count,
  p.hot_score,
  p.is_hot,
  p.created_at,
  pr.username as author_username,
  pr.avatar_url as author_avatar
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.id
WHERE p.created_at > NOW() - INTERVAL '7 days'
ORDER BY p.hot_score DESC
LIMIT 15;

-- 5. 인기글 순위 업데이트 함수 (배치 작업용)
CREATE OR REPLACE FUNCTION update_trending_ranks()
RETURNS void AS $$
BEGIN
  WITH ranked_posts AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY hot_score DESC) as rank
    FROM posts
    WHERE created_at > NOW() - INTERVAL '7 days'
    AND hot_score > 0
  )
  UPDATE posts
  SET trending_rank = ranked_posts.rank
  FROM ranked_posts
  WHERE posts.id = ranked_posts.id;

  -- 7일 이상 지난 글은 순위 제거
  UPDATE posts
  SET trending_rank = NULL
  WHERE created_at <= NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- P2D3: 정치인 최근 글 시스템
-- ============================================

-- 1. 정치인 공식 글 테이블
CREATE TABLE IF NOT EXISTS politician_posts (
  id SERIAL PRIMARY KEY,
  politician_id INTEGER REFERENCES politicians(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_url TEXT,
  platform TEXT CHECK (platform IN ('twitter', 'facebook', 'instagram', 'blog', 'youtube', 'official')),
  published_at TIMESTAMPTZ NOT NULL,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_politician_posts_politician
ON politician_posts(politician_id, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_politician_posts_published
ON politician_posts(published_at DESC);

-- 2. 정치인 최근 글 9개 뷰
CREATE OR REPLACE VIEW v_politician_posts_recent9 AS
SELECT
  pp.id,
  pp.politician_id,
  pp.title,
  pp.content,
  pp.source_url,
  pp.platform,
  pp.published_at,
  pp.view_count,
  pp.like_count,
  pp.share_count,
  p.name as politician_name,
  p.party,
  p.profile_image_url
FROM politician_posts pp
JOIN politicians p ON pp.politician_id = p.id
ORDER BY pp.published_at DESC
LIMIT 9;

-- 3. 샘플 데이터 (테스트용)
INSERT INTO politician_posts (politician_id, title, content, platform, published_at)
SELECT
  p.id,
  '샘플 게시글 ' || gs.n,
  '이것은 ' || p.name || ' 정치인의 샘플 게시글입니다.',
  (ARRAY['twitter', 'facebook', 'blog'])[floor(random() * 3 + 1)],
  NOW() - (gs.n || ' hours')::INTERVAL
FROM politicians p
CROSS JOIN generate_series(1, 5) gs(n)
WHERE NOT EXISTS (SELECT 1 FROM politician_posts WHERE politician_id = p.id)
LIMIT 50;

-- ============================================
-- P2D4: 사이드바 위젯 시스템
-- ============================================

-- 1. 실시간 통계 뷰
CREATE OR REPLACE VIEW v_realtime_stats AS
SELECT
  (SELECT COUNT(*) FROM posts WHERE created_at > NOW() - INTERVAL '1 hour') as posts_last_hour,
  (SELECT COUNT(*) FROM comments WHERE created_at > NOW() - INTERVAL '1 hour') as comments_last_hour,
  (SELECT COUNT(DISTINCT user_id) FROM posts WHERE created_at > NOW() - INTERVAL '24 hours') as active_users_24h,
  (SELECT COUNT(*) FROM posts WHERE is_hot = true) as hot_posts_count,
  NOW() as last_updated;

-- 2. 최근 댓글 위젯 뷰
CREATE OR REPLACE VIEW v_recent_comments_widget AS
SELECT
  c.id,
  c.content,
  c.created_at,
  pr.username as author_username,
  pr.avatar_url as author_avatar,
  p.title as post_title,
  p.id as post_id
FROM comments c
LEFT JOIN profiles pr ON c.user_id = pr.id
LEFT JOIN posts p ON c.post_id = p.id
ORDER BY c.created_at DESC
LIMIT 10;

-- 3. 인기 태그 뷰 (posts 테이블에 tags JSONB 있다고 가정)
CREATE OR REPLACE VIEW v_popular_tags AS
SELECT
  tag,
  COUNT(*) as usage_count
FROM posts,
LATERAL jsonb_array_elements_text(COALESCE(tags, '[]'::jsonb)) AS tag
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY tag
ORDER BY usage_count DESC
LIMIT 10;

-- 4. 연결된 서비스 테이블
CREATE TABLE IF NOT EXISTS connected_services (
  id SERIAL PRIMARY KEY,
  service_name TEXT NOT NULL,
  service_url TEXT NOT NULL,
  icon_url TEXT,
  status TEXT CHECK (status IN ('active', 'inactive', 'maintenance')),
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 샘플 데이터
INSERT INTO connected_services (service_name, service_url, status, last_sync)
VALUES
  ('국회의원 현황', 'https://open.assembly.go.kr', 'active', NOW()),
  ('선거관리위원회', 'https://www.nec.go.kr', 'active', NOW()),
  ('정치자금넷', 'https://www.nesdc.go.kr', 'active', NOW())
ON CONFLICT DO NOTHING;

-- 5. 광고 위젯 테이블
CREATE TABLE IF NOT EXISTS widget_ads (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  link_url TEXT,
  position TEXT CHECK (position IN ('sidebar', 'header', 'footer', 'inline')),
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 사이드바 전체 데이터 함수
CREATE OR REPLACE FUNCTION get_sidebar_data()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'realtimeStats', (SELECT row_to_json(v) FROM v_realtime_stats v),
    'hotPosts', (SELECT json_agg(row_to_json(v)) FROM (SELECT * FROM v_hot_posts_top15 LIMIT 5) v),
    'recentComments', (SELECT json_agg(row_to_json(v)) FROM v_recent_comments_widget v),
    'popularTags', (SELECT json_agg(row_to_json(v)) FROM v_popular_tags v),
    'connectedServices', (SELECT json_agg(row_to_json(c)) FROM connected_services c WHERE status = 'active'),
    'ads', (SELECT json_agg(row_to_json(a)) FROM widget_ads a WHERE is_active = true AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW()))
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 초기화 작업
-- ============================================

-- 1. 기존 posts의 hot_score 계산
UPDATE posts
SET hot_score = calculate_hot_score(
  COALESCE(view_count, 0),
  COALESCE(upvotes, 0),
  COALESCE(downvotes, 0),
  COALESCE(comment_count, 0),
  created_at
),
is_hot = (
  calculate_hot_score(
    COALESCE(view_count, 0),
    COALESCE(upvotes, 0),
    COALESCE(downvotes, 0),
    COALESCE(comment_count, 0),
    created_at
  ) >= 50 AND created_at > NOW() - INTERVAL '24 hours'
);

-- 2. 기존 politicians의 composite_score 계산
UPDATE politicians
SET composite_score = (
  SELECT ROUND(AVG(score), 1)
  FROM ai_scores
  WHERE politician_id = politicians.id
)
WHERE EXISTS (
  SELECT 1 FROM ai_scores WHERE politician_id = politicians.id
);

-- 3. 인기글 순위 업데이트
SELECT update_trending_ranks();

-- ============================================
-- 마이그레이션 완료
-- ============================================

-- 성공 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ Phase 2D 마이그레이션 완료!';
  RAISE NOTICE '- AI 평점 시스템 확장 완료';
  RAISE NOTICE '- 실시간 인기글 시스템 구축 완료';
  RAISE NOTICE '- 정치인 최근 글 시스템 구축 완료';
  RAISE NOTICE '- 사이드바 위젯 시스템 구축 완료';
END $$;
