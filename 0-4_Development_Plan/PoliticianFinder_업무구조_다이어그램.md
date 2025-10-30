# PoliticianFinder 개발 업무 구조 다이어그램

**작성일**: 2025-10-30
**총 업무 수**: 144개 (7 Phases)
**기준**: 의존성·병렬성·인접성 고려한 기술적 배치

---

## 1. 전체 단계(Phase) 흐름도

```mermaid
graph TB
    subgraph "1단계(Phase 1): 인증 시스템 (20개)"
        P1[DevOps → Database → Infrastructure → APIs → Frontend → Security → Test]
    end

    subgraph "2단계(Phase 2): 정치인 시스템 (24개)"
        P2[Database → Backend Utilities → APIs → Frontend → Test/Security/DevOps]
    end

    subgraph "3단계(Phase 3): 커뮤니티 시스템 (32개)"
        P3[Database → Backend Utilities → APIs → Frontend → Test/Security/DevOps]
    end

    subgraph "4단계(Phase 4): 등급/포인트 시스템 (14개)"
        P4[Database → Backend APIs → Frontend → Test/DevOps]
    end

    subgraph "5단계(Phase 5): 결제/본인인증 (12개)"
        P5[Database → Backend APIs → Frontend → Test/Security]
    end

    subgraph "6단계(Phase 6): 관리자/부가기능 (24개)"
        P6[Database → Backend Infrastructure → APIs → Frontend → Test/Security/DevOps]
    end

    subgraph "7단계(Phase 7): 배포 및 최적화 (18개)"
        P7[Backend/Frontend 병렬 → Database → Test/Security → DevOps]
    end

    P1 ==> P2
    P2 ==> P3
    P3 ==> P4
    P4 ==> P5
    P5 ==> P6
    P6 ==> P7

    style P1 fill:#e3f2fd
    style P2 fill:#f3e5f5
    style P3 fill:#fff3e0
    style P4 fill:#e8f5e9
    style P5 fill:#fce4ec
    style P6 fill:#f1f8e9
    style P7 fill:#e0f2f1
```

---

## 2. 개발 영역(Area) 아키텍처

```mermaid
graph TD
    A[DevOps 영역<br/>프로젝트 초기화, CI/CD, 스케줄러] --> B[Database 영역<br/>스키마, 마이그레이션, 트리거, 타입]
    B --> C[Backend Infrastructure 영역<br/>클라이언트, 미들웨어, 보안 설정]
    C --> D[Backend APIs 영역<br/>비즈니스 로직, REST APIs]
    D --> E[Frontend 영역<br/>UI, UX, 페이지, 컴포넌트]
    E --> F[Security (별도 영역 아님)<br/>각 영역에 통합됨: 보안 설정, 검증, 암호화]
    F --> G[Test 영역<br/>E2E, API 테스트, 부하 테스트]

    style A fill:#ffebee
    style B fill:#e3f2fd
    style C fill:#f3e5f5
    style D fill:#fff3e0
    style E fill:#e8f5e9
    style F fill:#fce4ec
    style G fill:#f1f8e9
```

---

## 3. 1단계(Phase 1) 상세 의존성 다이어그램 (20개)

```mermaid
graph TD
    %% DevOps
    T1[1. 프로젝트 초기화 ⚡]

    %% Database
    T2[2. 인증 스키마 ⬅️]
    T3[3. 트리거 ⬅️]
    T4[4. 시드 데이터 ⬅️]
    T5[5. 타입 생성 ⬅️]
    T6[6. Supabase 프로젝트 설정 ⬅️]

    %% Backend Infrastructure
    T7[7. Supabase 클라이언트 ⬅️]
    T8[8. API 미들웨어 ⚡]

    %% Backend APIs
    T9[9. 회원가입 API ⬅️]
    T10[10. 로그인 API ⬅️]
    T11[11. 구글 OAuth API ⬅️]
    T12[12. 비밀번호 재설정 API ⬅️]

    %% Frontend
    T13[13. 전역 레이아웃 ⬅️]
    T14[14. 홈 페이지 ⬅️]
    T15[15. 회원가입 페이지 ⬅️]
    T16[16. 로그인 페이지 ⬅️]
    T17[17. 비밀번호 재설정 페이지 ⬅️]

    %% Security
    T18[18. 인증 보안 설정 ⚡]

    %% Test
    T19[19. 인증 E2E 테스트 ⬅️]
    T20[20. 인증 API 테스트 ⬅️]

    %% 의존성
    T1 --> T2
    T2 --> T3
    T2 --> T4
    T2 --> T5
    T2 --> T6
    T2 --> T7
    T5 --> T7
    T6 --> T7

    T7 --> T9
    T7 --> T10
    T7 --> T11
    T7 --> T12
    T8 --> T9
    T8 --> T10
    T8 --> T11
    T8 --> T12

    T7 --> T13
    T13 --> T14
    T9 --> T15
    T13 --> T15
    T10 --> T16
    T11 --> T16
    T13 --> T16
    T12 --> T17
    T13 --> T17

    T15 --> T19
    T16 --> T19
    T17 --> T19
    T9 --> T20
    T10 --> T20
    T11 --> T20
    T12 --> T20

    style T1 fill:#ffebee
    style T2 fill:#e3f2fd
    style T3 fill:#e3f2fd
    style T4 fill:#e3f2fd
    style T5 fill:#e3f2fd
    style T6 fill:#e3f2fd
    style T7 fill:#f3e5f5
    style T8 fill:#f3e5f5
    style T9 fill:#fff3e0
    style T10 fill:#fff3e0
    style T11 fill:#fff3e0
    style T12 fill:#fff3e0
    style T13 fill:#e8f5e9
    style T14 fill:#e8f5e9
    style T15 fill:#e8f5e9
    style T16 fill:#e8f5e9
    style T17 fill:#e8f5e9
    style T18 fill:#fce4ec
    style T19 fill:#f1f8e9
    style T20 fill:#f1f8e9
```

---

## 4. Phase별 작업 분류 및 통계

```mermaid
pie title 단계(Phase)별 작업 분포
    "1단계 인증" : 20
    "2단계 정치인" : 24
    "3단계 커뮤니티" : 32
    "4단계 등급/포인트" : 14
    "5단계 결제" : 12
    "6단계 관리자" : 24
    "7단계 배포" : 18
```

---

## 5. 개발 영역(Area)별 작업 분포 (전체 144개)

```mermaid
pie title 개발 영역(Area)별 작업 분포
    "Frontend (F)" : 36
    "Backend APIs (B)" : 35
    "Database (D)" : 30
    "Test (T)" : 18
    "Security (S)" : 9
    "DevOps (O)" : 10
    "Backend Utilities" : 6
```

---

## 6. 2-7단계(Phase 2-7) 간략 구조

### 2단계(Phase 2): 정치인 시스템 (24개)

```mermaid
graph LR
    subgraph Database[Database: 7개]
        D1[정치인 스키마]
        D2[관심 정치인]
        D3[AI 평가]
        D4[트리거]
    end

    subgraph Backend[Backend: 10개]
        B1[정치인 API]
        B2[AI 평가 연동]
        B3[크롤링 스크립트]
        B4[데이터 유틸]
    end

    subgraph Frontend[Frontend: 3개]
        F1[정치인 목록]
        F2[정치인 상세]
        F3[관심 정치인]
    end

    subgraph Others[Test/Security/DevOps: 4개]
        O1[E2E 테스트]
        O2[API 테스트]
        O3[보안 설정]
        O4[크롤링 스케줄러]
    end

    Database --> Backend
    Backend --> Frontend
    Frontend --> Others
```

### 3단계(Phase 3): 커뮤니티 시스템 (32개)

```mermaid
graph LR
    subgraph Database[Database: 8개]
        D1[게시글 스키마]
        D2[댓글 스키마]
        D3[공감/공유]
        D4[팔로우]
        D5[알림]
        D6[트리거]
    end

    subgraph Backend[Backend: 12개]
        B1[게시글 API]
        B2[댓글 API]
        B3[공감/공유 API]
        B4[팔로우 API]
        B5[알림 API]
        B6[유틸리티]
    end

    subgraph Frontend[Frontend: 6개]
        F1[커뮤니티 메인]
        F2[게시글 상세 2종]
        F3[글쓰기 2종]
        F4[알림 페이지]
    end

    subgraph Others[Test/Security/DevOps: 6개]
        O1[E2E 테스트]
        O2[API 테스트 3종]
        O3[보안]
        O4[스케줄러]
    end

    Database --> Backend
    Backend --> Frontend
    Frontend --> Others
```

### 4단계(Phase 4): 등급/포인트 시스템 (14개)

```mermaid
graph LR
    subgraph Database[Database: 3개]
        D1[포인트 스키마]
        D2[등급 스키마]
        D3[트리거]
    end

    subgraph Backend[Backend: 5개]
        B1[포인트 API]
        B2[등급 계산 API]
        B3[프로필 API]
    end

    subgraph Frontend[Frontend: 3개]
        F1[마이페이지]
        F2[프로필 수정]
        F3[설정]
    end

    subgraph Others[Test/DevOps: 3개]
        O1[E2E 테스트]
        O2[API 테스트]
        O3[스케줄러]
    end

    Database --> Backend
    Backend --> Frontend
    Frontend --> Others
```

### 5단계(Phase 5): 결제/본인인증 (12개)

```mermaid
graph LR
    subgraph Database[Database: 2개]
        D1[결제 스키마]
        D2[리포트 스키마]
    end

    subgraph Backend[Backend: 5개]
        B1[결제 API]
        B2[주문 조회]
        B3[PDF 생성]
        B4[PDF 다운로드]
    end

    subgraph Frontend[Frontend: 2개]
        F1[결제 페이지]
        F2[계좌이체 안내]
    end

    subgraph Others[Test/Security: 3개]
        O1[E2E 테스트]
        O2[API 테스트]
        O3[결제 보안]
    end

    Database --> Backend
    Backend --> Frontend
    Frontend --> Others
```

### 6단계(Phase 6): 관리자/부가기능 (24개)

```mermaid
graph LR
    subgraph Database[Database: 3개]
        D1[관리자 스키마]
        D2[검색 최적화]
        D3[타입 업데이트]
    end

    subgraph Backend[Backend: 9개]
        B1[관리자 API 5종]
        B2[통합 검색 API]
        B3[약관 페이지]
        B4[관리자 미들웨어]
    end

    subgraph Frontend[Frontend: 7개]
        F1[관리자 대시보드]
        F2[회원 관리]
        F3[정치인 관리]
        F4[신고 관리]
        F5[검색/서비스/고객센터]
    end

    subgraph Others[Test/Security/DevOps: 5개]
        O1[E2E 테스트]
        O2[API 테스트]
        O3[관리자 보안]
        O4[로그 수집]
    end

    Database --> Backend
    Backend --> Frontend
    Frontend --> Others
```

### 7단계(Phase 7): 배포 및 최적화 (18개)

```mermaid
graph TD
    subgraph Parallel[Backend/Frontend 병렬: 9개]
        B1[헬스 체크]
        B2[캐싱 설정]
        B3[API 문서]
        B4[에러 핸들러]
        F1[PWA 설정]
        F2[SEO 설정]
        F3[404/500 페이지]
    end

    subgraph Database[Database: 2개]
        D1[DB 최적화]
        D2[백업 설정]
    end

    subgraph TestSec[Test/Security: 5개]
        T1[전체 E2E]
        T2[부하 테스트]
        T3[보안 테스트]
        T4[보안 최종 점검]
        T5[의존성 스캔]
    end

    subgraph DevOps[DevOps: 2개]
        O1[Vercel 배포]
        O2[CI/CD 파이프라인]
    end

    Parallel --> Database
    Database --> TestSec
    TestSec --> DevOps
```

---

## 7. 병렬 처리 가능 작업 (⚡ 표시)

전체 144개 중 **병렬 처리 가능한 작업**: 약 45개

### 병렬 가능 작업 분류:

1. **Phase 1**: Task 1, 8, 18 (3개)
2. **Phase 2**: 대부분의 Database 스키마 (병렬: 7개)
3. **Phase 3**: 대부분의 Database 스키마 (병렬: 7개)
4. **Phase 4-7**: 독립적인 유틸리티, 보안 설정, DevOps 작업 (병렬: 약 28개)

```mermaid
gantt
    title 병렬 처리 예시 (Phase 1)
    dateFormat YYYY-MM-DD
    section DevOps
    프로젝트 초기화 ⚡    :done, t1, 2025-01-01, 1d
    section Database
    인증 스키마           :done, t2, after t1, 1d
    트리거/시드/타입/설정 ⚡ :done, t3, after t2, 1d
    section Infrastructure
    클라이언트/미들웨어 ⚡  :done, t4, after t3, 1d
    section APIs
    4개 API 병렬 ⚡        :done, t5, after t4, 1d
    section Frontend
    레이아웃 → 5개 페이지  :done, t6, after t5, 2d
    section Security/Test
    보안 + E2E + API 테스트 ⚡ :done, t7, after t6, 1d
```

---

## 8. 의존성 체인 요약

### Critical Path (주요 의존성 체인):

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7
   ↓         ↓         ↓         ↓         ↓         ↓         ↓
DevOps    Database  Database  Database  Database  Database  Backend/Frontend 병렬
   ↓         ↓         ↓         ↓         ↓         ↓         ↓
Database  Backend   Backend   Backend   Backend   Backend   Database
   ↓         ↓         ↓         ↓         ↓         ↓         ↓
Infra     Frontend  Frontend  Frontend  Frontend  Frontend  Test/Security
   ↓         ↓         ↓         ↓         ↓         ↓         ↓
APIs      Test      Test      Test      Test      Test      DevOps
   ↓
Frontend
   ↓
Test
```

---

## 9. 기술 스택 의존성

```mermaid
graph TB
    subgraph "Core"
        A[Next.js 14 + TypeScript]
        B[Tailwind CSS]
    end

    subgraph "Backend"
        C[Supabase]
        D[PostgreSQL]
        E[Redis Upstash]
    end

    subgraph "Frontend Libraries"
        F[Chart.js]
        G[Tiptap/Quill]
        H[DOMPurify]
    end

    subgraph "External Services"
        I[AI 평가 엔진 API]
        J[선관위 API]
    end

    subgraph "DevOps"
        K[Vercel]
        L[GitHub Actions]
        M[Sentry]
    end

    A --> C
    A --> F
    A --> G
    C --> D
    A --> E
    C --> I
    C --> J
    A --> K
    K --> L
    K --> M

    style A fill:#e3f2fd
    style C fill:#f3e5f5
    style I fill:#fff3e0
    style K fill:#e8f5e9
```

---

## 10. HTML 목업 대조표

**29개 HTML 파일 → 36개 Frontend 생성파일 (+ 108개 Backend/Database/Test/DevOps)**

```mermaid
graph LR
    subgraph "HTML 목업 (29개)"
        H1[29개 HTML 파일]
    end

    subgraph "생성파일 (144개)"
        F[Frontend: 36개]
        B[Backend APIs: 35개]
        D[Database: 30개]
        T[Test: 18개]
        S[Security: 9개]
        O[DevOps: 10개]
        U[Utilities: 6개]
    end

    H1 --> F
    F --> B
    B --> D
    D --> T
    T --> S
    S --> O
    B --> U
```

---

## 범례

- **⚡ 병렬 처리 가능**: 다른 작업과 동시에 진행 가능
- **⬅️ 의존성 있음**: 특정 작업 완료 후 진행
- **🔗 그룹**: 연관된 작업들의 묶음
- **(← 번호)**: 의존하는 작업 번호

---

## 개발 영역(Area) 색상 코드

- 🔴 **DevOps 영역**: 프로젝트 기반, CI/CD, 스케줄러
- 🔵 **Database 영역**: 스키마, 마이그레이션, 트리거
- 🟣 **Backend Infrastructure 영역**: 클라이언트, 미들웨어
- 🟠 **Backend APIs 영역**: 비즈니스 로직, REST APIs
- 🟢 **Frontend 영역**: UI, UX, 페이지
- 🟡 **Security** (별도 영역 아님): 각 영역에 통합됨 - 보안 설정, 검증, 암호화
- 🟤 **Test 영역**: E2E, API 테스트, 부하 테스트

---

**생성일**: 2025-10-30
**원본 문서**: `PoliticianFinder_개발업무_최종.md`
**총 144개 생성파일** = 20 (P1) + 24 (P2) + 32 (P3) + 14 (P4) + 12 (P5) + 24 (P6) + 18 (P7)
