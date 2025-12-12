-- Task ID: P3D_FOLLOW
-- Migration: Complete Follow System Implementation
-- Description: Users table extension + follows functionality for influence grade system
-- Date: 2025-12-12

-- ============================================================================
-- 1. users 테이블 확장 (활동 레벨 + 영향력 그레이드)
-- ============================================================================

-- 활동 레벨 관련 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS activity_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS activity_level VARCHAR(10) DEFAULT 'ML1';

-- 영향력 그레이드 관련 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS influence_grade VARCHAR(20) DEFAULT 'Wanderer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- 지역구 관련 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_district VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS district_rank INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS district_percentile DECIMAL(5,2) DEFAULT 100.00;

-- 마지막 등급 확인 시간
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_grade_check TIMESTAMPTZ DEFAULT NOW();

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_district_rank ON users(preferred_district, follower_count DESC);
CREATE INDEX IF NOT EXISTS idx_users_activity_points ON users(activity_points DESC);
CREATE INDEX IF NOT EXISTS idx_users_influence_grade ON users(influence_grade);

-- ============================================================================
-- 2. follows 테이블은 004_create_follows.sql에서 이미 생성됨
-- ============================================================================
-- 스키마:
--   follower_id UUID (팔로우하는 사용자)
--   following_type VARCHAR(20) ('user' 또는 'politician')
--   following_user_id UUID (유저 팔로우 시)
--   following_politician_id VARCHAR(100) (정치인 팔로우 시)
--
-- 이 마이그레이션에서는 follows 테이블을 수정하지 않음

-- ============================================================================
-- 3. 활동 포인트 히스토리 테이블
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,  -- 'post', 'comment', 'follow_gained', 'rating', 'attendance'
  points INTEGER NOT NULL,
  description TEXT,
  reference_id UUID,  -- 관련 게시글/댓글/팔로우 ID
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_history_user ON activity_points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_history_date ON activity_points_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_history_type ON activity_points_history(action_type);

-- ============================================================================
-- 4. 활동 레벨 계산 함수
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_activity_level(p_points INTEGER)
RETURNS VARCHAR(10) AS $$
BEGIN
  IF p_points < 100 THEN RETURN 'ML1';
  ELSIF p_points < 300 THEN RETURN 'ML2';
  ELSIF p_points < 600 THEN RETURN 'ML3';
  ELSIF p_points < 1000 THEN RETURN 'ML4';
  ELSIF p_points < 2000 THEN RETURN 'ML5';
  ELSIF p_points < 4000 THEN RETURN 'ML6';
  ELSIF p_points < 8000 THEN RETURN 'ML7';
  ELSIF p_points < 16000 THEN RETURN 'ML8';
  ELSIF p_points < 32000 THEN RETURN 'ML9';
  ELSE RETURN 'ML10';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 5. 지역구 내 순위 및 영향력 그레이드 계산 함수
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_influence_grade(
  p_user_id UUID
) RETURNS TABLE(
  rank_position INTEGER,
  total_users INTEGER,
  percentile DECIMAL(5,2),
  grade VARCHAR(20)
) AS $$
DECLARE
  v_follower_count INTEGER;
  v_district VARCHAR(100);
  v_rank INTEGER;
  v_total INTEGER;
  v_percentile DECIMAL(5,2);
  v_grade VARCHAR(20);
BEGIN
  -- 사용자 정보 조회
  SELECT u.follower_count, u.preferred_district
  INTO v_follower_count, v_district
  FROM users u WHERE u.id = p_user_id;

  -- 지역구가 없으면 팔로워만으로 판단
  IF v_district IS NULL OR v_district = '' THEN
    IF v_follower_count >= 500 THEN
      v_grade := 'Monarch';
    ELSIF v_follower_count >= 200 THEN
      v_grade := 'Duke';
    ELSIF v_follower_count >= 50 THEN
      v_grade := 'Lord';
    ELSIF v_follower_count >= 10 THEN
      v_grade := 'Knight';
    ELSE
      v_grade := 'Wanderer';
    END IF;
    RETURN QUERY SELECT 0, 0, 100.00::DECIMAL(5,2), v_grade;
    RETURN;
  END IF;

  -- 지역구 내 순위 계산
  SELECT COUNT(*) + 1 INTO v_rank
  FROM users
  WHERE preferred_district = v_district
    AND follower_count > v_follower_count;

  -- 지역구 총 사용자 수
  SELECT COUNT(*) INTO v_total
  FROM users
  WHERE preferred_district = v_district;

  -- 상위 퍼센트 계산
  IF v_total > 0 THEN
    v_percentile := (v_rank::DECIMAL / v_total) * 100;
  ELSE
    v_percentile := 100.00;
  END IF;

  -- 등급 결정
  IF v_rank = 1 AND v_follower_count >= 500 THEN
    v_grade := 'Monarch';
  ELSIF v_percentile <= 5 AND v_follower_count >= 200 THEN
    v_grade := 'Duke';
  ELSIF v_percentile <= 20 AND v_follower_count >= 50 THEN
    v_grade := 'Lord';
  ELSIF v_follower_count >= 10 THEN
    v_grade := 'Knight';
  ELSE
    v_grade := 'Wanderer';
  END IF;

  RETURN QUERY SELECT v_rank, v_total, v_percentile, v_grade;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. 팔로우 시 자동 업데이트 트리거 (004_create_follows.sql 스키마 기준)
-- ============================================================================
-- follows 테이블 스키마:
--   follower_id, following_type ('user'|'politician'), following_user_id, following_politician_id

CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
DECLARE
  grade_result RECORD;
  current_level VARCHAR(10);
  old_points INTEGER;
  new_points INTEGER;
  target_user_id UUID;
BEGIN
  -- 유저-유저 팔로우만 처리 (정치인 팔로우는 카운트 안 함)
  IF NEW.following_type = 'user' AND NEW.following_user_id IS NOT NULL THEN
    target_user_id := NEW.following_user_id;
  ELSE
    -- 정치인 팔로우는 그냥 통과
    IF TG_OP = 'INSERT' THEN
      RETURN NEW;
    ELSE
      RETURN OLD;
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- 팔로우 추가 시
    -- follower의 following_count 증가
    UPDATE users SET following_count = COALESCE(following_count, 0) + 1
    WHERE id = NEW.follower_id;

    -- following의 follower_count 증가
    UPDATE users SET follower_count = COALESCE(follower_count, 0) + 1
    WHERE id = target_user_id;

    -- following에게 포인트 지급 (+20p)
    SELECT activity_points INTO old_points FROM users WHERE id = target_user_id;
    new_points := COALESCE(old_points, 0) + 20;
    current_level := calculate_activity_level(new_points);

    UPDATE users
    SET activity_points = new_points,
        activity_level = current_level
    WHERE id = target_user_id;

    -- 포인트 히스토리 기록
    INSERT INTO activity_points_history (user_id, action_type, points, description, reference_id)
    VALUES (target_user_id, 'follow_gained', 20, '새 팔로워 획득', NEW.id);

    -- following의 영향력 그레이드 재계산
    SELECT * INTO grade_result FROM calculate_influence_grade(target_user_id);
    UPDATE users
    SET influence_grade = grade_result.grade,
        district_rank = grade_result.rank_position,
        district_percentile = grade_result.percentile,
        last_grade_check = NOW()
    WHERE id = target_user_id;

    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    -- 유저-유저 팔로우만 처리
    IF OLD.following_type = 'user' AND OLD.following_user_id IS NOT NULL THEN
      target_user_id := OLD.following_user_id;
    ELSE
      RETURN OLD;
    END IF;

    -- follower의 following_count 감소
    UPDATE users SET following_count = GREATEST(COALESCE(following_count, 0) - 1, 0)
    WHERE id = OLD.follower_id;

    -- following의 follower_count 감소
    UPDATE users SET follower_count = GREATEST(COALESCE(follower_count, 0) - 1, 0)
    WHERE id = target_user_id;

    -- following의 영향력 그레이드 재계산
    SELECT * INTO grade_result FROM calculate_influence_grade(target_user_id);
    UPDATE users
    SET influence_grade = grade_result.grade,
        district_rank = grade_result.rank_position,
        district_percentile = grade_result.percentile,
        last_grade_check = NOW()
    WHERE id = target_user_id;

    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (이미 있으면 교체)
DROP TRIGGER IF EXISTS trigger_update_follow_counts ON follows;
CREATE TRIGGER trigger_update_follow_counts
AFTER INSERT OR DELETE ON follows
FOR EACH ROW
EXECUTE FUNCTION update_follow_counts();

-- ============================================================================
-- 7. 게시글/댓글 작성 시 포인트 자동 지급 트리거
-- ============================================================================

CREATE OR REPLACE FUNCTION award_activity_points()
RETURNS TRIGGER AS $$
DECLARE
  points_to_add INTEGER;
  new_points INTEGER;
  current_level VARCHAR(10);
  action_desc TEXT;
BEGIN
  -- 게시글 작성: +50p
  IF TG_TABLE_NAME = 'posts' THEN
    points_to_add := 50;
    action_desc := '게시글 작성';
  -- 댓글 작성: +10p
  ELSIF TG_TABLE_NAME = 'comments' THEN
    points_to_add := 10;
    action_desc := '댓글 작성';
  ELSE
    RETURN NEW;
  END IF;

  -- 사용자 포인트 업데이트
  UPDATE users
  SET activity_points = COALESCE(activity_points, 0) + points_to_add,
      activity_level = calculate_activity_level(COALESCE(activity_points, 0) + points_to_add)
  WHERE id = NEW.user_id
  RETURNING activity_points INTO new_points;

  -- 히스토리 기록
  INSERT INTO activity_points_history (user_id, action_type, points, description, reference_id)
  VALUES (NEW.user_id, TG_TABLE_NAME, points_to_add, action_desc, NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- posts 테이블에 트리거 (이미 있으면 교체)
DROP TRIGGER IF EXISTS trigger_award_points_posts ON posts;
CREATE TRIGGER trigger_award_points_posts
AFTER INSERT ON posts
FOR EACH ROW
EXECUTE FUNCTION award_activity_points();

-- comments 테이블에 트리거 (이미 있으면 교체)
DROP TRIGGER IF EXISTS trigger_award_points_comments ON comments;
CREATE TRIGGER trigger_award_points_comments
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION award_activity_points();

-- ============================================================================
-- 8. RLS 정책
-- ============================================================================

-- follows 테이블 RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- 읽기: 모든 사용자
DROP POLICY IF EXISTS "follows_select_policy" ON follows;
CREATE POLICY "follows_select_policy" ON follows
FOR SELECT USING (true);

-- 생성: 로그인한 사용자가 자신의 팔로우만
DROP POLICY IF EXISTS "follows_insert_policy" ON follows;
CREATE POLICY "follows_insert_policy" ON follows
FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- 삭제: 로그인한 사용자가 자신의 팔로우만
DROP POLICY IF EXISTS "follows_delete_policy" ON follows;
CREATE POLICY "follows_delete_policy" ON follows
FOR DELETE USING (auth.uid() = follower_id);

-- activity_points_history 테이블 RLS
ALTER TABLE activity_points_history ENABLE ROW LEVEL SECURITY;

-- 읽기: 자신의 히스토리만
DROP POLICY IF EXISTS "activity_history_select_policy" ON activity_points_history;
CREATE POLICY "activity_history_select_policy" ON activity_points_history
FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- 9. 코멘트
-- ============================================================================

COMMENT ON COLUMN users.activity_points IS '누적 활동 포인트';
COMMENT ON COLUMN users.activity_level IS '활동 레벨 (ML1~ML10)';
COMMENT ON COLUMN users.influence_grade IS '영향력 그레이드 (Wanderer, Knight, Lord, Duke, Monarch)';
COMMENT ON COLUMN users.follower_count IS '팔로워 수 (캐시)';
COMMENT ON COLUMN users.following_count IS '팔로잉 수 (캐시)';
COMMENT ON COLUMN users.preferred_district IS '관심 지역구';
COMMENT ON COLUMN users.district_rank IS '지역구 내 순위';
COMMENT ON COLUMN users.district_percentile IS '상위 퍼센트';

COMMENT ON TABLE activity_points_history IS '활동 포인트 획득 히스토리';
COMMENT ON FUNCTION calculate_activity_level IS '포인트로 활동 레벨 계산 (ML1~ML10)';
COMMENT ON FUNCTION calculate_influence_grade IS '지역구 내 순위로 영향력 그레이드 계산';
COMMENT ON FUNCTION update_follow_counts IS '팔로우/언팔로우 시 자동 업데이트';
COMMENT ON FUNCTION award_activity_points IS '게시글/댓글 작성 시 포인트 자동 지급';

-- ============================================================================
-- 완료
-- ============================================================================
