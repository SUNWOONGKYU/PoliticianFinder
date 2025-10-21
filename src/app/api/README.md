# PoliticianFinder API Documentation

## 개요

PoliticianFinder API는 정치인 정보를 검색하고 관리하기 위한 RESTful API입니다.

## API 엔드포인트

### 1. 정치인 목록 조회

**GET** `/api/politicians`

정치인 목록을 페이지네이션과 함께 조회합니다.

#### Query Parameters

| Parameter | Type | Description | Default | Example |
|-----------|------|-------------|---------|---------|
| `page` | number | 페이지 번호 | 1 | `page=2` |
| `limit` | number | 페이지당 항목 수 (최대 100) | 10 | `limit=20` |
| `search` | string | 이름 검색어 | - | `search=홍길동` |
| `party` | string | 정당 필터 (쉼표 구분) | - | `party=더불어민주당,국민의힘` |
| `region` | string | 지역 필터 (쉼표 구분) | - | `region=서울,부산` |
| `position` | string | 직급 필터 (쉼표 구분) | - | `position=국회의원` |
| `sort` | string | 정렬 필드 | name | `sort=avg_rating` |
| `order` | string | 정렬 방향 (asc/desc) | asc | `order=desc` |

#### Response

```json
{
  "data": [
    {
      "id": 1,
      "name": "홍길동",
      "party": "더불어민주당",
      "district": "서울 강남구 갑",
      "position": "국회의원",
      "profile_image_url": "https://example.com/image.jpg",
      "avg_rating": 4.2,
      "total_ratings": 150
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

### 2. 정치인 검색

**GET** `/api/politicians/search`

고급 검색 및 필터링 기능을 제공합니다.

#### Query Parameters

| Parameter | Type | Description | Default | Example |
|-----------|------|-------------|---------|---------|
| `q` | string | 검색어 (최소 2자) | - | `q=홍길` |
| `party` | string | 정당 필터 (쉼표 구분) | - | `party=더불어민주당` |
| `region` | string | 지역 필터 (쉼표 구분) | - | `region=서울,경기` |
| `position` | string | 직급 필터 (쉼표 구분) | - | `position=시장,도지사` |
| `page` | number | 페이지 번호 | 1 | `page=1` |
| `limit` | number | 페이지당 항목 수 | 10 | `limit=20` |
| `sort` | string | 정렬 필드 | name | `sort=name` |
| `order` | string | 정렬 방향 | asc | `order=desc` |

#### Response

```json
{
  "data": [
    {
      "id": 1,
      "name": "홍길동",
      "party": "더불어민주당",
      "region": "서울",
      "position": "국회의원",
      "profile_image": "https://example.com/image.jpg"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  },
  "filters": {
    "query": "홍길",
    "parties": ["더불어민주당"],
    "regions": [],
    "positions": []
  }
}
```

### 3. 자동완성

**GET** `/api/autocomplete`

검색어 자동완성 제안을 제공합니다.

#### Query Parameters

| Parameter | Type | Description | Required | Example |
|-----------|------|-------------|----------|---------|
| `q` | string | 검색어 (최소 2자) | Yes | `q=홍` |
| `type` | string | 자동완성 타입 | No | `type=politician` |

**자동완성 타입:**
- `politician` - 정치인 이름 (기본값)
- `party` - 정당명
- `region` - 지역명

#### Response

```json
{
  "suggestions": [
    {
      "id": "1",
      "name": "홍길동",
      "label": "홍길동 (더불어민주당, 서울)"
    },
    {
      "id": "2",
      "name": "홍길순",
      "label": "홍길순 (국민의힘, 부산)"
    }
  ],
  "cached": false
}
```

## 검색 알고리즘

### 1. 전문 검색 (Full-text Search)

PostgreSQL의 ILIKE 연산자를 사용하여 대소문자를 구분하지 않는 부분 문자열 매칭을 수행합니다.

```sql
SELECT * FROM politicians
WHERE name ILIKE '%검색어%'
```

### 2. SQL Injection 방지

모든 검색어는 다음과 같이 이스케이프 처리됩니다:
- `%` → `\%`
- `_` → `\_`
- `'` → `''`
- `\` → `\\`

### 3. 다중 필터 조합

여러 필터를 AND 조건으로 결합하여 적용합니다:

```sql
SELECT * FROM politicians
WHERE name ILIKE '%검색어%'
  AND party IN ('정당1', '정당2')
  AND region IN ('지역1', '지역2')
  AND position IN ('직급1', '직급2')
```

### 4. 성능 최적화

- **인덱싱**: `name`, `party`, `region`, `position` 컬럼에 인덱스 적용
- **페이지네이션**: 대량 데이터 처리를 위한 offset-based 페이지네이션
- **캐싱**:
  - API 응답: 30초 캐시 (Cache-Control 헤더)
  - 자동완성: 메모리 캐시 1분

### 5. 자동완성 로직

1. **최소 문자 수**: 2자 이상 입력 시 동작
2. **중복 제거**: 정당/지역 자동완성 시 중복 값 제거
3. **결과 제한**: 최대 10개 제안
4. **캐싱**: 동일 검색어는 1분간 메모리 캐시

## 사용 예제

### JavaScript/TypeScript

```typescript
import { searchPoliticians, getAutocompleteSuggestions } from '@/lib/api/searchClient'

// 정치인 검색
const results = await searchPoliticians({
  q: '홍길동',
  party: ['더불어민주당', '국민의힘'],
  page: 1,
  limit: 20
})

// 자동완성
const suggestions = await getAutocompleteSuggestions({
  q: '홍',
  type: 'politician'
})
```

### cURL

```bash
# 정치인 목록 조회
curl "http://localhost:3000/api/politicians?page=1&limit=10"

# 정치인 검색
curl "http://localhost:3000/api/politicians/search?q=홍길동&party=더불어민주당"

# 자동완성
curl "http://localhost:3000/api/autocomplete?q=홍&type=politician"
```

## 에러 처리

모든 API는 다음과 같은 형식의 에러를 반환합니다:

```json
{
  "error": "에러 메시지",
  "details": "상세 정보 (개발 모드에서만)"
}
```

### HTTP 상태 코드

- `200 OK` - 성공
- `400 Bad Request` - 잘못된 요청 파라미터
- `500 Internal Server Error` - 서버 오류

## 보안 고려사항

1. **SQL Injection 방지**: 모든 사용자 입력 이스케이프 처리
2. **Rate Limiting**: 추후 구현 예정
3. **입력 검증**:
   - 검색어 최대 100자 제한
   - 필터 값 최대 50자 제한
   - 페이지당 최대 100개 항목

## 성능 지표

- 평균 응답 시간: < 200ms
- 최대 동시 처리: 100 requests/sec
- 캐시 히트율: > 60%