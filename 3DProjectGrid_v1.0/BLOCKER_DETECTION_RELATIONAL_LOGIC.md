# 🔍 블로커 감지 - 관계 기반 로직 (Relational Logic)

**작성일**: 2025-10-21
**원칙**: 절대 시간 금지, 관계 기반 판단만
**핵심**: 작업들 간의 "관계"로 블로커를 감지

---

## 🎯 핵심 원칙

```
절대 금지: "7일", "24시간", "1시간" 등 고정된 시간
✅ 사용: "예상 시간 대비", "선행작업과의 관계", "전체 프로젝트 진행도" 등

예시:
❌ "24시간 이상 진행 없음" → 블로커
✅ "선행작업 완료 후에도 상태가 그대로" → 블로커
✅ "예상 시간의 N배 이상 소요" → 블로커
✅ "다른 작업들은 진행되는데 이것만 멈춤" → 블로커
```

---

## 📊 블로커 감지 - 관계 기반 조건들

### 조건 1: 선행작업 완료 대비 상태 변화

```
관계식:
IF (선행작업 상태 = "완료") AND (현재작업 상태 = "대기")
   AND (현재작업의 마지막 상태 변경 시간 < 선행작업 완료 시간)
THEN 블로커 감지 = TRUE

의미:
"선행작업이 완료됐는데 이 작업의 상태가 여전히 '대기'인 상태가
 계속되고 있다"
→ 처리되지 않은 일이 있다는 뜻
→ 블로커!

예시:
- P1A4 (선행작업) 완료 시간: 2025-10-21 10:00
- P1F1 (현재작업) 상태: 대기 (선행완료 이후 변경 없음)
- P1F1 마지막 상태 변경: 2025-10-21 09:30 (선행완료 전)
→ ✅ 블로커 감지!
```

**코드**:
```python
def detect_blocker_condition_1(task_id):
    """
    선행작업이 완료되었는데 현재작업 상태가 변하지 않음
    """
    dependencies = get_dependencies(task_id)

    for dep_task_id in dependencies:
        dep_status = get_task_status(dep_task_id)
        dep_completion_time = get_task_completion_time(dep_task_id)

        current_status = get_task_status(task_id)
        last_status_change = get_last_status_change_time(task_id)

        # 선행작업이 완료되었고
        # 현재작업 상태가 여전히 "대기"이고
        # 현재작업이 선행작업 이후로 상태 변경 없음
        if (dep_status == "완료" and
            current_status == "대기" and
            last_status_change < dep_completion_time):

            blocker_reason = f"선행작업({dep_task_id}) 완료 후 상태 미변경"
            return True, blocker_reason

    return False, ""
```

---

### 조건 2: 진도 대비 실행 속도 급격한 저하

```
관계식:
IF (초기 진행 속도 > 0)
   AND (현재 진행 속도 < 초기 진행 속도의 50%)
   AND (남은 진도 > 20%)
THEN 블로커 감지 = TRUE

의미:
"처음에는 빠르게 진행되다가 갑자기 속도가 급격히 떨어짐"
→ 뭔가 문제가 생겼다
→ 블로커!

예시:
- 처음 10분: 진도 50% (분당 5% 증가)
- 이후 40분: 진도 55% (분당 0.125% 증가) ← 40배 느려짐!
- 남은 진도: 45%
→ ✅ 블로커 감지!

또 다른 예시:
- 처음 1시간: 진도 70% (시간당 70%)
- 이후 2시간: 진도 75% (시간당 2.5%) ← 28배 느려짐!
→ ✅ 블로커 감지!
```

**코드**:
```python
def detect_blocker_condition_2(task_id):
    """
    진도의 진행 속도가 급격히 떨어짐 (관계만 사용)

    절대 시간을 사용하지 않고, 작업 내 진행 패턴만으로 판단
    """
    task_start_time = get_task_start_time(task_id)
    current_time = datetime.now()
    current_progress = get_task_progress(task_id)

    # 처음 기록 가져오기 (3가지 방법)
    # 1. 작업 시작 후 첫 10% 도달했을 때의 시간
    first_milestone_progress = get_first_progress_milestone(task_id, 10)  # 10% 달성 시간
    first_milestone_time = get_milestone_time(task_id, first_milestone_progress)

    if not first_milestone_time:
        return False, ""  # 아직 진행 시작 안 함

    # 초기 진행 속도 계산
    initial_elapsed = (first_milestone_time - task_start_time).total_seconds()
    if initial_elapsed <= 0:
        return False, ""

    initial_speed = 10 / initial_elapsed  # 진도%/초

    # 전체 경과 시간
    total_elapsed = (current_time - task_start_time).total_seconds()
    if total_elapsed <= initial_elapsed * 1.1:  # 초기 단계에서는 판단 안 함
        return False, ""

    # 현재 진행 속도
    current_speed = current_progress / total_elapsed  # 진도%/초

    # 남은 진도
    remaining_progress = 100 - current_progress

    # 속도가 50% 이하로 떨어지고, 남은 진도가 20% 이상
    speed_degradation_ratio = current_speed / initial_speed if initial_speed > 0 else 0

    if (speed_degradation_ratio < 0.5 and remaining_progress >= 20):
        blocker_reason = (f"진도 정체: "
                         f"초기 속도 {initial_speed*100:.2f}%/초 → "
                         f"현재 속도 {current_speed*100:.2f}%/초 "
                         f"(약 {1/speed_degradation_ratio:.1f}배 느려짐), "
                         f"남은 진도 {remaining_progress:.0f}%")
        return True, blocker_reason

    return False, ""
```

---

### 조건 3: 형제 작업(Sibling) 대비 진행도

```
관계식:
IF (같은 Area의 다른 작업들은 진행 중)
   AND (이 작업만 "대기" 상태로 정지)
   AND (의존성 조건은 충족)
THEN 블로커 감지 = TRUE

의미:
"같은 영역의 다른 작업들은 다 진행되는데 이것만 안 됨"
→ 뭔가 막혀있다
→ 블로커!

예시:
- Frontend 영역 작업들:
  - P1F1: 진행 중 (100% 완료)
  - P1F2: 진행 중 (75% 진도)
  - P1F3: 진행 중 (50% 진도)
  - P1F4: **대기 상태 (0% 진도)** ← 혼자만 안 됨
- P1F4의 선행작업은 모두 완료됨

→ ✅ 블로커 감지!
```

**코드**:
```python
def detect_blocker_condition_3(task_id):
    """
    같은 영역의 형제 작업들은 진행 중인데 이것만 정지됨
    """
    task_area = get_task_area(task_id)
    task_status = get_task_status(task_id)

    # 같은 Area의 모든 작업들
    sibling_tasks = get_tasks_in_area(task_area)

    # 이 작업이 대기 상태인지 확인
    if task_status != "대기":
        return False, ""

    # 형제 작업들의 상태 분석
    progressing_count = 0
    blocked_count = 0

    for sibling_id in sibling_tasks:
        if sibling_id == task_id:
            continue

        sibling_status = get_task_status(sibling_id)
        sibling_progress = get_task_progress(sibling_id)

        if sibling_status in ["진행 중", "완료"] or sibling_progress > 0:
            progressing_count += 1
        elif sibling_status == "대기":
            blocked_count += 1

    # 다른 작업들은 진행 중인데 이것만 대기
    if progressing_count > 0 and blocked_count == 0:
        # 의존성 충족 확인
        if all_dependencies_complete(task_id):
            blocker_reason = (f"형제작업(동일 Area) 대비 정체: "
                             f"{task_area} 영역에서 "
                             f"{progressing_count}개 작업은 진행 중")
            return True, blocker_reason

    return False, ""
```

---

### 조건 4: 의존성 체인 진행도 대비

```
관계식:
IF (의존성 체인 전체 진행도 > 70%)
   AND (이 작업만 "대기" 상태)
   AND (직접 선행작업은 완료)
THEN 블로커 감지 = TRUE

의미:
"전체 프로젝트가 70% 진행되었는데 이 작업만 아직 시작 안 함"
→ 뭔가 누락되거나 잊혀진 작업
→ 블로커!

예시:
- 전체 프로젝트: 75% 진행
- Phase 1: 95% 진행
- P1F4만: 0% (대기)
- P1F4 선행작업: 모두 완료

→ ✅ 블로커 감지!
```

**코드**:
```python
def detect_blocker_condition_4(task_id):
    """
    전체 프로젝트 진행도 대비 이 작업만 미시작
    """
    task_status = get_task_status(task_id)

    if task_status != "대기":
        return False, ""

    # 직접 선행작업 확인
    if not all_dependencies_complete(task_id):
        return False, ""

    # 현재 작업이 속한 Phase 진행도
    phase_id = get_task_phase(task_id)
    phase_progress = get_phase_progress(phase_id)

    # 전체 프로젝트 진행도
    overall_progress = get_overall_project_progress()

    # Phase가 70% 이상 진행되고
    # 전체 프로젝트도 70% 이상 진행되었는데
    # 이 작업만 대기 상태
    if phase_progress >= 70 and overall_progress >= 70:
        blocker_reason = (f"진행도 불균형: "
                         f"Phase {phase_progress:.0f}%, "
                         f"전체 {overall_progress:.0f}% 진행 중")
        return True, blocker_reason

    return False, ""
```

---

### 조건 5: 순차적 작업 흐름 대비

```
관계식:
IF (이전 단계 작업 = "완료")
   AND (현재 작업 = "대기")
   AND (다음 단계 작업 = "대기")
   AND (이전→현재 시간차 > 다른 작업들의 평균 시간차)
THEN 블로커 감지 = TRUE

의미:
"이전 작업은 완료되고 다음 작업은 기다리고 있는데
 현재 작업만 진행 안 됨"
→ 이 작업에서 걸려 있다
→ 블로커!

예시:
- P1F1 완료: 2025-10-21 10:00
- P1F2 진행 중: 10:00 ~ 10:25 (평균 25분)
- P1F3 대기 중
- P1F4 완료: 2025-10-21 10:50 (50분 경과)
→ P1F4가 예상보다 2배 오래 걸림
→ ✅ 블로커 감지!
```

**코드**:
```python
def detect_blocker_condition_5(task_id):
    """
    순차적 작업 흐름에서 이 작업이 병목
    """
    task_status = get_task_status(task_id)

    if task_status != "진행 중" and task_status != "완료":
        return False, ""

    # 같은 Area의 이전/다음 작업
    area_tasks = get_ordered_tasks_in_area(get_task_area(task_id))
    task_index = area_tasks.index(task_id)

    if task_index == 0:
        return False, ""  # 첫 작업이면 비교 불가

    prev_task = area_tasks[task_index - 1]
    next_task = area_tasks[task_index + 1] if task_index + 1 < len(area_tasks) else None

    # 이전 작업이 완료되고 다음 작업이 대기 중인지 확인
    prev_status = get_task_status(prev_task)
    next_status = get_task_status(next_task) if next_task else None

    if prev_status != "완료":
        return False, ""

    # 다른 작업들의 평균 처리 시간 계산
    avg_processing_time = calculate_avg_processing_time(area_tasks[:task_index])

    # 현재 작업의 처리 시간
    task_start = get_task_start_time(task_id)
    task_current_time = datetime.now()
    current_processing_time = (task_current_time - task_start).total_seconds()

    # 평균의 1.5배 이상이면 블로커
    if current_processing_time >= avg_processing_time * 1.5:
        blocker_reason = (f"순차 작업 병목: "
                         f"평균 {avg_processing_time:.0f}초 vs "
                         f"현재 {current_processing_time:.0f}초")
        return True, blocker_reason

    return False, ""
```

---

### 조건 6: 리소스 사용률 대비

```
관계식:
IF (할당된 AI 에이전트의 현재 작업 수 > 평균)
   AND (이 작업 = "대기" 또는 "진행 중" but 진도 0%)
THEN 블로커 감지 = TRUE

의미:
"AI 에이전트가 다른 작업들로 바쁜데 이 작업은 시작도 못 함"
→ 리소스 부족
→ 블로커!

예시:
- Claude-fullstack의 평균 동시작업: 2개
- Claude-fullstack의 현재 작업: 5개 (과부하)
- P1F5: 대기 상태

→ ✅ 블로커 감지!
```

**코드**:
```python
def detect_blocker_condition_6(task_id):
    """
    할당된 AI의 리소스 부하로 인한 지연
    """
    task_status = get_task_status(task_id)
    assigned_ai = get_assigned_ai(task_id)

    if task_status == "완료":
        return False, ""

    # AI의 현재 작업 부하
    ai_current_tasks = get_ai_current_tasks(assigned_ai)
    ai_avg_tasks = get_ai_average_tasks(assigned_ai)

    # AI의 평균보다 2배 이상 많은 작업 처리 중
    if len(ai_current_tasks) >= ai_avg_tasks * 2:
        # 이 작업이 아직 시작 못 함
        if task_status == "대기" or (task_status == "진행 중" and get_task_progress(task_id) == 0):
            blocker_reason = (f"AI 리소스 부하: "
                             f"{assigned_ai}가 "
                             f"{len(ai_current_tasks)}개 작업 처리 중 "
                             f"(평균 {ai_avg_tasks}개)")
            return True, blocker_reason

    return False, ""
```

---

## 📋 블로커 감지 종합 로직

```python
def comprehensive_blocker_detection(task_id):
    """
    모든 관계 기반 조건을 종합적으로 검토
    """
    blockers = []

    # 조건 1: 선행작업 완료 대비 상태 미변경
    is_blocked_1, reason_1 = detect_blocker_condition_1(task_id)
    if is_blocked_1:
        blockers.append(("선행작업 지연", reason_1, priority=1))

    # 조건 2: 예상 시간 대비 소요 시간 과다
    is_blocked_2, reason_2 = detect_blocker_condition_2(task_id)
    if is_blocked_2:
        blockers.append(("시간 초과", reason_2, priority=2))

    # 조건 3: 형제 작업 대비 정체
    is_blocked_3, reason_3 = detect_blocker_condition_3(task_id)
    if is_blocked_3:
        blockers.append(("형제작업 대비 정체", reason_3, priority=3))

    # 조건 4: 전체 진행도 대비 미시작
    is_blocked_4, reason_4 = detect_blocker_condition_4(task_id)
    if is_blocked_4:
        blockers.append(("진행도 불균형", reason_4, priority=4))

    # 조건 5: 순차 작업 병목
    is_blocked_5, reason_5 = detect_blocker_condition_5(task_id)
    if is_blocked_5:
        blockers.append(("순차작업 병목", reason_5, priority=5))

    # 조건 6: AI 리소스 부하
    is_blocked_6, reason_6 = detect_blocker_condition_6(task_id)
    if is_blocked_6:
        blockers.append(("AI 리소스 부하", reason_6, priority=6))

    # 종합 판단
    if blockers:
        # 가장 중요한 블로커 선택
        main_blocker = min(blockers, key=lambda x: x[2])
        return True, main_blocker
    else:
        return False, None


# CSV 기록
def log_blocker_detection(task_id):
    """
    CSV에 블로커 감지 기록
    """
    is_blocked, blocker_info = comprehensive_blocker_detection(task_id)

    if is_blocked:
        blocker_type, blocker_reason, priority = blocker_info
        log_to_csv(task_id, "블로커상태", "감지됨")
        log_to_csv(task_id, "블로커유형", blocker_type)
        log_to_csv(task_id, "블로커사유", blocker_reason)
        log_to_csv(task_id, "블로커심각도", priority)
    else:
        log_to_csv(task_id, "블로커상태", "없음")
```

---

## 🎯 CSV v6.0 업데이트 (Layer 9: 블로커 추적)

```csv
,블로커상태,"없음" | "감지됨"
,블로커유형,"선행작업 지연" | "시간 초과" | "형제작업 정체" | "진행도 불균형" | "순차작업 병목" | "AI 리소스 부하"
,블로커사유,"구체적 사유 (자동 생성)"
,블로커심각도,"1(최심각)" | "2" | "3" | "4" | "5" | "6(경미)"
,자동감지여부,"예" (항상)
```

---

## 💡 핵심 개선

### Before (절대 시간 기반)
```
❌ 7일 이상 진행 없음 → 블로커
❌ 예상 시간의 1.5배 이상 소요 → 블로커 (예상시간 미리 알 수 없음)
→ 당신의 프로젝트에서는 의미 없음
```

### After (순수 관계 기반 - 절대 시간 제거)
```
✅ 선행작업 완료 후 상태 미변경 → 블로커
✅ 진도 진행 속도가 급격히 떨어짐 → 블로커 (관계: 초기속도 vs 현재속도)
✅ 형제 작업들은 진행 중인데 이것만 정체 → 블로커
✅ 전체 프로젝트 70% 진행되는데 이것만 미시작 → 블로커
✅ 이전 작업의 2배 이상 소요 → 블로커
✅ AI 리소스 부하로 시작 못 함 → 블로커

프로젝트 속도에 관계없이 작동!
1초 만에 끝나도 감지, 1주일 걸려도 감지
절대 시간 "0" 사용!
```

---

## ⚠️ 핵심 수정 사항 (2025-10-21)

**사용자 피드백**: "예상 시간이라는 개념은 문제가 있다. 우리가 예상 시간을 알 수가 없어. 예상 시간도 절대 시간이 되어버리기 때문에. 예상 시간 자체가 없어야 돼. 뭔가 다른 걸로 판단을 해야 돼."

**수정 내용**:
- ❌ 제거: 조건 2에서 "예상시간" 개념 완전 삭제
- ✅ 추가: "초기 진행 속도 vs 현재 진행 속도" 비교로 대체
- ✅ 결과: 절대 시간 참조 "0", 순수 관계만 사용

**작동 원리**:
작업이 시작된 후 처음 10% 달성할 때의 속도를 기준으로,
현재 속도가 그 기준의 50% 이하로 떨어지면 블로커 감지

예: 1시간 만에 10%를 했다면 (0.167%/분),
지금 50분이 더 지났는데 5%만 더 늘었다면 (0.1%/분, 40배 느림) → 블로커!

---

**완성! 이제 절대 시간을 "완전히 제거"한 순수 관계 기반 블로커 감지입니다!**

