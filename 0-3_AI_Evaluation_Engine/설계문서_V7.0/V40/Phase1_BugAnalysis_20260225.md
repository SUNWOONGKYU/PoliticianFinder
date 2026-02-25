# Phase 1 수집 버그 분석 (2026-02-25)

## 🔴 Critical Bug Found: 불완전한 카테고리별 수집

### 발견 내용

**명재성 (1e43d6f1) - Gemini 수집:**
```
expertise:        22개 ✅
leadership:        0개 ❌
vision:            0개 ❌
integrity:         0개 ❌
ethics:            0개 ❌
accountability:    0개 ❌
transparency:      0개 ❌
communication:     0개 ❌
responsiveness:    0개 ❌
publicinterest:    0개 ❌
---
합계: 22개 (목표: 600개 이상)
```

**이재준 (c45565d7) - Naver 수집:**
```
expertise:        21개 ✅
leadership:        0개 ❌
vision:            0개 ❌
integrity:         0개 ❌
ethics:            0개 ❌
accountability:    0개 ❌
transparency:      0개 ❌
communication:     0개 ❌
responsiveness:    0개 ❌
publicinterest:    0개 ❌
---
합계: 21개 (목표: 600개 이상)
```

### 패턴 분석

1. **두 정치인 모두 "expertise" 카테고리에서만 데이터 수집됨**
   - 명재성: Gemini expertise 22개
   - 이재준: Naver expertise 21개

2. **나머지 9개 카테고리는 완전히 0개**
   - 수집 반복문이 expertise 이후에 중단됨
   - 또는 수집되지 않음

### 원인 추정

#### 가설 1: 반복문 실행 중단 (가능성 높음)
- `run_type_b_phase1.sh`의 반복문이 첫 카테고리에서만 실행
- 이후 프로세스 중단
- 원인: timeout, 할당량 소진, 또는 예외 발생 후 복구 불가

#### 가설 2: Phase 1 자동 마킹 (의심 부분)
- Phase 1이 2026-02-25 15:58:55에 자동으로 "DONE" 마킹됨 (1초 이내)
- 실제 수집 완료가 아닌 상태 마킹 가능성
- Phase 0 (정치인 등록)에서 자동으로 Phase 1도 마킹했을 가능성

#### 가설 3: Type C 실행 프로세스 미흡
- 명재성, 이재준은 Type C (API 기반) 정치인
- run_type_b_phase1.sh 실행 로그 부재 (이동환은 있음)
- 다른 방식으로 수집되었거나, 부분적으로만 실행됨

### 영향 범위

1. **Phase 2-2 (조정)이 재수집을 시도했으나 실패**
   - 명재성: Naver로 574개 수집 (균형 맞춤)
   - 이재준: Gemini로 216개 수집 (일부만)

2. **최종 불균형 상태**
   - 명재성: Gemini 22 + Naver 574 = 596개 (불균형)
   - 이재준: Gemini 216 + Naver 21 = 237개 (심각한 불균형)

3. **평가 단계 영향**
   - 데이터 부족으로 Grok 평가 Gate 체크 실패
   - Claude/ChatGPT만 부분 평가 진행
   - Gemini 평가 할당량 소진

---

## 🔧 수정 방안

### Step 1: Phase 1 재실행 (우선순위 1)

명재성과 이재준의 Phase 1 수집을 **완전히 재실행**해야 합니다.

```bash
# Phase 1 상태 초기화
cd V40/scripts/core
python -c "
from helpers.phase_tracker import reset_phase
reset_phase('1e43d6f1', '1')  # 명재성
reset_phase('c45565d7', '1')  # 이재준
"

# Phase 1 재실행 (run_type_b_phase1.sh 사용)
cd V40/scripts/workflow
python3 << 'EOF'
import json

politicians = [
    {"id": "1e43d6f1", "name": "명재성"},
    {"id": "c45565d7", "name": "이재준"}
]

print(json.dumps(politicians))
EOF
 | ./run_type_b_phase1.sh --stdin
```

### Step 2: 수집 로그 모니터링

- 각 정치인별로 **10개 카테고리 × 7라운드 = 70회** 수집 확인
- 각 라운드 후 로그 기록
- 실패 원인 즉시 파악

### Step 3: Phase 2-2 재실행

```bash
python adjust_v40_data.py --politician_id=1e43d6f1 --politician_name="명재성" --no-dry-run
python adjust_v40_data.py --politician_id=c45565d7 --politician_name="이재준" --no-dry-run
```

---

## 🚨 예방 조치

### Issue 1: `|| true` 오류 무시 (run_type_b_phase1.sh:89, 104)

**현재 코드:**
```bash
python collect_gemini_subprocess.py ... 2>&1 || true
```

**문제:**
- 수집 실패해도 에러 무시
- 실패 원인을 파악할 수 없음

**해결책:**
```bash
python collect_gemini_subprocess.py ... 2>&1 | tee -a "$log_file" || {
  echo "[ERROR] Collection failed: $?" >> "$log_file"
  exit 1
}
```

### Issue 2: Phase 1 자동 마킹 검증

Phase 1 마킹 시 **실제 수집 완료 확인** 필수:
```python
# 마킹 전
if total_items < 1000:
    raise Exception(f"Collection incomplete: {total_items}/1000")

mark_phase_done(politician_id, '1', f'수집완료: {total_items}개')
```

### Issue 3: run_type_b_phase1.sh 검증

각 정치인별로 수집 결과를 즉시 검증:
```bash
count=$(python check_collection_status.py --politician "$name")
if [ "$count" -lt 600 ]; then
  echo "[WARNING] Insufficient collection: $count/600"
  # 재수집 트리거
fi
```

---

## 📊 최종 검증 항목

- [ ] 명재성 Phase 1 재실행: 600+ (Gemini + Naver)
- [ ] 이재준 Phase 1 재실행: 600+ (Gemini + Naver)
- [ ] 카테고리별 균형 확인: 10개 카테고리 모두 60개 이상
- [ ] Phase 2-2 재실행: 조정 완료
- [ ] 평가 재실행: 4 AI × 10 카테고리 완료
- [ ] 점수 재계산: 최종 점수 확정
- [ ] 보고서 재생성: 최신 데이터 반영

---

**작성일**: 2026-02-25
**담당자**: Claude Code
**상태**: 버그 분석 완료 → 수정 대기
