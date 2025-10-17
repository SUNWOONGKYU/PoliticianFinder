-- Phase 3 Database Rollback Script
-- 작성일: 2025-01-17
-- 설명: Phase 3에서 생성된 테이블들을 롤백하는 스크립트

-- ============================================
-- 롤백 전 확인 사항
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Phase 3 Database 롤백을 시작합니다.';
  RAISE NOTICE '다음 테이블들이 삭제됩니다:';
  RAISE NOTICE '  - likes (P3D3)';
  RAISE NOTICE '  - like_counts (P3D3 관련)';
  RAISE NOTICE '  - comments (P3D2 개선버전)';
  RAISE NOTICE '  - notifications (P3D1 개선버전)';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 1. P3D3: likes 테이블 롤백
-- ============================================

-- 뷰 삭제
DROP VIEW IF EXISTS user_like_activity CASCADE;
DROP VIEW IF EXISTS popular_posts CASCADE;

-- 함수 삭제
DROP FUNCTION IF EXISTS get_like_stats(VARCHAR(50), BIGINT);
DROP FUNCTION IF EXISTS check_like_status(UUID, VARCHAR(50), BIGINT[]);
DROP FUNCTION IF EXISTS toggle_like(UUID, VARCHAR(50), BIGINT, VARCHAR(20));

-- 트리거 삭제
DROP TRIGGER IF EXISTS notify_like_activity_trigger ON likes;
DROP TRIGGER IF EXISTS decrement_like_count_trigger ON likes;
DROP TRIGGER IF EXISTS increment_like_count_trigger ON likes;

-- 트리거 함수 삭제
DROP FUNCTION IF EXISTS notify_like_activity();
DROP FUNCTION IF EXISTS decrement_like_count();
DROP FUNCTION IF EXISTS increment_like_count();

-- RLS 정책 삭제
DROP POLICY IF EXISTS "Users can delete own likes" ON likes;
DROP POLICY IF EXISTS "Authenticated users can add likes" ON likes;
DROP POLICY IF EXISTS "Anyone can view likes" ON likes;
DROP POLICY IF EXISTS "Anyone can view like counts" ON like_counts;

-- 테이블 삭제
DROP TABLE IF EXISTS like_counts CASCADE;
DROP TABLE IF EXISTS likes CASCADE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'likes'
  ) THEN
    RAISE NOTICE 'P3D3: likes 테이블이 성공적으로 삭제되었습니다.';
  ELSE
    RAISE WARNING 'P3D3: likes 테이블 삭제에 실패했습니다.';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 2. P3D2: comments 테이블 롤백
-- ============================================

-- 백업 테이블이 있으면 복원
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'comments_backup'
  ) THEN
    -- 현재 comments 테이블 삭제
    DROP TABLE IF EXISTS comments CASCADE;

    -- 백업에서 복원
    CREATE TABLE comments AS
    SELECT * FROM comments_backup;

    -- 백업 테이블 삭제
    DROP TABLE comments_backup;

    RAISE NOTICE 'P3D2: comments 테이블을 백업에서 복원했습니다.';
  ELSE
    -- 백업이 없으면 기본 스키마로 재생성
    DROP VIEW IF EXISTS comment_stats CASCADE;
    DROP FUNCTION IF EXISTS get_comment_tree(BIGINT);
    DROP TRIGGER IF EXISTS notify_comment_activity_trigger ON comments CASCADE;
    DROP TRIGGER IF EXISTS handle_comment_delete_trigger ON comments CASCADE;
    DROP TRIGGER IF EXISTS set_comment_path_trigger ON comments CASCADE;
    DROP TRIGGER IF EXISTS handle_comment_edit_trigger ON comments CASCADE;
    DROP TRIGGER IF EXISTS update_comments_updated_at ON comments CASCADE;

    DROP FUNCTION IF EXISTS notify_comment_activity() CASCADE;
    DROP FUNCTION IF EXISTS handle_comment_delete() CASCADE;
    DROP FUNCTION IF EXISTS set_comment_path() CASCADE;
    DROP FUNCTION IF EXISTS handle_comment_edit() CASCADE;

    DROP TABLE IF EXISTS comments CASCADE;

    -- 기본 comments 테이블 재생성
    CREATE TABLE IF NOT EXISTS public.comments (
      id SERIAL PRIMARY KEY,
      post_id INTEGER REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      content TEXT NOT NULL CHECK (char_length(content) >= 1),
      parent_id INTEGER REFERENCES public.comments(id) ON DELETE CASCADE,
      upvotes INTEGER DEFAULT 0,
      downvotes INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 기본 RLS 정책
    ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "댓글 읽기 공개"
      ON public.comments FOR SELECT
      USING (true);

    CREATE POLICY "로그인 사용자만 댓글 작성"
      ON public.comments FOR INSERT
      WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "본인 댓글만 수정/삭제"
      ON public.comments FOR UPDATE
      USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true
      ));

    CREATE POLICY "본인 댓글만 삭제"
      ON public.comments FOR DELETE
      USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true
      ));

    RAISE NOTICE 'P3D2: comments 테이블을 기본 스키마로 재생성했습니다.';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. P3D1: notifications 테이블 롤백
-- ============================================

-- 백업 테이블이 있으면 복원
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'notifications_backup'
  ) THEN
    -- 현재 notifications 테이블 삭제
    DROP TABLE IF EXISTS notifications CASCADE;

    -- 백업에서 복원
    CREATE TABLE notifications AS
    SELECT * FROM notifications_backup;

    -- 백업 테이블 삭제
    DROP TABLE notifications_backup;

    RAISE NOTICE 'P3D1: notifications 테이블을 백업에서 복원했습니다.';
  ELSE
    -- 백업이 없으면 기본 스키마로 재생성
    DROP VIEW IF EXISTS notification_stats CASCADE;
    DROP FUNCTION IF EXISTS create_notification(UUID, VARCHAR(50), VARCHAR(200), TEXT, UUID, VARCHAR(50), BIGINT, TEXT, VARCHAR(20), JSONB, TIMESTAMPTZ);
    DROP FUNCTION IF EXISTS cleanup_expired_notifications();
    DROP TRIGGER IF EXISTS set_notifications_read_at ON notifications CASCADE;
    DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications CASCADE;
    DROP FUNCTION IF EXISTS set_read_at() CASCADE;

    DROP TABLE IF EXISTS notifications CASCADE;

    -- 기본 notifications 테이블 재생성
    CREATE TABLE IF NOT EXISTS public.notifications (
      id SERIAL PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('comment', 'reply', 'mention', 'system')),
      content TEXT NOT NULL,
      target_url TEXT,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 기본 RLS 정책
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "본인 알림만 조회"
      ON public.notifications FOR SELECT
      USING (auth.uid() = user_id);

    CREATE POLICY "본인 알림만 수정"
      ON public.notifications FOR UPDATE
      USING (auth.uid() = user_id);

    RAISE NOTICE 'P3D1: notifications 테이블을 기본 스키마로 재생성했습니다.';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. Realtime 구독 재설정
-- ============================================

-- Realtime 구독 재설정
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS likes;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.notifications;

-- ============================================
-- 5. 공통 함수 정리
-- ============================================

-- update_updated_at_column 함수는 다른 테이블에서도 사용하므로 유지

-- ============================================
-- 완료 메시지
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Phase 3 Database 롤백이 완료되었습니다.';
  RAISE NOTICE '';
  RAISE NOTICE '롤백된 항목:';
  RAISE NOTICE '  ✓ likes 테이블 및 관련 객체';
  RAISE NOTICE '  ✓ like_counts 테이블';
  RAISE NOTICE '  ✓ comments 테이블 (기본 버전으로 복원)';
  RAISE NOTICE '  ✓ notifications 테이블 (기본 버전으로 복원)';
  RAISE NOTICE '  ✓ 관련 뷰, 함수, 트리거, RLS 정책';
  RAISE NOTICE '';
  RAISE NOTICE '다시 Phase 3를 적용하려면 다음 명령을 실행하세요:';
  RAISE NOTICE '  - 20250117_phase3_notifications_table.sql';
  RAISE NOTICE '  - 20250117_phase3_comments_enhanced.sql';
  RAISE NOTICE '  - 20250117_phase3_likes_table.sql';
  RAISE NOTICE '==============================================';
END;
$$ LANGUAGE plpgsql;