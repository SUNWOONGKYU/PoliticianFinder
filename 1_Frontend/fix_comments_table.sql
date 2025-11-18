-- ===========================
-- comments 테이블 재생성
-- ===========================
-- 문제: comments 테이블이 잘못된 스키마로 생성됨 (post_id가 INTEGER로 되어있음)
-- 해결: 테이블을 DROP하고 올바른 스키마로 재생성

-- 1. 기존 comments 테이블 삭제
DROP TABLE IF EXISTS comments CASCADE;

-- 2. 올바른 스키마로 comments 테이블 생성
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged')),
  moderation_reason TEXT,
  moderated_at TIMESTAMPTZ,
  moderated_by UUID REFERENCES users(user_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 인덱스 생성
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX idx_comments_moderation_status ON comments(moderation_status);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- 4. 복합 인덱스
CREATE INDEX idx_comments_post_approved ON comments(post_id, moderation_status, created_at) WHERE moderation_status = 'approved';
CREATE INDEX idx_comments_parent_created ON comments(parent_comment_id, created_at) WHERE parent_comment_id IS NOT NULL;

-- 5. 전체 텍스트 검색 인덱스
CREATE INDEX idx_comments_search ON comments USING gin(to_tsvector('korean', content));

-- 6. 테이블 및 컬럼 설명
COMMENT ON TABLE comments IS 'Comments on posts with nested reply support';
COMMENT ON COLUMN comments.parent_comment_id IS 'Parent comment ID for nested replies (NULL for top-level comments)';
COMMENT ON COLUMN comments.is_deleted IS 'Soft delete flag (content hidden but structure preserved)';
COMMENT ON COLUMN comments.moderation_status IS 'Moderation status: pending, approved, rejected, flagged';

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE 'Comments table recreated successfully with correct schema!';
END $$;
