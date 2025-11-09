-- P1D2: Initial Data Seeding
-- 작업일: 2025-11-03
-- 설명: 개발 및 테스트용 Mock 데이터 생성

-- Note: This file is for development only
-- DO NOT use in production environments
-- Use proper secrets management for real data

-- ============================================================
-- 1. Sample Profiles (for testing)
-- ============================================================

-- Sample Profile 1
INSERT INTO public.profiles (
  user_id,
  email,
  nickname,
  full_name,
  influence_grade,
  score,
  is_verified
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'user1@example.com',
  '김민준',
  'Kim Min-jun',
  '군주',
  95.5,
  true
)
ON CONFLICT (email) DO NOTHING;

-- Sample Profile 2
INSERT INTO public.profiles (
  user_id,
  email,
  nickname,
  full_name,
  influence_grade,
  score,
  is_verified
) VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'user2@example.com',
  '이순신',
  'Lee Soon-shin',
  '공작',
  88.0,
  true
)
ON CONFLICT (email) DO NOTHING;

-- Sample Profile 3
INSERT INTO public.profiles (
  user_id,
  email,
  nickname,
  full_name,
  influence_grade,
  score,
  is_verified
) VALUES (
  'a0000000-0000-0000-0000-000000000003',
  'user3@example.com',
  '박유현',
  'Park Yu-hyun',
  '영주',
  75.3,
  true
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- 2. Sample Auth Tokens (for testing)
-- ============================================================

-- Note: In production, never store tokens like this
-- Tokens should be generated securely during authentication

-- ============================================================
-- 3. Cleanup Old Test Data (optional)
-- ============================================================

-- This section is commented out to prevent accidental deletion
-- Uncomment only when explicitly needed for development cleanup

/*
DELETE FROM public.auth_tokens WHERE created_at < NOW() - INTERVAL '30 days';
DELETE FROM public.email_verifications WHERE expires_at < NOW();
DELETE FROM public.password_resets WHERE expires_at < NOW();
*/

-- ============================================================
-- 4. Verification
-- ============================================================

-- Count inserted profiles
SELECT COUNT(*) as total_profiles FROM public.profiles;
SELECT COUNT(*) as total_auth_tokens FROM public.auth_tokens;
