# Real Data Transition Guide (실제 데이터 전환 가이드)

**문서 버전**: 1.0
**작성일**: 2025-10-21
**용도**: Mock Data → Real Data 전환
**상태**: 준비 완료

---

## 📋 개요

Mock Data 기반 개발을 완료한 후 실제 백엔드 API와 데이터베이스를 사용하는 프로덕션 환경으로 전환하기 위한 완전한 가이드입니다.

**목표**:
- ✅ Mock/Real 데이터 전환 자동화
- ✅ 최소 다운타임으로 전환
- ✅ 데이터 무결성 유지
- ✅ 빠른 롤백 가능

---

## 🔄 전환 경로

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   Mock Data → Real Data Transition Flow                │
│                                                         │
│  ┌──────────────┐   ┌────────────────┐   ┌──────────┐  │
│  │   Phase 3    │   │   Phase 4      │   │   Live   │  │
│  │   Complete   │──▶│   Transition   │──▶│  Deploy  │  │
│  │  (Mock Mode) │   │   (Testing)    │   │  (Real)  │  │
│  └──────────────┘   └────────────────┘   └──────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📍 Step 1: Pre-Transition Preparation (사전 준비)

### 1.1 시스템 요구사항 확인

```bash
# 백엔드 시스템 확인
✅ Django API 서버 준비
✅ PostgreSQL/MySQL 데이터베이스 준비
✅ Supabase 계정 생성 (옵션)

# 프론트엔드 시스템 확인
✅ Node.js v18+
✅ npm v9+
✅ Next.js v15.5.5+
✅ React v19.1.0+
```

---

### 1.2 환경 변수 준비

```bash
# 1. 프로덕션 환경 변수 파일 생성
cd frontend
cp .env.local .env.production.local

# 2. 실제 API 엔드포인트로 업데이트
cat > .env.production.local << 'EOF'
# Real Data Mode
NEXT_PUBLIC_USE_MOCK_DATA=false

# Real API Configuration
NEXT_PUBLIC_API_URL=https://api.politicianfinder.com
# 또는 로컬 백엔드
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://politicianfinder.com
NEXT_PUBLIC_SITE_NAME=정치인 찾기 - PoliticianFinder

# API Settings
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_MAX_RETRIES=3

# Authentication
NEXT_PUBLIC_AUTH_ENABLED=true
EOF

# 3. 환경 변수 확인
grep NEXT_PUBLIC .env.production.local
```

---

### 1.3 데이터 마이그레이션 전략 수립

```bash
# 마이그레이션 계획:

# Step 1: Mock 데이터 백업
rsync -av frontend/src/lib/api/mock-adapter.ts backup/mock-adapter.backup.ts
rsync -av frontend/src/lib/api/politicians-mock.ts backup/politicians-mock.backup.ts

# Step 2: 실제 데이터 로드
# (백엔드 API에서 데이터 제공)

# Step 3: 데이터 검증
# (실제 데이터가 Mock 데이터와 동일한 구조인지 확인)

# Step 4: 프론트엔드 전환
# (환경 변수 변경 및 테스트)

# Step 5: 모니터링 및 롤백 대기
```

---

## 📍 Step 2: Backend API Preparation (백엔드 API 준비)

### 2.1 Django API 서버 확인

```bash
# 1. API 서버 실행 (개발 모드)
cd api
python manage.py runserver 0.0.0.0:8000

# 2. 주요 엔드포인트 확인
curl http://localhost:8000/api/v1/politicians
curl http://localhost:8000/api/v1/politicians/1
curl http://localhost:8000/api/v1/ratings
curl http://localhost:8000/api/v1/comments

# 3. API 응답 형식 확인
# 예상 응답:
{
  "data": [...],
  "total": 100,
  "page": 1,
  "pageSize": 12
}
```

---

### 2.2 API 엔드포인트 검증

```bash
# 검증 항목:

# ✅ GET /api/v1/politicians
# 응답: 정치인 목록 (최소 6명 이상)

# ✅ GET /api/v1/politicians/{id}
# 응답: 정치인 상세 정보

# ✅ GET /api/v1/ratings
# 응답: 평가 목록

# ✅ GET /api/v1/comments
# 응답: 댓글 목록

# ✅ GET /api/v1/search?q=keyword
# 응답: 검색 결과

# ✅ POST /api/v1/ratings (인증 필요)
# 요청: { politician_id, user_id, score, type }
# 응답: { id, status: "success" }

# 검증 스크립트:
python3 << 'EOF'
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

endpoints = [
    ("GET", "/politicians"),
    ("GET", "/politicians/1"),
    ("GET", "/ratings"),
    ("GET", "/comments"),
    ("GET", "/search?q=Lee"),
]

for method, endpoint in endpoints:
    url = BASE_URL + endpoint
    response = requests.request(method, url)
    print(f"{method} {endpoint}: {response.status_code}")
    if response.status_code == 200:
        print(f"  ✅ PASS")
    else:
        print(f"  ❌ FAIL - {response.text}")
EOF
```

---

### 2.3 데이터 품질 확인

```bash
# 1. 실제 데이터 샘플 확인
curl http://localhost:8000/api/v1/politicians?limit=5 | python -m json.tool

# 2. 필수 필드 확인
# 정치인 정보:
# - id: 숫자
# - name: 문자열
# - party: 열거형
# - position: 문자열
# - region: 문자열
# - avg_rating: 소수점 1자리
# - bio: 문자열
# - category_id: 숫자

# 3. 데이터 타입 일치성 확인
# Mock 데이터와 동일한 구조인지 확인
```

---

## 📍 Step 3: Frontend Configuration (프론트엔드 설정)

### 3.1 API Adapter 수정

```typescript
// src/lib/api/home.ts 수정

// 변경 전:
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false';

export async function getHomeData() {
  if (USE_MOCK_DATA) {
    return mockAdapter.getHomeData();
  } else {
    // 실제 API 호출
    const response = await fetch(`${API_URL}/home`);
    return response.json();
  }
}

// 변경 후 (더 견고한 버전):
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function getHomeData() {
  if (USE_MOCK_DATA) {
    // Mock 모드
    return mockAdapter.getHomeData();
  } else {
    // Real API 모드
    try {
      const response = await fetch(`${API_URL}/home`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000'),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch home data:', error);
      // 폴백: Mock 데이터로 전환 (선택사항)
      return mockAdapter.getHomeData();
    }
  }
}
```

---

### 3.2 에러 처리 강화

```typescript
// src/lib/api/error-handler.ts (새 파일)

interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

export class ApiErrorHandler {
  static handle(error: unknown): ApiError {
    if (error instanceof Response) {
      return {
        code: `HTTP_${error.status}`,
        message: error.statusText,
        statusCode: error.status,
        timestamp: new Date().toISOString(),
      };
    }

    if (error instanceof Error) {
      return {
        code: 'NETWORK_ERROR',
        message: error.message,
        statusCode: 0,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      statusCode: 0,
      timestamp: new Date().toISOString(),
    };
  }

  static isRetryable(error: ApiError): boolean {
    // 재시도 가능한 에러:
    // - 5xx 서버 에러
    // - 429 Too Many Requests
    // - 503 Service Unavailable
    return [500, 502, 503, 429].includes(error.statusCode);
  }
}
```

---

### 3.3 인증 토큰 처리

```typescript
// src/lib/api/auth.ts (수정)

export function getAuthToken(): string | null {
  // 로컬 스토리지에서 토큰 조회
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
}

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', token);
  }
}

export function clearAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
  }
}

// API 호출 시 인증 헤더 자동 추가
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getAuthToken();

  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
```

---

## 📍 Step 4: Testing Phase (테스팅 단계)

### 4.1 통합 테스트

```bash
# 1. 환경 변수 설정 (실제 API 모드)
cd frontend
NEXT_PUBLIC_USE_MOCK_DATA=false NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1 npm run dev

# 2. 주요 기능 테스트
# 테스트 1: 정치인 목록 로드
# - 예상: 6명 이상 표시
# - 확인: Network 탭에서 /api/v1/politicians 요청 확인

# 테스트 2: 검색 기능
# - 예상: 실제 데이터로 검색 결과 반환
# - 확인: 검색어 "Lee" 입력 시 결과 표시

# 테스트 3: 필터 기능
# - 예상: 실제 정당/지역별 필터 작동
# - 확인: 필터 선택 시 해당 정치인만 표시

# 테스트 4: 페이지네이션
# - 예상: 페이지 이동 시 실제 데이터 로드
# - 확인: 페이지 2 선택 시 다른 정치인 표시
```

---

### 4.2 성능 모니터링

```bash
# 1. Network 성능 (브라우저 개발도구)
# - Resources 탭에서 API 응답 시간 확인
# - 목표: < 1초 (로컬), < 3초 (클라우드)

# 2. 렌더링 성능 (Performance 탭)
# - Record 시작
# - 페이지 새로고침
# - Record 중지
# - 확인: First Contentful Paint (FCP) < 2초

# 3. 메모리 사용 (Memory 탭)
# - Heap snapshot 캡처
# - 목표: < 50MB
```

---

### 4.3 에러 처리 테스트

```bash
# 1. 네트워크 오류 시뮬레이션
# - 브라우저 개발도구 → Network 탭 → "Offline" 선택
# - 예상: 에러 메시지 표시 또는 폴백 작동

# 2. API 서버 중지
# - Django 서버 중지
# - 페이지 새로고침
# - 예상: 사용자 친화적 에러 메시지

# 3. 인증 토큰 만료
# - localStorage에서 authToken 삭제
# - 권한이 필요한 기능 실행 (예: 평가 작성)
# - 예상: 로그인 페이지로 리다이렉트
```

---

### 4.4 회귀 테스트

```bash
# Mock 데이터 모드 검증 (전환 후에도 작동 확인)

# 1. Mock 모드로 복원
NEXT_PUBLIC_USE_MOCK_DATA=true npm run dev

# 2. 주요 기능 재테스트
# - 홈페이지 로드
# - 검색 기능
# - 필터 기능
# - 페이지네이션

# 3. 확인
# ✅ Mock 모드에서도 모두 정상 작동 확인
```

---

## 📍 Step 5: Production Deployment (프로덕션 배포)

### 5.1 배포 전 체크리스트

```bash
# ✅ 모든 테스트 통과 확인
[ ] 통합 테스트 완료
[ ] 성능 테스트 통과
[ ] 에러 처리 검증
[ ] 회귀 테스트 통과

# ✅ 환경 설정 확인
[ ] NEXT_PUBLIC_USE_MOCK_DATA=false
[ ] NEXT_PUBLIC_API_URL 설정
[ ] 인증 토큰 관리 시스템 준비
[ ] 에러 로깅 시스템 준비

# ✅ 문서 준비
[ ] API 문서 (엔드포인트, 인증, 에러 코드)
[ ] 배포 후 모니터링 계획
[ ] 롤백 절차 수립
```

---

### 5.2 프로덕션 빌드

```bash
# 1. 프로덕션 환경 변수 확인
cd frontend
cat .env.production.local

# 2. 빌드 실행
npm run build

# 3. 빌드 결과 확인
# - .next 디렉토리 생성 확인
# - 빌드 오류 없음 확인
# - 번들 크기 확인 (권장: < 500KB)

# 4. 프로덕션 서버 시뮬레이션
npm run start

# 5. 프로덕션 페이지 테스트
# - http://localhost:3000 접속
# - 실제 API에서 데이터 로드 확인
```

---

### 5.3 배포 실행

```bash
# Vercel 배포 (권장)
vercel --prod

# 또는 Docker 배포
docker build -t politicianfinder:prod .
docker run -p 3000:3000 politicianfinder:prod

# 또는 클라우드 플랫폼 (AWS, GCP, Azure)
# 해당 플랫폼의 배포 가이드 참고
```

---

## 📍 Step 6: Post-Deployment Monitoring (배포 후 모니터링)

### 6.1 실시간 모니터링

```bash
# 1. 에러 로깅 확인
# - 에러 추적 서비스 (Sentry, LogRocket 등) 확인
# - 예상: 0개의 크리티컬 에러

# 2. 성능 메트릭 확인
# - Core Web Vitals (LCP, FID, CLS)
# - API 응답 시간
# - 페이지 로딩 시간

# 3. 사용자 행동 분석
# - 활성 사용자 수
# - 주요 기능 사용률
# - 에러 발생 패턴
```

---

### 6.2 알림 설정

```bash
# 에러 알림
- API 응답 시간 > 5초: 알림
- 에러율 > 1%: 알림
- 다운타임: 즉시 알림

# 성능 알림
- LCP > 3초: 경고
- FID > 100ms: 경고
- CLS > 0.1: 경고
```

---

## 🔄 Emergency Rollback (긴급 롤백)

### 롤백 절차

```bash
# Step 1: 즉시 전환 (Mock 모드로 복귀)
# 1-1. 환경 변수 변경
NEXT_PUBLIC_USE_MOCK_DATA=true

# 1-2. 애플리케이션 재배포
vercel --prod

# 또는 수동 재배포
npm run build && npm run start

# Step 2: 근본 원인 파악
# - 에러 로그 분석
# - API 상태 확인
# - 데이터베이스 연결 확인

# Step 3: 수정 및 재배포
# - 문제 해결
# - 테스트 재실행
# - 프로덕션 재배포
```

---

### 롤백 테스트 (미리 실행)

```bash
# 정기적으로 롤백 절차 테스트
# 주기: 월 1회

# 1. Mock 모드 빌드 및 배포
# 2. 모든 기능 정상 작동 확인
# 3. 총 시간 측정 (목표: < 15분)
```

---

## 📊 전환 체크리스트

### Pre-Transition
- [ ] 백엔드 API 서버 준비 완료
- [ ] 데이터베이스 준비 완료
- [ ] 환경 변수 파일 준비 완료
- [ ] 데이터 마이그레이션 계획 수립

### Testing Phase
- [ ] 모든 API 엔드포인트 검증
- [ ] 데이터 품질 확인
- [ ] 실제 API 모드 통합 테스트
- [ ] 성능 모니터링
- [ ] 에러 처리 테스트
- [ ] 회귀 테스트 (Mock 모드 재확인)

### Production Deployment
- [ ] 프로덕션 빌드 성공
- [ ] 배포 전 체크리스트 완료
- [ ] 배포 실행
- [ ] 초기 모니터링 (첫 1시간)

### Post-Deployment
- [ ] 실시간 모니터링 설정
- [ ] 알림 설정 확인
- [ ] 롤백 절차 확인
- [ ] 정기적 점검

---

## 📁 관련 파일

| 파일 | 경로 | 용도 |
|-----|------|------|
| Mock Adapter | frontend/src/lib/api/mock-adapter.ts | Mock 데이터 (유지) |
| API Adapter | frontend/src/lib/api/home.ts | Real API 호출 (수정) |
| 에러 처리 | frontend/src/lib/api/error-handler.ts | 에러 관리 (신규) |
| 인증 | frontend/src/lib/api/auth.ts | 토큰 관리 (수정) |
| 환경 설정 | frontend/.env.production.local | 프로덕션 변수 (신규) |

---

## ⚠️ 주의사항

1. **데이터 무결성**
   - 전환 전에 데이터 백업 필수
   - 검증 프로세스 생략 금지

2. **성능 저하 주의**
   - 실제 API는 Mock보다 느릴 수 있음
   - 캐싱 전략 사전 수립

3. **보안**
   - 인증 토큰 안전하게 저장
   - 민감 정보 클라이언트에 노출 금지
   - HTTPS 반드시 사용

4. **모니터링**
   - 배포 후 24시간 집중 모니터링
   - 에러율 급증 시 즉시 롤백

---

**전환 준비 상태**: ✅ 준비 완료
**마지막 업데이트**: 2025-10-21
**버전**: 1.0 (검증됨)
