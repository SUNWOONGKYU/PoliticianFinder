-- Migration 064: Fix Missing RLS Policies
-- 누락된 RLS 정책 추가
-- Created: 2025-12-15
-- Priority: CRITICAL (Production Security)

-- ============================================
-- 1. users 테이블 RLS 활성화
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 누구나 사용자 목록 조회 가능 (공개 프로필)
DROP POLICY IF EXISTS "users_select_public" ON users;
CREATE POLICY "users_select_public"
    ON users FOR SELECT
    USING (true);

-- 자기 자신의 정보만 수정 가능
DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own"
    ON users FOR UPDATE
    USING (auth.uid()::uuid = id)
    WITH CHECK (auth.uid()::uuid = id);

-- Admin만 사용자 생성 가능 (일반 회원가입은 auth.users 사용)
DROP POLICY IF EXISTS "users_insert_admin" ON users;
CREATE POLICY "users_insert_admin"
    ON users FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
        OR auth.uid()::uuid = id -- 자기 자신 생성 (회원가입 시)
    );

-- Admin만 사용자 삭제 가능
DROP POLICY IF EXISTS "users_delete_admin" ON users;
CREATE POLICY "users_delete_admin"
    ON users FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- 2. politician_details 테이블 RLS 활성화
-- ============================================
ALTER TABLE politician_details ENABLE ROW LEVEL SECURITY;

-- 누구나 정치인 상세정보 조회 가능 (공개 정보)
DROP POLICY IF EXISTS "politician_details_select_public" ON politician_details;
CREATE POLICY "politician_details_select_public"
    ON politician_details FOR SELECT
    USING (true);

-- Admin/Moderator만 생성/수정/삭제 가능
DROP POLICY IF EXISTS "politician_details_insert_moderator" ON politician_details;
CREATE POLICY "politician_details_insert_moderator"
    ON politician_details FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

DROP POLICY IF EXISTS "politician_details_update_moderator" ON politician_details;
CREATE POLICY "politician_details_update_moderator"
    ON politician_details FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

DROP POLICY IF EXISTS "politician_details_delete_admin" ON politician_details;
CREATE POLICY "politician_details_delete_admin"
    ON politician_details FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- service role이 rating 업데이트할 수 있도록 (트리거용)
-- 이건 service_role key로만 가능하므로 별도 정책 불필요
-- Supabase service role은 RLS를 bypass함

-- ============================================
-- 3. politician_comments 테이블 RLS 수정
--    기존: USING(true) - 너무 permissive
--    수정: service role 전용으로 제한
-- ============================================

-- 기존 permissive 정책 삭제
DROP POLICY IF EXISTS "politician_comments_insert_service" ON politician_comments;
DROP POLICY IF EXISTS "politician_comments_update_service" ON politician_comments;
DROP POLICY IF EXISTS "politician_comments_delete_service" ON politician_comments;

-- 읽기는 모든 사용자 허용 (유지)
-- "politician_comments_select_all" 정책은 유지

-- INSERT: 서비스 역할 전용 (anon key로는 불가)
-- Supabase service role이 RLS를 bypass하므로
-- anon/authenticated 사용자는 접근 불가
CREATE POLICY "politician_comments_insert_restricted"
    ON politician_comments FOR INSERT
    WITH CHECK (false); -- 일반 사용자는 INSERT 불가 (API에서 service role 사용)

-- UPDATE: 서비스 역할 전용
CREATE POLICY "politician_comments_update_restricted"
    ON politician_comments FOR UPDATE
    USING (false); -- 일반 사용자는 UPDATE 불가

-- DELETE: 서비스 역할 전용
CREATE POLICY "politician_comments_delete_restricted"
    ON politician_comments FOR DELETE
    USING (false); -- 일반 사용자는 DELETE 불가

-- ============================================
-- 4. 검증 쿼리
-- ============================================
-- 실행 후 확인:
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;

-- RLS가 활성화된 테이블 확인:
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public' AND rowsecurity = true;

-- ============================================
-- 5. 코멘트
-- ============================================
COMMENT ON POLICY "users_select_public" ON users IS '공개 프로필 조회 허용';
COMMENT ON POLICY "users_update_own" ON users IS '자기 자신의 정보만 수정 가능';
COMMENT ON POLICY "users_insert_admin" ON users IS 'Admin 또는 자기 자신 생성만 허용';
COMMENT ON POLICY "users_delete_admin" ON users IS 'Admin만 사용자 삭제 가능';

COMMENT ON POLICY "politician_details_select_public" ON politician_details IS '정치인 상세정보 공개 조회';
COMMENT ON POLICY "politician_details_insert_moderator" ON politician_details IS 'Admin/Moderator만 생성 가능';
COMMENT ON POLICY "politician_details_update_moderator" ON politician_details IS 'Admin/Moderator만 수정 가능';
COMMENT ON POLICY "politician_details_delete_admin" ON politician_details IS 'Admin만 삭제 가능';

COMMENT ON POLICY "politician_comments_insert_restricted" ON politician_comments IS 'Service role 전용 (API에서 admin client 사용)';
COMMENT ON POLICY "politician_comments_update_restricted" ON politician_comments IS 'Service role 전용';
COMMENT ON POLICY "politician_comments_delete_restricted" ON politician_comments IS 'Service role 전용';
