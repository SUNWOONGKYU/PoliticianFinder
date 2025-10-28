# Politicians API Documentation

## Overview
정치인 정보를 제공하는 RESTful API입니다.

## Endpoints

### 1. GET /api/politicians
정치인 목록을 조회합니다.

#### Query Parameters
- `page` (number): 페이지 번호 (기본값: 1)
- `limit` (number): 페이지당 항목 수 (기본값: 10, 최대: 100)
- `search` (string): 이름 검색 (한글/영문)
- `party` (string): 정당 필터 (쉼표 구분)
- `region` (string): 지역 필터 (쉼표 구분)
- `position` (string): 직급 필터 (쉼표 구분)
- `sort` (string): 정렬 필드 (name, avg_rating, total_ratings, created_at)
- `order` (string): 정렬 방향 (asc, desc)

#### Response
```json
{
  "data": [
    {
      "id": 1,
      "name": "홍길동",
      "name_en": "Hong Gil-dong",
      "party": "더불어민주당",
      "district": "서울 강남구 갑",
      "position": "국회의원",
      "profile_image_url": "https://...",
      "avg_rating": 4.2,
      "total_ratings": 150,
      "total_bookmarks": 25,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### 2. GET /api/politicians/[id]
특정 정치인의 상세 정보를 조회합니다.

#### Parameters
- `id` (number): 정치인 ID

#### Response
```json
{
  "id": 1,
  "name": "홍길동",
  "party": "더불어민주당",
  "region": "서울 강남구 갑",
  "position": "국회의원",
  "profile_image_url": "https://...",
  "biography": "정치인 약력...",
  "official_website": "https://...",
  "avg_rating": 4.2,
  "total_ratings": 150,
  "ai_scores": {
    "claude": 85,
    "gpt": 82,
    "gemini": 80
  },
  "rating_distribution": {
    "5": 60,
    "4": 40,
    "3": 30,
    "2": 15,
    "1": 5
  },
  "total_posts": 25,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid politician ID"
}
```

### 404 Not Found
```json
{
  "error": "Politician not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "Error details..."
}
```

## Caching

- 목록 조회: Cache-Control: public, s-maxage=30, stale-while-revalidate=60
- 상세 조회: Cache-Control: public, s-maxage=60, stale-while-revalidate=300

## CORS Support

모든 엔드포인트는 CORS를 지원하며, OPTIONS 메서드로 preflight 요청을 처리합니다.

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Testing

테스트는 `test-api.http` 파일을 사용하여 VS Code REST Client Extension으로 수행할 수 있습니다.

## Related Files

- `/frontend/src/app/api/politicians/route.ts` - 목록 API
- `/frontend/src/app/api/politicians/[id]/route.ts` - 상세 API
- `/frontend/src/types/politician.ts` - TypeScript 타입 정의
- `/frontend/src/types/database.ts` - 데이터베이스 스키마 타입
- `/frontend/src/lib/api/utils.ts` - API 유틸리티 함수
- `/frontend/src/lib/supabase/server.ts` - Supabase 클라이언트