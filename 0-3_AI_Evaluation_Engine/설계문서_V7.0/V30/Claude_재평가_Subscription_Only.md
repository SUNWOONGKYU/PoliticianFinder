# Claude 재평가 프로세스 (Subscription Mode Only)

**작성일**: 2026-01-25
**핵심 원칙**: Claude는 절대 API 사용 안 함 - 오직 Subscription Mode

---

## ⚠️ 절대 원칙

### ❌ 금지
- Claude API 사용 (소량이든 대량이든 절대 안 됨)
- Hybrid 방식 (API 포함)
- 자동화된 API 호출

### ✅ 허용
- **Subscription Mode만 사용**
- evaluate_claude_subscription.py
- evaluate_claude_auto.py + Claude Code 수동 평가
- 비용: $0 (항상)

---

## 재평가 프로세스

### 1. 누락 평가 확인

```bash
python get_missing_evaluations_optimized.py --politician_id=d0a5d6e1
```

**출력 예시:**
```
Claude 누락: 120개
- expertise: 15개
- leadership: 12개
- vision: 13개
...
```

### 2. Claude 재평가 (Subscription Mode)

**방법 A: evaluate_claude_subscription.py 사용**

```bash
# 누락된 카테고리만 재평가
python evaluate_claude_subscription.py \
  --politician_id=d0a5d6e1 \
  --politician_name="조은희" \
  --category=expertise \
  --batch_size=50
```

- 자동으로 이미 평가된 것은 건너뛰기
- 누락된 15개만 평가
- 50개 배치 (빠름)
- 비용: $0

**방법 B: evaluate_claude_auto.py 사용**

```bash
# Step 1: 작업 생성
python evaluate_claude_auto.py \
  --politician_id=d0a5d6e1 \
  --politician_name="조은희" \
  --category=expertise \
  --output=eval_expertise_missing.md

# Step 2: Claude Code에게 요청
"eval_expertise_missing.md 파일의 평가 작업을 수행해주세요"

# Step 3: DB 저장
python evaluate_claude_auto.py \
  --import_results=eval_expertise_missing_result.json
```

### 3. 누락 카테고리 모두 재평가

**순차 실행:**
```bash
for cat in expertise leadership vision integrity
do
  python evaluate_claude_subscription.py \
    --politician_id=d0a5d6e1 \
    --politician_name="조은희" \
    --category=$cat \
    --batch_size=50
done
```

**병렬 실행 (더 빠름):**
```bash
# 5개 터미널에서 동시 실행
터미널 1: expertise
터미널 2: leadership  
터미널 3: vision
터미널 4: integrity
터미널 5: ethics
```

### 4. 재확인

```bash
python get_missing_evaluations_optimized.py --politician_id=d0a5d6e1
```

**출력:**
```
✅ Claude 누락: 0개 (완료!)
```

---

## 소요 시간

### 소량 누락 (≤30개)
- 1개 카테고리: 1-2분
- 3개 카테고리: 3-6분
- 비용: $0

### 중량 누락 (30-100개)
- 2개 카테고리: 5분
- 5개 카테고리: 12분
- 비용: $0

### 대량 누락 (100-500개)
- 5개 카테고리: 25분
- 10개 카테고리: 50분
- 비용: $0

**참고:** 
- API 사용 시: 30개 = $0.01, 300개 = $0.10
- Subscription Mode: 무제한 = $0
- **결론: API 절대 사용 불필요!**

---

## ChatGPT/Gemini/Grok 재평가

### 이 AI들은 API 사용 OK

```bash
# 자동 재평가 (API)
python evaluate_v30.py \
  --politician_id=d0a5d6e1 \
  --politician_name="조은희" \
  --ai=ChatGPT

python evaluate_v30.py \
  --politician_id=d0a5d6e1 \
  --politician_name="조은희" \
  --ai=Gemini

python evaluate_v30.py \
  --politician_id=d0a5d6e1 \
  --politician_name="조은희" \
  --ai=Grok
```

- 자동으로 누락만 재평가
- 비용: 소량
- 빠름

---

## 전체 재평가 워크플로우

### run_v30_workflow.py 수정

**현재 (잘못됨):**
```python
# Claude 하이브리드 (API 포함) ❌
reevaluate_claude_hybrid(...)
```

**수정 (올바름):**
```python
# Claude Subscription Mode만 ✅
print("Claude 재평가는 수동으로 진행해주세요:")
print("  python evaluate_claude_subscription.py ...")
```

---

## 결론

**Claude 재평가:**
- ✅ Subscription Mode만
- ✅ 비용 $0
- ✅ 소량이든 대량이든 동일
- ❌ API 절대 사용 안 함

**다른 AI 재평가:**
- ✅ API 자동 재평가
- ✅ 빠르고 편리
- ✅ 비용 소량

---

**최종 업데이트**: 2026-01-25
**원칙**: Claude API 절대 사용 금지!
