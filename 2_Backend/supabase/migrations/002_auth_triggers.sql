-- P1D2: 인증 관련 트리거
-- 작업일: 2025-11-02
-- 설명: 사용자 생성 및 프로필 업데이트 시 자동으로 호출되는 트리거를 정의합니다.

-- 1. profiles.updated_at 자동 갱신을 위한 함수
CREATE OR REPLACE FUNCTION public.handle_updated_at() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW; 
END;
$$ LANGUAGE plpgsql;

-- profiles 테이블에 updated_at 트리거 생성
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_updated_at();

-- 2. auth.users 생성 시 profiles 자동 생성을 위한 함수
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nickname)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'nickname');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users 테이블에 new_user 트리거 생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();
