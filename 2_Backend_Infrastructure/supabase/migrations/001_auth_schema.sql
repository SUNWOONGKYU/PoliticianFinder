-- P1D1: 인증 스키마
-- 작업일: 2025-10-31
-- 설명: PoliticianFinder 인증 시스템 데이터베이스 스키마

-- ============================================================================
-- 1. profiles 테이블 (사용자 프로필)
-- ============================================================================
-- auth.users와 1:1 관계
-- HTML 프로토타입(signup.html) 기반: email, password, nickname, full_name

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 기본 정보 (HTML 프로토타입 회원가입 폼 기반)
  email TEXT NOT NULL UNIQUE,
  nickname TEXT NOT NULL UNIQUE CHECK (char_length(nickname) >= 2 AND char_length(nickname) <= 10),
  full_name TEXT, -- 선택 필드

  -- 프로필 정보
  avatar_url TEXT,
  bio TEXT,

  -- OAuth 정보
  oauth_provider TEXT, -- 'google', 'email' 등
  oauth_id TEXT,

  -- 사용자 유형
  user_type TEXT NOT NULL DEFAULT 'member' CHECK (user_type IN ('member', 'politician', 'admin')),

  -- 인증 상태
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  -- 선호 설정
  notification_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  marketing_agreed BOOLEAN NOT NULL DEFAULT FALSE, -- signup.html의 마케팅 동의

  -- 타임스탬프
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,

  -- 인덱스를 위한 추가 정보
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', COALESCE(nickname, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(full_name, '')), 'B')
  ) STORED
);

-- profiles 테이블 코멘트
COMMENT ON TABLE public.profiles IS '사용자 프로필 정보 (auth.users와 1:1)';
COMMENT ON COLUMN public.profiles.nickname IS '닉네임 (2-10자, 필수)';
COMMENT ON COLUMN public.profiles.full_name IS '실명 (선택)';
COMMENT ON COLUMN public.profiles.marketing_agreed IS 'signup.html 마케팅 동의 체크박스';


-- ============================================================================
-- 2. auth_tokens 테이블 (JWT 토큰 관리)
-- ============================================================================
-- Access Token, Refresh Token 관리

CREATE TABLE IF NOT EXISTS public.auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 토큰 정보
  token_type TEXT NOT NULL CHECK (token_type IN ('access', 'refresh')),
  token_hash TEXT NOT NULL UNIQUE, -- 토큰의 해시값 저장 (보안)

  -- 만료 정보
  expires_at TIMESTAMPTZ NOT NULL,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,

  -- 디바이스 정보
  device_info JSONB, -- user agent, IP 등
  last_used_at TIMESTAMPTZ,

  -- 타임스탬프
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- auth_tokens 테이블 코멘트
COMMENT ON TABLE public.auth_tokens IS 'JWT 토큰 관리 (Access Token, Refresh Token)';
COMMENT ON COLUMN public.auth_tokens.token_hash IS '토큰 해시값 (원본은 저장하지 않음)';


-- ============================================================================
-- 3. email_verifications 테이블 (이메일 인증)
-- ============================================================================
-- 회원가입 시 이메일 인증 토큰 관리

CREATE TABLE IF NOT EXISTS public.email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 이메일 정보
  email TEXT NOT NULL,

  -- 인증 토큰
  verification_token TEXT NOT NULL UNIQUE,
  verification_code TEXT, -- 6자리 숫자 코드 (선택적)

  -- 상태 정보
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ,

  -- 만료 정보
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),

  -- 재전송 관리
  resend_count INTEGER NOT NULL DEFAULT 0,
  last_resend_at TIMESTAMPTZ,

  -- 타임스탬프
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- email_verifications 테이블 코멘트
COMMENT ON TABLE public.email_verifications IS '이메일 인증 토큰 관리';
COMMENT ON COLUMN public.email_verifications.verification_code IS '6자리 숫자 코드 (선택적, SMS 인증 등에 사용)';


-- ============================================================================
-- 4. password_resets 테이블 (비밀번호 재설정)
-- ============================================================================
-- login.html의 "비밀번호 찾기" 기능

CREATE TABLE IF NOT EXISTS public.password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 이메일 정보
  email TEXT NOT NULL,

  -- 재설정 토큰
  reset_token TEXT NOT NULL UNIQUE,
  reset_code TEXT, -- 6자리 숫자 코드 (선택적)

  -- 상태 정보
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMPTZ,

  -- 만료 정보 (1시간 유효)
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),

  -- IP 추적 (보안)
  request_ip TEXT,
  request_user_agent TEXT,

  -- 타임스탬프
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- password_resets 테이블 코멘트
COMMENT ON TABLE public.password_resets IS '비밀번호 재설정 토큰 관리 (login.html 비밀번호 찾기)';
COMMENT ON COLUMN public.password_resets.expires_at IS '1시간 유효';


-- ============================================================================
-- 5. 인덱스 생성
-- ============================================================================

-- profiles 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON public.profiles(nickname);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON public.profiles(email_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_search_vector ON public.profiles USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- auth_tokens 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON public.auth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_token_hash ON public.auth_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires_at ON public.auth_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_is_revoked ON public.auth_tokens(is_revoked) WHERE is_revoked = FALSE;

-- email_verifications 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON public.email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON public.email_verifications(verification_token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON public.email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON public.email_verifications(expires_at);

-- password_resets 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON public.password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON public.password_resets(reset_token);
CREATE INDEX IF NOT EXISTS idx_password_resets_email ON public.password_resets(email);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON public.password_resets(expires_at);


-- ============================================================================
-- 6. RLS (Row Level Security) 정책
-- ============================================================================

-- RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

-- profiles 테이블 RLS 정책
-- 모든 사용자가 프로필 조회 가능 (공개 정보)
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (TRUE);

-- 자신의 프로필만 수정 가능
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 프로필 삭제는 자신만 가능
CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- auth_tokens 테이블 RLS 정책
-- 자신의 토큰만 조회 가능
CREATE POLICY "Users can view own tokens"
  ON public.auth_tokens FOR SELECT
  USING (auth.uid() = user_id);

-- 자신의 토큰만 폐기 가능 (UPDATE)
CREATE POLICY "Users can revoke own tokens"
  ON public.auth_tokens FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- email_verifications 테이블 RLS 정책
-- 자신의 인증 정보만 조회 가능
CREATE POLICY "Users can view own verifications"
  ON public.email_verifications FOR SELECT
  USING (auth.uid() = user_id);

-- password_resets 테이블 RLS 정책
-- 자신의 재설정 요청만 조회 가능
CREATE POLICY "Users can view own password resets"
  ON public.password_resets FOR SELECT
  USING (auth.uid() = user_id);


-- ============================================================================
-- 7. 함수 및 트리거 준비
-- ============================================================================

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- profiles 테이블 updated_at 트리거
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();


-- ============================================================================
-- 완료
-- ============================================================================
-- P1D1: 인증 스키마 생성 완료
-- 생성된 테이블: profiles, auth_tokens, email_verifications, password_resets
-- 인덱스: 18개 생성
-- RLS 정책: 7개 생성
