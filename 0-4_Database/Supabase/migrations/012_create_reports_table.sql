-- Task ID: P2D1
-- Migration: Create reports table
-- Description: User reports for inappropriate content

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'user', 'politician')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'hate_speech', 'misinformation', 'inappropriate', 'other')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected', 'resolved')),
  resolution TEXT,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_target_type ON reports(target_type);
CREATE INDEX idx_reports_target_id ON reports(target_id);
CREATE INDEX idx_reports_reason ON reports(reason);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_reports_pending ON reports(status, created_at DESC) WHERE status = 'pending';
CREATE INDEX idx_reports_target ON reports(target_type, target_id, status);

-- Comments for documentation
COMMENT ON TABLE reports IS 'User reports for inappropriate content';
COMMENT ON COLUMN reports.target_type IS 'Type of reported content: post, comment, user, politician';
COMMENT ON COLUMN reports.reason IS 'Reason for report: spam, harassment, hate_speech, misinformation, inappropriate, other';
COMMENT ON COLUMN reports.status IS 'Report status: pending, reviewing, accepted, rejected, resolved';
