# 자동화된 검증 프로세스 매뉴얼

**버전**: 1.0
**작성일**: 2025-11-05
**용도**: Phase 1+ 태스크 검증 자동화 가이드

---

## 📋 개요

이 매뉴얼은 작업 아이디(Task ID)만으로 **자동으로 검증 리포트를 생성**할 수 있는 프로세스를 설명합니다.

### 사용 시나리오

```
사용자: "P2F1 검증해"
↓
Claude Code: 자동으로 Project Grid에서 P2F1 정보 추출
↓
자동 검증 수행
↓
P2F1_2nd_verification.txt 생성
```

---

## 🔄 자동화 검증 프로세스 (5단계)

### Step 1: 작업 아이디 파싱 및 Project Grid 검색

**입력**: Task ID (예: `P1F2`, `P2BA1`)

**프로세스**:
```
1. Task ID 형식 검증
   - 형식: P{PHASE}{AREA}{NUMBER}
   - 예: P1F2 (Phase 1, Area F, Task 2)

2. 가능한 Area 코드
   - O: Operations/Setup
   - D: Database
   - BI: Backend Infrastructure
   - BA: Backend APIs
   - F: Frontend
   - T: Testing

3. Project Grid JSON 파일 위치
   경로: C:\Development_PoliticianFinder_copy\
         Developement_Real_PoliticianFinder\
         0-5_Development_ProjectGrid\
         action\data\
         generated_grid_full_v4_10agents_with_skills.json
```

**JSON 검색 쿼리**:
```json
{
  "phase": 1,
  "task_id": "P1F2"
}
```

**추출할 필드**:
- `task_id`: 작업 ID
- `task_name`: 작업 이름 (한글)
- `area`: 영역 코드
- `instruction_file`: 작업 지침서 경로
- `assigned_agent`: 할당된 에이전트
- `generated_files`: 생성된 파일 목록
- `progress`: 진행률
- `status`: 상태
- `dependency_chain`: 의존성
- `duration`: 소요 시간
- `build_result`: 빌드 결과
- `test_history`: 테스트 이력
- `remarks`: 비고

**예시 출력** (P1F2):
```
{
  "task_id": "P1F2",
  "task_name": "로그인 페이지",
  "area": "F",
  "phase": 1,
  "instruction_file": "tasks/P1F2.md",
  "assigned_agent": "1차: frontend-developer | 2차: Claude Code",
  "generated_files": "1_Frontend/src/app/auth/login/page.tsx;1_Frontend/src/lib/auth.ts",
  "progress": 100,
  "status": "완료",
  "dependency_chain": "P1BI1, P1BI2, P1BA2"
}
```

---

### Step 2: 작업 지침서 읽기

**파일 위치**:
```
경로: C:\Development_PoliticianFinder_copy\
      Developement_Real_PoliticianFinder\
      0-5_Development_ProjectGrid\
      {instruction_file}

예: tasks/P1F2.md
```

**추출 정보**:
- 작업 설명
- 기능 요구사항 (REQ-001, REQ-002, ...)
- 예상 결과물 파일 목록
- 의존성 확인

---

### Step 3: 생성된 파일 검증

**프로세스**:

```
1. 생성된 파일 목록 추출
   generated_files: "1_Frontend/src/app/auth/login/page.tsx;..."

2. 각 파일에 대해:
   a) 파일 존재 여부 확인
      - Read 도구로 파일 열기
      - 파일 크기, 수정 날짜 확인

   b) Task ID 주석 확인
      - 파일 첫 5줄 내에서 Task ID 찾기
      - 형식: // P1F2: [설명] 또는 // Task ID: P1F2

   c) 파일 내용 유효성 검증
      - 빈 파일 여부 확인
      - 필수 구조 확인 (함수, 클래스, export 등)
      - 줄 수 확인

   d) TypeScript 타입 체크
      - tsc 명령어로 타입 검증
```

**체크리스트**:
```
✅ 파일 존재
✅ Task ID 주석 포함
✅ 빈 파일 아님
✅ 필수 구조 완전
✅ TypeScript 에러 없음
```

---

### Step 4: 코드 품질 및 기능성 검증

**검증 항목**:

```
1. TypeScript 검증
   - `tsc --noEmit --skipLibCheck` 실행
   - 에러/경고 개수 기록

2. ESLint 검증 (선택)
   - `npm run lint` 실행
   - 위반사항 기록

3. 빌드 검증
   - `npm run build` 실행
   - 빌드 성공 여부 기록

4. 코드 품질 지표
   - 필수 함수/메서드 확인
   - 에러 처리 로직 확인
   - 주석/문서화 확인
   - 보안 이슈 확인
```

**검증 결과 상태**:
- ✅ PASS: 모든 검증 통과
- ⚠️ PARTIAL: 일부 경고 또는 선택사항 미충족
- ❌ FAIL: 중요한 오류 발견

---

### Step 5: 검증 리포트 생성

**리포트 양식**: VERIFICATION_REPORT_TEMPLATE.md 기반

**생성 위치**:
```
C:\Development_PoliticianFinder_copy\
Developement_Real_PoliticianFinder\
0-5_Development_ProjectGrid\
validation\results\
{TASK_ID}_verification.txt
```

**리포트 구조** (9개 섹션):

```
1. 헤더 정보
   - Task ID, Name, Phase, Area, Priority
   - Status (✅ PASS / ⚠️ PARTIAL / ❌ FAIL)
   - 검증 날짜, 검증자

2. 태스크 개요
   - 예상 결과물 (Deliverables)
   - 기능 요구사항 (Requirements)
   - 의존성 (Dependencies)

3. 파일 검증
   - 파일 존재 확인
   - 각 파일의 내용 검증

4. 코드 품질 검증
   - TypeScript 체크
   - 코드 스타일
   - 문서화

5. 빌드 및 테스트
   - 빌드 상태
   - 테스트 결과

6. 보안 및 성능
   - 보안 이슈
   - 성능 고려사항

7. 의존성 검증
   - 선행 Task 상태
   - 의존성 충족 여부

8. 문제 및 권장사항
   - 발견된 문제
   - 해결 방법

9. 최종 평가
   - 종합 평가
   - Phase Gate 준비 상태
```

---

## 📝 자동화 검증 스크립트 의사코드

```python
def verify_task(task_id: str):
    """
    Task ID만으로 자동 검증

    Args:
        task_id: "P1F2", "P2BA1" 등

    Returns:
        verification_report: 검증 리포트 텍스트
    """

    # Step 1: Project Grid에서 작업 정보 추출
    task_info = extract_from_project_grid(task_id)

    if not task_info:
        return f"❌ Error: Task {task_id} not found in Project Grid"

    # Step 2: 작업 지침서 읽기
    instruction_file = task_info["instruction_file"]
    requirements = read_instruction_file(instruction_file)

    # Step 3: 생성된 파일 검증
    generated_files = task_info["generated_files"].split(";")
    file_validation_results = []

    for file_path in generated_files:
        validation = {
            "path": file_path,
            "exists": file_exists(file_path),
            "has_task_id": check_task_id_comment(file_path),
            "not_empty": not is_empty_file(file_path),
            "no_syntax_errors": check_typescript(file_path),
            "line_count": count_lines(file_path)
        }
        file_validation_results.append(validation)

    # Step 4: 코드 품질 검증
    quality_metrics = {
        "typescript_errors": run_type_check(),
        "eslint_warnings": run_lint_check() if has_eslint_config() else None,
        "build_status": run_build_check(),
        "documentation_quality": assess_documentation(generated_files)
    }

    # Step 5: 검증 리포트 생성
    report = generate_verification_report(
        task_info=task_info,
        requirements=requirements,
        file_validations=file_validation_results,
        quality_metrics=quality_metrics
    )

    # Step 6: 리포트 저장
    report_path = f"validation/results/{task_id}_verification.txt"
    save_report(report_path, report)

    return report
```

---

## 🎯 사용 예시

### 예시 1: 단일 Task 검증

```
입력: verify_task("P1F2")

프로세스:
1. Project Grid에서 P1F2 정보 추출
2. tasks/P1F2.md 읽기
3. 1_Frontend/src/app/auth/login/page.tsx 검증
4. 1_Frontend/src/lib/auth.ts 검증
5. 빌드 및 타입 체크
6. P1F2_verification.txt 생성

출력:
================================================================================
TASK VERIFICATION REPORT
================================================================================

Task ID: P1F2
Task Name: 로그인 페이지
Phase: 1
Area: F
Priority: HIGH
Status: ✅ PASS

Verification Date: 2025-11-05
Verifier: Claude Code (Automated)

... (9개 섹션 상세 보고)
```

### 예시 2: 복수 Task 검증

```
입력: verify_multiple_tasks(["P2F1", "P2BA1", "P2T1"])

프로세스:
1. P2F1 검증 → P2F1_verification.txt
2. P2BA1 검증 → P2BA1_verification.txt
3. P2T1 검증 → P2T1_verification.txt

출력: BATCH_VERIFICATION_SUMMARY.txt
(전체 검증 결과 요약)
```

---

## 🛠️ 자동화 프로세스 체크리스트

### 사전 준비

- [ ] Project Grid JSON 파일 위치 확인
- [ ] VERIFICATION_REPORT_TEMPLATE.md 위치 확인
- [ ] 작업 지침서 디렉토리 구조 파악
- [ ] 검증 결과 저장 디렉토리 준비

### 검증 실행 시

- [ ] Task ID 형식 유효성 검증
- [ ] Project Grid에서 Task 존재 확인
- [ ] 생성된 파일 목록 추출
- [ ] 각 파일 존재 확인
- [ ] Task ID 주석 확인
- [ ] TypeScript 타입 체크
- [ ] 빌드 테스트
- [ ] 리포트 생성 및 저장

### 검증 완료 후

- [ ] 리포트 파일 생성 확인
- [ ] 리포트 내용 검토
- [ ] 문제 발견 시 수정 작업 진행
- [ ] Project Grid 업데이트 (필요시)

---

## 📊 검증 상태별 의미

### ✅ PASS
- 모든 파일 존재
- Task ID 주석 포함
- TypeScript 에러 없음
- 빌드 성공
- 모든 기능 요구사항 충족

**의미**: Phase Gate 준비 완료

### ⚠️ PARTIAL / CONDITIONAL PASS
- 대부분의 요구사항 충족
- 일부 경고 또는 선택사항 미충족
- 기능적으로는 동작

**의미**: 검토 후 진행 가능 (권장: 경고 해결)

### ❌ FAIL
- 필수 파일 누락
- TypeScript 에러 존재
- 빌드 실패
- 중요 기능 누락

**의미**: 수정 후 재검증 필요

---

## 🔍 검증 항목 상세 설명

### 1. 파일 존재 검증

```
목표: 예상된 모든 파일이 생성되었는가?

검증 항목:
- 파일 경로 정확성
- 파일 크기 (0KB 아님)
- 파일 수정 날짜
```

### 2. Task ID 주석 검증

```
목표: 파일에 Task ID 주석이 포함되어 있는가?

형식:
// Task ID: P1F2: 로그인 페이지
// P1F2

위치: 파일 첫 5줄 이내 (주석 블록 상단)

이유: 파일과 Task의 연결 추적
```

### 3. TypeScript 검증

```
목표: 타입 안전성 보장

명령어:
tsc --noEmit --skipLibCheck

확인사항:
- 타입 에러 없음
- 함수 반환값 타입 지정
- Props 타입 정의
- 상태 타입 지정
```

### 4. 기능 요구사항 검증

```
목표: 지정된 모든 기능이 구현되었는가?

방법:
1. 작업 지침서에서 REQ-001, REQ-002 등 추출
2. 각 요구사항을 코드에서 찾기
3. 요구사항별 완료 상태 기록

예:
REQ-001: 로그인 폼 UI 구현 ✅
REQ-002: 이메일 검증 로직 ✅
REQ-003: 비밀번호 해싱 ✅
```

### 5. 의존성 검증

```
목표: 선행 Task가 모두 완료되었는가?

프로세스:
1. Task의 dependency_chain 확인
2. 각 선행 Task의 상태 조회
3. 선행 Task의 검증 결과 확인

예:
P1F2 의존성: P1BI1, P1BI2, P1BA2
- P1BI1 (Supabase 클라이언트): ✅ 완료
- P1BI2 (API 미들웨어): ✅ 완료
- P1BA2 (로그인 API): ✅ 완료
→ 모든 의존성 충족 ✅
```

---

## 📁 디렉토리 구조 참고

```
Development_PoliticianFinder_copy/
├── Developement_Real_PoliticianFinder/
│   └── 0-5_Development_ProjectGrid/
│       ├── AUTOMATED_VERIFICATION_MANUAL.md (← 이 파일)
│       ├── action/
│       │   └── data/
│       │       └── generated_grid_full_v4_10agents_with_skills.json
│       ├── validation/
│       │   ├── instructions/
│       │   │   ├── VERIFICATION_REPORT_TEMPLATE.md
│       │   │   └── VERIFICATION_OVERVIEW.md
│       │   └── results/
│       │       ├── P1O1_verification.txt
│       │       ├── P1D1_verification.txt
│       │       └── ... (자동 생성 리포트)
│       └── tasks/
│           ├── P1O1.md
│           ├── P1F2.md
│           ├── P1BA1.md
│           └── ... (작업 지침서)
├── 1_Frontend/
├── 2_Database/
└── 3_Backend_APIs/
```

---

## ⚡ 빠른 시작

### 최소 실행 명령어

```bash
# 1. 단일 Task 검증
verify_task("P1F2")

# 2. 전체 Phase 검증
verify_phase(1)

# 3. 복수 Task 검증
verify_multiple_tasks(["P1F2", "P1BA2", "P1T1"])

# 4. Phase 전 모든 Task 재검증
verify_all_tasks_in_phase(1)
```

---

## 🎓 핵심 원칙

| 원칙 | 설명 |
|------|------|
| **입력 최소화** | Task ID만으로 전체 검증 수행 |
| **프로세스 표준화** | 모든 검증이 동일한 9개 섹션 따름 |
| **자동 추적** | Project Grid에서 메타데이터 자동 추출 |
| **명확한 결과** | ✅/⚠️/❌로 즉시 상태 파악 |
| **재사용성** | Phase 1~N 모두 동일한 프로세스 적용 |

---

## 🔗 관련 문서

- `VERIFICATION_REPORT_TEMPLATE.md`: 리포트 양식 상세
- `VERIFICATION_OVERVIEW.md`: 검증 시스템 개요
- `PROJECT_GRID_매뉴얼_V4.0.md`: Project Grid 사용법
- `PHASE_BASED_DUAL_VERIFICATION.md`: Phase 기반 검증 프로세스

---

## 📞 문제 해결

### Q: Task ID를 입력했는데 Project Grid에서 찾을 수 없다?

**A**:
1. Task ID 형식 확인 (예: P1F2, P2BA1)
2. generated_grid_full_v4_10agents_with_skills.json 파일 위치 확인
3. JSON 파일의 phase와 task_id 필드 확인

### Q: 파일은 있는데 "파일 존재" 검증에서 실패한다?

**A**:
1. 파일 경로가 정확한지 확인
2. 파일명이 JSON의 generated_files와 일치하는지 확인
3. 파일이 빈 파일인지 확인 (크기 > 0)

### Q: TypeScript 에러가 발생했다?

**A**:
1. 오류 메시지에서 파일과 줄 번호 확인
2. 타입 지정 확인 (props, return type 등)
3. 임포트 경로 확인

### Q: 빌드가 실패했다?

**A**:
1. `npm install` 실행으로 의존성 재설치
2. 최근 변경사항 확인
3. 에러 로그 상세 검토

---

**마지막 업데이트**: 2025-11-05
**매뉴얼 버전**: 1.0
**상태**: 완성 ✅
