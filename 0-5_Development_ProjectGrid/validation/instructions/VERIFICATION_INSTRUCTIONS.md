# 검증 작업 지시서 (Verification Work Instructions)

**버전**: 1.0
**작성일**: 2025-11-04
**대상**: B 에이전트 (검증자)
**목적**: Phase 1 모든 Task의 검증 리포트 작성

---

## 📋 목차

1. [개요](#개요)
2. [준비 사항](#준비-사항)
3. [검증 프로세스](#검증-프로세스)
4. [작업 순서](#작업-순서)
5. [리포트 작성 가이드](#리포트-작성-가이드)
6. [체크리스트](#체크리스트)

---

## 개요

### 목표
Phase 1의 20개 Task에 대한 2차 검증 완료 및 검증 리포트 생성

### 범위
- **총 20개 Task**: P1O1 ~ P1T1, P1F2 ~ P1F11
- **현재 상태**: 8개 리포트 완료, 12개 리포트 필요
- **마감**: 2025-11-04 또는 2025-11-05

### 결과물
- 각 Task별 검증 리포트 (`.txt` 파일)
- 통합 검증 보고서 (선택)
- Project Grid 업데이트

---

## 준비 사항

### 1단계: Project Grid 확인

**파일 위치**:
```
C:\Development_PoliticianFinder_copy\Developement_Real_PoliticianFinder\
  0-5_Development_ProjectGrid\
    action\PROJECT_GRID\grid\
      generated_grid_full_v4_10agents_with_skills.json
```

**확인 항목**:
```json
각 Task에는 다음 정보가 포함됨:
{
  "task_id": "P1BA1",
  "task_name": "회원가입 API",
  "area": "BA",
  "priority": "HIGH",
  "description": "작업 설명",
  "generated_files": ["file1.ts", "file2.ts"],  ← 생성 파일 목록
  "dependencies": ["P1O1", "P1D1"],             ← 의존성
  "expected_deliverables": "기대 결과물",      ← 확인할 것!
  "assigned_agent": "backend-developer",        ← 1차 담당
}
```

**사용 방법**:
```bash
# Project Grid 파일 열기
cat "C:\Development_PoliticianFinder_copy\Developement_Real_PoliticianFinder\0-5_Development_ProjectGrid\action\PROJECT_GRID\grid\generated_grid_full_v4_10agents_with_skills.json" | jq '.[] | select(.task_id == "P1BA1")'
```

### 2단계: 검증 리포트 템플릿 확인

**파일 위치**:
```
0-5_Development_ProjectGrid\
  VERIFICATION_REPORT_TEMPLATE.md
```

**템플릿 9개 섹션**:
1. 헤더 정보
2. 태스크 개요
3. 생성된 파일 검증
4. 코드 품질 검증
5. 빌드 및 테스트 검증
6. 보안 및 성능 검증
7. 의존성 검증
8. 문제 및 권장사항
9. 최종 평가

### 3단계: 소스 코드 위치 확인

**프로젝트 구조**:
```
Developement_Real_PoliticianFinder/
├── 1_Frontend/
│   ├── src/app/
│   │   ├── auth/login/page.tsx          ← P1F2
│   │   ├── auth/signup/page.tsx         ← P1F3
│   │   ├── auth/forgot-password/...     ← P1F4
│   │   └── auth/password-reset/...      ← P1F5
│   ├── app/api/auth/
│   │   ├── signup/route.ts              ← P1BA1
│   │   ├── login/route.ts               ← P1BA2
│   │   └── password-reset/route.ts      ← P1BA4
│   ├── middleware.ts                    ← P1BI2
│   └── playwright.config.ts             ← P1T1
│
├── 2_Backend_Infrastructure/
│   ├── supabase/migrations/
│   │   ├── 001_auth_schema.sql          ← P1D1
│   │   ├── 002_auth_triggers.sql        ← P1D2
│   │   └── seed_dev.sql                 ← P1D3
│   ├── core.ts                          ← P1BI1
│   └── error-handling.ts                ← P1BI2
│
└── 0-5_Development_ProjectGrid/
    └── verification_reports/            ← 리포트 저장 폴더
```

---

## 검증 프로세스

### 핵심 원칙

```
┌─────────────────────────────────────────────────────────┐
│  PROJECT GRID 확인                                       │
│  ↓ (task_id, generated_files, dependencies 확인)       │
├─────────────────────────────────────────────────────────┤
│  소스 코드 검증                                          │
│  ↓ (파일 존재, 내용, 코드 품질)                         │
├─────────────────────────────────────────────────────────┤
│  빌드 및 테스트                                         │
│  ↓ (TypeScript, ESLint, Build, Test)                   │
├─────────────────────────────────────────────────────────┤
│  VERIFICATION_REPORT_TEMPLATE.md 기반으로 리포트 작성   │
│  ↓ (9개 섹션 모두 포함)                                 │
├─────────────────────────────────────────────────────────┤
│  리포트 저장                                            │
│  → verification_reports/P1XX_2nd_verification.txt       │
└─────────────────────────────────────────────────────────┘
```

### 검증 체크리스트 (각 Task별)

```
☐ Step 1: Project Grid에서 Task 정보 읽기
  - task_id 확인
  - generated_files 목록 확인
  - expected_deliverables 확인
  - dependencies 확인

☐ Step 2: 파일 존재 여부 확인
  - 모든 expected_deliverables 파일 존재 확인
  - 파일 경로 정확성 확인
  - 파일 크기 확인

☐ Step 3: 코드 품질 검증
  - Task ID 주석 확인
  - TypeScript 타입 체크
  - ESLint 규칙 준수
  - 코드 스타일 일관성

☐ Step 4: 기능 검증
  - 기대 결과물 충족
  - 비즈니스 로직 정확성
  - 에러 처리
  - 입력 검증

☐ Step 5: 의존성 검증
  - 선행 Task 완료 확인
  - 라이브러리 버전 호환성

☐ Step 6: 빌드 및 테스트
  - npm run build 성공
  - npm test 성공
  - 빌드 에러/경고 없음

☐ Step 7: 보안 및 성능
  - 하드코딩 시크릿 없음
  - 입력 검증
  - 성능 문제 없음

☐ Step 8: VERIFICATION_REPORT_TEMPLATE.md 기반 리포트 작성
  - 9개 섹션 모두 포함
  - 템플릿 형식 준수
  - 명확한 ✅/❌ 상태 표시

☐ Step 9: 리포트 저장
  - 파일명: P1XX_2nd_verification.txt
  - 위치: verification_reports/
  - 인코딩: UTF-8
```

---

## 작업 순서

### 📌 우선순위 순서

**Phase 1A: Backend Infrastructure (4개 Task)**
```
1. P1BI1 - Supabase 클라이언트 (lib/supabase/client.ts)
2. P1BI2 - API 미들웨어 (middleware.ts)
3. P1BA1 - 회원가입 API (app/api/auth/signup/route.ts)
4. P1BA2 - 로그인 API (app/api/auth/login/route.ts)
```

**Phase 1B: Backend APIs (1개 Task)**
```
5. P1BA4 - 비밀번호 재설정 API (app/api/auth/password-reset/route.ts)
```

**Phase 1C: Frontend Pages (5개 Task)**
```
6. P1F2 - 로그인 페이지 (src/app/auth/login/page.tsx)
7. P1F3 - 회원가입 페이지 (src/app/auth/signup/page.tsx)
8. P1F4 - 비밀번호 찾기 페이지 (src/app/auth/forgot-password/page.tsx)
9. P1F5 - 비밀번호 재설정 페이지 (src/app/auth/password-reset/page.tsx)
10. P1F6 - 마이페이지 (src/app/mypage/page.tsx)
```

**Phase 1D: Remaining Frontend (2개 Task)**
```
11. P1F10 - 의원 프로필 페이지 (src/app/politicians/[id]/profile/page.tsx)
12. P1F11 - 유저 프로필 페이지 (src/app/users/[id]/profile/page.tsx)
```

### ⏱️ 예상 일정

```
각 Task별 예상 검증 시간: 10-15분

총 예상 시간:
- 12개 Task × 12분 = 144분 (≈ 2.5시간)
- 포함: 1차 리포트 검토, 파일 확인, 코드 품질 검증, 리포트 작성

권장 일정:
- 시작: 2025-11-04 또는 2025-11-05
- 마감: 같은 날 4-5시간 내
```

---

## 리포트 작성 가이드

### 1. 리포트 파일 생성

**파일명 형식**:
```
P1XX_2nd_verification.txt
```

**예시**:
```
P1BA1_2nd_verification.txt
P1BA2_2nd_verification.txt
P1F2_2nd_verification.txt
... (각 Task별로)
```

### 2. Project Grid 데이터 참조

**각 리포트 작성 시 Project Grid에서 읽어야 할 정보**:

```bash
# Task 정보 조회 (예: P1BA1)
{
  "task_id": "P1BA1",
  "task_name": "회원가입 API",
  "phase": 1,
  "area": "BA",
  "priority": "HIGH",

  # 이 정보들을 리포트에 사용!
  "generated_files": [
    "3_Backend_APIs/auth/signup/route.ts"
  ],

  "expected_deliverables": [
    "POST /api/auth/signup 엔드포인트",
    "이메일 중복 확인",
    "닉네임 중복 확인",
    "비밀번호 6가지 검증 (길이, 대문자, 소문자, 숫자, 특수문자, 금지어)"
  ],

  "dependencies": [
    "P1BI1",  # 이 Task들이 완료되었는지 확인!
    "P1BI2",
    "P1D1"
  ],

  "assigned_agent": "backend-developer",  # 1차 담당 에이전트

  "test_required": true,
  "build_required": true
}
```

### 3. 리포트 섹션별 작성 예시

#### 헤더 정보 (Project Grid에서 가져오기)
```
Task ID: P1BA1 (← Project Grid에서)
Task Name: 회원가입 API (← Project Grid에서)
Area: BA (← Project Grid에서)
Priority: HIGH (← Project Grid에서)
1st Execution: backend-developer (← Project Grid.assigned_agent에서)
```

#### 태스크 개요 (Project Grid의 expected_deliverables 사용)
```
Expected Deliverables: (← Project Grid에서 복사)
- 3_Backend_APIs/auth/signup/route.ts

Functional Requirements: (← Project Grid의 expected_deliverables)
- POST /api/auth/signup 엔드포인트
- 이메일 중복 확인
- 닉네임 중복 확인
- 비밀번호 6가지 검증

Dependencies: (← Project Grid의 dependencies)
- P1BI1 ✅ 완료
- P1BI2 ✅ 완료
- P1D1 ✅ 완료
```

#### 생성된 파일 검증 (Project Grid의 generated_files 사용)
```
File Existence: (← Project Grid의 generated_files)
3_Backend_APIs/auth/signup/route.ts     3.5 kB    2025-11-01    ✅
```

### 4. 템플릿 사용 방법

**Step 1**: VERIFICATION_REPORT_TEMPLATE.md 열기
**Step 2**: [TEMPLATE] 헤더 부분 제거
**Step 3**: 각 Task의 실제 정보로 채우기
**Step 4**: 9개 섹션 모두 작성하기
**Step 5**: 파일명 P1XX_2nd_verification.txt로 저장

---

## 체크리스트

### 📋 검증 완료 체크리스트

```
백엔드 인프라:
☐ P1BI1 - Supabase 클라이언트
☐ P1BI2 - API 미들웨어

백엔드 API:
☐ P1BA1 - 회원가입 API
☐ P1BA2 - 로그인 API
☐ P1BA4 - 비밀번호 재설정 API

프론트엔드 페이지:
☐ P1F2  - 로그인 페이지
☐ P1F3  - 회원가입 페이지
☐ P1F4  - 비밀번호 찾기 페이지
☐ P1F5  - 비밀번호 재설정 페이지
☐ P1F6  - 마이페이지
☐ P1F10 - 의원 프로필 페이지
☐ P1F11 - 유저 프로필 페이지
```

### 📄 리포트 생성 체크리스트

```
리포트 생성:
☐ P1BI1_2nd_verification.txt
☐ P1BI2_2nd_verification.txt
☐ P1BA1_2nd_verification.txt
☐ P1BA2_2nd_verification.txt
☐ P1BA4_2nd_verification.txt
☐ P1F2_2nd_verification.txt
☐ P1F3_2nd_verification.txt
☐ P1F4_2nd_verification.txt
☐ P1F5_2nd_verification.txt
☐ P1F6_2nd_verification.txt
☐ P1F10_2nd_verification.txt
☐ P1F11_2nd_verification.txt

모든 리포트 저장 위치:
verification_reports/ 폴더

파일 인코딩:
UTF-8 (한글 포함 가능)
```

### ✅ 리포트 품질 체크리스트

**각 리포트가 포함해야 할 것**:

```
기본 정보:
☐ Task ID 명확
☐ Task Name 명확
☐ 검증 날짜 기록
☐ 검증자 이름 기록

Project Grid 연동:
☐ generated_files 모두 확인
☐ expected_deliverables 모두 검증
☐ dependencies 완료 확인

파일 검증:
☐ 파일 존재 확인
☐ 파일 내용 확인
☐ Task ID 주석 확인

코드 품질:
☐ TypeScript 검증
☐ ESLint 검증
☐ 코드 스타일 확인

빌드 & 테스트:
☐ 빌드 성공 확인
☐ 테스트 성공 확인
☐ 에러/경고 없음 확인

최종 평가:
☐ 상태 명확 (✅ PASS / ❌ FAIL)
☐ 문제점 명확
☐ 권장사항 명확
```

---

## 중요 참고 사항

### 🔴 필수 사항

1. **Project Grid 확인 필수**
   - 각 Task의 expected_deliverables 확인
   - 각 Task의 dependencies 확인
   - 각 Task의 generated_files 확인

2. **VERIFICATION_REPORT_TEMPLATE.md 준수 필수**
   - 9개 섹션 모두 포함
   - 템플릿 형식 준수
   - 명확한 상태 표시 (✅/❌/⚠️)

3. **명확한 결론 필수**
   - 각 리포트마다 최종 상태 표시
   - 문제 있으면 명시
   - 다음 단계 제시

### 🟡 권장 사항

1. 리포트는 객관적으로 작성
2. 의문점 명확히 기록
3. 스크린샷 또는 로그 포함 (문제 발생 시)
4. 예상 시간: 각 Task 10-15분

### 🟢 완료 기준

- [ ] 12개 Task 모두 검증 완료
- [ ] 각 리포트가 VERIFICATION_REPORT_TEMPLATE.md 준수
- [ ] 각 리포트가 Project Grid 정보 참조
- [ ] 모든 리포트 파일명 형식 P1XX_2nd_verification.txt 준수
- [ ] 모든 리포트 UTF-8 인코딩
- [ ] 모든 리포트 verification_reports/ 폴더에 저장

---

## 전달 정보

### 파일 위치

```
Project Grid:
C:\Development_PoliticianFinder_copy\Developement_Real_PoliticianFinder\
  0-5_Development_ProjectGrid\
    action\PROJECT_GRID\grid\
      generated_grid_full_v4_10agents_with_skills.json

템플릿:
C:\Development_PoliticianFinder_copy\Developement_Real_PoliticianFinder\
  0-5_Development_ProjectGrid\
    VERIFICATION_REPORT_TEMPLATE.md

저장 위치:
C:\Development_PoliticianFinder_copy\Developement_Real_PoliticianFinder\
  0-5_Development_ProjectGrid\
    verification_reports\
```

### 연락처 및 질문

```
작업 중 문제 발생 시:
1. VERIFICATION_REPORT_TEMPLATE.md 다시 확인
2. Project Grid의 Task 정보 다시 확인
3. 이전 리포트 예제 참조 (P1O1, P1D1 등)
4. 질문 또는 문제 보고
```

---

## 최종 체크

```
작업 시작 전 확인:
☐ Project Grid 파일 액세스 가능
☐ VERIFICATION_REPORT_TEMPLATE.md 읽음
☐ 소스 코드 경로 이해
☐ verification_reports/ 폴더 확인
☐ 12개 Task 목록 확인

작업 완료 후 확인:
☐ 12개 리포트 모두 생성
☐ 파일명 형식 정확 (P1XX_2nd_verification.txt)
☐ UTF-8 인코딩
☐ 각 리포트 9개 섹션 포함
☐ 모든 리포트 verification_reports/ 폴더 저장
```

---

**작업 지시서 버전**: 1.0
**작성일**: 2025-11-04
**대상**: B 에이전트 (검증자)
**상태**: 🟢 Ready to Start
