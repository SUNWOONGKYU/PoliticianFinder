-- Migration: 066_auto_create_profile_trigger.sql
-- Description: 회원가입 시 profiles 테이블에 자동으로 프로필 생성
-- Created: 2025-12-17
-- Issue: 회원가입 후 posts 작성 시 profiles FK 오류 발생

-- ============================================================================
-- FUNCTION: 신규 사용자 생성 시 profiles 테이블에 자동으로 프로필 생성
-- ============================================================================
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
  ON CONFLICT (id) DO NOTHING;  -- 이미 프로필이 있으면 무시

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: auth.users 테이블에 새 사용자 추가 시 자동 실행
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 기존 사용자 중 프로필이 없는 사용자에게 프로필 생성
-- ============================================================================
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

-- ============================================================================
-- COMMENT
-- ============================================================================
COMMENT ON FUNCTION public.handle_new_user() IS '신규 사용자 가입 시 profiles 테이블에 자동으로 프로필 생성';
