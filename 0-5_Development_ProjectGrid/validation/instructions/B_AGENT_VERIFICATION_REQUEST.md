# B 에이전트 - 검증 작업 요청 (Urgent)

**발신**: Main Agent (Claude Code Session 1)
**수신**: B 에이전트 (검증자)
**날짜**: 2025-11-04
**우선순위**: 🔴 HIGH
**상태**: 🟡 WAITING FOR ACTION

---

## 요청 사항

**12개 Task에 대한 2차 검증 리포트 작성 요청**

### 현재 상황
- ✅ 8개 Task 검증 완료 (P1O1, P1D1, P1D2, P1BI1, P1BI2, P1BA3, P1T1 + 통합 리포트)
- ❌ 12개 Task 검증 리포트 **누락**
- ⏳ Phase 1 Gate 승인 대기 중

### 필요한 12개 Task

#### 백엔드 인프라 (2개)
```
☐ P1BI1 - Supabase 클라이언트
   파일: 2_Backend_Infrastructure/lib/supabase/client.ts

☐ P1BI2 - API 미들웨어
   파일: middleware.ts
```

#### 백엔드 API (3개)
```
☐ P1BA1 - 회원가입 API
   파일: app/api/auth/signup/route.ts

☐ P1BA2 - 로그인 API
   파일: app/api/auth/login/route.ts

☐ P1BA4 - 비밀번호 재설정 API
   파일: app/api/auth/password-reset/route.ts
```

#### 프론트엔드 페이지 (7개)
```
☐ P1F2 - 로그인 페이지
   파일: src/app/auth/login/page.tsx

☐ P1F3 - 회원가입 페이지
   파일: src/app/auth/signup/page.tsx

☐ P1F4 - 비밀번호 찾기 페이지
   파일: src/app/auth/forgot-password/page.tsx

☐ P1F5 - 비밀번호 재설정 페이지
   파일: src/app/auth/password-reset/page.tsx

☐ P1F6 - 마이페이지
   파일: src/app/mypage/page.tsx

☐ P1F10 - 의원 프로필 페이지
   파일: src/app/politicians/[id]/profile/page.tsx

☐ P1F11 - 유저 프로필 페이지
   파일: src/app/users/[id]/profile/page.tsx
```

---

## 작업 지침

### 1️⃣ 준비 사항

#### Step 1: 필수 문서 확인
```
다음 3개 문서를 먼저 읽으세요:

1. VERIFICATION_REPORT_TEMPLATE.md
   → 리포트 표준 양식 (9개 섹션)
   → 다운로드: 0-5_Development_ProjectGrid/

2. VERIFICATION_INSTRUCTIONS.md
   → 검증 작업 상세 지시서
   → 프로세스, 체크리스트, 예제 포함

3. generated_grid_full_v4_10agents_with_skills.json
   → Project Grid 파일
   → 각 Task의 상세 정보 포함
   → 다운로드: 0-5_Development_ProjectGrid/action/PROJECT_GRID/grid/
```

#### Step 2: Project Grid 이해
```
각 Task마다 다음 정보를 확인하세요:

{
  "task_id": "P1BA1",           ← Task ID
  "task_name": "회원가입 API",   ← Task 이름
  "generated_files": [...],      ← 확인해야 할 파일들
  "expected_deliverables": [...],← 검증해야 할 것들
  "dependencies": [...]          ← 선행 Task들
}

⭐ 가장 중요함: generated_files와 expected_deliverables!
```

#### Step 3: 소스 코드 위치 확인
```
프로젝트 구조:
Developement_Real_PoliticianFinder/
├── 1_Frontend/                  ← 프론트엔드 페이지
│   ├── src/app/auth/
│   ├── app/api/auth/           ← 백엔드 API
│   └── middleware.ts
└── 2_Backend_Infrastructure/    ← 백엔드 인프라
    └── lib/supabase/
```

---

### 2️⃣ 검증 프로세스

**각 Task별 검증 절차 (표준 프로세스)**:

```
┌──────────────────────────────────────────────┐
│ 1. Project Grid에서 Task 정보 읽기           │
│    ↓                                          │
│ 2. 소스 코드 파일 확인                       │
│    ↓                                          │
│ 3. 코드 품질 검증                            │
│    (TypeScript, ESLint, 코드 스타일)        │
│    ↓                                          │
│ 4. 기능 검증                                 │
│    (expected_deliverables 확인)             │
│    ↓                                          │
│ 5. 의존성 검증                               │
│    (선행 Task 완료 확인)                    │
│    ↓                                          │
│ 6. 빌드 및 테스트 검증                       │
│    (npm run build, npm test 통과)           │
│    ↓                                          │
│ 7. VERIFICATION_REPORT_TEMPLATE.md 기반     │
│    리포트 작성                               │
│    ↓                                          │
│ 8. 리포트 저장                               │
│    (P1XX_2nd_verification.txt)              │
└──────────────────────────────────────────────┘

예상 시간: 각 Task 10-15분
```

---

### 3️⃣ 리포트 작성

#### 리포트 파일명 형식
```
P1XX_2nd_verification.txt

예시:
- P1BI1_2nd_verification.txt
- P1BA1_2nd_verification.txt
- P1F2_2nd_verification.txt
```

#### 리포트 내용 구성 (반드시 9개 섹션 모두 포함)
```
1. 헤더 정보 (Task ID, Name, Status 등)
2. 태스크 개요 (파일, 기능, 의존성)
3. 생성된 파일 검증 (파일 존재, 내용)
4. 코드 품질 검증 (TypeScript, ESLint, Style)
5. 빌드 및 테스트 검증 (Build, Test 결과)
6. 보안 및 성능 검증
7. 의존성 검증 (선행 Task 확인)
8. 문제 및 권장사항
9. 최종 평가 (✅ PASS / ❌ FAIL)
```

#### 리포트 템플릿 사용
```
1. VERIFICATION_REPORT_TEMPLATE.md 열기
2. [TEMPLATE] 헤더 제거
3. 각 섹션을 Task 정보로 채우기
4. Project Grid에서 정보 참조하기
5. P1XX_2nd_verification.txt로 저장
```

#### 중요 참고 사항
```
⭐ 각 리포트는 Project Grid 정보를 기반으로 작성해야 합니다
⭐ VERIFICATION_REPORT_TEMPLATE.md 양식 정확히 준수
⭐ 명확한 ✅/❌ 상태 표시 필수
⭐ 파일 인코딩: UTF-8 (한글 포함 가능)
```

---

### 4️⃣ 리포트 저장

#### 저장 위치
```
C:\Development_PoliticianFinder_copy\Developement_Real_PoliticianFinder\
  0-5_Development_ProjectGrid\
    verification_reports\
      ← 여기에 저장!
```

#### 저장 파일 목록
```
verification_reports/
├── P1BI1_2nd_verification.txt
├── P1BI2_2nd_verification.txt
├── P1BA1_2nd_verification.txt
├── P1BA2_2nd_verification.txt
├── P1BA4_2nd_verification.txt
├── P1F2_2nd_verification.txt
├── P1F3_2nd_verification.txt
├── P1F4_2nd_verification.txt
├── P1F5_2nd_verification.txt
├── P1F6_2nd_verification.txt
├── P1F10_2nd_verification.txt
└── P1F11_2nd_verification.txt
```

---

## 완료 기준

### ✅ 리포트 완료 체크리스트

```
검증 완료:
☐ P1BI1 - Supabase 클라이언트
☐ P1BI2 - API 미들웨어
☐ P1BA1 - 회원가입 API
☐ P1BA2 - 로그인 API
☐ P1BA4 - 비밀번호 재설정 API
☐ P1F2 - 로그인 페이지
☐ P1F3 - 회원가입 페이지
☐ P1F4 - 비밀번호 찾기 페이지
☐ P1F5 - 비밀번호 재설정 페이지
☐ P1F6 - 마이페이지
☐ P1F10 - 의원 프로필 페이지
☐ P1F11 - 유저 프로필 페이지

리포트 품질:
☐ 모든 리포트가 VERIFICATION_REPORT_TEMPLATE.md 준수
☐ 모든 리포트가 Project Grid 정보 참조
☐ 파일명 형식: P1XX_2nd_verification.txt
☐ 인코딩: UTF-8
☐ 저장 위치: verification_reports/

최종 확인:
☐ 12개 리포트 모두 생성
☐ 각 리포트 9개 섹션 포함
☐ 최종 상태 명확 (✅/❌)
```

---

## 예상 일정

### 시간 추정
```
각 Task 검증: 10-15분
12개 Task: 120-180분 (≈ 2-3시간)

권장 일정:
- 시작: 2025-11-04 또는 2025-11-05
- 마감: 같은 날 완료
```

### 진행 상황 보고
```
완료 후 다음 내용을 보고해주세요:

1. 완료 시간
2. 총 검증 시간
3. 발견된 문제 요약 (있을 경우)
4. 리포트 저장 위치 확인
5. Project Grid 업데이트 필요 여부
```

---

## 중요 문서

### 필수 참조 문서

```
1. VERIFICATION_REPORT_TEMPLATE.md
   위치: 0-5_Development_ProjectGrid/
   용도: 리포트 표준 양식

2. VERIFICATION_INSTRUCTIONS.md
   위치: 0-5_Development_ProjectGrid/
   용도: 상세 검증 가이드

3. generated_grid_full_v4_10agents_with_skills.json
   위치: 0-5_Development_ProjectGrid/action/PROJECT_GRID/grid/
   용도: Task 상세 정보 (Project Grid)

4. 기존 검증 리포트 예제
   위치: 0-5_Development_ProjectGrid/verification_reports/
   예: P1O1_2nd_verification.txt
```

---

## 문제 해결

### 작업 중 문제 발생 시

```
Q: Project Grid 파일을 어떻게 읽나요?
A: JSON 파일이므로 텍스트 에디터로 열거나 jq 명령어 사용
   명령어: jq '.[] | select(.task_id == "P1BA1")' file.json

Q: 템플릿에서 뭘 써야 할지 모르겠어요
A: VERIFICATION_INSTRUCTIONS.md의 "리포트 작성 가이드" 참조
   또는 기존 리포트 예제(P1O1) 참조

Q: 어느 파일을 검증해야 하나요?
A: Project Grid의 "generated_files" 확인
   또는 VERIFICATION_INSTRUCTIONS.md의 "프로젝트 구조" 참조

Q: 검증 기준이 뭔가요?
A: VERIFICATION_REPORT_TEMPLATE.md의 각 섹션 참조
   또는 기존 완료된 리포트 확인
```

---

## 최종 체크 전 확인

```
작업 시작 전:
☐ VERIFICATION_REPORT_TEMPLATE.md 읽음
☐ VERIFICATION_INSTRUCTIONS.md 읽음
☐ Project Grid 파일 액세스 가능
☐ 소스 코드 경로 이해
☐ 12개 Task 목록 확인

작업 완료 후:
☐ 12개 리포트 모두 생성
☐ 파일명 정확 (P1XX_2nd_verification.txt)
☐ UTF-8 인코딩
☐ 각 리포트 9개 섹션 포함
☐ verification_reports/ 폴더 확인

제출 전:
☐ 모든 리포트 한 번 더 검토
☐ 최종 상태 명확
☐ 문제점 명시
```

---

## 연락처 및 지원

```
질문 또는 문제 발생 시:

1단계: 해당 문서 다시 확인
  - VERIFICATION_REPORT_TEMPLATE.md
  - VERIFICATION_INSTRUCTIONS.md
  - 기존 리포트 예제

2단계: Project Grid 정보 재확인
  - generated_grid_full_v4_10agents_with_skills.json

3단계: 아직도 문제 있으면 보고
  - 문제 설명
  - 어느 Task인지
  - 스크린샷 또는 에러 메시지
```

---

## 상태 요약

```
현재 상황:
- Phase 1 총 20개 Task
- 검증 완료: 8개
- 검증 필요: 12개 ← 👈 당신의 작업

마감:
- 목표: 2025-11-04 또는 2025-11-05
- 예상 소요: 2-3시간

다음 단계:
- 당신의 검증 리포트 수신
- Main Agent가 이슈 수정
- 최종 Project Grid 업데이트
- Phase 1 Gate 승인 → Phase 2 진행
```

---

## 🎯 핵심 정리

```
1️⃣ 12개 Task 검증
2️⃣ VERIFICATION_REPORT_TEMPLATE.md 따라 리포트 작성
3️⃣ Project Grid 정보 참조
4️⃣ P1XX_2nd_verification.txt로 저장
5️⃣ verification_reports/ 폴더에 저장

예상 완료: 2-3시간
마감: 2025-11-04~05
```

---

**요청 발신**: Main Agent (Claude Code Session 1)
**작업 요청일**: 2025-11-04
**우선순위**: 🔴 HIGH
**상태**: 🟡 AWAITING ACTION

**준비 완료되면 시작해주세요!**
