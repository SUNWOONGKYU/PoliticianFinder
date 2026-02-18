# V30 시스템 - Claude 평가 방법 정리

**작성일**: 2026-01-25
**대상**: 김민석 (f9e00370) 평가 사례

---

## 📋 전체 프로세스 개요

```
[1단계] 수집 (Gemini + Perplexity)
         ↓
      100개 데이터 수집
         ↓
[2단계] 평가 (Claude + ChatGPT + Gemini + Grok)
         ↓
      각 AI가 100개 전체 평가
         ↓
[3단계] 점수 계산
         ↓
      카테고리 점수 → 종합 점수
```

---

## 🔍 Claude 평가의 핵심 특징

### 1. **수집과 평가 완전 분리**

```
❌ Claude는 데이터 수집 안 함!
✅ Claude는 평가만 담당!

수집 AI (2개):
- Gemini: 75개 (OFFICIAL 50 + PUBLIC 25)
- Perplexity: 25개 (PUBLIC 25)

평가 AI (4개):
- Claude    ← 수집 안 하고 평가만!
- ChatGPT   ← 수집 안 하고 평가만!
- Gemini    ← 수집도 하고 평가도!
- Grok      ← 수집 안 하고 평가만!
```

**이유:**
- 수집과 평가를 분리 → 객관성 확보
- 자기가 수집한 것만 평가 → 편향 발생
- 다른 AI가 수집한 것도 평가 → 다양한 관점

---

### 2. **Claude는 API가 아닌 "Subscription Mode"**

**다른 AI들:**
```python
# API 호출
response = openai.chat.completions.create(
    model="gpt-4o-mini",
    messages=[...]
)
# 비용: $0.001 ~ $0.01 per request
```

**Claude:**
```
Claude Code (Subscription) - 대화형 세션
- API 호출 없음
- 비용: $0 (구독 플랜에 포함)
- 파일을 직접 읽고 이해하여 평가
```

**장점:**
- ✅ 비용 $0
- ✅ 맥락을 깊이 이해 (키워드 매칭 아님)
- ✅ reasoning(이유)이 더 구체적

**단점:**
- ⏱️ 시간 소요 (수동 작업)
- 🔄 완전 자동화 불가

---

## 📝 Claude 평가 프로세스 (3단계)

### Step 1: 작업 파일 생성 (Python 스크립트)

**명령어:**
```bash
python evaluate_claude_auto.py \
  --politician_id=f9e00370 \
  --politician_name="김민석" \
  --category=integrity \
  --output=eval_integrity.md
```

**생성되는 파일:**
```
eval_integrity.md           # 사람이 읽을 마크다운
eval_integrity_data.json    # 평가할 데이터 (75개 항목)
```

**eval_integrity_data.json 예시:**
```json
{
  "politician_id": "f9e00370",
  "politician_name": "김민석",
  "category": "integrity",
  "total_items": 68,  // ← 7개 삭제 후
  "items": [
    {
      "id": "abc123...",
      "title": "김민석 재산 신고 논란",
      "content": "2024년 12월 재산 신고에서...",
      "source_type": "PUBLIC",
      "published_date": "2025-06-15"
    },
    // ... 67개 더
  ]
}
```

---

### Step 2: Claude Code 배치 평가 (핵심!)

#### 2-1. 데이터 분할

68개 항목을 **10개씩 배치**로 나눔:

```bash
python split_batches.py eval_integrity_data.json
```

**생성 결과:**
```
batch_01.json (10개)
batch_02.json (10개)
batch_03.json (10개)
batch_04.json (10개)
batch_05.json (10개)
batch_06.json (10개)
batch_07.json (8개)
```

#### 2-2. Claude Code가 각 배치 평가

**⚠️ 중요: 이것은 자동화할 수 없습니다!**

Claude Code(AI)가 **실제로 읽고 이해하고 판단**해야 합니다.

**각 배치마다:**

1. **파일 읽기**
   ```
   Read tool: batch_01.json
   ```

2. **각 항목 평가**

   **예시 항목:**
   ```json
   {
     "title": "김민석 총리 후보자, 4천만원 차용 논란",
     "content": "2018년 전 의원으로부터 4천만원을 차용하여 2023년까지 상환하지 않았다는 의혹이 제기됨. 과거 정치자금법 위반 전과가 있는 인물에게 차용..."
   }
   ```

   **Claude의 평가 과정:**
   ```
   [1] 제목과 내용 읽기
   → "4천만원 차용 논란", "과거 정치자금법 위반 전과"

   [2] 청렴성 관점에서 판단
   → 이것은 청렴성(integrity)과 관련있는가? Yes
   → 금전 관련 문제? Yes
   → 10개 평가 기준 중 어디? → "4-4: 정치자금법 관련 기록"

   [3] 긍정 vs 부정 판단
   → 명백히 부정적 (차용 + 미상환 + 과거 전과)

   [4] 등급 결정
   → -2 (부정적) or -3 (매우 부정적)?
   → -3 선택 (과거 전과 + 재차 차용 = 중대한 문제)

   [5] 이유 작성
   → "과거 정치자금법 위반 전과가 있는 인물에게 2018년 재차 4천만원을 차용하고 5년간 상환하지 않아 청렴성에 중대한 의문 제기"
   ```

3. **결과 저장**
   ```json
   {
     "batch_num": 1,
     "evaluations": [
       {
         "collected_data_id": "abc123...",
         "rating": "-3",
         "score": -6,
         "reasoning": "과거 정치자금법 위반 전과가 있는 인물에게 2018년 재차 4천만원을 차용하고 5년간 상환하지 않아 청렴성에 중대한 의문 제기"
       },
       // ... 9개 더
     ]
   }
   ```

   **파일명**: `batch_01_result.json`

#### 2-3. 7개 배치 반복

```
batch_01.json → Claude 평가 → batch_01_result.json ✅
batch_02.json → Claude 평가 → batch_02_result.json ✅
batch_03.json → Claude 평가 → batch_03_result.json ✅
batch_04.json → Claude 평가 → batch_04_result.json ✅
batch_05.json → Claude 평가 → batch_05_result.json ✅
batch_06.json → Claude 평가 → batch_06_result.json ✅
batch_07.json → Claude 평가 → batch_07_result.json ✅
```

#### 2-4. 결과 통합

```bash
python merge_batch_results.py eval_integrity
```

**생성 결과:**
```
eval_integrity_result.json  # 전체 68개 평가 결과
```

---

### Step 3: DB Import (Python 스크립트)

**명령어:**
```bash
python evaluate_claude_auto.py \
  --import_results=eval_integrity_result.json
```

**DB 저장:**
```sql
INSERT INTO evaluations_v30 (
  politician_id,
  category,
  evaluator_ai,
  collected_data_id,
  rating,
  score,
  reasoning
) VALUES (
  'f9e00370',
  'integrity',
  'Claude',
  'abc123...',
  '-3',
  -6,
  '과거 정치자금법...'
);
```

---

## 🎯 Claude 평가의 핵심 원칙

### 1. **맥락 이해 (키워드 매칭 금지)**

**❌ 잘못된 방법 (키워드 매칭):**
```python
if "의혹" in text or "논란" in text:
    rating = "-2"  # 무조건 부정

if "성과" in text or "수상" in text:
    rating = "+2"  # 무조건 긍정
```

**✅ 올바른 방법 (맥락 이해):**
```
제목: "김민석 재산 의혹 해명"
내용: "김민석은 재산 형성 과정 의혹에 대해 상세히 해명하고 모든 자료를 공개했다. 시민단체는 '투명한 해명'이라고 평가..."

Claude 판단:
→ "의혹"이라는 단어는 있지만
→ 실제 내용은 "해명 + 자료 공개 + 긍정 평가"
→ 등급: +1 (투명한 대응)
→ 이유: "재산 형성 과정 의혹에 대해 상세한 자료를 공개하고 투명하게 해명하여 책임있는 모습을 보임"
```

### 2. **카테고리 관점 유지**

**예시: 청렴성(integrity) 평가 시**

| 내용 | 청렴성 관련? | 평가 |
|------|--------------|------|
| 재산 형성 과정 의혹 | ✅ Yes | -2 또는 -3 |
| 정치자금법 위반 | ✅ Yes | -2 또는 -3 |
| 학력 위조 의혹 | ❌ No | 0 (윤리성으로) |
| 막말 논란 | ❌ No | 0 (윤리성으로) |
| 공약 불이행 | ❌ No | 0 (책임성으로) |

**청렴성 10개 평가 기준:**
1. 금전 관련 형사 판결
2. 재산 신고 변동
3. 공직자윤리법 관련
4. 정치자금법 관련
5. 선거법 관련
6. 금전 관련 언론 보도
7. 한국투명성기구 평가
8. 시민단체 청렴 평가
9. 정치자금 관련 보도
10. 청렴 관련 평가 기록

**→ 이 10개에 해당하지 않으면 rating = 0**

### 3. **등급 체계 (숫자 기반)**

| 등급 | Score | 의미 | 청렴성 예시 |
|:----:|:-----:|:-----|:------------|
| **+4** | +8 | 탁월 | 부패 척결 주도, 청렴 모범 수상 |
| **+3** | +6 | 우수 | 시민단체 청렴도 최우수 |
| **+2** | +4 | 양호 | 금전적 비리 없이 깨끗한 활동 |
| **+1** | +2 | 경미한 긍정 | 특별한 문제 없음 |
| **0** | 0 | 중립 | 카테고리와 관련 없음 |
| **-1** | -2 | 약간 부정적 | 경미한 의혹 제기 |
| **-2** | -4 | 부정적 | 금전 논란 |
| **-3** | -6 | 매우 부정적 | 중대한 금전 비리 |
| **-4** | -8 | 극도로 부정적 | 형사 처벌 수준 |

### 4. **reasoning(이유) 필수**

**각 평가마다 왜 이 등급인지 설명:**

```json
{
  "rating": "-3",
  "score": -6,
  "reasoning": "과거 정치자금법 위반 전과(2004, 2008년)가 있음에도 2018년 재차 불법 정치자금 제공자에게 4천만원을 차용하고 5년간 상환하지 않아 청렴성에 중대한 의문. 반복적 문제로 청렴성 매우 부정적"
}
```

**구체적일수록 좋음:**
- ✅ "2018년 4천만원 차용 후 5년간 미상환"
- ❌ "금전 문제"

---

## 📊 김민석 청렴성 평가 결과

### Claude의 평가 (데이터 정리 후)

**평가 데이터:**
- 수집 데이터: 68개 (75개 - 7개 과거 사건)
- 평가 개수: 26개 (중복 제거 후)

**Rating 분포:**
```
+2: 15개 (57.7%) - "금전 비리 없이 깨끗한 활동"
-1:  1개 (3.8%)  - "경미한 의혹"
-3: 10개 (38.5%) - "중대한 금전 비리"
```

**점수 계산:**
```
Total score = (15 × 4) + (1 × -2) + (10 × -6)
            = 60 - 2 - 60
            = -2

평균 score = -2 / 26 = -0.08

카테고리 점수 = (6.0 + (-0.08) × 0.5) × 10
              = (6.0 - 0.04) × 10
              = 5.96 × 10
              = 59.6점
```

**결과: 59.6점 / 100점**

---

## 💡 Claude 평가의 장단점

### ✅ 장점

1. **비용 $0**
   - API 호출 없음
   - Subscription Mode 활용

2. **깊은 맥락 이해**
   - 단순 키워드 매칭 아님
   - 전체 내용을 읽고 이해

3. **구체적인 reasoning**
   - 왜 이 등급인지 명확히 설명
   - 검증 가능

4. **카테고리 관점 유지**
   - 청렴성은 청렴성 관점만
   - 다른 이슈는 0 처리

### ⚠️ 단점

1. **시간 소요**
   - 카테고리당 약 1~2시간
   - 10개 카테고리 = 10~20시간

2. **수동 작업**
   - 완전 자동화 불가
   - Claude Code 세션 필요

3. **평가 개수 제한**
   - 타 AI: 75개 전체 평가
   - Claude: 중복 제거 후 26~70개

---

## 🎯 결론

**Claude 평가 방법:**

1. **수집 안 함, 평가만 담당**
2. **Subscription Mode 사용 (비용 $0)**
3. **배치 방식 (10개씩 나누어 평가)**
4. **맥락 이해 중심 (키워드 매칭 아님)**
5. **카테고리 관점 엄격 유지**
6. **구체적인 reasoning 작성**

**김민석 청렴성 평가:**
- 68개 데이터 → 26개 평가
- 평균 score: -0.08
- 최종 점수: 59.6점
- 결론: 과거 사건 제거 후에도 60점 미만

---

**작성일**: 2026-01-25
**평가 시스템**: V30
**평가 AI**: Claude (Subscription Mode)
