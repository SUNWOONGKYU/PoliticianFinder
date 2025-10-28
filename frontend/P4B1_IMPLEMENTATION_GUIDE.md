# P4B1 Query Optimization Implementation Guide

## 작업 개요
Supabase 쿼리 최적화를 통해 API 응답 시간을 40-60% 단축하고, N+1 쿼리 문제를 해결합니다.

## 우선순위별 구현 계획

### 🔴 Priority 1: Critical Issues (즉시 구현 필요)

#### 1.1 Comments API N+1 Query Fix
**파일**: `src/app/api/comments/route.ts`  
**문제**: for loop 안에서 대댓글 조회 → 20개 댓글 시 21번의 쿼리 발생  
**영향도**: 매우 높음 (300-500ms → 50-80ms, 80% 개선)

**구현 방법**:
1. `P4B1_COMMENTS_OPTIMIZED_SNIPPET.ts` 파일 참고
2. GET 함수의 대댓글 로드 로직 교체
3. 배치 쿼리로 변경 (1번의 쿼리로 모든 대댓글 조회)

**테스트**:
```bash
# 댓글 20개 조회 시 쿼리 수 확인
# BEFORE: 21 queries
# AFTER: 2-3 queries
curl "http://localhost:3000/api/comments?politician_id=1&limit=20"
```

### 🟡 Priority 2: Performance Improvements (이번 주 내 구현)

#### 2.1 Politicians List Query Optimization
**파일**: `src/app/api/politicians/route.ts`  
**개선사항**: SELECT * 제거, 필수 필드만 조회  
**영향도**: 중간 (50-80ms → 20-35ms, 50% 개선)

**변경사항**:
```typescript
// 55번째 줄 근처 수정
.select('id, name, party, district, position, profile_image_url, avg_rating, total_ratings, created_at', 
  { count: 'exact' })
```

#### 2.2 Politician Detail Query Optimization
**파일**: `src/app/api/politicians/[id]/route.ts`  
**개선사항**: 필수 필드만 조회, 캐싱 시간 증가  
**영향도**: 중간 (120-180ms → 60-90ms, 50% 개선)

**변경사항**:
```typescript
// 50번째 줄 근처 - SELECT 필드 명시
.select(`
  id, name, party, district, position,
  profile_image_url, biography, official_website,
  avg_rating, total_ratings, created_at, updated_at,
  ai_scores!left (ai_name, score, updated_at)
`)

// 125번째 줄 근처 - 캐싱 개선
headers: {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
}
```

#### 2.3 Ratings Stats Optimization
**파일**: `src/app/api/ratings/stats/route.ts`  
**개선사항**: SELECT 필드 최소화, 캐싱 추가  
**영향도**: 낮음-중간 (80-120ms → 50-80ms, 40% 개선)

**변경사항**:
```typescript
// 48번째 줄 - 이미 최적화됨
.select('score, category')  // 필요한 필드만

// 추가: 캐싱 헤더 (응답 부분에 추가)
headers: {
  'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600'
}
```

### 🟢 Priority 3: Additional Optimizations (다음 주)

#### 3.1 Database Indexes (P4B2와 연계)
다음 인덱스 생성 권장:
```sql
-- 검색 성능 향상
CREATE INDEX idx_politicians_name ON politicians(name);
CREATE INDEX idx_politicians_party_rating ON politicians(party, avg_rating DESC);

-- 댓글 조회 성능
CREATE INDEX idx_comments_politician_parent ON comments(politician_id, parent_id, created_at DESC);

-- 평가 통계
CREATE INDEX idx_ratings_politician_score ON ratings(politician_id, score);

-- 알림 조회
CREATE INDEX idx_notifications_user_status ON notifications(user_id, status, created_at DESC);
```

#### 3.2 Full-Text Search
PostgreSQL의 tsvector를 활용한 한글 검색 최적화:
```sql
ALTER TABLE politicians ADD COLUMN name_tsv tsvector;
CREATE INDEX idx_politicians_name_tsv ON politicians USING gin(name_tsv);
```

#### 3.3 Redis Caching (선택사항)
자주 조회되는 데이터 캐싱:
- 정치인 목록 (필터 조합별)
- 평가 통계
- 자동완성 결과

## 구현 단계별 가이드

### Step 1: 백업 및 준비
```bash
cd /g/내\ 드라이브/Developement/PoliticianFinder/frontend

# 변경할 파일 백업
cp src/app/api/comments/route.ts src/app/api/comments/route.ts.backup
cp src/app/api/politicians/route.ts src/app/api/politicians/route.ts.backup
cp src/app/api/politicians/[id]/route.ts src/app/api/politicians/[id]/route.ts.backup
```

### Step 2: Comments API 최적화 (Critical)
1. `P4B1_COMMENTS_OPTIMIZED_SNIPPET.ts` 참고
2. GET 함수의 95-135번째 줄 교체
3. 로컬에서 테스트
4. 성능 로그 확인

### Step 3: Politicians API 최적화
1. `P4B1_OPTIMIZATION_SNIPPETS.md` 참고
2. SELECT 문 수정
3. 캐싱 헤더 추가

### Step 4: 테스트 및 검증
```bash
# 로컬 서버 시작
npm run dev

# API 테스트
curl "http://localhost:3000/api/comments?politician_id=1&limit=20"
curl "http://localhost:3000/api/politicians?page=1&limit=10"
curl "http://localhost:3000/api/politicians/1"

# 응답 시간 확인 (X-Query-Time 헤더)
curl -I "http://localhost:3000/api/comments?politician_id=1"
```

### Step 5: 모니터링 설정
콘솔 로그에서 성능 메트릭 확인:
```
[P4B1 OPTIMIZED] Comments query completed in 45ms for 20 comments
```

## 예상 성능 개선 요약

| API Endpoint | Before | After | Improvement |
|-------------|--------|-------|-------------|
| Politicians List | 50-80ms | 20-35ms | ~50% |
| Politician Detail | 120-180ms | 60-90ms | ~50% |
| Comments (20개) | 300-500ms | 50-80ms | ~80% |
| Ratings Stats | 80-120ms | 50-80ms | ~40% |
| Search | 60-100ms | 40-70ms | ~35% |
| Autocomplete (cached) | 30-50ms | ~20ms avg | ~60% |

**전체 평균 개선**: 40-60% 응답 시간 단축

## 검증 체크리스트

- [ ] Comments API N+1 쿼리 해결 확인
- [ ] SELECT * 제거 확인 (모든 API)
- [ ] 캐싱 헤더 적용 확인
- [ ] 쿼리 성능 로그 확인
- [ ] API 응답 정확성 검증
- [ ] 에러 처리 동작 확인
- [ ] 프로덕션 배포 준비

## 다음 단계 (P4B2)

1. 데이터베이스 인덱스 생성
2. 쿼리 실행 계획 분석
3. 부하 테스트 수행
4. 추가 병목 지점 식별

## 참고 파일

- **P4B1_OPTIMIZATION_REPORT.md**: 전체 최적화 분석 보고서
- **P4B1_OPTIMIZATION_SNIPPETS.md**: 코드 스니펫 모음
- **P4B1_COMMENTS_OPTIMIZED_SNIPPET.ts**: Comments API 최적화 코드
- **P4B1_IMPLEMENTATION_GUIDE.md**: 본 문서

## 문의 및 지원

최적화 구현 중 문제 발생 시:
1. 백업 파일로 롤백
2. 에러 로그 확인
3. 쿼리 성능 로그 분석
4. 필요 시 원본 버전과 비교
