// ============================================================================
// 정치인 평가 FK 문제 해결 스크립트
// ============================================================================
// 문제: politician_ratings.user_id → auth.users(id) (존재하지 않음)
// 해결: Supabase SQL Editor에서 마이그레이션 실행 필요
// ============================================================================

console.log('═'.repeat(100));
console.log('정치인 평가 FK 문제 해결 가이드');
console.log('═'.repeat(100));
console.log();

console.log('🔴 문제점:');
console.log('   politician_ratings.user_id → auth.users(id) FK 제약 조건');
console.log('   하지만 우리는 public.users(user_id)를 사용함');
console.log();

console.log('✅ 해결 방법:');
console.log('   다음 SQL을 Supabase Dashboard > SQL Editor에서 실행하세요:');
console.log();
console.log('─'.repeat(100));
console.log();

const migrationSQL = `-- Fix politician_ratings foreign key constraint
-- Drop old FK
ALTER TABLE politician_ratings
DROP CONSTRAINT IF EXISTS politician_ratings_user_id_fkey;

-- Add new FK to public.users(user_id)
ALTER TABLE politician_ratings
ADD CONSTRAINT politician_ratings_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- Verify
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'politician_ratings'
  AND kcu.column_name = 'user_id';`;

console.log(migrationSQL);
console.log();
console.log('─'.repeat(100));
console.log();

console.log('📝 실행 단계:');
console.log('   1. https://supabase.com/dashboard 접속');
console.log('   2. Project 선택: ooddlafwdpzgxfefgsrx');
console.log('   3. SQL Editor 메뉴 클릭');
console.log('   4. 위의 SQL 복사 & 붙여넣기');
console.log('   5. Run 버튼 클릭');
console.log();

console.log('✅ 실행 후 검증:');
console.log('   마지막 SELECT 쿼리 결과가 다음과 같아야 합니다:');
console.log('   table_name          | column_name | foreign_table_name | foreign_column_name');
console.log('   politician_ratings  | user_id     | users              | user_id');
console.log();

console.log('═'.repeat(100));
console.log('마이그레이션 파일 위치:');
console.log('   0-4_Database/Supabase/migrations/040_fix_politician_ratings_fk.sql');
console.log('═'.repeat(100));
