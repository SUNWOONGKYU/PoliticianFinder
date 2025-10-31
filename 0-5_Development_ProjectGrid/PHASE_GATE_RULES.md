# Phase Gate 승인 규칙

## 🔴 필수 규칙: Phase Gate는 사용자 승인 필수

**Phase Gate 완료는 반드시 사용자의 명시적 승인이 필요합니다.**

### 승인 원칙

- ❌ **AI 자동 승인 금지**: AI가 스스로 Phase Gate를 완료 처리할 수 없음
- ✅ **사용자 명시적 승인**: 사용자가 "Phase Gate 완료 처리해" 등으로 명시적 지시 필요
- ✅ **승인 기록**: Phase Gate 완료 시 `generator` 필드에 승인자 기록

### 승인 프로세스

```python
def complete_phase_gate(gate_id, user_approved=False):
    """Phase Gate 완료 처리"""

    # 1. 사용자 승인 확인
    if not user_approved:
        raise PermissionError("❌ Phase Gate는 사용자 승인 필요")

    # 2. 모든 조건 충족 확인
    can_proceed, message = can_enter_next_phase(current_phase)
    if not can_proceed:
        return False, f"조건 미충족: {message}"

    # 3. Phase Gate 완료 처리
    gate = grid.get_task(gate_id)
    gate['status'] = '✅ 완료'
    gate['progress'] = 100
    gate['generator'] = get_current_user()  # 승인자 기록
    gate['modification_history'] = f"{datetime.now()}: Phase 완료 검증 완료 (사용자 승인)"

    return True, "Phase Gate 통과"
```

### 승인 예시

```python
# ❌ 잘못된 예: AI가 자동으로 승인
ai.complete_phase_gate("GATE_P1")  # 금지!

# ✅ 올바른 예: 사용자가 명시적으로 승인 지시
user: "Phase 1 완료됐으니 Phase Gate 완료 처리해"
ai: complete_phase_gate("GATE_P1", user_approved=True)  # 허용
```

### 위반 시 조치

- AI가 사용자 승인 없이 Phase Gate를 완료 처리하면 자동 롤백
- 반복 위반 시 AI 작업 권한 제한

## Phase Gate 완료 조건

Phase Gate를 완료하려면 다음 조건을 모두 충족해야 합니다:

1. **모든 작업 완료**: 해당 Phase의 모든 작업이 100% 완료
2. **모든 테스트 통과**: 각 작업의 테스트가 모두 통과
3. **모든 빌드 성공**: 빌드가 성공적으로 완료
4. **의존성 정상**: 모든 의존성 체인이 정상 작동
5. **검증 완료**: 종합 검증 결과가 "✅ 검증 완료"

## 사용자 승인 예시

### 예시 1: 정상 승인
```
사용자: "Phase 1 모든 작업 완료됐어. Phase Gate 완료 처리해."
AI: Phase 1의 20개 작업이 모두 완료되고 모든 조건을 충족했습니다.
    GATE_P1을 완료 처리하겠습니다.
    [GATE_P1 완료 처리 실행]
```

### 예시 2: 조건 미충족 시
```
사용자: "Phase Gate 완료 처리해."
AI: ❌ Phase 1의 작업이 아직 완료되지 않았습니다.
    - P1D3: 진행중 (80%)
    - P1BA2: 대기중 (0%)
    Phase Gate를 완료하려면 모든 작업이 완료되어야 합니다.
```

### 예시 3: 자동 승인 시도 (금지)
```
AI가 자동으로: "Phase 1 작업이 완료되었으므로 GATE_P1을 완료 처리하겠습니다."
→ ❌ 금지! 반드시 사용자의 명시적 승인 필요
```
