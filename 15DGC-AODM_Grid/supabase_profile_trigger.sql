-- 프로필 자동 생성 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'username', 'User'),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 트리거 제거 (있을 경우)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 트리거 생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 권한 설정 확인
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;

-- profiles 테이블 RLS 정책 확인 (참고용)
-- 이미 설정되어 있을 것으로 예상되지만, 확인이 필요한 경우 아래 쿼리로 확인
/*
SELECT * FROM pg_policies WHERE tablename = 'profiles';
*/

-- 테스트용 쿼리 (선택사항)
-- 트리거가 정상 작동하는지 확인하려면 Supabase Dashboard에서 테스트 계정을 생성해보세요