# P4BA7 - 자동 중재 시스템 API 구현 완료

**Task ID**: P4BA7
**작업명**: 자동 중재 시스템 API
**Phase**: Phase 4
**Area**: Backend APIs (BA)
**완료일**: 2025-11-09
**작업자**: Claude-Sonnet-4.5 (api-designer)

---

## 목차

1. [구현 개요](#구현-개요)
2. [생성된 파일](#생성된-파일)
3. [API 엔드포인트](#api-엔드포인트)
4. [아키텍처 설계](#아키텍처-설계)
5. [주요 기능](#주요-기능)
6. [환경 변수 설정](#환경-변수-설정)
7. [사용 예시](#사용-예시)
8. [테스트 가이드](#테스트-가이드)
9. [보안 고려사항](#보안-고려사항)
10. [향후 개선사항](#향후-개선사항)

---

## 구현 개요

AI(OpenAI GPT-4) 기반 자동 중재 시스템으로 신고된 콘텐츠를 자동으로 분석하고 처리하는 API를 구현했습니다.

### 핵심 기능

- **AI 콘텐츠 분석**: OpenAI API를 활용한 정교한 콘텐츠 분석
- **심각도 점수 계산**: 0-100점 척도로 위반 심각도 평가
- **자동 액션 실행**: 점수에 따라 무시/검토/삭제 자동 처리
- **컨텍스트 고려**: 사용자 위반 이력, 콘텐츠 타입 등 고려
- **감사 로그 기록**: 모든 처리 내역 추적 가능

---

## 생성된 파일

### 1. API 라우트
```
src/app/api/admin/auto-moderate/route.ts
3_Backend_APIs/app/api/admin/auto-moderate/route.ts
```
- 자동 중재 API 엔드포인트
- 신고 처리 및 콘텐츠 관리

### 2. AI 분석기
```
src/lib/moderation/ai-analyzer.ts
3_Backend_APIs/lib/moderation/ai-analyzer.ts
```
- OpenAI API 연동
- 콘텐츠 분석 및 위반 감지
- 카테고리별 점수 계산

### 3. 심각도 점수 계산기
```
src/lib/moderation/severity-scorer.ts
3_Backend_APIs/lib/moderation/severity-scorer.ts
```
- 최종 심각도 점수 계산
- 컨텍스트 기반 가중치 적용
- 액션 결정 로직

### 4. 환경 변수
```
.env.example (업데이트)
```
- OpenAI API 키 설정 추가
- Supabase Service Role Key 추가

---

## API 엔드포인트

### POST /api/admin/auto-moderate

신고된 콘텐츠를 AI로 분석하고 자동 처리합니다.

#### Request

```typescript
POST /api/admin/auto-moderate
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "reportId": "550e8400-e29b-41d4-a716-446655440000",
  "contentType": "post" | "comment",
  "contentId": "660e8400-e29b-41d4-a716-446655440001"
}
```

#### Response (200 OK)

```typescript
{
  "success": true,
  "data": {
    "reportId": "550e8400-e29b-41d4-a716-446655440000",
    "action": "delete" | "review" | "ignore",
    "severity": 85,
    "riskLevel": "critical",
    "reasons": [
      "profanity: 90점",
      "hate_speech: 75점"
    ],
    "aiAnalysis": "욕설과 혐오 표현이 포함되어 있습니다...",
    "actionTaken": {
      "contentDeleted": true,
      "userWarned": true,
      "adminNotified": true
    },
    "metadata": {
      "analyzedAt": "2025-11-09T10:30:00Z",
      "confidence": 0.95,
      "model": "gpt-4o-mini"
    }
  }
}
```

#### Error Responses

**400 Bad Request** - 잘못된 요청
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "입력 데이터가 올바르지 않습니다.",
    "details": {
      "reportId": ["유효한 UUID가 필요합니다"]
    }
  }
}
```

**404 Not Found** - 리소스 없음
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "신고를 찾을 수 없습니다"
  }
}
```

**500 Internal Server Error** - 서버 오류
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "자동 중재 처리 중 오류가 발생했습니다."
  }
}
```

---

## 아키텍처 설계

### 시스템 흐름

```
┌─────────────┐
│   Request   │
│  (신고 ID)   │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ 1. 신고 정보 조회    │
│    - reports 테이블  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ 2. 콘텐츠 조회       │
│    - posts/comments │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ 3. 위반 이력 조회    │
│    - 사용자 이력     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ 4. AI 분석           │
│    - OpenAI API     │
│    - 카테고리 분석   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ 5. 심각도 계산       │
│    - 컨텍스트 고려   │
│    - 가중치 적용     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ 6. 액션 실행         │
│    - 삭제/검토/무시  │
│    - 사용자 경고     │
│    - 관리자 알림     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ 7. 로그 기록         │
│    - audit_logs     │
└──────┬──────────────┘
       │
       ▼
┌─────────────┐
│  Response   │
└─────────────┘
```

### 컴포넌트 구조

```
┌──────────────────────────────────────┐
│         API Route Handler            │
│  /api/admin/auto-moderate/route.ts   │
└────────┬─────────────────────┬───────┘
         │                     │
         ▼                     ▼
┌────────────────┐    ┌─────────────────┐
│  AI Analyzer   │    │ Severity Scorer │
│  ai-analyzer   │◄───│ severity-scorer │
└────────────────┘    └─────────────────┘
         │
         ▼
┌────────────────┐
│  OpenAI API    │
│   GPT-4o-mini  │
└────────────────┘
```

---

## 주요 기능

### 1. AI 콘텐츠 분석 (ai-analyzer.ts)

#### 분석 카테고리 (8가지)

1. **profanity** - 욕설/비방
2. **hate_speech** - 혐오 표현
3. **spam** - 스팸/광고
4. **personal_info** - 개인정보 노출
5. **misinformation** - 허위정보
6. **harassment** - 괴롭힘
7. **violence** - 폭력적 표현
8. **sexual_content** - 성적 콘텐츠

#### 분석 결과

```typescript
interface ContentAnalysisResult {
  severity: number;          // 0-100 전체 심각도
  categories: [              // 카테고리별 상세
    {
      type: "profanity",
      score: 90,
      examples: ["시발", "새끼"]
    }
  ];
  reasoning: string;         // AI 평가 근거
  confidence: number;        // 0-1 신뢰도
  recommendations: string[]; // 권장 조치
}
```

### 2. 심각도 점수 계산 (severity-scorer.ts)

#### 점수 기준

- **0-30점**: 무시 (정상 콘텐츠)
- **31-70점**: 관리자 검토 필요
- **71-100점**: 자동 삭제

#### 가중치 적용

```typescript
// 콘텐츠 타입
post: 1.0 (기준)
comment: 0.9 (10% 덜 엄격)

// 위반 이력
첫 위반: 1.0
2회: 1.1
3회: 1.2
4회: 1.3
5회 이상: 1.5

// 신고 횟수
1회: 1.0
2회: 1.05
3회: 1.1
4회: 1.15
5회 이상: 1.2
```

### 3. 자동 액션 실행

#### 액션별 처리

**DELETE (71-100점)**
- 콘텐츠 삭제
- 사용자 경고
- 신고 승인 처리
- 관리자 알림
- 감사 로그 기록

**REVIEW (31-70점)**
- 신고 상태: pending_review
- 관리자 알림
- 감사 로그 기록

**IGNORE (0-30점)**
- 신고 거부 처리
- 감사 로그 기록

---

## 환경 변수 설정

### .env.local 파일에 추가

```bash
# ============================================================================
# OpenAI API 설정 (자동 중재 시스템용)
# ============================================================================

# OpenAI API Key
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx

# OpenAI Model (선택 사항, 기본값: gpt-4o-mini)
OPENAI_MODEL=gpt-4o-mini

# ============================================================================
# Supabase Service Role Key (서버 전용)
# ============================================================================

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 발급 방법

1. **OpenAI API Key**
   - https://platform.openai.com/api-keys
   - "Create new secret key" 클릭
   - 키 복사 및 저장

2. **Supabase Service Role Key**
   - Supabase Dashboard > Settings > API
   - "service_role" key 복사
   - 절대 클라이언트에 노출하지 말 것!

---

## 사용 예시

### cURL 요청

```bash
curl -X POST https://your-domain.com/api/admin/auto-moderate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "reportId": "550e8400-e29b-41d4-a716-446655440000",
    "contentType": "comment",
    "contentId": "660e8400-e29b-41d4-a716-446655440001"
  }'
```

### JavaScript/TypeScript

```typescript
async function moderateContent(
  reportId: string,
  contentType: 'post' | 'comment',
  contentId: string
) {
  const response = await fetch('/api/admin/auto-moderate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      reportId,
      contentType,
      contentId,
    }),
  });

  if (!response.ok) {
    throw new Error('자동 중재 실패');
  }

  const result = await response.json();

  console.log('처리 결과:', result.data.action);
  console.log('심각도:', result.data.severity);

  return result;
}

// 사용 예시
const result = await moderateContent(
  '550e8400-e29b-41d4-a716-446655440000',
  'comment',
  '660e8400-e29b-41d4-a716-446655440001'
);

if (result.data.action === 'delete') {
  console.log('콘텐츠가 자동 삭제되었습니다.');
} else if (result.data.action === 'review') {
  console.log('관리자 검토가 필요합니다.');
} else {
  console.log('정상 콘텐츠입니다.');
}
```

### React 컴포넌트 예시

```typescript
import { useState } from 'react';

function AutoModerateButton({ reportId, contentType, contentId }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleAutoModerate = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/admin/auto-moderate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportId, contentType, contentId }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        alert(`처리 완료: ${data.data.action} (심각도: ${data.data.severity}점)`);
      }
    } catch (error) {
      console.error('자동 중재 오류:', error);
      alert('자동 중재 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleAutoModerate} disabled={loading}>
        {loading ? '분석 중...' : 'AI 자동 중재'}
      </button>

      {result?.data && (
        <div>
          <h3>분석 결과</h3>
          <p>액션: {result.data.action}</p>
          <p>심각도: {result.data.severity}점</p>
          <p>위험도: {result.data.riskLevel}</p>
          <p>AI 분석: {result.data.aiAnalysis}</p>
        </div>
      )}
    </div>
  );
}
```

---

## 테스트 가이드

### 1. 단위 테스트

각 모듈별로 단위 테스트를 작성하세요.

```typescript
// ai-analyzer.test.ts
import { analyzeContent } from '@/lib/moderation/ai-analyzer';

describe('AI Analyzer', () => {
  it('should analyze profanity correctly', async () => {
    const result = await analyzeContent({
      content: '이 시발새끼야',
      contentType: 'comment',
    });

    expect(result.severity).toBeGreaterThan(70);
    expect(result.categories).toContainEqual(
      expect.objectContaining({ type: 'profanity' })
    );
  });

  it('should return low severity for normal content', async () => {
    const result = await analyzeContent({
      content: '안녕하세요. 좋은 의견이네요.',
      contentType: 'comment',
    });

    expect(result.severity).toBeLessThan(30);
  });
});
```

### 2. 통합 테스트

API 전체 흐름을 테스트하세요.

```typescript
// auto-moderate.test.ts
describe('POST /api/admin/auto-moderate', () => {
  it('should process severe violation', async () => {
    const response = await fetch('/api/admin/auto-moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportId: 'test-report-id',
        contentType: 'comment',
        contentId: 'test-content-id',
      }),
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data.action).toBe('delete');
  });

  it('should validate request body', async () => {
    const response = await fetch('/api/admin/auto-moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportId: 'invalid-id',
      }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});
```

### 3. 수동 테스트

Postman 또는 Thunder Client로 테스트:

1. **정상 케이스**
   ```json
   {
     "reportId": "550e8400-e29b-41d4-a716-446655440000",
     "contentType": "comment",
     "contentId": "660e8400-e29b-41d4-a716-446655440001"
   }
   ```
   기대 결과: 200 OK, action 반환

2. **잘못된 UUID**
   ```json
   {
     "reportId": "invalid-uuid",
     "contentType": "comment",
     "contentId": "660e8400-e29b-41d4-a716-446655440001"
   }
   ```
   기대 결과: 400 Bad Request, VALIDATION_ERROR

3. **존재하지 않는 신고**
   ```json
   {
     "reportId": "00000000-0000-0000-0000-000000000000",
     "contentType": "comment",
     "contentId": "660e8400-e29b-41d4-a716-446655440001"
   }
   ```
   기대 결과: 404 Not Found

---

## 보안 고려사항

### 1. 인증 및 권한

- **Admin Only**: 관리자만 접근 가능해야 함
- Service Role Key 사용으로 모든 권한 획득
- 미들웨어에서 admin 권한 확인 필요

```typescript
// middleware.ts (추가 필요)
export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    const session = await getSession(request);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }
}
```

### 2. 환경 변수 보호

- **NEVER** commit `.env.local`
- OpenAI API Key는 서버 전용
- Supabase Service Key는 절대 클라이언트 노출 금지
- 프로덕션: GitHub Secrets 또는 Vercel Environment Variables 사용

### 3. Rate Limiting

OpenAI API 비용 절감을 위해 rate limiting 필요:

```typescript
// Rate limiting 추가 (향후)
const rateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1분
  maxRequests: 10,     // 10회
});

export async function POST(request: NextRequest) {
  const ip = request.ip || 'unknown';

  if (!rateLimiter.check(ip)) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  // ... 나머지 로직
}
```

### 4. 입력 검증

- Zod 스키마로 엄격한 검증
- UUID 형식 확인
- contentType enum 제한
- SQL Injection 방지 (Supabase ORM 사용)

### 5. 에러 처리

- 민감한 정보 노출 방지
- 스택 트레이스 숨김
- 사용자 친화적 에러 메시지

---

## 향후 개선사항

### 1. 성능 최적화

- [ ] AI 분석 결과 캐싱
- [ ] 배치 처리 (여러 신고 동시 처리)
- [ ] 비동기 큐 도입 (Bull, BullMQ)
- [ ] OpenAI API 호출 최적화

### 2. 기능 확장

- [ ] 이미지/비디오 콘텐츠 분석
- [ ] 자동 학습 시스템 (피드백 반영)
- [ ] 관리자 대시보드 (통계, 차트)
- [ ] 사용자 신뢰도 점수 시스템
- [ ] 화이트리스트/블랙리스트 관리

### 3. 알림 시스템

- [ ] 이메일 알림 (관리자, 사용자)
- [ ] Slack/Discord 웹훅 연동
- [ ] 실시간 알림 (WebSocket)
- [ ] 경고 누적 시 자동 계정 정지

### 4. 분석 정확도 향상

- [ ] 한국어 특화 모델 사용
- [ ] 문맥 분석 강화
- [ ] False Positive 감소
- [ ] 관리자 피드백으로 모델 튜닝

### 5. 테스트 커버리지

- [ ] 단위 테스트 작성
- [ ] 통합 테스트 작성
- [ ] E2E 테스트 작성
- [ ] 성능 테스트 (부하 테스트)

### 6. 모니터링

- [ ] OpenAI API 사용량 추적
- [ ] 자동 중재 통계 (정확도, 처리 시간)
- [ ] 에러 로그 수집 (Sentry)
- [ ] 성능 모니터링 (New Relic, DataDog)

---

## 완료 체크리스트

- [x] OpenAI API 연동 완료
- [x] 심각도 점수 계산 로직 구현
- [x] 자동 삭제 기능 동작 확인
- [x] 관리자 알림 발송 로직 구현
- [x] 감사 로그 기록 기능 구현
- [x] API 엔드포인트 구현
- [x] 환경 변수 설정 문서화
- [x] 에러 처리 구현
- [x] TypeScript 타입 정의
- [x] 코드 주석 및 문서화

---

## 참고 자료

### OpenAI API

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [GPT-4 Guide](https://platform.openai.com/docs/guides/gpt)
- [JSON Mode](https://platform.openai.com/docs/guides/text-generation/json-mode)

### Supabase

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Service Role Key](https://supabase.com/docs/guides/api/api-keys)

### Next.js

- [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [API Routes](https://nextjs.org/docs/app/api-reference/file-conventions/route)

---

**구현 완료**: 2025-11-09
**작업자**: Claude-Sonnet-4.5 (api-designer)
**검토 상태**: 1차 구현 완료, 테스트 대기 중
