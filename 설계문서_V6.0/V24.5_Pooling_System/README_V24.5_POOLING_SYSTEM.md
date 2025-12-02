# V24.5 Pooling System 설명서

**버전**: V24.5
**작성일**: 2025-12-02
**방식**: 멀티 AI Pooling System (Cross-Evaluation)

---

## 1. V24.5 Pooling System이란?

**V24 (기본 방식)**과 **V24.5 (Pooling System)**의 차이:

### V24 기본 방식
```
뉴스 수집:
- ChatGPT: 50개 수집
- Grok: 50개 수집
- Claude: 50개 수집

평가:
- ChatGPT: 자기가 수집한 50개만 평가
- Grok: 자기가 수집한 50개만 평가
- Claude: 자기가 수집한 50개만 평가

결과:
- 각 AI가 자기 뉴스만 평가 (Self-Evaluation)
- 총 150개 평가 (50 + 50 + 50)
```

### V24.5 Pooling System
```
뉴스 수집:
- ChatGPT: 50개 수집
- Grok: 50개 수집
- Claude: 50개 수집
- 총 150개 뉴스 Pool 생성

평가 (Cross-Evaluation):
- ChatGPT: 150개 전체 평가
- Grok: 150개 전체 평가
- Claude: 150개 전체 평가

결과:
- 각 뉴스를 3개 AI가 모두 평가 (Cross-Evaluation)
- 총 450개 평가 (150 × 3)
```

---

## 2. 핵심 특징

### 2.1 Cross-Evaluation (교차 평가)

**개념**:
- 각 AI가 수집한 뉴스를 다른 AI들도 평가
- 같은 뉴스에 대해 3가지 관점 확보

**효과**:
- AI 편향(Bias) 감소
- 평가 신뢰도 향상
- 순위 일치도(Spearman ρ) 향상

### 2.2 데이터 구조

**뉴스 Pool**:
```
150개 뉴스 = ChatGPT 50개 + Grok 50개 + Claude 50개
```

**평가 Matrix**:
```
           | 뉴스1 | 뉴스2 | ... | 뉴스150 |
-----------|-------|-------|-----|---------|
ChatGPT    |   A   |   B   | ... |    C    |
Grok       |   B   |   A   | ... |    B    |
Claude     |   B   |   C   | ... |    D    |
```

### 2.3 점수 계산

**각 뉴스의 최종 점수**:
```
뉴스1 점수 = (ChatGPT 평가 + Grok 평가 + Claude 평가) / 3
```

**카테고리 점수** (예: Expertise):
```
Expertise 점수 = Σ(150개 뉴스 점수) / 150
```

---

## 3. 작동 프로세스

### 3.1 뉴스 수집 단계

```python
# 1. 3개 AI가 각자 50개 수집
chatgpt_news = collect_from_chatgpt(politician, category, count=50)
grok_news = collect_from_grok(politician, category, count=50)
claude_news = collect_from_claude(politician, category, count=50)

# 2. Pool 생성 (150개)
news_pool = chatgpt_news + grok_news + claude_news
```

**저장**:
- `collected_news_{정치인}.json`
- 각 정치인별 3 AI × 50개 = 150개 뉴스

### 3.2 평가 단계 (Batch 처리)

```python
# Batch 크기: 10개
BATCH_SIZE = 10

for batch in split_into_batches(news_pool, BATCH_SIZE):
    # 각 AI가 10개 뉴스 평가
    chatgpt_ratings = chatgpt_api.evaluate(batch)
    grok_ratings = grok_api.evaluate(batch)
    claude_ratings = claude_api.evaluate(batch)
```

**배치 수**:
- 150개 뉴스 ÷ 10개/배치 = 15배치
- 15배치 × 3 AI = 45번 API 호출 (카테고리당)
- 10 카테고리 × 45 = 450번 API 호출 (정치인당)

### 3.3 점수 계산 및 저장

```python
# 1. 카테고리별 점수 계산
category_scores = {
    'ChatGPT': calculate_score(chatgpt_ratings),
    'Grok': calculate_score(grok_ratings),
    'Claude': calculate_score(claude_ratings)
}

# 2. 최종 점수
final_score = (category_scores['ChatGPT'] +
               category_scores['Grok'] +
               category_scores['Claude']) / 3

# 3. 저장
save_to_json('pooling_batch_summary_{politician}.json')
```

---

## 4. 데이터 파일 구조

### 4.1 입력 파일

**`collected_news_{정치인}.json`**:
```json
{
  "Expertise": [
    {
      "source": "ChatGPT",
      "index": 0,
      "content": "뉴스 내용..."
    },
    ...
    // 150개 뉴스 (ChatGPT 50 + Grok 50 + Claude 50)
  ],
  "Leadership": [ ... ],
  ...
}
```

### 4.2 출력 파일

**`pooling_batch_summary_{정치인}.json`**:
```json
{
  "politician_name": "김동연",
  "results": [
    {
      "category_eng": "Expertise",
      "category_kor": "전문성",
      "scores": {
        "ChatGPT": {
          "positive": 95,
          "negative": 55,
          "category_score": 81.56
        },
        "Grok": {
          "positive": 94,
          "negative": 56,
          "category_score": 81.33
        },
        "Claude": {
          "positive": 92,
          "negative": 58,
          "category_score": 79.67
        }
      },
      "final_score": 80.85
    },
    ...
    // 10개 카테고리
  ],
  "overall_scores": {
    "chatgpt_average": 82.58,
    "grok_average": 82.41,
    "claude_average": 79.41,
    "final_average": 81.47
  }
}
```

---

## 5. 실행 스크립트

### 5.1 메인 스크립트

**`pooling_batch_evaluation.py`**:
- 1명 정치인의 Pooling 평가 전체 실행
- 10 카테고리 × 450번 API 호출

**실행 방법**:
```bash
python pooling_batch_evaluation.py
```

### 5.2 분석 스크립트

**`final_correlation_analysis.py`**:
- Spearman 순위 상관계수 계산
- 종합 점수 순위 분석
- 카테고리별 순위 분석
- ICC 계산

**`analyze_claude_bias_detail.py`**:
- Claude의 평가 패턴 분석
- AI 간 점수 차이 분석

**`compare_claude_bias.py`**:
- 3명 정치인 간 Claude 패턴 비교

---

## 6. 주요 결과

### 6.1 3명 정치인 평가 완료

| 정치인 | ChatGPT | Grok | Claude | 최종 평균 | 순위 |
|--------|---------|------|--------|-----------|------|
| 김동연 | 82.58   | 82.41| 79.41  | 81.47     | 1    |
| 오세훈 | 79.58   | 79.51| 76.53  | 78.54     | 2    |
| 한동훈 | 76.48   | 77.12| 73.48  | 75.69     | 3    |

### 6.2 순위 일치도

**종합 점수 순위 (Spearman ρ)**:
- ChatGPT vs Grok: 1.0000 (완벽 일치)
- ChatGPT vs Claude: 1.0000 (완벽 일치)
- Grok vs Claude: 1.0000 (완벽 일치)
- **평균: 1.0000 (100% 일치)**

**카테고리별 순위 (Spearman ρ)**:
- ChatGPT vs Grok: 0.6333
- ChatGPT vs Claude: 0.5667
- Grok vs Claude: 0.7000
- **평균: 0.6333 (63.3% 일치)**

### 6.3 Claude의 체계적 편향 (Systematic Bias)

Claude가 일관되게 약 3점 낮게 평가:
- 김동연: -3.17점
- 오세훈: -2.63점
- 한동훈: -3.04점

**해석**:
- 일관된 차이이므로 순위에는 영향 없음
- 순위 일치도 100% 유지
- 평가 기준이 더 엄격한 것으로 판단

---

## 7. V24 vs V24.5 비교

| 항목 | V24 기본 | V24.5 Pooling |
|------|----------|---------------|
| 뉴스 수집 | 3 AI × 50개 | 3 AI × 50개 (동일) |
| 평가 방식 | Self-Evaluation | Cross-Evaluation |
| 평가 횟수 | 150개 (50×3) | 450개 (150×3) |
| API 호출 | 150회 | 450회 |
| 비용 | 낮음 | 높음 (3배) |
| 신뢰도 | 보통 | 높음 |
| 순위 일치도 | 보통 | 높음 (ρ=1.0) |
| DB 저장 | O | X (JSON만) |

---

## 8. 향후 개선 방향

### 8.1 DB 저장 구조

**필요한 테이블**:
```sql
CREATE TABLE ai_pooling_scores (
  politician_id TEXT,
  category TEXT,
  chatgpt_score FLOAT,
  grok_score FLOAT,
  claude_score FLOAT,
  final_score FLOAT,
  prompt_version TEXT,
  evaluated_at TIMESTAMP
);
```

### 8.2 토큰 최적화

**방안 1**: `BATCH_SIZE` 증가 (10 → 50)
- 고정 프롬프트 비용 분산
- 12% 토큰 절감

**방안 2**: `rating_rationale` 제거
- 출력 토큰 80% 감소
- 즉시 적용 가능

**방안 3**: 프롬프트 압축
- 450 토큰 → 100 토큰
- 78% 프롬프트 절감

**종합 효과**: 88% 비용 절감 가능

---

## 9. 관련 문서

- `POOLING_SYSTEM_RANK_CORRELATION_REPORT.md` - 순위 상관계수 분석 보고서
- `TOKEN_OPTIMIZATION_REPORT.md` - 토큰 최적화 전략
- `V24_점수계산_알고리즘_상세가이드.md` - 점수 계산 방법

---

**작성**: Claude Code
**최종 업데이트**: 2025-12-02
