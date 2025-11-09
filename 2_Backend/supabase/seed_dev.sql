-- P1D3: 시드 데이터
-- 작업일: 2025-11-02
-- 설명: 개발 환경에서 사용할 테스트 계정을 생성합니다.

-- 테스트 사용자 생성 (Supabase Auth)
-- 참고: Supabase 대시보드에서 직접 생성하거나, 클라이언트 코드에서 signUp을 통해 생성하는 것을 권장합니다.
-- 이 SQL은 예시이며, 실제 비밀번호는 노출되지 않도록 관리해야 합니다.
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_token, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_sent_at, confirmed_at)
VALUES
    (gen_random_uuid(), gen_random_uuid(), 'authenticated', 'authenticated', 'test@example.com', crypt('password123', gen_salt('bf')), NOW(), '', NULL, NULL, '{"provider":"email","providers":["email"]}', '{"nickname":"testuser"}', NOW(), NOW(), '', '', NULL, NOW());

-- profiles 테이블에 테스트 사용자 정보 추가
-- 참고: on_auth_user_created 트리거가 이 작업을 자동으로 처리해야 합니다.
-- 아래 코드는 트리거가 실패했을 경우를 대비한 수동 삽입 예시입니다.
-- INSERT INTO public.profiles (id, email, nickname, user_type)
-- VALUES ((SELECT id FROM auth.users WHERE email = 'test@example.com'), 'test@example.com', 'testuser', 'member');
