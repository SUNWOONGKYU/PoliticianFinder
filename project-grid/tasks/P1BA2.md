# 작업지시서: P1BA2

## 📋 기본 정보

- **작업 ID**: P1BA2
- **업무명**: Mock API - 정치인 (Politicians)
- **Phase**: Phase 1
- **Area**: Backend APIs (BA)
- **서브 에이전트**: api-designer
- **작업 방식**: AI-Only

---

## 🎯 작업 목표

Mock 데이터를 사용한 정치인 관련 API 6개 구현

**구현할 API 목록:**
1. **정치인 목록 조회** - GET /api/politicians
2. **정치인 상세 조회** - GET /api/politicians/[id]
3. **관심 정치인 등록** - POST /api/politicians/[id]/favorite
4. **정치인 본인인증** - POST /api/politicians/[id]/verify
5. **AI 평가 조회** - GET /api/politicians/[id]/evaluation
6. **AI 평가 생성** - POST /api/politicians/[id]/evaluation

---

## 🔧 사용 도구

```
[Claude 도구]
Read, Edit, Write, Grep, Glob, Bash

[기술 스택]
TypeScript, Next.js 14 App Router, Zod

[전문 스킬]
api-builder, api-test
```

**도구 설명**:
- **Claude 도구**: Claude Code의 기본 기능 (Read, Write, Edit, Bash, Glob, Grep 등)
- **기술 스택**: 프로젝트에 사용되는 프레임워크 및 라이브러리
- **전문 스킬**: Anthropic 빌트인 스킬 (.claude/skills/*.md 참조)

---

## 🔗 의존성 정보

**의존성 체인**: P1BI1, P1BI2

이 작업을 시작하기 전에 다음 작업이 완료되어야 합니다:
- **P1BI1**: Supabase 클라이언트 설정
- **P1BI2**: Mock 데이터 타입 정의

---

## 📦 기대 결과물

**생성할 API 파일:**
1. `app/api/politicians/route.ts` - 정치인 목록 조회 API
2. `app/api/politicians/[id]/route.ts` - 정치인 상세 조회 API
3. `app/api/politicians/[id]/favorite/route.ts` - 관심 정치인 등록 API
4. `app/api/politicians/[id]/verify/route.ts` - 정치인 본인인증 API
5. `app/api/politicians/[id]/evaluation/route.ts` - AI 평가 조회/생성 API

**지원 파일:**
- `lib/mock-data/politicians.json` - Mock 정치인 데이터
- `lib/mock-data/evaluations.json` - Mock AI 평가 데이터
- `lib/validators/politician.ts` - Zod 검증 스키마
- `lib/utils/search.ts` - 검색/필터 유틸리티

---

## 📂 작업 디렉토리

**Base Directory**: `C:\Development_PoliticianFinder_copy\Developement_Real_PoliticianFinder\1_Frontend`

**구현 파일 저장 위치**:
```
1_Frontend/
└── src/
    ├── app/
    │   └── api/
    │       └── politicians/
    │           ├── route.ts                    # 목록 조회
    │           └── [id]/
    │               ├── route.ts                # 상세 조회
    │               ├── favorite/
    │               │   └── route.ts            # 관심 등록
    │               ├── verify/
    │               │   └── route.ts            # 본인인증
    │               └── evaluation/
    │                   └── route.ts            # AI 평가
    └── lib/
        ├── mock-data/
        │   ├── politicians.json
        │   └── evaluations.json
        ├── validators/
        │   └── politician.ts
        └── utils/
            └── search.ts
```

---

## 📝 작업 지시사항

### 1. 준비 단계

1. **프로젝트 구조 확인**
   - Base Directory에서 작업 시작
   - 필요한 의존성 설치 확인: `zod`
   - 의존성 작업 완료 확인 (P1BI1, P1BI2)

2. **Mock 데이터 구조 설계**
   - 정치인 데이터 구조 정의
   - AI 평가 데이터 구조 정의

---

### 2. 구현 단계

#### 2.1 Zod 검증 스키마 작성 (`lib/validators/politician.ts`)

```typescript
// lib/validators/politician.ts
import { z } from 'zod';

// 정치인 목록 조회 쿼리 스키마
export const politiciansQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  party: z.string().optional(),
  region: z.string().optional(),
  position: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['name', 'score', 'recent']).optional().default('score'),
});

// 관심 정치인 등록 스키마
export const favoritePoliticianSchema = z.object({
  userId: z.string().uuid('유효한 사용자 ID가 아닙니다'),
});

// 본인인증 스키마
export const verifyPoliticianSchema = z.object({
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '생년월일 형식이 올바르지 않습니다'),
  phone: z.string().regex(/^010-\d{4}-\d{4}$/, '올바른 전화번호 형식이 아닙니다'),
  verificationCode: z.string().length(6, '인증 코드는 6자리여야 합니다'),
});

// AI 평가 생성 스키마
export const createEvaluationSchema = z.object({
  politicianId: z.string().uuid('유효한 정치인 ID가 아닙니다'),
  evaluatorType: z.enum(['gpt', 'claude', 'gemini', 'perplexity']),
});

export type PoliticiansQuery = z.infer<typeof politiciansQuerySchema>;
export type FavoritePoliticianInput = z.infer<typeof favoritePoliticianSchema>;
export type VerifyPoliticianInput = z.infer<typeof verifyPoliticianSchema>;
export type CreateEvaluationInput = z.infer<typeof createEvaluationSchema>;
```

#### 2.2 Mock 데이터 생성 (`lib/mock-data/politicians.json`)

```json
// lib/mock-data/politicians.json
[
  {
    "id": "pol-001",
    "name": "오세훈",
    "nameEn": "Oh Se-hoon",
    "party": "국민의힘",
    "position": "서울시장",
    "region": "서울",
    "profileImage": "/images/politicians/oh-sehoon.jpg",
    "birthDate": "1961-03-10",
    "career": [
      "제38대 서울특별시장 (2022~현재)",
      "제35·36대 서울특별시장 (2006~2011)",
      "제16·17대 국회의원"
    ],
    "education": ["고려대학교 법학과", "고려대학교 법학전문대학원"],
    "policies": [
      "한강 르네상스 프로젝트",
      "청년주택 10만호 공급",
      "교통 혁신 정책"
    ],
    "evaluationScore": 875,
    "evaluationGrade": "S+",
    "favoriteCount": 15234,
    "viewCount": 89453,
    "isVerified": true,
    "socialMedia": {
      "facebook": "https://facebook.com/ohsehoonseoul",
      "twitter": "https://twitter.com/ohsehoon",
      "instagram": "https://instagram.com/mayor_ohsehoon"
    },
    "createdAt": "2024-01-15T00:00:00Z",
    "updatedAt": "2024-11-06T00:00:00Z"
  },
  {
    "id": "pol-002",
    "name": "박형준",
    "nameEn": "Park Hyung-joon",
    "party": "국민의힘",
    "position": "부산시장",
    "region": "부산",
    "profileImage": "/images/politicians/park-hyungjoon.jpg",
    "birthDate": "1960-10-14",
    "career": [
      "제39대 부산광역시장 (2021~현재)",
      "제20·21대 국회의원",
      "청와대 정무수석비서관"
    ],
    "education": ["동아대학교 정치외교학과", "서울대학교 행정대학원"],
    "policies": [
      "북항 재개발 프로젝트",
      "부산 글로벌 허브 도시 조성",
      "가덕도 신공항 건설"
    ],
    "evaluationScore": 842,
    "evaluationGrade": "S",
    "favoriteCount": 12456,
    "viewCount": 67821,
    "isVerified": true,
    "socialMedia": {
      "facebook": "https://facebook.com/mayorpark",
      "twitter": "https://twitter.com/park_busan"
    },
    "createdAt": "2024-01-15T00:00:00Z",
    "updatedAt": "2024-11-06T00:00:00Z"
  }
]
```

#### 2.3 검색/필터 유틸리티 (`lib/utils/search.ts`)

```typescript
// lib/utils/search.ts
export interface Politician {
  id: string;
  name: string;
  party: string;
  position: string;
  region: string;
  evaluationScore: number;
  // ... other fields
}

export function filterPoliticians(
  politicians: Politician[],
  filters: {
    party?: string;
    region?: string;
    position?: string;
    search?: string;
  }
): Politician[] {
  let filtered = [...politicians];

  if (filters.party) {
    filtered = filtered.filter(p => p.party === filters.party);
  }

  if (filters.region) {
    filtered = filtered.filter(p => p.region === filters.region);
  }

  if (filters.position) {
    filtered = filtered.filter(p => p.position.includes(filters.position));
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(searchLower) ||
      p.party.toLowerCase().includes(searchLower) ||
      p.region.toLowerCase().includes(searchLower)
    );
  }

  return filtered;
}

export function sortPoliticians(
  politicians: Politician[],
  sortBy: 'name' | 'score' | 'recent'
): Politician[] {
  const sorted = [...politicians];

  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    case 'score':
      return sorted.sort((a, b) => b.evaluationScore - a.evaluationScore);
    case 'recent':
      return sorted; // Default order is recent
    default:
      return sorted;
  }
}

export function paginatePoliticians<T>(
  items: T[],
  page: number,
  limit: number
): { data: T[]; total: number; page: number; totalPages: number } {
  const start = (page - 1) * limit;
  const end = start + limit;
  const data = items.slice(start, end);

  return {
    data,
    total: items.length,
    page,
    totalPages: Math.ceil(items.length / limit),
  };
}
```

#### 2.4 API Route 구현

##### 2.4.1 정치인 목록 조회 (`app/api/politicians/route.ts`)

```typescript
// app/api/politicians/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { politiciansQuerySchema } from '@/lib/validators/politician';
import { filterPoliticians, sortPoliticians, paginatePoliticians } from '@/lib/utils/search';
import politiciansData from '@/lib/mock-data/politicians.json';

/**
 * GET /api/politicians
 * 정치인 목록 조회 (필터/검색/정렬/페이징 지원)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '20',
      party: searchParams.get('party') || undefined,
      region: searchParams.get('region') || undefined,
      position: searchParams.get('position') || undefined,
      search: searchParams.get('search') || undefined,
      sort: searchParams.get('sort') as 'name' | 'score' | 'recent' || 'score',
    };

    // 쿼리 파라미터 검증
    const validated = politiciansQuerySchema.parse(queryParams);

    // 필터링
    let filtered = filterPoliticians(politiciansData, {
      party: validated.party,
      region: validated.region,
      position: validated.position,
      search: validated.search,
    });

    // 정렬
    filtered = sortPoliticians(filtered, validated.sort);

    // 페이징
    const result = paginatePoliticians(
      filtered,
      parseInt(validated.page),
      parseInt(validated.limit)
    );

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        limit: parseInt(validated.limit),
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: '정치인 목록 조회 실패' },
      { status: 500 }
    );
  }
}
```

##### 2.4.2 정치인 상세 조회 (`app/api/politicians/[id]/route.ts`)

```typescript
// app/api/politicians/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import politiciansData from '@/lib/mock-data/politicians.json';

/**
 * GET /api/politicians/[id]
 * 정치인 상세 정보 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const politician = politiciansData.find(p => p.id === params.id);

    if (!politician) {
      return NextResponse.json(
        { success: false, error: '정치인을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // Mock: 조회수 증가 시뮬레이션
    const updatedPolitician = {
      ...politician,
      viewCount: politician.viewCount + 1,
    };

    return NextResponse.json({
      success: true,
      data: updatedPolitician,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '정치인 상세 조회 실패' },
      { status: 500 }
    );
  }
}
```

##### 2.4.3 관심 정치인 등록 (`app/api/politicians/[id]/favorite/route.ts`)

```typescript
// app/api/politicians/[id]/favorite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { favoritePoliticianSchema } from '@/lib/validators/politician';
import politiciansData from '@/lib/mock-data/politicians.json';

/**
 * POST /api/politicians/[id]/favorite
 * 관심 정치인 등록/해제
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = favoritePoliticianSchema.parse(body);

    const politician = politiciansData.find(p => p.id === params.id);

    if (!politician) {
      return NextResponse.json(
        { success: false, error: '정치인을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // Mock: 관심 등록 성공 시뮬레이션
    return NextResponse.json({
      success: true,
      message: '관심 정치인으로 등록되었습니다',
      data: {
        politicianId: params.id,
        userId: validated.userId,
        isFavorite: true,
        favoriteCount: politician.favoriteCount + 1,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: '관심 정치인 등록 실패' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/politicians/[id]/favorite
 * 관심 정치인 해제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '사용자 ID가 필요합니다' },
        { status: 400 }
      );
    }

    const politician = politiciansData.find(p => p.id === params.id);

    if (!politician) {
      return NextResponse.json(
        { success: false, error: '정치인을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // Mock: 관심 해제 성공 시뮬레이션
    return NextResponse.json({
      success: true,
      message: '관심 정치인이 해제되었습니다',
      data: {
        politicianId: params.id,
        userId,
        isFavorite: false,
        favoriteCount: Math.max(0, politician.favoriteCount - 1),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: '관심 정치인 해제 실패' },
      { status: 500 }
    );
  }
}
```

##### 2.4.4 정치인 본인인증 (`app/api/politicians/[id]/verify/route.ts`)

```typescript
// app/api/politicians/[id]/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyPoliticianSchema } from '@/lib/validators/politician';
import politiciansData from '@/lib/mock-data/politicians.json';

/**
 * POST /api/politicians/[id]/verify
 * 정치인 본인인증
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = verifyPoliticianSchema.parse(body);

    const politician = politiciansData.find(p => p.id === params.id);

    if (!politician) {
      return NextResponse.json(
        { success: false, error: '정치인을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // Mock: 본인인증 성공 시뮬레이션
    // 실제로는 이름, 생년월일, 전화번호, 인증코드를 검증해야 함
    const isVerificationSuccess = validated.verificationCode === '123456'; // Mock 인증 코드

    if (!isVerificationSuccess) {
      return NextResponse.json(
        { success: false, error: '인증 코드가 올바르지 않습니다' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '본인인증이 완료되었습니다',
      data: {
        politicianId: params.id,
        isVerified: true,
        verifiedAt: new Date().toISOString(),
        claimToken: 'mock-claim-token-' + params.id, // Mock 클레임 토큰
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: '본인인증 실패' },
      { status: 500 }
    );
  }
}
```

##### 2.4.5 AI 평가 조회/생성 (`app/api/politicians/[id]/evaluation/route.ts`)

```typescript
// app/api/politicians/[id]/evaluation/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createEvaluationSchema } from '@/lib/validators/politician';
import politiciansData from '@/lib/mock-data/politicians.json';
import evaluationsData from '@/lib/mock-data/evaluations.json';

/**
 * GET /api/politicians/[id]/evaluation
 * 정치인 AI 평가 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const politician = politiciansData.find(p => p.id === params.id);

    if (!politician) {
      return NextResponse.json(
        { success: false, error: '정치인을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // Mock: 평가 데이터 조회
    const evaluation = evaluationsData.find(e => e.politicianId === params.id);

    if (!evaluation) {
      return NextResponse.json(
        { success: false, error: '평가 데이터가 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: evaluation,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'AI 평가 조회 실패' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/politicians/[id]/evaluation
 * 정치인 AI 평가 생성 (트리거)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validated = createEvaluationSchema.parse(body);

    const politician = politiciansData.find(p => p.id === params.id);

    if (!politician) {
      return NextResponse.json(
        { success: false, error: '정치인을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // Mock: AI 평가 생성 큐에 추가 시뮬레이션
    return NextResponse.json({
      success: true,
      message: 'AI 평가가 생성 큐에 추가되었습니다',
      data: {
        politicianId: params.id,
        evaluatorType: validated.evaluatorType,
        jobId: 'mock-job-' + Date.now(),
        status: 'pending',
        estimatedTime: '2-3분',
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'AI 평가 생성 실패' },
      { status: 500 }
    );
  }
}
```

#### 2.6 Mock AI 평가 데이터 (`lib/mock-data/evaluations.json`)

```json
// lib/mock-data/evaluations.json
[
  {
    "id": "eval-001",
    "politicianId": "pol-001",
    "overallScore": 875,
    "grade": "S+",
    "categories": {
      "expertise": { "score": 92, "weight": 0.15 },
      "leadership": { "score": 88, "weight": 0.15 },
      "vision": { "score": 85, "weight": 0.10 },
      "integrity": { "score": 90, "weight": 0.15 },
      "ethics": { "score": 87, "weight": 0.10 },
      "responsibility": { "score": 89, "weight": 0.10 },
      "transparency": { "score": 86, "weight": 0.10 },
      "communication": { "score": 84, "weight": 0.05 },
      "responsiveness": { "score": 88, "weight": 0.05 },
      "efficiency": { "score": 91, "weight": 0.05 }
    },
    "evaluators": {
      "gpt": { "score": 880, "completedAt": "2024-11-01T10:00:00Z" },
      "claude": { "score": 875, "completedAt": "2024-11-01T10:05:00Z" },
      "gemini": { "score": 870, "completedAt": "2024-11-01T10:10:00Z" },
      "perplexity": { "score": 875, "completedAt": "2024-11-01T10:15:00Z" }
    },
    "summary": "서울시장으로서의 리더십과 행정 능력이 뛰어나며, 정책 추진력과 소통 능력이 우수함. 특히 도시개발 및 교통 분야에서 전문성을 인정받고 있음.",
    "strengths": [
      "도시행정 전문성",
      "정책 추진력",
      "리더십"
    ],
    "weaknesses": [
      "소통 스타일 개선 필요",
      "일부 정책의 속도 조절 필요"
    ],
    "updatedAt": "2024-11-06T00:00:00Z"
  }
]
```

---

### 3. 검증 단계

#### 3.1 API 테스트

**정치인 목록 조회 테스트:**
```bash
# 기본 목록 조회
curl http://localhost:3000/api/politicians

# 정당 필터
curl http://localhost:3000/api/politicians?party=국민의힘

# 지역 + 검색
curl http://localhost:3000/api/politicians?region=서울&search=오세훈

# 정렬 + 페이징
curl http://localhost:3000/api/politicians?sort=score&page=1&limit=10
```

**정치인 상세 조회 테스트:**
```bash
curl http://localhost:3000/api/politicians/pol-001
```

**관심 정치인 등록 테스트:**
```bash
curl -X POST http://localhost:3000/api/politicians/pol-001/favorite \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-123"}'
```

**본인인증 테스트:**
```bash
curl -X POST http://localhost:3000/api/politicians/pol-001/verify \
  -H "Content-Type: application/json" \
  -d '{
    "name":"오세훈",
    "birthDate":"1961-03-10",
    "phone":"010-1234-5678",
    "verificationCode":"123456"
  }'
```

**AI 평가 조회/생성 테스트:**
```bash
# 평가 조회
curl http://localhost:3000/api/politicians/pol-001/evaluation

# 평가 생성
curl -X POST http://localhost:3000/api/politicians/pol-001/evaluation \
  -H "Content-Type: application/json" \
  -d '{"politicianId":"pol-001","evaluatorType":"gpt"}'
```

#### 3.2 타입 체크 및 린트

```bash
# 타입 체크
npm run type-check

# 린트
npm run lint

# 빌드 테스트
npm run build
```

---

### 4. 완료 단계

1. **생성된 파일 목록 확인**
   - 6개 API Route 파일 생성 확인
   - Mock 데이터 파일 2개 생성 확인
   - Validator 파일 생성 확인
   - Utils 파일 생성 확인

2. **API 응답 검증**
   - 모든 엔드포인트 200/201 응답 확인
   - 에러 케이스 400/404/500 응답 확인
   - Mock 데이터 정상 반환 확인

3. **PROJECT GRID 상태 업데이트**
   - 작업 상태를 "완료"로 변경
   - 생성된 파일 목록 기록
   - 테스트 결과 기록

4. **다음 의존 작업에 영향 확인**
   - P1F1 (React 페이지)에서 이 API 사용 가능
   - API 엔드포인트 문서 공유

---

## ✅ 완료 기준

- [ ] 정치인 Mock API 6개가 정상적으로 구현됨
- [ ] 기대 결과물 10개 파일이 모두 생성됨
- [ ] 모든 API가 정상적으로 응답함 (200/201)
- [ ] 에러 처리가 적절히 구현됨 (400/404/500)
- [ ] Zod 검증이 올바르게 작동함
- [ ] Mock 데이터가 정확하게 반환됨
- [ ] 필터/검색/정렬/페이징이 정상 작동함
- [ ] 타입 체크 및 린트 통과
- [ ] 빌드가 성공적으로 완료됨
- [ ] PROJECT GRID 상태 업데이트 완료

---

**작업지시서 생성일**: 2025-11-06
**PROJECT GRID Version**: v4.0
