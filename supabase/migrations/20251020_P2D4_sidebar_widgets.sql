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
