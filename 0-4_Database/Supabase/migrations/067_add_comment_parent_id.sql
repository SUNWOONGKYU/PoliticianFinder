-- Migration: 067_add_comment_parent_id.sql
-- Description: comments 테이블에 대댓글(답글) 기능을 위한 parent_id 컬럼 추가
-- Created: 2025-12-17
-- Issue: 대댓글(답글) 기능 미지원 - parent_id 컬럼 없음

-- ============================================================================
-- 1. parent_id 컬럼 추가 (이미 존재하면 무시)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'comments'
    AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE public.comments
    ADD COLUMN parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- 2. reply_count 컬럼 추가 (대댓글 수 카운트용)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'comments'
    AND column_name = 'reply_count'
  ) THEN
    ALTER TABLE public.comments
    ADD COLUMN reply_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================================================
-- 3. 인덱스 추가
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);

-- ============================================================================
-- 4. 대댓글 수 업데이트 trigger 함수
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_comment_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE public.comments SET reply_count = reply_count + 1 WHERE id = NEW.parent_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE public.comments SET reply_count = reply_count - 1 WHERE id = OLD.parent_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. Trigger 생성 (이미 존재하면 재생성)
-- ============================================================================
DROP TRIGGER IF EXISTS comment_reply_count_trigger ON public.comments;

CREATE TRIGGER comment_reply_count_trigger
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_comment_reply_count();

-- ============================================================================
-- 6. RLS 정책 (대댓글도 동일한 정책 적용)
-- ============================================================================
-- 기존 comments RLS 정책이 parent_id가 있는 댓글에도 적용됨 (추가 정책 불필요)

-- ============================================================================
-- COMMENT
-- ============================================================================
COMMENT ON COLUMN public.comments.parent_id IS '대댓글(답글)의 부모 댓글 ID. NULL이면 최상위 댓글';
COMMENT ON COLUMN public.comments.reply_count IS '이 댓글에 달린 대댓글 수';
