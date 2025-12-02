# 토큰 사용량 최적화 전략 보고서

**작성일**: 2025-12-02
**대상**: 27명 추가 정치인 평가
**현재 시스템**: Pooling System V24 (3 AI, 150 news, 10 categories)

---

## 1. 현재 토큰 사용량 분석

### 1.1 배치당 토큰 구조

**입력 토큰 (Input)**:
- 시스템 프롬프트 (역할/기준/형식): 450 토큰
- 뉴스 데이터 (10개 × 평균 500자): 2,500 토큰
- 카테고리 설명: 300 토큰
- **배치당 입력 합계**: 3,250 토큰

**출력 토큰 (Output)**:
- 10개 뉴스 평가 (rating + rationale): 1,000 토큰
- **배치당 출력 합계**: 1,000 토큰

**배치당 총합**: 4,250 토큰

### 1.2 정치인 1명당 토큰 사용량

```
1명당 총 토큰 계산:
= 4,250 토큰 × 15 배치 × 10 카테고리 × 3 AI
= 4,250 × 450
= 1,912,500 토큰 (약 191만 토큰)
```

### 1.3 27명 추가 평가 시 토큰 사용량

```
27명 총 토큰:
= 1,912,500 × 27
= 51,637,500 토큰 (약 5,164만 토큰)

예상 비용 (GPT-4 기준):
- 입력 토큰: 3,250 × 450 × 27 = 39,487,500 토큰
  비용: 39,487,500 / 1,000,000 × $10 = $395

- 출력 토큰: 1,000 × 450 × 27 = 12,150,000 토큰
  비용: 12,150,000 / 1,000,000 × $30 = $365

총 예상 비용: $760
예상 소요 시간: 약 49시간 (API 호출 450회/명 × 27명)
```

---

## 2. 토큰 최적화 방안

### 방안 0: **DB 뉴스 캐싱** (최우선 전략) 🌟

**개념**: 수집된 뉴스를 DB에 저장하여 재평가 시 수집 비용 제거

#### DB 스키마 설계

```sql
-- 1. 수집된 뉴스 저장 테이블
CREATE TABLE ai_collected_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id TEXT NOT NULL REFERENCES politicians(id),
  ai_source TEXT NOT NULL, -- 'ChatGPT', 'Grok', 'Claude'
  category TEXT NOT NULL,   -- 'Expertise', 'Leadership', etc.
  news_index INTEGER NOT NULL, -- 0-49 (각 AI별 50개)

  news_content TEXT NOT NULL,
  news_metadata JSONB,     -- 원본 메타데이터

  collected_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(politician_id, ai_source, category, news_index)
);

-- 2. AI 평가 결과 캐시 테이블
CREATE TABLE ai_evaluation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID NOT NULL REFERENCES ai_collected_news(id),
  evaluator_ai TEXT NOT NULL, -- 평가한 AI (ChatGPT/Grok/Claude)

  rating TEXT NOT NULL,       -- 'A', 'B', ..., 'H'
  rating_score FLOAT NOT NULL, -- +8, +6, ..., -8

  evaluated_at TIMESTAMP DEFAULT NOW(),
  prompt_version TEXT,        -- 프롬프트 버전 추적

  UNIQUE(news_id, evaluator_ai, prompt_version)
);

-- 인덱스
CREATE INDEX idx_news_politician ON ai_collected_news(politician_id);
CREATE INDEX idx_news_category ON ai_collected_news(politician_id, category);
CREATE INDEX idx_eval_news ON ai_evaluation_cache(news_id);
```

#### 구현 전략

```python
class PoolingSystemWithDB:
    def __init__(self, supabase_client):
        self.supabase = supabase_client
        self.prompt_version = "v24.1"

    def get_or_collect_news(self, politician_id, ai_source, category):
        """뉴스를 DB에서 가져오거나 없으면 수집"""
        # 1. DB에서 기존 뉴스 확인
        cached_news = self.supabase.from_('ai_collected_news') \
            .select('*') \
            .eq('politician_id', politician_id) \
            .eq('ai_source', ai_source) \
            .eq('category', category) \
            .order('news_index') \
            .execute()

        if len(cached_news.data) == 50:
            # 캐시 히트 - 수집 비용 0
            return cached_news.data

        # 2. 캐시 미스 - 뉴스 수집
        news = self.collect_news_from_ai(politician_id, ai_source, category)

        # 3. DB에 저장
        self.save_news_to_db(news, politician_id, ai_source, category)
        return news

    def get_or_evaluate(self, news_id, evaluator_ai):
        """평가 결과를 DB에서 가져오거나 없으면 평가"""
        # 1. DB에서 기존 평가 확인
        cached_eval = self.supabase.from_('ai_evaluation_cache') \
            .select('*') \
            .eq('news_id', news_id) \
            .eq('evaluator_ai', evaluator_ai) \
            .eq('prompt_version', self.prompt_version) \
            .execute()

        if cached_eval.data:
            # 캐시 히트 - 평가 비용 0
            return cached_eval.data[0]

        # 2. 캐시 미스 - AI 평가
        evaluation = self.evaluate_with_ai(news_id, evaluator_ai)

        # 3. DB에 저장
        self.save_evaluation_to_db(evaluation, news_id, evaluator_ai)
        return evaluation
```

#### 이점

**1차 평가 시**:
- 뉴스 수집 비용: 정상 (최초 1회)
- 뉴스를 DB에 저장
- 평가 수행 및 결과 저장

**2차 평가 시 (재평가/프롬프트 변경)**:
- 뉴스 수집 비용: **0원** (DB에서 로드)
- 평가만 수행 (필요 시)
- **수집 비용 100% 절감**

**장점**:
- ✅ 뉴스 재사용으로 수집 API 호출 제거
- ✅ 프롬프트 개선 시 재평가 용이
- ✅ 일부 카테고리만 재평가 가능
- ✅ 증분 평가 가능 (새 정치인 추가 시)
- ✅ 데이터 일관성 보장
- ✅ 분석/검증 용이

**단점**:
- DB 저장 공간 필요 (예상: 27명 × 150뉴스 × 500자 ≈ 2MB)
- 초기 구현 비용

**결론**:
> **27명 평가 시 가장 효과적인 최우선 전략**
> 2회차부터 수집 비용 $0

---

### 방안 1: 프롬프트 압축 (78% 절감)

**현재 프롬프트 (장황한 설명)**:
```
당신은 정치인 평가 전문가입니다.
다음 뉴스 기사들을 읽고 정치인의 [카테고리]에 대해 평가해주세요.

평가 기준은 다음과 같습니다:
1. 매우 긍정적 (A): +8점 - 탁월한 성과를 보인 경우
2. 긍정적 (B): +6점 - 좋은 성과를 보인 경우
3. 다소 긍정적 (C): +4점 - 보통 이상의 성과
...
```
(약 450 토큰)

**최적화 프롬프트 (간결한 지시)**:
```
평가 전문가. 뉴스 기반 정치인 [카테고리] 평가.
등급: A(+8) B(+6) C(+4) D(+2) E(-2) F(-4) G(-6) H(-8)
JSON: {"rating": "등급"}
```
(약 100 토큰)

**절감**: 450 → 100 토큰 (78% 감소)

---

### 방안 2: 뉴스 요약 (60% 절감)

**현재**: 전체 뉴스 전송 (평균 500자)
```
10개 × 500자 = 5,000자 ≈ 2,500 토큰
```

**최적화**: 핵심 문장만 추출 (200자)
```python
def summarize_news(news_text):
    """첫 문장 + 핵심 키워드 추출"""
    sentences = news_text.split('.')
    first_sentence = sentences[0]
    keywords = extract_keywords(news_text)  # NLP 기반
    return f"{first_sentence}. 키워드: {', '.join(keywords)}"

# 예시
# 원본: "김동연 경기도지사가 오늘 기자회견을 열고... (500자)"
# 요약: "김동연 경기도지사가 오늘 기자회견을 열고 경제정책 발표. 키워드: 경제, 정책, 일자리 (100자)"
```

```
10개 × 200자 = 2,000자 ≈ 1,000 토큰
```

**절감**: 2,500 → 1,000 토큰 (60% 감소)

---

### 방안 3: rating_rationale 생략 (80% 절감)

**현재 출력 형식**:
```json
{
  "rating": "A",
  "rating_rationale": "이 뉴스는 정치인의 전문성을 잘 보여줍니다.
                       경제 정책에 대한 깊은 이해와 실행력을 입증하는
                       내용으로, 매우 긍정적으로 평가됩니다..."
}
```
(약 100 토큰/뉴스)

**최적화 출력 형식**:
```json
{
  "rating": "A"
}
```
(약 10 토큰/뉴스)

**절감**: 1,000 → 200 토큰 (80% 감소)

**참고**: rationale은 디버깅/분석용이었으므로 최종 평가에서는 생략 가능

---

### 방안 4: 배치 크기 증가 (12% 절감)

**현재 (배치 10개)**:
```
- 고정 프롬프트: 450 토큰
- 뉴스 데이터: 2,500 토큰
- 배치당 총: 2,950 토큰
- 15 배치 × 2,950 = 44,250 토큰
```

**최적화 (배치 50개)**:
```
- 고정 프롬프트: 450 토큰 (동일)
- 뉴스 데이터: 12,500 토큰 (5배)
- 배치당 총: 12,950 토큰
- 3 배치 × 12,950 = 38,850 토큰
```

**절감**: 44,250 → 38,850 (12% 감소)

**원리**: 고정 비용(프롬프트)을 더 많은 뉴스에 분산

---

### 방안 5: 샘플링 (80% 절감)

**현재**: 150개 뉴스 전체 평가

**최적화**: 30개 뉴스 샘플링 (20%)
```
- 각 AI별 50개 중 10개 샘플링
- 10개 × 3 AI = 30개 뉴스
```

**절감**: 1,912,500 → 382,500 토큰 (80% 감소)

**검증 필요**:
- 30개로도 순위 일치도 유지되는지 확인
- Spearman ρ > 0.9 유지 시 채택
- 3명 데이터로 사전 검증 가능

---

## 3. 최적 조합 시나리오

### 시나리오 A: DB 캐싱 단독 (추천 🌟)

**전략**: 뉴스를 DB에 저장하여 재평가 시 수집 비용 제거

**1차 평가 비용**:
- 수집 + 평가: $760 (현재와 동일)
- 뉴스 DB 저장 (자동)

**2차 평가 비용** (프롬프트 개선/재평가):
- 수집: $0 (DB에서 로드)
- 평가: $760
- **수집 비용 100% 절감**

**3차 평가 비용**:
- 수집: $0
- 평가: $0 (평가 결과도 캐시됨)
- **전체 비용 100% 절감**

**장점**:
- ✅ 코드 변경 최소
- ✅ 데이터 재사용
- ✅ 일관성 보장
- ✅ 증분 평가 가능

---

### 시나리오 B: 즉시 실행 조합 (방안 3 + 4)

**전략**: 코드 2줄 수정으로 즉시 적용

**적용**:
1. `rating_rationale` 제거 (1줄)
2. `BATCH_SIZE = 50` (1줄)

**효과**:
```
배치당 토큰:
- 입력: 3,250 토큰 (동일)
- 출력: 200 토큰 (1,000 → 200, 80% 감소)
- 합계: 3,450 토큰

1명당 총 토큰:
= 3,450 × 3 배치 × 10 카테고리 × 3 AI
= 3,450 × 90
= 310,500 토큰

27명 추가:
= 310,500 × 27
= 8,383,500 토큰

비용:
- 입력: 3,250 × 90 × 27 / 1,000,000 × $10 = $79
- 출력: 200 × 90 × 27 / 1,000,000 × $30 = $15
- 총: $94

절감:
- 토큰: 51,637,500 → 8,383,500 (84% 감소)
- 비용: $760 → $94 (88% 감소)
```

**장점**:
- ✅ 즉시 적용 가능 (5분)
- ✅ 코드 변경 최소
- ✅ 리스크 없음

---

### 시나리오 C: 단기 실행 조합 (방안 1 + 2 + 3 + 4)

**전략**: 프롬프트 재작성 및 뉴스 요약 추가

**적용**:
1. 프롬프트 압축: 450 → 100 토큰
2. 뉴스 요약: 2,500 → 1,000 토큰
3. rationale 생략: 1,000 → 200 토큰
4. 배치 크기 50개

**효과**:
```
배치당 토큰 (50개 뉴스):
- 입력: 100 + (1,000 × 5) = 5,100 토큰
- 출력: 200 × 5 = 1,000 토큰
- 합계: 6,100 토큰

1명당 총 토큰:
= 6,100 × 3 배치 × 10 카테고리 × 3 AI
= 6,100 × 90
= 549,000 토큰

27명 추가:
= 549,000 × 27
= 14,823,000 토큰

비용:
- 입력: 5,100 × 90 × 27 / 1,000,000 × $10 = $124
- 출력: 1,000 × 90 × 27 / 1,000,000 × $30 = $73
- 총: $197

절감:
- 토큰: 51,637,500 → 14,823,000 (71% 감소)
- 비용: $760 → $197 (74% 감소)
```

**소요 시간**: 1-2일 (프롬프트 재작성 + 요약 함수)

---

### 시나리오 D: 최대 절감 조합 (방안 1 + 2 + 3 + 4 + 5)

**전략**: 모든 최적화 + 샘플링

**적용**: 시나리오 C + 30개 샘플링

**효과**:
```
1명당 총 토큰:
= 549,000 × 20% (샘플링)
= 109,800 토큰

27명 추가:
= 109,800 × 27
= 2,964,600 토큰

비용:
= $197 × 20%
= $39

절감:
- 토큰: 51,637,500 → 2,964,600 (94% 감소)
- 비용: $760 → $39 (95% 감소)
- 시간: 49시간 → 2시간 (96% 감소)
```

**검증 필요**: 샘플링 후에도 순위 일치도(ρ > 0.9) 유지 확인

---

## 4. 우선순위별 실행 계획

### Phase 0: DB 캐싱 구현 (최우선, 1-2일) 🌟

**작업**:
1. DB 스키마 생성 (2개 테이블)
2. 뉴스 수집 + DB 저장 로직 구현
3. 평가 + DB 캐싱 로직 구현

**효과**:
- 1차 평가: 비용 동일
- 2차 평가부터: **수집 비용 $0**
- 장기적으로 가장 큰 절감 효과

**코드 예시**:
```python
# 1. 뉴스 수집 및 저장
def collect_and_cache_news(politician_id, ai_source, category):
    # DB 확인
    cached = get_cached_news(politician_id, ai_source, category)
    if cached:
        return cached

    # 수집
    news = collect_news_from_ai(politician_id, ai_source, category)

    # DB 저장
    save_news_to_db(news)
    return news

# 2. 평가 및 캐싱
def evaluate_and_cache(news_id, evaluator_ai):
    # 캐시 확인
    cached_eval = get_cached_evaluation(news_id, evaluator_ai)
    if cached_eval:
        return cached_eval

    # 평가
    evaluation = evaluate_with_ai(news_id, evaluator_ai)

    # 캐시 저장
    save_evaluation_to_db(evaluation)
    return evaluation
```

---

### Phase 1: 즉시 실행 (5분)

**작업**:
1. `rating_rationale` 제거
   ```python
   # 변경 전
   output_format = {"rating": "A-H", "rating_rationale": "이유"}

   # 변경 후
   output_format = {"rating": "A-H"}
   ```

2. 배치 크기 증가
   ```python
   # 변경 전
   BATCH_SIZE = 10

   # 변경 후
   BATCH_SIZE = 50
   ```

**효과**: 88% 비용 절감 ($760 → $94)

---

### Phase 2: 단기 실행 (1-2일)

**작업**:
1. 프롬프트 압축 (프롬프트 재작성)
2. 뉴스 요약 함수 구현
   ```python
   def summarize_news(news_text):
       sentences = news_text.split('.')
       first = sentences[0]
       keywords = extract_keywords(news_text)
       return f"{first}. {keywords}"
   ```

**효과**: 74% 비용 절감 ($760 → $197)

---

### Phase 3: 검증 후 실행 (3-4일)

**작업**:
1. 샘플링 검증 (3명 데이터로)
   - 150개 vs 30개 순위 일치도 비교
   - Spearman ρ 계산

2. ρ > 0.9 확인 시 적용

**효과**: 95% 비용 절감 ($760 → $39)

---

## 5. 권장 전략

### 최종 권장: **DB 캐싱 (Phase 0) + 즉시 실행 (Phase 1)**

**이유**:
1. **DB 캐싱**으로 장기적 비용 제거 (재평가 시 100% 절감)
2. **즉시 실행**으로 단기 비용 88% 절감
3. 코드 변경 최소 (리스크 최소)
4. 검증 없이 안전하게 적용 가능

**효과**:
- 1차 평가: $94 (88% 절감)
- 2차 평가: $0 (DB에서 뉴스 로드)
- 3차 평가: $0 (평가 결과도 캐시)

**구현 순서**:
1. DB 스키마 생성 (10분)
2. DB 저장/로드 로직 구현 (1-2일)
3. `BATCH_SIZE = 50`, `rationale` 제거 (5분)
4. 테스트 (1명 정치인으로 검증)
5. 27명 전체 적용

---

## 6. 비용 비교 요약

| 시나리오 | 토큰 | 비용 | 절감율 | 구현 시간 |
|---------|------|------|--------|----------|
| **현재** | 51.6M | $760 | - | - |
| **DB 캐싱 (2회차)** | 0M | $0 | 100% | 1-2일 |
| **즉시 실행** | 8.4M | $94 | 88% | 5분 |
| **단기 실행** | 14.8M | $197 | 74% | 1-2일 |
| **최대 절감** | 3.0M | $39 | 95% | 3-4일 |
| **🌟 권장 (DB+즉시)** | 8.4M (1차), 0M (2차+) | $94 (1차), $0 (2차+) | 88% (1차), 100% (2차+) | 1-2일 |

---

## 7. 결론

### 핵심 제안

1. **최우선**: DB 뉴스 캐싱 구현 (1-2일)
   - 재평가 시 수집 비용 100% 절감
   - 데이터 일관성 및 재사용성 확보
   - 증분 평가 및 프롬프트 개선 용이

2. **즉시 적용**: `BATCH_SIZE = 50`, `rationale` 제거 (5분)
   - 88% 비용 절감 ($760 → $94)
   - 리스크 없음

3. **선택 사항**: 프롬프트 압축 + 뉴스 요약 (1-2일)
   - 추가 절감 ($94 → $39)
   - 샘플링 검증 필요

### 최종 권장 전략

> **DB 캐싱 + 즉시 실행 조합**
>
> - 1차 평가: $94 (88% 절감)
> - 2차 평가 이후: $0 (100% 절감)
> - 구현 시간: 1-2일
> - 리스크: 최소
> - 장기 효과: 최대

---

**작성**: Claude Code
**검토**: 필요 시 샘플링 검증 추가
