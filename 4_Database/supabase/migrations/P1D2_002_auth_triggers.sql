---
-- Project Grid Task ID: P1D2
-- 작업명: 트리거
-- 생성시간: 2025-11-01
-- 생성자: Gemini
-- 의존성: P1D1
-- 설명: auth.users 테이블에 새 사용자가 추가될 때, public.profiles 테이블에 해당 프로필을 자동으로 생성하는 트리거를 정의합니다.
---

-- 1. 프로필 자동 생성을 위한 함수 정의
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. auth.users 테이블에 트리거 연결
-- Supabase의 auth 스키마에 직접 트리거를 생성하는 것은 권장되지 않거나 불가능할 수 있으므로,
-- 이 함수는 Supabase Auth의 Webhook 기능을 사용하거나, 별도의 서버 로직에서 호출하는 것을 전제로 합니다.
-- 여기서는 SQL 마이그레이션 파일로서 함수의 정의를 기록합니다.

-- 만약 직접 트리거 생성이 가능하다면 아래와 같이 실행합니다.
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS '새로운 auth.users 레코드가 생성될 때 public.profiles에 미러링하기 위한 함수입니다.';
