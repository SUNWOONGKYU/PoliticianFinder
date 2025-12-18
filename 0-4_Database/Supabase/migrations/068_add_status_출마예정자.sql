-- Migration: 068_add_status_출마예정자.sql
-- Date: 2025-12-18
-- Description: status 컬럼에 '출마예정자' 추가 및 기존 '출마자' 변경
-- Author: Claude Code

-- ============================================
-- 1. 기존 CHECK 제약조건 삭제
-- ============================================
ALTER TABLE politicians DROP CONSTRAINT IF EXISTS politicians_status_check;

-- ============================================
-- 2. 새 CHECK 제약조건 추가 (출마예정자 포함)
-- ============================================
ALTER TABLE politicians ADD CONSTRAINT politicians_status_check
CHECK (status IN ('현직', '후보자', '예비후보자', '출마예정자', '출마자'));

-- ============================================
-- 3. 출마자 -> 출마예정자로 일괄 변경
-- ============================================
UPDATE politicians SET status = '출마예정자' WHERE status = '출마자';

-- ============================================
-- 4. 변경 결과 확인 (선택사항)
-- ============================================
-- SELECT status, COUNT(*) FROM politicians GROUP BY status;
