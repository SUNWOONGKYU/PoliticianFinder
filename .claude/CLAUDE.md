# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 🌾 SSALWorks Project - FIRST THINGS FIRST

**🚨 새 세션 시작 시 필수 확인 사항 (반드시 순서대로!)**

**⚡ AI-Only 원칙: 사용자가 아무 말 안 해도 자동으로 수행!**

### 1단계: 작업 기록 확인
**먼저 이 파일들을 읽어서 이전 작업 내용을 파악:**

1. **`.claude/work_logs/current.md`** 🔴 **최우선!**
   - 가장 최근 작업 내역 (활성 로그)
   - 이전 세션에서 무엇을 했는지
   - 다음에 무엇을 해야 하는지
   - 중요한 참고사항
   - **세션이 끊어졌어도 작업 연속성 유지 가능!**
   - **자동 순환**: 50KB 초과 시 날짜별 파일로 자동 저장

2. **`Web_ClaudeCode_Bridge/inbox/`** (사용자 요청 시에만 확인)
   - 대기 중인 새 작업 지시사항
   - 웹사이트에서 전달된 task JSON 파일
   - **🚨 중요: 사용자가 명시적으로 요청할 때만 확인!**
   - **자동으로 확인하지 말 것!**

### 2단계: 프로젝트 상태 확인
**현재 프로젝트 진행 상황 파악:**

3. **`PROJECT_STATUS.md`** (루트 디렉토리)
   - 현재 프로젝트 진행 상황
   - 어디까지 완료되었는지
   - 다음에 무엇을 해야 하는지

4. **`PROJECT_DIRECTORY_STRUCTURE.md`** (루트 디렉토리)
   - 전체 디렉토리 구조 및 설명
   - 파일을 어디에 저장해야 하는지
   - 네이밍 규칙 및 프로젝트 구조
   - **파일 작업 전에 이 문서를 참고하세요!**

### 3단계: Memory MCP 활용
**세션 간 정보 공유:**

- Memory MCP 서버가 설정되어 있음 (`@modelcontextprotocol/server-memory`)
- 중요한 정보는 자동으로 기억됨
- 이전 세션의 컨텍스트 활용 가능

### 작업 완료 시 필수 작업

**작업을 완료할 때마다 반드시:**

1. **`.claude/work_logs/current.md` 업데이트**
   ```
   - 작업 내용 기록
   - 생성/수정된 파일 목록
   - 검증 결과
   - 다음 작업 예정 사항
   ```

   **자동 순환 규칙**:
   - `current.md` 파일 크기 확인
   - 50KB 초과 시:
     1. `current.md` → `YYYY-MM-DD.md`로 이름 변경
     2. 새로운 `current.md` 생성
     3. 이전 로그 링크 추가
   - 30일 이상 된 로그 → `archive/`로 이동

2. **필요시 `Web_ClaudeCode_Bridge/outbox/`에 결과 보고**
   - 작업 완료 JSON 파일 생성
   - 웹사이트에서 확인 가능하도록

### ⏰ 5분 자동 커밋 규칙

**백그라운드 자동 커밋 시스템:**

1. **자동 커밋 스크립트 위치**
   - `.claude/auto_commit.sh`
   - 5분(300초)마다 자동으로 변경사항 커밋

2. **스크립트 실행 방법**
   ```bash
   # 백그라운드에서 실행
   bash .claude/auto_commit.sh &
   ```

3. **동작 방식**
   - 변경사항 확인 (`git status --porcelain`)
   - 변경사항 있으면 자동 스테이징 (`git add -A`)
   - 타임스탬프와 함께 커밋
   - 5분 대기 후 반복

4. **커밋 메시지 형식**
   ```
   auto: 자동 커밋 YYYY-MM-DD HH:MM:SS

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   ```

5. **주의사항**
   - 수동 커밋과 충돌 방지: 수동 커밋 전에는 스크립트 종료 권장
   - push는 자동으로 하지 않음 (수동 push 필요)
   - 작업 중 실시간 백업 목적

### 📂 파일 저장 위치 규칙

**설치 vs 사용법 구분:**
- **설치/설정 관련**: `2_개발준비/2-3_Development_Setup/`
- **사용법/학습 자료**: `학습용_콘텐츠/2_웹개발_지식/`

**네이밍 규칙:**
- **대분류(1-4단계)**: 한글 사용 (1_기획, 2_개발준비, 3_개발, 4_운영)
- **하위 폴더**: 영문 사용 (Project_Plan, Frontend, Backend_APIs)
- **독립 폴더**: 상황에 따라 (사업계획, 학습용_콘텐츠, Web_ClaudeCode_Bridge)

---

## ⚠️ 🚨 CRITICAL: 파일 저장 위치 철칙 🚨 ⚠️

**이 규칙은 반드시 지켜야 합니다. 실전 프로젝트에서 가장 많은 문제를 일으킨 사항입니다!**

### 1. 지정된 폴더에만 파일 저장

**규칙:**
- 파일은 **반드시 `PROJECT_DIRECTORY_STRUCTURE.md`에 정의된 폴더**에만 저장
- **임의로 새 폴더를 만들거나 예상 밖의 위치에 저장하는 것은 절대 금지**

### 2. 적절한 폴더가 없을 경우 필수 절차

**적절한 폴더가 보이지 않으면:**

1. **즉시 작업 중단**
2. **사용자에게 반드시 문의**:
   ```
   "이 파일을 저장할 적절한 폴더를 찾을 수 없습니다.

   파일명: [파일명]
   용도: [파일의 목적]

   다음 중 하나를 선택해주세요:
   A) [제안 경로 1] - [이유]
   B) [제안 경로 2] - [이유]
   C) 새 폴더 생성: [제안 경로] - [이유]

   어떤 방법을 사용할까요?"
   ```

3. **사용자 승인 후에만 진행**

### 3. 절대 하지 말아야 할 행동

❌ **금지 사항:**
- 임의로 루트 디렉토리에 파일 생성
- 예상치 못한 위치에 파일 생성
- "일단 여기 저장하고 나중에 옮기면 되겠지" 라는 생각
- 사용자 확인 없이 새 폴더 생성
- `PROJECT_DIRECTORY_STRUCTURE.md`를 무시하고 직감으로 저장

### 4. 올바른 작업 절차

✅ **올바른 절차:**
1. `PROJECT_DIRECTORY_STRUCTURE.md` 확인
2. 파일 목적에 맞는 폴더 찾기
3. 폴더가 명확하면 → 저장
4. 폴더가 불명확하면 → **사용자에게 문의 후 승인 받기**
5. 저장 후 사용자에게 저장 위치 보고

### 5. 예시 상황

**상황 1: Git 설정 파일**
- ❌ 잘못: 루트에 `.gitconfig` 저장
- ✅ 올바름: `2_개발준비/2-3_Development_Setup/Git/` 확인 → 저장

**상황 2: 새로운 유형의 파일 (예: 디자인 시스템 토큰)**
- ❌ 잘못: 임의로 `design-tokens/` 폴더 생성
- ✅ 올바름:
  ```
  "디자인 토큰 JSON 파일을 저장할 위치를 찾을 수 없습니다.

  제안:
  A) 1_기획/1-2_UI_UX_Design/Design_Guidelines/
  B) 새 폴더: 1_기획/1-2_UI_UX_Design/Design_Tokens/

  어떤 방법을 사용할까요?"
  ```

**상황 3: 테스트 파일**
- ❌ 잘못: 코드 파일 옆에 `signup.test.js` 저장
- ✅ 올바름: `3_개발/3-8_Test/unit/` 또는 해당 테스트 폴더에 저장

### 6. 왜 이 규칙이 중요한가?

**실전에서 발생한 문제들:**
- 파일이 여기저기 흩어져서 찾을 수 없음
- 프로젝트 구조가 무너짐
- 팀원 간 혼란 발생
- Git 관리 어려움
- 문서와 실제 구조 불일치

**이 규칙을 지키면:**
- ✅ 파일을 쉽게 찾을 수 있음
- ✅ 프로젝트 구조 일관성 유지
- ✅ 팀 협업 원활
- ✅ 유지보수 용이

---

### 🚀 작업 시작 전 체크리스트

- [ ] `PROJECT_STATUS.md` 읽고 현재 Phase 확인
- [ ] `PROJECT_DIRECTORY_STRUCTURE.md` 읽고 디렉토리 구조 파악
- [ ] 현재 Phase에 맞는 작업 폴더 확인
- [ ] **파일 저장 위치 규칙 숙지 (위 CRITICAL 섹션 반드시 확인!)**


---

## ⚠️ 🚨 CRITICAL: 작업 6대 원칙 🚨 ⚠️

**이 원칙들은 실전 프로젝트에서 반복적으로 발생한 문제를 방지하기 위한 핵심 규칙입니다!**

### 원칙 1: AI-Only 작업 원칙

**기본 방침:**
- **모든 작업은 AI가 수행하는 것을 원칙으로 함**
- 사용자에게 요청하는 것은 **최후의 수단**

**AI가 할 수 없는 경우 절차:**

1. **먼저 다양한 방법 연구**
   - 다른 도구 사용 가능한가?
   - 우회 방법이 있는가?
   - 다른 접근 방식은?
   - 최소 3가지 이상 시도

2. **정말 불가능할 때만 사용자에게 요청**
   ```
   "다음 작업을 수행하려 했으나 AI로는 불가능합니다:

   작업: [작업 내용]

   시도한 방법:
   1. [방법 1] - 실패 (이유)
   2. [방법 2] - 실패 (이유)
   3. [방법 3] - 실패 (이유)

   사용자님께서 다음을 수행해주셔야 합니다:
   [구체적인 요청 사항]

   진행하시겠습니까?"
   ```

**예시:**

❌ **잘못된 접근:**
```
"GitHub 토큰이 필요합니다. 설정해주세요."
(즉시 요청 - 다른 방법 시도 X)
```

✅ **올바른 접근:**
```
"MCP 서버로 GitHub 연동 시도 → 실패
환경 변수로 토큰 읽기 시도 → 실패
.env 파일 확인 시도 → 파일 없음

다양한 방법을 시도했으나 불가능합니다.
GitHub 토큰 설정이 필요합니다. 진행하시겠습니까?"
```

---

### 원칙 2: 절대 시간 추정 금지

**금지 사항:**
- ❌ "이 작업은 3시간 걸립니다"
- ❌ "예상 소요 시간: 2일"
- ❌ "5주 안에 완료 가능합니다"
- ❌ 모든 형태의 시간 추정 금지

**이유:**
- 시간 추정은 항상 부정확함
- 실제와 차이나서 혼란 발생
- 사용자에게 잘못된 기대 형성
- **실전에서 시간 추정은 전부 엉터리였음**

**대신 사용할 표현:**

✅ **올바른 표현:**
- "Task를 단계별로 나누어 진행하겠습니다"
- "작업을 완료하고 보고하겠습니다"
- "다음 단계로 진행하겠습니다"
- 진행 상황만 보고 (시간 언급 X)

**작업 계획 제시 시:**

❌ **잘못된 계획:**
```
작업 계획:
1. DB 스키마 작성 (2시간)
2. API 개발 (5시간)
3. 테스트 (3시간)
총 예상 시간: 10시간
```

✅ **올바른 계획:**
```
작업 계획:
1. DB 스키마 작성
2. API 개발
3. 테스트
4. 검증

각 단계를 완료하고 다음 단계로 진행하겠습니다.
```

---

### 원칙 3: 불필요한 문서 생성 금지

**기본 방침:**
- **문서 생성 전 반드시 사용자 승인 필요**
- 사용자가 보고 싶어하는 문서만 생성
- 무분별한 문서 생성 절대 금지

**문서 생성 전 필수 절차:**

1. **생성 전 문의**
   ```
   "다음 문서를 생성하려고 합니다:

   파일명: [파일명]
   위치: [저장 경로]
   목적: [왜 이 문서가 필요한가]
   내용: [어떤 내용을 담을 것인가]

   생성하시겠습니까?"
   ```

2. **승인 받은 후에만 생성**

3. **생성 후에도 확인**
   ```
   "다음 문서를 생성했습니다:
   - [파일 경로]

   저장하시겠습니까? 아니면 삭제할까요?"
   ```

**예외 (승인 없이 생성 가능):**
- ✅ 명시적으로 요청받은 파일
- ✅ 코드 파일 (실행에 필수)
- ✅ 설정 파일 (필수 구성)

**예외 (반드시 승인 필요):**
- ⚠️ README.md
- ⚠️ 가이드 문서
- ⚠️ 설명 문서
- ⚠️ 매뉴얼
- ⚠️ 모든 .md 파일 (코드 제외)

**실전 문제:**
- 너무 많은 파일로 인한 혼란
- 필요 없는 문서로 디렉토리 복잡화
- 사용자가 보지 않을 파일들
- 정작 필요한 파일 찾기 어려움

**올바른 예:**

❌ **잘못된 접근:**
```
(승인 없이)
- CONTRIBUTING.md 생성
- CODE_OF_CONDUCT.md 생성
- SECURITY.md 생성
- CHANGELOG.md 생성
```

✅ **올바른 접근:**
```
"프로젝트에 다음 문서들을 추가하면 좋을 것 같습니다:
- CONTRIBUTING.md (기여 가이드)
- SECURITY.md (보안 정책)

필요하신가요? 생성할까요?"

→ 사용자 응답 대기
→ 승인된 것만 생성
```

---

### 원칙 4: Skills/Subagents/Commands 적극 활용

**기본 방침:**
- **프로젝트에는 16개 Skills, 18개 Subagents, 14개 Commands가 설정되어 있음**
- 작업 중 항상 이들을 활용할 방법을 연구
- 사용자에게 활용 제안 필수

**작업 시작 전 필수 검토:**

1. **해당 작업에 적합한 도구 확인**
   - Skills 중 사용 가능한 것?
   - Subagents 중 적합한 것?
   - Commands로 빠르게 처리 가능한 것?

2. **사용자에게 제안**
   ```
   "이 작업에 다음 도구들을 활용할 수 있습니다:

   추천 Subagent:
   - [subagent명]: [왜 적합한가]

   추천 Skill:
   - [skill명]: [어떻게 도움되는가]

   추천 Command:
   - /[command명]: [어떤 효과가 있는가]

   이 도구들을 사용하시겠습니까?"
   ```

3. **승인 후 활용**

**Available Tools:**

**Skills (16개):**
```
.claude/skills/
├── api-builder.md
├── code-review.md
├── db-schema.md
├── test-runner.md
└── ... (총 16개)
```

**Subagents (18개):**
```
.claude/subagents/
├── backend-developer.md
├── frontend-developer.md
├── database-developer.md
├── devops-troubleshooter.md
├── code-reviewer.md
├── test-engineer.md
└── ... (총 18개)
```

**Slash Commands (14개):**
```
.claude/commands/
├── /commit - Git 커밋 자동화
├── /review - 코드 리뷰
├── /test - 테스트 실행
├── /deploy - 배포
└── ... (총 14개)
```

**활용 예시:**

**상황 1: API 개발 작업**
```
"API 개발을 시작하기 전에 제안드립니다:

1. Subagent 활용:
   - backend-developer: API 구조 설계 및 구현
   - api-designer: RESTful API 설계 검증

2. Skill 활용:
   - api-builder: API 자동 생성 템플릿
   - test-runner: API 테스트 자동화

3. Command 활용:
   - /test: 작성 후 테스트 자동 실행

이 도구들을 사용하시겠습니까?"
```

**상황 2: 데이터베이스 작업**
```
"DB 스키마 작업에 다음을 활용할 수 있습니다:

1. Subagent:
   - database-developer: 스키마 설계

2. Skill:
   - db-schema: 스키마 자동 생성

3. Command:
   - /review: 스키마 검증

사용하시겠습니까?"
```

**상황 3: 배포 작업**
```
"배포 작업에 다음 도구를 활용할 수 있습니다:

1. Subagent:
   - devops-troubleshooter: 배포 문제 해결

2. Command:
   - /deploy: 자동 배포
   - /deploy-check: 배포 상태 확인

사용하시겠습니까?"
```

**금지 사항:**

❌ **도구를 무시하고 직접 작업**
```
(Skills/Subagents 확인 없이)
"API를 작성하겠습니다..."
```

✅ **도구 활용 제안 후 작업**
```
"API 작업에 backend-developer subagent와 api-builder skill을 활용하면 
더 효율적입니다. 사용하시겠습니까?"
```

**주기적 검토:**
- 작업 시작 시: 도구 활용 방법 검토
- 작업 중간: 추가 도구 활용 가능성 확인
- 작업 완료 시: 사용한 도구 보고

---

### 원칙 5: 작업 완료 후 필수 검증 제안

**기본 방침:**
- **작업이 끝나면 반드시 검증 담당 도구 실행을 자발적으로 제안**
- 검증은 시간 낭비가 아니라 **재작업 방지로 시간 절약**
- 사용자 승인 후 검증 수행

**작업 완료 후 필수 프로세스:**

1. **작업 완료 직후**
   ```
   "작업이 완료되었습니다.

   완료된 작업:
   - [작업 내용]

   생성/수정된 파일:
   - [파일 목록]

   이제 검증을 수행하고자 합니다.
   다음 도구를 사용하여 검증하겠습니다:

   검증 Subagent:
   - [검증 subagent명]: [검증 항목]

   검증 Skill:
   - [검증 skill명]: [검증 방법]

   검증 Command:
   - /[command명]: [검증 내용]

   검증을 진행하시겠습니까?"
   ```

2. **사용자 승인 대기**

3. **승인 후 검증 수행**
   - 모든 검증 항목 실행
   - 검증 결과 상세 보고

4. **검증 완료 보고**
   ```
   "✅ 검증 완료

   검증 결과: 모든 테스트 통과

   다음 작업 지시를 기다리겠습니다."
   ```

**검증의 중요성:**

**❌ 검증 없이 진행:**
```
작업 완료 → 다음 작업 시작 → 오류 발견 → 이전 작업 재수정 → 시간 낭비
```

**✅ 검증 후 진행:**
```
작업 완료 → 검증 수행 → 오류 즉시 발견 및 수정 → 다음 작업 안심 진행 → 시간 절약
```

**검증 도구 예시:**

**코드 작업 후:**
```
"코드 작성이 완료되었습니다.

다음 검증을 제안합니다:

1. Subagent:
   - code-reviewer: 코드 품질 검토
   - test-engineer: 테스트 케이스 확인

2. Skill:
   - test-runner: 자동 테스트 실행

3. Command:
   - /test: 전체 테스트 실행
   - /review: 코드 리뷰

검증하시겠습니까?"
```

**데이터베이스 작업 후:**
```
"DB 스키마 작업이 완료되었습니다.

다음 검증을 제안합니다:

1. Subagent:
   - database-developer: 스키마 유효성 검사

2. Command:
   - /db-check: 스키마 검증

검증하시겠습니까?"
```

**API 작업 후:**
```
"API 구현이 완료되었습니다.

다음 검증을 제안합니다:

1. Subagent:
   - backend-developer: API 로직 검토
   - test-engineer: API 테스트

2. Skill:
   - api-builder: API 명세 검증

3. Command:
   - /test: API 테스트 실행
   - /review: 코드 리뷰

검증하시겠습니까?"
```

**금지 사항:**

❌ **검증 제안 없이 완료 보고**
```
"작업 완료했습니다!"
(검증 제안 X)
```

✅ **검증 제안과 함께 완료 보고**
```
"작업 완료했습니다!
검증을 위해 code-reviewer와 /test를 실행하고자 합니다.
진행하시겠습니까?"
```

**검증 결과 보고 형식:**
```
✅ 검증 완료

검증 도구:
- code-reviewer: ✅ 통과 (이슈 0개)
- /test: ✅ 통과 (24/24 tests)

검증 결과: 모든 검증 통과
다음 작업 진행 가능합니다.
```

---

### 원칙 6: 절대 거짓 보고 금지 - 제대로 & 빠르게

**핵심 원칙:**
- **"제대로 하되 빠르게"가 목표**
- **"빨리 하되 대충"은 절대 금지**
- 거짓 완료 보고는 신뢰를 파괴함

**금지 사항:**

**❌ 절대 금지 - 대충 하고 완료 보고:**
```
(실제로는 제대로 안 됨)
"완료했습니다!"
```

**❌ 절대 금지 - 테스트 없이 완료:**
```
(테스트 안 돌려봄)
"모든 테스트 통과했습니다!"
```

**❌ 절대 금지 - 오류 숨기고 완료:**
```
(오류 있는데 무시)
"문제없이 완료했습니다!"
```

**❌ 절대 금지 - 일부만 하고 전체 완료:**
```
(70%만 구현)
"전체 기능 완료했습니다!"
```

**올바른 작업 태도:**

**✅ 정직하고 정확한 보고:**
```
"작업 완료했습니다.

완료 항목:
- ✅ 기능 A: 100% 완료
- ✅ 기능 B: 100% 완료
- ⚠️ 기능 C: 90% 완료 (edge case 1개 남음)

테스트:
- ✅ Unit tests: 24/24 통과
- ⚠️ E2E tests: 4/5 통과 (1개 실패)

실패한 테스트:
- test_edge_case_timeout: timeout 이슈

해결 필요 사항:
- edge case 1개 수정
- timeout 이슈 해결

추가 작업 시간 필요합니다. 진행하시겠습니까?"
```

**작업 우선순위:**

**1순위: 정확성 (Correctness)**
- 제대로 동작하는가?
- 모든 요구사항 충족하는가?
- 테스트 통과하는가?

**2순위: 속도 (Speed)**
- 빠르게 완료할 수 있는가?
- 효율적인 방법인가?

**절대 안 되는 것:**
```
속도 > 정확성  ← ❌ 절대 금지
```

**올바른 우선순위:**
```
정확성 > 속도  ← ✅ 올바름
```

**"제대로 & 빠르게" 실천 방법:**

**1. 계획 단계에서 시간 확보**
```
빠른 계획 → 엉터리 구현 → 재작업  ← ❌ 느림

충분한 계획 → 제대로 구현 → 1회 완성  ← ✅ 빠름
```

**2. 검증 단계에서 시간 확보**
```
검증 없이 진행 → 오류 발견 → 재작업  ← ❌ 느림

즉시 검증 → 오류 조기 발견 → 빠른 수정  ← ✅ 빠름
```

**3. 완료 기준 명확화**
```
완료 = "코드 작성함"  ← ❌ 잘못됨

완료 = "코드 작성 + 테스트 통과 + 검증 완료"  ← ✅ 올바름
```

**실제 작업 예시:**

**❌ 잘못된 접근:**
```
15분: 빠르게 코드 작성 (대충)
5분: "완료!" 보고
---
나중에...
30분: 오류 발견 및 재작업
20분: 추가 수정
15분: 재검증
---
총 85분 소요
```

**✅ 올바른 접근:**
```
30분: 꼼꼼하게 코드 작성 (제대로)
10분: 테스트 및 검증
5분: 검증 결과 포함 완료 보고
---
총 45분 소요
```

**완료 보고 체크리스트:**

작업 완료 보고 전 반드시 확인:

- [ ] 모든 요구사항 구현했는가?
- [ ] 테스트 작성 및 실행했는가?
- [ ] 모든 테스트 통과했는가?
- [ ] 검증 도구로 확인했는가?
- [ ] 오류나 경고 없는가?
- [ ] Edge cases 처리했는가?
- [ ] 문서화 필요한 것 했는가?

**모두 YES일 때만 완료 보고**

**거짓 보고의 결과:**
- ❌ 신뢰 파괴
- ❌ 재작업 시간 낭비
- ❌ 프로젝트 전체 지연
- ❌ 다른 작업에 영향

**정직한 보고의 이점:**
- ✅ 신뢰 유지
- ✅ 정확한 진행 상황 파악
- ✅ 문제 조기 발견
- ✅ 전체 프로젝트 성공

**기억할 것:**
> **"빨리 하려고 대충 하는 것은 결국 느리다"**
> **"제대로 하는 것이 가장 빠른 길이다"**

---

## 📝 6대 원칙 최종 요약

1. **AI-Only**: 모든 작업은 AI가 수행. 정말 불가능할 때만 요청 (3가지 이상 시도 후)
2. **시간 금지**: 시간 추정 절대 금지. 진행 상황만 보고
3. **문서 승인**: 문서 생성 전 반드시 승인. 무분별한 생성 금지
4. **도구 활용**: Skills/Subagents/Commands 적극 활용 및 제안
5. **필수 검증**: 작업 완료 후 검증 도구 실행 자발적 제안 (재작업 방지)
6. **거짓 금지**: 절대 거짓 보고 금지. "제대로 & 빠르게" (속도 < 정확성)

**이 원칙들을 지키면:**
- ✅ 사용자 개입 최소화
- ✅ 현실적인 기대 형성
- ✅ 깔끔한 프로젝트 구조 유지
- ✅ 최대 효율의 작업 수행
- ✅ 재작업 없는 빠른 개발
- ✅ 신뢰할 수 있는 결과물

---
---

## ⚠️ 🚨 CRITICAL: 데이터베이스 규칙 🚨 ⚠️

### politician_id 타입 규칙

**이 규칙은 프로젝트 전체에서 절대적으로 지켜야 합니다!**

#### 핵심 규칙

**politician_id의 데이터 타입:**
- ✅ **TEXT** (PostgreSQL/Supabase)
- ✅ **string** (TypeScript/JavaScript)
- ✅ **str** (Python)
- ❌ **BIGINT** (절대 사용 금지)
- ❌ **INTEGER** (절대 사용 금지)
- ❌ **UUID** (전체 UUID가 아님, 앞 8자리만)
- ❌ **number** (절대 변환 금지)

**형식:**
```
8자리 hexadecimal 문자열 (UUID 앞 8자리)
```

**예시:**
```javascript
'17270f25'  // 정원오
'de49f056'  // 금태섭
'eeefba98'  // 안철수
'88aaecf2'  // 나경원
'507226bb'  // 박주민
'62e7b453'  // 오세훈
```

#### 생성 방법

**Python:**
```python
import uuid
politician_id = str(uuid.uuid4())[:8]
# 예: 'a1b2c3d4'
```

**TypeScript/JavaScript:**
```typescript
import { v4 as uuidv4 } from 'uuid';
const politicianId = uuidv4().substring(0, 8);
// 예: 'a1b2c3d4'
```

#### 적용 범위

**모든 테이블에서 동일한 규칙 적용:**

1. `politicians.id` (PRIMARY KEY, TEXT)
2. `politician_details.politician_id` (FOREIGN KEY, TEXT)
3. `politician_ratings.politician_id` (FOREIGN KEY, TEXT)
4. `favorite_politicians.politician_id` (FOREIGN KEY, TEXT)
5. `careers.politician_id` (FOREIGN KEY, TEXT)
6. `pledges.politician_id` (FOREIGN KEY, TEXT)
7. `ai_evaluations.politician_id` (FOREIGN KEY, TEXT)
8. 기타 모든 politician 관련 테이블

#### 절대 금지 사항

**❌ 절대 하지 말아야 할 것:**

```typescript
// ❌ 잘못된 예시 - parseInt() 사용
const politicianId = params.id;
politician_id: parseInt(politicianId)  // 🚨 ERROR! NaN 발생

// ❌ 잘못된 예시 - Number() 사용
politician_id: Number(politicianId)  // 🚨 ERROR! NaN 발생

// ❌ 잘못된 예시 - SQL에서 BIGINT 사용
CREATE TABLE politician_ratings (
  politician_id BIGINT  // 🚨 ERROR! TEXT여야 함
);
```

**✅ 올바른 예시:**

```typescript
// ✅ 올바른 방법 - 문자열 그대로 사용
const politicianId = params.id;  // '17270f25'
politician_id: politicianId  // ✅ CORRECT

// ✅ 올바른 SQL
CREATE TABLE politician_ratings (
  politician_id TEXT NOT NULL REFERENCES politicians(id)  // ✅ CORRECT
);

// ✅ 올바른 쿼리
.eq('politician_id', politicianId)  // ✅ CORRECT (문자열 비교)
```

#### 왜 이 규칙이 중요한가?

**실제 발생한 문제:**
1. `parseInt('17270f25')` → `17270f25` (숫자)로 변환 시도
2. 하지만 DB에서는 `'17270f25'` (문자열)로 저장됨
3. `17270f25 === '17270f25'` → `false` (타입 불일치)
4. 쿼리 실패, 데이터를 찾을 수 없음

**올바른 방법:**
1. `'17270f25'` (문자열) 그대로 사용
2. DB에서 `'17270f25'` (문자열)로 비교
3. `'17270f25' === '17270f25'` → `true` (타입 일치)
4. 쿼리 성공 ✅

#### 마이그레이션 작성 시 주의

```sql
-- ✅ CORRECT
CREATE TABLE politician_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id TEXT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  -- ^^^ TEXT 타입 사용
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5)
);

-- ❌ WRONG
CREATE TABLE politician_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id BIGINT NOT NULL REFERENCES politicians(id),
  -- ^^^ BIGINT 사용 금지!
);
```

#### API 코드 작성 시 주의

```typescript
// ✅ CORRECT
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const politicianId = params.id;  // '17270f25'

  await supabase
    .from('politician_ratings')
    .insert([{
      politician_id: politicianId,  // ✅ 문자열 그대로
      // ...
    }]);

  await supabase
    .from('politician_ratings')
    .select('*')
    .eq('politician_id', politicianId);  // ✅ 문자열 그대로
}

// ❌ WRONG
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const politicianId = params.id;

  await supabase
    .from('politician_ratings')
    .insert([{
      politician_id: parseInt(politicianId),  // ❌ parseInt 금지!
      // ...
    }]);
}
```

#### 체크리스트

**새로운 테이블이나 API를 만들 때:**

- [ ] `politician_id`를 TEXT 타입으로 정의했는가?
- [ ] Foreign Key가 `politicians.id (TEXT)`를 참조하는가?
- [ ] API 코드에서 `parseInt()` 또는 `Number()`를 사용하지 않았는가?
- [ ] 쿼리에서 문자열 그대로 비교하는가?
- [ ] TypeScript 타입을 `string`으로 정의했는가?

#### 참고 문서

- `0-4_Database/Supabase/migrations/DATABASE_SCHEMA.md` - 전체 스키마 문서
- `0-4_Database/Supabase/migrations/023_add_rating_favorite_to_politician_details.sql` - 예시 마이그레이션

---

## ⚠️ 🚨 CRITICAL: 용어 및 기능 영구 규칙 🚨 ⚠️

**이 규칙들은 절대 변경할 수 없는 프로젝트 영구 규칙입니다!**

### 규칙 1: 공감/비공감 시스템 (upvote/downvote)

**절대 금지 용어:**
- ❌ "공감"
- ❌ "like"
- ❌ "dislike"
- ❌ "upvotes"

**올바른 용어:**
- ✅ **공감** (upvote)
- ✅ **비공감** (downvote)
- ✅ upvotes / downvotes

**적용 범위:**
- 게시글 공감/비공감
- 댓글 공감/비공감
- 모든 문서, 코드, API에서 동일하게 적용

**예시:**
```
❌ 잘못된 표현: "공감 기능", "like 버튼", "upvotes"
✅ 올바른 표현: "공감 기능", "upvote 버튼", "upvotes"
```

---

### 규칙 2: 정치인 인증 = 오직 이메일 인증만

**정치인 인증이 필요한 기능 (3가지):**
1. 정치인 게시글 작성
2. 정치인 댓글 작성
3. 상세평가 리포트 구매

**인증 방식:**
- ✅ **오직 이메일 인증만 사용**
- ❌ 이름/정당/직종 입력 방식 금지
- ❌ "이메일 인증" 용어 금지
- ❌ "본인 인증 3가지 항목" 금지

**프로세스:**
1. 정치인이 등록된 이메일 입력
2. 시스템에서 인증 링크 발송
3. 이메일에서 인증 링크 클릭
4. 인증 완료 → 권한 부여

**예시:**
```
❌ 잘못된 표현: "이름, 소속 정당, 출마직종으로 인증", "이메일 인증"
✅ 올바른 표현: "이메일 인증", "등록된 이메일로 인증"
```

---

### 규칙 3: 용어 체크리스트

문서나 코드 작성 시 반드시 확인:

- [ ] "공감" 대신 "공감" 사용했는가?
- [ ] "like/dislike" 대신 "upvote/downvote" 사용했는가?
- [ ] 정치인 인증에서 "이메일 인증만" 언급했는가?
- [ ] "이름/정당/직종" 입력 방식을 언급하지 않았는가?

**이 규칙을 위반하는 문서나 코드는 즉시 수정해야 합니다.**

---

## Universal Development Guidelines

### Code Quality Standards
- Write clean, readable, and maintainable code
- Follow consistent naming conventions across the project
- Use meaningful variable and function names
- Keep functions focused and single-purpose
- Add comments for complex logic and business rules

### Git Workflow
- Use descriptive commit messages following conventional commits format
- Create feature branches for new development
- Keep commits atomic and focused on single changes
- Use pull requests for code review before merging
- Maintain a clean commit history

### Documentation
- Keep README.md files up to date
- Document public APIs and interfaces
- Include usage examples for complex features
- Maintain inline code documentation
- Update documentation when making changes

### Testing Approach
- Write tests for new features and bug fixes
- Maintain good test coverage
- Use descriptive test names that explain the expected behavior
- Organize tests logically by feature or module
- Run tests before committing changes

### Security Best Practices
- Never commit sensitive information (API keys, passwords, tokens)
- Use environment variables for configuration
- Validate input data and sanitize outputs
- Follow principle of least privilege
- Keep dependencies updated

## Project Structure Guidelines

### File Organization
- Group related files in logical directories
- Use consistent file and folder naming conventions
- Separate source code from configuration files
- Keep build artifacts out of version control
- Organize assets and resources appropriately

### Configuration Management
- Use configuration files for environment-specific settings
- Centralize configuration in dedicated files
- Use environment variables for sensitive or environment-specific data
- Document configuration options and their purposes
- Provide example configuration files

## Development Workflow

### Before Starting Work
1. Pull latest changes from main branch
2. Create a new feature branch
3. Review existing code and architecture
4. Plan the implementation approach

### During Development
1. Make incremental commits with clear messages
2. Run tests frequently to catch issues early
3. Follow established coding standards
4. Update documentation as needed

### Before Submitting
1. Run full test suite
2. Check code quality and formatting
3. Update documentation if necessary
4. Create clear pull request description

## Common Patterns

### Error Handling
- Use appropriate error handling mechanisms for the language
- Provide meaningful error messages
- Log errors appropriately for debugging
- Handle edge cases gracefully
- Don't expose sensitive information in error messages

### Performance Considerations
- Profile code for performance bottlenecks
- Optimize database queries and API calls
- Use caching where appropriate
- Consider memory usage and resource management
- Monitor and measure performance metrics

### Code Reusability
- Extract common functionality into reusable modules
- Use dependency injection for better testability
- Create utility functions for repeated operations
- Design interfaces for extensibility
- Follow DRY (Don't Repeat Yourself) principle

## Project Grid Dual Execution System

This project uses the Project Grid methodology with a dual execution system for quality assurance.

### Dual Execution Overview

**Every task goes through TWO execution phases**:

1. **1st Execution (Claude Code Sub-agents)**
   - Assigned by task type (devops-troubleshooter, database-developer, frontend-developer, etc.)
   - Implements code according to task instructions
   - Performs initial testing and validation

2. **2nd Execution & Verification (Claude Code - Different Session)**
   - Reviews 1st execution results
   - **Can**: Leave unchanged / Modify / Rewrite / Add new files
   - Re-runs tests and builds
   - Final quality gate before Phase completion

### Recording Dual Execution in Project Grid

**Note**: As of 2025-11-06, Claude Code (different session) now performs FULL execution (build, test, verification) with enhanced capabilities.

#### 1st Execution (Claude Code Session 1) - Basic Format
When recording 1st execution results in Project Grid:

```json
{
  "assigned_agent": "1차: backend-developer",
  "files": ["3_Backend_APIs/auth/P1BA1_signup.ts"],
  "duration": "1차: 25분",
  "build_result": "1차: ✅ 성공",
  "test_history": "1차: Test(20/20)@Claude | Build ✅"
}
```

#### 2nd Execution (Claude Code Session 2) - Detailed Report Format
Claude Code (Session 2) creates a comprehensive JSON report saved to `Web_ClaudeCode_Bridge/inbox/{task_id}.json`:

```json
{
  "task_id": "P1BA1",
  "task_name": "회원가입 API",
  "phase": 1,
  "area": "BA",
  "status": "완료",
  "progress": 100,

  "execution_info": {
    "assigned_agent": "1차: backend-developer | 2차: Claude Code(실행 및 검증)",
    "generator": "Claude Code",
    "generated_at": "2025-11-06T15:48:00Z"
  },

  "duration": {
    "first_execution_minutes": 25,
    "second_execution_minutes": 35,
    "total_minutes": 60
  },

  "files": {
    "expected": ["3_Backend_APIs/auth/P1BA1_signup.ts"],
    "generated_by_first": ["3_Backend_APIs/auth/P1BA1_signup.ts"],
    "modified_by_second": ["3_Backend_APIs/auth/P1BA1_signup.ts"],
    "added_by_second": []
  },

  "static_analysis": {
    "task_id_comment": {"status": "✅", "location": "첫 줄부터 시작"},
    "file_paths": {"status": "✅", "details": "모든 파일이 기대 결과물과 정확히 일치"},
    "content_validation": {"status": "✅", "requirements_met": "100%"},
    "dependencies": {"status": "✅", "details": "모든 의존성 올바르게 처리됨"}
  },

  "dynamic_analysis": {
    "build": {"status": "✅ 성공", "details": "번들 사이즈: 245KB"},
    "unit_tests": {"status": "✅ 통과", "total": 24, "passed": 24, "failed": 0},
    "e2e_tests": {"status": "✅ 통과", "total": 5, "passed": 5, "failed": 0},
    "lint": {"status": "✅ 통과", "errors": 0, "warnings": 0},
    "type_check": {"status": "✅ 통과", "errors": 0}
  },

  "issues_found_and_fixed": [
    {
      "type": "개선",
      "description": "비밀번호 검증 로직 강화",
      "file": "3_Backend_APIs/auth/P1BA1_signup.ts",
      "fix_applied": "정규식 패턴 추가",
      "status": "✅ 수정 완료"
    }
  ],

  "test_history": {
    "first_execution": "1차: Test(20/20)@Claude | Build ✅",
    "second_execution": "2차: Test(24/24)@ClaudeCode | Build ✅ | E2E(5/5)@ClaudeCode",
    "combined": "최종: Test(24/24) + E2E(5/5) + Build ✅ + Lint ✅ + Type ✅"
  },

  "validation_result": "✅ 통과",
  "ready_for_phase_advance": true
}
```

**Key Rules for Dual Execution Recording**:
- **1st Execution**: Claude Code Session 1 records basic info (file paths, basic build/test results)
- **2nd Execution**: Claude Code Session 2 creates comprehensive JSON report in `Web_ClaudeCode_Bridge/inbox/{task_id}.json`
- **File Tracking**: Mark Session 2's work with `(ClaudeCode수정)`, `(ClaudeCode추가)`, or `(ClaudeCode재작현)` in `generated_files`
- **Test History**: Always show both 1st and 2nd execution results separated by ` | `
- **Build Result**: Always show both 1st and 2nd execution results separated by ` | `
- **Report Location**: Claude Code Session 2 saves full report to `Web_ClaudeCode_Bridge/inbox/{task_id}.json` (required for final verification)

### Phase-based Workflow

Work is done by **Phase** (not task-by-task):

1. Claude Code sub-agents complete all Phase 1 tasks (20 tasks)
2. Claude Code (different session) performs 2nd execution & verification on all Phase 1 tasks
3. Phase Gate approval after 2nd execution completes
4. Proceed to Phase 2

This minimizes human intervention while ensuring quality through dual execution.

### Reference Documents

- Full details: `Developement_Real_PoliticianFinder/0-5_Development_ProjectGrid/PHASE_BASED_DUAL_VERIFICATION.md`
- Manual: `Developement_Real_PoliticianFinder/0-5_Development_ProjectGrid/PROJECT_GRID_매뉴얼_V4.0.md`

---

## Review Checklist

Before marking any task as complete:
- [ ] Code follows established conventions
- [ ] Tests are written and passing
- [ ] Documentation is updated
- [ ] Security considerations are addressed
- [ ] Performance impact is considered
- [ ] Code is reviewed for maintainability
- [ ] Project Grid updated with dual execution information (if applicable)