-- Migration: Create Report Sales Management Tables
-- Description: Tables for managing report purchases and email verifications
-- Date: 2025-12-01

-- ============================================================================
-- Table: email_verifications (이메일 인증)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.email_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    politician_id TEXT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    verification_code VARCHAR(6) NOT NULL,  -- 6자리 영숫자 (예: "AB12CD")
    purpose VARCHAR(50) NOT NULL DEFAULT 'report_purchase',

    -- 인증 상태
    verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,  -- NOW() + 10분
    verified_at TIMESTAMPTZ,

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_email_verifications_politician_id ON email_verifications(politician_id);
CREATE INDEX idx_email_verifications_code ON email_verifications(verification_code);
CREATE INDEX idx_email_verifications_expires_at ON email_verifications(expires_at);

-- RLS 정책
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Email verifications are viewable by admins"
    ON email_verifications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- Table: report_purchases (보고서 구매 내역)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.report_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 구매자 정보 (정치인)
    politician_id TEXT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
    buyer_name VARCHAR(100) NOT NULL,
    buyer_email VARCHAR(255) NOT NULL,

    -- 결제 정보
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'KRW',

    -- 입금 여부
    payment_confirmed BOOLEAN DEFAULT FALSE,
    payment_confirmed_at TIMESTAMPTZ,
    payment_confirmed_by UUID REFERENCES users(id),

    -- 보고서 정보
    report_type VARCHAR(50) NOT NULL
        CHECK (report_type IN ('basic', 'standard', 'premium', 'custom')),
    report_period VARCHAR(50),  -- '2025-Q1', '2025-01' 등

    -- 발송 여부
    sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ,
    sent_by UUID REFERENCES users(id),
    sent_email TEXT,  -- 실제 발송한 이메일 주소

    -- 관리자 메모
    notes TEXT,

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_report_purchases_politician_id ON report_purchases(politician_id);
CREATE INDEX idx_report_purchases_payment_confirmed ON report_purchases(payment_confirmed);
CREATE INDEX idx_report_purchases_sent ON report_purchases(sent);
CREATE INDEX idx_report_purchases_created_at ON report_purchases(created_at DESC);

-- 복합 인덱스 (발송 대기 목록용)
CREATE INDEX idx_report_purchases_pending_send
    ON report_purchases(payment_confirmed, sent)
    WHERE payment_confirmed = TRUE AND sent = FALSE;

-- RLS 정책
ALTER TABLE report_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Report purchases are viewable by admins"
    ON report_purchases FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert report purchases"
    ON report_purchases FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update report purchases"
    ON report_purchases FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- Trigger: Auto-update updated_at timestamp
-- ============================================================================
CREATE TRIGGER update_report_purchases_updated_at
    BEFORE UPDATE ON report_purchases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE email_verifications IS '이메일 인증 코드 관리 (보고서 구매 전 본인 확인)';
COMMENT ON TABLE report_purchases IS '보고서 구매 내역 및 발송 관리';
COMMENT ON COLUMN report_purchases.payment_confirmed IS '입금 확인 여부';
COMMENT ON COLUMN report_purchases.sent IS '보고서 이메일 발송 여부';
