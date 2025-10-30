# 단계별 평가점수 산출 알고리즘 (Prior 7.0)

**공식 명칭**: Bayesian Weighted Average Method with Prior 7.0
**한글 명칭**: 베이지안 가중 평균 방식 (Prior 7.0)
**버전**: 7.0
**작성일**: 2025-10-30
**기반**: Hierarchical Linear Evaluation Method with Bayesian Prior

---

## 📋 목차

1. [개요](#개요)
2. [핵심 원리](#핵심-원리)
3. [1단계: 데이터 수집 및 평가](#1단계-데이터-수집-및-평가)
4. [2단계: 항목 점수 계산](#2단계-항목-점수-계산)
5. [3단계: 분야 점수 계산](#3단계-분야-점수-계산)
6. [4단계: 최종 점수 계산](#4단계-최종-점수-계산)
7. [완전한 계산 예시](#완전한-계산-예시)
8. [Python 코드](#python-코드)
9. [SQL 코드](#sql-코드)

---

## 개요

### 평가 체계

```
100개 항목 = 10개 분야 × 10개 항목
  ↓
각 항목당 여러 개 데이터 수집 (목표: 10개)
  ↓
AI가 각 데이터를 -10 ~ +10 점수로 평가
  ↓
Bayesian Weighted Average로 항목 점수 계산
  ↓
분야 점수 = 10개 항목 점수의 평균
  ↓
최종 점수 = 10개 분야 점수의 합계 × 10 (400~1000점, 정수)
```

### 최종 점수 범위

- **항목 점수 범위**: 4.0 ~ 10.0점 (Range Restriction 적용)
- **분야 점수 범위**: 4.0 ~ 10.0점 (항목 평균)
- **최종 점수 최소**: 400점 (모든 항목이 4.0점일 때: 4.0 × 10개 분야 × 10)
- **Prior 기준**: 700점 (데이터 없을 때: 7.0 × 10개 분야 × 10)
- **최종 점수 최대**: 1000점 (모든 항목이 10.0점일 때: 10.0 × 10개 분야 × 10)

---

## 핵심 원리

### Bayesian Prior 7.0

**Prior Score = 7.0**: 선출직 정치인에 대한 기본 신뢰

- "선거를 통과한 사람은 기본적으로 양호 수준(70점)이다"
- 민주주의 원칙: 시민이 뽑은 사람에 대한 긍정적 평가
- 민주적 정당성: 당선은 시민의 신임을 받았다는 증거

### Bayesian Weighted Average 공식

```
항목 점수 = (AI평균 × N + Prior × W) / (N + W)

여기서:
- AI평균 = 데이터 평균 점수 (-10 ~ +10)
- N = 데이터 개수
- Prior = 7.0
- W = 10 (Prior Weight)
```

### Prior 영향도

| 데이터 개수 | Prior 영향도 | AI 영향도 | 효과 |
|------------|-------------|-----------|------|
| **0개** | 100% | 0% | Prior = 7.0점 (70점) |
| **5개** | 67% | 33% | Prior 강하게 작용 (극단값 방지) |
| **10개** | 50% | 50% | Prior와 AI 균형 |
| **20개** | 33% | 67% | AI 더 강하게 작용 |
| **30개 이상** | <25% | >75% | AI 평가 거의 그대로 (객관성) |

---

## 1단계: 데이터 수집 및 평가

### 1-1. AI 데이터 수집

5개 AI 엔진이 각각 데이터를 수집합니다:
- Claude
- ChatGPT
- Gemini
- Perplexity
- X AI (Grok)

### 1-2. AI 평가 척도

각 데이터를 **-10 ~ +10** 점수로 평가:

```
+10: 매우 우수 (탁월한 성과)
+8~+9: 우수
+6~+7: 양호
+3~+5: 보통 이상
+1~+2: 약간 긍정적
 0: 중립
-1~-2: 약간 부정적
-3~-5: 보통 이하
-6~-7: 미흡
-8~-9: 부족
-10: 매우 부족 (심각한 문제)
```

### 1-3. 데이터 형식

```json
{
  "title": "데이터 제목",
  "content": "데이터 상세 내용",
  "score": 8.5,
  "source": "출처",
  "ai_engine": "Claude"
}
```

### 예시: 항목 1-1 (부패 신고 건수)

```
데이터 1: +4점 (부패신고 15% 감소)
데이터 2: +3점 (청렴도 평가 상승)
데이터 3: +4점 (감사원 지적 없음)
데이터 4: +4점 (투명성 강화 정책)
데이터 5: +3점 (시민 만족도 높음)
데이터 6: +3점 (비리 의혹 없음)
데이터 7: +4점 (윤리 위반 기록 없음)
데이터 8: +3점 (재산 신고 투명)
데이터 9: +4점 (청렴 서약 이행)
데이터 10: +3점 (공금 사용 적정)

총 10개 데이터
평균: (4+3+4+4+3+3+4+3+4+3) / 10 = 3.5점
```

---

## 2단계: 항목 점수 계산

### 2-1. Bayesian Weighted Average 적용

**공식**:
```
항목 점수 = (AI평균 × N + 7.0 × 10) / (N + 10)

⚠️ 중요: 범위 제한 적용
항목 점수 = max(2.0, min(10.0, 항목 점수))
```

**범위**:
- 최소: 2.0점
- 최대: 10.0점

### 2-2. 계산 과정

**항목 1-1 (부패 신고 건수)**:

```
AI평균 = 7.8점
N = 10개
Prior = 7.0점
W = 10

항목 점수 = (7.8 × 10 + 7.0 × 10) / (10 + 10)
         = (78 + 70) / 20
         = 148 / 20
         = 7.4점
```

### 2-3. 데이터 개수별 예시

#### 예시 1: 데이터 1개 (극단값 방지)

```
AI평균 = 10점 (매우 우수한 데이터 1개)
N = 1개

항목 점수 = (10 × 1 + 6.0 × 10) / (1 + 10)
         = (10 + 60) / 11
         = 70 / 11
         = 6.36점

✅ Prior가 90.9% 영향! 극단값 방지!
```

#### 예시 2: 데이터 10개 (균형)

```
AI평균 = 8점
N = 10개

항목 점수 = (8 × 10 + 6.0 × 10) / (10 + 10)
         = (80 + 60) / 20
         = 140 / 20
         = 7.0점

✅ Prior 50%, AI 50% 영향!
```

#### 예시 3: 데이터 30개 (객관성)

```
AI평균 = 8점
N = 30개

항목 점수 = (8 × 30 + 6.0 × 10) / (30 + 10)
         = (240 + 60) / 40
         = 300 / 40
         = 7.5점

✅ AI가 75% 영향! 객관성 확보!
```

### 2-4. 항목 점수 범위

```
최소: 2.0점 (매우 많은 -10점 데이터)
Prior: 6.0점 (데이터 없을 때)
최대: 10.0점 (매우 많은 +10점 데이터)
```

---

## 3단계: 분야 점수 계산

### 3-1. 공식

```
분야 점수 = (항목1 + 항목2 + ... + 항목10) / 10
```

**단순 평균 (Arithmetic Mean)**

### 3-2. 계산 과정

**분야 1: 청렴성 (Integrity)**

| 항목 | 항목명 | 항목 점수 |
|------|--------|-----------|
| 1-1 | 부패 신고 건수 | 6.9점 |
| 1-2 | 뇌물 및 향응 의혹 | 7.2점 |
| 1-3 | 청렴도 평가 점수 | 7.5점 |
| 1-4 | 공직자 윤리 위반 | 6.5점 |
| 1-5 | 이해충돌 방지 노력 | 7.0점 |
| 1-6 | 재산 변동 투명성 | 7.3점 |
| 1-7 | 공금 사용 적정성 | 7.4점 |
| 1-8 | 정치 자금 투명성 | 7.1점 |
| 1-9 | 가족 비리 연루 여부 | 6.8점 |
| 1-10 | 청렴 서약 이행도 | 7.0점 |

```
분야 1 점수 = (6.9 + 7.2 + 7.5 + 6.5 + 7.0 + 7.3 + 7.4 + 7.1 + 6.8 + 7.0) / 10
           = 70.7 / 10
           = 7.07점
```

### 3-3. 분야 점수 범위

```
최소: 2.0점 (모든 항목이 2.0점)
Prior: 6.0점 (모든 항목이 6.0점)
최대: 10.0점 (모든 항목이 10.0점)
```

---

## 4단계: 최종 점수 계산

### 4-1. 공식

```
최종 점수 = FLOOR(분야1 + 분야2 + ... + 분야10)
```

**단순 합계 후 소수점 제거 (Floor Sum)**

- 분야 점수를 10개 모두 합산
- 소수점 이하 버림 (FLOOR 함수)
- 최종 점수는 정수로 표현 (예: 712점, 658점)

### 4-2. 계산 과정

**10개 분야**

| 분야 | 분야명 | 분야 점수 |
|------|--------|-----------|
| 1 | 청렴성 (Integrity) | 7.07점 |
| 2 | 전문성 (Professional Competence) | 7.30점 |
| 3 | 소통능력 (Communication) | 7.27점 |
| 4 | 정책능력 (Policy Making) | 7.12점 |
| 5 | 리더십 (Leadership) | 7.20점 |
| 6 | 책임성 (Accountability) | 6.98점 |
| 7 | 투명성 (Transparency) | 7.15점 |
| 8 | 혁신성 (Innovation) | 7.25점 |
| 9 | 포용성 (Inclusiveness) | 7.10점 |
| 10 | 효율성 (Efficiency) | 7.20점 |

```
합계 = 7.07 + 7.30 + 7.27 + 7.12 + 7.20 + 6.98 + 7.15 + 7.25 + 7.10 + 7.20
    = 71.64점

최종 점수 = FLOOR(71.64) = 71점
```

### 4-3. 등급 계산 (10단계)

**71점** → **G 등급 (Gold 🥇)**

| 등급 | 심볼 | 이름 | 점수 범위 | 이모지 |
|------|------|------|-----------|--------|
| 1 | M | Mugunghwa | 940-1000 | 🌺 |
| 2 | D | Diamond | 880-939 | 💎 |
| 3 | E | Emerald | 820-879 | 💚 |
| **4** | **P** | **Platinum** | **760-819** | **🥇** |
| 5 | G | Gold | 700-759 | 🥇 |
| 6 | S | Silver | 640-699 | 🥈 |
| 7 | B | Bronze | 580-639 | 🥉 |
| 8 | I | Iron | 520-579 | ⚫ |
| 9 | Tn | Tin | 460-519 | 🪨 |
| 10 | L | Lead | 400-459 | ⬛ |

### 4-4. 최종 점수 범위

```
항목 점수: 4.0 ~ 10.0점 (Range Restriction)
분야 점수: 4.0 ~ 10.0점 (항목 평균)
최종 점수 최소: 400점 (모든 분야가 4.0점)
Prior 기준: 700점 (모든 분야가 7.0점)
최종 점수 최대: 1000점 (모든 분야가 10.0점)
```

---

## 완전한 계산 예시

### 가상의 정치인 "김서울" 평가

#### 1단계: 데이터 수집

**항목 1-1: 부패 신고 건수**
- 데이터 10개 수집
- AI 평가 평균: 7.8점

**항목 1-2: 뇌물 및 향응 의혹**
- 데이터 8개 수집
- AI 평가 평균: 7.5점

... (총 100개 항목)

#### 2단계: 항목 점수 계산

**항목 1-1**:
```
항목 점수 = (7.8 × 10 + 6.0 × 10) / (10 + 10) = 6.9점
```

**항목 1-2**:
```
항목 점수 = (7.5 × 8 + 6.0 × 10) / (8 + 10) = 6.67점
```

... (총 100개 항목)

#### 3단계: 분야 점수 계산

**분야 1: 청렴성**
```
분야 점수 = (6.9 + 6.67 + 7.2 + ... + 7.0) / 10 = 7.05점
```

... (총 10개 분야)

#### 4단계: 최종 점수 계산

```
최종 점수 = 7.05 + 7.30 + 7.20 + ... + 7.15 = 71.50점
등급 = P (Platinum 🥇)
```

---

## Python 코드

### 기본 함수

```python
def calculate_item_score(data_scores, prior=6.0, prior_weight=10):
    """
    항목 점수 계산 (Bayesian Weighted Average)

    Args:
        data_scores: 데이터 점수 리스트 [-10 ~ +10]
        prior: Prior 점수 (기본값: 6.0)
        prior_weight: Prior 가중치 (기본값: 10)

    Returns:
        항목 점수 (2.0 ~ 10.0)
    """
    # 데이터 없을 경우
    if len(data_scores) == 0:
        return prior

    # 데이터 개수
    N = len(data_scores)

    # AI 평가 평균
    ai_average = sum(data_scores) / N

    # Bayesian Weighted Average
    item_score = (ai_average * N + prior * prior_weight) / (N + prior_weight)

    # 범위 보정 (안전장치)
    item_score = max(2.0, min(10.0, item_score))

    return round(item_score, 2)


def calculate_category_score(item_scores):
    """
    분야 점수 계산 (산술 평균)

    Args:
        item_scores: 항목 점수 리스트 (10개)

    Returns:
        분야 점수 (2.0 ~ 10.0)
    """
    if len(item_scores) == 0:
        return 6.0  # Prior

    category_score = sum(item_scores) / len(item_scores)

    return round(category_score, 2)


def calculate_final_score(category_scores):
    """
    최종 점수 계산 (합계)

    Args:
        category_scores: 분야 점수 리스트 (10개)

    Returns:
        최종 점수 (20 ~ 100)
    """
    final_score = sum(category_scores)

    return round(final_score, 2)


def get_grade(final_score):
    """
    10단계 등급 변환

    Args:
        final_score: 최종 점수 (20 ~ 100)

    Returns:
        등급 정보 (dict)
    """
    if final_score >= 93:
        return {'code': 'M', 'name': 'Mugunghwa', 'emoji': '🌺', 'description': '최우수'}
    elif final_score >= 86:
        return {'code': 'D', 'name': 'Diamond', 'emoji': '💎', 'description': '우수'}
    elif final_score >= 79:
        return {'code': 'E', 'name': 'Emerald', 'emoji': '💚', 'description': '양호'}
    elif final_score >= 72:
        return {'code': 'P', 'name': 'Platinum', 'emoji': '🥇', 'description': '보통+'}
    elif final_score >= 65:
        return {'code': 'G', 'name': 'Gold', 'emoji': '🥇', 'description': '보통'}
    elif final_score >= 58:
        return {'code': 'S', 'name': 'Silver', 'emoji': '🥈', 'description': '보통-'}
    elif final_score >= 51:
        return {'code': 'B', 'name': 'Bronze', 'emoji': '🥉', 'description': '미흡'}
    elif final_score >= 44:
        return {'code': 'I', 'name': 'Iron', 'emoji': '⚫', 'description': '부족'}
    elif final_score >= 37:
        return {'code': 'Tn', 'name': 'Tin', 'emoji': '🪨', 'description': '상당히 부족'}
    else:
        return {'code': 'L', 'name': 'Lead', 'emoji': '⬛', 'description': '매우 부족'}
```

### 사용 예시

```python
# 예시: 항목 1-1 (부패 신고 건수)
data_scores_1_1 = [8, 7, 9, 8, 8, 7, 9, 7, 8, 7]  # 10개 데이터
item_score_1_1 = calculate_item_score(data_scores_1_1)
print(f"항목 1-1 점수: {item_score_1_1}점")
# 출력: 항목 1-1 점수: 6.9점

# 예시: 분야 1 (청렴성)
item_scores_category_1 = [6.9, 7.2, 7.5, 6.5, 7.0, 7.3, 7.4, 7.1, 6.8, 7.0]
category_score_1 = calculate_category_score(item_scores_category_1)
print(f"분야 1 점수: {category_score_1}점")
# 출력: 분야 1 점수: 7.07점

# 예시: 최종 점수
category_scores = [7.07, 7.30, 7.27, 7.12, 7.20, 6.98, 7.15, 7.25, 7.10, 7.20]
final_score = calculate_final_score(category_scores)
grade = get_grade(final_score)
print(f"최종 점수: {final_score}점")
print(f"등급: {grade['emoji']} {grade['name']} ({grade['code']})")
# 출력: 최종 점수: 71.64점
# 출력: 등급: 🥇 Platinum (P)
```

### 완전한 평가 예시

```python
# 가상의 정치인 평가
politician_name = "김서울"

# 1단계: 데이터 수집 (예시)
all_data = {
    "category_1": {
        "item_1": [8, 7, 9, 8, 8, 7, 9, 7, 8, 7],  # 10개 데이터
        "item_2": [7, 8, 7, 8, 7, 7, 8, 7],         # 8개 데이터
        # ... item_3 ~ item_10
    },
    # ... category_2 ~ category_10
}

# 2단계: 항목 점수 계산
item_scores = {}
for category_num in range(1, 11):
    item_scores[f"category_{category_num}"] = {}
    for item_num in range(1, 11):
        data = all_data[f"category_{category_num}"][f"item_{item_num}"]
        score = calculate_item_score(data)
        item_scores[f"category_{category_num}"][f"item_{item_num}"] = score

# 3단계: 분야 점수 계산
category_scores = {}
for category_num in range(1, 11):
    items = [item_scores[f"category_{category_num}"][f"item_{i}"] for i in range(1, 11)]
    score = calculate_category_score(items)
    category_scores[f"category_{category_num}"] = score

# 4단계: 최종 점수 계산
category_list = [category_scores[f"category_{i}"] for i in range(1, 11)]
final_score = calculate_final_score(category_list)
grade = get_grade(final_score)

# 결과 출력
print(f"===== {politician_name} 평가 결과 =====")
print(f"최종 점수: {final_score}점")
print(f"등급: {grade['emoji']} {grade['name']} ({grade['code']})")
print(f"의미: {grade['description']}")
```

---

## SQL 코드

### 데이터베이스 함수

```sql
-- 항목 점수 계산 함수
CREATE OR REPLACE FUNCTION calculate_item_score_v6(
    politician_id_param UUID,
    category_num_param INT,
    item_num_param INT
) RETURNS DECIMAL(4,2) AS $$
DECLARE
    v_ai_average DECIMAL(5,2);
    v_data_count INT;
    v_item_score DECIMAL(4,2);
    v_prior CONSTANT DECIMAL(3,1) := 6.0;      -- Prior 6.0
    v_prior_weight CONSTANT INT := 10;         -- Prior Weight
BEGIN
    -- AI 평가 평균 및 데이터 개수 계산
    SELECT AVG(data_score), COUNT(*)
    INTO v_ai_average, v_data_count
    FROM collected_data
    WHERE politician_id = politician_id_param
      AND category_num = category_num_param
      AND item_num = item_num_param;

    -- 데이터 없을 경우
    IF v_data_count = 0 THEN
        RETURN v_prior;
    END IF;

    -- Bayesian Weighted Average
    v_item_score := (v_ai_average * v_data_count + v_prior * v_prior_weight)
                    / (v_data_count + v_prior_weight);

    -- 범위 보정
    v_item_score := GREATEST(2.0, LEAST(10.0, v_item_score));

    RETURN v_item_score;
END;
$$ LANGUAGE plpgsql;


-- 분야 점수 계산 함수
CREATE OR REPLACE FUNCTION calculate_category_score_v6(
    politician_id_param UUID,
    category_num_param INT
) RETURNS DECIMAL(4,2) AS $$
DECLARE
    v_category_score DECIMAL(4,2);
BEGIN
    -- 항목 점수 평균
    SELECT AVG(item_score)
    INTO v_category_score
    FROM item_scores
    WHERE politician_id = politician_id_param
      AND category_num = category_num_param;

    -- 데이터 없을 경우
    IF v_category_score IS NULL THEN
        RETURN 6.0;
    END IF;

    RETURN v_category_score;
END;
$$ LANGUAGE plpgsql;


-- 최종 점수 계산 함수
CREATE OR REPLACE FUNCTION calculate_final_score_v6(
    politician_id_param UUID
) RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_final_score DECIMAL(5,2);
BEGIN
    -- 분야 점수 합계
    SELECT SUM(category_score)
    INTO v_final_score
    FROM category_scores
    WHERE politician_id = politician_id_param;

    -- 데이터 없을 경우
    IF v_final_score IS NULL THEN
        RETURN 60.0;  -- 6.0 × 10 = 60점
    END IF;

    RETURN v_final_score;
END;
$$ LANGUAGE plpgsql;


-- 등급 계산 함수 (10단계)
CREATE OR REPLACE FUNCTION calculate_grade_v6(
    final_score_param DECIMAL(5,2)
) RETURNS VARCHAR(2) AS $$
BEGIN
    IF final_score_param >= 93 THEN
        RETURN 'M';   -- Mugunghwa
    ELSIF final_score_param >= 86 THEN
        RETURN 'D';   -- Diamond
    ELSIF final_score_param >= 79 THEN
        RETURN 'E';   -- Emerald
    ELSIF final_score_param >= 72 THEN
        RETURN 'P';   -- Platinum
    ELSIF final_score_param >= 65 THEN
        RETURN 'G';   -- Gold
    ELSIF final_score_param >= 58 THEN
        RETURN 'S';   -- Silver
    ELSIF final_score_param >= 51 THEN
        RETURN 'B';   -- Bronze
    ELSIF final_score_param >= 44 THEN
        RETURN 'I';   -- Iron
    ELSIF final_score_param >= 37 THEN
        RETURN 'Tn';  -- Tin
    ELSE
        RETURN 'L';   -- Lead
    END IF;
END;
$$ LANGUAGE plpgsql;
```

### 트리거 (자동 계산)

```sql
-- 트리거 1: 데이터 삽입 시 항목 점수 자동 계산
CREATE OR REPLACE FUNCTION trigger_calculate_item_score()
RETURNS TRIGGER AS $$
DECLARE
    v_item_score DECIMAL(4,2);
BEGIN
    -- 항목 점수 계산
    v_item_score := calculate_item_score_v6(
        NEW.politician_id,
        NEW.category_num,
        NEW.item_num
    );

    -- 항목 점수 저장
    INSERT INTO item_scores (politician_id, category_num, item_num, item_score)
    VALUES (NEW.politician_id, NEW.category_num, NEW.item_num, v_item_score)
    ON CONFLICT (politician_id, category_num, item_num)
    DO UPDATE SET
        item_score = v_item_score,
        last_updated = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_item_score
AFTER INSERT OR UPDATE ON collected_data
FOR EACH ROW
EXECUTE FUNCTION trigger_calculate_item_score();


-- 트리거 2: 항목 점수 갱신 시 분야 점수 자동 계산
CREATE OR REPLACE FUNCTION trigger_calculate_category_score()
RETURNS TRIGGER AS $$
DECLARE
    v_category_score DECIMAL(4,2);
BEGIN
    -- 분야 점수 계산
    v_category_score := calculate_category_score_v6(
        NEW.politician_id,
        NEW.category_num
    );

    -- 분야 점수 저장
    INSERT INTO category_scores (politician_id, category_num, category_score)
    VALUES (NEW.politician_id, NEW.category_num, v_category_score)
    ON CONFLICT (politician_id, category_num)
    DO UPDATE SET
        category_score = v_category_score,
        last_updated = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_category_score
AFTER INSERT OR UPDATE ON item_scores
FOR EACH ROW
EXECUTE FUNCTION trigger_calculate_category_score();


-- 트리거 3: 분야 점수 갱신 시 최종 점수 자동 계산
CREATE OR REPLACE FUNCTION trigger_calculate_final_score()
RETURNS TRIGGER AS $$
DECLARE
    v_final_score DECIMAL(5,2);
    v_grade VARCHAR(2);
BEGIN
    -- 최종 점수 계산
    v_final_score := calculate_final_score_v6(NEW.politician_id);

    -- 등급 계산
    v_grade := calculate_grade_v6(v_final_score);

    -- 최종 점수 저장
    INSERT INTO final_scores (politician_id, total_score, grade_code)
    VALUES (NEW.politician_id, v_final_score, v_grade)
    ON CONFLICT (politician_id)
    DO UPDATE SET
        total_score = v_final_score,
        grade_code = v_grade,
        last_updated = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_final_score
AFTER INSERT OR UPDATE ON category_scores
FOR EACH ROW
EXECUTE FUNCTION trigger_calculate_final_score();
```

---

## 요약

### 4단계 알고리즘

1. **1단계: 데이터 수집 및 평가** (-10 ~ +10)
2. **2단계: 항목 점수 계산** (Bayesian Weighted Average, 2.0 ~ 10.0)
3. **3단계: 분야 점수 계산** (산술 평균, 2.0 ~ 10.0)
4. **4단계: 최종 점수 계산** (합계, 20 ~ 100)

### 핵심 공식

```python
# 2단계
항목 점수 = (AI평균 × N + 6.0 × 10) / (N + 10)

# 3단계
분야 점수 = (항목1 + 항목2 + ... + 항목10) / 10

# 4단계
최종 점수 = 분야1 + 분야2 + ... + 분야10
```

### 점수 범위

- **항목**: 2.0 ~ 10.0점
- **분야**: 2.0 ~ 10.0점
- **최종**: 20 ~ 100점 (실제: 30 ~ 100점)

### 10단계 등급

M(93+) > D(86+) > E(79+) > P(72+) > G(65+) > S(58+) > B(51+) > I(44+) > Tn(37+) > L(30+)

---

**작성일**: 2025-10-28
**버전**: 6.0
**상태**: ✅ 완료

**작성자**: PoliticianFinder 연구팀
**문서번호**: 50
