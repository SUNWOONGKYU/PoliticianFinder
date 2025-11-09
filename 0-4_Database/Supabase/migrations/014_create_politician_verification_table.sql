-- Task ID: P2D1
-- Migration: Create politician_verification table
-- Description: Politician identity verification records

-- Politician verification table
CREATE TABLE IF NOT EXISTS politician_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id UUID NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  verification_method TEXT NOT NULL CHECK (verification_method IN ('email', 'document', 'phone', 'in_person', 'official_channel')),
  verification_token TEXT,
  token_expires_at TIMESTAMPTZ,
  submitted_documents TEXT[],
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_politician_verification_politician_id ON politician_verification(politician_id);
CREATE INDEX idx_politician_verification_user_id ON politician_verification(user_id);
CREATE INDEX idx_politician_verification_status ON politician_verification(status);
CREATE INDEX idx_politician_verification_created_at ON politician_verification(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE politician_verification IS 'Politician identity verification records';
COMMENT ON COLUMN politician_verification.verification_method IS 'Method of verification: email, document, phone, in_person, official_channel';
COMMENT ON COLUMN politician_verification.verification_token IS 'Unique token sent to politician for email verification';
COMMENT ON COLUMN politician_verification.submitted_documents IS 'URLs to uploaded verification documents';
