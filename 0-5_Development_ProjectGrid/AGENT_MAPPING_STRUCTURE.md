# 2단계 에이전트 매핑 구조

**작성일**: 2025-10-31
**목적**: 144개 작업 → 14개 Custom Agent → 4개 Built-in Agent 매핑

---

## 전체 구조 개요

```
[144개 Task]
    ↓ (1단계 매핑)
[14개 Custom Agent]
    ↓ (2단계 매핑)
[4개 Built-in Agent]
    ↓
[실행]
```

---

## 1단계: Task → Custom Agent 매핑

### Area별 Custom Agent 배분

| Area | Area 이름 | Task 수 | Custom Agent | 비고 |
|------|----------|---------|--------------|------|
| O | DevOps | 9 | devops-troubleshooter | 단일 에이전트 |
| D | Database | 30 | database-developer | 단일 에이전트 |
| BI | Backend Infrastructure | 3 | backend-developer | 단일 에이전트 |
| BA | Backend APIs | 53 | api-designer | 단일 에이전트 |
| F | Frontend | 31 | frontend-developer (26개)<br>ui-designer (5개) | 2개 에이전트 |
| T | Test | 18 | test-engineer (15개)<br>code-reviewer (3개) | 2개 에이전트 |
| **합계** | | **144** | **8개 에이전트 사용** | |

### Custom Agent 상세 배분

#### 1. api-designer (53개 작업)
**담당 영역**: Backend APIs (BA)
**전문성**: API 설계, RESTful, Zod 스키마, 유효성 검증

**작업 분류**:
- 인증 API: P1BA1~P1BA4 (4개)
- 정치인 API: P2BA1~P2BA4 (4개)
- AI 평가 API: P2BA5~P2BA7 (3개)
- 관리자 API: P2BA8~P2BA10 (3개)
- 보안: P2BA11 (1개)
- 기타 BA 작업: P3BA~P7BA (38개)

#### 2. frontend-developer (26개 작업)
**담당 영역**: Frontend (F) - 기능 페이지
**전문성**: React, Next.js, TypeScript, 컴포넌트 개발

**작업 분류**:
- 페이지 구현: 검색, 상세, 결제, 관리자 등
- 대시보드 및 리스트
- 폼 및 입력 컴포넌트

#### 3. database-developer (30개 작업)
**담당 영역**: Database (D)
**전문성**: PostgreSQL, Supabase, 마이그레이션, RLS

**작업 분류**:
- 스키마 설계: P1D1~P1D5
- 마이그레이션: Phase별 스키마 추가
- 인덱스 및 최적화

#### 4. test-engineer (15개 작업)
**담당 영역**: Test (T) - E2E 테스트
**전문성**: Playwright, 자동화 테스트, E2E

**작업 분류**:
- API 테스트
- 페이지 E2E 테스트
- 통합 테스트

#### 5. devops-troubleshooter (9개 작업)
**담당 영역**: DevOps (O)
**전문성**: CI/CD, 배포, Vercel, GitHub Actions

**작업 분류**:
- 프로젝트 초기화: P1O1
- 배포 파이프라인: P2O1~P7O2

#### 6. ui-designer (5개 작업)
**담당 영역**: Frontend (F) - UI/UX 중점
**전문성**: 디자인 시스템, UI 컴포넌트, 레이아웃

**작업 분류**:
- 전역 레이아웃: P1F1
- 공통 컴포넌트
- 디자인 시스템 구축

#### 7. backend-developer (3개 작업)
**담당 영역**: Backend Infrastructure (BI)
**전문성**: Supabase 클라이언트, 백엔드 인프라

**작업 분류**:
- P1BI1: Supabase 클라이언트
- P1BI2: 인증 헬퍼
- P1BI3: 에러 처리

#### 8. code-reviewer (3개 작업)
**담당 영역**: Test (T) - 코드 품질
**전문성**: 코드 리뷰, 정적 분석, 품질 검증

**작업 분류**:
- 코드 품질 검증
- 타입 체크
- 린트 검사

---

## 2단계: Custom Agent → Built-in Agent 매핑

### Built-in Agent 4개

| Built-in Agent | 역할 | 매핑되는 Custom Agent | 소환 방법 |
|----------------|------|---------------------|----------|
| **general-purpose** | 범용 개발 작업 | 11개 (대부분) | 간접 소환 |
| **Explore** | 코드베이스 탐색 | code-reviewer | 직접 소환 |
| **statusline-setup** | 상태바 설정 | 없음 | 직접 소환 |
| **output-style-setup** | 출력 스타일 설정 | 없음 | 직접 소환 |

### general-purpose 매핑 (11개 Custom Agent)

```
general-purpose
├── api-designer (53개)
├── frontend-developer (26개)
├── database-developer (30개)
├── test-engineer (15개)
├── devops-troubleshooter (9개)
├── ui-designer (5개)
├── backend-developer (3개)
├── code-reviewer (3개)
├── performance-optimizer (예비)
├── security-auditor (예비)
└── security-specialist (예비)
```

### Explore 매핑 (1개 Custom Agent)

```
Explore
└── code-reviewer (코드 탐색 필요 시)
```

---

## 실행 흐름 예시

### 예시 1: API 개발 작업 (P1BA1)

```
1. Task 선택
   P1BA1: 회원가입 API

2. Custom Agent 확인 (1단계 매핑)
   BA 영역 → api-designer

3. Custom Agent .md 파일 읽기
   Read('/c/Users/home/.claude/agents/api-designer.md')

4. Built-in Agent 확인 (2단계 매핑)
   api-designer → general-purpose

5. 간접 소환
   Task(
       subagent_type="general-purpose",
       description="API 개발",
       prompt=f"{agent_content}\n\n{task_instruction}"
   )

6. 실행
   api-designer 역할로 P1BA1 작업 수행
```

### 예시 2: 프론트엔드 작업 (P1F1)

```
1. Task 선택
   P1F1: 전역 레이아웃

2. Custom Agent 확인 (1단계 매핑)
   F 영역 + 레이아웃 → ui-designer

3. Custom Agent .md 파일 읽기
   Read('/c/Users/home/.claude/agents/ui-designer.md')

4. Built-in Agent 확인 (2단계 매핑)
   ui-designer → general-purpose

5. 간접 소환
   Task(
       subagent_type="general-purpose",
       description="UI 디자인",
       prompt=f"{agent_content}\n\n{task_instruction}"
   )

6. 실행
   ui-designer 역할로 P1F1 작업 수행
```

### 예시 3: 코드 리뷰 작업

```
1. Task 선택
   코드 품질 검증

2. Custom Agent 확인 (1단계 매핑)
   T 영역 (품질) → code-reviewer

3. Custom Agent .md 파일 읽기
   Read('/c/Users/home/.claude/agents/code-reviewer.md')

4. Built-in Agent 확인 (2단계 매핑)
   code-reviewer → Explore (코드 탐색 필요 시)
                  → general-purpose (리뷰만 필요 시)

5. 직접/간접 소환 선택
   # 코드 탐색이 필요한 경우
   Task(subagent_type="Explore", ...)

   # 단순 리뷰만 필요한 경우
   Task(subagent_type="general-purpose", ...)

6. 실행
   code-reviewer 역할로 작업 수행
```

---

## 간접 소환 구현 코드

### Python 예시

```python
def invoke_custom_agent(task_id: str, task_instruction: str):
    """커스텀 에이전트 간접 소환"""

    # 1. Task ID에서 Custom Agent 찾기 (1단계 매핑)
    area = task_id[2:task_id.index(task_id[-1])]  # P1BA1 → BA
    custom_agent = get_custom_agent_for_area(area, task_id)

    # 2. Custom Agent .md 파일 읽기
    agent_file = f"/c/Users/home/.claude/agents/{custom_agent}.md"
    agent_content = read_file(agent_file)

    # 3. Built-in Agent 결정 (2단계 매핑)
    builtin_agent = get_builtin_agent_for_custom(custom_agent)

    # 4. 간접 소환
    combined_prompt = f"""
{agent_content}

---

작업 지시:
{task_instruction}
"""

    result = invoke_task(
        subagent_type=builtin_agent,
        description=f"{custom_agent}로 {task_id} 수행",
        prompt=combined_prompt
    )

    return result

def get_custom_agent_for_area(area: str, task_id: str) -> str:
    """1단계 매핑: Area → Custom Agent"""
    mapping = {
        'O': 'devops-troubleshooter',
        'D': 'database-developer',
        'BI': 'backend-developer',
        'BA': 'api-designer',
        'F': 'frontend-developer',  # 또는 ui-designer (작업에 따라)
        'T': 'test-engineer'         # 또는 code-reviewer (작업에 따라)
    }
    return mapping.get(area, 'fullstack-developer')

def get_builtin_agent_for_custom(custom_agent: str) -> str:
    """2단계 매핑: Custom Agent → Built-in Agent"""
    # 대부분 general-purpose 사용
    if custom_agent == 'code-reviewer':
        return 'Explore'  # 코드 탐색이 필요한 경우
    return 'general-purpose'
```

---

## 매핑 테이블 요약

### 완전한 매핑 체인

```
Task P1BA1
  → (1단계) api-designer
  → (2단계) general-purpose
  → (실행) API 설계 작업

Task P1F1
  → (1단계) ui-designer
  → (2단계) general-purpose
  → (실행) UI 디자인 작업

Task P1D1
  → (1단계) database-developer
  → (2단계) general-purpose
  → (실행) 데이터베이스 작업

Task P1O1
  → (1단계) devops-troubleshooter
  → (2단계) general-purpose
  → (실행) DevOps 작업

Task P3T2
  → (1단계) test-engineer
  → (2단계) general-purpose
  → (실행) 테스트 작업
```

---

## 장점

### 1. 명확한 역할 분담
- 각 작업마다 전문 에이전트 배정
- 전문성 기반 작업 분배

### 2. 유연한 확장
- Custom Agent 추가 용이 (14개 → 더 많이)
- 기존 Built-in Agent 활용

### 3. 간접 소환의 이점
- .md 파일만 수정하면 역할 변경 가능
- 동적으로 에이전트 조합 가능

### 4. 재사용성
- 동일한 Custom Agent를 여러 작업에 재사용
- Built-in Agent는 공통 인터페이스

---

## 다음 단계

1. ✅ 14개 Custom Agent .md 파일 준비 완료
2. ✅ 2단계 매핑 구조 설계 완료
3. ⏳ 작업지시서에 매핑 정보 추가 (사용자 승인 대기)
4. ⏳ 자동 소환 스크립트 작성 (선택사항)
5. ⏳ Supabase 데이터베이스 업데이트 (선택사항)

---

**문서 작성일**: 2025-10-31
**버전**: 1.0
