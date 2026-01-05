# V26.0 멀티AI 구현 계획

**작성일**: 2026-01-04
**버전**: V26.0
**이전 버전**: V25.0

---

## 1. 개요

### 1.1 V25.0 → V26.0 변경사항

| 항목 | V25.0 | V26.0 |
|------|-------|-------|
| AI 개수 | 3개 | **4개** |
| 참여 AI | Claude, ChatGPT, Grok | Claude, ChatGPT, Grok, **Gemini** |
| 데이터 풀 크기 | 150개/카테고리 | **200개/카테고리** |

### 1.2 Gemini 추가 이유

1. **시장 점유율**: Google의 주력 AI 모델로 급성장
2. **객관성 확보**: 4개 AI 교차검증으로 편향 최소화
3. **비용 효율**: Gemini 2.0 Flash는 빠르고 저렴
4. **신뢰도 향상**: 다양한 출처의 AI 평가로 설득력 증가

---

## 2. 4개 AI 모델 상세

### 2.1 Claude (Anthropic)

```python
# 모델 설정
MODEL = "claude-3-5-haiku-20241022"
AI_NAME = "Claude"  # DB 저장용

# API 설정
import anthropic
client = anthropic.Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

response = client.messages.create(
    model=MODEL,
    max_tokens=8000,
    temperature=1.0,
    messages=[{"role": "user", "content": prompt}]
)
```

**특징:**
- 균형잡힌 평가 (긍정/부정 균등)
- 기존 시스템에서 검증됨
- 안정적인 JSON 출력

### 2.2 ChatGPT (OpenAI)

```python
# 모델 설정
MODEL = "gpt-4o-mini"
AI_NAME = "ChatGPT"  # DB 저장용

# API 설정
from openai import OpenAI
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

response = client.chat.completions.create(
    model=MODEL,
    max_tokens=8000,
    temperature=1.0,
    messages=[{"role": "user", "content": prompt}]
)
```

**특징:**
- 보수적 평가 경향
- 상세한 rationale 제공
- 널리 검증된 모델

### 2.3 Grok (X.AI)

```python
# 모델 설정
MODEL = "grok-3-mini"
AI_NAME = "Grok"  # DB 저장용

# API 설정
import xai
client = xai.Client(api_key=os.getenv('XAI_API_KEY'))

response = client.chat.completions.create(
    model=MODEL,
    max_tokens=8000,
    temperature=1.0,
    messages=[{"role": "user", "content": prompt}]
)
```

**특징:**
- 현실감 있는 평가
- X(Twitter) 데이터 활용 가능성
- 신선한 관점 제공

### 2.4 Gemini (Google) - 신규

```python
# 모델 설정
MODEL = "gemini-2.0-flash"
AI_NAME = "Gemini"  # DB 저장용

# API 설정
import google.generativeai as genai
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

model = genai.GenerativeModel(MODEL)

response = model.generate_content(
    prompt,
    generation_config={
        'temperature': 1.0,
        'max_output_tokens': 8000,
    }
)
```

**특징:**
- Google 검색 데이터 활용
- 빠른 처리 속도
- 비용 효율적

---

## 3. API 비용 분석

### 3.1 모델별 비용 (2026년 1월 기준)

| AI | 모델 | Input (1M tokens) | Output (1M tokens) |
|----|------|-------------------|-------------------|
| Claude | claude-3-5-haiku | $0.25 | $1.25 |
| ChatGPT | gpt-4o-mini | $0.15 | $0.60 |
| Grok | grok-3-mini | $0.30 | $0.50 |
| Gemini | gemini-2.0-flash | $0.10 | $0.40 |

### 3.2 정치인 1명 예상 비용

```
1명 = 10개 카테고리 × 4번 API 호출 × 4개 AI
    = 160번 API 호출

예상 토큰 사용량 (1명당):
- Input: ~500K tokens
- Output: ~200K tokens

예상 비용:
- Claude: $0.38
- ChatGPT: $0.20
- Grok: $0.25
- Gemini: $0.13
──────────────────
총합: $0.96/정치인
```

### 3.3 전체 비용 추정

```
30명 정치인 × $0.96 = $28.80

풀링 시스템 적용 시 (50% 절감):
30명 × $0.96 × 0.5 = $14.40
```

---

## 4. 데이터 풀링 시스템

### 4.1 풀링 핵심 원칙

```
┌─────────────────────────────────────────────────────────────┐
│              풀링 = "모두가 찾은 것을 각자가 평가"             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [1단계: 수집] - rating 없이 뉴스만 수집                      │
│                                                             │
│  Claude ──→ 50개 ─┐                                         │
│  ChatGPT ──→ 50개 ─┼──→ 200개 풀 (카테고리당)               │
│  Grok ──→ 50개 ───┤    - 중복 제거 안 함                    │
│  Gemini ──→ 50개 ─┘    - 가중치 계산 안 함                  │
│                        - 그냥 있는 그대로 합침               │
│                                                             │
│  [2단계: 평가] - 200개 풀 전체를 각 AI가 독립 평가            │
│                                                             │
│  200개 풀 ──→ Claude가 200개 평가                           │
│          ──→ ChatGPT가 200개 평가                           │
│          ──→ Grok가 200개 평가                              │
│          ──→ Gemini가 200개 평가                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 자연스러운 가중치 효과

```
중복 뉴스가 있으면 자연스럽게 가중치가 반영됨:

예시: "오세훈 예산안 통과" 뉴스를 4개 AI가 모두 수집한 경우
- Claude 수집 → 풀에 1번 포함
- ChatGPT 수집 → 풀에 1번 포함
- Grok 수집 → 풀에 1번 포함
- Gemini 수집 → 풀에 1번 포함
────────────────────────────────
풀에 4번 포함 → 평균 계산 시 자연스럽게 4배 영향

→ 중요한 뉴스(여러 AI가 공통 발견)일수록 더 큰 영향력
→ 별도 중복 탐지, 가중치 계산 불필요
```

---

## 5. 점수 계산 (풀링 방식)

### 5.1 풀링 기반 점수 계산

```python
# 풀링 방식: 200개 데이터에 대해 4개 AI가 각각 평가
# 각 AI의 200개 rating을 기반으로 점수 계산

for ai_name in ['Claude', 'ChatGPT', 'Grok', 'Gemini']:
    for category in CATEGORIES:
        # 해당 AI가 200개 풀 전체에 대해 평가한 rating
        ratings = get_ratings(politician_id, ai_name, category)
        # 200개 rating (풀 전체에 대한 평가)

        avg_rating = sum(ratings) / len(ratings)
        category_score = (6.0 + avg_rating * 0.5) * 10

    # 10개 카테고리 합산
    total_score = sum(category_scores)
    grade = get_grade(total_score)

    # ai_final_scores 테이블에 저장
    save_ai_final_score(politician_id, ai_name, total_score, grade)
```

### 5.2 종합 점수 (4개 AI 평균)

```python
# 4개 AI 점수 평균
ai_scores = get_all_ai_scores(politician_id)
# [755 (Claude), 742 (ChatGPT), 768 (Grok), 751 (Gemini)]

avg_score = sum(ai_scores) / 4
# (755 + 742 + 768 + 751) / 4 = 754

final_grade = get_grade(avg_score)
# 754 → E (Emerald, 양호)

# ai_evaluations 테이블에 저장
save_ai_evaluation(politician_id, ai_count=4, avg_score=754, grade='E')
```

---

## 6. DB 스키마

### 6.1 collected_data (기존 + Gemini)

```sql
-- ai_name 값에 'Gemini' 추가
-- 기존 스키마 변경 없음, 값만 추가

INSERT INTO collected_data (
    politician_id,
    ai_name,  -- 'Claude', 'ChatGPT', 'Grok', 'Gemini'
    category_name,
    item_num,
    data_title,
    data_content,
    data_source,
    source_url,
    rating,
    rating_rationale,
    source_type,
    collection_date
) VALUES (...);
```

### 6.2 ai_category_scores

```sql
-- 기존 스키마 유지
-- ai_name에 'Gemini' 추가

SELECT * FROM ai_category_scores
WHERE politician_id = '62e7b453'
ORDER BY ai_name, category_name;

-- 결과:
-- ai_name | category_name | category_score
-- Claude  | Expertise     | 78
-- ChatGPT | Expertise     | 75
-- Grok    | Expertise     | 80
-- Gemini  | Expertise     | 76  -- 신규
```

### 6.3 ai_final_scores

```sql
-- 기존 스키마 유지
-- ai_name에 'Gemini' 추가

SELECT * FROM ai_final_scores
WHERE politician_id = '62e7b453';

-- 결과:
-- ai_name | total_score | grade_code
-- Claude  | 755         | B
-- ChatGPT | 742         | P
-- Grok    | 768         | B
-- Gemini  | 751         | B  -- 신규
```

### 6.4 ai_evaluations (종합)

```sql
-- ai_count: 3 → 4 변경

SELECT * FROM ai_evaluations
WHERE politician_id = '62e7b453';

-- 결과:
-- ai_count | avg_score | grade_code
-- 4        | 754       | B
```

---

## 7. 실행 스크립트

### 7.1 개별 AI 수집

```bash
# Claude
python collect_v26_claude.py --politician_id=62e7b453 --politician_name="오세훈"

# ChatGPT
python collect_v26_chatgpt.py --politician_id=62e7b453 --politician_name="오세훈"

# Grok
python collect_v26_grok.py --politician_id=62e7b453 --politician_name="오세훈"

# Gemini (신규)
python collect_v26_gemini.py --politician_id=62e7b453 --politician_name="오세훈"
```

### 7.2 전체 AI 일괄 수집

```bash
# 4개 AI 순차 실행
python collect_v26_all.py --politician_id=62e7b453 --politician_name="오세훈"

# 4개 AI 병렬 실행 (빠름)
python collect_v26_all.py --politician_id=62e7b453 --politician_name="오세훈" --parallel
```

### 7.3 점수 계산

```bash
# 개별 AI 점수 계산
python calculate_v26_ai_scores.py --politician_id=62e7b453

# 종합 점수 계산
python calculate_v26_final.py --politician_id=62e7b453

# 전체 정치인 점수 계산
python calculate_v26_all.py
```

### 7.4 비교 분석

```bash
# 4개 AI 점수 비교
python compare_ai_scores_v26.py --politician_id=62e7b453

# AI 간 상관계수 분석
python analyze_ai_correlation_v26.py

# 순위 일치도 분석
python analyze_rank_correlation_v26.py
```

---

## 8. 검증 기준

### 8.1 AI 간 일치도

```
목표:
- Spearman 순위 상관계수: ρ > 0.8
- Pearson 점수 상관계수: r > 0.7
- p-value < 0.05 (통계적 유의)

경고 기준:
- 순위 상관계수 < 0.6 → AI 간 불일치 분석 필요
- 특정 AI만 극단적 점수 → 해당 AI 데이터 검토
```

### 8.2 데이터 품질

```
카테고리별 확인:
- [ ] 50개 수집 완료
- [ ] OFFICIAL 25개 / PUBLIC 25개
- [ ] 부정 주제 최소 10개 (20%)
- [ ] 기간 제한 준수 (OFFICIAL 4년, PUBLIC 1년)
- [ ] rating 알파벳 저장

AI별 확인:
- [ ] 4개 AI 모두 수집 완료
- [ ] 극단적 편향 없음
- [ ] JSON 파싱 오류 없음
```

---

## 9. 예상 결과

### 9.1 순위 일치도 향상

```
V25.0 (3개 AI):
- 종합 순위 일치: ρ = 1.0 (테스트 3명 기준)

V26.0 (4개 AI) 예상:
- 종합 순위 일치: ρ > 0.95
- 더 많은 AI → 더 안정적인 순위
- 이상치 AI 영향 희석
```

### 9.2 신뢰도 향상

```
3개 AI 동의 시: "3개 중 3개 동의" (100%)
4개 AI 동의 시: "4개 중 4개 동의" (100%)
4개 AI 중 3개 동의 시: "4개 중 3개 동의" (75%)

→ 더 세분화된 신뢰도 표시 가능
→ 사용자에게 더 투명한 정보 제공
```

---

## 10. 마이그레이션 계획

### 10.1 단계별 전환

```
Phase 1: Gemini 추가 (즉시)
- collect_v26_gemini.py 작성
- 기존 정치인 Gemini 데이터 추가 수집
- 점수 재계산 (4개 AI 평균)

Phase 2: 신규 정치인 (이후)
- 신규 정치인은 처음부터 4개 AI 수집
- V26.0 기간 제한 적용

Phase 3: 기존 데이터 재수집 (선택)
- 필요시 기존 정치인 전체 재수집
- V26.0 기간 제한 적용
```

### 10.2 데이터 호환성

```
기존 V24.0/V25.0 데이터:
- 삭제하지 않음
- ai_name으로 구분 가능
- 비교 분석 시 버전 명시

새 V26.0 데이터:
- Gemini 추가
- 기간 제한 적용됨
- 별도 분석 가능
```

---

**최종 업데이트**: 2026-01-04
**버전**: V26.0
