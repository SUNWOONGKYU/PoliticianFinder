/**
 * Project Grid Task ID: P1D1
 * 작업명: 인증 스키마
 * 생성시간: 2025-10-31 14:20
 * 생성자: Claude-Sonnet-4.5
 * 의존성: P1O1
 * 설명: 사용자 인증을 위한 데이터베이스 스키마
 */

-- ================================================
-- 1. profiles 테이블 (사용자 프로필)
-- ================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    is_email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS '사용자 프로필 정보';
COMMENT ON COLUMN public.profiles.id IS 'auth.users.id 외래키';
COMMENT ON COLUMN public.profiles.role IS '사용자 역할: user, admin, moderator';

-- ================================================
-- 2. auth_tokens 테이블 (인증 토큰)
-- ================================================

CREATE TABLE IF NOT EXISTS public.auth_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    token_type VARCHAR(50) NOT NULL CHECK (token_type IN ('access', 'refresh', 'reset_password', 'verify_email')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.auth_tokens IS '인증 토큰 관리';
COMMENT ON COLUMN public.auth_tokens.token_type IS 'access: 액세스 토큰, refresh: 리프레시 토큰, reset_password: 비밀번호 재설정, verify_email: 이메일 인증';

-- ================================================
-- 3. email_verifications 테이블 (이메일 인증)
-- ================================================

CREATE TABLE IF NOT EXISTS public.email_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    verification_code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.email_verifications IS '이메일 인증 코드 관리';
COMMENT ON COLUMN public.email_verifications.attempts IS '인증 시도 횟수';

-- ================================================
-- 4. password_resets 테이블 (비밀번호 재설정)
-- ================================================

CREATE TABLE IF NOT EXISTS public.password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reset_token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.password_resets IS '비밀번호 재설정 토큰 관리';

-- ================================================
-- 5. 인덱스 생성
-- ================================================

-- profiles 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- auth_tokens 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON public.auth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_token ON public.auth_tokens(token);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires_at ON public.auth_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_token_type ON public.auth_tokens(token_type);

-- email_verifications 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_email_verifications_user_id ON public.email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_code ON public.email_verifications(verification_code);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON public.email_verifications(expires_at);

-- password_resets 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON public.password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON public.password_resets(reset_token);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON public.password_resets(expires_at);

-- ================================================
-- 6. RLS (Row Level Security) 정책
-- ================================================

-- RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

-- profiles 정책
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- auth_tokens 정책
CREATE POLICY "Users can view their own tokens"
    ON public.auth_tokens FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens"
    ON public.auth_tokens FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
    ON public.auth_tokens FOR UPDATE
    USING (auth.uid() = user_id);

-- email_verifications 정책
CREATE POLICY "Users can view their own verifications"
    ON public.email_verifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own verifications"
    ON public.email_verifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- password_resets 정책
CREATE POLICY "Users can view their own password resets"
    ON public.password_resets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own password resets"
    ON public.password_resets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ================================================
-- 7. 트리거 함수 (updated_at 자동 업데이트)
-- ================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- profiles 테이블에 트리거 추가
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ================================================
-- 완료
-- ================================================

COMMENT ON SCHEMA public IS 'PoliticianFinder 인증 스키마 - P1D1';
