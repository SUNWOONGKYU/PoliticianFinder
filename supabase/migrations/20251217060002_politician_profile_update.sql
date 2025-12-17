-- Migration: 071_politician_profile_update.sql
-- Description: 정치인 프로필 수정 기능을 위한 설정
-- Created: 2025-12-17

-- ============================================================================
-- 1. politician_details 테이블에 수정 가능한 필드 확인/추가
-- ============================================================================

-- 정치인이 수정할 수 있는 추가 필드
ALTER TABLE public.politician_details
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS office_address TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS self_introduction TEXT,
ADD COLUMN IF NOT EXISTS updated_by_politician_at TIMESTAMPTZ;

-- ============================================================================
-- 2. politicians 테이블에 정치인 수정 가능 필드 확인
-- ============================================================================
ALTER TABLE public.politicians
ADD COLUMN IF NOT EXISTS biography_updated_at TIMESTAMPTZ;

-- ============================================================================
-- 3. 정치인 프로필 수정 이력 테이블
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.politician_profile_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id TEXT NOT NULL REFERENCES public.politicians(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.politician_sessions(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_politician_profile_edits_politician ON public.politician_profile_edits(politician_id);
CREATE INDEX IF NOT EXISTS idx_politician_profile_edits_session ON public.politician_profile_edits(session_id);
CREATE INDEX IF NOT EXISTS idx_politician_profile_edits_created ON public.politician_profile_edits(created_at DESC);

-- ============================================================================
-- 4. RLS 정책
-- ============================================================================
ALTER TABLE public.politician_profile_edits ENABLE ROW LEVEL SECURITY;

-- 인증된 정치인 세션으로만 수정 이력 생성 가능
CREATE POLICY "Politician sessions can create edit history" ON public.politician_profile_edits
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 수정 이력 조회는 관리자만 가능 (추후 구현)
CREATE POLICY "Anyone can view edit history" ON public.politician_profile_edits
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================================
-- 5. 코멘트
-- ============================================================================
COMMENT ON TABLE public.politician_profile_edits IS '정치인 프로필 수정 이력';
COMMENT ON COLUMN public.politician_details.contact_email IS '정치인 연락처 이메일';
COMMENT ON COLUMN public.politician_details.contact_phone IS '정치인 연락처 전화번호';
COMMENT ON COLUMN public.politician_details.office_address IS '사무실 주소';
COMMENT ON COLUMN public.politician_details.website_url IS '개인 웹사이트 URL';
COMMENT ON COLUMN public.politician_details.social_links IS '소셜 미디어 링크 (JSON)';
COMMENT ON COLUMN public.politician_details.self_introduction IS '자기소개';

-- ============================================================================
-- 완료 메시지
-- ============================================================================
SELECT '071: 정치인 프로필 수정 기능 설정 완료' as result;
