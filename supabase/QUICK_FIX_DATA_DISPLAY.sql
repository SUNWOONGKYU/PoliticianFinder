-- ============================================
-- 🚀 빠른 수정: 데이터 표시 문제 해결
-- ============================================
-- 모의 데이터 삽입 후 데이터가 보이지 않을 때 실행

-- ============================================
-- 1단계: RLS 임시 비활성화 (테스트용)
-- ============================================
ALTER TABLE politicians DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE politician_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE connected_services DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 2단계: 권한 부여
-- ============================================
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 뷰 권한 부여
GRANT SELECT ON v_ai_ranking_top10 TO anon, authenticated;
GRANT SELECT ON v_hot_posts_top15 TO anon, authenticated;
GRANT SELECT ON v_politician_posts_recent9 TO anon, authenticated;
GRANT SELECT ON v_realtime_stats TO anon, authenticated;
GRANT SELECT ON v_recent_comments_widget TO anon, authenticated;

-- ============================================
-- 3단계: Composite Score 업데이트
-- ============================================
UPDATE politicians
SET composite_score = (
  SELECT ROUND(AVG(score)::numeric, 1)
  FROM ai_scores
  WHERE politician_id = politicians.id
)
WHERE EXISTS (
  SELECT 1 FROM ai_scores WHERE politician_id = politicians.id
);

-- ============================================
-- 4단계: HOT Score 업데이트
-- ============================================
SELECT update_all_hot_scores();

-- ============================================
-- 5단계: 확인
-- ============================================

-- 데이터 개수 확인
SELECT
  'politicians' as table_name,
  COUNT(*) as row_count
FROM politicians
UNION ALL
SELECT 'ai_scores', COUNT(*) FROM ai_scores
UNION ALL
SELECT 'posts', COUNT(*) FROM posts
UNION ALL
SELECT 'comments', COUNT(*) FROM comments
UNION ALL
SELECT 'politician_posts', COUNT(*) FROM politician_posts;

-- AI 랭킹 확인
SELECT id, name, composite_score, party, region
FROM v_ai_ranking_top10
LIMIT 5;

-- HOT 게시글 확인
SELECT id, title, hot_score, is_hot, view_count, upvotes
FROM v_hot_posts_top15
LIMIT 5;

-- 정치인 최근 글 확인
SELECT politician_name, platform, title
FROM v_politician_posts_recent9
LIMIT 5;

-- 실시간 통계 확인
SELECT * FROM v_realtime_stats;

-- ============================================
-- 완료!
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ 데이터 표시 문제 수정 완료!';
  RAISE NOTICE '이제 브라우저를 강력 새로고침(Ctrl+Shift+R) 하세요.';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  참고: RLS가 비활성화되었습니다 (테스트용)';
  RAISE NOTICE '프로덕션 배포 전에 RLS 정책을 다시 활성화해야 합니다.';
END $$;
