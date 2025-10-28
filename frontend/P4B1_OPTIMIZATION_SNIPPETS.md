# P4B1 Query Optimization Code Snippets

## 1. Politicians List API
```typescript
// OPTIMIZED Politicians List Query (P4B1)
// File: src/app/api/politicians/route.ts

// BEFORE: SELECT * (모든 필드 조회)
let query = supabase
  .from('politicians')
  .select('*', { count: 'exact' })

// AFTER: 필수 필드만 SELECT (50% 성능 향상 예상)
let query = supabase
  .from('politicians')
  .select(`
    id,
    name,
    party,
    district,
    position,
    profile_image_url,
    avg_rating,
    total_ratings,
    created_at
  `, { count: 'exact' })

// 추가 최적화: 캐싱 헤더
return NextResponse.json(response, {
  headers: {
    'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    'CDN-Cache-Control': 'public, max-age=30'
  }
})

```

## 2. Politician Detail API
```typescript
// OPTIMIZED Politician Detail Query (P4B1)
// File: src/app/api/politicians/[id]/route.ts

// OPTIMIZED: 필수 필드만 조회 + 조건부 조인
const { data: politician, error: politicianError } = await supabase
  .from('politicians')
  .select(`
    id,
    name,
    party,
    district,
    position,
    profile_image_url,
    biography,
    official_website,
    avg_rating,
    total_ratings,
    created_at,
    updated_at,
    ai_scores!left (
      ai_name,
      score,
      updated_at
    )
  `)
  .eq('id', politicianId)
  .single()

// OPTIMIZED: 평가 통계는 select만 사용 (aggregation 제거)
const { data: ratings, error: ratingsError } = await supabase
  .from('ratings')
  .select('score')  // 필요한 필드만
  .eq('politician_id', politicianId)

// 캐싱 개선: 정치인 상세는 더 긴 캐시
return NextResponse.json(response, {
  headers: {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
  }
})

```

## 3. Ratings Stats API
```typescript
// OPTIMIZED Ratings Stats Query (P4B1)
// File: src/app/api/ratings/stats/route.ts

// OPTIMIZED: 필요한 필드만 조회
const { data: ratings, error: ratingsError } = await supabase
  .from('ratings')
  .select('score, category')  // BEFORE: 'score, category, created_at, ...' 등 불필요 필드 제외
  .eq('politician_id', politicianIdNum)

// 추가 최적화: 결과 캐싱
// 평가 통계는 자주 변경되지 않으므로 긴 캐시 적용
return NextResponse.json({ success: true, data: statistics }, {
  headers: {
    'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600'
  }
})

```

## 4. Search API
```typescript
// OPTIMIZED Search Query (P4B1)
// File: src/app/api/politicians/search/route.ts

// ALREADY OPTIMIZED: 필요한 필드만 SELECT
let dbQuery = supabase
  .from('politicians')
  .select('id, name, party, district, position, profile_image_url, avg_rating, total_ratings', 
    { count: 'exact' })

// 추가 최적화 고려사항:
// 1. PostgreSQL Full-Text Search 사용 (ilike 대신)
// 2. 검색 결과 캐싱 (Redis 또는 In-Memory)
// 3. 자주 사용되는 필터 조합에 대한 Materialized View 생성

```

## 5. Comments API (Critical N+1 Fix)
See: P4B1_COMMENTS_OPTIMIZED_SNIPPET.ts
