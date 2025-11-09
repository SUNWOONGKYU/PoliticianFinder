-- P1D2: 인증 트리거
-- 작업일: 2025-10-31
-- 설명: PoliticianFinder 인증 시스템 트리거

-- ============================================================================
-- 1. auth.users 생성 시 profiles 자동 생성 트리거
-- ============================================================================
-- Supabase Auth에서 사용자 생성 시 public.profiles에 자동으로 프로필 생성
-- HTML 프로토타입(signup.html)의 필수 필드를 auth.users 메타데이터에서 가져옴

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_nickname TEXT;
  user_full_name TEXT;
  user_oauth_provider TEXT;
  user_marketing_agreed BOOLEAN;
BEGIN
  -- auth.users에서 이메일 추출
  user_email := NEW.email;

  -- raw_user_meta_data에서 추가 정보 추출
  -- signup.html에서 전송된 필드: nickname, full_name, marketing_agreed
  user_nickname := COALESCE(
    NEW.raw_user_meta_data->>'nickname',
    split_part(user_email, '@', 1) -- 이메일 앞부분을 기본 닉네임으로 사용
  );

  user_full_name := NEW.raw_user_meta_data->>'full_name';
  user_marketing_agreed := COALESCE((NEW.raw_user_meta_data->>'marketing_agreed')::BOOLEAN, FALSE);

  -- OAuth 제공자 확인 (google, email 등)
  user_oauth_provider := COALESCE(
    NEW.raw_app_meta_data->>'provider',
    'email' -- 기본값: 이메일 회원가입
  );

  -- public.profiles에 새 프로필 생성
  INSERT INTO public.profiles (
    id,
    email,
    nickname,
    full_name,
    oauth_provider,
    oauth_id,
    user_type,
    email_verified,
    marketing_agreed,
    created_at,
    updated_at,
    last_login_at
  )
  VALUES (
    NEW.id,
    user_email,
    user_nickname,
    user_full_name,
    user_oauth_provider,
    NEW.raw_app_meta_data->>'provider_id', -- OAuth ID
    'member', -- 기본 사용자 유형
    NEW.email_confirmed_at IS NOT NULL, -- 이메일 인증 여부
    user_marketing_agreed,
    NOW(),
    NOW(),
    NOW() -- 첫 로그인 시간
  )
  ON CONFLICT (id) DO UPDATE SET
    -- 이미 존재하는 경우 이메일 인증 상태만 업데이트
    email_verified = NEW.email_confirmed_at IS NOT NULL,
    last_login_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users 테이블에 트리거 연결
-- Supabase Auth는 auth 스키마이므로 SECURITY DEFINER 필요
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 트리거 코멘트
COMMENT ON FUNCTION public.handle_new_user() IS
'auth.users에 새 사용자 생성 시 public.profiles에 자동으로 프로필 생성. signup.html의 필수 필드 매핑.';


-- ============================================================================
-- 2. 로그인 시 last_login_at 자동 갱신 트리거
-- ============================================================================
-- 사용자 로그인 시 profiles.last_login_at 업데이트

CREATE OR REPLACE FUNCTION public.handle_user_login()
RETURNS TRIGGER AS $$
BEGIN
  -- auth.users의 last_sign_in_at이 변경된 경우 profiles 업데이트
  IF NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at THEN
    UPDATE public.profiles
    SET last_login_at = NEW.last_sign_in_at
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users 테이블에 로그인 트리거 연결
CREATE TRIGGER on_auth_user_login
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at)
  EXECUTE FUNCTION public.handle_user_login();

-- 트리거 코멘트
COMMENT ON FUNCTION public.handle_user_login() IS
'auth.users 로그인 시 public.profiles.last_login_at 자동 갱신';


-- ============================================================================
-- 3. 이메일 인증 완료 시 profiles 업데이트 트리거
-- ============================================================================
-- 사용자가 이메일 인증을 완료하면 profiles.email_verified 업데이트

CREATE OR REPLACE FUNCTION public.handle_email_verified()
RETURNS TRIGGER AS $$
BEGIN
  -- email_confirmed_at이 NULL에서 NOT NULL로 변경된 경우
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.profiles
    SET email_verified = TRUE
    WHERE id = NEW.id;

    -- email_verifications 테이블도 업데이트
    UPDATE public.email_verifications
    SET
      is_verified = TRUE,
      verified_at = NEW.email_confirmed_at
    WHERE user_id = NEW.id
      AND email = NEW.email
      AND is_verified = FALSE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users 테이블에 이메일 인증 트리거 연결
CREATE TRIGGER on_auth_user_email_verified
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_email_verified();

-- 트리거 코멘트
COMMENT ON FUNCTION public.handle_email_verified() IS
'이메일 인증 완료 시 profiles.email_verified와 email_verifications 테이블 자동 업데이트';


-- ============================================================================
-- 4. 사용자 삭제 시 관련 데이터 정리 트리거
-- ============================================================================
-- auth.users 삭제 시 관련 토큰, 인증 정보 정리
-- (프로필은 ON DELETE CASCADE로 자동 삭제됨)

CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- 사용 중인 토큰 모두 폐기
  UPDATE public.auth_tokens
  SET
    is_revoked = TRUE,
    revoked_at = NOW(),
    revoked_reason = 'User account deleted'
  WHERE user_id = OLD.id
    AND is_revoked = FALSE;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users 테이블에 삭제 트리거 연결
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_delete();

-- 트리거 코멘트
COMMENT ON FUNCTION public.handle_user_delete() IS
'사용자 삭제 시 모든 활성 토큰 폐기 및 관련 데이터 정리';


-- ============================================================================
-- 완료
-- ============================================================================
-- P1D2: 인증 트리거 생성 완료
-- 생성된 트리거:
--   1. on_auth_user_created: 회원가입 시 profiles 자동 생성
--   2. on_auth_user_login: 로그인 시 last_login_at 갱신
--   3. on_auth_user_email_verified: 이메일 인증 시 profiles 업데이트
--   4. on_auth_user_deleted: 계정 삭제 시 토큰 폐기
-- 생성된 함수: 4개
-- HTML 프로토타입(signup.html) 필드 매핑 완료
