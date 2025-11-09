# PROJECT_GRID_REVISED - 표준 폴더 구조

**생성일**: 2025-11-06
**버전**: v1.0

---

## 📁 프로젝트 루트 구조

```
Developement_Real_PoliticianFinder/
├── 0-1_Project_Plan/              # 프로젝트 계획 문서
├── 0-2_UIUX_Design/               # UI/UX 디자인 파일
├── 0-3_AI_Eva/                    # AI 평가 관련
├── 0-4_Database/                  # Database 문서
├── 0-5_Development_ProjectGrid/   # PROJECT GRID 시스템
├── 1_Frontend/                    # Frontend 소스코드 ⭐
├── 2_Backend_Infrastructure/      # Backend 기반 코드 ⭐
├── 3_Backend_APIs/                # Backend API 코드 ⭐
├── 4_Database/                    # Database 마이그레이션 ⭐
├── 5_DevOps/                      # DevOps 설정 파일 ⭐
└── 6_Test/                        # 테스트 코드 ⭐
```

---

## 🎯 Area별 저장 경로 규칙

### **F (Frontend)**

**루트**: `1_Frontend/src/`

```
1_Frontend/
├── src/
│   ├── app/                       # Next.js App Router 페이지
│   │   ├── page.tsx              # 홈페이지
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── password-reset/page.tsx
│   │   ├── politicians/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── community/
│   │   │   ├── page.tsx
│   │   │   └── posts/
│   │   ├── admin/
│   │   └── ...
│   ├── components/               # React 컴포넌트
│   │   ├── common/
│   │   ├── layout/
│   │   └── ...
│   ├── lib/                      # 유틸리티 (클라이언트용)
│   ├── styles/                   # 스타일 파일
│   └── types/                    # TypeScript 타입
├── public/                       # 정적 파일
└── __tests__/                    # Frontend 테스트
```

**Task ID 예시**:
- P1F1 → `1_Frontend/src/app/**/*.tsx` (35개 페이지)

---

### **BI (Backend Infrastructure)**

**루트**: `2_Backend_Infrastructure/`

```
2_Backend_Infrastructure/
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # P1BI1: Supabase 클라이언트
│   │   └── server.ts
│   ├── middleware/
│   │   ├── auth.ts               # P1BI2: 인증 미들웨어
│   │   └── error-handler.ts
│   └── utils/                    # 공통 유틸리티
├── types/
│   └── database.ts               # P1BI3: Database Types
└── config/
    └── supabase.config.ts
```

**Task ID 예시**:
- P1BI1 → `2_Backend_Infrastructure/lib/supabase/client.ts`, `server.ts`
- P1BI2 → `2_Backend_Infrastructure/lib/middleware/auth.ts`
- P1BI3 → `2_Backend_Infrastructure/types/database.ts`

---

### **BA (Backend APIs)**

**루트**: `3_Backend_APIs/`

```
3_Backend_APIs/
├── app/
│   └── api/                      # Next.js API Routes
│       ├── auth/
│       │   ├── signup/route.ts
│       │   ├── login/route.ts
│       │   ├── logout/route.ts
│       │   ├── refresh/route.ts
│       │   ├── password-reset/route.ts
│       │   └── google/
│       │       └── callback/route.ts
│       ├── politicians/
│       │   ├── route.ts
│       │   ├── [id]/route.ts
│       │   ├── [id]/favorite/route.ts
│       │   ├── [id]/ai-evaluation/route.ts
│       │   └── verify/route.ts
│       ├── posts/
│       │   ├── route.ts
│       │   ├── [id]/route.ts
│       │   ├── [id]/comments/route.ts
│       │   ├── [id]/like/route.ts
│       │   └── [id]/share/route.ts
│       ├── users/
│       │   └── [id]/follow/route.ts
│       ├── notifications/
│       │   └── route.ts
│       ├── reports/
│       │   └── route.ts
│       └── admin/
│           ├── stats/route.ts
│           ├── users/[id]/route.ts
│           ├── auto-moderate/route.ts
│           ├── audit-logs/route.ts
│           ├── advertisements/route.ts
│           ├── policies/route.ts
│           ├── notification-templates/route.ts
│           ├── system-settings/route.ts
│           └── action-logs/route.ts
├── lib/
│   ├── utils/                    # API 헬퍼
│   │   ├── image-upload.ts       # P4BA3
│   │   ├── file-upload.ts        # P4BA4
│   │   ├── profanity-filter.ts   # P4BA5
│   │   └── notification-helper.ts # P4BA6
│   ├── moderation/               # 자동 중재 시스템
│   │   ├── ai-analyzer.ts
│   │   └── severity-scorer.ts
│   └── crawlers/                 # 크롤링
│       └── nec-crawler.ts        # P4BA1
└── scripts/
    ├── seed/
    │   └── seed-politicians.ts   # P4BA2
    └── cron/
        ├── update-politicians/route.ts    # P4O1
        ├── aggregate-trending/route.ts    # P4O2
        └── recalculate-ranks/route.ts     # P4O3
```

**Task ID 예시**:
- P1BA1 (Mock API: 인증) → `3_Backend_APIs/app/api/auth/**/*.ts` (6개 파일)
- P1BA2 (Mock API: 정치인) → `3_Backend_APIs/app/api/politicians/**/*.ts` (6개 파일)
- P3BA1 (Real API: 인증) → 같은 경로, Mock → Real 교체
- P4BA1 → `3_Backend_APIs/lib/crawlers/nec-crawler.ts`

---

### **D (Database)**

**루트**: `4_Database/`

```
4_Database/
├── supabase/
│   └── migrations/
│       ├── 001_create_users_table.sql
│       ├── 002_create_politicians_table.sql
│       ├── 003_create_posts_table.sql
│       ├── 004_create_comments_table.sql
│       ├── 005_create_notifications_table.sql
│       ├── 006_create_reports_table.sql
│       ├── 007_create_audit_logs_table.sql
│       ├── 008_create_advertisements_table.sql
│       ├── 009_create_policies_table.sql
│       ├── 010_create_notification_templates_table.sql
│       ├── 011_create_system_settings_table.sql
│       ├── 012_create_admin_actions_table.sql
│       ├── 020_create_triggers.sql
│       ├── 021_create_functions.sql
│       ├── 030_create_storage_buckets.sql
│       └── 040_create_rls_policies.sql
├── schemas/                      # 스키마 문서
└── seeds/                        # 시드 데이터
```

**Task ID 예시**:
- P2D1 → `4_Database/supabase/migrations/*.sql` (모든 마이그레이션 파일)

---

### **O (DevOps)**

**루트**: `5_DevOps/`

```
5_DevOps/
├── .github/
│   └── workflows/
│       └── ci-cd.yml             # P6O1: CI/CD 파이프라인
├── vercel.json                   # P6O2: Vercel 설정
├── sentry.config.js              # P6O3: Sentry 설정
├── middleware.ts                 # P6O4: 보안 설정 (Rate Limiting, CORS, CSP)
└── scripts/
    └── deploy/
```

**Task ID 예시**:
- P6O1 → `5_DevOps/.github/workflows/ci-cd.yml`
- P6O2 → `5_DevOps/vercel.json`
- P6O4 → `5_DevOps/middleware.ts`

---

### **T (Testing)**

**루트**: `6_Test/`

```
6_Test/
├── __tests__/
│   ├── unit/                     # P5T1: Unit Tests
│   │   ├── components/
│   │   ├── utils/
│   │   └── api/
│   ├── integration/              # P5T3: Integration Tests
│   │   ├── api-db.test.ts
│   │   └── auth-flow.test.ts
│   └── e2e/                      # P5T2: E2E Tests
│       ├── auth.spec.ts
│       ├── politicians.spec.ts
│       ├── posts.spec.ts
│       └── admin.spec.ts
├── fixtures/                     # 테스트 데이터
└── mocks/                        # Mock 데이터
```

**Task ID 예시**:
- P5T1 → `6_Test/__tests__/unit/**/*.test.ts`
- P5T2 → `6_Test/__tests__/e2e/**/*.spec.ts`
- P5T3 → `6_Test/__tests__/integration/**/*.test.ts`

---

## 🔒 핵심 규칙

### 1. **절대 경로 사용 금지**
```typescript
// ❌ 나쁜 예
import { supabase } from '../../lib/supabase/client'

// ✅ 좋은 예
import { supabase } from '@/lib/supabase/client'
```

### 2. **Task ID 주석 필수**
모든 생성 파일의 **첫 줄**에 Task ID 주석:
```typescript
// Task ID: P1BA1
// 작업명: Mock API - 회원가입
// 생성일: 2025-11-06
```

### 3. **파일명 규칙**
- **페이지**: `page.tsx` (Next.js App Router)
- **컴포넌트**: `PascalCase.tsx` (예: `LoginForm.tsx`)
- **유틸리티**: `kebab-case.ts` (예: `image-upload.ts`)
- **API**: `route.ts` (Next.js API Routes)

### 4. **폴더 깊이 제한**
- 최대 5단계까지만 허용
- 더 깊어지면 리팩토링 필요

---

## 📊 Phase별 주요 작업 폴더

| Phase | Area | 주요 폴더 |
|-------|------|----------|
| Phase 1 | F | `1_Frontend/src/app/` |
| Phase 1 | BI | `2_Backend_Infrastructure/lib/` |
| Phase 1 | BA | `3_Backend_APIs/app/api/` (Mock) |
| Phase 2 | D | `4_Database/supabase/migrations/` |
| Phase 3 | BA | `3_Backend_APIs/app/api/` (Real) |
| Phase 4 | BA | `3_Backend_APIs/lib/`, `scripts/` |
| Phase 4 | O | `3_Backend_APIs/scripts/cron/` |
| Phase 5 | T | `6_Test/__tests__/` |
| Phase 6 | O | `5_DevOps/` |

---

## ✅ 작업지시서 업데이트 필요

모든 작업지시서 (36개)에 다음 정보 추가:

```markdown
## 📂 저장 경로

**루트 폴더**: `1_Frontend/src/`

**파일 경로**:
- `app/page.tsx` (홈페이지)
- `app/auth/login/page.tsx` (로그인)
- ...

**절대 경로 별칭**: `@/`
```

---

**작성일**: 2025-11-06
**작성자**: Claude-Sonnet-4.5
