-- ============================================================================
-- 060 팔로우 시스템 마이그레이션
-- Supabase Dashboard > SQL Editor에서 실행하세요
-- ============================================================================

-- 1. users 테이블 확장
ALTER TABLE users ADD COLUMN IF NOT EXISTS activity_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS activity_level VARCHAR(10) DEFAULT 'ML1';
ALTER TABLE users ADD COLUMN IF NOT EXISTS influence_grade VARCHAR(20) DEFAULT 'Wanderer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_district VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS district_rank INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS district_percentile DECIMAL(5,2) DEFAULT 100.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_grade_check TIMESTAMPTZ DEFAULT NOW();

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_district_rank ON users(preferred_district, follower_count DESC);
CREATE INDEX IF NOT EXISTS idx_users_activity_points ON users(activity_points DESC);
CREATE INDEX IF NOT EXISTS idx_users_influence_grade ON users(influence_grade);

-- 2. 활동 포인트 히스토리 테이블
CREATE TABLE IF NOT EXISTS activity_points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  points INTEGER NOT NULL,
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_history_user ON activity_points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_history_date ON activity_points_history(created_at DESC);

-- 3. 활동 레벨 계산 함수
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

-- 4. 영향력 그레이드 계산 함수
CREATE OR REPLACE FUNCTION calculate_influence_grade(p_user_id UUID)
RETURNS TABLE(rank_position INTEGER, total_users INTEGER, percentile DECIMAL(5,2), grade VARCHAR(20)) AS $$
DECLARE
  v_follower_count INTEGER;
  v_district VARCHAR(100);
  v_rank INTEGER;
  v_total INTEGER;
  v_percentile DECIMAL(5,2);
  v_grade VARCHAR(20);
BEGIN
  SELECT u.follower_count, u.preferred_district INTO v_follower_count, v_district
  FROM users u WHERE u.id = p_user_id;

  IF v_district IS NULL OR v_district = '' THEN
    IF v_follower_count >= 500 THEN v_grade := 'Monarch';
    ELSIF v_follower_count >= 200 THEN v_grade := 'Duke';
    ELSIF v_follower_count >= 50 THEN v_grade := 'Lord';
    ELSIF v_follower_count >= 10 THEN v_grade := 'Knight';
    ELSE v_grade := 'Wanderer';
    END IF;
    RETURN QUERY SELECT 0, 0, 100.00::DECIMAL(5,2), v_grade;
    RETURN;
  END IF;

  SELECT COUNT(*) + 1 INTO v_rank FROM users
  WHERE preferred_district = v_district AND follower_count > v_follower_count;

  SELECT COUNT(*) INTO v_total FROM users WHERE preferred_district = v_district;

  IF v_total > 0 THEN v_percentile := (v_rank::DECIMAL / v_total) * 100;
  ELSE v_percentile := 100.00;
  END IF;

  IF v_rank = 1 AND v_follower_count >= 500 THEN v_grade := 'Monarch';
  ELSIF v_percentile <= 5 AND v_follower_count >= 200 THEN v_grade := 'Duke';
  ELSIF v_percentile <= 20 AND v_follower_count >= 50 THEN v_grade := 'Lord';
  ELSIF v_follower_count >= 10 THEN v_grade := 'Knight';
  ELSE v_grade := 'Wanderer';
  END IF;

  RETURN QUERY SELECT v_rank, v_total, v_percentile, v_grade;
END;
$$ LANGUAGE plpgsql;

-- 5. 팔로우 카운트 업데이트 트리거
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
DECLARE
  grade_result RECORD;
  target_user_id UUID;
  new_points INTEGER;
BEGIN
  IF NEW.following_type = 'user' AND NEW.following_user_id IS NOT NULL THEN
    target_user_id := NEW.following_user_id;
  ELSE
    IF TG_OP = 'INSERT' THEN RETURN NEW; ELSE RETURN OLD; END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    UPDATE users SET following_count = COALESCE(following_count, 0) + 1 WHERE id = NEW.follower_id;
    UPDATE users SET follower_count = COALESCE(follower_count, 0) + 1,
                     activity_points = COALESCE(activity_points, 0) + 20,
                     activity_level = calculate_activity_level(COALESCE(activity_points, 0) + 20)
    WHERE id = target_user_id RETURNING activity_points INTO new_points;

    INSERT INTO activity_points_history (user_id, action_type, points, description, reference_id)
    VALUES (target_user_id, 'follow_gained', 20, '새 팔로워 획득', NEW.id);

    SELECT * INTO grade_result FROM calculate_influence_grade(target_user_id);
    UPDATE users SET influence_grade = grade_result.grade, district_rank = grade_result.rank_position,
                     district_percentile = grade_result.percentile, last_grade_check = NOW()
    WHERE id = target_user_id;
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.following_type = 'user' AND OLD.following_user_id IS NOT NULL THEN
      target_user_id := OLD.following_user_id;
    ELSE RETURN OLD;
    END IF;

    UPDATE users SET following_count = GREATEST(COALESCE(following_count, 0) - 1, 0) WHERE id = OLD.follower_id;
    UPDATE users SET follower_count = GREATEST(COALESCE(follower_count, 0) - 1, 0) WHERE id = target_user_id;

    SELECT * INTO grade_result FROM calculate_influence_grade(target_user_id);
    UPDATE users SET influence_grade = grade_result.grade, district_rank = grade_result.rank_position,
                     district_percentile = grade_result.percentile, last_grade_check = NOW()
    WHERE id = target_user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_follow_counts ON follows;
CREATE TRIGGER trigger_update_follow_counts AFTER INSERT OR DELETE ON follows
FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- 6. 게시글/댓글 포인트 트리거
CREATE OR REPLACE FUNCTION award_activity_points()
RETURNS TRIGGER AS $$
DECLARE
  points_to_add INTEGER;
  action_desc TEXT;
BEGIN
  IF TG_TABLE_NAME = 'posts' THEN points_to_add := 50; action_desc := '게시글 작성';
  ELSIF TG_TABLE_NAME = 'comments' THEN points_to_add := 10; action_desc := '댓글 작성';
  ELSE RETURN NEW;
  END IF;

  UPDATE users SET activity_points = COALESCE(activity_points, 0) + points_to_add,
                   activity_level = calculate_activity_level(COALESCE(activity_points, 0) + points_to_add)
  WHERE id = NEW.user_id;

  INSERT INTO activity_points_history (user_id, action_type, points, description, reference_id)
  VALUES (NEW.user_id, TG_TABLE_NAME, points_to_add, action_desc, NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_award_points_posts ON posts;
CREATE TRIGGER trigger_award_points_posts AFTER INSERT ON posts FOR EACH ROW EXECUTE FUNCTION award_activity_points();

DROP TRIGGER IF EXISTS trigger_award_points_comments ON comments;
CREATE TRIGGER trigger_award_points_comments AFTER INSERT ON comments FOR EACH ROW EXECUTE FUNCTION award_activity_points();

-- 7. RLS 정책
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "follows_select_policy" ON follows;
CREATE POLICY "follows_select_policy" ON follows FOR SELECT USING (true);
DROP POLICY IF EXISTS "follows_insert_policy" ON follows;
CREATE POLICY "follows_insert_policy" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
DROP POLICY IF EXISTS "follows_delete_policy" ON follows;
CREATE POLICY "follows_delete_policy" ON follows FOR DELETE USING (auth.uid() = follower_id);

ALTER TABLE activity_points_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "activity_history_select_policy" ON activity_points_history;
CREATE POLICY "activity_history_select_policy" ON activity_points_history FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- 완료! 이제 팔로우 기능이 작동합니다.
-- ============================================================================
