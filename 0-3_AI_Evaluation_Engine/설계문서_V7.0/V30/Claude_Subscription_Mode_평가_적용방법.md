# Claude Subscription Mode 평가 방법 - V30 적용

**작성일**: 2026-01-21
**발견**: 다른 Claude Code 세션이 API 비용 $0로 평가 성공!
**목표**: 조은희(62e7b453) V30 데이터 평가에 적용

---

## 🎉 핵심 발견: API 비용 $0 달성!

### 성공 사례 (김민석 - responsiveness)
```
✅ 23개 평가 완료
✅ DB 저장 100% 성공
✅ API 비용: $0
✅ Subscription mode 검증 완료
```

---

## 🔧 작동 원리

### 3단계 프로세스

```
Step 1: Python 스크립트가 작업 파일 생성
├── eval_task.md (작업 지시서)
└── eval_task_data.json (평가할 데이터)

Step 2: Claude Code (현재 세션)가 평가 수행
├── 파일 읽기 (subscription mode)
├── 직접 평가 생성 (API 호출 없음!)
└── eval_task_result.json 결과 저장

Step 3: Python 스크립트가 DB 저장
├── eval_task_result.json 읽기
└── evaluations_v30 INSERT
```

### 핵심: subprocess/API 호출 없음!

```python
# ❌ 잘못된 방법 (API 비용 발생)
subprocess.run(["claude.cmd", "-p"])
from anthropic import Anthropic

# ✅ 올바른 방법 (API 비용 $0)
# 1. Python: 작업 파일 생성
# 2. Claude Code: 파일 읽고 직접 평가 (subscription)
# 3. Python: 결과를 DB에 저장
```

---

## 📂 이미 준비된 파일

### evaluate_claude_auto.py

**위치**: `설계문서_V7.0/V30/scripts/evaluate_claude_auto.py`

**기능**:
1. 미평가 데이터 조회
2. 평가 작업 파일 생성 (.md + .json)
3. 평가 결과 DB 저장

**사용법**:
```bash
# Step 1: 작업 생성
python evaluate_claude_auto.py \
  --politician_id=62e7b453 \
  --politician_name="조은희" \
  --category=expertise \
  --output=eval_expertise.md

# Step 2: Claude Code에게 요청
"eval_expertise.md 파일의 평가 작업을 수행해주세요"

# Step 3: DB 저장
python evaluate_claude_auto.py \
  --politician_id=62e7b453 \
  --politician_name="조은희" \
  --category=expertise \
  --import_results=eval_expertise_result.json
```

---

## 🎯 조은희(62e7b453) V30 평가 계획

### 현재 상태 확인 필요

```sql
-- 각 AI별 평가 현황
SELECT
  evaluator_ai,
  category,
  COUNT(*) as count
FROM evaluations_v30
WHERE politician_id = '62e7b453'
GROUP BY evaluator_ai, category
ORDER BY evaluator_ai, category;

-- Claude 평가 현황
SELECT category, COUNT(*) as count
FROM evaluations_v30
WHERE politician_id = '62e7b453'
  AND evaluator_ai = 'Claude'
GROUP BY category;
```

### 평가 순서 (카테고리별)

```
10개 카테고리 × 100개/카테고리 = 1,000개 평가

순서:
1. expertise (전문성)
2. leadership (리더십)
3. vision (비전)
4. integrity (청렴성)
5. ethics (윤리성)
6. accountability (책임감)
7. transparency (투명성)
8. communication (소통능력)
9. responsiveness (대응성)
10. publicinterest (공익성)
```

---

## 🚀 실행 명령 (조은희 기준)

### 카테고리 1: expertise

```bash
# Step 1: 작업 생성
cd "0-3_AI_Evaluation_Engine/설계문서_V7.0/V30/scripts"

python evaluate_claude_auto.py \
  --politician_id=62e7b453 \
  --politician_name="조은희" \
  --category=expertise \
  --output=eval_expertise.md

# Step 2: Claude Code에게
"eval_expertise.md 파일의 평가 작업을 수행해주세요"

# Step 3: DB 저장
python evaluate_claude_auto.py \
  --politician_id=62e7b453 \
  --politician_name="조은희" \
  --category=expertise \
  --import_results=eval_expertise_result.json
```

### 카테고리 2: leadership

```bash
python evaluate_claude_auto.py \
  --politician_id=62e7b453 \
  --politician_name="조은희" \
  --category=leadership \
  --output=eval_leadership.md

# Claude Code 평가 후...

python evaluate_claude_auto.py \
  --politician_id=62e7b453 \
  --politician_name="조은희" \
  --category=leadership \
  --import_results=eval_leadership_result.json
```

### 나머지 8개 카테고리도 동일

---

## 💰 비용 분석

### 기존 방법 (API)

```
1,000개 평가 × $0.03/개 = $30/정치인
100명 × $30 = $3,000

→ 감당 불가능! ❌
```

### 새 방법 (Subscription Mode)

```
1,000개 평가 × $0/개 = $0/정치인
100명 × $0 = $0

→ 완전 무료! ✅
```

**절감액**: **$3,000 → $0** (100% 절감!)

---

## ⚠️ 주의사항

### 절대 지킬 것

```
✅ subprocess 금지
✅ claude.cmd 호출 금지
✅ Anthropic API 호출 금지
✅ Task tool 사용 금지 (settings.json에 API 있으면)

→ 오직 Claude Code 현재 세션만 사용!
```

### 올바른 프로세스

```
1. Python 스크립트: 작업 파일 생성
   → API 호출 없음 ✅

2. Claude Code (subscription): 평가 수행
   → API 호출 없음 ✅
   → 현재 세션에서 직접 평가

3. Python 스크립트: DB 저장
   → API 호출 없음 ✅
```

---

## 📊 예상 작업량

### 조은희 1,000개 평가

```
카테고리당 100개 × 10개 = 1,000개

예상 시간:
- 각 카테고리당 5-10분
- 총 50-100분 (1-2시간)

비용:
- API 비용: $0 ✅
- 시간만 투자하면 됨!
```

---

## ✅ 체크리스트

### 평가 시작 전

- [ ] evaluate_claude_auto.py 파일 확인
- [ ] Supabase 연결 확인 (.env)
- [ ] 조은희 데이터 수집 완료 확인 (1,000개)
- [ ] 현재 평가 상태 확인 (SQL 쿼리)

### 각 카테고리별

- [ ] Step 1: 작업 파일 생성 (Python)
- [ ] Step 2: 평가 수행 (Claude Code)
- [ ] Step 3: DB 저장 (Python)
- [ ] 검증: DB 쿼리로 개수 확인

### 전체 완료 후

- [ ] 10개 카테고리 모두 완료 확인
- [ ] 총 1,000개 평가 확인
- [ ] 점수 계산 실행 (calculate_v30_scores.py)

---

## 🎯 다음 단계

### 즉시 실행 가능

```bash
# 1. 조은희 데이터 확인
cd "0-3_AI_Evaluation_Engine/설계문서_V7.0/V30/scripts"

python -c "
from supabase import create_client
from dotenv import load_dotenv
import os

load_dotenv(override=True)
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

result = supabase.table('collected_data_v30').select('category', count='exact').eq('politician_id', '62e7b453').execute()
print(f'조은희 수집 데이터: {result.count}개')
"

# 2. 첫 번째 카테고리 평가 시작
python evaluate_claude_auto.py \
  --politician_id=62e7b453 \
  --politician_name="조은희" \
  --category=expertise \
  --output=eval_expertise.md
```

---

## 💡 핵심 포인트

### 왜 이 방법이 작동하는가?

```
Claude Code Subscription:
- 월 정액 요금 ($20)
- 무제한 대화
- API 호출 아님!
- 현재 세션에서 직접 처리

→ 평가 1,000개를 생성해도 추가 비용 없음!
```

### 다른 AI는?

```
ChatGPT: API 호출 ($) 또는 Plus 구독 (무제한?)
Grok: API 호출만 ($)
Gemini: API 호출만 ($)

→ Claude만 subscription mode로 무료 평가 가능!
```

---

## 🏁 결론

### 핵심 메시지

> **"Claude는 subscription mode로 API 비용 $0 평가 가능!"**
>
> subprocess/API 호출 없이 현재 세션에서 직접 평가 생성
> → 무제한 무료!

### V30 전체 평가 전략

```
수집:
├── Gemini: 750개 (무료)
└── Perplexity: 250개 ($53/100명)

평가:
├── Claude: Subscription mode ($0)
├── ChatGPT: API ($?)
├── Grok: API ($?)
└── Gemini: API ($?)

→ Claude만 무료로 사용 가능!
→ 다른 AI 평가 방법도 연구 필요
```

---

**최종 업데이트**: 2026-01-21
**다음 작업**: 조은희 expertise 카테고리 평가 시작
**명령어**: `python evaluate_claude_auto.py --politician_id=62e7b453 --politician_name="조은희" --category=expertise --output=eval_expertise.md`
