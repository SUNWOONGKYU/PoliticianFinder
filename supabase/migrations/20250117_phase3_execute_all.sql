-- Phase 3 Database 통합 실행 스크립트
-- 작성일: 2025-01-17
-- 설명: Phase 3의 모든 데이터베이스 작업을 순차적으로 실행

-- ============================================
-- 실행 전 확인
-- ============================================

DO $$
DECLARE
  v_error_count INTEGER := 0;
  v_warning_count INTEGER := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Phase 3 Database 통합 실행을 시작합니다.';
  RAISE NOTICE '실행될 작업:';
  RAISE NOTICE '  1. P3D1: notifications 테이블 개선';
  RAISE NOTICE '  2. P3D2: comments 테이블 개선';
  RAISE NOTICE '  3. P3D3: likes 테이블 생성';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';

  -- 의존성 체크: profiles 테이블
  IF NOT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    RAISE WARNING 'profiles 테이블이 존재하지 않습니다. P1D1 작업을 먼저 완료하세요.';
    v_error_count := v_error_count + 1;
  END IF;

  -- 의존성 체크: posts 테이블
  IF NOT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'posts'
  ) THEN
    RAISE WARNING 'posts 테이블이 존재하지 않습니다. 기본 테이블 생성이 필요합니다.';
    v_error_count := v_error_count + 1;
  END IF;

  -- 의존성 체크: politicians 테이블
  IF NOT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'politicians'
  ) THEN
    RAISE WARNING 'politicians 테이블이 존재하지 않습니다. P1D1 작업을 먼저 완료하세요.';
    v_warning_count := v_warning_count + 1;
  END IF;

  -- 의존성 체크: ratings 테이블
  IF NOT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ratings'
  ) THEN
    RAISE WARNING 'ratings 테이블이 존재하지 않습니다. P2D2 작업을 먼저 완료하세요.';
    v_warning_count := v_warning_count + 1;
  END IF;

  IF v_error_count > 0 THEN
    RAISE EXCEPTION '필수 의존성이 충족되지 않았습니다. 에러 개수: %', v_error_count;
  END IF;

  IF v_warning_count > 0 THEN
    RAISE NOTICE '경고: 일부 선택적 의존성이 누락되었습니다. 경고 개수: %', v_warning_count;
  END IF;

  RAISE NOTICE '의존성 체크 완료. Phase 3 작업을 시작합니다.';
  RAISE NOTICE '';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 트랜잭션 시작
-- ============================================

BEGIN;

-- ============================================
-- STEP 1: P3D1 - notifications 테이블 개선
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '[1/3] P3D1: notifications 테이블 개선 시작...';
END;
$$ LANGUAGE plpgsql;

-- 기존 notifications 테이블 백업
CREATE TABLE IF NOT EXISTS notifications_backup AS
SELECT * FROM notifications WHERE EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'notifications'
);

-- 기존 테이블 삭제
DROP TABLE IF EXISTS notifications CASCADE;

-- 향상된 notifications 테이블 생성
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'comment', 'reply', 'mention', 'like', 'follow', 'rating',
    'post_update', 'system', 'achievement', 'level_up', 'badge',
    'warning', 'announcement'
  )),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  entity_type VARCHAR(50) CHECK (entity_type IN (
    'post', 'comment', 'politician', 'user', 'rating', 'badge', 'achievement'
  )),
  entity_id BIGINT,
  metadata JSONB DEFAULT '{}',
  action_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_unread ON notifications(recipient_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_type ON notifications(recipient_id, type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_priority ON notifications(recipient_id, priority, created_at DESC) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_active ON notifications(recipient_id, expires_at) WHERE expires_at IS NULL OR expires_at > NOW();
CREATE INDEX idx_notifications_entity ON notifications(entity_type, entity_id) WHERE entity_type IS NOT NULL;

-- 트리거 함수 생성 (없으면 생성)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON notifications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- read_at 자동 설정 트리거
CREATE OR REPLACE FUNCTION set_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = TRUE AND OLD.is_read = FALSE THEN
    NEW.read_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_notifications_read_at
BEFORE UPDATE ON notifications
FOR EACH ROW
EXECUTE FUNCTION set_read_at();

-- RLS 정책
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = recipient_id);

CREATE POLICY "System and admins can create notifications"
ON notifications FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT id FROM profiles WHERE is_admin = TRUE)
  OR auth.role() = 'service_role'
);

CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

CREATE POLICY "Users can delete own notifications"
ON notifications FOR DELETE
USING (auth.uid() = recipient_id);

-- 알림 통계 뷰
CREATE OR REPLACE VIEW notification_stats AS
SELECT
  recipient_id,
  COUNT(*) FILTER (WHERE is_read = FALSE) as unread_count,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE type = 'comment') as comment_count,
  COUNT(*) FILTER (WHERE type = 'like') as like_count,
  COUNT(*) FILTER (WHERE type = 'mention') as mention_count,
  COUNT(*) FILTER (WHERE priority = 'urgent' AND is_read = FALSE) as urgent_unread,
  MAX(created_at) as last_notification_at
FROM notifications
WHERE expires_at IS NULL OR expires_at > NOW()
GROUP BY recipient_id;

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

DO $$
BEGIN
  RAISE NOTICE '[1/3] P3D1: notifications 테이블 개선 완료 ✓';
  RAISE NOTICE '';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 2: P3D2 - comments 테이블 개선
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '[2/3] P3D2: comments 테이블 개선 시작...';
END;
$$ LANGUAGE plpgsql;

-- 기존 comments 테이블 백업
CREATE TABLE IF NOT EXISTS comments_backup AS
SELECT * FROM comments WHERE EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'comments'
);

-- 기존 테이블 삭제
DROP TABLE IF EXISTS comments CASCADE;

-- 향상된 comments 테이블 생성
CREATE TABLE comments (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 5000),
  parent_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
  depth INTEGER DEFAULT 0 CHECK (depth >= 0 AND depth <= 2),
  path TEXT,
  mentioned_users UUID[] DEFAULT '{}',
  upvotes INTEGER DEFAULT 0 CHECK (upvotes >= 0),
  downvotes INTEGER DEFAULT 0 CHECK (downvotes >= 0),
  score INTEGER GENERATED ALWAYS AS (upvotes - downvotes) STORED,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'edited', 'deleted', 'hidden', 'reported')),
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  edit_count INTEGER DEFAULT 0,
  edit_history JSONB DEFAULT '[]',
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deletion_reason TEXT,
  report_count INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT FALSE,
  hidden_at TIMESTAMPTZ,
  hidden_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_comments_post_id ON comments(post_id) WHERE is_deleted = FALSE AND is_hidden = FALSE;
CREATE INDEX idx_comments_user_id ON comments(user_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_comments_parent_id ON comments(parent_id) WHERE is_deleted = FALSE AND is_hidden = FALSE;
CREATE INDEX idx_comments_path ON comments(path) WHERE is_deleted = FALSE;
CREATE INDEX idx_comments_created_at ON comments(post_id, created_at DESC) WHERE is_deleted = FALSE AND is_hidden = FALSE;
CREATE INDEX idx_comments_score ON comments(post_id, score DESC, created_at DESC) WHERE is_deleted = FALSE AND is_hidden = FALSE;
CREATE INDEX idx_comments_mentioned_users ON comments USING GIN (mentioned_users) WHERE is_deleted = FALSE;
CREATE INDEX idx_comments_edited ON comments(edited_at DESC) WHERE is_edited = TRUE AND is_deleted = FALSE;

-- 트리거들
CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 수정 이력 트리거
CREATE OR REPLACE FUNCTION handle_comment_edit()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.content != NEW.content THEN
    NEW.is_edited = TRUE;
    NEW.edited_at = NOW();
    NEW.edit_count = COALESCE(OLD.edit_count, 0) + 1;
    NEW.edit_history = (
      SELECT jsonb_agg(elem)
      FROM (
        SELECT elem FROM (
          SELECT jsonb_array_elements(COALESCE(OLD.edit_history, '[]'::jsonb)) AS elem
          UNION ALL
          SELECT jsonb_build_object(
            'content', OLD.content,
            'edited_at', NOW(),
            'editor_id', auth.uid()
          )
        ) t
        ORDER BY (elem->>'edited_at')::timestamptz DESC
        LIMIT 10
      ) subq
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_comment_edit_trigger
BEFORE UPDATE ON comments
FOR EACH ROW
WHEN (OLD.content IS DISTINCT FROM NEW.content)
EXECUTE FUNCTION handle_comment_edit();

-- 댓글 경로 자동 설정 트리거
CREATE OR REPLACE FUNCTION set_comment_path()
RETURNS TRIGGER AS $$
DECLARE
  parent_path TEXT;
  parent_depth INTEGER;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    SELECT path, depth INTO parent_path, parent_depth
    FROM comments WHERE id = NEW.parent_id;
    IF parent_depth >= 2 THEN
      RAISE EXCEPTION '댓글은 최대 3단계까지만 가능합니다.';
    END IF;
    NEW.depth = parent_depth + 1;
    NEW.path = parent_path || '.' || NEW.id::TEXT;
  ELSE
    NEW.depth = 0;
    NEW.path = NEW.id::TEXT;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_comment_path_trigger
BEFORE INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION set_comment_path();

-- RLS 정책
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active comments"
ON comments FOR SELECT
USING ((is_deleted = FALSE AND is_hidden = FALSE) OR user_id = auth.uid());

CREATE POLICY "Authenticated users can create comments"
ON comments FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update own recent comments"
ON comments FOR UPDATE
USING (auth.uid() = user_id AND is_deleted = FALSE AND created_at > NOW() - INTERVAL '5 minutes')
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can soft delete own comments"
ON comments FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND is_deleted = TRUE);

CREATE POLICY "Admins can manage all comments"
ON comments FOR ALL
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = TRUE));

-- 댓글 통계 뷰
CREATE OR REPLACE VIEW comment_stats AS
SELECT
  post_id,
  COUNT(*) as total_comments,
  COUNT(DISTINCT user_id) as unique_commenters,
  COUNT(*) FILTER (WHERE parent_id IS NULL) as top_level_comments,
  COUNT(*) FILTER (WHERE parent_id IS NOT NULL) as replies,
  AVG(score) as avg_score,
  MAX(created_at) as last_comment_at
FROM comments
WHERE is_deleted = FALSE AND is_hidden = FALSE
GROUP BY post_id;

ALTER PUBLICATION supabase_realtime ADD TABLE comments;

DO $$
BEGIN
  RAISE NOTICE '[2/3] P3D2: comments 테이블 개선 완료 ✓';
  RAISE NOTICE '';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 3: P3D3 - likes 테이블 생성
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '[3/3] P3D3: likes 테이블 생성 시작...';
END;
$$ LANGUAGE plpgsql;

-- likes 테이블 생성
CREATE TABLE IF NOT EXISTS likes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('post', 'comment', 'politician', 'rating')),
  target_id BIGINT NOT NULL,
  like_type VARCHAR(20) DEFAULT 'like' CHECK (like_type IN ('like', 'love', 'support', 'agree', 'helpful')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_target_like UNIQUE(user_id, target_type, target_id)
);

-- 인덱스 생성
CREATE INDEX idx_likes_target ON likes(target_type, target_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_user_target ON likes(user_id, target_type, target_id);
CREATE INDEX idx_likes_created_at ON likes(created_at DESC);
CREATE INDEX idx_likes_type ON likes(target_type, like_type);

-- 좋아요 카운트 캐시 테이블
CREATE TABLE IF NOT EXISTS like_counts (
  id BIGSERIAL PRIMARY KEY,
  target_type VARCHAR(50) NOT NULL,
  target_id BIGINT NOT NULL,
  total_likes BIGINT DEFAULT 0,
  like_count BIGINT DEFAULT 0,
  love_count BIGINT DEFAULT 0,
  support_count BIGINT DEFAULT 0,
  agree_count BIGINT DEFAULT 0,
  helpful_count BIGINT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_target_count UNIQUE(target_type, target_id)
);

CREATE INDEX idx_like_counts_target ON like_counts(target_type, target_id);

-- 좋아요 카운트 증가 트리거
CREATE OR REPLACE FUNCTION increment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO like_counts (target_type, target_id, total_likes)
  VALUES (NEW.target_type, NEW.target_id, 1)
  ON CONFLICT (target_type, target_id)
  DO UPDATE SET
    total_likes = like_counts.total_likes + 1,
    updated_at = NOW();

  IF NEW.target_type = 'post' THEN
    UPDATE posts SET upvotes = upvotes + 1 WHERE id = NEW.target_id;
  ELSIF NEW.target_type = 'comment' THEN
    UPDATE comments SET upvotes = upvotes + 1 WHERE id = NEW.target_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_like_count_trigger
AFTER INSERT ON likes
FOR EACH ROW
EXECUTE FUNCTION increment_like_count();

-- 좋아요 카운트 감소 트리거
CREATE OR REPLACE FUNCTION decrement_like_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE like_counts
  SET
    total_likes = GREATEST(0, total_likes - 1),
    updated_at = NOW()
  WHERE target_type = OLD.target_type AND target_id = OLD.target_id;

  IF OLD.target_type = 'post' THEN
    UPDATE posts SET upvotes = GREATEST(0, upvotes - 1) WHERE id = OLD.target_id;
  ELSIF OLD.target_type = 'comment' THEN
    UPDATE comments SET upvotes = GREATEST(0, upvotes - 1) WHERE id = OLD.target_id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER decrement_like_count_trigger
AFTER DELETE ON likes
FOR EACH ROW
EXECUTE FUNCTION decrement_like_count();

-- RLS 정책
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
ON likes FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can add likes"
ON likes FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
ON likes FOR DELETE
USING (auth.uid() = user_id);

ALTER TABLE like_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view like counts"
ON like_counts FOR SELECT
USING (true);

-- 인기 게시글 뷰
CREATE OR REPLACE VIEW popular_posts AS
SELECT
  p.id,
  p.title,
  p.user_id,
  p.created_at,
  COALESCE(lc.total_likes, 0) as like_count,
  p.view_count,
  p.category
FROM posts p
LEFT JOIN like_counts lc ON lc.target_type = 'post' AND lc.target_id = p.id
WHERE p.created_at > NOW() - INTERVAL '7 days'
ORDER BY COALESCE(lc.total_likes, 0) DESC, p.view_count DESC
LIMIT 100;

-- 사용자 좋아요 활동 뷰
CREATE OR REPLACE VIEW user_like_activity AS
SELECT
  user_id,
  COUNT(*) as total_likes_given,
  COUNT(*) FILTER (WHERE target_type = 'post') as post_likes,
  COUNT(*) FILTER (WHERE target_type = 'comment') as comment_likes,
  COUNT(*) FILTER (WHERE target_type = 'politician') as politician_likes,
  COUNT(*) FILTER (WHERE target_type = 'rating') as rating_likes,
  MAX(created_at) as last_like_at
FROM likes
GROUP BY user_id;

DO $$
BEGIN
  RAISE NOTICE '[3/3] P3D3: likes 테이블 생성 완료 ✓';
  RAISE NOTICE '';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 트랜잭션 커밋
-- ============================================

COMMIT;

-- ============================================
-- 최종 확인
-- ============================================

DO $$
DECLARE
  v_table_count INTEGER;
  v_view_count INTEGER;
  v_function_count INTEGER;
  v_trigger_count INTEGER;
BEGIN
  -- 테이블 수 확인
  SELECT COUNT(*) INTO v_table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('notifications', 'comments', 'likes', 'like_counts');

  -- 뷰 수 확인
  SELECT COUNT(*) INTO v_view_count
  FROM information_schema.views
  WHERE table_schema = 'public'
  AND table_name IN ('notification_stats', 'comment_stats', 'popular_posts', 'user_like_activity');

  -- 함수 수 확인
  SELECT COUNT(*) INTO v_function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND routine_name IN (
    'update_updated_at_column', 'set_read_at', 'handle_comment_edit',
    'set_comment_path', 'increment_like_count', 'decrement_like_count'
  );

  -- 트리거 수 확인
  SELECT COUNT(*) INTO v_trigger_count
  FROM information_schema.triggers
  WHERE trigger_schema = 'public'
  AND event_object_table IN ('notifications', 'comments', 'likes');

  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Phase 3 Database 작업 완료 보고';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  RAISE NOTICE '생성된 객체 요약:';
  RAISE NOTICE '  - 테이블: %개', v_table_count;
  RAISE NOTICE '  - 뷰: %개', v_view_count;
  RAISE NOTICE '  - 함수: %개', v_function_count;
  RAISE NOTICE '  - 트리거: %개', v_trigger_count;
  RAISE NOTICE '';
  RAISE NOTICE '완료된 작업:';
  RAISE NOTICE '  ✓ P3D1: notifications 테이블 - 확장된 알림 시스템';
  RAISE NOTICE '  ✓ P3D2: comments 테이블 - 계층적 댓글 구조';
  RAISE NOTICE '  ✓ P3D3: likes 테이블 - 다형성 좋아요 시스템';
  RAISE NOTICE '';
  RAISE NOTICE '다음 단계:';
  RAISE NOTICE '  1. Backend API 구현 (P3B1, P3B2, P3B3)';
  RAISE NOTICE '  2. RLS 정책 테스트 및 검증';
  RAISE NOTICE '  3. Frontend 컴포넌트 개발';
  RAISE NOTICE '';
  RAISE NOTICE '롤백이 필요한 경우:';
  RAISE NOTICE '  실행: 20250117_phase3_rollback.sql';
  RAISE NOTICE '==============================================';
END;
$$ LANGUAGE plpgsql;