/**
 * Task ID: P2D1
 * Migration: Create payments Table
 * Created: 2025-11-07
 * Author: database-developer
 * Description: Payment transactions tracking
 */

-- ================================================
-- Create payments table
-- ================================================

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Payment details
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) DEFAULT 'KRW',
    payment_method VARCHAR(50) NOT NULL, -- card, bank_transfer, mobile, etc.

    -- Transaction info
    transaction_id VARCHAR(200) UNIQUE,
    pg_provider VARCHAR(50), -- Payment Gateway: iamport, toss, etc.
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),

    -- Payment purpose
    purpose VARCHAR(100), -- premium_subscription, advertisement, donation, etc.
    description TEXT,

    -- Metadata
    metadata JSONB,

    -- Timestamps
    paid_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE public.payments IS 'Payment transactions';
COMMENT ON COLUMN public.payments.user_id IS 'User who made the payment';
COMMENT ON COLUMN public.payments.amount IS 'Payment amount (non-negative)';
COMMENT ON COLUMN public.payments.transaction_id IS 'Unique transaction ID from PG';
COMMENT ON COLUMN public.payments.status IS 'Payment status: pending, completed, failed, cancelled, refunded';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id
    ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status
    ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at
    ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id
    ON public.payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_purpose
    ON public.payments(purpose);

-- RLS Policies
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS select_own_payments
    ON public.payments FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS insert_own_payments
    ON public.payments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admin can view all payments
CREATE POLICY IF NOT EXISTS admin_view_all_payments
    ON public.payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_payments_updated_at();
