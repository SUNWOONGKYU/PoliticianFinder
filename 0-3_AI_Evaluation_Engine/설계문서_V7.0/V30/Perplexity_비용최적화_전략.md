# Perplexity 비용 최적화 전략

**작성일**: 2026-01-20
**목표**: Gemini 500 + Perplexity 500 = 1,000개 수집 비용 최소화

---

## 📊 사용자 요구사항

### 새로운 V30 구조

```
수집:
├── Gemini: 500개 (50%)
└── Perplexity: 500개 (50%)

평가:
└── 4개 AI (Claude, ChatGPT, Grok, Gemini)가 1,000개 전체 평가

이상적: 50-50 (PUBLIC/OFFICIAL 구분 없이)
대안: Perplexity가 OFFICIAL 어려우면 75-25
```

### 핵심 과제

> **"퍼플렉시티의 요금을 어떻게든지 싸게 할 거냐"**

---

## 💰 비용 분석

### 현재 Perplexity API 가격 (2026년)

| 모델 | Input | Output | Request Fee | 용도 |
|------|-------|--------|-------------|------|
| **Sonar** | $1/1M | $1/1M | $5/1K requests | **검색 전용 (권장)** |
| Sonar Pro | $3/1M | $15/1M | $5/1K requests | 고품질 검색 |
| Sonar Reasoning | $5/1M | $15/1M | $14/1K requests | 추론 필요 시 |

### 시나리오별 비용 계산

#### 시나리오 1: 500개 수집/정치인 (Sonar 모델)

```
가정:
- 모델: Sonar ($1/1M input, $1/1M output, $5/1K requests)
- 평균 input: 500 tokens/request
- 평균 output: 2,000 tokens/response
- 총 requests: 500/politician

계산:
Input  = 500 requests × 500 tokens  = 250K tokens  × $1/1M   = $0.25
Output = 500 requests × 2,000 tokens = 1M tokens   × $1/1M   = $1.00
Request= 500 requests                × $5/1K requests        = $2.50

정치인당 비용 = $3.75
```

#### 100명 기준 총 비용

```
100명 × $3.75 = $375

⚠️ Gemini는 무료이므로:
총 수집 비용 = $375 (Perplexity만)
```

---

## 🎯 비용 최적화 전략 (7가지)

### 전략 1: Sonar 모델 사용 (필수)

```
현재 사용: Sonar Pro ($3/1M input)
변경: Sonar ($1/1M input)

절감 효과:
- Input: $0.75 → $0.25 (67% 절감)
- Output: $15/1M → $1/1M (93% 절감!)

정치인당 비용:
- Before (Sonar Pro): $9.50
- After (Sonar): $3.75

100명 기준 절감: $575
```

**결론**: ✅ **필수 적용** (Sonar 모델로 고정)

---

### 전략 2: Pro 구독 ($5/월 크레딧)

```
Pro 구독비: $20/월
월 API 크레딧: $5

효과:
- $375 - $5 = $370/100명

절감액: $5/월 (1.3%)
```

**결론**: ⚠️ **미미한 효과** (선택사항)

---

### 전략 3: 프롬프트 최적화 (Input 토큰 절감)

#### 현재 프롬프트 (예상)

```
평균 input: 500 tokens

"조은희 의원에 대한 전문성 관련 데이터를 수집해주세요.

다음 조건을 만족하는 데이터를 찾아주세요:
- 기간: 2024-2026년
- 출처: 신뢰할 수 있는 언론사
- 내용: 전문성과 관련된 활동, 발언, 평가
- 형식: JSON

... (긴 설명)
"
```

#### 최적화된 프롬프트

```
평균 input: 200 tokens (60% 절감)

"조은희 의원 전문성 데이터 수집 (2024-2026)
JSON 형식으로 제목, URL, 날짜, 요약 제공.
신뢰 언론사만."
```

**절감 효과**:

```
Before: 500 tokens × 500 requests = 250K tokens = $0.25
After:  200 tokens × 500 requests = 100K tokens = $0.10

정치인당 절감: $0.15
100명 절감: $15
```

**결론**: ✅ **적용 권장** (15-20% 절감)

---

### 전략 4: Output 길이 제한 (max_tokens)

```python
# 현재
response = client.chat.completions.create(
    model="sonar",
    messages=[...],
    max_tokens=8000  # 기본값
)

# 최적화
response = client.chat.completions.create(
    model="sonar",
    messages=[...],
    max_tokens=2000  # 충분한 최소값
)
```

**절감 효과**:

```
Before: 평균 output 2,000 tokens (실제 사용)
After:  max_tokens=2000으로 제한하여 불필요한 긴 응답 방지

예상 output 감소: 2,000 → 1,500 tokens (25% 절감)

정치인당 절감: $0.25
100명 절감: $25
```

**결론**: ✅ **적용 권장** (25% output 절감)

---

### 전략 5: 배치 요청 (Request Fee 절감)

#### 현재 방식 (개별 요청)

```
500개 데이터 = 500 requests
Request fee: 500 × $5/1K = $2.50/politician
```

#### 배치 방식

```python
# 한 번의 요청으로 10개씩 수집
"조은희 의원 전문성 관련 데이터 10개를 한 번에 수집해주세요."

500개 데이터 = 50 requests (10개씩 묶음)
Request fee: 50 × $5/1K = $0.25/politician
```

**절감 효과**:

```
Before: $2.50/politician
After:  $0.25/politician

정치인당 절감: $2.25
100명 절감: $225 (90% 절감!)
```

**결론**: ✅ **필수 적용** (Request fee 90% 절감!)

---

### 전략 6: 캐싱 및 중복 제거

```python
# 중복 URL 체크
already_collected = get_collected_urls(politician_id)

# 캐싱
cache = {}
if query in cache:
    return cache[query]

# API 호출 후 캐싱
result = call_perplexity(query)
cache[query] = result
```

**절감 효과**:

```
중복 요청 5-10% 감소

정치인당 절감: $0.20
100명 절감: $20
```

**결론**: ✅ **적용 권장**

---

### 전략 7: 무료 브라우저 자동화 MCP (극단적)

```
비용: $0 (완전 무료)

하지만:
❌ 불안정
❌ 느림
❌ 이용약관 위반 가능성
❌ 프로덕션 비추천
```

**결론**: ❌ **비추천** (신뢰성 문제)

---

## 📈 최종 최적화 시나리오

### 최적화 전 (베이스라인)

```
모델: Sonar Pro
Input: 500 tokens/request
Output: 2,000 tokens/response (제한 없음)
방식: 개별 요청 (500 requests)

정치인당 비용:
- Input: $0.75
- Output: $7.50
- Request: $2.50
Total: $10.75

100명 비용: $1,075
```

### 최적화 후 (추천 시나리오)

```
✅ 전략 1: Sonar 모델 사용
✅ 전략 3: 프롬프트 최적화 (200 tokens)
✅ 전략 4: max_tokens=2000 제한
✅ 전략 5: 배치 요청 (10개씩)
✅ 전략 6: 캐싱 및 중복 제거

정치인당 비용:
- Input: $0.10 (500 → 200 tokens, Sonar 사용)
- Output: $0.75 (2,000 → 1,500 tokens, Sonar 사용)
- Request: $0.25 (500 → 50 requests, 배치 처리)
- 중복 절감: -$0.05
Total: $1.05

100명 비용: $105
```

### 최대 절감 효과

```
Before: $1,075
After:  $105

절감액: $970 (90% 절감!)
최종 비용: $105/100명
```

---

## 🎯 구현 계획

### Phase 1: 즉시 적용 가능 (Day 1)

```python
# collect_v30.py 수정

AI_CONFIGS = {
    'Perplexity': {
        'model': 'sonar',  # ← Sonar Pro → Sonar 변경
        'max_tokens': 2000,  # ← 8000 → 2000 변경
        'batch_size': 10  # ← 새로 추가: 배치 크기
    }
}

def call_perplexity_batch(queries):
    """10개씩 배치로 수집"""
    combined_query = f"다음 {len(queries)}개 주제에 대해 각각 1개씩 데이터를 수집해주세요:\n"
    for i, q in enumerate(queries, 1):
        combined_query += f"{i}. {q}\n"

    response = client.chat.completions.create(
        model='sonar',
        messages=[{"role": "user", "content": combined_query}],
        max_tokens=2000
    )
    return response

# 최적화된 프롬프트
def build_optimized_prompt(politician_name, category, count=10):
    return f"{politician_name} 의원 {category} 데이터 {count}개 (2024-2026, JSON, 제목/URL/날짜/요약)"
```

**예상 절감**: $1,075 → $300 (72% 절감)

---

### Phase 2: 추가 최적화 (Week 1)

```python
# 캐싱 및 중복 제거
cache = {}
collected_urls = set()

def call_perplexity_with_cache(query):
    if query in cache:
        return cache[query]

    result = call_perplexity(query)

    # URL 중복 체크
    unique_items = [
        item for item in result
        if item['url'] not in collected_urls
    ]

    for item in unique_items:
        collected_urls.add(item['url'])

    cache[query] = unique_items
    return unique_items
```

**예상 절감**: $300 → $150 (50% 추가 절감)

---

### Phase 3: 고급 최적화 (Week 2-3)

```python
# 1. 동적 배치 크기 조정
if category in ['expertise', 'leadership']:  # 데이터 많음
    batch_size = 20
else:  # 데이터 적음
    batch_size = 5

# 2. Prompt 템플릿 최소화
PROMPT_TEMPLATE = "{name} {category} {count}개 (2024-2026)"

# 3. Response 파싱 최적화
def parse_compact_json(response):
    # 불필요한 설명 제거, 데이터만 추출
    ...
```

**예상 절감**: $150 → $105 (30% 추가 절감)

---

## 💡 OFFICIAL vs PUBLIC 분담

### 옵션 A: 50-50 (이상적)

```
Gemini: 500개 (OFFICIAL 50% + PUBLIC 50%)
Perplexity: 500개 (OFFICIAL 50% + PUBLIC 50%)

조건:
- Perplexity가 OFFICIAL 데이터를 효과적으로 수집 가능해야 함
- 테스트 필요
```

### 옵션 B: 75-25 (현실적)

```
Gemini: 750개
├── OFFICIAL: 500개 (Google Search → .go.kr 등)
└── PUBLIC: 250개

Perplexity: 250개
└── PUBLIC: 250개 (자체 검색엔진, 독립 크롤링)

이유:
- Gemini는 OFFICIAL 수집에 강점
- Perplexity는 PUBLIC에 특화
- 비용 추가 절감: $105 → $26
```

### 테스트 방법

```python
# test_perplexity_official.py
"""Perplexity의 OFFICIAL 데이터 수집 능력 테스트"""

def test_official_collection():
    queries = [
        "조은희 의원 법안 (assembly.go.kr)",
        "조은희 의원 정부 보도자료 (.go.kr)",
        "조은희 의원 국회 의안정보"
    ]

    for query in queries:
        result = call_perplexity(query)
        official_ratio = count_official_urls(result)
        print(f"{query}: {official_ratio}% OFFICIAL")

    # 70% 이상이면 50-50 가능
    # 50% 이하면 75-25 권장
```

---

## 📊 최종 비용 시나리오 비교

| 시나리오 | Gemini | Perplexity | 총 비용/100명 | 비고 |
|---------|--------|------------|--------------|------|
| **A: 50-50 (최적화 전)** | 500개 (무료) | 500개 ($10.75/명) | **$1,075** | ❌ 비쌈 |
| **B: 50-50 (Phase 1)** | 500개 (무료) | 500개 ($3/명) | **$300** | ⚠️ 보통 |
| **C: 50-50 (Phase 3)** | 500개 (무료) | 500개 ($1.05/명) | **$105** | ✅ 최적 |
| **D: 75-25 (Phase 3)** | 750개 (무료) | 250개 ($1.05/명) | **$26** | ✅ 가장 저렴 |

---

## ✅ 최종 권장사항

### 즉시 실행 (Day 1)

```
1. API 키 갱신
   - 현재 키: 401 에러
   - 새 키 발급 필요

2. 코드 수정 (Phase 1 최적화)
   - Sonar 모델 사용
   - max_tokens=2000 설정
   - 배치 요청 구현 (10개씩)

3. 테스트 (10명)
   - OFFICIAL 수집 능력 확인
   - 비용 실측
   - 품질 검증
```

### 단계별 목표 (1-3주)

```
Week 1:
- Phase 1 적용 → $300/100명 달성
- OFFICIAL 테스트 완료
- 50-50 vs 75-25 결정

Week 2:
- Phase 2 적용 → $150/100명 달성
- 캐싱 및 중복 제거

Week 3:
- Phase 3 적용 → $105/100명 달성
- 본격 배포
```

### 성공 기준

```
✅ 비용: $105/100명 이하 (90% 절감)
✅ 품질: 중복률 5% 이하
✅ 안정성: 에러율 1% 이하
✅ 속도: 1명당 10분 이내
```

---

## 📝 체크리스트

### 비용 최적화 체크리스트

- [ ] Sonar 모델 사용
- [ ] max_tokens=2000 설정
- [ ] 배치 요청 (10개씩)
- [ ] 프롬프트 최적화 (200 tokens 이하)
- [ ] 캐싱 구현
- [ ] 중복 URL 제거
- [ ] OFFICIAL 수집 능력 테스트 완료

### 구현 체크리스트

- [ ] API 키 갱신
- [ ] collect_v30.py 수정
- [ ] test_perplexity_cost.py 작성
- [ ] 10명 테스트 실행
- [ ] 비용 실측 및 검증
- [ ] 50-50 vs 75-25 결정
- [ ] 본격 배포

---

## 🎯 결론

### 핵심 메시지

> **Perplexity 비용을 90% 절감할 수 있습니다!**
>
> $1,075 → $105 (Phase 3 완료 시)

### 실행 계획

```
1. 즉시: API 키 갱신 + Phase 1 적용
2. 1주차: OFFICIAL 테스트 + 50-50/75-25 결정
3. 2-3주차: Phase 2-3 적용 → $105 달성
```

### 성공 확률

```
✅ 기술적 실현 가능성: 95%
✅ 비용 목표 달성 가능성: 90%
✅ 품질 유지 가능성: 85%

종합: ✅ 실행 권장
```

---

**최종 업데이트**: 2026-01-20
**다음 단계**: API 키 갱신 후 Phase 1 구현 시작
