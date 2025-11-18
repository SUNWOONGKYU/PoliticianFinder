-- ===========================
-- RLS 정책 수정 - 댓글과 알림이 보이도록
-- ===========================

-- 1. Comments 테이블 RLS 정책 수정
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Anyone can view approved comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

-- 새 정책 생성 - 모든 사람이 승인된 댓글 조회 가능
CREATE POLICY "Enable read access for approved comments"
ON comments FOR SELECT
USING (moderation_status = 'approved' AND is_deleted = false);

-- 인증된 사용자는 댓글 작성 가능
CREATE POLICY "Enable insert for authenticated users"
ON comments FOR INSERT
TO authenticated
WITH CHECK (true);

-- 사용자는 자신의 댓글 수정 가능
CREATE POLICY "Enable update for users based on user_id"
ON comments FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- 사용자는 자신의 댓글 삭제 가능
CREATE POLICY "Enable delete for users based on user_id"
ON comments FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 2. Notifications 테이블 RLS 정책 확인
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

-- RLS 활성화 확인
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 새 정책 생성 - 사용자는 자신의 알림만 조회
CREATE POLICY "Enable read access for own notifications"
ON notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 인증된 사용자는 알림 생성 가능 (시스템용)
CREATE POLICY "Enable insert for authenticated users"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 사용자는 자신의 알림 업데이트 가능 (읽음 처리)
CREATE POLICY "Enable update for own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- 사용자는 자신의 알림 삭제 가능
CREATE POLICY "Enable delete for own notifications"
ON notifications FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 3. Notices 테이블 RLS 정책
DROP POLICY IF EXISTS "Anyone can view notices" ON notices;

ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- 모든 사람이 공지사항 조회 가능
CREATE POLICY "Enable read access for all users"
ON notices FOR SELECT
USING (true);

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE 'RLS policies updated successfully!';
    RAISE NOTICE 'Comments: Anyone can view approved comments';
    RAISE NOTICE 'Notifications: Users can only see their own notifications';
    RAISE NOTICE 'Notices: Everyone can view notices';
END $$;
