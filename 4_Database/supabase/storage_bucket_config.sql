-- P2D5: Supabase Storage Bucket Configuration
-- Storage 버킷 생성 및 RLS 정책 설정

-- 1. politicians-images 버킷 생성
-- (Supabase 콘솔에서 수동 생성 또는 CLI 사용)
-- Command: supabase storage create-bucket politicians-images --public

-- 2. Storage RLS 정책 설정 SQL
-- Storage bucket RLS policies

-- 정치인 이미지 업로드/조회 정책
-- 모든 사용자가 정치인 이미지 조회 가능
CREATE POLICY "Allow public read access to politician images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'politicians-images'
  );

-- 인증된 사용자만 이미지 업로드 가능
CREATE POLICY "Allow authenticated users to upload politician images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'politicians-images' AND 
    auth.role() = 'authenticated'
  );

-- 업로드한 사용자와 관리자만 이미지 수정/삭제 가능
CREATE POLICY "Allow users to update their own images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'politicians-images' AND 
    auth.uid() = owner
  );

CREATE POLICY "Allow users to delete their own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'politicians-images' AND 
    auth.uid() = owner
  );

-- 3. 추가 Storage 버킷 설정 주석
/*
-- profile-documents 버킷 (개인 문서 저장)
supabase storage create-bucket profile-documents --private

-- politician-reports 버킷 (평가 보고서)
supabase storage create-bucket politician-reports --public

-- 버킷 삭제
supabase storage delete-bucket politicians-images

-- 버킷 나열
supabase storage list-buckets
*/
