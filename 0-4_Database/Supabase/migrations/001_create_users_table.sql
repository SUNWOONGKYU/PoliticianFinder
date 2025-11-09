-- Task ID: P2D1
-- Migration: Create users table
-- Description: User accounts and profiles

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  bio TEXT,
  location TEXT,
  is_banned BOOLEAN DEFAULT FALSE,
  banned_at TIMESTAMPTZ,
  banned_reason TEXT,
  banned_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_points ON users(points DESC);
CREATE INDEX idx_users_level ON users(level DESC);
CREATE INDEX idx_users_is_banned ON users(is_banned);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts and profiles';
COMMENT ON COLUMN users.role IS 'User role: user, admin, moderator';
COMMENT ON COLUMN users.points IS 'Activity points earned by user';
COMMENT ON COLUMN users.level IS 'User level based on points';
COMMENT ON COLUMN users.is_banned IS 'Whether user is banned from the platform';
