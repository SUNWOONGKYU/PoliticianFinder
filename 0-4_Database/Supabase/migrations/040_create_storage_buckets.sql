-- Task ID: P2D1
-- Migration: Create storage buckets
-- Description: Storage buckets for avatars, attachments, and politician images

-- Note: This migration uses Supabase storage functions
-- Make sure storage is enabled in your Supabase project

-- ============================================================================
-- Storage Buckets
-- ============================================================================

-- Create avatars bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

-- Create attachments bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attachments',
  'attachments',
  false,
  10485760, -- 10MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'application/pdf', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'];

-- Create politician-images bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'politician-images',
  'politician-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

-- Create advertisement-images bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'advertisement-images',
  'advertisement-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

-- ============================================================================
-- Storage Policies - Avatars
-- ============================================================================

-- Anyone can view avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- Storage Policies - Attachments
-- ============================================================================

-- Authenticated users can view their own attachments
CREATE POLICY "Users can view own attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Authenticated users can upload attachments
CREATE POLICY "Users can upload attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own attachments
CREATE POLICY "Users can delete own attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'attachments' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- Storage Policies - Politician Images
-- ============================================================================

-- Anyone can view politician images
CREATE POLICY "Politician images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'politician-images');

-- Admins can upload politician images
CREATE POLICY "Admins can upload politician images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'politician-images' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Admins can update politician images
CREATE POLICY "Admins can update politician images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'politician-images' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Admins can delete politician images
CREATE POLICY "Admins can delete politician images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'politician-images' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- ============================================================================
-- Storage Policies - Advertisement Images
-- ============================================================================

-- Anyone can view advertisement images
CREATE POLICY "Advertisement images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'advertisement-images');

-- Admins can upload advertisement images
CREATE POLICY "Admins can upload advertisement images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'advertisement-images' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update advertisement images
CREATE POLICY "Admins can update advertisement images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'advertisement-images' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete advertisement images
CREATE POLICY "Admins can delete advertisement images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'advertisement-images' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
