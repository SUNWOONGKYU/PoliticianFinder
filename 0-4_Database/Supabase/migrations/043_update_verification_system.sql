-- Task ID: P4BA18
-- Migration: Update politician verification system
-- Description: Enhance verification system with email verification support

-- Note: politician_verification table already exists from migration 014
-- This migration adds missing features and updates schema

-- 1. Check if verification_token column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'politician_verification'
    AND column_name = 'verification_token'
  ) THEN
    ALTER TABLE politician_verification
    ADD COLUMN verification_token TEXT;
  END IF;
END $$;

-- 2. Check if token_expires_at column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'politician_verification'
    AND column_name = 'token_expires_at'
  ) THEN
    ALTER TABLE politician_verification
    ADD COLUMN token_expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- 3. Ensure politicians table has all verification columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'politicians'
    AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE politicians
    ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'politicians'
    AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE politicians
    ADD COLUMN verified_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'politicians'
    AND column_name = 'verified_by'
  ) THEN
    ALTER TABLE politicians
    ADD COLUMN verified_by UUID REFERENCES users(id);
  END IF;
END $$;

-- 4. Add index on verification_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_politician_verification_token
ON politician_verification(verification_token);

-- 5. Add index on token_expires_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_politician_verification_expires
ON politician_verification(token_expires_at);

-- 6. Update RLS policies for politician_verification table
ALTER TABLE politician_verification ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own verification requests" ON politician_verification;
DROP POLICY IF EXISTS "Users can create verification requests" ON politician_verification;

-- Create updated RLS policies
CREATE POLICY "Users can view their own verification requests"
  ON politician_verification FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create verification requests"
  ON politician_verification FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending requests"
  ON politician_verification FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

-- 7. Add helpful comments
COMMENT ON COLUMN politician_verification.verification_token IS 'Email verification code (6-digit alphanumeric)';
COMMENT ON COLUMN politician_verification.token_expires_at IS 'Verification code expiration time (15 minutes from creation)';
COMMENT ON COLUMN politicians.is_verified IS 'Whether politician has been verified (identity confirmed)';
COMMENT ON COLUMN politicians.verified_at IS 'Timestamp when politician was verified';
COMMENT ON COLUMN politicians.verified_by IS 'User ID who verified the politician';

-- 8. Create function to clean up expired verification codes (optional, for cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM politician_verification
  WHERE status = 'pending'
    AND token_expires_at < NOW() - INTERVAL '7 days';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_expired_verification_codes() IS 'Cleanup expired verification codes older than 7 days';
