-- Migration: 069_create_reports_table.sql
-- Description: 신고 기능을 위한 reports 테이블 생성
-- Created: 2025-12-17

-- ============================================================================
-- 1. Reports 테이블 생성
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'user', 'politician')),
  target_id TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'hate_speech', 'misinformation', 'inappropriate', 'other')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected', 'resolved')),
  resolution TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. 인덱스 생성
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_target_type ON public.reports(target_type);
CREATE INDEX IF NOT EXISTS idx_reports_target_id ON public.reports(target_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_pending ON public.reports(status, created_at DESC) WHERE status = 'pending';

-- ============================================================================
-- 3. RLS 정책 설정
-- ============================================================================
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 로그인한 사용자만 신고 생성 가능
CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- 본인 신고 내역만 조회 가능
CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id);

-- 관리자는 모든 신고 조회/수정 가능 (추후 admin 역할 확인 로직 추가 필요)

-- ============================================================================
-- 4. 코멘트
-- ============================================================================
COMMENT ON TABLE public.reports IS '사용자 신고 테이블';
COMMENT ON COLUMN public.reports.target_type IS '신고 대상 유형: post, comment, user, politician';
COMMENT ON COLUMN public.reports.reason IS '신고 사유: spam, harassment, hate_speech, misinformation, inappropriate, other';
COMMENT ON COLUMN public.reports.status IS '처리 상태: pending, reviewing, accepted, rejected, resolved';

-- ============================================================================
-- 완료 메시지
-- ============================================================================
SELECT '069: reports 테이블 생성 완료' as result;
