# PoliticianFinder

**프로젝트**: 정치인 평가 및 커뮤니티 플랫폼  
**개발 방법론**: PROJECT GRID V3.0 + Git 통합 추적 시스템  
**총 작업**: 167개 (메인 144개 + AI엔진 23개)

---

## 📋 프로젝트 개요

PoliticianFinder는 정치인에 대한 객관적인 정보와 평가를 제공하고, 시민들이 자유롭게 의견을 나눌 수 있는 커뮤니티 플랫폼입니다.

### 주요 기능
- 정치인 검색 및 상세 정보
- AI 기반 정치인 평가 시스템
- 커뮤니티 게시판 및 토론
- 사용자 등급/포인트 시스템
- 실명 인증 시스템

### 기술 스택
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: Supabase (PostgreSQL), Redis (Upstash)
- **AI**: AI Evaluation Engine API (별도 시스템)
- **Deployment**: Vercel, Supabase Cloud

---

## 🎯 Git 통합 추적 시스템 (Git Integration Tracking System)

이 프로젝트는 **특허 출원된 Git 통합 추적 시스템**(청구항 15-16)을 사용합니다.

### 청구항 15: 작업 ID 헤더

모든 AI가 생성하는 소스 코드 파일은 **반드시 Task ID 헤더**를 포함해야 합니다.

#### TypeScript/JavaScript 파일
```typescript
/**
 * Project Grid Task ID: P1F1
 * 작업명: 회원가입 페이지 구현
 * 생성시간: 2025-10-30 14:30
 * 생성자: Claude-3.5-Sonnet
 */

export default function SignupPage() {
  // ...
}
```

#### Python 파일
```python
"""
Project Grid Task ID: P2BA3
작업명: 정치인 검색 API 구현
생성시간: 2025-10-30 14:30
생성자: Claude-3.5-Sonnet
"""

from fastapi import APIRouter
# ...
```

#### SQL 파일
```sql
-- Project Grid Task ID: P1D2
-- 작업명: 정치인 테이블 마이그레이션
-- 생성시간: 2025-10-30 14:30
-- 생성자: Claude-3.5-Sonnet

CREATE TABLE politicians (
  -- ...
);
```

### 청구항 16: Git 커밋 형식

모든 Git 커밋 메시지는 **Task ID를 포함**해야 합니다.

```bash
[P1F1] 회원가입 페이지 구현 완료

- app/signup/page.tsx 생성
- 회원가입 폼 UI 구현
- 유효성 검증 로직 추가

소요시간: 45분
생성자: Claude-3.5-Sonnet
```

### 왜 이 시스템을 사용하나?

1. **양방향 추적**: 코드 ↔ 작업 간 완벽한 추적
2. **특허 증거 확보**: 모든 개발 과정이 자동으로 기록됨
3. **작업 이력 관리**: 누가, 언제, 무엇을 만들었는지 명확
4. **의존성 관리**: 작업 간 의존성을 Git 이력으로 확인 가능

---

## 🌿 브랜치 전략 (Branch Strategy)

### 브랜치 구조

```
main (개발용 메인 브랜치)
├── phase-0 (프로토타입 아카이브)
├── phase-1 (1단계 개발)
├── phase-2 (2단계 개발)
├── phase-3 (3단계 개발)
├── phase-4 (4단계 개발)
├── phase-5 (5단계 개발)
├── phase-6 (6단계 개발)
└── phase-7 (7단계 개발)
```

### 브랜치 설명

#### `phase-0` (완료)
- **목적**: 프로토타입 HTML 파일 보존
- **내용**: `UIUX_Design/prototypes/html/` 디렉토리
- **커밋**: `[Phase-0] 프로토타입 디자인 아카이브`

#### `main` (현재)
- **목적**: Git 통합 추적 시스템이 적용된 실제 개발
- **상태**: 초기화 완료, 개발 준비 완료
- **다음 단계**: Phase 1 개발 시작

#### `phase-1` ~ `phase-7` (예정)
- 각 Phase별 개발이 완료되면 해당 브랜치에서 작업
- 완료 후 main에 merge

---

## 📊 6개 개발 영역 (Development Areas)

### 1. DevOps 영역 (DevOps Area) - **O**
- 프로젝트 초기화, CI/CD, 배포, 스케줄러
- 인프라 설정 및 자동화

### 2. Database 영역 (Database Area) - **D**
- 스키마, 마이그레이션, 트리거, 타입
- RLS 정책, 데이터베이스 설계

### 3. Backend Infrastructure 영역 (Backend Infrastructure Area) - **BI**
- Supabase 클라이언트, 미들웨어, 기본 설정
- **모든 API가 사용하는 기반 코드**

### 4. Backend APIs 영역 (Backend APIs Area) - **BA**
- 비즈니스 로직, REST API 엔드포인트
- **실제 기능 구현**

### 5. Frontend 영역 (Frontend Area) - **F**
- UI, UX, 페이지, 컴포넌트
- 사용자 인터페이스

### 6. Test 영역 (Test Area) - **T**
- E2E 테스트, API 테스트, 부하 테스트
- 품질 보증

### ⚠️ Security 관련 참고사항
**Security는 별도 영역이 아닙니다.**  
보안은 모든 영역(DevOps, Database, Backend, Frontend, Test)에 **통합**되어야 합니다.

---

## 📐 PROJECT GRID 구조

### Task ID 형식

```
P{Phase}{Area}{Number}

예시:
- P1O1: Phase 1, DevOps Area, Task 1
- P1D2: Phase 1, Database Area, Task 2
- P2BI3: Phase 2, Backend Infrastructure Area, Task 3
- P3BA5: Phase 3, Backend APIs Area, Task 5
- P4F7: Phase 4, Frontend Area, Task 7
- P5T2: Phase 5, Test Area, Task 2
```

### 21개 속성

PROJECT GRID의 각 작업은 21개 속성으로 관리됩니다:

#### 【그리드 좌표】
1. phase (정수)
2. area (문자: O/D/BI/BA/F/T)

#### 【작업 기본 정보】
3. 작업ID
4. 업무
5. 작업지시서
6. 서브 에이전트
7. 사용도구
8. 작업방식 (AI-Only / Human-Assist)
9. 의존성 체인
10. 진도 (0-100%)
11. 상태 (대기 / 진행 중 / 완료)

#### 【작업 실행 기록】
12. 생성파일
13. 생성자 (AI 모델명)
14. 소요시간 (실제 완료 후만 기록)
15. 수정이력

#### 【검증】
16. 테스트내역
17. 빌드결과 (✅/❌/⏳)
18. 의존성전파 (✅/❌)
19. 블로커
20. 종합검증결과 (✅/🔄/⏳)

#### 【기타】
21. 참고사항

---

## ⚠️ AI 시간 추정 금지 원칙

### 절대 금지

AI는 **미래 작업에 대한 구체적인 시간을 절대 추정하거나 약속하지 않습니다.**

#### ❌ 금지되는 표현
- "이 작업은 2시간이면 완료됩니다"
- "3일 정도 걸릴 것 같습니다"
- "예상 소요시간: 4시간"

#### ✅ 올바른 표현
- "작업을 시작하겠습니다"
- "현재 진행 중입니다"
- "완료했습니다 (실제 소요시간: 45분)"
- "진도: 60% (현재까지 소요시간: 2시간)"

### 이유

1. **AI는 실행 속도를 보장할 수 없음**
2. **사용자를 오도하는 행위**
3. **실제 측정만이 의미있음**

---

## 🚀 7단계 개발 계획 (7 Phases)

### 1단계 (Phase 1): 인증 시스템 (20개 작업)
- DevOps 초기화
- Database 스키마
- 회원가입/로그인
- OAuth 연동

### 2단계 (Phase 2): 정치인 시스템 (24개 작업)
- 정치인 DB
- 검색/필터
- 상세 페이지
- 평가 시스템

### 3단계 (Phase 3): 커뮤니티 시스템 (32개 작업)
- 게시판
- 댓글/대댓글
- 신고 시스템
- 알림

### 4단계 (Phase 4): 등급/포인트 시스템 (14개 작업)
- 사용자 등급
- 포인트 획득/차감
- 랭킹 시스템

### 5단계 (Phase 5): 결제/인증 시스템 (12개 작업)
- 실명 인증
- 결제 시스템
- 구독 관리

### 6단계 (Phase 6): 관리자/추가 기능 (24개 작업)
- 관리자 패널
- 통계/분석
- 신고 처리

### 7단계 (Phase 7): 배포 및 최적화 (18개 작업)
- 성능 최적화
- SEO
- 모니터링
- Production 배포

---

## 📁 프로젝트 구조 (예정)

```
PoliticianFinder/
├── .github/
│   └── workflows/           # CI/CD
├── app/                     # Next.js App Router
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── politicians/
│   ├── community/
│   ├── api/
│   └── layout.tsx
├── components/              # React 컴포넌트
├── lib/                     # 유틸리티
│   ├── supabase/
│   └── utils/
├── supabase/
│   ├── migrations/
│   └── types/
├── tests/                   # 테스트
├── .env.example
├── .gitignore
├── next.config.js
├── package.json
├── README.md
└── tsconfig.json
```

---

## 🔧 개발 시작하기

### 1. 저장소 클론

```bash
git clone https://github.com/SUNWOONGKYU/PoliticianFinder.git
cd PoliticianFinder
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

```bash
cp .env.example .env.local
# .env.local 파일 편집
```

### 4. 개발 서버 실행

```bash
npm run dev
```

### 5. Phase 1 개발 시작

Phase 1 작업은 `Development_Plan/PoliticianFinder_개발업무_최종.md` 참조

---

## 📚 관련 문서

- **PROJECT GRID 매뉴얼**: `Development_ProjectGrid/PROJECT_GRID_매뉴얼_V3.0.md`
- **개발 계획**: `Development_Plan/README.md`
- **개발 업무 목록**: `Development_Plan/PoliticianFinder_개발업무_최종.md`
- **업무 구조 다이어그램**: `Development_Plan/PoliticianFinder_업무구조_다이어그램.md`

---

## 📝 라이선스

Copyright © 2025 SUNWOONGKYU. All rights reserved.

---

**Last updated**: 2025-10-30  
**PROJECT GRID Version**: V3.0  
**Git 통합 추적 시스템**: 적용 완료
