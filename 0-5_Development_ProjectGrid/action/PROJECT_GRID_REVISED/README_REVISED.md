# PROJECT GRID REVISED - 최종 구조

**생성일**: 2025-11-06
**최종 수정**: 2025-11-06 (Mock/Real API 통합)
**버전**: REVISED Edition
**작업 수**: **36개**

---

## 📋 개요

PROJECT_GRID_REVISED는 기존 142개 작업을 **2대 원칙**을 적용하여 **36개**로 통합한 최종 프로젝트 그리드입니다.

### 2대 원칙 (Task Consolidation Principles)

1. **제1원칙**: 생성되는 소스코드 파일 1개당 → Task 1개
2. **제2원칙** (우선): AI가 한 번에 처리 가능하면 → 하나로 통합

### 최신 변경사항 (2025-11-06)

**Mock/Real API 통합**:
- **Before**: Mock API 23개 + Real API 23개 = 46개
- **After**: Mock API 4개 + Real API 4개 = 8개
- **감소**: 38개 작업 감소
- **이유**: 동일한 패턴(mock-data.json 사용) + 한 세션에서 통합 작업 가능 → 제2원칙 적용

---

## 📊 작업 구성

### Phase별 분포

| Phase | 설명 | 작업 수 | 주요 내용 |
|-------|------|---------|-----------|
| **Phase 1** | Frontend + Mock APIs | 8개 | React 페이지 (1) + Backend Infrastructure (3) + Mock API 4개 카테고리 |
| **Phase 2** | Database Schema | 1개 | 전체 Database 통합 스키마 |
| **Phase 3** | Real APIs | 4개 | Mock → Real API 전환 (4개 카테고리) |
| **Phase 4** | Backend Utilities + Admin | 16개 | 크롤링, 헬퍼 (6) + 관리자 기능 (7) + Cron (3) |
| **Phase 5** | Testing | 3개 | Unit, E2E, Integration Tests |
| **Phase 6** | Deployment | 4개 | CI/CD, Vercel, 모니터링, 보안 |

**총합**: **36개**

### Area별 분포

| Area | 설명 | 작업 수 |
|------|------|---------|
| **F** (Frontend) | 1개 | 33개 페이지 통합 변환 |
| **BI** (Backend Infrastructure) | 3개 | Supabase 설정, API 미들웨어, DB Types |
| **BA** (Backend APIs) | 21개 | Mock 4 + Real 4 + Utilities 6 + Admin 7 |
| **D** (Database) | 1개 | 전체 스키마 통합 |
| **O** (DevOps) | 7개 | 스케줄러 (3) + CI/CD (4) |
| **T** (Testing) | 3개 | Unit, E2E, Integration |

---

## 🗂️ 파일 구조

```
PROJECT_GRID_REVISED/
├── grid/
│   ├── task_list_revised_36.csv              # 36개 작업 목록 (CSV)
│   ├── project_grid_revised_74_schema.sql    # Supabase 테이블 생성 SQL (변경 없음)
│   ├── project_grid_revised_36_data.sql      # 36개 작업 INSERT SQL
│   ├── task_list_revised_74.csv              # (구버전) 74개 작업 목록
│   └── project_grid_revised_74_data.sql      # (구버전) 74개 작업 INSERT SQL
├── tasks/
│   ├── P1F1.md                               # Phase 1: React 페이지 변환
│   ├── P1BI1.md ~ P1BI3.md                  # Phase 1: Backend Infrastructure (3)
│   ├── P1BA1.md ~ P1BA4.md                  # Phase 1: Mock API 4개 카테고리 (NEW)
│   ├── P2D1.md                               # Phase 2: Database Schema
│   ├── P3BA1.md ~ P3BA4.md                  # Phase 3: Real API 4개 카테고리 (NEW)
│   ├── P4BA1.md ~ P4BA13.md                 # Phase 4: Backend Utilities + Admin (13)
│   ├── P4O1.md ~ P4O3.md                    # Phase 4: Schedulers (3)
│   ├── P5T1.md ~ P5T3.md                    # Phase 5: Testing (3)
│   └── P6O1.md ~ P6O4.md                    # Phase 6: Deployment (4)
├── docs/
│   └── manuals/
│       ├── PROJECT_GRID_매뉴얼_V4.0.md
│       └── SUPABASE_연동가이드_V4.0.md
└── README_REVISED.md                         # 이 파일
```

---

## 🎯 주요 변경 사항

### 1. Frontend 통합 (33개 → 1개)

**Before** (142 tasks):
- 프로토타입 28개 페이지 각각 1 task
- 개선 5개 페이지 각각 1 task

**After** (REVISED):
- **P1F1**: React 전체 페이지 변환 (33개 페이지 일괄 처리)
  - 제2원칙 적용: AI가 한 번에 처리 가능
  - 모두 같은 패턴 (HTML → React 변환)

### 2. Mock APIs 통합 (23개 → 4개) ✨ NEW

**Before**:
- P1BA1 ~ P1BA23 (개별 API 23개)

**After**:
- **P1BA1**: Mock API: 인증 (6개 route.ts)
  - 회원가입, OAuth, 로그인, 비밀번호 재설정, 토큰 갱신, 로그아웃
- **P1BA2**: Mock API: 정치인 (6개 route.ts)
  - 목록, 상세, 관심등록, 본인인증, AI평가 조회, AI평가 생성
- **P1BA3**: Mock API: 커뮤니티 (7개 route.ts)
  - 게시글 목록/상세/작성, 댓글, 좋아요, 공유, 팔로우
- **P1BA4**: Mock API: 기타 (4개 route.ts)
  - 알림, 관리자 통계, 사용자 관리, 콘텐츠 신고

**통합 이유**:
- 모두 동일한 패턴 (mock-data.json 사용)
- 한 세션에서 통합 작업 가능
- 제2원칙 적용

### 3. Real APIs 통합 (23개 → 4개) ✨ NEW

**Before**:
- P3BA1 ~ P3BA23 (개별 API 23개)

**After**:
- **P3BA1**: Real API: 인증 (6개 route.ts)
  - Supabase Auth 실제 연동
- **P3BA2**: Real API: 정치인 (6개 route.ts)
  - Supabase Database 실제 조회
- **P3BA3**: Real API: 커뮤니티 (7개 route.ts)
  - posts, comments, likes 테이블 실제 처리
- **P3BA4**: Real API: 기타 (4개 route.ts)
  - notifications, reports 실제 처리

**통합 이유**:
- Mock API와 1:1 대응 관계
- 카테고리별로 통합 작업 가능
- 제2원칙 적용

### 4. 관리자 기능 (7개 유지)

**Phase 4 Admin Backend Tasks**:
- **P4BA7**: 자동 중재 시스템 API (AI 기반 콘텐츠 필터링)
- **P4BA8**: 감사 로그 API (관리자 활동 추적)
- **P4BA9**: 광고 관리 API (광고 등록/수정/삭제)
- **P4BA10**: 정책 관리 API (이용약관/개인정보처리방침)
- **P4BA11**: 알림 설정 API (전역 알림 템플릿 관리)
- **P4BA12**: 시스템 설정 API (포인트, 기능 토글)
- **P4BA13**: 관리자 액션 로그 API (관리자 활동 통계)

### 5. Database Schema 통합 (1개 유지)

**P2D1**: 전체 Database 스키마 (통합)
- 모든 테이블 (30+개)
- 트리거 (updated_at 자동 업데이트)
- Custom Types (user_role, report_status 등)
- Storage Buckets (프로필, 게시글 이미지)
- RLS 정책
- 인덱스 최적화

---

## 🔄 Mock-to-Real API Pattern (Updated)

### Phase 1: Mock APIs (4개 카테고리)
- 목적: Frontend 개발을 위한 빠른 프로토타이핑
- 데이터: 하드코딩된 Mock 데이터
- 테스트: Frontend 컴포넌트 단위 테스트 가능
- **구조**: 카테고리별 통합 (인증, 정치인, 커뮤니티, 기타)

### Phase 2: Database Schema
- 목적: Real API를 위한 데이터베이스 준비
- 내용: 모든 테이블 + 트리거 + RLS 정책

### Phase 3: Real APIs (4개 카테고리)
- 목적: 실제 Supabase 연동
- Mock 대체: 1:1 대응으로 교체
- 테스트: 통합 테스트 + E2E 테스트
- **구조**: Mock과 동일한 카테고리 (인증, 정치인, 커뮤니티, 기타)

---

## 📋 Task ID 구조

### Naming Convention
```
P{Phase}{Area}{순번}
```

**예시**:
- `P1F1`: Phase 1, Frontend, 1번째
- `P1BA1`: Phase 1, Backend APIs, 1번째 (Mock API: 인증)
- `P3BA1`: Phase 3, Backend APIs, 1번째 (Real API: 인증)
- `P4BA13`: Phase 4, Backend APIs, 13번째 (관리자 액션 로그)

### Area 코드
- **O**: DevOps
- **D**: Database
- **BI**: Backend Infrastructure
- **BA**: Backend APIs
- **F**: Frontend
- **T**: Testing

---

## 📝 API 카테고리 상세

### 카테고리 1: 인증 (Auth)

**Mock API (P1BA1)** / **Real API (P3BA1)**

| API | Endpoint | 파일 | 설명 |
|-----|----------|------|------|
| 회원가입 | POST /api/auth/signup | api/auth/signup/route.ts | 이메일 회원가입 |
| Google OAuth | GET /api/auth/google/callback | api/auth/google/callback/route.ts | OAuth 콜백 |
| 로그인 | POST /api/auth/login | api/auth/login/route.ts | 이메일 로그인 |
| 비밀번호 재설정 | POST /api/auth/reset-password | api/auth/reset-password/route.ts | 비밀번호 재설정 |
| 토큰 갱신 | POST /api/auth/refresh | api/auth/refresh/route.ts | Access Token 갱신 |
| 로그아웃 | POST /api/auth/logout | api/auth/logout/route.ts | 로그아웃 |

**총 6개 route.ts**

### 카테고리 2: 정치인 (Politician)

**Mock API (P1BA2)** / **Real API (P3BA2)**

| API | Endpoint | 파일 | 설명 |
|-----|----------|------|------|
| 정치인 목록 | GET /api/politicians | api/politicians/route.ts | 필터링/정렬 조회 |
| 정치인 상세 | GET /api/politicians/[id] | api/politicians/[id]/route.ts | 상세 정보 |
| 관심 등록 | POST /api/politicians/[id]/favorite | api/politicians/[id]/favorite/route.ts | 즐겨찾기 |
| 본인 인증 | POST /api/politicians/verify | api/politicians/verify/route.ts | 정치인 인증 |
| AI 평가 조회 | GET /api/politicians/[id]/ai-evaluation | api/politicians/[id]/ai-evaluation/route.ts | AI 분석 결과 |
| AI 평가 생성 | POST /api/politicians/[id]/ai-evaluation | api/politicians/[id]/ai-evaluation/route.ts | AI 평가 생성 |

**총 6개 route.ts**

### 카테고리 3: 커뮤니티 (Community)

**Mock API (P1BA3)** / **Real API (P3BA3)**

| API | Endpoint | 파일 | 설명 |
|-----|----------|------|------|
| 게시글 목록 | GET /api/posts | api/posts/route.ts | 페이지네이션 조회 |
| 게시글 상세 | GET /api/posts/[id] | api/posts/[id]/route.ts | 상세 정보 |
| 게시글 작성 | POST /api/posts | api/posts/route.ts | 새 게시글 |
| 댓글 작성 | POST /api/posts/[id]/comments | api/posts/[id]/comments/route.ts | 댓글 작성 |
| 좋아요 | POST /api/posts/[id]/like | api/posts/[id]/like/route.ts | 좋아요/취소 |
| 공유 | POST /api/posts/[id]/share | api/posts/[id]/share/route.ts | 게시글 공유 |
| 팔로우 | POST /api/users/[id]/follow | api/users/[id]/follow/route.ts | 팔로우/언팔로우 |

**총 7개 route.ts**

### 카테고리 4: 기타 (Etc)

**Mock API (P1BA4)** / **Real API (P3BA4)**

| API | Endpoint | 파일 | 설명 |
|-----|----------|------|------|
| 알림 조회 | GET /api/notifications | api/notifications/route.ts | 알림 목록 |
| 관리자 통계 | GET /api/admin/stats | api/admin/stats/route.ts | 대시보드 통계 |
| 사용자 관리 | PATCH /api/admin/users/[id] | api/admin/users/[id]/route.ts | 차단/활성화 |
| 콘텐츠 신고 | POST /api/reports | api/reports/route.ts | 신고 접수 |

**총 4개 route.ts**

---

## 🚀 Supabase 연동

### 1단계: 테이블 생성

```bash
# Supabase SQL Editor에서 실행
# grid/project_grid_revised_74_schema.sql 내용 복사 → 실행
# (스키마는 변경 없음 - 74개든 36개든 동일한 테이블 구조 사용)
```

### 2단계: 데이터 삽입

```bash
# Supabase SQL Editor에서 실행
# grid/project_grid_revised_36_data.sql 내용 복사 → 실행
```

### 3단계: 확인

```sql
-- Table Editor에서 확인
SELECT COUNT(*) FROM project_grid_tasks_revised;
-- 결과: 36

SELECT phase, COUNT(*) as task_count
FROM project_grid_tasks_revised
GROUP BY phase
ORDER BY phase;
```

**기대 결과**:
```
phase | task_count
------+-----------
    1 |         8
    2 |         1
    3 |         4
    4 |        16
    5 |         3
    6 |         4
```

---

## 📊 21개 속성 (Columns)

| 번호 | 속성명 | 타입 | 설명 |
|------|--------|------|------|
| 1 | id | UUID | Primary Key |
| 2 | phase | INTEGER | Phase 번호 (1~6) |
| 3 | area | VARCHAR(10) | 작업 영역 (O/D/BI/BA/F/T) |
| 4 | task_id | VARCHAR(20) | Task 고유 ID (예: P1F1) |
| 5 | task_name | TEXT | 작업명 |
| 6 | instruction_file | TEXT | 작업지시서 파일 경로 |
| 7 | assigned_agent | VARCHAR(100) | 담당 에이전트 |
| 8 | tools | TEXT | 사용 도구/기술 |
| 9 | work_mode | VARCHAR(50) | 작업 모드 (AI-Only) |
| 10 | dependency_chain | TEXT | 의존성 체인 |
| 11 | progress | INTEGER | 진행률 (0~100) |
| 12 | status | VARCHAR(50) | 상태 (대기/진행중/완료) |
| 13 | generated_files | TEXT | 생성된 파일 목록 |
| 14 | generator | VARCHAR(50) | 생성 주체 |
| 15 | duration | VARCHAR(50) | 작업 소요 시간 |
| 16 | modification_history | TEXT | 수정 이력 |
| 17 | test_history | TEXT | 테스트 이력 |
| 18 | build_result | VARCHAR(20) | 빌드 결과 |
| 19 | dependency_propagation | VARCHAR(50) | 의존성 전파 |
| 20 | blocker | TEXT | 블로커 |
| 21 | validation_result | TEXT | 검증 결과 |

---

## 🔗 의존성 체인 예시

### Frontend → Backend Infrastructure
```
P1F1 → P1BI1, P1BI2, P1BI3
```

### Mock APIs → Database → Real APIs (카테고리별)
```
P1BA1 (Mock 인증) → P2D1 (DB) → P3BA1 (Real 인증)
P1BA2 (Mock 정치인) → P2D1 (DB) → P3BA2 (Real 정치인)
P1BA3 (Mock 커뮤니티) → P2D1 (DB) → P3BA3 (Real 커뮤니티)
P1BA4 (Mock 기타) → P2D1 (DB) → P3BA4 (Real 기타)
```

### Backend Utilities → Admin Features
```
P3BA4 (콘텐츠 신고 Real) → P4BA7 (자동 중재 시스템)
```

### Testing
```
P3BA1~P3BA4 (Real APIs) → P5T3 (Integration Tests)
```

### Deployment
```
P5T1, P5T2, P5T3 (Tests) → P6O1 (CI/CD) → P6O2 (Vercel)
```

---

## 🎯 Phase Gate 시스템

각 Phase 종료 시 명시적 승인 필요:

### Phase 1 Gate
- **조건**: 8개 작업 완료
- **검증**: Frontend 렌더링 + Mock API 응답 확인 (4개 카테고리)
- **승인**: 사용자 확인 후 Phase 2 진행

### Phase 2 Gate
- **조건**: 1개 작업 완료
- **검증**: Supabase 테이블 생성 확인
- **승인**: Schema 검증 후 Phase 3 진행

### Phase 3 Gate
- **조건**: 4개 작업 완료
- **검증**: Real API + DB 통합 테스트 (4개 카테고리)
- **승인**: E2E 테스트 통과 후 Phase 4 진행

### Phase 4 Gate
- **조건**: 16개 작업 완료
- **검증**: 크롤링, 헬퍼, 관리자 기능 테스트
- **승인**: 기능 테스트 통과 후 Phase 5 진행

### Phase 5 Gate
- **조건**: 3개 작업 완료
- **검증**: Unit + E2E + Integration 테스트 통과
- **승인**: 테스트 커버리지 확인 후 Phase 6 진행

### Phase 6 Gate
- **조건**: 4개 작업 완료
- **검증**: 프로덕션 배포 성공
- **승인**: 모니터링 정상 작동 확인

---

## 📚 참고 문서

### 내부 문서
- `docs/manuals/PROJECT_GRID_매뉴얼_V4.0.md`: Project Grid 사용법
- `docs/manuals/SUPABASE_연동가이드_V4.0.md`: Supabase 연동 방법
- `FEATURE_CREEP_REMOVAL_REPORT.md`: 기능 축소 리포트

### 외부 링크
- Next.js 14 문서: https://nextjs.org/docs
- Supabase 문서: https://supabase.com/docs
- TypeScript 문서: https://www.typescriptlang.org/docs

---

## ✅ 체크리스트

### Supabase 설정
- [ ] Supabase 프로젝트 생성
- [ ] `project_grid_revised_74_schema.sql` 실행
- [ ] `project_grid_revised_36_data.sql` 실행
- [ ] 36개 작업 삽입 확인

### 작업지시서 업데이트
- [ ] P1BA1.md (Mock API: 인증) 작성
- [ ] P1BA2.md (Mock API: 정치인) 작성
- [ ] P1BA3.md (Mock API: 커뮤니티) 작성
- [ ] P1BA4.md (Mock API: 기타) 작성
- [ ] P3BA1.md (Real API: 인증) 작성
- [ ] P3BA2.md (Real API: 정치인) 작성
- [ ] P3BA3.md (Real API: 커뮤니티) 작성
- [ ] P3BA4.md (Real API: 기타) 작성

### Viewer 프로그램
- [ ] Viewer HTML 생성
- [ ] Supabase 연동
- [ ] 필터링 기능 구현
- [ ] 실시간 업데이트 설정

### 작업 실행
- [ ] Phase 1: 8개 작업 완료
- [ ] Phase 2: 1개 작업 완료
- [ ] Phase 3: 4개 작업 완료
- [ ] Phase 4: 16개 작업 완료
- [ ] Phase 5: 3개 작업 완료
- [ ] Phase 6: 4개 작업 완료

---

## 📈 변경 이력

### 2025-11-06 (v2)
- Mock API 23개 → 4개 카테고리 통합
- Real API 23개 → 4개 카테고리 통합
- 총 작업 수: 74개 → 36개 (38개 감소)
- 제2원칙 적용: 동일 패턴 + 한 세션 통합 가능

### 2025-11-06 (v1)
- 관리자 기능 7개 추가 (P4BA7-P4BA13)
- 총 작업 수: 67개 → 74개

### 2025-11-06 (초기 버전)
- 142개 작업 → 67개 작업으로 통합
- 2대 원칙 적용
- Frontend 33개 → 1개
- Database 20+개 → 1개

---

**작성일**: 2025-11-06
**최종 수정**: 2025-11-06 (Mock/Real API 통합)
**작성자**: Claude-Sonnet-4.5
**버전**: REVISED Edition (36 Tasks)
