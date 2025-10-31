# Skills 매핑 전략

**생성일**: 2025-10-31
**버전**: 1.0
**목적**: 144개 작업에 15개 Anthropic Skills 최적 배치

---

## 📚 사용 가능한 Skills (15개)

### 개발 관련 (4개)
1. **fullstack-dev** - Frontend + Backend + Database 통합 개발
2. **api-builder** - RESTful API 엔드포인트 설계 및 구현
3. **ui-builder** - React 컴포넌트 및 페이지 개발
4. **db-schema** - 데이터베이스 설계 및 마이그레이션

### 품질 관리 (3개)
5. **code-review** - 코드 품질 검토 및 개선 제안
6. **security-audit** - 보안 취약점 검사 및 OWASP 준수
7. **performance-check** - 성능 분석 및 최적화 제안

### 테스트 (3개)
8. **test-runner** - 자동화 테스트 실행 및 보고
9. **e2e-test** - End-to-End 테스트 작성 및 실행
10. **api-test** - API 엔드포인트 테스트 전문

### DevOps (3개)
11. **deployment** - Vercel 배포 자동화
12. **troubleshoot** - 디버깅 및 이슈 해결
13. **cicd-setup** - GitHub Actions 파이프라인 구성

### 프로젝트 관리 (2개)
14. **project-plan** - 요구사항 분석 및 작업 분해
15. **doc-writer** - 기술 문서 및 API 문서 작성

---

## 🎯 Area별 Skills 매핑

### O (DevOps) - 9개 작업
**Custom Agent**: devops-troubleshooter

**Primary Skills**:
- `troubleshoot` - 프로덕션 이슈 해결, 로그 분석
- `deployment` - Vercel 배포
- `cicd-setup` - GitHub Actions 설정

**Secondary Skills**:
- `test-runner` - CI/CD 테스트 실행

**사용 예시**:
- P1O1 (프로젝트 초기화): `cicd-setup`, `deployment`
- P2O1 (CI/CD 파이프라인): `cicd-setup`, `test-runner`
- P7O1 (프로덕션 배포): `deployment`, `troubleshoot`

---

### D (Database) - 30개 작업
**Custom Agent**: database-developer

**Primary Skills**:
- `db-schema` - 테이블 설계, 마이그레이션, RLS 정책

**Secondary Skills**:
- `security-audit` - RLS 정책 보안 검증
- `performance-check` - 쿼리 최적화

**사용 예시**:
- P1D1~P1D4 (인증 스키마): `db-schema`
- P2D1~P2D12 (정치인 스키마): `db-schema`, `performance-check`
- P3D1~P3D14 (평가 스키마): `db-schema`, `security-audit`

---

### BI (Backend Infrastructure) - 3개 작업
**Custom Agent**: backend-developer

**Primary Skills**:
- `api-builder` - API 구조 설계
- `fullstack-dev` - 백엔드 인프라 구축

**Secondary Skills**:
- `security-audit` - 보안 설정
- `test-runner` - 통합 테스트

**사용 예시**:
- P1BI1 (API 공통 에러 핸들러): `api-builder`
- P1BI2 (인증 미들웨어): `api-builder`, `security-audit`
- P1BI3 (환경 변수 관리): `fullstack-dev`

---

### BA (Backend APIs) - 49개 작업
**Custom Agent**: api-designer (기본) / security-specialist (보안 관련)

**Primary Skills**:
- `api-builder` - API 엔드포인트 구축
- `api-test` - API 테스트

**Secondary Skills**:
- `security-audit` - 보안 작업 (P2BA11, P3BA13, P5BA6, P6BA10)
- `performance-check` - API 최적화

**사용 예시**:
- P1BA1 (회원가입 API): `api-builder`, `api-test`
- P2BA1~P2BA10 (정치인 API): `api-builder`, `api-test`
- P2BA11 (정치인 데이터 보안): `security-audit`, `api-builder`
- P3BA1~P3BA12 (평가 API): `api-builder`, `api-test`

---

### F (Frontend) - 29개 작업
**Custom Agent**: frontend-developer (기본) / ui-designer (레이아웃)

**Primary Skills**:
- `ui-builder` - React 컴포넌트, 페이지 개발
- `fullstack-dev` - 풀스택 기능 통합

**Secondary Skills**:
- `performance-check` - 프론트엔드 최적화
- `e2e-test` - 사용자 시나리오 테스트

**사용 예시**:
- P1F1, P1F2 (전역 레이아웃): `ui-builder` (ui-designer 담당)
- P2F1~P2F10 (정치인 페이지): `ui-builder`, `fullstack-dev`
- P3F1~P3F9 (평가 페이지): `ui-builder`, `e2e-test`
- P6F1~P6F3 (최적화): `performance-check`, `ui-builder`

---

### T (Test) - 12개 작업
**Custom Agent**: test-engineer (기본) / code-reviewer (Phase 6-7)

**Primary Skills**:
- `test-runner` - 테스트 실행 (Phase 1-5)
- `api-test` - API 테스트
- `e2e-test` - E2E 테스트
- `code-review` - 코드 리뷰 (Phase 6-7)

**Secondary Skills**:
- `security-audit` - 보안 테스트
- `performance-check` - 성능 테스트

**사용 예시**:
- P2T1 (정치인 API 테스트): `api-test`
- P2T2 (정치인 E2E 테스트): `e2e-test`
- P5T1 (통합 테스트): `test-runner`, `api-test`, `e2e-test`
- P6T1~P6T3 (코드 리뷰): `code-review` (code-reviewer 담당)
- P7T1~P7T3 (최종 품질 검증): `code-review`, `security-audit`, `performance-check`

---

## 📊 Skills 사용 통계 (예상)

| Skill | 사용 횟수 (144개 중) | 주요 Area |
|-------|---------------------|----------|
| api-builder | 52 | BA(49), BI(3) |
| ui-builder | 29 | F(29) |
| db-schema | 30 | D(30) |
| test-runner | 12 | T(12) |
| e2e-test | 12 | T(12) |
| api-test | 49 | BA(49) |
| code-review | 6 | T(6) - Phase 6-7 |
| security-audit | 4 | BA(4) 보안 작업 |
| performance-check | 10 | F(6), D(4) |
| troubleshoot | 9 | O(9) |
| deployment | 9 | O(9) |
| cicd-setup | 9 | O(9) |
| fullstack-dev | 32 | F(29), BI(3) |
| project-plan | 1 | P1O1 |
| doc-writer | 7 | P7 문서화 |

---

## 🔧 도구 구조 (3요소 통합)

### 최종 Tools 포맷
```
[Claude Tools] + [Tech Stack] + [Skills]
```

### 예시

#### O (DevOps)
```
Bash, Glob, Edit, Write / GitHub Actions, Vercel CLI, npm / troubleshoot, deployment, cicd-setup
```

#### D (Database)
```
Bash, Edit, Write, Read / Supabase CLI, PostgreSQL / db-schema
```

#### BI (Backend Infrastructure)
```
Read, Edit, Write, Grep / TypeScript, Next.js API / api-builder, fullstack-dev
```

#### BA (Backend APIs)
```
Read, Edit, Write, Grep / TypeScript, Next.js API Routes, Zod / api-builder, api-test
```

#### F (Frontend)
```
Read, Edit, Write, Glob / React, Next.js, TailwindCSS, TypeScript / ui-builder, fullstack-dev
```

#### T (Test)
```
Bash, Read, Grep / Playwright, Vitest, Jest / test-runner, api-test, e2e-test
```

---

## 💡 Skills 선택 규칙

### 1. Primary Skill 선택
- Area의 주요 역할에 가장 적합한 1~2개 스킬

### 2. Secondary Skill 선택
- 특정 작업에만 필요한 보조 스킬
- 예: 보안 관련 작업 → `security-audit` 추가
- 예: 성능 최적화 → `performance-check` 추가

### 3. Phase별 변동
- Phase 1-5: 개발 중심 스킬
- Phase 6-7: 품질 검증 스킬 (`code-review`, `security-audit`, `performance-check`)

---

## 📝 구현 전략

### 1단계: agent_mapping_config.json 업데이트
```json
{
  "skills_mapping": {
    "O": {
      "primary": ["troubleshoot", "deployment", "cicd-setup"],
      "secondary": ["test-runner"]
    },
    "D": {
      "primary": ["db-schema"],
      "secondary": ["security-audit", "performance-check"]
    },
    "BI": {
      "primary": ["api-builder", "fullstack-dev"],
      "secondary": ["security-audit", "test-runner"]
    },
    "BA": {
      "primary": ["api-builder", "api-test"],
      "secondary": ["security-audit", "performance-check"],
      "exceptions": [
        {
          "condition": "task_name contains '보안'",
          "skills": ["security-audit", "api-builder"]
        }
      ]
    },
    "F": {
      "primary": ["ui-builder", "fullstack-dev"],
      "secondary": ["performance-check", "e2e-test"]
    },
    "T": {
      "primary": ["test-runner", "api-test", "e2e-test"],
      "secondary": ["security-audit", "performance-check"],
      "exceptions": [
        {
          "condition": "phase >= 6",
          "skills": ["code-review", "security-audit", "performance-check"]
        }
      ]
    }
  }
}
```

### 2단계: JSON 데이터 업데이트
- `tools` 필드를 3요소 포함으로 확장
- 기존: "Next.js API Routes/Zod"
- 신규: "Read, Edit, Write, Grep / TypeScript, Next.js API Routes, Zod / api-builder, api-test"

### 3단계: 작업지시서 업데이트
- 도구 섹션 재구성
- Claude 도구 + 기술 스택 + Skills 명시

---

## 🚀 예상 효과

1. **명확성 향상**: 각 작업에 필요한 모든 도구 한눈에 파악
2. **일관성 확보**: 전체 144개 작업에 통일된 도구 구조 적용
3. **효율성 증대**: Skills를 활용한 전문화된 작업 수행
4. **품질 보증**: 품질 관리 Skills로 코드/보안/성능 검증

---

**이 전략을 바탕으로 PROJECT GRID V4.0 도구 시스템을 업그레이드합니다.**
