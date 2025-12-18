-- Migration: Expand notification types for P7BA3
-- Description: 실시간 알림 시스템 - 알림 유형 확장
-- Date: 2025-12-17

-- ============================================================================
-- 1. 기존 CHECK 제약조건 제거 및 새 유형 추가
-- ============================================================================

-- notifications 테이블의 type CHECK 제약조건 제거
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 새 CHECK 제약조건 추가 (확장된 유형)
ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check
CHECK (type IN (
  -- 기존 유형
  'comment',      -- 내 게시글에 댓글
  'like',         -- 좋아요 (레거시)
  'follow',       -- 팔로우
  'mention',      -- 멘션
  'reply',        -- 내 댓글에 답글
  'system',       -- 시스템 알림

  -- 확장 유형
  'vote',         -- 내 댓글에 공감/비공감
  'politician_update', -- 팔로우한 정치인 업데이트
  'notice',       -- 새 공지사항
  'grade_change', -- 등급 변경
  'points',       -- 포인트 적립
  'inquiry_reply', -- 문의 처리 완료
  'report_payment', -- 보고서 입금 확인
  'report_sent'   -- 보고서 발송 완료
));

-- ============================================================================
-- 2. 알림 관련 추가 컬럼
-- ============================================================================

-- metadata 컬럼 추가 (추가 정보 저장용)
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- ============================================================================
-- 3. 알림 생성 함수들
-- ============================================================================

-- 댓글 알림 생성 함수
CREATE OR REPLACE FUNCTION create_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  post_title TEXT;
  commenter_name TEXT;
BEGIN
  -- 게시글 작성자 조회
  SELECT user_id, title INTO post_author_id, post_title
  FROM posts WHERE id = NEW.post_id;

  -- 본인 게시글에 댓글 달면 알림 X
  IF post_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- 댓글 작성자 이름 조회
  SELECT nickname INTO commenter_name FROM users WHERE user_id = NEW.user_id;

  -- 알림 생성
  INSERT INTO notifications (user_id, actor_id, type, title, message, link_url, target_type, target_id)
  VALUES (
    post_author_id,
    NEW.user_id,
    'comment',
    '새 댓글',
    commenter_name || '님이 회원님의 게시글에 댓글을 남겼습니다.',
    '/posts/' || NEW.post_id,
    'post',
    NEW.post_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 답글 알림 생성 함수
CREATE OR REPLACE FUNCTION create_reply_notification()
RETURNS TRIGGER AS $$
DECLARE
  parent_author_id UUID;
  replier_name TEXT;
BEGIN
  -- 부모 댓글이 없으면 종료
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- 부모 댓글 작성자 조회
  SELECT user_id INTO parent_author_id FROM comments WHERE id = NEW.parent_id;

  -- 본인 댓글에 답글 달면 알림 X
  IF parent_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- 답글 작성자 이름 조회
  SELECT nickname INTO replier_name FROM users WHERE user_id = NEW.user_id;

  -- 알림 생성
  INSERT INTO notifications (user_id, actor_id, type, title, message, link_url, target_type, target_id)
  VALUES (
    parent_author_id,
    NEW.user_id,
    'reply',
    '새 답글',
    replier_name || '님이 회원님의 댓글에 답글을 남겼습니다.',
    '/posts/' || NEW.post_id || '#comment-' || NEW.id,
    'comment',
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 투표(공감/비공감) 알림 생성 함수
CREATE OR REPLACE FUNCTION create_vote_notification()
RETURNS TRIGGER AS $$
DECLARE
  comment_author_id UUID;
  voter_name TEXT;
  vote_type_text TEXT;
BEGIN
  -- 댓글 작성자 조회
  SELECT user_id INTO comment_author_id FROM comments WHERE id = NEW.comment_id;

  -- 본인 댓글에 투표하면 알림 X
  IF comment_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- 투표자 이름 조회
  SELECT nickname INTO voter_name FROM users WHERE user_id = NEW.user_id;

  -- 투표 유형
  vote_type_text := CASE WHEN NEW.vote_type = 'upvote' THEN '공감' ELSE '비공감' END;

  -- 알림 생성
  INSERT INTO notifications (user_id, actor_id, type, title, message, target_type, target_id, metadata)
  VALUES (
    comment_author_id,
    NEW.user_id,
    'vote',
    '새 ' || vote_type_text,
    voter_name || '님이 회원님의 댓글에 ' || vote_type_text || '했습니다.',
    'comment',
    NEW.comment_id,
    jsonb_build_object('vote_type', NEW.vote_type)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 포인트 적립 알림 생성 함수
CREATE OR REPLACE FUNCTION create_points_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- 포인트가 증가한 경우에만 알림
  IF NEW.points > OLD.points THEN
    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (
      NEW.user_id,
      'points',
      '포인트 적립',
      (NEW.points - OLD.points)::TEXT || '포인트가 적립되었습니다.',
      jsonb_build_object('amount', NEW.points - OLD.points, 'total', NEW.points)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 등급 변경 알림 생성 함수
CREATE OR REPLACE FUNCTION create_grade_change_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- 등급이 변경된 경우에만 알림
  IF NEW.influence_grade IS DISTINCT FROM OLD.influence_grade THEN
    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (
      NEW.user_id,
      'grade_change',
      '등급 변경',
      '회원님의 등급이 ' || COALESCE(NEW.influence_grade, '기본') || '(으)로 변경되었습니다.',
      jsonb_build_object('old_grade', OLD.influence_grade, 'new_grade', NEW.influence_grade)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. 트리거 생성 (안전하게 재생성)
-- ============================================================================

-- 기존 트리거 삭제
DROP TRIGGER IF EXISTS trigger_comment_notification ON comments;
DROP TRIGGER IF EXISTS trigger_reply_notification ON comments;
-- comment_votes 트리거 삭제 (테이블이 있는 경우에만)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comment_votes') THEN
    DROP TRIGGER IF EXISTS trigger_vote_notification ON comment_votes;
  END IF;
END $$;
DROP TRIGGER IF EXISTS trigger_points_notification ON users;
DROP TRIGGER IF EXISTS trigger_grade_change_notification ON users;

-- 댓글 트리거 (게시글 댓글) - parent_id 컬럼이 있는 경우에만
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'parent_id') THEN
    CREATE TRIGGER trigger_comment_notification
      AFTER INSERT ON comments
      FOR EACH ROW
      WHEN (NEW.parent_id IS NULL)
      EXECUTE FUNCTION create_comment_notification();

    CREATE TRIGGER trigger_reply_notification
      AFTER INSERT ON comments
      FOR EACH ROW
      WHEN (NEW.parent_id IS NOT NULL)
      EXECUTE FUNCTION create_reply_notification();
  ELSE
    -- parent_id가 없으면 모든 댓글에 대해 알림 생성
    CREATE TRIGGER trigger_comment_notification
      AFTER INSERT ON comments
      FOR EACH ROW
      EXECUTE FUNCTION create_comment_notification();
  END IF;
END $$;

-- 투표 트리거 (comment_votes 테이블이 있는 경우)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comment_votes') THEN
    CREATE TRIGGER trigger_vote_notification
      AFTER INSERT ON comment_votes
      FOR EACH ROW
      EXECUTE FUNCTION create_vote_notification();
  END IF;
END $$;

-- 포인트 트리거
CREATE TRIGGER trigger_points_notification
  AFTER UPDATE OF points ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_points_notification();

-- 등급 변경 트리거
CREATE TRIGGER trigger_grade_change_notification
  AFTER UPDATE OF influence_grade ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_grade_change_notification();

-- ============================================================================
-- 5. 코멘트
-- ============================================================================

COMMENT ON COLUMN notifications.metadata IS '알림 관련 추가 데이터 (JSON)';
