-- P3D2: comments 테이블 개선
-- 댓글 시스템 고도화
-- 작성일: 2025-01-17
-- 작성자: AI-only
-- Phase: 3

-- ============================================
-- 1. 기존 테이블 백업 및 개선
-- ============================================

-- 기존 comments 테이블 백업
CREATE TABLE IF NOT EXISTS comments_backup AS
SELECT * FROM comments WHERE EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'comments'
);

-- 기존 테이블 삭제
DROP TABLE IF EXISTS comments CASCADE;

-- ============================================
-- 2. 향상된 comments 테이블 생성
-- ============================================

CREATE TABLE comments (
  id BIGSERIAL PRIMARY KEY,

  -- 게시글 정보
  post_id BIGINT REFERENCES posts(id) ON DELETE CASCADE NOT NULL,

  -- 작성자 정보
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 댓글 내용
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 5000),

  -- 대댓글 지원 (계층 구조)
  parent_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,

  -- 댓글 깊이 (최대 3단계: 0=최상위, 1=답글, 2=답글의 답글)
  depth INTEGER DEFAULT 0 CHECK (depth >= 0 AND depth <= 2),

  -- 경로 (계층 구조 조회 최적화)
  path TEXT,

  -- 멘션된 사용자들
  mentioned_users UUID[] DEFAULT '{}',

  -- 투표 수
  upvotes INTEGER DEFAULT 0 CHECK (upvotes >= 0),
  downvotes INTEGER DEFAULT 0 CHECK (downvotes >= 0),

  -- 순 점수 (upvotes - downvotes) - 정렬용
  score INTEGER GENERATED ALWAYS AS (upvotes - downvotes) STORED,

  -- 댓글 상태
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'edited', 'deleted', 'hidden', 'reported')),

  -- 수정 관련
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  edit_count INTEGER DEFAULT 0,
  edit_history JSONB DEFAULT '[]',

  -- 삭제 관련 (소프트 삭제)
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deletion_reason TEXT,

  -- 신고 관련
  report_count INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT FALSE,
  hidden_at TIMESTAMPTZ,
  hidden_reason TEXT,

  -- 메타데이터
  metadata JSONB DEFAULT '{}',

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. 테이블 설명 추가
-- ============================================

COMMENT ON TABLE comments IS '게시글 댓글 시스템 테이블';
COMMENT ON COLUMN comments.id IS '댓글 고유 식별자';
COMMENT ON COLUMN comments.post_id IS '댓글이 속한 게시글 ID';
COMMENT ON COLUMN comments.user_id IS '댓글 작성자 ID';
COMMENT ON COLUMN comments.content IS '댓글 내용 (최대 5000자)';
COMMENT ON COLUMN comments.parent_id IS '부모 댓글 ID (대댓글인 경우)';
COMMENT ON COLUMN comments.depth IS '댓글 깊이 (0=최상위, 1=답글, 2=답글의 답글)';
COMMENT ON COLUMN comments.path IS '댓글 경로 (계층 구조 최적화)';
COMMENT ON COLUMN comments.mentioned_users IS '멘션된 사용자 ID 배열';
COMMENT ON COLUMN comments.upvotes IS '추천 수';
COMMENT ON COLUMN comments.downvotes IS '비추천 수';
COMMENT ON COLUMN comments.score IS '댓글 점수 (추천-비추천)';
COMMENT ON COLUMN comments.status IS '댓글 상태';
COMMENT ON COLUMN comments.is_edited IS '수정 여부';
COMMENT ON COLUMN comments.edited_at IS '마지막 수정 시간';
COMMENT ON COLUMN comments.edit_count IS '수정 횟수';
COMMENT ON COLUMN comments.edit_history IS '수정 이력 (JSON)';
COMMENT ON COLUMN comments.is_deleted IS '삭제 여부 (소프트 삭제)';
COMMENT ON COLUMN comments.report_count IS '신고 횟수';
COMMENT ON COLUMN comments.is_hidden IS '숨김 여부';
COMMENT ON COLUMN comments.metadata IS '추가 메타데이터';

-- ============================================
-- 4. 인덱스 생성 (성능 최적화)
-- ============================================

-- 게시글별 댓글 조회 최적화
CREATE INDEX idx_comments_post_id
ON comments(post_id)
WHERE is_deleted = FALSE AND is_hidden = FALSE;

-- 사용자별 댓글 조회 최적화
CREATE INDEX idx_comments_user_id
ON comments(user_id)
WHERE is_deleted = FALSE;

-- 대댓글 조회 최적화
CREATE INDEX idx_comments_parent_id
ON comments(parent_id)
WHERE is_deleted = FALSE AND is_hidden = FALSE;

-- 경로 기반 계층 조회 최적화
CREATE INDEX idx_comments_path
ON comments(path)
WHERE is_deleted = FALSE;

-- 최신 댓글 정렬 최적화
CREATE INDEX idx_comments_created_at
ON comments(post_id, created_at DESC)
WHERE is_deleted = FALSE AND is_hidden = FALSE;

-- 인기 댓글 정렬 최적화 (점수순)
CREATE INDEX idx_comments_score
ON comments(post_id, score DESC, created_at DESC)
WHERE is_deleted = FALSE AND is_hidden = FALSE;

-- 멘션 조회 최적화
CREATE INDEX idx_comments_mentioned_users
ON comments USING GIN (mentioned_users)
WHERE is_deleted = FALSE;

-- 수정된 댓글 조회
CREATE INDEX idx_comments_edited
ON comments(edited_at DESC)
WHERE is_edited = TRUE AND is_deleted = FALSE;

-- ============================================
-- 5. 트리거 함수들
-- ============================================

-- 5.1. updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 5.2. 수정 시 edit 정보 업데이트
CREATE OR REPLACE FUNCTION handle_comment_edit()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.content != NEW.content THEN
    NEW.is_edited = TRUE;
    NEW.edited_at = NOW();
    NEW.edit_count = COALESCE(OLD.edit_count, 0) + 1;

    -- 수정 이력 저장 (최근 10개만 유지)
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

-- 5.3. 댓글 경로 자동 설정
CREATE OR REPLACE FUNCTION set_comment_path()
RETURNS TRIGGER AS $$
DECLARE
  parent_path TEXT;
  parent_depth INTEGER;
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    SELECT path, depth INTO parent_path, parent_depth
    FROM comments WHERE id = NEW.parent_id;

    -- 깊이 제한 확인
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

-- 5.4. 소프트 삭제 처리
CREATE OR REPLACE FUNCTION handle_comment_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE THEN
    NEW.deleted_at = NOW();
    NEW.deleted_by = auth.uid();
    NEW.status = 'deleted';
    -- 내용을 "[삭제된 댓글입니다]"로 변경
    NEW.content = '[삭제된 댓글입니다]';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_comment_delete_trigger
BEFORE UPDATE ON comments
FOR EACH ROW
WHEN (NEW.is_deleted = TRUE AND OLD.is_deleted = FALSE)
EXECUTE FUNCTION handle_comment_delete();

-- ============================================
-- 6. 댓글 알림 트리거
-- ============================================

CREATE OR REPLACE FUNCTION notify_comment_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_post_author_id UUID;
  v_parent_author_id UUID;
  v_post_title TEXT;
  v_notification_id BIGINT;
BEGIN
  -- 게시글 작성자 조회
  SELECT user_id, title INTO v_post_author_id, v_post_title
  FROM posts WHERE id = NEW.post_id;

  -- 1. 게시글 작성자에게 알림 (본인 댓글 제외)
  IF v_post_author_id != NEW.user_id THEN
    INSERT INTO notifications (
      recipient_id, sender_id, type, title, message,
      entity_type, entity_id, action_url, priority
    ) VALUES (
      v_post_author_id,
      NEW.user_id,
      'comment',
      '새 댓글',
      substring(v_post_title, 1, 50) || '에 새 댓글이 달렸습니다.',
      'comment',
      NEW.id,
      '/posts/' || NEW.post_id || '#comment-' || NEW.id,
      'normal'
    );
  END IF;

  -- 2. 대댓글인 경우 부모 댓글 작성자에게 알림
  IF NEW.parent_id IS NOT NULL THEN
    SELECT user_id INTO v_parent_author_id
    FROM comments WHERE id = NEW.parent_id;

    IF v_parent_author_id != NEW.user_id THEN
      INSERT INTO notifications (
        recipient_id, sender_id, type, title, message,
        entity_type, entity_id, action_url, priority
      ) VALUES (
        v_parent_author_id,
        NEW.user_id,
        'reply',
        '답글 알림',
        '회원님의 댓글에 답글이 달렸습니다.',
        'comment',
        NEW.id,
        '/posts/' || NEW.post_id || '#comment-' || NEW.id,
        'normal'
      );
    END IF;
  END IF;

  -- 3. 멘션된 사용자들에게 알림
  IF array_length(NEW.mentioned_users, 1) > 0 THEN
    INSERT INTO notifications (
      recipient_id, sender_id, type, title, message,
      entity_type, entity_id, action_url, priority
    )
    SELECT
      unnest(NEW.mentioned_users),
      NEW.user_id,
      'mention',
      '멘션 알림',
      '댓글에서 회원님을 멘션했습니다.',
      'comment',
      NEW.id,
      '/posts/' || NEW.post_id || '#comment-' || NEW.id,
      'normal'
    WHERE unnest(NEW.mentioned_users) != NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_comment_activity_trigger
AFTER INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION notify_comment_activity();

-- ============================================
-- 7. Row Level Security 정책
-- ============================================

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 댓글 읽기 (삭제/숨김 처리된 것 제외)
CREATE POLICY "Anyone can view active comments"
ON comments FOR SELECT
USING (
  (is_deleted = FALSE AND is_hidden = FALSE)
  OR
  user_id = auth.uid()  -- 본인 댓글은 항상 볼 수 있음
);

-- 로그인 사용자만 댓글 작성
CREATE POLICY "Authenticated users can create comments"
ON comments FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND auth.uid() = user_id
);

-- 본인 댓글만 수정 (5분 이내)
CREATE POLICY "Users can update own recent comments"
ON comments FOR UPDATE
USING (
  auth.uid() = user_id
  AND is_deleted = FALSE
  AND created_at > NOW() - INTERVAL '5 minutes'
)
WITH CHECK (
  auth.uid() = user_id
);

-- 본인 댓글만 삭제 (소프트 삭제)
CREATE POLICY "Users can soft delete own comments"
ON comments FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND is_deleted = TRUE  -- 소프트 삭제만 허용
);

-- 관리자는 모든 댓글 관리
CREATE POLICY "Admins can manage all comments"
ON comments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  )
);

-- ============================================
-- 8. 댓글 통계 뷰
-- ============================================

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

COMMENT ON VIEW comment_stats IS '게시글별 댓글 통계';

-- ============================================
-- 9. 헬퍼 함수들
-- ============================================

-- 9.1. 댓글 트리 조회 함수
CREATE OR REPLACE FUNCTION get_comment_tree(p_post_id BIGINT)
RETURNS TABLE (
  id BIGINT,
  post_id BIGINT,
  user_id UUID,
  content TEXT,
  parent_id BIGINT,
  depth INTEGER,
  path TEXT,
  upvotes INTEGER,
  downvotes INTEGER,
  score INTEGER,
  created_at TIMESTAMPTZ,
  is_edited BOOLEAN,
  children_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE comment_tree AS (
    -- 최상위 댓글
    SELECT
      c.id, c.post_id, c.user_id, c.content, c.parent_id,
      c.depth, c.path, c.upvotes, c.downvotes, c.score,
      c.created_at, c.is_edited,
      (SELECT COUNT(*) FROM comments WHERE parent_id = c.id AND is_deleted = FALSE) as children_count
    FROM comments c
    WHERE c.post_id = p_post_id
      AND c.parent_id IS NULL
      AND c.is_deleted = FALSE
      AND c.is_hidden = FALSE

    UNION ALL

    -- 대댓글
    SELECT
      c.id, c.post_id, c.user_id, c.content, c.parent_id,
      c.depth, c.path, c.upvotes, c.downvotes, c.score,
      c.created_at, c.is_edited,
      (SELECT COUNT(*) FROM comments WHERE parent_id = c.id AND is_deleted = FALSE) as children_count
    FROM comments c
    INNER JOIN comment_tree ct ON c.parent_id = ct.id
    WHERE c.is_deleted = FALSE
      AND c.is_hidden = FALSE
  )
  SELECT * FROM comment_tree
  ORDER BY path, created_at;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. 테이블 생성 확인
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'comments'
  ) THEN
    RAISE NOTICE 'comments 테이블이 성공적으로 생성되었습니다.';

    -- 인덱스 정보
    RAISE NOTICE '인덱스 목록:';
    FOR r IN (
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'comments'
      ORDER BY indexname
    ) LOOP
      RAISE NOTICE '  - %', r.indexname;
    END LOOP;

    -- RLS 정책 정보
    RAISE NOTICE 'RLS 정책 목록:';
    FOR r IN (
      SELECT policyname
      FROM pg_policies
      WHERE tablename = 'comments'
      ORDER BY policyname
    ) LOOP
      RAISE NOTICE '  - %', r.policyname;
    END LOOP;
  ELSE
    RAISE EXCEPTION 'comments 테이블 생성에 실패했습니다.';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 11. Realtime 구독 활성화
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- ============================================
-- 완료 메시지
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'P3D2: comments 테이블이 성공적으로 개선되었습니다.';
  RAISE NOTICE '- 계층적 댓글 구조 지원 (최대 3단계)';
  RAISE NOTICE '- 멘션 기능 지원';
  RAISE NOTICE '- 수정 이력 관리';
  RAISE NOTICE '- 소프트 삭제 지원';
  RAISE NOTICE '- 댓글 알림 자동화';
  RAISE NOTICE '- RLS 정책 적용 완료';
  RAISE NOTICE '- Realtime 구독 활성화';
  RAISE NOTICE '==============================================';
END;
$$ LANGUAGE plpgsql;