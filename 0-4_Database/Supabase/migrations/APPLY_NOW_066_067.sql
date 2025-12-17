-- ============================================================================
-- 통합 마이그레이션 파일 (066 + 067)
-- Supabase Dashboard > SQL Editor에서 실행하세요
-- Created: 2025-12-17
-- ============================================================================

-- ============================================================================
-- 1. 프로필 자동 생성 trigger (066)
-- ============================================================================

-- 신규 사용자 생성 시 profiles 테이블에 자동으로 프로필 생성하는 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, nickname, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1)),
    'user',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 trigger 삭제 후 재생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 기존 사용자 중 프로필이 없는 사용자에게 프로필 생성
INSERT INTO public.profiles (id, email, full_name, nickname, role, created_at, updated_at)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'nickname', split_part(au.email, '@', 1)),
  'user',
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

COMMENT ON FUNCTION public.handle_new_user() IS '신규 사용자 가입 시 profiles 테이블에 자동으로 프로필 생성';

-- ============================================================================
-- 2. 대댓글 parent_id 컬럼 추가 (067)
-- ============================================================================

-- parent_id 컬럼 추가
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

-- reply_count 컬럼 추가
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

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);

-- 대댓글 수 업데이트 trigger 함수
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

-- Trigger 생성
DROP TRIGGER IF EXISTS comment_reply_count_trigger ON public.comments;

CREATE TRIGGER comment_reply_count_trigger
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_comment_reply_count();

COMMENT ON COLUMN public.comments.parent_id IS '대댓글(답글)의 부모 댓글 ID. NULL이면 최상위 댓글';
COMMENT ON COLUMN public.comments.reply_count IS '이 댓글에 달린 대댓글 수';

-- ============================================================================
-- 완료 메시지
-- ============================================================================
SELECT '마이그레이션 066, 067 적용 완료' as result;
