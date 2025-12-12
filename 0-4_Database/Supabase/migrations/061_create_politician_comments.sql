-- Migration 061: Create politician_comments table
-- 정치인 댓글을 위한 별도 테이블 (회원 댓글과 분리)
-- Created: 2025-12-13

-- ============================================
-- 1. politician_comments 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS politician_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    politician_id TEXT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
    politician_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. 인덱스 생성
-- ============================================
CREATE INDEX IF NOT EXISTS idx_politician_comments_post_id
    ON politician_comments(post_id);

CREATE INDEX IF NOT EXISTS idx_politician_comments_politician_id
    ON politician_comments(politician_id);

CREATE INDEX IF NOT EXISTS idx_politician_comments_created_at
    ON politician_comments(created_at DESC);

-- ============================================
-- 3. updated_at 자동 갱신 트리거
-- ============================================
CREATE OR REPLACE FUNCTION update_politician_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_politician_comments_updated_at ON politician_comments;
CREATE TRIGGER trigger_politician_comments_updated_at
    BEFORE UPDATE ON politician_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_politician_comments_updated_at();

-- ============================================
-- 4. RLS 정책 (모든 사용자 읽기 허용, 서비스 역할로만 쓰기)
-- ============================================
ALTER TABLE politician_comments ENABLE ROW LEVEL SECURITY;

-- 읽기: 모든 사용자 허용
DROP POLICY IF EXISTS "politician_comments_select_all" ON politician_comments;
CREATE POLICY "politician_comments_select_all"
    ON politician_comments FOR SELECT
    USING (true);

-- 쓰기: 서비스 역할만 허용 (API에서 admin client 사용)
DROP POLICY IF EXISTS "politician_comments_insert_service" ON politician_comments;
CREATE POLICY "politician_comments_insert_service"
    ON politician_comments FOR INSERT
    WITH CHECK (true);

-- 수정: 서비스 역할만 허용
DROP POLICY IF EXISTS "politician_comments_update_service" ON politician_comments;
CREATE POLICY "politician_comments_update_service"
    ON politician_comments FOR UPDATE
    USING (true);

-- 삭제: 서비스 역할만 허용
DROP POLICY IF EXISTS "politician_comments_delete_service" ON politician_comments;
CREATE POLICY "politician_comments_delete_service"
    ON politician_comments FOR DELETE
    USING (true);

-- ============================================
-- 5. 테이블 설명
-- ============================================
COMMENT ON TABLE politician_comments IS '정치인 댓글 테이블 (회원 댓글과 분리)';
COMMENT ON COLUMN politician_comments.id IS '댓글 고유 ID (UUID)';
COMMENT ON COLUMN politician_comments.post_id IS '게시글 ID (FK -> posts.id)';
COMMENT ON COLUMN politician_comments.politician_id IS '정치인 ID (FK -> politicians.id, TEXT 8자리 hex)';
COMMENT ON COLUMN politician_comments.politician_name IS '정치인 이름 (조회 시 조인 최소화)';
COMMENT ON COLUMN politician_comments.content IS '댓글 내용';
COMMENT ON COLUMN politician_comments.created_at IS '작성 일시';
COMMENT ON COLUMN politician_comments.updated_at IS '수정 일시';

-- ============================================
-- 검증 쿼리
-- ============================================
-- SELECT * FROM politician_comments LIMIT 1;
