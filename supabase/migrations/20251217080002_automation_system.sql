-- Migration: P7BA4 Automation System
-- Description: 자동화 시스템을 위한 테이블 및 함수
-- Date: 2025-12-17

-- ============================================================================
-- 1. 자동화 작업 로그 테이블
-- ============================================================================

CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL CHECK (job_type IN (
    'backup',           -- 데이터 백업
    'cleanup',          -- 오래된 데이터 정리
    'statistics',       -- 통계 생성
    'news_crawl',       -- 뉴스 크롤링
    'rank_recalculation', -- 랭킹 재계산
    'notification_cleanup', -- 오래된 알림 정리
    'session_cleanup'   -- 만료 세션 정리
  )),
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  records_processed INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_automation_logs_job_type ON automation_logs(job_type);
CREATE INDEX IF NOT EXISTS idx_automation_logs_status ON automation_logs(status);
CREATE INDEX IF NOT EXISTS idx_automation_logs_started_at ON automation_logs(started_at DESC);

-- ============================================================================
-- 2. 일일 통계 테이블
-- ============================================================================

CREATE TABLE IF NOT EXISTS daily_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,

  -- 사용자 통계
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,          -- 당일 활동 사용자

  -- 정치인 통계
  total_politicians INTEGER DEFAULT 0,
  politicians_with_evaluation INTEGER DEFAULT 0,

  -- 컨텐츠 통계
  total_posts INTEGER DEFAULT 0,
  new_posts INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  new_comments INTEGER DEFAULT 0,

  -- 평가 통계
  total_ratings INTEGER DEFAULT 0,
  new_ratings INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0,

  -- 매출 통계
  report_purchases INTEGER DEFAULT 0,
  report_revenue INTEGER DEFAULT 0,

  -- 팔로우 통계
  total_favorites INTEGER DEFAULT 0,
  new_favorites INTEGER DEFAULT 0,

  -- 기타 메타데이터
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_daily_statistics_date ON daily_statistics(date DESC);

-- ============================================================================
-- 3. 크롤링된 뉴스 테이블
-- ============================================================================

CREATE TABLE IF NOT EXISTS crawled_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id TEXT REFERENCES politicians(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  source_url TEXT NOT NULL,
  source_name TEXT,                        -- 언론사 이름
  published_at TIMESTAMPTZ,
  crawled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 분류 정보
  category TEXT,                           -- 정치, 경제, 사회 등
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),

  -- 중복 방지
  url_hash TEXT UNIQUE,                    -- URL 해시로 중복 체크

  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_crawled_news_politician ON crawled_news(politician_id);
CREATE INDEX IF NOT EXISTS idx_crawled_news_published ON crawled_news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_crawled_news_url_hash ON crawled_news(url_hash);

-- ============================================================================
-- 4. 백업 이력 테이블
-- ============================================================================

CREATE TABLE IF NOT EXISTS backup_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'incremental', 'table')),
  tables_backed_up TEXT[],                 -- 백업된 테이블 목록
  file_path TEXT,                          -- 백업 파일 경로
  file_size_bytes BIGINT,

  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'success', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_backup_history_status ON backup_history(status);
CREATE INDEX IF NOT EXISTS idx_backup_history_started_at ON backup_history(started_at DESC);

-- ============================================================================
-- 5. 통계 생성 함수
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_daily_statistics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS UUID AS $$
DECLARE
  stat_id UUID;
  v_total_users INTEGER;
  v_new_users INTEGER;
  v_active_users INTEGER;
  v_total_politicians INTEGER;
  v_politicians_with_eval INTEGER;
  v_total_posts INTEGER;
  v_new_posts INTEGER;
  v_total_comments INTEGER;
  v_new_comments INTEGER;
  v_total_ratings INTEGER;
  v_new_ratings INTEGER;
  v_avg_rating NUMERIC(3,2);
  v_report_purchases INTEGER;
  v_report_revenue INTEGER;
  v_total_favorites INTEGER;
  v_new_favorites INTEGER;
BEGIN
  -- 사용자 통계
  SELECT COUNT(*) INTO v_total_users FROM users WHERE is_active = true;
  SELECT COUNT(*) INTO v_new_users FROM users WHERE DATE(created_at) = target_date;
  SELECT COUNT(DISTINCT user_id) INTO v_active_users
    FROM (
      SELECT user_id FROM posts WHERE DATE(created_at) = target_date
      UNION SELECT user_id FROM comments WHERE DATE(created_at) = target_date
      UNION SELECT user_id FROM politician_ratings WHERE DATE(created_at) = target_date
    ) AS active;

  -- 정치인 통계
  SELECT COUNT(*) INTO v_total_politicians FROM politicians;
  SELECT COUNT(DISTINCT politician_id) INTO v_politicians_with_eval FROM ai_evaluations;

  -- 컨텐츠 통계
  SELECT COUNT(*) INTO v_total_posts FROM posts;
  SELECT COUNT(*) INTO v_new_posts FROM posts WHERE DATE(created_at) = target_date;
  SELECT COUNT(*) INTO v_total_comments FROM comments;
  SELECT COUNT(*) INTO v_new_comments FROM comments WHERE DATE(created_at) = target_date;

  -- 평가 통계
  SELECT COUNT(*), COALESCE(AVG(rating), 0)::NUMERIC(3,2)
    INTO v_total_ratings, v_avg_rating FROM politician_ratings;
  SELECT COUNT(*) INTO v_new_ratings FROM politician_ratings WHERE DATE(created_at) = target_date;

  -- 매출 통계 (report_purchases 테이블이 있는 경우)
  BEGIN
    SELECT COUNT(*), COALESCE(SUM(final_amount), 0)
      INTO v_report_purchases, v_report_revenue
      FROM report_purchases
      WHERE DATE(created_at) = target_date AND status = 'completed';
  EXCEPTION WHEN undefined_table THEN
    v_report_purchases := 0;
    v_report_revenue := 0;
  END;

  -- 팔로우 통계
  SELECT COUNT(*) INTO v_total_favorites FROM favorite_politicians;
  SELECT COUNT(*) INTO v_new_favorites FROM favorite_politicians WHERE DATE(created_at) = target_date;

  -- 기존 통계 업데이트 또는 새로 생성
  INSERT INTO daily_statistics (
    date,
    total_users, new_users, active_users,
    total_politicians, politicians_with_evaluation,
    total_posts, new_posts,
    total_comments, new_comments,
    total_ratings, new_ratings, average_rating,
    report_purchases, report_revenue,
    total_favorites, new_favorites,
    updated_at
  ) VALUES (
    target_date,
    v_total_users, v_new_users, v_active_users,
    v_total_politicians, v_politicians_with_eval,
    v_total_posts, v_new_posts,
    v_total_comments, v_new_comments,
    v_total_ratings, v_new_ratings, v_avg_rating,
    v_report_purchases, v_report_revenue,
    v_total_favorites, v_new_favorites,
    NOW()
  )
  ON CONFLICT (date) DO UPDATE SET
    total_users = EXCLUDED.total_users,
    new_users = EXCLUDED.new_users,
    active_users = EXCLUDED.active_users,
    total_politicians = EXCLUDED.total_politicians,
    politicians_with_evaluation = EXCLUDED.politicians_with_evaluation,
    total_posts = EXCLUDED.total_posts,
    new_posts = EXCLUDED.new_posts,
    total_comments = EXCLUDED.total_comments,
    new_comments = EXCLUDED.new_comments,
    total_ratings = EXCLUDED.total_ratings,
    new_ratings = EXCLUDED.new_ratings,
    average_rating = EXCLUDED.average_rating,
    report_purchases = EXCLUDED.report_purchases,
    report_revenue = EXCLUDED.report_revenue,
    total_favorites = EXCLUDED.total_favorites,
    new_favorites = EXCLUDED.new_favorites,
    updated_at = NOW()
  RETURNING id INTO stat_id;

  RETURN stat_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. 오래된 데이터 정리 함수
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_data(days_to_keep INTEGER DEFAULT 90)
RETURNS JSONB AS $$
DECLARE
  cutoff_date TIMESTAMPTZ;
  deleted_notifications INTEGER;
  deleted_logs INTEGER;
  deleted_sessions INTEGER;
  result JSONB;
BEGIN
  cutoff_date := NOW() - (days_to_keep || ' days')::INTERVAL;

  -- 오래된 읽은 알림 삭제 (읽은 알림만)
  DELETE FROM notifications
  WHERE is_read = true AND created_at < cutoff_date;
  GET DIAGNOSTICS deleted_notifications = ROW_COUNT;

  -- 오래된 자동화 로그 삭제
  DELETE FROM automation_logs
  WHERE created_at < cutoff_date;
  GET DIAGNOSTICS deleted_logs = ROW_COUNT;

  -- 오래된 세션 정리 (auth.sessions 테이블이 있는 경우)
  deleted_sessions := 0;
  -- Note: auth.sessions는 Supabase가 자동 관리

  result := jsonb_build_object(
    'cutoff_date', cutoff_date,
    'deleted_notifications', deleted_notifications,
    'deleted_logs', deleted_logs,
    'deleted_sessions', deleted_sessions
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. RLS 정책 (관리자만 접근)
-- ============================================================================

ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE crawled_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_history ENABLE ROW LEVEL SECURITY;

-- automation_logs: 관리자만 접근
CREATE POLICY "Admin access to automation_logs" ON automation_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'admin')
  );

-- daily_statistics: 관리자는 전체, 일반 사용자는 읽기만
CREATE POLICY "Admin full access to daily_statistics" ON daily_statistics
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Public read daily_statistics" ON daily_statistics
  FOR SELECT USING (true);

-- crawled_news: 관리자는 전체, 일반 사용자는 읽기만
CREATE POLICY "Admin full access to crawled_news" ON crawled_news
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Public read active crawled_news" ON crawled_news
  FOR SELECT USING (is_active = true);

-- backup_history: 관리자만 접근
CREATE POLICY "Admin access to backup_history" ON backup_history
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- 8. 코멘트
-- ============================================================================

COMMENT ON TABLE automation_logs IS '자동화 작업 실행 로그';
COMMENT ON TABLE daily_statistics IS '일일 사이트 통계';
COMMENT ON TABLE crawled_news IS '크롤링된 정치인 관련 뉴스';
COMMENT ON TABLE backup_history IS '데이터 백업 이력';

COMMENT ON FUNCTION generate_daily_statistics IS '일일 통계 생성 함수';
COMMENT ON FUNCTION cleanup_old_data IS '오래된 데이터 정리 함수';
