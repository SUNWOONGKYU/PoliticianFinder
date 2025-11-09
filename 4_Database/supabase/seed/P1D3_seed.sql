---
-- Project Grid Task ID: P1D3
-- 작업명: 시드 데이터
-- 생성시간: 2025-11-01
-- 생성자: Gemini
-- 의존성: P1D1
-- 설명: 개발 및 테스트 환경에서 사용할 초기 데이터를 생성합니다. 이 스크립트는 `supabase db reset` 실행 시 자동으로 실행됩니다.
---

-- 테스트 사용자 (Supabase Auth를 통해 미리 생성되었다고 가정)
-- 이메일: test@example.com
-- 비밀번호: password

-- ON CONFLICT DO NOTHING을 사용하여 스크립트를 여러 번 실행해도 오류가 발생하지 않도록 합니다.

INSERT INTO public.profiles (id, email, name, role)
VALUES
    ('8f5c9e6e-5912-4028-a449-23e3c9e43953', 'test@example.com', 'Test User', 'user'),
    ('a1b2c3d4-5678-4e32-a456-b1c2d3e4f5a6', 'admin@example.com', 'Admin User', 'admin')
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE public.profiles IS '사용자 프로필 정보. P1D3에 의해 테스트 데이터가 추가되었습니다.';
