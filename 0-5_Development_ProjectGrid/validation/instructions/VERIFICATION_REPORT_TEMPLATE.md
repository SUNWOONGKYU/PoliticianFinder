# 태스크 검증 리포트 표준 양식

**버전**: 1.0
**작성일**: 2025-11-04
**용도**: Phase 1 검증 (2차 실행)

---

## 문서 구조

```
1. 헤더 정보
2. 태스크 개요
3. 생성된 파일 검증
4. 코드 품질 검증
5. 빌드 및 테스트 검증
6. 보안 및 성능 검증
7. 의존성 검증
8. 문제 및 권장사항
9. 최종 평가
```

---

# [TEMPLATE] 태스크 검증 리포트

## 1. 헤더 정보

```
================================================================================
TASK VERIFICATION REPORT
================================================================================

Task ID: [P1XX]
Task Name: [한글 이름]
Phase: 1
Area: [O/D/BI/BA/F/T]
Priority: [LOW/MEDIUM/HIGH]
Status: [✅ PASS / ❌ FAIL / ⚠️ PARTIAL]

Verification Date: 2025-11-04
Verifier: Claude Code (Session 2)
1st Execution: [에이전트 이름]
2nd Verification: Claude Code (Session 2)

Report Duration: ~XX minutes
```

---

## 2. 태스크 개요

### 2.1 예상 결과물 (Expected Deliverables)

```
파일 경로                    파일명              상태
========================================================================
[경로1]                     [파일명1]           ✅/❌/⚠️
[경로2]                     [파일명2]           ✅/❌/⚠️

예시:
src/app/auth/login          page.tsx            ✅
app/api/auth/login          route.ts            ✅
```

### 2.2 기능 요구사항 (Functional Requirements)

```
요구사항 ID          설명                        완료도
========================================================================
REQ-001             [기능1]                      ✅/❌
REQ-002             [기능2]                      ✅/❌
REQ-003             [기능3]                      ✅/❌

예시:
REQ-001             로그인 폼 UI 구현             ✅
REQ-002             이메일 검증                  ✅
REQ-003             비밀번호 해싱               ✅
```

### 2.3 의존성 (Dependencies)

```
선행 Task          상태          설명
========================================================================
[P1XX]             ✅/❌/⏳       [설명]

예시:
P1F2               ✅             로그인 페이지 완료
P1BI1              ✅             Supabase 클라이언트 완료
P1BA1              ✅             회원가입 API 완료
```

---

## 3. 생성된 파일 검증

### 3.1 파일 존재 확인

```
파일 경로                           크기      수정일        상태
========================================================================
[경로/파일명]                       [크기]    [날짜]        ✅/❌

예시:
src/app/auth/login/page.tsx         2.5 kB    2025-11-01    ✅
```

### 3.2 파일 내용 검증

```
파일명: [page.tsx]
위치: [src/app/auth/login/]

Content Validation:
- Task ID 주석 ✅/❌
  위치: [첫 줄 또는 파일 상단]
  형식: // P1FXX: [설명]
  상태: ✅/❌ [문제 설명]

- 필수 구성 요소 ✅/❌
  ✅ React 컴포넌트 정의
  ✅ Props 타입 정의
  ✅ 상태 관리
  ✅ 에러 처리
  ❌ [누락된 요소 설명]

- 코드 라인 수
  예상: ~150줄
  실제: ~155줄
  상태: ✅ (±10% 허용)

- 주석 및 문서화
  ✅ 함수 주석
  ✅ 복잡한 로직 설명
  ✅ TODO 항목 확인
```

---

## 4. 코드 품질 검증

### 4.1 TypeScript 검증

```
TypeScript Type Check:
상태: ✅ PASS / ❌ FAIL

에러 개수: 0 / [개수]
경고 개수: 0 / [개수]

발견된 에러 (있을 경우):
1. [파일:라인번호] - 에러 메시지
   > 원인: [설명]
   > 해결: [방법]
```

### 4.2 ESLint 검증

```
ESLint:
상태: ✅ PASS / ❌ FAIL

규칙 위반: 0 / [개수]
경고: 0 / [개수]

발견된 위반 (있을 경우):
1. [파일:라인번호] - 규칙명
   > 메시지: [내용]
   > 수정 필요: ✅/❌
```

### 4.3 코드 스타일 검증

```
Code Style:
✅/❌ Naming Convention (변수명, 함수명 등)
✅/❌ Indentation (4칸 또는 2칸 일관성)
✅/❌ Line Length (120자 제한)
✅/❌ Import 순서 (외부/내부 라이브러리 분류)
✅/❌ Unused Variables (미사용 변수 없음)
✅/❌ Unused Imports (미사용 import 없음)

문제점 (있을 경우):
1. [파일:라인번호] - 문제 설명
```

### 4.4 타입 안정성 (Type Safety)

```
Type Safety:
✅/❌ Any 사용 없음
✅/❌ Null/Undefined 체크
✅/❌ 제네릭 타입 정의
✅/❌ Props 타입 완성도 > 95%

문제점 (있을 경우):
1. [파일:라인번호] - any 타입 사용
2. [파일:라인번호] - null 체크 누락
```

---

## 5. 빌드 및 테스트 검증

### 5.1 빌드 검증

```
Build Status:
커맨드: npm run build
상태: ✅ SUCCESS / ❌ FAILED
실행 시간: ~XX초
빌드 크기: XX.X kB

빌드 결과:
✅ TypeScript 컴파일 성공
✅ 번들 생성 성공
✅ 리소스 최적화 완료

생성된 산출물:
- Pages: XX개
- API Routes: XX개
- Chunks: XX개

빌드 에러 (있을 경우):
1. [에러 메시지]
   > 파일: [경로]
   > 라인: [번호]
   > 해결: [방법]
```

### 5.2 테스트 검증

```
Unit Tests:
커맨드: npm test
상태: ✅ XX/XX PASS / ❌ XX FAILED
성공률: XX%
실행 시간: ~XX초

테스트 결과:
✅ [테스트명] - PASS
✅ [테스트명] - PASS
❌ [테스트명] - FAIL (이유)

실패한 테스트 (있을 경우):
1. [테스트명]
   > 에러: [메시지]
   > 원인: [설명]
   > 해결: [방법]
```

### 5.3 E2E 테스트 검증 (해당되는 경우)

```
E2E Tests:
프레임워크: Playwright
상태: ✅ XX/XX PASS / ❌ XX FAILED
성공률: XX%

테스트 케이스:
✅ [테스트 케이스명] - PASS
❌ [테스트 케이스명] - FAIL

스크린샷 (실패한 경우):
- [테스트명]: [스크린샷 경로 또는 URL]
```

---

## 6. 보안 및 성능 검증

### 6.1 보안 검증

```
Security:
✅/❌ 하드코딩된 시크릿 없음
✅/❌ 입력 검증 (Input Validation)
✅/❌ SQL 인젝션 방지
✅/❌ XSS 방지
✅/❌ CSRF 보호
✅/❌ 인증 확인
✅/❌ 권한 검사 (Authorization)

발견된 보안 이슈 (있을 경우):
1. [심각도: CRITICAL/MAJOR/MINOR] [파일:라인번호]
   > 문제: [설명]
   > 해결: [방법]
```

### 6.2 성능 검증

```
Performance:
✅/❌ 페이지 로드 시간 < 2초
✅/❌ 메모리 누수 없음
✅/❌ 불필요한 렌더링 없음
✅/❌ 이미지 최적화
✅/❌ 번들 사이즈 최적화

성능 메트릭:
- 초기 로드: XX ms
- 상호작용: XX ms
- 총 크기: XX kB

발견된 성능 이슈 (있을 경우):
1. [파일] - [문제 설명]
```

---

## 7. 의존성 검증

### 7.1 선행 Task 확인

```
선행 Task 완료 여부:
✅ P1F2 - 로그인 페이지
✅ P1BI1 - Supabase 클라이언트
✅ P1BA1 - 회원가입 API

상태: ✅ 모든 선행 Task 완료
```

### 7.2 라이브러리 의존성

```
Dependencies:
✅/❌ React 18.3.1
✅/❌ Next 14.2.18
✅/❌ Supabase JS 2.39.0
✅/❌ Tailwind CSS 3.x

버전 충돌: ✅ 없음 / ❌ 있음

추가 라이브러리 (필요한 경우):
[라이브러리명] - [버전] - [이유]
```

---

## 8. 문제 및 권장사항

### 8.1 발견된 문제

```
문제 요약:
총 문제 개수: [개수]
- CRITICAL: [개수]
- MAJOR: [개수]
- MINOR: [개수]

상세 문제 목록:

[CRITICAL] 문제 1
- 파일: [경로:라인번호]
- 설명: [문제 설명]
- 영향: [미치는 영향]
- 해결: [해결 방법]
- 우선순위: 즉시 수정 필요

[MAJOR] 문제 2
- 파일: [경로:라인번호]
- 설명: [문제 설명]
- 해결: [해결 방법]

[MINOR] 문제 3
- 파일: [경로:라인번호]
- 설명: [문제 설명]
- 권장사항: [개선 방법]
```

### 8.2 권장사항

```
권장사항 (선택 사항):

1. [권장사항 1]
   > 이유: [설명]
   > 효과: [기대 효과]
   > 우선순위: HIGH/MEDIUM/LOW

2. [권장사항 2]
   > 이유: [설명]

3. [권장사항 3]
```

### 8.3 추가 확인 사항

```
추가 확인 사항 (있을 경우):
- [ ] [확인 항목 1]
- [ ] [확인 항목 2]
- [ ] [확인 항목 3]
```

---

## 9. 최종 평가

### 9.1 검증 결과 요약

```
검증 항목                    결과              비율
========================================================================
파일 존재 및 구조            ✅ PASS           100%
코드 품질                    ✅ PASS           100%
TypeScript 타입 체크         ✅ PASS           0 에러
ESLint                       ✅ PASS           0 위반
빌드                        ✅ SUCCESS        87.1 kB
테스트                       ✅ XX/XX PASS     100%
보안                        ✅ PASS           모든 점검 통과
성능                        ✅ GOOD           성능 범위 내
의존성                      ✅ 모두 완료      선행 Task 완료

총 평가: ✅ PASS / ❌ FAIL / ⚠️ CONDITIONAL PASS
```

### 9.2 최종 상태

```
Status: ✅ READY FOR PRODUCTION / ❌ BLOCKED / ⚠️ NEEDS FIXES

상세:
- 기능 완성도: 100% / XX%
- 코드 품질: 우수 / 양호 / 보통 / 개선 필요
- 테스트 커버리지: XX%
- 문서화: 완전 / 부분 / 미흡
- 보안: 안전 / 주의 / 위험

다음 단계: [진행 / 대기 / 수정 필요]
예상 완료: 2025-11-04 / 2025-11-05
```

### 9.3 서명 및 승인

```
Verification Results:
- Verified By: Claude Code (Session 2)
- Verification Date: 2025-11-04
- Verification Time: XX:XX UTC

Approval Status: ✅ APPROVED / ❌ REJECTED / ⚠️ CONDITIONAL APPROVAL

Blocker Issues: ✅ 없음 / ❌ 있음 (설명)
Action Items: [다음 단계]

Next Phase: ✅ PROCEED TO NEXT PHASE / ⏳ AWAITING FIXES
```

---

## 예제 리포트

### 실제 예제 (P1BA1 - 회원가입 API)

```
================================================================================
TASK VERIFICATION REPORT
================================================================================

Task ID: P1BA1
Task Name: 회원가입 API
Phase: 1
Area: BA
Priority: HIGH
Status: ✅ PASS

Verification Date: 2025-11-04
Verifier: Claude Code (Session 2)
1st Execution: backend-developer
2nd Verification: Claude Code (Session 2)

Report Duration: ~15 minutes

================================================================================
2. TASK OVERVIEW
================================================================================

Expected Deliverables:
app/api/auth/signup/route.ts                     ✅

Functional Requirements:
REQ-001  이메일 중복 확인                        ✅
REQ-002  닉네임 중복 확인                        ✅
REQ-003  비밀번호 6가지 검증                     ✅
REQ-004  Supabase 회원가입 연동                  ✅

Dependencies:
P1BI1    ✅ Supabase 클라이언트 완료
P1BI2    ✅ API 미들웨어 완료

================================================================================
3. FILE VERIFICATION
================================================================================

File Existence:
app/api/auth/signup/route.ts                     3.5 kB    2025-11-01    ✅

File Content:
- Task ID Comment: ✅
  위치: 첫 번째 줄
  형식: // P1BA1: 회원가입 API

- Core Components: ✅
  ✅ POST 핸들러
  ✅ Zod 검증
  ✅ 데이터베이스 쿼리
  ✅ 에러 처리

- Line Count: 예상 ~150줄, 실제 ~155줄 (✅ 정상 범위)

================================================================================
4. CODE QUALITY
================================================================================

TypeScript Check:
상태: ✅ PASS
에러: 0

ESLint Check:
상태: ✅ PASS
위반: 0

Code Style:
✅ Naming Convention - camelCase 일관
✅ Indentation - 2칸 일관
✅ Line Length - 120자 제한 준수
✅ No Unused Variables
✅ No Unused Imports

Type Safety:
✅ Any 사용 없음
✅ Null 체크 완료
✅ Props 타입 100%

================================================================================
5. BUILD & TEST
================================================================================

Build Status:
커맨드: npm run build
상태: ✅ SUCCESS
시간: ~30초
크기: 87.1 kB

Test Status:
커맨드: npm test
상태: ✅ 20/20 PASS
성공률: 100%

================================================================================
6. SECURITY & PERFORMANCE
================================================================================

Security:
✅ 하드코딩 시크릿 없음
✅ 입력 검증 완료
✅ 비밀번호 해싱
✅ 인증 확인

Performance:
✅ API 응답 < 500ms
✅ 메모리 누수 없음
✅ 번들 사이즈 최적화

================================================================================
7. ISSUES & RECOMMENDATIONS
================================================================================

Problems Found: 0

Recommendations:
1. 이메일 인증 추가 (선택)
2. Rate Limiting 설정 (권장)

================================================================================
9. FINAL EVALUATION
================================================================================

Overall Status: ✅ PASS
Completion: 100%
Code Quality: Excellent
Test Coverage: 100%
Security: Good

Approval: ✅ APPROVED
Next Phase: ✅ PROCEED
```

---

## 사용 지침

### 1. 리포트 생성 단계

```
1. 이 템플릿 복사
2. [TEMPLATE] 헤더 제거
3. Task ID, Name 입력
4. 각 섹션 상세 작성
5. 파일명: P1XX_verification.txt 또는 P1XX_2nd_verification.txt
6. verification_reports/ 폴더에 저장
```

### 2. 체크박스 사용

```
완료: ✅
실패: ❌
대기: ⏳
경고: ⚠️
```

### 3. 심각도 표시

```
CRITICAL: 즉시 수정 필수
MAJOR: 반드시 수정
MINOR: 권장 개선
```

### 4. 참조 형식

```
[파일:라인번호] 형식 사용
예: src/app/auth/signup/route.ts:45
```

---

**버전**: 1.0
**최종 수정**: 2025-11-04
**용도**: Phase 1 Verification (2차 실행)
