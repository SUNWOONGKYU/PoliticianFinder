-- P2E1 준비: ratings 테이블 RLS 정책 권장사항
-- 이 파일은 P2E1 작업 시 참고용 템플릿입니다.
-- 작성일: 2025-01-17
-- 작성자: AI-only

-- ============================================
-- RLS (Row Level Security) 활성화
-- ============================================

-- RLS 활성화 (P2E1에서 실행)
-- ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 권장 RLS 정책 템플릿
-- ============================================

-- 1. SELECT 정책: 모든 사용자가 모든 평가를 볼 수 있음
-- CREATE POLICY "ratings_select_all" ON ratings
-- FOR SELECT
-- USING (true);

-- 2. INSERT 정책: 인증된 사용자만 평가 작성 가능
-- CREATE POLICY "ratings_insert_authenticated" ON ratings
-- FOR INSERT
-- WITH CHECK (
--   auth.uid() IS NOT NULL
--   AND auth.uid() = user_id
-- );

-- 3. UPDATE 정책: 본인의 평가만 수정 가능
-- CREATE POLICY "ratings_update_own" ON ratings
-- FOR UPDATE
-- USING (auth.uid() = user_id)
-- WITH CHECK (
--   auth.uid() = user_id
--   AND politician_id = OLD.politician_id  -- 정치인 변경 불가
-- );

-- 4. DELETE 정책: 본인의 평가만 삭제 가능
-- CREATE POLICY "ratings_delete_own" ON ratings
-- FOR DELETE
-- USING (auth.uid() = user_id);

-- ============================================
-- 추가 보안 고려사항
-- ============================================

-- 5. 평가 스팸 방지를 위한 Rate Limiting (애플리케이션 레벨)
-- - 사용자당 시간당 평가 개수 제한
-- - 동일 IP에서 과도한 요청 차단

-- 6. 평가 수정 이력 추적 (감사 로그)
-- CREATE TABLE IF NOT EXISTS ratings_audit_log (
--   id BIGSERIAL PRIMARY KEY,
--   rating_id BIGINT NOT NULL,
--   user_id UUID NOT NULL,
--   action VARCHAR(10) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
--   old_data JSONB,
--   new_data JSONB,
--   changed_at TIMESTAMPTZ DEFAULT NOW(),
--   ip_address INET
-- );

-- 7. 악성 코멘트 필터링 (애플리케이션 레벨)
-- - 욕설/비방 필터
-- - 스팸 링크 차단
-- - HTML/Script 태그 제거

-- ============================================
-- RLS 정책 테스트 쿼리
-- ============================================

-- RLS 정책 확인
-- SELECT
--   schemaname,
--   tablename,
--   policyname,
--   permissive,
--   roles,
--   cmd,
--   qual,
--   with_check
-- FROM pg_policies
-- WHERE tablename = 'ratings';

-- 특정 사용자 컨텍스트에서 테스트
-- SET LOCAL role TO authenticated;
-- SET LOCAL "request.jwt.claim.sub" TO '550e8400-e29b-41d4-a716-446655440000';

-- SELECT 테스트: 모든 평가 조회 가능
-- SELECT * FROM ratings LIMIT 5;

-- INSERT 테스트: 본인 ID로만 작성 가능
-- INSERT INTO ratings (user_id, politician_id, score, comment)
-- VALUES ('550e8400-e29b-41d4-a716-446655440000', 1, 5, 'RLS 테스트');

-- UPDATE 테스트: 본인 평가만 수정 가능
-- UPDATE ratings SET score = 4 WHERE id = 1;

-- DELETE 테스트: 본인 평가만 삭제 가능
-- DELETE FROM ratings WHERE id = 1;

-- RESET ROLE;

-- ============================================
-- 성능 최적화 권장사항
-- ============================================

-- RLS 정책이 있는 경우 인덱스가 더욱 중요함
-- 다음 인덱스들이 RLS 성능에 도움이 됨:

-- 1. user_id 인덱스 (이미 생성됨)
-- CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);

-- 2. 복합 인덱스 for RLS filtering
-- CREATE INDEX IF NOT EXISTS idx_ratings_user_politician
-- ON ratings(user_id, politician_id);

-- 3. 부분 인덱스 for active users
-- CREATE INDEX IF NOT EXISTS idx_ratings_recent_users
-- ON ratings(user_id, created_at DESC)
-- WHERE created_at > NOW() - INTERVAL '30 days';

-- ============================================
-- 모니터링 쿼리
-- ============================================

-- RLS 정책별 실행 통계
-- SELECT
--   policyname,
--   n_tup_ins,
--   n_tup_upd,
--   n_tup_del
-- FROM pg_stat_user_tables t
-- JOIN pg_policies p ON t.tablename = p.tablename
-- WHERE t.tablename = 'ratings';

-- 사용자별 평가 활동 모니터링
-- SELECT
--   user_id,
--   COUNT(*) as total_ratings,
--   MAX(created_at) as last_rating,
--   AVG(score) as avg_given_score
-- FROM ratings
-- GROUP BY user_id
-- ORDER BY total_ratings DESC
-- LIMIT 10;

-- ============================================
-- P2E1 작업 체크리스트
-- ============================================

-- [ ] RLS 활성화
-- [ ] SELECT 정책 생성 (공개 읽기)
-- [ ] INSERT 정책 생성 (인증 사용자)
-- [ ] UPDATE 정책 생성 (본인 평가만)
-- [ ] DELETE 정책 생성 (본인 평가만)
-- [ ] 정책 테스트
-- [ ] 성능 테스트
-- [ ] 모니터링 설정

-- ============================================
-- 참고 문서
-- ============================================

-- Supabase RLS 문서:
-- https://supabase.com/docs/guides/auth/row-level-security

-- PostgreSQL RLS 문서:
-- https://www.postgresql.org/docs/current/ddl-rowsecurity.html

-- 이 스크립트는 P2E1 작업 시 참고용입니다.
-- 실제 RLS 정책은 P2E1에서 구현하세요.