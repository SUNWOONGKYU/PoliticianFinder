-- Migration: Update report_purchases for AI selection
-- Description: AI별 선택 구매 지원 (Claude/ChatGPT/Grok)
-- Date: 2025-12-17

-- ============================================================================
-- 1. report_type CHECK 제약조건 제거 및 새 컬럼 추가
-- ============================================================================

-- 기존 CHECK 제약조건 삭제
ALTER TABLE report_purchases
DROP CONSTRAINT IF EXISTS report_purchases_report_type_check;

-- selected_ais 컬럼 추가 (선택한 AI 목록: JSON 배열)
ALTER TABLE report_purchases
ADD COLUMN IF NOT EXISTS selected_ais JSONB DEFAULT '[]'::jsonb;

-- purchase_count 컬럼 추가 (구매 회차: 1차, 2차, 3차...)
ALTER TABLE report_purchases
ADD COLUMN IF NOT EXISTS purchase_count INTEGER DEFAULT 1;

-- discount_rate 컬럼 추가 (할인율: 0.0 ~ 1.0)
ALTER TABLE report_purchases
ADD COLUMN IF NOT EXISTS discount_rate DECIMAL(3, 2) DEFAULT 0.00;

-- original_amount 컬럼 추가 (할인 전 금액)
ALTER TABLE report_purchases
ADD COLUMN IF NOT EXISTS original_amount DECIMAL(10, 2);

-- ============================================================================
-- 2. report_type 기본값 변경
-- ============================================================================

-- report_type을 AI 선택 개수 기반으로 사용
-- '1_ai', '2_ai', '3_ai' 또는 자유 텍스트
ALTER TABLE report_purchases
ALTER COLUMN report_type SET DEFAULT 'custom';

-- ============================================================================
-- 3. 코멘트 추가
-- ============================================================================

COMMENT ON COLUMN report_purchases.selected_ais IS '선택한 AI 목록 (예: ["Claude", "ChatGPT"])';
COMMENT ON COLUMN report_purchases.purchase_count IS '해당 정치인의 구매 회차 (할인 적용용)';
COMMENT ON COLUMN report_purchases.discount_rate IS '적용된 할인율 (0.00 ~ 1.00)';
COMMENT ON COLUMN report_purchases.original_amount IS '할인 전 원래 금액';

-- ============================================================================
-- 4. RLS 정책 업데이트 - 비로그인 사용자도 INSERT 가능
-- ============================================================================

-- 기존 INSERT 정책 삭제
DROP POLICY IF EXISTS "Admins can insert report purchases" ON report_purchases;

-- 새 INSERT 정책 (누구나 구매 신청 가능)
CREATE POLICY "Anyone can insert report purchases"
    ON report_purchases FOR INSERT
    WITH CHECK (true);

-- ============================================================================
-- 5. 구매 회차 계산 함수
-- ============================================================================

CREATE OR REPLACE FUNCTION get_purchase_count(p_politician_id TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN COALESCE(
        (SELECT COUNT(*) + 1 FROM report_purchases WHERE politician_id = p_politician_id),
        1
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_purchase_count IS '해당 정치인의 다음 구매 회차 반환';
