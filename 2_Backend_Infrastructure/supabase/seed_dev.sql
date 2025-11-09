-- P1D3: 개발 환경 시드 데이터
-- 작업일: 2025-10-31
-- 설명: PoliticianFinder 테스트를 위한 시드 데이터
-- 용도: 로컬 개발 및 E2E 테스트용

-- ⚠️ 주의: 이 파일은 개발 환경 전용입니다. 프로덕션 환경에서는 사용하지 마세요!

-- ============================================================================
-- 1. 기존 테스트 데이터 정리
-- ============================================================================
-- 개발 환경을 깨끗하게 시작하기 위해 기존 테스트 데이터 삭제

-- 순서 중요: 외래 키 제약으로 인해 자식 테이블부터 삭제
DELETE FROM public.password_resets WHERE email LIKE '%@test.com';
DELETE FROM public.email_verifications WHERE email LIKE '%@test.com';
DELETE FROM public.auth_tokens WHERE user_id IN (
  SELECT id FROM auth.users WHERE email LIKE '%@test.com'
);
DELETE FROM public.profiles WHERE email LIKE '%@test.com';
-- auth.users는 트리거로 profiles도 자동 삭제되므로 마지막에 삭제
DELETE FROM auth.users WHERE email LIKE '%@test.com';


-- ============================================================================
-- 2. 테스트 사용자 계정 생성 (auth.users)
-- ============================================================================
-- Supabase Auth 사용자 생성
-- 비밀번호는 모두 'TestPass123!' (개발 환경 전용)

-- 2-1. 일반 회원 (member) 계정
INSERT INTO auth.users (
  id,
  email,
  encrypted_password, -- 실제로는 Supabase Auth API를 통해 생성해야 함
  email_confirmed_at,
  raw_user_meta_data,
  raw_app_meta_data,
  created_at,
  updated_at,
  last_sign_in_at,
  confirmation_token,
  recovery_token
)
VALUES
  -- 일반 회원 1 (이메일 인증 완료)
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    'member1@test.com',
    crypt('TestPass123!', gen_salt('bf')), -- bcrypt 해시
    NOW(),
    jsonb_build_object(
      'nickname', '테스트회원1',
      'full_name', '홍길동',
      'marketing_agreed', true
    ),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '1 day',
    NULL,
    NULL
  ),

  -- 일반 회원 2 (이메일 인증 미완료)
  (
    '22222222-2222-2222-2222-222222222222'::uuid,
    'member2@test.com',
    crypt('TestPass123!', gen_salt('bf')),
    NULL, -- 이메일 인증 안 함
    jsonb_build_object(
      'nickname', '테스트회원2',
      'full_name', '김영희',
      'marketing_agreed', false
    ),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days',
    NULL,
    encode(gen_random_bytes(32), 'base64'),
    NULL
  ),

  -- 일반 회원 3 (구글 OAuth)
  (
    '33333333-3333-3333-3333-333333333333'::uuid,
    'member.google@test.com',
    crypt('TestPass123!', gen_salt('bf')),
    NOW(),
    jsonb_build_object(
      'nickname', '구글회원',
      'full_name', '박철수',
      'marketing_agreed', true,
      'avatar_url', 'https://lh3.googleusercontent.com/a/default-user'
    ),
    jsonb_build_object(
      'provider', 'google',
      'providers', ARRAY['google'],
      'provider_id', '112233445566778899000'
    ),
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '2 hours',
    NULL,
    NULL
  );


-- 2-2. 정치인 (politician) 계정
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  raw_app_meta_data,
  created_at,
  updated_at,
  last_sign_in_at,
  confirmation_token,
  recovery_token
)
VALUES
  -- 정치인 1
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'politician1@test.com',
    crypt('TestPass123!', gen_salt('bf')),
    NOW(),
    jsonb_build_object(
      'nickname', '국회의원김',
      'full_name', '김국회',
      'marketing_agreed', true
    ),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '5 hours',
    NULL,
    NULL
  ),

  -- 정치인 2
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
    'politician2@test.com',
    crypt('TestPass123!', gen_salt('bf')),
    NOW(),
    jsonb_build_object(
      'nickname', '시의원이',
      'full_name', '이시의',
      'marketing_agreed', false
    ),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '1 day',
    NULL,
    NULL
  );


-- 2-3. 관리자 (admin) 계정
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  raw_app_meta_data,
  created_at,
  updated_at,
  last_sign_in_at,
  confirmation_token,
  recovery_token
)
VALUES
  -- 관리자 계정
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid,
    'admin@test.com',
    crypt('TestPass123!', gen_salt('bf')),
    NOW(),
    jsonb_build_object(
      'nickname', '관리자',
      'full_name', '최관리',
      'marketing_agreed', true
    ),
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '30 minutes',
    NULL,
    NULL
  );


-- ============================================================================
-- 3. 프로필 데이터 생성 (public.profiles)
-- ============================================================================
-- 트리거가 자동으로 생성하지만, 추가 정보를 수동으로 업데이트

-- 3-1. 일반 회원 프로필 업데이트
UPDATE public.profiles
SET
  user_type = 'member',
  bio = '테스트용 일반 회원입니다. E2E 테스트에 사용됩니다.',
  notification_enabled = TRUE,
  is_active = TRUE
WHERE id = '11111111-1111-1111-1111-111111111111'::uuid;

UPDATE public.profiles
SET
  user_type = 'member',
  bio = '이메일 인증이 필요한 테스트 계정입니다.',
  email_verified = FALSE,
  notification_enabled = TRUE,
  is_active = TRUE
WHERE id = '22222222-2222-2222-2222-222222222222'::uuid;

UPDATE public.profiles
SET
  user_type = 'member',
  bio = '구글 OAuth로 가입한 테스트 회원입니다.',
  avatar_url = 'https://lh3.googleusercontent.com/a/default-user',
  oauth_provider = 'google',
  oauth_id = '112233445566778899000',
  notification_enabled = TRUE,
  is_active = TRUE
WHERE id = '33333333-3333-3333-3333-333333333333'::uuid;


-- 3-2. 정치인 프로필 업데이트
UPDATE public.profiles
SET
  user_type = 'politician',
  bio = '20대 국회의원입니다. AI 정치인 평가 시스템 테스트 계정입니다.',
  notification_enabled = TRUE,
  is_active = TRUE
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid;

UPDATE public.profiles
SET
  user_type = 'politician',
  bio = '서울시 의회 의원입니다. 테스트 목적으로 생성된 계정입니다.',
  notification_enabled = FALSE,
  is_active = TRUE
WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid;


-- 3-3. 관리자 프로필 업데이트
UPDATE public.profiles
SET
  user_type = 'admin',
  bio = 'PoliticianFinder 시스템 관리자입니다.',
  notification_enabled = TRUE,
  is_active = TRUE
WHERE id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid;


-- ============================================================================
-- 4. 테스트용 토큰 데이터 (public.auth_tokens)
-- ============================================================================
-- E2E 테스트 시 로그인 상태 테스트용

INSERT INTO public.auth_tokens (
  id,
  user_id,
  token_type,
  token_hash,
  expires_at,
  is_revoked,
  device_info,
  last_used_at,
  created_at
)
VALUES
  -- member1의 Access Token (유효)
  (
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111'::uuid,
    'access',
    encode(sha256('test_access_token_member1'::bytea), 'hex'),
    NOW() + INTERVAL '1 hour',
    FALSE,
    jsonb_build_object(
      'user_agent', 'Mozilla/5.0 (Test Browser)',
      'ip', '127.0.0.1'
    ),
    NOW(),
    NOW()
  ),

  -- member1의 Refresh Token (유효)
  (
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111'::uuid,
    'refresh',
    encode(sha256('test_refresh_token_member1'::bytea), 'hex'),
    NOW() + INTERVAL '7 days',
    FALSE,
    jsonb_build_object(
      'user_agent', 'Mozilla/5.0 (Test Browser)',
      'ip', '127.0.0.1'
    ),
    NOW(),
    NOW()
  ),

  -- politician1의 Access Token (만료됨)
  (
    gen_random_uuid(),
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'access',
    encode(sha256('test_access_token_politician1_expired'::bytea), 'hex'),
    NOW() - INTERVAL '1 hour',
    FALSE,
    jsonb_build_object(
      'user_agent', 'Mozilla/5.0 (Test Browser)',
      'ip', '192.168.1.100'
    ),
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '2 hours'
  ),

  -- admin의 Access Token (폐기됨)
  (
    gen_random_uuid(),
    'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid,
    'access',
    encode(sha256('test_access_token_admin_revoked'::bytea), 'hex'),
    NOW() + INTERVAL '1 hour',
    TRUE,
    jsonb_build_object(
      'user_agent', 'Mozilla/5.0 (Test Browser)',
      'ip', '10.0.0.1'
    ),
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '2 days'
  );


-- ============================================================================
-- 5. 테스트용 이메일 인증 데이터 (public.email_verifications)
-- ============================================================================
-- member2의 미완료 이메일 인증

INSERT INTO public.email_verifications (
  id,
  user_id,
  email,
  verification_token,
  verification_code,
  is_verified,
  verified_at,
  expires_at,
  resend_count,
  last_resend_at,
  created_at
)
VALUES
  -- member2의 이메일 인증 (미완료)
  (
    gen_random_uuid(),
    '22222222-2222-2222-2222-222222222222'::uuid,
    'member2@test.com',
    encode(gen_random_bytes(32), 'base64'),
    '123456', -- 6자리 코드
    FALSE,
    NULL,
    NOW() + INTERVAL '12 hours',
    1,
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '3 days'
  ),

  -- member1의 이메일 인증 (완료됨 - 과거 기록)
  (
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111'::uuid,
    'member1@test.com',
    encode(gen_random_bytes(32), 'base64'),
    '654321',
    TRUE,
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days' + INTERVAL '24 hours',
    0,
    NULL,
    NOW() - INTERVAL '7 days'
  );


-- ============================================================================
-- 6. 테스트용 비밀번호 재설정 데이터 (public.password_resets)
-- ============================================================================
-- 비밀번호 찾기 기능 테스트용

INSERT INTO public.password_resets (
  id,
  user_id,
  email,
  reset_token,
  reset_code,
  is_used,
  used_at,
  expires_at,
  request_ip,
  request_user_agent,
  created_at
)
VALUES
  -- member1의 비밀번호 재설정 요청 (미사용)
  (
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111'::uuid,
    'member1@test.com',
    encode(gen_random_bytes(32), 'base64'),
    '789012',
    FALSE,
    NULL,
    NOW() + INTERVAL '30 minutes',
    '127.0.0.1',
    'Mozilla/5.0 (Test Browser)',
    NOW()
  ),

  -- politician1의 비밀번호 재설정 요청 (사용 완료)
  (
    gen_random_uuid(),
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'politician1@test.com',
    encode(gen_random_bytes(32), 'base64'),
    '345678',
    TRUE,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day' + INTERVAL '1 hour',
    '192.168.1.100',
    'Mozilla/5.0 (Test Browser)',
    NOW() - INTERVAL '2 days'
  ),

  -- member2의 비밀번호 재설정 요청 (만료됨)
  (
    gen_random_uuid(),
    '22222222-2222-2222-2222-222222222222'::uuid,
    'member2@test.com',
    encode(gen_random_bytes(32), 'base64'),
    '901234',
    FALSE,
    NULL,
    NOW() - INTERVAL '2 hours',
    '127.0.0.1',
    'Mozilla/5.0 (Test Browser)',
    NOW() - INTERVAL '3 hours'
  );


-- ============================================================================
-- 완료
-- ============================================================================
-- P1D3: 시드 데이터 생성 완료
--
-- 생성된 테스트 계정:
--   - member1@test.com (일반 회원, 이메일 인증 완료, 토큰 유효)
--   - member2@test.com (일반 회원, 이메일 인증 미완료)
--   - member.google@test.com (구글 OAuth 회원)
--   - politician1@test.com (정치인)
--   - politician2@test.com (정치인)
--   - admin@test.com (관리자)
--
-- 모든 계정 비밀번호: TestPass123!
--
-- 테스트 시나리오:
--   - E2E 테스트: member1@test.com으로 로그인
--   - 이메일 인증 테스트: member2@test.com 사용
--   - OAuth 테스트: member.google@test.com 사용
--   - 권한 테스트: politician1, admin 계정 사용
--   - 토큰 만료 테스트: politician1의 만료된 토큰 사용
--   - 토큰 폐기 테스트: admin의 폐기된 토큰 사용
