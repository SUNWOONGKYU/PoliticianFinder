-- Migration: 070_add_comments_vote_columns.sql
-- Description: comments 테이블에 upvotes/downvotes 집계 컬럼 추가
-- Created: 2025-12-17

-- ============================================================================
-- 1. comments 테이블에 공감/비공감 집계 컬럼 추가
-- ============================================================================
ALTER TABLE public.comments
ADD COLUMN IF NOT EXISTS upvotes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS downvotes INTEGER DEFAULT 0;

-- ============================================================================
-- 2. 기존 votes 데이터 기반 집계 업데이트
-- ============================================================================
UPDATE public.comments c
SET
  upvotes = (
    SELECT COUNT(*) FROM public.votes v
    WHERE v.comment_id = c.id AND v.vote_type IN ('upvote', 'like')
  ),
  downvotes = (
    SELECT COUNT(*) FROM public.votes v
    WHERE v.comment_id = c.id AND v.vote_type IN ('downvote', 'dislike')
  );

-- ============================================================================
-- 3. 댓글 공감/비공감 자동 업데이트 함수
-- ============================================================================
CREATE OR REPLACE FUNCTION update_comment_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.comment_id IS NOT NULL THEN
      UPDATE public.comments
      SET
        upvotes = (SELECT COUNT(*) FROM public.votes WHERE comment_id = NEW.comment_id AND vote_type IN ('upvote', 'like')),
        downvotes = (SELECT COUNT(*) FROM public.votes WHERE comment_id = NEW.comment_id AND vote_type IN ('downvote', 'dislike'))
      WHERE id = NEW.comment_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.comment_id IS NOT NULL THEN
      UPDATE public.comments
      SET
        upvotes = (SELECT COUNT(*) FROM public.votes WHERE comment_id = NEW.comment_id AND vote_type IN ('upvote', 'like')),
        downvotes = (SELECT COUNT(*) FROM public.votes WHERE comment_id = NEW.comment_id AND vote_type IN ('downvote', 'dislike'))
      WHERE id = NEW.comment_id;
    END IF;
    IF OLD.comment_id IS NOT NULL AND OLD.comment_id != NEW.comment_id THEN
      UPDATE public.comments
      SET
        upvotes = (SELECT COUNT(*) FROM public.votes WHERE comment_id = OLD.comment_id AND vote_type IN ('upvote', 'like')),
        downvotes = (SELECT COUNT(*) FROM public.votes WHERE comment_id = OLD.comment_id AND vote_type IN ('downvote', 'dislike'))
      WHERE id = OLD.comment_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.comment_id IS NOT NULL THEN
      UPDATE public.comments
      SET
        upvotes = (SELECT COUNT(*) FROM public.votes WHERE comment_id = OLD.comment_id AND vote_type IN ('upvote', 'like')),
        downvotes = (SELECT COUNT(*) FROM public.votes WHERE comment_id = OLD.comment_id AND vote_type IN ('downvote', 'dislike'))
      WHERE id = OLD.comment_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. 트리거 생성
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_update_comment_vote_counts ON public.votes;
CREATE TRIGGER trigger_update_comment_vote_counts
  AFTER INSERT OR UPDATE OR DELETE ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_vote_counts();

-- ============================================================================
-- 5. 인덱스 추가
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_comments_upvotes ON public.comments(upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_comments_downvotes ON public.comments(downvotes DESC);

-- ============================================================================
-- 완료 메시지
-- ============================================================================
SELECT '070: comments 테이블 공감/비공감 컬럼 추가 완료' as result;
