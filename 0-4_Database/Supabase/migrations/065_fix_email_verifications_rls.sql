-- Migration: 065_fix_email_verifications_rls.sql
-- Purpose: email_verifications 테이블에 누락된 INSERT 정책 추가
-- Date: 2025-12-16
-- Author: Claude Code
--
-- 문제:
-- 정치인 인증 코드 발송 시 email_verifications 테이블에 INSERT 불가
-- 원인: INSERT 정책이 없어서 RLS에 의해 차단됨
-- 해결: service_role을 위한 INSERT 정책 추가

-- ============================================================
-- INSERT 정책 추가 (service_role 전용)
-- ============================================================

-- 기존 정책이 있으면 삭제
DROP POLICY IF EXISTS "Service role can insert email verifications" ON email_verifications;
DROP POLICY IF EXISTS "Anyone can insert email verifications" ON email_verifications;

-- 모든 사용자가 INSERT 가능하도록 (API에서 검증)
CREATE POLICY "Anyone can insert email verifications"
  ON email_verifications
  FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- UPDATE 정책 추가 (인증 확인 시 verified = true로 업데이트)
-- ============================================================

DROP POLICY IF EXISTS "Service role can update email verifications" ON email_verifications;
DROP POLICY IF EXISTS "Anyone can update email verifications" ON email_verifications;

-- 모든 사용자가 UPDATE 가능하도록 (API에서 검증)
CREATE POLICY "Anyone can update email verifications"
  ON email_verifications
  FOR UPDATE
  USING (true);

-- ============================================================
-- SELECT 정책 수정 (인증 확인을 위해 모든 사용자가 조회 가능)
-- ============================================================

-- 기존 admin 전용 정책 삭제
DROP POLICY IF EXISTS "Email verifications are viewable by admins" ON email_verifications;

-- 모든 사용자가 조회 가능하도록 (API에서 인증 코드 검증에 필요)
CREATE POLICY "Anyone can read email verifications"
  ON email_verifications
  FOR SELECT
  USING (true);

-- ============================================================
-- DELETE 정책 추가 (만료된 인증 코드 정리용)
-- ============================================================

DROP POLICY IF EXISTS "Service role can delete email verifications" ON email_verifications;

CREATE POLICY "Service role can delete email verifications"
  ON email_verifications
  FOR DELETE
  USING (true);

-- ============================================================
-- 확인
-- ============================================================

-- 정책 확인용 쿼리 (실행 후 확인)
-- SELECT tablename, policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'email_verifications';
