/**
 * Task ID: P4BA16
 * Migration: Create download_history Table
 * Created: 2025-11-09
 * Author: backend-developer
 * Description: Track report download history with payment verification and limit enforcement
 */

-- ================================================
-- Create download_history table
-- ================================================

CREATE TABLE IF NOT EXISTS public.download_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    evaluation_id UUID NOT NULL REFERENCES ai_evaluations(id) ON DELETE CASCADE,
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,

    -- Request metadata
    ip_address TEXT,
    user_agent TEXT,

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE public.download_history IS 'Report download history for tracking and limit enforcement';
COMMENT ON COLUMN public.download_history.user_id IS 'User who downloaded the report';
COMMENT ON COLUMN public.download_history.evaluation_id IS 'AI evaluation report that was downloaded';
COMMENT ON COLUMN public.download_history.payment_id IS 'Payment transaction associated with the download';
COMMENT ON COLUMN public.download_history.ip_address IS 'IP address of the download request';
COMMENT ON COLUMN public.download_history.user_agent IS 'User agent string of the download request';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_download_history_user_id
    ON public.download_history(user_id);

CREATE INDEX IF NOT EXISTS idx_download_history_evaluation_id
    ON public.download_history(evaluation_id);

CREATE INDEX IF NOT EXISTS idx_download_history_payment_id
    ON public.download_history(payment_id);

CREATE INDEX IF NOT EXISTS idx_download_history_created_at
    ON public.download_history(created_at DESC);

-- Composite index for download count queries
CREATE INDEX IF NOT EXISTS idx_download_history_user_eval
    ON public.download_history(user_id, evaluation_id);

-- RLS Policies
ALTER TABLE public.download_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own download history
CREATE POLICY IF NOT EXISTS select_own_download_history
    ON public.download_history FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own download history (handled by API)
CREATE POLICY IF NOT EXISTS insert_own_download_history
    ON public.download_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admin can view all download history
CREATE POLICY IF NOT EXISTS admin_view_all_download_history
    ON public.download_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ================================================
-- Optional: Add evaluator column to ai_evaluations if not exists
-- ================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'ai_evaluations'
        AND column_name = 'evaluator'
    ) THEN
        ALTER TABLE public.ai_evaluations
        ADD COLUMN evaluator TEXT CHECK (evaluator IN ('claude', 'chatgpt', 'gemini', 'grok', 'perplexity'));

        COMMENT ON COLUMN public.ai_evaluations.evaluator IS 'AI model used for evaluation';

        CREATE INDEX IF NOT EXISTS idx_ai_evaluations_evaluator
            ON public.ai_evaluations(evaluator);
    END IF;
END $$;

-- ================================================
-- Optional: Add report_url column to ai_evaluations if not exists
-- ================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'ai_evaluations'
        AND column_name = 'report_url'
    ) THEN
        ALTER TABLE public.ai_evaluations
        ADD COLUMN report_url TEXT;

        COMMENT ON COLUMN public.ai_evaluations.report_url IS 'URL to generated PDF report in Supabase Storage';
    END IF;
END $$;

-- ================================================
-- Optional: Update payments table for report purchases
-- ================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'payments'
        AND column_name = 'pg_transaction_id'
    ) THEN
        ALTER TABLE public.payments
        ADD COLUMN pg_transaction_id TEXT UNIQUE;

        COMMENT ON COLUMN public.payments.pg_transaction_id IS 'Payment Gateway transaction ID';

        CREATE INDEX IF NOT EXISTS idx_payments_pg_transaction_id
            ON public.payments(pg_transaction_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'payments'
        AND column_name = 'paid_at'
    ) THEN
        ALTER TABLE public.payments
        ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE;

        COMMENT ON COLUMN public.payments.paid_at IS 'Timestamp when payment was completed';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'payments'
        AND column_name = 'cancelled_at'
    ) THEN
        ALTER TABLE public.payments
        ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE;

        COMMENT ON COLUMN public.payments.cancelled_at IS 'Timestamp when payment was cancelled';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'payments'
        AND column_name = 'cancel_reason'
    ) THEN
        ALTER TABLE public.payments
        ADD COLUMN cancel_reason TEXT;

        COMMENT ON COLUMN public.payments.cancel_reason IS 'Reason for payment cancellation';
    END IF;
END $$;
