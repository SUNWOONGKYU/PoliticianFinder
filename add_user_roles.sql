-- Add role field to profiles table for member role management
-- Roles: member (일반 회원), admin (관리자), senior_committee (상임운영위원), committee (운영위원)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'member'
  CHECK (role IN ('member', 'admin', 'senior_committee', 'committee'));

-- Add index for role queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Update existing admin users (if is_admin = true)
UPDATE profiles
SET role = 'admin'
WHERE is_admin = true AND role = 'member';

-- Comment
COMMENT ON COLUMN profiles.role IS 'User role: member (일반회원), admin (관리자), senior_committee (상임운영위원), committee (운영위원)';

-- Verify
SELECT id, username, email, role, is_admin
FROM profiles
ORDER BY
  CASE role
    WHEN 'admin' THEN 1
    WHEN 'senior_committee' THEN 2
    WHEN 'committee' THEN 3
    WHEN 'member' THEN 4
  END
LIMIT 10;
