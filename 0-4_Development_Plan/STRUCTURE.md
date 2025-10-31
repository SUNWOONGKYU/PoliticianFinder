# PoliticianFinder 프로젝트 구조

PROJECT GRID V3.0의 **6개 영역(O/D/BI/BA/F/T)**에 따른 디렉토리 구조입니다.

## 📁 전체 구조

```
PoliticianFinder/
├── .github/workflows/      # [O] DevOps Area - CI/CD
├── scripts/                # [O] DevOps Area - 자동화 스크립트
├── supabase/               # [D] Database Area
│   ├── migrations/         # SQL 마이그레이션
│   ├── types/              # DB 타입 정의
│   └── seed/               # 초기 데이터
├── lib/                    # [BI] Backend Infrastructure Area
│   ├── supabase/           # Supabase 클라이언트
│   ├── utils/              # 유틸리티 함수
│   └── hooks/              # React 훅
├── app/api/                # [BA] Backend APIs Area
│   ├── auth/               # 인증 API
│   ├── politicians/        # 정치인 API
│   ├── community/          # 커뮤니티 API
│   └── users/              # 사용자 API
├── frontend/               # [F] Frontend Area
│   ├── src/
│   │   ├── app/            # Next.js App Router
│   │   ├── components/     # React 컴포넌트
│   │   ├── lib/            # Frontend 유틸리티
│   │   └── types/          # TypeScript 타입
│   ├── public/             # 정적 파일
│   └── package.json        # 의존성 관리
└── tests/                  # [T] Test Area
    ├── e2e/                # E2E 테스트
    ├── api/                # API 테스트
    └── unit/               # Unit 테스트
```

## 🎯 6개 개발 영역

### 1. DevOps Area (O)
**디렉토리**: `.github/workflows/`, `scripts/`  
**역할**: CI/CD, 배포, 스케줄러, 인프라 자동화  
**상세**: [.github/workflows/README.md](.github/workflows/README.md), [scripts/README.md](scripts/README.md)

### 2. Database Area (D)
**디렉토리**: `supabase/`  
**역할**: 스키마, 마이그레이션, 트리거, RLS 정책  
**상세**: [supabase/README.md](supabase/README.md)

### 3. Backend Infrastructure Area (BI)
**디렉토리**: `lib/`  
**역할**: 모든 API가 사용하는 기반 코드 (클라이언트, 미들웨어, 유틸리티)  
**상세**: [lib/README.md](lib/README.md)

### 4. Backend APIs Area (BA)
**디렉토리**: `app/api/`  
**역할**: 비즈니스 로직, REST API 엔드포인트  
**상세**: [app/api/README.md](app/api/README.md)

### 5. Frontend Area (F)
**디렉토리**: `frontend/`  
**역할**: UI, UX, 페이지, 컴포넌트  
**상세**: [frontend/README.md](frontend/README.md)

### 6. Test Area (T)
**디렉토리**: `tests/`  
**역할**: E2E, API, Unit 테스트  
**상세**: [tests/README.md](tests/README.md)

## 🔄 개발 순서

```
DevOps → Database → Backend Infrastructure
  → Backend APIs → Frontend → Test
```

**중요**: Backend Infrastructure 완료 후 → Backend APIs 개발 가능

## 📝 Task ID 규칙

모든 파일은 **Task ID 헤더**를 포함해야 합니다:

```
P{Phase}{Area}{Number}

예:
- P1O1: Phase 1, DevOps Area, Task 1
- P1D2: Phase 1, Database Area, Task 2
- P2BI3: Phase 2, Backend Infrastructure Area, Task 3
- P3BA5: Phase 3, Backend APIs Area, Task 5
- P4F7: Phase 4, Frontend Area, Task 7
- P5T2: Phase 5, Test Area, Task 2
```

## 🚀 시작하기

각 영역별 README 파일을 참고하여 개발을 진행합니다.

---

**Last updated**: 2025-10-30  
**PROJECT GRID Version**: V3.0
