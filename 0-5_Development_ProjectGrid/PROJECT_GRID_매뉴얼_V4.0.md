# 프로젝트 그리드 작성 매뉴얼 V4.0
## AI 작업 지침서 - V3.0 개발영역 개편 + Git 통합 추적 시스템 반영

## ⚠️ 중대 경고: AI 전자동 개발의 필수 조건

**이 추적 시스템 없이는 AI 전자동 개발이 불가능합니다.**

추적 시스템이 없을 경우 발생하는 치명적 문제:
- AI가 무분별하게 여기저기 파일을 생성하고 수정함
- 어떤 작업 지시로 코드가 만들어졌는지 추적 불가
- 중복 작업과 충돌하는 수정사항 발생
- 프로젝트가 통제 불능 상태로 전락
- 코드베이스가 관리 불가능한 혼돈 상태가 됨

**따라서 이 매뉴얼의 모든 규칙은 선택사항이 아닌 필수사항입니다.**

## 1. 개요

### 1.1 목적
본 매뉴얼은 3차원 그리드 기반 프로젝트 관리 시스템에서 AI가 **체계적이고 추적 가능한** 작업을 수행하기 위한 **강제 규칙**을 정의합니다. 모든 AI 에이전트는 **반드시** 이 매뉴얼을 준수해야 하며, 위반 시 작업이 자동으로 차단됩니다.

### 1.2 🔴 가장 중요: AI의 3D 그리드 자동 구성

**프로젝트 성공의 핵심은 AI가 처음부터 의존성과 병렬 관계를 정확히 분석하여 3D 그리드를 올바르게 구성하는 것입니다.**

#### 🎯 전제 조건: 인간의 초기 자료 제공

**AI가 정확한 3D 그리드를 구성하려면, 인간이 먼저 충실한 프로젝트 계획 자료를 제공해야 합니다:**

```python
# 인간이 제공해야 할 필수 초기 자료
initial_materials = {
    "프로젝트 요구사항": {
        "목표": "명확한 프로젝트 최종 목표",
        "기능_목록": ["기능1", "기능2", "기능3..."],
        "비기능_요구사항": ["성능", "보안", "확장성"],
        "제약사항": ["예산", "기간", "기술스택"]
    },

    "프로젝트 범위": {
        "포함사항": "프로젝트에 포함될 기능/작업",
        "제외사항": "명시적으로 제외할 항목",
        "우선순위": "필수/선택 기능 구분"
    },

    "기술 사양": {
        "아키텍처": "시스템 구조 설계",
        "기술스택": "사용할 언어/프레임워크",
        "인터페이스": "API/UI 명세",
        "데이터모델": "DB 스키마/데이터 구조"
    },

    "🔴 목업 디자인 화면 (필수!)": {
        "전체_화면_목업": [
            "메인 페이지 디자인",
            "로그인/회원가입 화면",
            "대시보드 레이아웃",
            "각 기능별 상세 화면"
        ],
        "모바일_반응형": "모바일/태블릿 화면 디자인",
        "컴포넌트_디자인": [
            "버튼, 폼, 카드 등 UI 컴포넌트",
            "네비게이션 구조",
            "모달/팝업 디자인"
        ],
        "플로우_다이어그램": "화면 간 이동 흐름도",
        "인터랙션_명세": "클릭/터치 시 동작 설명"
    },

    "참고 자료": {
        "기존_시스템": "참고할 기존 시스템 문서",
        "디자인_가이드": "UI/UX 가이드라인",
        "코딩_규약": "준수할 코딩 스타일",
        "경쟁_서비스": "벤치마킹할 유사 서비스 화면"
    }
}
```

**⚠️ 경고: 목업 디자인 없이 시작하면 프로젝트가 개판됩니다!**
- ❌ 목업 디자인 없음 → AI가 UI를 상상으로 구현 → 완전 다른 결과물
- ❌ 불충분한 자료 → AI의 잘못된 그리드 구성 → 프로젝트 실패
- ✅ 충실한 목업 디자인 → AI가 정확한 UI 구현 → 기대한 결과물
- ✅ 완전한 자료 → AI의 정확한 그리드 구성 → 프로젝트 성공

### 1.3 핵심 원칙 (위반 시 작업 차단)
- **완전한 추적성**: 모든 소스코드 파일의 생성, 수정, 테스트 이력 기록
- **표준화된 형식**: 21개 속성 체계와 Git 커밋 규칙 준수
- **자동화 우선**: 수동 작업 최소화, 스크립트를 통한 자동화
- **실시간 동기화**: Grid 속성과 Git 리포지토리 간 정보 일치
- **작업 ID 필수**: 작업 ID 없는 파일 생성/수정 절대 금지

### 1.4 🤖 AI-Only 우선 원칙 (작업 수행의 기본 규칙)

**프로젝트 그리드에 제시되어 있는 모든 작업은 AI가 수행하는 것을 원칙으로 합니다.**

#### 기본 원칙
- ✅ **모든 작업은 AI가 자동으로 수행**: 코드 작성, 테스트, 빌드, 배포 등 모든 개발 작업
- ✅ **인간의 역할**: 초기 계획 자료 제공, 최종 검수, 승인만 수행
- ✅ **작업 방식 속성(8번) 기본값**: "AI-Only" (전체 작업의 95% 이상)

#### 예외 상황 (인간 협력이 필요한 경우)
인간이 협력 지원하는 경우는 **AI가 할 수 없는 명확한 사유**가 있을 때만 허용됩니다:

1. **외부 서비스 관련**
   - 유료 서비스 가입 및 결제 필요
   - 외부 API 키 발급 (이메일 인증, 신원 확인 등)
   - 도메인 구매 및 등록

2. **물리적 작업**
   - 하드웨어 설정 및 연결
   - 네트워크 장비 구성
   - 물리적 서버 설치

3. **법적/행정적 작업**
   - 법적 서명 및 승인
   - 계약서 작성 및 검토
   - 개인정보 취급 동의

4. **인간 고유 판단**
   - 최종 디자인 승인
   - 비즈니스 의사결정
   - 윤리적 판단 필요

#### 작업 방식 속성 지정
- **"AI-Only"**: 기본값 (AI가 독립적으로 수행 가능)
- **"AI + 사용자 수동 작업"**: 위 예외 상황에만 사용
- **명확한 사유 기재**: 작업지시서(5번) 또는 참고사항(21번)에 인간 협력이 필요한 이유 명시

**⚠️ 주의**: "AI가 어려울 것 같아서"는 명확한 사유가 아닙니다. AI가 실제로 시도했으나 기술적으로 불가능한 경우에만 예외 처리합니다.

### 1.5 📅 미래 계획의 절대 시간 금지 원칙

**계획 수립 시 절대 시간 개념(특정 날짜, 시간, 기간)을 사용하지 않습니다.**

#### ❌ 금지 사항 (미래 계획에 절대 시간 사용)
```
잘못된 예시:
- "1시간 내에 완료"
- "2일 안에 개발"
- "이번 주까지 완료"
- "10월 25일까지 배포"
- "30분 소요 예정"
```

**문제점:**
- AI 작업 속도는 예측 불가능 (컨텍스트 크기, 복잡도에 따라 변동)
- 절대 시간 목표는 불필요한 압박과 실패감 유발
- 실제 완료 시간과 괴리 발생 시 계획 전체가 무의미해짐

#### ✅ 허용 사항 1: 이미 발생한 이력 (절대 시간 기록 필수)

**완료된 작업에는 정확한 시간 기록이 필수입니다:**

```csv
속성 11. 상태: "완료 (2025-10-23 14:30)"
속성 12. 생성 소스코드 파일: "src/App.tsx [2025-10-23 09:15]"
속성 14. 소요시간: "45분"
```

**이유:**
- 과거 데이터는 AI 성능 분석의 기초
- 실제 소요 시간 추적으로 미래 프로젝트 계획 개선
- KPI 측정 및 최적화에 활용

#### ✅ 허용 사항 2: 상대적 순서 표현 (의존성만 명시)

**미래 작업은 순서와 의존성만 표현합니다:**

```csv
속성 9. 의존성 체인: "P2F1, P2B3" ← "P2F1과 P2B3 완료 후 시작"
속성 10. 진도: "0%" → "50%" → "100%" ← 진행률만 표시
속성 11. 상태: "대기" → "진행 중" → "완료" ← 상태만 표시
```

**올바른 계획 방식:**
- "P2F1이 완료되면 P2F2를 시작한다"
- "P3B1, P3B2, P3B3가 모두 완료되면 P3F5를 시작한다"
- "Phase 2의 모든 작업이 완료되면 Phase 3으로 진입한다"

#### 핵심 철학

**"언제 끝날지는 중요하지 않습니다. 올바른 순서로 완료되는 것이 중요합니다."**

- AI는 의존성 체인을 따라 자동으로 작업을 진행
- 각 작업이 완료되면 다음 작업이 자동으로 시작
- 프로젝트는 자연스럽게 흘러가며 완성됨
- 절대 시간 압박 없이 품질에 집중

## 2. 3차원 그리드 시스템

### 2.1 좌표 체계
```
X축: 개발단계(Phase)
Y축: 개발영역(Area)
Z축: 작업(Task)
```

### 2.2 작업 ID 생성 규칙 (V4.0 개편: 6개 영역)
```
형식: P[단계][영역][작업번호][병렬기호]
예시: P2BI3a (2단계, Backend Infrastructure, 작업 3의 a 병렬)

작업번호 규칙:
- 1, 2, 3, 4... : 순차적 작업 번호
- a, b, c, d... : 같은 번호의 병렬 작업 구분 (소문자)
- 병렬기호 없음: 단독 작업
- 병렬기호 있음: 동시 실행 가능 작업

영역 코드 (V4.0 개편):
- O: DevOps (DevOps Area)
- D: Database (Database Area)
- BI: Backend Infrastructure (Backend Infrastructure Area)
- BA: Backend APIs (Backend APIs Area)
- F: Frontend (Frontend Area)
- T: Test (Test Area)
```

### 2.3 21개 속성 상세 정의 (V4.0: 영역 정의 업데이트)

#### 【그리드 좌표】(2개) - 3D 공간 위치

##### 1. 개발단계(Phase)
- **정의**: 프로젝트의 개발단계 (순차적 개발 진행 단계)
- **값 범위**: Phase 1, Phase 2, Phase 3, ... (프로젝트별로 가변)
- **데이터 타입**: 텍스트 (고정값)
- **예시**: "Phase 1", "Phase 4"
- **주의**: 프로젝트 규모에 따라 확대/축소 가능
- **용도**: X축 좌표, 순차적 진행 관리

##### 2. 개발영역(Area) - ✨ V4.0 업데이트
- **정의**: 작업이 속한 개발영역
- **값 범위** (V4.0 개편):
  - **O (DevOps)**: 프로젝트 초기화, CI/CD, 배포, 스케줄러, 인프라 설정 및 자동화
  - **D (Database)**: 스키마, 마이그레이션, 트리거, 타입, RLS 정책, 데이터베이스 설계
  - **BI (Backend Infrastructure)**: Supabase 클라이언트, 미들웨어, 기본 설정, 모든 API가 사용하는 기반 코드
  - **BA (Backend APIs)**: 비즈니스 로직, REST API 엔드포인트, 실제 기능 구현
  - **F (Frontend)**: UI, UX, 페이지, 컴포넌트, 사용자 인터페이스
  - **T (Test)**: E2E 테스트, API 테스트, 부하 테스트, 품질 보증
- **데이터 타입**: 텍스트 (고정값)
- **예시**: "DevOps", "Backend Infrastructure", "Frontend"
- **용도**: Y축 좌표, 작업 분류 및 담당 개발자 역할 결정
- **개발 순서**: DevOps → Database → Backend Infrastructure → Backend APIs → Frontend → Test
- **⚠️ 주의**: Security는 별도 영역이 아님. 보안은 모든 영역(DevOps, Database, Backend, Frontend, Test)에 통합되어야 함

#### 【작업 기본 정보】(9개) - 작업 정의 및 할당

##### 3. 작업ID(Task ID)
- **정의**: 각 작업의 고유 식별 번호
- **형식**: P[개발단계번호][개발영역약자][작업번호][병렬기호]
  - 작업번호: 1, 2, 3... (순차적)
  - 병렬기호: a, b, c... (소문자, 병렬 작업시만)
- **데이터 타입**: 텍스트 (고정값)
- **예시**:
  - "P1O1" (개발단계 1, DevOps, 작업 1번 - 단독)
  - "P2BI3a" (개발단계 2, Backend Infrastructure, 작업 3번 병렬 a)
  - "P2BA5b" (개발단계 2, Backend APIs, 작업 5번 병렬 b)
  - "P3F7" (개발단계 3, Frontend, 작업 7번 - 단독)
- **용도**: 그리드에서 작업을 추적하고 의존성/병렬성을 표현하는 핵심 키값

##### 4. 업무 (Task Description)
- **정의**: 해당 작업에서 수행해야 할 구체적인 업무 내용
- **데이터 타입**: 텍스트 (자유 기술)
- **길이**: 50~100자 권장
- **예시**: "AuthContext 생성", "정치인 카드 컴포넌트", "성능 최적화"

##### 5. 작업지시서 (Task Instruction File)
- **정의**: 작업을 수행하기 위한 상세 지시사항이 저장된 파일의 경로
- **형식**: URL 또는 상대/절대 파일 경로
- **데이터 타입**: 텍스트 (URL 또는 경로)
- **예시**:
  - "https://docs.example.com/P1O1"
  - "tasks/P1O1.md"
  - "/docs/instructions/P4BA1.pdf"
- **용도**: 작업자가 상세 지시를 참고할 수 있도록 문서/URL 링크 제공

##### 6. 담당AI (Assigned AI Agent) - ✨ V2.0 개선
- **정의**: 해당 작업을 수행하는 담당 AI 서브 에이전트 (개발자만 기록)
- **값 범위**:
  - "fullstack-developer" (풀스택 개발자 역할)
  - "devops-troubleshooter" (DevOps 트러블슈팅 역할)
  - "database-specialist" (데이터베이스 전문가)
- **데이터 타입**: 텍스트 (고정값)
- **예시**: "fullstack-developer", "devops-troubleshooter"
- **주의**: 검증 담당 Agent는 테스트내역(16번)에 @ 기호로 별도 기록

##### 7. 사용도구 (Tools)
- **정의**: 작업시 사용할 기능 도구, 스킬, 플러그인, MCP 확장 프로그램 등
- **형식**: 도구명들을 슬래시(/) 또는 세미콜론(;)으로 구분
- **데이터 타입**: 텍스트 (자유 기술)
- **예시**:
  - "React/TypeScript/Supabase"
  - "Next.js/TailwindCSS/Shadcn"
  - "Python/FastAPI/SQLAlchemy"
  - "Docker/Kubernetes/GitHub Actions"
- **용도**: AI가 사용해야 할 기술 스택, 라이브러리, 프레임워크 명시

##### 8. 작업 방식 (Work Mode)
- **정의**: 작업을 수행하는 방식
- **값 범위**: 4가지 고정값
  1. **AI-Only**: 순수 AI만 코드 개발 (인간은 지시와 최종 검수만)
  2. **AI + 사용자 수동 작업**: AI와 사용자가 협력하여 작업 수행
  3. **협력 AI API 연결**: 여러 AI가 API로 통신하며 협력
  4. **협력 AI 수동 연결**: 여러 AI가 수동으로 결과를 연결
- **데이터 타입**: 텍스트 (고정값)
- **예시**: "AI-Only", "AI + 사용자 수동 작업"

##### 9. 의존성 체인 (Dependency Chain) - ✨ V2.0 개선
- **정의**: 현재 작업이 시작되기 전에 먼저 완료되어야 할 선행 작업의 ID
- **자동 추적**: import 문 분석을 통한 실제 의존성 자동 검증
- **형식**: 단일 작업ID 또는 복수 작업ID (쉼표로 구분)
- **데이터 타입**: 텍스트 (작업ID)
- **예시**:
  - "P1O4" (단일 의존성)
  - "P2BI1, P2F2" (복수 의존성)
  - "P3F2a, P3F2b, P3F2c" (병렬 작업 그룹 전체에 의존)
- **용도**: 작업 간 의존성을 추적하고 자동으로 스케줄링

##### 10. 진도 (Progress)
- **정의**: 작업의 완료 정도를 백분위로 표현
- **값 범위**: 0% ~ 100%
- **데이터 타입**: 숫자 (백분위)
- **예시**: "0%", "50%", "100%"

##### 11. 상태 (Status)
- **정의**: 작업의 현재 상태와 완료 시각
- **값 범위**:
  - "대기" (아직 시작하지 않음)
  - "진행 중" (현재 수행 중)
  - "완료 (YYYY-MM-DD HH:MM)" (완료 시간 포함)
- **데이터 타입**: 텍스트 (고정값 + 선택적 타임스탬프)
- **예시**: "대기", "진행 중", "완료 (2025-10-31 14:30)"

#### 【작업 실행 기록】(4개) - 코드 생성 기록

##### 12. 생성 소스코드 파일 (Generated Source Code Files)
- **정의**: 생성된 모든 소스코드 파일 경로 및 생성 시각
- **형식**: 파일경로1;파일경로2;파일경로3 [YYYY-MM-DD HH:MM]
- **데이터 타입**: 텍스트 (세미콜론 구분 + 타임스탬프)
- **예시**:
  ```
  src/auth/AuthContext.tsx;src/auth/AuthProvider.tsx [2025-10-31 09:15]
  src/components/Card.tsx;src/types/card.ts [2025-10-31 14:30]
  ```
- **용도**: 생성된 모든 소스코드 파일과 생성 시점을 한 곳에서 추적

##### 13. 생성자 (Code Generator)
- **정의**: 소스 코드를 생성한 AI 모델
- **값 범위**: "Claude-3.5-Sonnet", "Claude-Sonnet-4.5", "GPT-4", "Gemini" 등
- **데이터 타입**: 텍스트 (고정값)
- **예시**: "Claude-Sonnet-4.5", "GPT-4"
- **용도**: AI 모델별 성능 비교, 코드 품질 추적

##### 14. 소요시간 (Duration)
- **정의**: 코드 생성 시작부터 완료까지 소요된 시간(분)
- **값 범위**: 양의 정수 (0 이상) 또는 "진행중"
- **데이터 타입**: 텍스트
- **예시**: "15분", "45분", "120분", "진행중"

##### 15. 수정이력 (Modification History) - ✨ V2.0 핵심 개선
- **정의**: 생성된 소스코드 파일들의 수정 내역 및 **오류 복구 과정**
- **형식**:
  - 일반 수정: `[v버전] 수정내용 [YYYY-MM-DD HH:MM]`
  - 오류 복구: `[ERROR]오류내용→[FIX]수정시도→[PASS/FAIL]결과`
- **데이터 타입**: 텍스트 (자유 기술 또는 "-")
- **예시**:
  ```
  [v2.5.0] 초기구현 [2025-10-31 14:30]
  [ERROR] Task ID 누락 (10:00) → [FIX] 자동추가 (10:01) → [PASS] 검증통과 (10:05)
  [v2.5.1] 버그수정 [2025-10-31 15:45]
  [ERROR] 빌드실패 → [FIX] import수정 → [RETRY] 재빌드 → [PASS] 완료
  [v2.5.2] 최종완료 [2025-10-31 16:20]
  ```
- **연관**: 생성 소스코드 파일(12번)의 파일 경로와 직접 연결

#### 【검증】(5개) - 코드 검증 기록

##### 16. 테스트내역 (Test History) - ✨ V2.0 핵심 개선
- **정의**: Code Review부터 테스트까지 전체 검증 체인
- **형식**: `CR(진행상황)@검증자 → Test(진행상황)@검증자 → Build(상태)@시스템`
- **데이터 타입**: 텍스트 (체인 형식)
- **예시**:
  ```
  CR(15/15)@QA-Agent-03 → Test(24/24)@Test-Agent-01 → Build(성공)@CI
  CR(진행:12/15)@QA-03 → Test(대기) → Build(대기)
  CR(실패:8/15)@QA-03 → CR(재시도:15/15)@QA-03 → Test(24/24)@Test-01 → Build(성공)
  Unit(24/24)@Test-01 → Integration(3/5)@Test-02 → E2E(대기) → Build(대기)
  ```
- **진행상황 표시**:
  - 숫자: 완료/전체 (예: 12/15)
  - 상태: 대기, 진행, 성공, 실패
- **검증자 표시**: @ 기호 뒤에 검증을 수행한 Agent ID 기록
- **활용**: 전체 검증 플로우와 담당자를 한눈에 파악 가능

##### 17. 빌드결과 (Build Result)
- **정의**: 생성된 코드의 빌드(컴파일) 결과 상태
- **값 범위**:
  - "✅ 성공" (빌드 성공)
  - "❌ 실패" (빌드 실패)
  - "⏳ 대기" (아직 빌드하지 않음)
  - "⚠️ 경고" (경고 포함 성공)
- **데이터 타입**: 텍스트 (고정값)
- **예시**: "✅ 성공", "❌ 실패"

##### 18. 의존성 전파 (Dependency Propagation)
- **정의**: 의존성 체인에서 선행 작업 변경 시 자동 전파, 이행/불이행 구분
- **값 범위**:
  - "✅ 이행" (모든 선행작업 완료, 작업 시작 가능)
  - "❌ 불이행 - [작업ID]" (특정 선행작업 미완료)
  - "⏳ 대기" (아직 검증되지 않음)
- **데이터 타입**: 텍스트 (고정값)
- **예시**: "✅ 이행", "❌ 불이행 - P2BI1a"
- **용도**: 작업 시작 가능 여부를 자동으로 판단

##### 19. 블로커 (Blocker)
- **정의**: 진도를 막는 이슈 또는 작업 진행을 방해하는 요소
- **값 범위**:
  - "없음" (블로커 없음)
  - "기술적 문제: [설명]" (기술적 문제)
  - "의존성 문제: [작업ID]" (다른 작업의 의존성 미충족)
  - "자원 부족: [설명]" (자원 부족)
  - "테스트 실패: [내용]" (테스트 관련 문제)
- **데이터 타입**: 텍스트 (고정값 또는 자유 기술)
- **예시**: "없음", "의존성 문제: P3BI1b", "기술적 문제: API 응답 지연"

##### 20. 종합 검증 결과 (Comprehensive Validation Result) - ✨ V2.0 핵심 개선
- **정의**: 모든 검증 완료 후 생성되는 완료 보고서 경로
- **값 범위**:
  - 진행 중: "⏳ 대기" / "🔄 진행중" / "⚠️ 부분 성공"
  - 완료 후: "✅ 통과 | 보고서: 경로 (타임스탬프)"
- **데이터 타입**: 텍스트 (고정값)
- **예시**:
  ```
  ⏳ 대기
  🔄 진행중
  ❌ 실패
  ✅ 통과 | 보고서: docs/P2F5C_REPORT.md (2025-10-31 11:00)
  ```
- **판정 기준**: 16~19번 속성을 모두 검토하여 종합 판정
- **자동 생성**: 검증 통과 시 완료 보고서가 자동으로 생성되어 경로 기록

#### 【기타 정보】(1개) - 추가 정보

##### 21. 참고사항 (Remarks)
- **정의**: 작업과 관련된 추가 정보, 메모, 특이사항
- **데이터 타입**: 텍스트 (자유 기술 또는 "-")
- **예시**: "성능 최적화 적용됨", "향후 리팩토링 필요", "-"
- **용도**: 기타 중요한 정보나 특이사항 기록

### 2.4 Grid 데이터 구조 (CSV 기반)

**Grid 정의**:
- Grid는 위에서 정의한 21개 속성을 컬럼으로 갖는 CSV 파일입니다.
- 파일명: `ProjectGrid.csv`
- 각 행(Row)은 하나의 Task를 나타내며, Task ID(작업ID)를 Primary Key로 사용합니다.
- Grid는 프로젝트의 중앙 데이터 저장소로 모든 작업 정보를 담고 있습니다.

**CSV 파일 구조**:
```csv
작업ID,Phase,Area,작업명,상태,우선순위,시작일,종료일,예상시간,실제소요시간,담당AI,의존작업,생성파일,태그,테스트내역,수정이력,종합검증결과,완료조건,비고,좌표X,좌표Y
P1O1,1,O,CI/CD 파이프라인 구축,완료,높음,2025-10-01,2025-10-03,8h,7.5h,devops-troubleshooter,"-","P1O1_github_workflow.yml","#devops, #cicd","CR(15/15)@QA-01→Test(24/24)@Test-01","[v1.0.0] 초기 구현","✅ PASS: /reports/P1O1_REPORT.md","CI 동작 확인","-",0,0
P1D1,1,D,사용자 테이블 마이그레이션,진행중,중간,2025-10-03,2025-10-05,6h,"-",database-specialist,P1O1,"P1D1_users_migration.sql","#database, #migration","-","-","-","테이블 생성 확인","-",0,1
```

**Grid 필수 인터페이스 (pandas 사용)**:

```python
# 주의: 아래 코드는 pseudo-code입니다 (실제 동작 코드 아님)

import pandas as pd

class CSVGrid:
    def __init__(self, csv_path="ProjectGrid.csv"):
        self.csv_path = csv_path
        self.df = pd.read_csv(csv_path)

    def has_task(self, task_id):
        """Task ID 존재 여부 확인"""
        return task_id in self.df['작업ID'].values

    def get_task(self, task_id):
        """Task ID로 전체 속성 조회"""
        row = self.df[self.df['작업ID'] == task_id]
        if row.empty:
            return None
        return row.iloc[0].to_dict()

    def get_dependencies(self, task_id):
        """의존작업 목록 조회"""
        task = self.get_task(task_id)
        if not task or pd.isna(task['의존작업']) or task['의존작업'] == '-':
            return []
        return [dep.strip() for dep in task['의존작업'].split(',')]

    def update_status(self, task_id, new_status):
        """작업 상태 업데이트"""
        self.df.loc[self.df['작업ID'] == task_id, '상태'] = new_status
        self.save()

    def get_phase_tasks(self, phase):
        """특정 Phase의 모든 작업 조회"""
        return self.df[self.df['Phase'] == phase].to_dict('records')

    def save(self):
        """변경사항을 CSV 파일에 저장"""
        self.df.to_csv(self.csv_path, index=False, encoding='utf-8-sig')
```

**사용 예시**:

```python
# 주의: 아래 코드는 pseudo-code입니다 (실제 동작 코드 아님)

grid = CSVGrid("ProjectGrid.csv")

# Task 조회
task = grid.get_task("P2BI5C")
print(f"작업명: {task['작업명']}, 상태: {task['상태']}")

# 의존성 확인
deps = grid.get_dependencies("P2BI5C")
for dep_id in deps:
    dep_task = grid.get_task(dep_id)
    if dep_task['상태'] != '완료':
        print(f"경고: 의존 작업 {dep_id}가 아직 완료되지 않음")

# 상태 업데이트 후 저장
grid.update_status("P2BI5C", "진행중")
```

## 3. 파일 및 폴더 관리 규칙

### 3.1 파일 명명 규칙
모든 생성 파일은 Task ID를 포함해야 합니다:
```
형식: {TaskID}_{설명}.{확장자}

예시:
- P2BA5C_auth_api.py
- P2BA5C_auth_test.py
- P2F3_login_component.tsx
- P2BI5C_REPORT.md (자동 생성)
```

### 3.2 폴더 구조 규칙
```
프로젝트루트/
├── Phase_01_Foundation/
│   ├── DevOps/
│   │   └── P1O1/
│   │       ├── P1O1_github_workflow.yml
│   │       └── P1O1_deploy_script.sh
│   ├── Database/
│   │   └── P1D1/
│   │       └── P1D1_users_migration.sql
│   └── Backend_Infrastructure/
│       └── P1BI1/
│           └── P1BI1_supabase_client.ts
├── Phase_02_Core/
│   ├── Backend_APIs/
│   │   └── P2BA5C/
│   │       ├── P2BA5C_auth_api.py
│   │       ├── P2BA5C_auth_test.py
│   │       └── P2BA5C_REPORT.md
│   └── Frontend/
│       └── P2F3/
│           └── P2F3_login_page.tsx
└── Phase_03_Advanced/
    └── Test/
        └── P3T1/
            └── P3T1_e2e_test.spec.ts
```

### 3.3 테스트 파일 명명 규칙
```
형식: {TaskID}_{테스트대상}_test.{확장자}

예시:
- P2BA5C_auth_test.spec.ts (단위 테스트)
- P2BA5C_login_integration_test.ts (통합 테스트)
- P3T1_e2e_test.ts (E2E 테스트)
```

## 4. Task ID 검증 프로세스

### 4.1 6단계 검증 체계
```python
def validate_task_id(task_id, file_path):
    """Task ID 6단계 검증"""

    # 1단계: Task 파일 존재 확인
    if not exists(f"tasks/{task_id}.md"):
        return False, "Task 파일 없음"

    # 2단계: Task ID 형식 검증
    if not re.match(r"P\d+(O|D|BI|BA|F|T)\d+[a-z]?", task_id):
        return False, "형식 오류"

    # 3단계: Grid CSV 등록 확인
    if not grid.has_task(task_id):
        return False, "Grid 미등록"

    # 4단계: 중복 ID 체크
    if grid.is_duplicate(task_id):
        return False, "중복 ID"

    # 5단계: 의존성 Task 검증
    deps = grid.get_dependencies(task_id)
    for dep in deps:
        if not grid.is_completed(dep):
            return False, f"의존성 {dep} 미완료"

    # 6단계: Phase/Area 일치 확인
    phase = task_id[1]
    area = re.search(r"(O|D|BI|BA|F|T)", task_id).group(1)
    if not validate_phase_area(phase, area, file_path):
        return False, "Phase/Area 불일치"

    return True, "검증 통과"
```

### 4.2 의존성 자동 추적
```python
def auto_track_dependencies(task_id, file_content):
    """import 문 분석을 통한 의존성 자동 검증"""

    imports = extract_imports(file_content)
    detected_deps = []

    for imp in imports:
        # P1O2_models 같은 패턴에서 Task ID 추출
        match = re.search(r"(P\d+(O|D|BI|BA|F|T)\d+[a-z]?)", imp)
        if match:
            detected_deps.append(match.group(1))

    # Grid의 의존성과 비교
    declared_deps = grid.get_dependencies(task_id)
    missing_deps = set(detected_deps) - set(declared_deps)

    if missing_deps:
        print(f"⚠️ 선언되지 않은 의존성 감지: {missing_deps}")
        grid.update_dependencies(task_id, list(set(declared_deps + detected_deps)))
```

## 5. Phase Gate 시스템

### 5.1 Phase Gate 행 추가
각 Phase 마지막에 Gate 행을 추가하여 진입 조건 체크:

```csv
===PHASE GATE===,,
,작업ID,GATE_P1
,업무,Phase 1 완료 검증
,상태,✅ 통과 (2025-10-31)
,테스트내역,Tasks:8/8완료, CR:8/8통과, Test:8/8통과
,블로커,-
,참고사항,Phase 2 진입 가능
```

### 5.2 Phase 진입 조건
```python
def can_enter_next_phase(current_phase):
    """Phase Gate 통과 조건 검증"""

    tasks = grid.get_tasks_by_phase(current_phase)

    # 모든 Task 완료 확인
    for task in tasks:
        if task['상태'] != '완료':
            return False, f"{task['작업ID']} 미완료"

        # 테스트 통과 확인 (CR과 @ 존재 여부로 Code Review 완료 확인)
        test_history = task['테스트내역']
        if "CR(" not in test_history or "@" not in test_history:
            return False, f"{task['작업ID']} Code Review 미완료"

        # Test 존재 여부 확인
        if "Test(" not in test_history:
            return False, f"{task['작업ID']} 테스트 미완료"

    return True, "Phase Gate 통과"
```

## 6. 병렬 작업 충돌 해결

### 6.1 Task Lock 시스템
```python
task_locks = {
    "P2BA5C": "Agent-01",  # 잠금
    "P2BA5D": None,        # 사용 가능
}

def acquire_task_lock(task_id, agent_id):
    """Task 작업 권한 획득"""
    if task_locks.get(task_id) is None:
        task_locks[task_id] = agent_id
        return True
    return False
```

### 6.2 자동 병합 규칙
```python
def auto_merge_parallel_changes(change1, change2):
    """다른 Task ID의 변경사항은 자동 병합"""

    if change1.task_id != change2.task_id:
        # 다른 Task → 충돌 없음, 자동 병합
        return merge_changes(change1, change2)
    else:
        # 같은 Task → 수동 해결 필요
        raise ConflictError(f"Task {change1.task_id} 충돌")
```

## 7. 스마트 롤백 시스템

### 7.1 Task ID 기반 선택적 롤백
```python
def smart_rollback(task_id):
    """특정 Task의 변경사항만 롤백"""

    # Task ID로 파일 검색
    files = find_files_by_task_id(task_id)

    # 선택적 롤백
    for file in files:
        git_revert_file(file, task_id)

    # Grid 상태 업데이트
    grid.update_status(task_id, "롤백됨")

    return f"{task_id} 관련 {len(files)}개 파일 롤백 완료"
```

## 8. 중복 방지 메커니즘

### 8.1 파일 타입별 중복 허용 정책
```python
DUPLICATION_POLICY = {
    "Critical": {  # 핵심 비즈니스 로직
        "allowed_duplication": 0,
        "files": ["*_api.py", "*_auth.py", "*_payment.py"]
    },
    "Normal": {    # 일반 코드
        "allowed_duplication": 5,
        "files": ["*_component.tsx", "*_util.py"]
    },
    "Test": {      # 테스트 코드
        "allowed_duplication": 10,
        "files": ["*_test.py", "*_spec.ts"]
    },
    "Config": {    # 설정 파일
        "allowed_duplication": 20,
        "files": ["*.config.js", "*.json"]
    }
}
```

## 9. KPI Dashboard

### 9.1 성과 측정 지표
Grid 최상단에 KPI Dashboard 행 추가:

```csv
===KPI DASHBOARD===,,
,지표명,현재값,목표,상태
,Task-Code 연결율,28%,100%,❌
,검증 통과율,85%,95%,⚠️
,Phase 완료율,25%,100%,🔄
,오류 복구율,92%,90%,✅
,재작업률,8%,<10%,✅
```

### 9.2 자동 KPI 계산
```python
def calculate_kpi():
    """KPI 자동 계산 및 업데이트"""

    kpi = {}

    # Task-Code 연결율
    total_files = count_all_files()
    linked_files = count_files_with_task_id()
    kpi["연결율"] = f"{(linked_files/total_files)*100:.1f}%"

    # 검증 통과율 (테스트내역에서)
    tasks = get_all_tasks()
    passed = sum(1 for t in tasks if "CR(통과)" in t['테스트내역'])
    kpi["검증통과"] = f"{(passed/len(tasks))*100:.1f}%"

    # 오류 복구율 (수정이력에서)
    errors = count_in_column("수정이력", "[ERROR]")
    fixes = count_in_column("수정이력", "[FIX]")
    kpi["복구율"] = f"{(fixes/errors)*100:.1f}%" if errors > 0 else "100%"

    return kpi
```

## 10. Git 통합 추적 시스템 (✨ V4.0 신규)

### 10.1 청구항 15: Task ID 헤더 의무화

**모든 AI가 생성하는 소스 코드 파일은 반드시 Task ID 헤더를 포함해야 합니다.**

#### TypeScript/JavaScript 파일
```typescript
/**
 * Project Grid Task ID: P1F1
 * 작업명: 회원가입 페이지 구현
 * 생성시간: 2025-10-31 14:30
 * 생성자: Claude-Sonnet-4.5
 * 의존성: P1BI2 (Supabase 클라이언트 설정)
 * 설명: 회원가입 폼 UI 및 유효성 검증 로직
 */

export default function SignupPage() {
  // 코드...
}
```

#### Python 파일
```python
"""
Project Grid Task ID: P2BA3
작업명: 정치인 검색 API 구현
생성시간: 2025-10-31 14:30
생성자: Claude-Sonnet-4.5
의존성: P2BI1 (API 기반 구조), P2D2 (정치인 테이블)
설명: 정치인 검색 REST API 엔드포인트
"""

from fastapi import APIRouter
# 코드...
```

#### SQL 파일
```sql
-- Project Grid Task ID: P1D2
-- 작업명: 정치인 테이블 마이그레이션
-- 생성시간: 2025-10-31 14:30
-- 생성자: Claude-Sonnet-4.5
-- 의존성: P1D1 (사용자 테이블)
-- 설명: 정치인 정보 저장을 위한 테이블 생성

CREATE TABLE politicians (
  id UUID PRIMARY KEY,
  -- ...
);
```

#### YAML 파일 (GitHub Actions)
```yaml
# Project Grid Task ID: P1O1
# 작업명: CI/CD 파이프라인 구축
# 생성시간: 2025-10-31 14:30
# 생성자: Claude-Sonnet-4.5
# 설명: GitHub Actions 기반 자동 배포

name: CI/CD Pipeline
on: [push]
# ...
```

#### Markdown 파일
```markdown
<!--
Project Grid Task ID: P2BA3
작업명: 정치인 검색 API 문서
생성시간: 2025-10-31 14:30
생성자: Claude-Sonnet-4.5
-->

# 정치인 검색 API

...
```

### 10.2 청구항 16: Git 커밋 형식

**모든 Git 커밋 메시지는 Task ID를 포함해야 합니다.**

#### 커밋 메시지 형식
```bash
[작업ID] 작업유형: 설명

- 상세 변경사항 1
- 상세 변경사항 2
- 상세 변경사항 3

소요시간: 실제 소요시간
생성자: AI 모델명
```

#### 실제 예시
```bash
[P1F1] feat: 회원가입 페이지 구현 완료

- app/signup/page.tsx 생성
- 회원가입 폼 UI 구현
- 유효성 검증 로직 추가
- Supabase Auth 연동

소요시간: 45분
생성자: Claude-Sonnet-4.5
```

```bash
[P2BA3] feat: 정치인 검색 API 구현

- app/api/politicians/search/route.ts 생성
- 검색 쿼리 파라미터 처리
- Supabase 데이터베이스 검색
- 페이지네이션 구현

소요시간: 60분
생성자: Claude-Sonnet-4.5
```

```bash
[P1D2] feat: 정치인 테이블 마이그레이션

- supabase/migrations/20251031_politicians.sql 생성
- 정치인 정보 테이블 생성
- RLS 정책 설정
- 인덱스 추가

소요시간: 30분
생성자: Claude-Sonnet-4.5
```

#### 작업 유형 태그
- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `refactor`: 코드 리팩토링
- `test`: 테스트 코드 추가/수정
- `docs`: 문서 작업
- `style`: 코드 포맷팅
- `perf`: 성능 개선
- `chore`: 빌드/설정 작업

### 10.3 브랜치 명명 규칙
```bash
# 형식: grid/[작업ID]/[작업명-간략]
git checkout -b grid/P2BA5C/user-auth-api
git checkout -b grid/P1F1/signup-page
git checkout -b grid/P3T1/e2e-tests
```

### 10.4 양방향 추적 흐름

```
PROJECT GRID (작업 관리)
    ↓ 작업 할당
Task ID 헤더 (소스 코드)
    ↓ 파일 생성
Git Commit (버전 관리)
    ↓ 커밋
GitHub Repository (원격 저장소)
    ↓ 푸시
작업 완료 기록 → PROJECT GRID 업데이트
    ↓ 역추적
코드 → Task ID → 작업 지시서
```

### 10.5 추적 시스템의 장점

1. **완벽한 이력 관리**
   - 어떤 코드든 Task ID로 역추적 가능
   - Git 이력과 작업 기록 자동 연동

2. **특허 증거 확보**
   - 모든 개발 과정이 자동으로 기록됨
   - 작업 시간, 생성자, 변경 이력 명확

3. **협업 효율성**
   - 누가 어떤 작업을 했는지 즉시 확인
   - 의존성 추적 및 충돌 방지

4. **자동화 가능**
   - Git hook을 통한 자동 검증
   - PROJECT GRID 자동 업데이트

### 10.6 필수 규칙

✅ **모든 파일**에 Task ID 헤더 포함
✅ **모든 커밋**에 Task ID 포함
✅ **실제 소요시간만** 기록
✅ **생성자 정보** 명시 (AI 모델명)

❌ 헤더 없는 파일 생성 금지
❌ Task ID 없는 커밋 금지
❌ 시간 예측 금지

## 11. 헤더 주석 자동 생성 함수

### 11.1 언어별 헤더 생성 함수

```python
def generate_header(task_id, task_name, author, description, dependencies=""):
    """Task ID 헤더 자동 생성"""

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")

    headers = {
        "python": f'''"""
Project Grid Task ID: {task_id}
작업명: {task_name}
생성시간: {timestamp}
생성자: {author}
의존성: {dependencies}
설명: {description}
"""
''',

        "typescript": f'''/**
 * Project Grid Task ID: {task_id}
 * 작업명: {task_name}
 * 생성시간: {timestamp}
 * 생성자: {author}
 * 의존성: {dependencies}
 * 설명: {description}
 */
''',

        "sql": f'''-- Project Grid Task ID: {task_id}
-- 작업명: {task_name}
-- 생성시간: {timestamp}
-- 생성자: {author}
-- 의존성: {dependencies}
-- 설명: {description}
''',

        "yaml": f'''# Project Grid Task ID: {task_id}
# 작업명: {task_name}
# 생성시간: {timestamp}
# 생성자: {author}
# 의존성: {dependencies}
# 설명: {description}
''',
    }

    return headers
```

### 11.2 헤더 주석 검증 스크립트

```python
import re
from pathlib import Path

def validate_headers(project_root):
    """모든 소스 코드 파일의 Task ID 헤더 검증"""

    extensions = [".py", ".ts", ".tsx", ".js", ".jsx", ".sql", ".yml", ".yaml"]
    missing_headers = []

    for ext in extensions:
        for file_path in Path(project_root).rglob(f"*{ext}"):
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read(200)  # 처음 200자만 확인

                if "Project Grid Task ID:" not in content:
                    missing_headers.append(str(file_path))

    if missing_headers:
        print(f"❌ Task ID 헤더 누락 파일 ({len(missing_headers)}개):")
        for path in missing_headers:
            print(f"  - {path}")
        return False
    else:
        print("✅ 모든 파일에 Task ID 헤더 존재")
        return True
```

### 11.3 수정 시 헤더 업데이트

파일을 수정할 때는 헤더 주석에 수정 이력을 추가합니다:

```python
"""
Project Grid Task ID: P2BA5C
작업명: 사용자 인증 API 구현
생성시간: 2025-10-31 09:00
생성자: Claude-Sonnet-4.5
의존성: P2BI1 (API 기반 구조)
설명: JWT 기반 사용자 인증 및 권한 관리

Modification History:
- 2025-10-31 14:00 [P2BA6A]: 리프레시 토큰 기능 추가
- 2025-11-01 10:30 [P2BA7B]: 권한 검증 로직 수정
"""
```

## 12. 문서 자동 생성 시스템

### 12.1 Task 완료 시 자동 문서 생성

```python
def on_task_complete(task_id):
    """Task 완료 시 자동 문서 생성"""

    # 1. 완료 보고서 생성
    report_path = f"docs/{task_id}_REPORT.md"
    generate_completion_report(task_id, report_path)

    # 2. API 문서 추출 (해당하는 경우)
    if has_api_code(task_id):
        extract_api_documentation(task_id)

    # 3. 의존성 맵 생성
    generate_dependency_map(task_id)

    # 4. Grid 종합 검증 결과 업데이트
    timestamp = datetime.now().strftime("%H:%M")
    validation_result = f"✅ 통과 | 보고서: {report_path} ({timestamp})"
    grid.update(task_id, "종합 검증 결과", validation_result)
```

### 12.2 완료 보고서 템플릿

```markdown
# {TaskID} 완료 보고서

## 기본 정보
- Task ID: {TaskID}
- 업무: {Task명}
- 담당AI: {담당AI}
- 완료일: {완료일}
- 소요시간: {소요시간}

## 검증 결과
- 테스트내역: {테스트내역}
- 빌드결과: {빌드결과}
- 종합검증결과: {종합검증결과}

## 생성 파일
{생성파일 목록}

## 수정 이력
{수정이력}

## 의존성 관계
- 의존하는 Task: {의존성}
- 이 Task에 의존: {역의존성}

## Git 커밋 정보
- 브랜치: {브랜치명}
- 커밋 해시: {커밋해시}
- 커밋 메시지: {커밋메시지}
```

## 13. 체크리스트

### 13.1 작업 시작 체크리스트
- [ ] Grid에서 작업 정보 확인
- [ ] 의존성 작업 완료 여부 확인
- [ ] Git 브랜치 생성 (grid/작업ID/작업명)
- [ ] 작업 상태를 "진행중"으로 업데이트
- [ ] 담당AI 속성 업데이트

### 13.2 개발 중 체크리스트
- [ ] **모든 파일명에 Task ID 포함**
- [ ] **폴더 구조 Phase/Area/TaskID 준수**
- [ ] **모든 소스코드 파일에 Task ID 헤더 주석 포함**
- [ ] 생성된 모든 파일을 "생성 소스코드 파일"에 기록
- [ ] 수정사항을 "수정이력"에 기록 (버전 포함)
- [ ] 오류 발생 시 [ERROR]→[FIX]→[PASS] 형식으로 기록
- [ ] 의미 있는 단위로 Git 커밋
- [ ] 커밋 메시지에 Task ID 포함
- [ ] 정기적으로 테스트 수행 및 결과 기록

### 13.3 작업 완료 체크리스트
- [ ] 모든 요구사항 충족 확인
- [ ] Code Review 통과 (테스트내역에 CR 기록)
- [ ] 전체 테스트 통과
- [ ] Grid 속성 최종 업데이트
- [ ] 작업 상태를 "완료 (YYYY-MM-DD HH:MM)"로 변경
- [ ] 완료 보고서 자동 생성 확인
- [ ] Pull Request 생성
- [ ] Phase Gate 조건 확인

### 13.4 품질 검증 체크리스트
- [ ] Task-Code 연결율 100%
- [ ] 중복 코드 정책 준수
- [ ] 의존성 자동 추적 확인
- [ ] 에러 처리 구현
- [ ] 성능 테스트 수행
- [ ] 보안 취약점 검사

## 14. 버전 관리

### 14.1 매뉴얼 버전
- 현재 버전: **V4.0**
- 최종 수정: **2025-10-31**
- 다음 검토: 2025-11-30

### 14.2 변경 이력

- **V4.0 (2025-10-31): V3.0 개발영역 개편 + Git 통합 추적 시스템 추가**

  **주요 변경사항:**
  1. **개발영역 재구성** (6개 영역):
     - 기존: F/B/D/T/S/O (7개 영역)
     - 신규: O/D/BI/BA/F/T (6개 영역)
     - Backend를 Infrastructure(BI)와 APIs(BA)로 분리
     - Security 영역 제거 (모든 영역에 통합)

  2. **Git 통합 추적 시스템 추가** (섹션 10):
     - 청구항 15: Task ID 헤더 의무화
     - 청구항 16: Git 커밋 형식 표준화
     - 양방향 추적 흐름 구축
     - 언어별 헤더 템플릿 제공

  3. **속성 업데이트**:
     - 속성 #2 (개발영역): 6개 영역 정의로 변경
     - 속성 #3 (작업ID): 새로운 영역 코드 반영

  4. **검증 규칙 강화**:
     - Task ID 형식 검증에 새로운 영역 코드 적용
     - 파일명/폴더명에 새로운 영역 코드 사용

- **V2.0 (2025-10-23): 15개 핵심 개선사항 + 2가지 핵심 원칙 추가**

  **2가지 핵심 원칙:**
  - 🤖 **AI-Only 우선 원칙** (섹션 1.4): 모든 작업은 AI가 수행, 명확한 사유가 있을 때만 인간 협력
  - 📅 **미래 계획의 절대 시간 금지 원칙** (섹션 1.5): 계획에 절대 시간 사용 금지, 의존성 순서만 표현

  **15개 핵심 개선사항:**
  1. 파일 명명 규칙: `{TaskID}_{설명}.{확장자}` 의무화
  2. 폴더 구조 규칙: `Phase/Area/TaskID/` 체계화
  3. 스마트 롤백: Task ID 기반 선택적 롤백
  4. 중복 방지: 파일 타입별 중복 허용 정책
  5. Task ID 검증: 6단계 검증 프로세스
  6. 의존성 추적: import 기반 자동 검증
  7. 병렬 작업 충돌: Lock + 자동병합
  8. 테스트 파일 명명: `P2BA5C_*_test.ts` 형식
  9. Code Review 체크리스트: 테스트내역에 `CR@검증자→Test@검증자` 체인
  10. Phase Gate 시스템: Phase 전환 조건 명확화
  11. 오류 복구: 수정이력에 `[ERROR]→[FIX]→[PASS]` 기록
  12. AI Agent 역할: 담당AI는 개발자, 테스트내역에 검증자
  13. KPI Dashboard: 성과 지표 자동 측정
  14. 버전 관리: 수정이력에 `[v2.5.0]` 버전 포함
  15. 문서 자동 생성: 종합 검증 결과에 보고서 경로

- V1.4 (2025-10-23): 속성 용어 개선 및 명확화
- V1.3 (2025-10-23): 21개 속성 전면 개편
- V1.2 (2025-01-23): 인간의 초기 자료 제공 섹션 추가
- V1.1 (2025-01-23): 인접성 기반 블록 배치 전략 추가
- V1.0 (2024-12-26): 초기 버전 작성

## 15. 참고 자료

### 15.1 관련 문서
- PROJECT_GRID_ATTRIBUTE_DEFINITIONS_V6.md
- patent_application_v0.9.md
- Git 커밋 컨벤션 가이드
- STRUCTURE.md (프로젝트 구조)
- README.md (프로젝트 개요)

### 15.2 도구 및 라이브러리
- GitPython: Git 작업 자동화
- pandas: Grid 데이터 처리
- pytest: 테스트 프레임워크
- pre-commit: Git hook 관리

## 16. 지원 및 문의

### 16.1 문제 해결
매뉴얼 관련 문제나 개선 제안이 있을 경우:
1. 이슈 트래커에 등록
2. 담당팀에 문의
3. 매뉴얼 개정 요청

### 16.2 FAQ

**Q: Grid와 Git이 동기화되지 않을 때?**
A: sync_grid_git.py 스크립트를 실행하여 재동기화

**Q: 작업 ID가 중복될 때?**
A: Grid 시스템이 자동으로 고유 ID를 보장하므로 수동 생성 금지

**Q: 여러 AI가 동일 작업을 수행할 때?**
A: Task Lock 시스템으로 중복 방지, 담당AI 속성 확인 필수

**Q: Backend Infrastructure와 Backend APIs의 차이는?**
A: BI는 모든 API가 사용하는 기반 코드(클라이언트, 미들웨어), BA는 실제 비즈니스 로직 구현

**Q: Security 영역이 없는데 보안은 어떻게?**
A: 보안은 모든 영역에 통합됨 (예: Database의 RLS, Backend의 인증/인가, Frontend의 입력 검증)

---

**본 매뉴얼은 모든 AI 에이전트의 표준 작업 지침입니다.**
**V4.0은 6개 영역 재구성 및 Git 통합 추적 시스템을 추가하여 완전한 추적 가능성을 확보했습니다.**
**매뉴얼을 준수하여 100% 추적 가능한 작업을 수행하시기 바랍니다.**
