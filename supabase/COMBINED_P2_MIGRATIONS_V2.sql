-- Phase 2D 통합 마이그레이션 v2
-- 기존 스키마 완전 호환 버전

-- ============================================
-- P2D1: AI 평점 시스템 확장
-- ============================================

-- 1. politicians 테이블에 composite_score 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'politicians' AND column_name = 'composite_score'
  ) THEN
    ALTER TABLE politicians ADD COLUMN composite_score DECIMAL(4,1);
  END IF;
END $$;

-- 2. composite_score 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_politician_composite_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE politicians
  SET composite_score = (
    SELECT ROUND(AVG(score)::numeric, 1)
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

-- 3. AI 평점 TOP 10 뷰
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
GROUP BY p.id
HAVING p.composite_score IS NOT NULL
ORDER BY p.composite_score DESC
LIMIT 10;

-- ============================================
-- P2D2: 실시간 인기글 시스템
-- ============================================

-- 1. posts 테이블에 인기글 컬럼 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'hot_score'
  ) THEN
    ALTER TABLE posts ADD COLUMN hot_score DECIMAL(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'is_hot'
  ) THEN
    ALTER TABLE posts ADD COLUMN is_hot BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'posts' AND column_name = 'trending_rank'
  ) THEN
    ALTER TABLE posts ADD COLUMN trending_rank INTEGER;
  END IF;
END $$;

-- 2. hot_score 계산 함수 (comment_count는 계산)
CREATE OR REPLACE FUNCTION calculate_hot_score(
  p_id INTEGER,
  views INTEGER,
  upvotes INTEGER,
  downvotes INTEGER,
  post_time TIMESTAMPTZ
) RETURNS DECIMAL AS $$
DECLARE
  base_score DECIMAL;
  time_decay DECIMAL;
  controversy DECIMAL;
  hours_old DECIMAL;
  comment_cnt INTEGER;
BEGIN
  -- 댓글 수 계산
  SELECT COUNT(*) INTO comment_cnt
  FROM comments
  WHERE post_id = p_id;

  -- 기본 점수
  base_score := (views * 0.1) + (upvotes * 3) + (comment_cnt * 2) - (downvotes * 1);

  -- 시간 감쇠
  hours_old := EXTRACT(EPOCH FROM (NOW() - post_time)) / 3600.0;
  time_decay := EXP(-hours_old / 24.0);

  -- 논쟁도
  IF upvotes + downvotes > 0 THEN
    controversy := 1.0 + (LEAST(upvotes, downvotes)::DECIMAL / GREATEST(upvotes, downvotes, 1)::DECIMAL) * 0.5;
  ELSE
    controversy := 1.0;
  END IF;

  RETURN ROUND(base_score * time_decay * controversy, 2);
END;
$$ LANGUAGE plpgsql;

-- 3. 실시간 인기글 TOP 15 뷰 (comments 조인)
CREATE OR REPLACE VIEW v_hot_posts_top15 AS
SELECT
  p.id,
  p.title,
  p.content,
  p.category,
  p.view_count,
  p.upvotes,
  p.downvotes,
  COUNT(c.id) as comment_count,
  calculate_hot_score(p.id, p.view_count, p.upvotes, p.downvotes, p.created_at) as hot_score,
  (calculate_hot_score(p.id, p.view_count, p.upvotes, p.downvotes, p.created_at) >= 50
   AND p.created_at > NOW() - INTERVAL '24 hours') as is_hot,
  p.created_at,
  pr.username as author_username,
  pr.avatar_url as author_avatar
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.id
LEFT JOIN comments c ON p.id = c.post_id
WHERE p.created_at > NOW() - INTERVAL '7 days'
GROUP BY p.id, pr.username, pr.avatar_url
ORDER BY hot_score DESC
LIMIT 15;

-- 4. hot_score 일괄 업데이트 함수
CREATE OR REPLACE FUNCTION update_all_hot_scores()
RETURNS void AS $$
BEGIN
  UPDATE posts
  SET
    hot_score = calculate_hot_score(id, view_count, upvotes, downvotes, created_at),
    is_hot = (
      calculate_hot_score(id, view_count, upvotes, downvotes, created_at) >= 50
      AND created_at > NOW() - INTERVAL '24 hours'
    );
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

-- 3. 샘플 데이터
INSERT INTO politician_posts (politician_id, title, content, platform, published_at)
SELECT
  p.id,
  '샘플 게시글 ' || gs.n,
  '이것은 ' || p.name || ' 정치인의 샘플 게시글입니다.',
  (ARRAY['twitter', 'facebook', 'blog'])[floor(random() * 3 + 1)],
  NOW() - (gs.n || ' hours')::INTERVAL
FROM politicians p
CROSS JOIN generate_series(1, 3) gs(n)
WHERE NOT EXISTS (SELECT 1 FROM politician_posts LIMIT 1)
LIMIT 30;

-- ============================================
-- P2D4: 사이드바 위젯 시스템
-- ============================================

-- 1. 실시간 통계 뷰 (comments 카운트)
CREATE OR REPLACE VIEW v_realtime_stats AS
SELECT
  (SELECT COUNT(*) FROM posts WHERE created_at > NOW() - INTERVAL '1 hour') as posts_last_hour,
  (SELECT COUNT(*) FROM comments WHERE created_at > NOW() - INTERVAL '1 hour') as comments_last_hour,
  (SELECT COUNT(DISTINCT user_id) FROM posts WHERE created_at > NOW() - INTERVAL '24 hours') as active_users_24h,
  (SELECT COUNT(*) FROM posts WHERE calculate_hot_score(id, view_count, upvotes, downvotes, created_at) >= 50) as hot_posts_count,
  NOW() as last_updated;

-- 2. 최근 댓글 위젯
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

-- 3. 연결된 서비스 테이블
CREATE TABLE IF NOT EXISTS connected_services (
  id SERIAL PRIMARY KEY,
  service_name TEXT NOT NULL,
  service_url TEXT NOT NULL,
  icon_url TEXT,
  status TEXT CHECK (status IN ('active', 'inactive', 'maintenance')) DEFAULT 'active',
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO connected_services (service_name, service_url, status, last_sync)
VALUES
  ('국회의원 현황', 'https://open.assembly.go.kr', 'active', NOW()),
  ('선거관리위원회', 'https://www.nec.go.kr', 'active', NOW()),
  ('정치자금넷', 'https://www.nesdc.go.kr', 'active', NOW())
ON CONFLICT DO NOTHING;

-- 4. 사이드바 전체 데이터 함수
CREATE OR REPLACE FUNCTION get_sidebar_data()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'realtimeStats', (SELECT row_to_json(v) FROM v_realtime_stats v),
    'hotPosts', (SELECT json_agg(row_to_json(v)) FROM (SELECT * FROM v_hot_posts_top15 LIMIT 5) v),
    'recentComments', (SELECT json_agg(row_to_json(v)) FROM v_recent_comments_widget v),
    'connectedServices', (SELECT json_agg(row_to_json(c)) FROM connected_services c WHERE status = 'active')
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 초기화
-- ============================================

-- 1. 기존 politicians의 composite_score 계산
UPDATE politicians
SET composite_score = (
  SELECT ROUND(AVG(score)::numeric, 1)
  FROM ai_scores
  WHERE politician_id = politicians.id
)
WHERE EXISTS (
  SELECT 1 FROM ai_scores WHERE politician_id = politicians.id
);

-- 2. hot_score 일괄 업데이트
SELECT update_all_hot_scores();

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ Phase 2D 마이그레이션 v2 완료!';
END $$;
