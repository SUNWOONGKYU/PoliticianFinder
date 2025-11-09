# 검증 작업 문서 가이드 (Verification Documents Guide)

**작성일**: 2025-11-04
**상태**: 🟢 Ready to Use
**용도**: B 에이전트를 위한 검증 작업 가이드

---

## 📚 3개 핵심 문서

검증 작업을 위해 다음 3개의 문서를 순서대로 읽으세요:

### 1️⃣ B_AGENT_VERIFICATION_REQUEST.md ⭐ 먼저 읽기
**파일명**: `B_AGENT_VERIFICATION_REQUEST.md`
**내용**: B 에이전트에게 전달하는 최종 작업 요청서
**읽는 시간**: ~5분

**포함 내용**:
- 작업 요청 사항 명확화
- 12개 Task 목록
- 전체 작업 프로세스
- 예상 일정
- 완료 기준

**언제 읽나요?**
- 가장 먼저 읽기
- 전체 작업 이해
- 무엇을 해야 하는지 명확히

---

### 2️⃣ VERIFICATION_INSTRUCTIONS.md 두 번째 읽기
**파일명**: `VERIFICATION_INSTRUCTIONS.md`
**내용**: 검증 작업 상세 지시서
**읽는 시간**: ~15분

**포함 내용**:
- 전체 검증 프로세스 설명
- Project Grid 확인 방법
- 각 Task별 검증 체크리스트
- 작업 우선순위 순서
- 리포트 작성 방법
- 템플릿 사용 가이드
- 완료 기준 및 체크리스트

**언제 읽나요?**
- 두 번째로 읽기
- 구체적인 작업 절차 이해
- 각 단계별 무엇을 해야 하는지

---

### 3️⃣ VERIFICATION_REPORT_TEMPLATE.md 필요할 때 참조
**파일명**: `VERIFICATION_REPORT_TEMPLATE.md`
**내용**: 검증 리포트 표준 양식 (9개 섹션)
**참조 시간**: Task별 10-15분

**포함 내용**:
- 리포트 표준 양식 (9개 섹션)
- 실제 리포트 예제
- 각 섹션별 작성 가이드
- 사용 지침

**언제 참조하나요?**
- 각 Task 검증할 때마다 참조
- 리포트 작성 중 필요
- 양식이 맞는지 확인

---

## 🔄 작업 흐름도

```
START
  ↓
1. B_AGENT_VERIFICATION_REQUEST.md 읽기
   (작업 요청 이해, 12개 Task 확인)
  ↓
2. VERIFICATION_INSTRUCTIONS.md 읽기
   (상세 절차 이해, 체크리스트 확인)
  ↓
3. Task 1 검증 시작 (P1BI1)
  ├─ Project Grid에서 Task 정보 읽기
  ├─ 소스 코드 파일 확인
  ├─ 코드 품질 검증
  ├─ VERIFICATION_REPORT_TEMPLATE.md 참조
  ├─ 리포트 작성 (9개 섹션)
  └─ P1BI1_2nd_verification.txt 저장
  ↓
4. Task 2-12 반복 (같은 절차)
  ↓
5. 모든 리포트 완료
  ↓
END (완료 보고)
```

---

## 📋 체크리스트

### 읽기 순서 체크리스트
```
Step 1: B_AGENT_VERIFICATION_REQUEST.md
  ☐ 파일 열기
  ☐ 전체 읽기
  ☐ 12개 Task 목록 확인
  ☐ 예상 일정 확인

Step 2: VERIFICATION_INSTRUCTIONS.md
  ☐ 파일 열기
  ☐ "개요" 섹션 읽기
  ☐ "준비 사항" 확인
  ☐ "검증 프로세스" 이해
  ☐ "체크리스트" 저장

Step 3: VERIFICATION_REPORT_TEMPLATE.md
  ☐ 파일 북마크
  ☐ 각 섹션 훑어보기
  ☐ 예제 리포트 읽기
  ☐ 필요할 때 참조
```

### 준비 사항 체크리스트
```
작업 시작 전:
☐ 3개 문서 모두 읽음
☐ Project Grid 파일 액세스 가능
  (generated_grid_full_v4_10agents_with_skills.json)
☐ 소스 코드 경로 이해
☐ verification_reports/ 폴더 확인
☐ 12개 Task 목록 숙지
```

### 작업 완료 후 체크리스트
```
작업 완료:
☐ 12개 Task 모두 검증
☐ 12개 리포트 모두 생성
  - P1BI1_2nd_verification.txt
  - P1BI2_2nd_verification.txt
  - P1BA1_2nd_verification.txt
  - P1BA2_2nd_verification.txt
  - P1BA4_2nd_verification.txt
  - P1F2_2nd_verification.txt
  - P1F3_2nd_verification.txt
  - P1F4_2nd_verification.txt
  - P1F5_2nd_verification.txt
  - P1F6_2nd_verification.txt
  - P1F10_2nd_verification.txt
  - P1F11_2nd_verification.txt

리포트 품질 확인:
☐ 모든 리포트 파일명 형식 정확 (P1XX_2nd_verification.txt)
☐ 모든 리포트 UTF-8 인코딩
☐ 모든 리포트 9개 섹션 포함
☐ 모든 리포트 최종 상태 명확 (✅/❌)
☐ verification_reports/ 폴더에 모두 저장

최종 확인:
☐ 각 리포트가 Project Grid 정보 참조
☐ VERIFICATION_REPORT_TEMPLATE.md 양식 준수
☐ 명확한 ✅/❌ 상태 표시
☐ 문제점 및 권장사항 포함
```

---

## 🎯 빠른 시작 (Quick Start)

### 5분 안에 시작하기

```
Step 1: B_AGENT_VERIFICATION_REQUEST.md 열기 (2분)
  - 작업 요청 이해
  - 12개 Task 목록 확인

Step 2: VERIFICATION_INSTRUCTIONS.md 참조 (3분)
  - "작업 순서" 섹션 확인
  - Task 우선순위 이해

Step 3: 첫 Task 검증 시작
  - P1BI1부터 시작
  - VERIFICATION_REPORT_TEMPLATE.md 기반 작성
```

---

## 📌 중요 포인트

### ⭐ 필수 사항 (MUST DO)

```
1. Project Grid를 먼저 읽기
   - 각 Task의 generated_files 확인
   - 각 Task의 expected_deliverables 확인
   - 각 Task의 dependencies 확인

2. VERIFICATION_REPORT_TEMPLATE.md 양식 준수
   - 9개 섹션 모두 포함
   - 각 섹션 정확히 작성

3. 명확한 최종 상태 표시
   - ✅ PASS
   - ❌ FAIL
   - ⚠️ CONDITIONAL PASS

4. 파일 저장
   - 파일명: P1XX_2nd_verification.txt
   - 위치: verification_reports/
   - 인코딩: UTF-8
```

### 🟡 권장 사항 (SHOULD DO)

```
1. 각 리포트마다 Project Grid 정보 참조
2. 기존 완료 리포트(P1O1 등) 예제 참조
3. 의문점은 VERIFICATION_INSTRUCTIONS.md에서 찾기
4. 리포트 작성 후 한 번 더 검토
```

---

## 📂 파일 위치

### 핵심 문서 위치
```
C:\Development_PoliticianFinder_copy\Developement_Real_PoliticianFinder\
  0-5_Development_ProjectGrid\
    ├── B_AGENT_VERIFICATION_REQUEST.md     ← 작업 요청
    ├── VERIFICATION_INSTRUCTIONS.md        ← 상세 지시
    ├── VERIFICATION_REPORT_TEMPLATE.md     ← 표준 양식
    ├── VERIFICATION_DOCUMENTS_README.md    ← 이 파일
    └── action\PROJECT_GRID\grid\
        └── generated_grid_full_v4_10agents_with_skills.json  ← Project Grid
```

### 리포트 저장 위치
```
C:\Development_PoliticianFinder_copy\Developement_Real_PoliticianFinder\
  0-5_Development_ProjectGrid\
    verification_reports\                   ← 여기에 저장!
      ├── P1BI1_2nd_verification.txt
      ├── P1BI2_2nd_verification.txt
      ├── P1BA1_2nd_verification.txt
      ... (총 12개)
```

---

## 🔗 문서 간 연계

### 문서 참조 관계
```
B_AGENT_VERIFICATION_REQUEST.md
  ↓ (전체 작업 이해 후)

VERIFICATION_INSTRUCTIONS.md
  ├─ (검증 프로세스 이해)
  ├─ (프로젝트 구조 확인)
  └─ (작업 순서 확인)
  ↓ (실제 작업 시작)

각 Task 검증
  ├─ Project Grid 읽기
  ├─ 소스 코드 확인
  ├─ 코드 품질 검증
  └─ VERIFICATION_REPORT_TEMPLATE.md 참조
      ↓
      리포트 작성
      ↓
      P1XX_2nd_verification.txt 저장
```

---

## 💡 팁 및 트릭

### Project Grid 효율적으로 읽기
```bash
# 특정 Task 정보 조회 (JSON)
jq '.[] | select(.task_id == "P1BA1")' generated_grid_full_v4_10agents_with_skills.json

# 또는 텍스트 에디터에서
- Ctrl+F 또는 Cmd+F로 "P1BA1" 검색
- generated_files, expected_deliverables 확인
```

### 리포트 작성 효율화
```
1. VERIFICATION_REPORT_TEMPLATE.md 복사
2. [TEMPLATE] 헤더 제거
3. Task 정보 입력
4. 9개 섹션 작성
5. 저장 (P1XX_2nd_verification.txt)

→ 시간: ~10-15분/Task
```

### 리포트 검토 체크리스트
```
각 리포트 완성 후:
☐ 파일명 형식 확인
☐ 9개 섹션 모두 포함
☐ Project Grid 정보 참조
☐ 최종 상태 명확
☐ 문제점/권장사항 포함
☐ UTF-8 인코딩
```

---

## ❓ FAQ

### Q1: 문서를 어느 순서로 읽나요?
**A**: 반드시 이 순서로 읽으세요:
1. B_AGENT_VERIFICATION_REQUEST.md (먼저!)
2. VERIFICATION_INSTRUCTIONS.md (다음)
3. VERIFICATION_REPORT_TEMPLATE.md (참조용)

### Q2: Project Grid는 어떻게 읽나요?
**A**:
- JSON 파일이므로 텍스트 에디터로 열 수 있습니다
- Ctrl+F로 Task ID 검색 (예: "P1BA1")
- generated_files, expected_deliverables 확인

### Q3: 리포트는 몇 개 섹션으로 나누나요?
**A**: 9개 섹션:
1. 헤더 정보
2. 태스크 개요
3. 생성된 파일 검증
4. 코드 품질 검증
5. 빌드 및 테스트 검증
6. 보안 및 성능 검증
7. 의존성 검증
8. 문제 및 권장사항
9. 최종 평가

### Q4: 예상 소요 시간은?
**A**:
- 문서 읽기: 20분
- 12개 Task 검증: 120-180분 (각 10-15분)
- 총 예상: 2-3시간

### Q5: 문제가 생기면?
**A**:
1. 해당 문서 다시 읽기
2. VERIFICATION_INSTRUCTIONS.md 상세 참조
3. 기존 완료 리포트 예제 확인
4. 아직도 문제 있으면 보고

---

## 🎯 최종 요약

### 3가지만 기억하기

```
1️⃣ 3개 문서를 순서대로 읽기
   B_AGENT_VERIFICATION_REQUEST.md
   → VERIFICATION_INSTRUCTIONS.md
   → VERIFICATION_REPORT_TEMPLATE.md

2️⃣ Project Grid 정보 기반 검증
   - generated_files 확인
   - expected_deliverables 검증
   - dependencies 확인

3️⃣ 표준 양식으로 리포트 작성
   - 9개 섹션 모두 포함
   - P1XX_2nd_verification.txt 저장
   - verification_reports/ 폴더에 저장
```

### 성공의 핵심

```
✅ Project Grid를 먼저 읽고
✅ VERIFICATION_REPORT_TEMPLATE.md 양식 따라
✅ 12개 Task 모두 검증 완료

→ Phase 1 Gate 승인 → Phase 2 진행!
```

---

## 📞 지원

### 작업 중 도움이 필요하면

```
1단계: 3개 문서 다시 읽기
  ☐ B_AGENT_VERIFICATION_REQUEST.md
  ☐ VERIFICATION_INSTRUCTIONS.md
  ☐ VERIFICATION_REPORT_TEMPLATE.md

2단계: Project Grid 다시 확인
  ☐ Task 정보 재검토
  ☐ generated_files 재확인
  ☐ expected_deliverables 재검증

3단계: 기존 완료 리포트 참조
  ☐ P1O1_2nd_verification.txt
  ☐ P1D1_2nd_verification.txt

4단계: 여전히 문제 있으면 보고
```

---

## 🚀 시작하기

**지금 시작하세요:**

1. B_AGENT_VERIFICATION_REQUEST.md 열기
2. VERIFICATION_INSTRUCTIONS.md 읽기
3. 첫 Task (P1BI1) 검증 시작
4. VERIFICATION_REPORT_TEMPLATE.md 기반 리포트 작성
5. 12개 Task 모두 완료

**예상 완료**: 2025-11-04 또는 2025-11-05

**상태**: 🟢 Ready to Start!

---

**문서 버전**: 1.0
**작성일**: 2025-11-04
**용도**: B 에이전트 가이드
**상태**: ✅ Ready to Use
