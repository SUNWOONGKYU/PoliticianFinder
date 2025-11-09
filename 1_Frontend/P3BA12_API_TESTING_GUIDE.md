# P3BA12 - API 테스트 가이드

## API 엔드포인트 목록

### 1. AI 평가 생성
**Endpoint**: `POST /api/evaluations/generate`

**cURL 예시**:
```bash
curl -X POST http://localhost:3000/api/evaluations/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "politician_id": "your-politician-uuid",
    "evaluator": "claude"
  }'
```

**Thunder Client / Postman**:
```
POST http://localhost:3000/api/evaluations/generate
Headers:
  Content-Type: application/json
  Authorization: Bearer YOUR_TOKEN

Body (JSON):
{
  "politician_id": "your-politician-uuid",
  "evaluator": "claude"
}
```

**Valid Evaluators**:
- `claude`
- `chatgpt`
- `gemini`
- `grok`
- `perplexity`

---

### 2. AI 평가 수정
**Endpoint**: `PATCH /api/evaluations/{evaluationId}/update`

**cURL 예시**:
```bash
curl -X PATCH http://localhost:3000/api/evaluations/your-evaluation-uuid/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "overall_score": 92,
    "summary": "Updated evaluation summary",
    "strengths": ["New strength added"]
  }'
```

**부분 업데이트 가능 필드**:
- `overall_score` (0-100)
- `overall_grade`
- `pledge_completion_rate` (0-100)
- `activity_score` (0-100)
- `controversy_score` (0-100)
- `public_sentiment_score` (0-100)
- `strengths` (array)
- `weaknesses` (array)
- `summary` (string)
- `detailed_analysis` (object)
- `sources` (array)

---

### 3. 일괄 평가 생성
**Endpoint**: `POST /api/evaluations/batch`

**cURL 예시**:
```bash
curl -X POST http://localhost:3000/api/evaluations/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "politician_ids": [
      "uuid-1",
      "uuid-2",
      "uuid-3"
    ],
    "evaluator": "claude"
  }'
```

**제한사항**:
- 최대 50명까지 동시 처리 가능
- Promise.all로 병렬 처리

---

## 응답 예시

### 성공 응답 (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "eval-uuid",
    "politician": {
      "id": "politician-uuid",
      "name": "홍길동"
    },
    "evaluator": "claude",
    "ai_model_version": "claude-3.5-2025-11-09",
    "evaluation_date": "2025-11-09",
    "overall_score": 87,
    "overall_grade": "A",
    "scores": {
      "pledge_completion": 85,
      "activity": 90,
      "controversy": 88,
      "public_sentiment": 82
    },
    "detailed_criteria": {
      "integrity_score": 90,
      "integrity_evidence": "claude 분석: 공직자로서 높은 윤리 기준...",
      "expertise_score": 85,
      "expertise_evidence": "claude 분석: 해당 분야 전문성...",
      ... // 10개 기준
    },
    "summary": "claude AI가 분석한 종합 평가...",
    "strengths": ["높은 윤리 기준", "효과적인 소통"],
    "weaknesses": ["정책 실효성 개선 필요"],
    "sources": ["https://example.com/..."],
    "created_at": "2025-11-09T12:00:00Z",
    "updated_at": "2025-11-09T12:00:00Z"
  },
  "message": "평가가 생성되었습니다"
}
```

### 에러 응답 (401 Unauthorized)
```json
{
  "success": false,
  "error": "인증이 필요합니다"
}
```

### 에러 응답 (400 Bad Request)
```json
{
  "success": false,
  "error": "politician_id와 evaluator가 필요합니다"
}
```

### 에러 응답 (404 Not Found)
```json
{
  "success": false,
  "error": "정치인을 찾을 수 없습니다"
}
```

### 배치 부분 성공 (206 Partial Content)
```json
{
  "success": true,
  "data": {
    "total": 3,
    "success": 2,
    "failed": 1,
    "duration_ms": 1234,
    "evaluator": "claude",
    "ai_model_version": "claude-3.5-2025-11-09",
    "evaluation_date": "2025-11-09",
    "results": [
      {
        "politician_id": "uuid-1",
        "politician_name": "정치인1",
        "status": "success",
        "evaluation_id": "eval-uuid-1"
      },
      {
        "politician_id": "uuid-2",
        "politician_name": "정치인2",
        "status": "success",
        "evaluation_id": "eval-uuid-2"
      },
      {
        "politician_id": "uuid-3",
        "status": "failed",
        "error": "정치인을 찾을 수 없습니다"
      }
    ]
  },
  "message": "2/3개의 평가가 생성되었습니다"
}
```

---

## 테스트 시나리오

### 시나리오 1: 단일 평가 생성
1. 정치인 ID 준비
2. POST /api/evaluations/generate 호출
3. 응답 확인 (201)
4. 평가 ID 저장

### 시나리오 2: 평가 수정
1. 기존 평가 ID 준비
2. PATCH /api/evaluations/{id}/update 호출
3. 부분 업데이트 데이터 전송
4. 응답 확인 (200)
5. updated_at 변경 확인

### 시나리오 3: 중복 생성 (Upsert)
1. 같은 politician_id + evaluator로 2번 생성
2. 첫 번째: 201 Created
3. 두 번째: 200 OK (업데이트)
4. 같은 ID 반환 확인

### 시나리오 4: 일괄 생성
1. 여러 politician_id 배열 준비
2. POST /api/evaluations/batch 호출
3. 진행 상황 확인
4. 개별 결과 확인

### 시나리오 5: 권한 없음
1. 인증 토큰 없이 호출
2. 401 에러 확인

### 시나리오 6: 잘못된 입력
1. 잘못된 evaluator 전송
2. 400 에러 확인
3. 에러 메시지 확인

---

## 데이터베이스 확인

### Supabase SQL Editor
```sql
-- 생성된 평가 조회
SELECT
  id,
  politician_id,
  ai_model_version,
  overall_score,
  overall_grade,
  evaluation_date,
  created_at,
  updated_at
FROM ai_evaluations
ORDER BY created_at DESC
LIMIT 10;

-- 특정 정치인의 평가 이력
SELECT *
FROM ai_evaluations
WHERE politician_id = 'your-politician-uuid'
ORDER BY evaluation_date DESC;

-- AI 모델별 평가 수
SELECT
  ai_model_version,
  COUNT(*) as evaluation_count,
  AVG(overall_score) as avg_score
FROM ai_evaluations
GROUP BY ai_model_version;

-- 최근 생성된 평가
SELECT
  e.*,
  p.name as politician_name
FROM ai_evaluations e
JOIN politicians p ON e.politician_id = p.id
WHERE e.created_at > NOW() - INTERVAL '1 day'
ORDER BY e.created_at DESC;
```

---

## 성능 테스트

### 배치 처리 성능
```bash
# 10명 동시 평가
time curl -X POST http://localhost:3000/api/evaluations/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "politician_ids": ["uuid1", "uuid2", ... "uuid10"],
    "evaluator": "claude"
  }'

# 예상 시간: 2-5초 (병렬 처리)
```

---

## 주의사항

1. **인증 토큰 필수**: 모든 API는 인증이 필요합니다
2. **관리자 권한**: 현재는 인증된 사용자만 확인, 향후 관리자 권한 추가 예정
3. **Mock 데이터**: 현재는 Mock 데이터 생성, 실제 AI 연동은 P4BA14에서 구현
4. **Rate Limiting**: 현재 미구현, 향후 추가 예정
5. **배치 크기 제한**: 최대 50명까지

---

## 문제 해결

### 401 Unauthorized
- Supabase 인증 토큰 확인
- 토큰 유효기간 확인
- `.env` 파일의 SUPABASE 설정 확인

### 404 Not Found
- politician_id 존재 여부 확인
- UUID 형식 확인

### 500 Internal Server Error
- 서버 로그 확인
- Supabase 연결 상태 확인
- Database 스키마 확인

---

**작성일**: 2025-11-09
**버전**: 1.0
**담당**: backend-developer
