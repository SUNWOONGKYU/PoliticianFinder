# 📝 CSV v6.0 각 속성별 기록 방법 상세 사양서 (Recording Specification)

**작성일**: 2025-10-21
**목적**: 각 속성별로 정확히 **무엇을 어떻게 기록할 것인가**
**대상**: AI와 함께 구현할 자동화 로깅 시스템

---

## 🎯 기록 원칙

```
1. 모든 기록은 자동화되어야 함 (수동 기록 금지)
2. 타임스탬프는 필수 (언제인지 명확히)
3. 출처는 명시 (누가/무엇이 기록했는가)
4. 검증 가능해야 함 (증거로 사용 가능)
5. 특허청이 이해할 수 있어야 함

## 📌 AI-Only 개발 원칙

개발 = 100% AI (설계, 코딩, 테스트, 문서화)
인간 역할 = 개발이 아닌 설정/운영 (인증, 결제 연결)

예시:
✅ AI가 인증 로직 코드 작성 = 개발 (100% AI)
❌ 인간이 토큰 설정 = 개발 아님 (설정/운영)

결론: "AI-Only 개발"이 정확한 표현
```

---

## 📋 Layer 2: 기본 15개 속성 (v5.0 유지)

이 부분은 **이미 있는 것** - 변화 없음

```csv
속성명: 작업ID
기록 방식: 고정값 (P1F1, P2B1 등)
출처: 그리드 정의
검증: CSV 형식 검증

속성명: 업무
기록 방식: 작업 설명 텍스트
출처: 작업지시서 제목
검증: 작업지시서와 일치

속성명: 담당자
기록 방식: "fullstack-developer", "devops-troubleshooter", "사용자 수동 작업" 등
출처: AI 역할 정의 또는 인간 작업 지정
검증: 에이전트 할당 로그 또는 수동 작업 기록

예시:
- AI 작업: "fullstack-developer"
- AI 작업: "devops-troubleshooter"
- 인간 작업: "사용자 수동 작업" (인증, 결제 등)

... (기타 15개는 v5.0 유지)
```

---

## 📊 Layer 3: 생성 프로세스 기록 **[청구항 2b, 2c 입증]**

### 1️⃣ **생성방식 (생성 방법)**

**기록할 것**:
```
- AI가 작업지시서를 생성했는가
- 수동으로 작성했는가
- 템플릿에서 생성했는가
```

**기록 형식**:
```csv
생성방식: AI 자동 생성 | 수동 작성 | 템플릿 기반 생성
```

**기록 방법**:
```python
# 자동 로깅
if task_created_by_ai:
    record = "AI 자동 생성"
elif task_created_by_human:
    record = "수동 작성"
else:
    record = "템플릿 기반 생성"

log_to_csv(task_id, "생성방식", record)
```

**특허청 검증 포인트**:
```
"✅ AI가 자동으로 작업지시서를 생성했다"는 증거
→ "AI 자동 생성" 기록이 모든 작업에 있음
```

---

### 2️⃣ **생성시간 (언제 생성됐는가)**

**기록할 것**:
```
- 정확한 생성 시각 (타임스탬프)
- 누가 요청했는가 (사용자/AI)
- 얼마나 걸렸는가 (시작 시간)
```

**기록 형식**:
```csv
생성시간: 2025-10-21 09:15:30
```

**기록 방법**:
```python
# 자동 기록
generation_start_time = datetime.now()
ai_create_task_instruction()
generation_end_time = datetime.now()

record = generation_start_time.strftime("%Y-%m-%d %H:%M:%S")
log_to_csv(task_id, "생성시간", record)
log_to_csv(task_id, "생성소요시간",
           (generation_end_time - generation_start_time).total_seconds())
```

**특허청 검증 포인트**:
```
"✅ 이 작업은 이 시간에 생성되었다"
→ 프로젝트 진행 타임라인 입증
→ "자동"이었는지 "수동"이었는지 소요시간으로 추론
   (AI 생성: 10-30초 vs 인간: 10-30분)
```

---

### 3️⃣ **생성자 (누가 생성했는가)**

**기록할 것**:
```
- 어떤 AI가 생성했는가 (Claude, GPT 등)
- AI 모델 버전은 무엇인가
- 메인 AI인가 서브 AI인가
```

**기록 형식**:
```csv
생성자: Claude-3.5-Sonnet | Claude-3-Opus | GPT-4 등
```

**기록 방법**:
```python
# 자동 기록
ai_model = get_current_ai_model()  # "Claude-3.5-Sonnet"
ai_role = get_ai_role()             # "fullstack-developer"
ai_status = get_ai_status()         # "main" or "sub"

record = f"{ai_model} ({ai_role}, {ai_status})"
log_to_csv(task_id, "생성자", record)
```

**특허청 검증 포인트**:
```
"✅ 특정 AI(Claude-3.5-Sonnet)가 생성했다"
→ 재현 가능성 입증
→ 인간이 아님을 증명
```

---

### 4️⃣ **생성 프롬프트 (무엇을 지시했는가)**

**기록할 것**:
```
- 정확한 프롬프트 (AI에게 어떻게 지시했는가)
- 프롬프트 길이 (자세도)
- 프롬프트 카테고리 (어떤 종류의 요청인가)
```

**기록 형식**:
```csv
생성 프롬프트: "P1F1 작업(AuthContext 생성)을 위한 상세한 작업지시서를 생성하세요. 요구사항: [세부사항들]"
```

**기록 방법**:
```python
# 자동 기록
def generate_task_instruction(task_id, task_name, requirements):
    prompt = f"""
    Task: {task_id} - {task_name}
    Generate detailed work instruction for:
    - Requirements: {requirements}
    - Format: Markdown
    - AI-only execution
    """

    # 프롬프트 기록
    log_to_csv(task_id, "생성 프롬프트", prompt)
    log_to_csv(task_id, "프롬프트길이", len(prompt))

    # AI 실행
    result = call_ai(prompt)
    return result
```

**특허청 검증 포인트**:
```
"✅ 이 프롬프트로 AI를 지시했고 결과가 tasks/P1F1.md"
→ 완전한 투명성
→ 재현 가능 (같은 프롬프트 → 같은 결과)
```

---

### 5️⃣ **생성결과상태 (성공했는가)**

**기록할 것**:
```
- 성공 여부 (✅ 성공 / ❌ 실패)
- 실패 원인 (있다면)
- 재시도 횟수
- 최종 검증 결과
```

**기록 형식**:
```csv
생성결과: ✅ 성공 | ⚠️ 부분 성공 | ❌ 실패
생성결과상세: "작업지시서 생성 완료, 5번 검증 통과"
```

**기록 방법**:
```python
def log_generation_result(task_id, success, details, retry_count):
    if success:
        status = "✅ 성공"
    elif partial:
        status = "⚠️ 부분 성공"
    else:
        status = "❌ 실패"

    log_to_csv(task_id, "생성결과", status)
    log_to_csv(task_id, "생성결과상세", details)
    log_to_csv(task_id, "재시도횟수", retry_count)
```

**특허청 검증 포인트**:
```
"✅ 이 작업지시서는 성공적으로 생성되었다"
→ 신뢰성 입증
→ AI가 제대로 작동함을 증명
```

---

## ⚙️ Layer 4: 실행 기록 **[청구항 2f, 6, 8 입증]**

### 1️⃣ **실행시간 (언제 실행됐는가)**

**기록할 것**:
```
- AI가 작업을 실행한 정확한 시각
- 누가 지시했는가
- 앞의 작업과의 시간차 (대기 시간)
```

**기록 형식**:
```csv
실행시간: 2025-10-21 10:00:45
```

**기록 방법**:
```python
def execute_ai_task(task_id):
    execution_start = datetime.now()

    # AI 작업 실행
    ai_agent = get_assigned_ai(task_id)
    task_instruction = load_instruction(task_id)

    result = ai_agent.execute(task_instruction)

    execution_end = datetime.now()

    # 기록
    log_to_csv(task_id, "실행시간", execution_start.strftime("%Y-%m-%d %H:%M:%S"))
    log_to_csv(task_id, "실행자", ai_agent.name)
    log_to_csv(task_id, "실행상태", "✅ 성공" if result else "❌ 실패")
```

**특허청 검증 포인트**:
```
"✅ AI가 이 정확한 시간에 작업을 실행했다"
→ 타임라인 명확화
→ 자동화 증명
```

---

### 2️⃣ **실행자 (누가 실행했는가)**

**기록할 것**:
```
- 어떤 AI 에이전트가 실행했는가
- 에이전트의 역할은 무엇인가
- 메인인가 서브인가
```

**기록 형식**:
```csv
실행자: Claude-3.5-Sonnet (fullstack-developer, main)
```

**기록 방법**:
```python
ai_name = task_assignment["ai_agent"]           # "Claude-3.5-Sonnet"
ai_role = task_assignment["role"]               # "fullstack-developer"
ai_hierarchy = task_assignment["hierarchy"]     # "main" or "sub"

record = f"{ai_name} ({ai_role}, {ai_hierarchy})"
log_to_csv(task_id, "실행자", record)
```

**특허청 검증 포인트**:
```
"✅ 특정 AI(Claude-3.5-Sonnet)가 실행했다"
→ 인간이 아님을 증명
→ "AI-Only" 원칙 입증
```

---

### 3️⃣ **소요시간(분) (얼마나 걸렸는가)**

**기록할 것**:
```
- AI가 작업을 수행하는 데 걸린 시간 (정확한 수치)
- 작업 시작 시각과 종료 시각 (타임스탬프)
- 다른 작업들과의 상대적 비교 기준
```

**기록 형식**:
```csv
소요시간(분): 15
소요시간(초): 892
```

**기록 방법**:
```python
def log_execution_time(task_id, start_time, end_time):
    duration_seconds = (end_time - start_time).total_seconds()
    duration_minutes = duration_seconds / 60

    log_to_csv(task_id, "소요시간(분)", round(duration_minutes, 2))
    log_to_csv(task_id, "소요시간(초)", int(duration_seconds))

    # 작업 시작과 종료 기록
    log_to_csv(task_id, "실행시간", start_time.strftime("%Y-%m-%d %H:%M:%S"))
    log_to_csv(task_id, "완료시간", end_time.strftime("%Y-%m-%d %H:%M:%S"))
```

**특허청 검증 포인트**:
```
"✅ 이 작업은 15분에 자동 완료되었다"
→ AI 실행 속도 입증
→ 실제 소요 시간 기록으로 블로커 감지 로직의 기초
→ 형제 작업과의 속도 비교 기준
```

**참고**:
- 예상 시간과의 비교는 하지 않음 (예상 시간은 미리 알 수 없음)
- 대신 초기 진행 속도 vs 현재 진행 속도 비교로 블로커 감지 (조건 2)
- 형제 작업 간 상대 속도 비교 (조건 5)

---

### 4️⃣ **인간개입여부 (사람이 손대지 않았는가)**

**기록할 것**:
```
- AI 결과물을 인간이 수정했는가
- 어떤 부분을 수정했는가 (있다면)
- 수정 횟수와 내용
```

**기록 형식**:
```csv
인간개입여부: 없음 | 경미(자세한 내용 기입) | 있음(상세 기입)
인간개입내용: (있으면 무엇을 수정했는가)
```

**기록 방법**:
```python
def track_human_intervention(task_id):
    # 초기 AI 결과물 해시 저장
    initial_result = ai_output[task_id]
    initial_hash = hash(initial_result)

    # 일정 시간 후 최종 결과물 해시
    time.sleep(24*3600)  # 1일 후
    final_result = get_final_output(task_id)
    final_hash = hash(final_result)

    if initial_hash == final_hash:
        intervention = "없음"
    else:
        # 수정 기록 검토
        diff = compare_outputs(initial_result, final_result)
        intervention = f"있음: {len(diff)} 부분 수정"

    log_to_csv(task_id, "인간개입여부", intervention)
```

**특허청 검증 포인트**:
```
"✅ 이 작업은 AI가 생성한 후 인간이 손대지 않았다"
→ "AI-Only 원칙" 완전 입증
→ 가장 강력한 증거
```

---

### 5️⃣ **수정횟수 (몇 번 수정됐는가)**

**기록할 것**:
```
- AI가 생성한 후 수정된 횟수
- 각 수정의 이유
- 최종 수정 시각
```

**기록 형식**:
```csv
수정횟수: 0
수정이력: (수정 있으면 각 항목 기록)
```

**기록 방법**:
```python
def track_modifications(task_id):
    modification_log = []

    # 버전 관리 시스템에서 변경사항 추적
    git_commits = get_commits_for_file(task_file[task_id])

    for commit in git_commits:
        if commit.timestamp > task_creation_time:
            modification_log.append({
                'timestamp': commit.timestamp,
                'author': commit.author,
                'message': commit.message,
                'changes': commit.changes
            })

    modification_count = len(modification_log)
    log_to_csv(task_id, "수정횟수", modification_count)
    log_to_csv(task_id, "수정이력", json.dumps(modification_log))
```

**특허청 검증 포인트**:
```
"✅ 이 작업은 생성 후 수정되지 않았다 (수정횟수: 0)"
→ 완전 자동화 입증
```

---

## 🔗 Layer 5: 의존성 추적 **[청구항 9 입증]**

### 1️⃣ **선행작업 (이 작업 전에 뭐가 필요한가)**

**기록할 것**:
```
- 이 작업이 의존하는 선행 작업 ID
- 선행 작업이 완료되었는가
- 의존성 확인 시각
```

**기록 형식**:
```csv
선행작업: P1A4, P2B1
선행작업상태: ✅ 완료, ✅ 완료
의존성확인시각: 2025-10-21 10:00
```

**기록 방법**:
```python
def check_dependencies(task_id):
    task_dependencies = get_task_dependencies(task_id)

    dependency_status = []
    check_time = datetime.now()

    for dep_task_id in task_dependencies:
        dep_status = get_task_status(dep_task_id)
        is_completed = dep_status == "완료"

        dependency_status.append({
            'task_id': dep_task_id,
            'status': dep_status,
            'completed': is_completed,
            'check_time': check_time
        })

    # CSV에 기록
    dep_ids = ", ".join([d['task_id'] for d in dependency_status])
    dep_statuses = ", ".join([d['status'] for d in dependency_status])

    log_to_csv(task_id, "선행작업", dep_ids)
    log_to_csv(task_id, "선행작업상태", dep_statuses)
    log_to_csv(task_id, "의존성확인시각", check_time.strftime("%Y-%m-%d %H:%M:%S"))
```

**특허청 검증 포인트**:
```
"✅ 이 작업의 선행작업 P1A4, P2B1은 모두 완료되었다"
→ 의존성 체인이 작동함을 증명
```

---

### 2️⃣ **의존성검증 (의존성이 유효한가)**

**기록할 것**:
```
- 의존성 규칙이 올바른가
- 순환 의존성이 없는가
- 의존성 체인이 끊기지 않았는가
```

**기록 형식**:
```csv
의존성검증: ✅ 통과 | ⚠️ 경고 | ❌ 실패
의존성검증상세: "순환 의존성 없음, 모든 선행작업 완료"
```

**기록 방법**:
```python
def validate_dependencies(task_id):
    errors = []
    warnings = []

    # 1. 순환 의존성 검사
    if has_circular_dependency(task_id):
        errors.append("순환 의존성 발견")

    # 2. 선행작업 상태 검사
    for dep_task in get_dependencies(task_id):
        if get_status(dep_task) != "완료":
            errors.append(f"선행작업 {dep_task} 미완료")

    # 3. 의존성 체인 검사
    if has_broken_chain(task_id):
        errors.append("의존성 체인 끊김")

    if errors:
        result = "❌ 실패"
        details = "; ".join(errors)
    elif warnings:
        result = "⚠️ 경고"
        details = "; ".join(warnings)
    else:
        result = "✅ 통과"
        details = "모든 의존성 검증 완료"

    log_to_csv(task_id, "의존성검증", result)
    log_to_csv(task_id, "의존성검증상세", details)
```

**특허청 검증 포인트**:
```
"✅ 이 작업의 의존성이 모두 유효하다"
→ 자동 의존성 관리 시스템 작동 증명
```

---

### 3️⃣ **재실행필요여부 (다시 해야 하는가)**

**기록할 것**:
```
- 선행 작업이 변경되었는가
- 이 작업도 다시 해야 하는가
- 변경 감지 시각
```

**기록 형식**:
```csv
재실행필요여부: 아니오 | 예(상세 기입)
재실행사유: (있으면 이유 기입)
```

**기록 방법**:
```python
def check_rerun_needed(task_id):
    task_status = get_task_status(task_id)

    if task_status != "완료":
        rerun_needed = "아니오"
        reason = ""
    else:
        # 선행작업 상태 변경 확인
        prev_dependency_hash = get_previous_dep_hash(task_id)
        current_dependency_hash = hash(get_dependencies(task_id))

        if prev_dependency_hash != current_dependency_hash:
            rerun_needed = "예"
            reason = "선행작업 변경됨"
        else:
            rerun_needed = "아니오"
            reason = ""

    log_to_csv(task_id, "재실행필요여부", rerun_needed)
    if reason:
        log_to_csv(task_id, "재실행사유", reason)
```

**특허청 검증 포인트**:
```
"✅ 선행 작업 변경 시 이 작업의 재실행 필요성을 자동 판단한다"
→ 의존성 체인 자동 관리 입증
```

---

### 4️⃣ **자동업데이트여부 (자동으로 업데이트됐는가)**

**기록할 것**:
```
- 이 작업이 선행작업 변경에 따라 자동 업데이트됐는가
- 언제 업데이트됐는가
- 인간이 개입했는가
```

**기록 형식**:
```csv
자동업데이트여부: 예 | 아니오(이유)
자동업데이트시각: 2025-10-21 10:30
```

**기록 방법**:
```python
def auto_update_dependent_tasks(changed_task_id):
    dependent_tasks = get_dependent_tasks(changed_task_id)

    for task_id in dependent_tasks:
        update_start = datetime.now()

        # 자동 업데이트
        regenerate_task(task_id)

        update_end = datetime.now()

        # 기록
        log_to_csv(task_id, "자동업데이트여부", "예")
        log_to_csv(task_id, "자동업데이트시각", update_start.strftime("%Y-%m-%d %H:%M:%S"))
        log_to_csv(task_id, "업데이트인간개입", "없음")
```

**특허청 검증 포인트**:
```
"✅ 선행작업이 변경되면 이 작업이 자동으로 업데이트된다"
→ 완전 자동화 의존성 관리 입증
```

---

## 🤖 Layer 6: AI 에이전트 할당 **[청구항 3 입증]**

### 1️⃣ **할당방식 (어떻게 할당했는가)**

**기록할 것**:
```
- 자동 할당인가 수동 할당인가
- 할당 알고리즘은 무엇인가
- 할당 기준은 무엇인가
```

**기록 형식**:
```csv
할당방식: 자동 | 수동 | 규칙기반
```

**기록 방법**:
```python
def assign_ai_agent(task_id, assignment_method="auto"):
    if assignment_method == "auto":
        # 자동 할당 알고리즘
        task_area = get_task_area(task_id)
        task_complexity = analyze_task_complexity(task_id)

        best_agent = find_best_agent(
            area=task_area,
            complexity=task_complexity,
            workload=get_current_workload()
        )

        method = "자동"
    else:
        # 수동 할당
        best_agent = get_manually_assigned_agent(task_id)
        method = "수동"

    log_to_csv(task_id, "할당방식", method)
    log_to_csv(task_id, "할당규칙", f"Area: {task_area}, Complexity: {task_complexity}")
```

**특허청 검증 포인트**:
```
"✅ AI 에이전트가 자동으로 할당되었다"
→ 동적 할당 시스템 입증
```

---

### 2️⃣ **AI 에이전트 (누가 할당됐는가)**

**기록할 것**:
```
- 할당된 AI 에이전트 이름
- AI의 역할 (fullstack-developer 등)
- AI의 버전/모델
```

**기록 형식**:
```csv
할당AI: Claude-3.5-Sonnet (fullstack-developer)
```

**기록 방법**:
```python
log_to_csv(task_id, "할당AI", f"{best_agent.name} ({best_agent.role})")
```

**특허청 검증 포인트**:
```
"✅ 특정 AI(Claude-3.5-Sonnet)가 자동으로 선택되고 할당되었다"
```

---

### 3️⃣ **할당사유 (왜 이 AI를 선택했는가)**

**기록할 것**:
```
- 할당 알고리즘이 이 AI를 선택한 이유
- 점수 비교 (왜 다른 AI가 아닌가)
- 에러 처리 (다른 선택지는 없었는가)
```

**기록 형식**:
```csv
할당사유: "Frontend 작업 + 중간 복잡도 + fullstack-developer 가용 + 현재 작업 최소"
```

**기록 방법**:
```python
def log_assignment_reason(task_id, best_agent, candidate_agents):
    reason_parts = [
        f"Area: {get_task_area(task_id)}",
        f"Complexity: {analyze_task_complexity(task_id)}",
        f"Required Role: {get_required_role(task_id)}",
        f"Selected: {best_agent.name}",
        f"Current Workload: {best_agent.current_workload}",
        f"Alternatives: {[a.name for a in candidate_agents]}"
    ]

    reason = " + ".join(reason_parts)
    log_to_csv(task_id, "할당사유", reason)
```

**특허청 검증 포인트**:
```
"✅ 이 AI가 선택된 이유를 알고리즘이 명확히 제시한다"
→ 논리적 자동 할당 입증
```

---

### 4️⃣ **할당시간 (언제 할당했는가)**

**기록할 것**:
```
- 정확한 할당 시각
- 할당 처리 시간
- 할당 확정 시각
```

**기록 형식**:
```csv
할당시간: 2025-10-21 09:00:15
```

**기록 방법**:
```python
def log_assignment_time(task_id, agent):
    assignment_time = datetime.now()
    log_to_csv(task_id, "할당시간", assignment_time.strftime("%Y-%m-%d %H:%M:%S"))
```

**특허청 검증 포인트**:
```
"✅ 할당이 자동으로 이루어졌으므로 할당 시간이 정확하게 기록된다"
```

---

### 5️⃣ **능력평가 (이 AI가 이 작업을 할 수 있는가)**

**기록할 것**:
```
- AI의 능력 수준 (높음/중간/낮음)
- 해당 작업 영역 경험도
- 성공 확률
```

**기록 형식**:
```csv
능력평가: 높음 (93점)
```

**기록 방법**:
```python
def evaluate_ai_capability(agent, task_id):
    task_area = get_task_area(task_id)
    task_complexity = analyze_task_complexity(task_id)

    # AI 능력 점수 계산
    capability_score = calculate_capability_score(
        agent=agent,
        area=task_area,
        complexity=task_complexity,
        past_performance=get_agent_history(agent)
    )

    if capability_score >= 80:
        level = "높음"
    elif capability_score >= 60:
        level = "중간"
    else:
        level = "낮음"

    log_to_csv(task_id, "능력평가", f"{level} ({capability_score}점)")
```

**특허청 검증 포인트**:
```
"✅ 할당된 AI의 능력이 해당 작업을 수행할 충분한 수준이다"
```

---

## ✅ Layer 7: 검증 기록 **[청구항 7 입증]**

### 1️⃣ **자동검증여부 (자동으로 검증했는가)**

**기록할 것**:
```
- 수동 검증인가 자동 검증인가
- 검증 방법은 무엇인가
- 검증 도구는 무엇인가
```

**기록 형식**:
```csv
자동검증여부: 예 | 아니오
```

**기록 방법**:
```python
def verify_task_output(task_id):
    verification_method = get_verification_method(task_id)

    if verification_method in ["Build Test", "Unit Test", "E2E Test"]:
        auto_verify = True
        result = run_automated_verification(task_id, verification_method)
    else:
        auto_verify = False
        result = manual_verify(task_id)

    log_to_csv(task_id, "자동검증여부", "예" if auto_verify else "아니오")
```

**특허청 검증 포인트**:
```
"✅ 작업 완료 후 자동으로 검증되었다"
```

---

### 2️⃣ **검증결과상세 (뭐가 검증됐는가)**

**기록할 것**:
```
- 통과한 검증 항목들
- 실패한 검증 항목들
- 검증 상세 기록
```

**기록 형식**:
```csv
검증결과: Build Test ✅ 통과, Unit Test ✅ 통과, E2E Test ✅ 통과
```

**기록 방법**:
```python
def log_verification_results(task_id, results):
    result_summary = []

    for test_type, passed, details in results:
        status = "✅ 통과" if passed else "❌ 실패"
        result_summary.append(f"{test_type} {status}")

        if not passed:
            result_summary.append(f"  사유: {details}")

    result_text = ", ".join(result_summary)
    log_to_csv(task_id, "검증결과상세", result_text)
```

**특허청 검증 포인트**:
```
"✅ 이 작업이 모든 검증을 통과했다"
→ 품질 보증 입증
```

---

### 3️⃣ **검증시간(분) (얼마나 걸렸는가)**

**기록할 것**:
```
- 검증 시작 시각
- 검증 완료 시각
- 소요 시간
```

**기록 형식**:
```csv
검증시간(분): 5
```

**기록 방법**:
```python
def log_verification_time(task_id, start, end):
    duration_minutes = (end - start).total_seconds() / 60
    log_to_csv(task_id, "검증시간(분)", round(duration_minutes, 2))
```

**특허청 검증 포인트**:
```
"✅ 검증도 자동화되어 매우 빠르게 이루어진다"
```

---

### 4️⃣ **검증통과여부 (최종 결과)**

**기록할 것**:
```
- 최종 통과 여부
- 통과하지 못한 이유 (있다면)
- 재검증 필요 여부
```

**기록 형식**:
```csv
검증통과여부: ✅ 통과 | ⚠️ 경고 | ❌ 실패
```

**기록 방법**:
```python
def finalize_verification(task_id, all_results):
    if all(r['passed'] for r in all_results):
        status = "✅ 통과"
    elif any(r['failed_critical'] for r in all_results):
        status = "❌ 실패"
    else:
        status = "⚠️ 경고"

    log_to_csv(task_id, "검증통과여부", status)
```

**특허청 검증 포인트**:
```
"✅ 이 작업은 모든 자동 검증을 통과했다"
→ 자동화 검증 시스템 입증
```

---

## 🎨 Layer 8: 속성 확장 **[청구항 5 입증]**

### 각 속성별 기록 방법

```csv
복잡도등급: 1-10 (작업 복잡도 측정값)
예산/비용($): 수치값
보안등급: 높음 | 중간 | 낮음
규제준수: GDPR | HIPAA | 내부표준 | 해당없음
고객승인필요: 예 | 아니오
리스크수준: 높음 | 중간 | 낮음
```

**기록 방법**:
```python
def record_extended_attributes(task_id):
    task = get_task(task_id)

    # 복잡도 등급 (작업 복잡도 측정 - 예상이 아닌 고정 분류)
    # 기준: 작업 유형, 기술 스택, 의존성 수에 따른 객관적 분류
    complexity = evaluate_task_complexity(task)  # 1-10 scale
    log_to_csv(task_id, "복잡도등급", complexity)

    # 예산 (영역 × 복잡도 기반 - 선택사항)
    # 예상 시간이 아닌 복잡도에만 기반
    if should_calculate_budget(task):
        budget = calculate_budget(task.area, complexity)
        log_to_csv(task_id, "예산/비용($)", budget)

    # 보안 등급 (작업의 민감도)
    security_level = assess_security_level(task)
    log_to_csv(task_id, "보안등급", security_level)

    # 규제 준수 (프로젝트 관련성)
    compliance = determine_compliance_requirement(task)
    log_to_csv(task_id, "규제준수", compliance)

    # 고객 승인 (외주 프로젝트인가)
    needs_approval = is_customer_approval_needed(task)
    log_to_csv(task_id, "고객승인필요", "예" if needs_approval else "아니오")

    # 리스크 수준 (복잡도 및 의존성)
    risk_level = assess_risk_level(task)
    log_to_csv(task_id, "리스크수준", risk_level)
```

**특허청 검증 포인트**:
```
"✅ 이 시스템은 작업 속성을 자유롭게 확장할 수 있다"
→ 청구항 5 (속성 확장 예시) 완전 입증
```

---

## 🚨 Layer 9: 블로커 추적 **[청구항 10 입증]**

### 각 속성별 기록 방법

```csv
블로커상태: 없음 | 감지됨 | 해결됨
블로커감지일: 2025-10-24 (7일 이상 미진행 시)
대기기간(일): 정수
자동감지여부: 예 | 아니오
```

**기록 방법**:
```python
def track_blockers(task_id):
    task = get_task(task_id)

    # 1. 블로커 조건 확인
    # - 진도: 0%
    # - 상태: 대기
    # - 선행작업: 모두 완료
    # - 대기 기간: 7일 이상

    if (task.progress == 0 and
        task.status == "대기" and
        all_dependencies_complete(task_id)):

        # 2. 대기 시간 계산
        wait_days = (datetime.now() - task.creation_time).days

        if wait_days >= 7:
            # 3. 블로커 자동 감지
            blocker_detected = True
            blocker_date = datetime.now()
        else:
            blocker_detected = False
            blocker_date = None
    else:
        blocker_detected = False
        blocker_date = None

    # 4. 기록
    log_to_csv(task_id, "블로커상태",
               "감지됨" if blocker_detected else "없음")
    if blocker_date:
        log_to_csv(task_id, "블로커감지일",
                   blocker_date.strftime("%Y-%m-%d"))
    log_to_csv(task_id, "대기기간(일)", wait_days if wait_days > 0 else 0)
    log_to_csv(task_id, "자동감지여부", "예" if blocker_detected else "아니오")
```

**특허청 검증 포인트**:
```
"✅ 작업이 7일 이상 진행되지 않으면 자동으로 블로커를 감지한다"
→ 청구항 10 완전 입증
```

---

## 📊 전체 기록 흐름도

```
작업 생성
  ↓
  ├─→ Layer 3: 생성 기록 (누가, 언제, 무엇으로)
  │
작업 실행 시작
  ↓
  ├─→ Layer 4: 실행 기록 (시작 시각, 실행자)
  │
AI 작업 실행 중
  ↓
  ├─→ Layer 5: 의존성 확인 (선행작업 체크)
  ├─→ Layer 6: AI 할당 확인 (올바른 AI인가)
  │
작업 완료
  ↓
  ├─→ Layer 4: 실행 기록 완성 (완료 시각, 소요 시간)
  ├─→ Layer 7: 자동 검증
  │
결과 저장
  ↓
  ├─→ Layer 8: 속성 기록 (비용, 보안 등)
  ├─→ Layer 9: 블로커 체크 (진행 문제 있는가)
  │
CSV v6.0 업데이트
  ↓
모든 기록 완료 ✅
```

---

## 🎯 자동화 원칙

```
원칙 1: 수동 기입 금지
→ 모든 데이터는 자동 로깅되어야 함

원칙 2: 타임스탐프 필수
→ 언제 일어났는지 정확히 기록

원칙 3: 검증 가능
→ 특허청이 검증할 수 있어야 함

원칙 4: 투명성
→ 왜 이렇게 했는지 이유를 기록

원칙 5: 완전성
→ 어떤 작업도 빠져서는 안 됨
```

---

**상태**: 완전한 기록 사양서 완성
**다음**: AI와 함께 자동 로깅 시스템 구현

