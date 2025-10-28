# P2D1 마이그레이션 가이드

## 개요
이 문서는 P2D1 작업 (정치인 테이블에 평가 통계 필드 추가) 마이그레이션을 실행하는 방법을 설명합니다.

## 파일 구조
```
supabase/migrations/
├── 20251017002426_add_rating_fields_to_politicians.sql     # 메인 마이그레이션
├── 20251017002426_rollback_add_rating_fields.sql           # 롤백 스크립트
├── 20251017002426_verify_rating_fields.sql                 # 검증 쿼리
├── 20251017002426_performance_test_rating_fields.sql       # 성능 테스트
└── P2D1_MIGRATION_GUIDE.md                                 # 본 문서
```

## 마이그레이션 실행 단계

### 1. 사전 준비
```bash
# Supabase 프로젝트 상태 확인
supabase status

# 현재 마이그레이션 상태 확인
supabase migration list

# 데이터베이스 백업 (권장)
pg_dump -h [HOST] -U [USER] -d [DATABASE] > backup_before_p2d1.sql
```

### 2. 마이그레이션 적용

#### 옵션 A: Supabase CLI 사용 (권장)
```bash
# 로컬 개발 환경
supabase db reset  # 주의: 모든 데이터가 초기화됩니다

# 또는 특정 마이그레이션만 적용
supabase migration up

# 프로덕션 환경
supabase db push
```

#### 옵션 B: SQL 직접 실행
```sql
-- Supabase Dashboard SQL Editor 또는 psql에서 실행
-- 1. 메인 마이그레이션 실행
\i 20251017002426_add_rating_fields_to_politicians.sql

-- 2. 검증 쿼리 실행
\i 20251017002426_verify_rating_fields.sql
```

### 3. 마이그레이션 검증

```sql
-- 기본 검증
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'politicians'
AND column_name IN ('avg_rating', 'total_ratings');

-- 제약조건 검증
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%rating%';

-- 인덱스 검증
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'politicians'
AND indexname LIKE '%rating%';
```

### 4. 성능 테스트 (선택사항)
```sql
-- 성능 테스트 스크립트 실행
\i 20251017002426_performance_test_rating_fields.sql
```

## 롤백 절차

마이그레이션에 문제가 발생한 경우:

```sql
-- 롤백 스크립트 실행
\i 20251017002426_rollback_add_rating_fields.sql

-- 롤백 확인
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'politicians'
AND column_name IN ('avg_rating', 'total_ratings');
-- 결과가 없어야 정상
```

## 변경 사항 요약

### 추가된 컬럼
| 컬럼명 | 타입 | 기본값 | 설명 |
|--------|------|--------|------|
| avg_rating | DECIMAL(2,1) | 0.0 | 평균 평점 (0.0-5.0) |
| total_ratings | INTEGER | 0 | 총 평가 개수 |

### 추가된 제약조건
- `check_avg_rating_range`: avg_rating이 0.0-5.0 범위 내에 있어야 함
- `check_total_ratings_positive`: total_ratings가 0 이상이어야 함

### 추가된 인덱스
- `idx_politicians_avg_rating`: 평점 기준 정렬 최적화
- `idx_politicians_party_rating`: 정당별 평점 필터링 최적화
- `idx_politicians_region_rating`: 지역별 평점 필터링 최적화

## TypeScript 타입 업데이트

frontend/src/types/database.ts 파일이 이미 업데이트되었습니다:

```typescript
export interface Politician {
  // ... 기존 필드
  avg_rating: number           // 평균 평점 (0.0 - 5.0)
  total_ratings: number        // 평가 개수
  // ...
}
```

## 주의사항

1. **데이터 무결성**: 기존 레코드는 기본값(avg_rating=0.0, total_ratings=0)으로 설정됩니다.
2. **인덱스 성능**: Partial 인덱스를 사용하여 avg_rating > 0인 레코드만 인덱싱합니다.
3. **제약조건**: 평점 범위와 평가 개수 제약조건이 엄격하게 적용됩니다.
4. **캐시**: 마이그레이션 후 캐시 무효화가 필요할 수 있습니다.

## 문제 해결

### 제약조건 위반 오류
```sql
-- 문제가 되는 데이터 찾기
SELECT id, name, avg_rating, total_ratings
FROM politicians
WHERE avg_rating < 0 OR avg_rating > 5.0
   OR total_ratings < 0;

-- 데이터 수정
UPDATE politicians
SET avg_rating = 0.0
WHERE avg_rating < 0 OR avg_rating > 5.0;

UPDATE politicians
SET total_ratings = 0
WHERE total_ratings < 0;
```

### 인덱스 생성 실패
```sql
-- 기존 인덱스 확인 및 제거
DROP INDEX IF EXISTS idx_politicians_avg_rating;
DROP INDEX IF EXISTS idx_politicians_party_rating;
DROP INDEX IF EXISTS idx_politicians_region_rating;

-- 다시 생성
-- (마이그레이션 스크립트 재실행)
```

## 다음 단계

P2D1 마이그레이션 완료 후:
1. P2D2: ratings 테이블 생성
2. P2B2: 시민 평가 API 구현
3. P2B3: 평가 집계 로직 구현

## 연락처

문제 발생 시 프로젝트 관리자에게 문의하세요.

---

작성일: 2025-01-17
작성자: fullstack-developer AI
버전: 1.0.0