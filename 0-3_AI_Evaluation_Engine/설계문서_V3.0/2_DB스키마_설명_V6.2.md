# 데이터베이스 스키마 설명 (V6.2)

**작성일**: 2025-10-31
**버전**: V6.2
**DBMS**: PostgreSQL (Supabase)
**점수 범위**: 400~1,000점
**등급 체계**: 10단계 금속 등급

---

## 목차
1. [스키마 개요](#1-스키마-개요)
2. [테이블 구조](#2-테이블-구조)
3. [트리거 함수](#3-트리거-함수)
4. [뷰(View)](#4-뷰view)
5. [데이터 흐름](#5-데이터-흐름)
6. [V2.0과의 차이점](#6-v20과의-차이점)

---

## 1. 스키마 개요

### 1.1 핵심 특징
- **Rating 기반**: -5(매우 나쁨) ~ +5(매우 좋음) 척도
- **자동 계산**: 트리거를 통한 실시간 점수 계산
- **계층 구조**: 데이터 → 항목 → 분야 → 최종
- **5개 AI 독립 평가**: Claude, ChatGPT, Gemini, Grok, Perplexity
- **종합 점수**: 5개 AI 평균으로 최종 종합 점수 산출

### 1.2 테이블 관계도
```
politicians (정치인 기본정보)
    ↓
collected_data (원본 데이터 + Rating)
    ↓ [트리거 1: calculate_ai_item_score]
ai_item_scores (항목 점수: 4.0~10.0)
    ↓ [트리거 2: calculate_ai_category_score]
ai_category_scores (분야 점수: 40~100)
    ↓ [트리거 3: calculate_ai_final_score]
ai_final_scores (AI별 최종 점수: 400~1,000)
    ↓ [트리거 4: calculate_combined_final_score]
combined_final_scores (종합 최종 점수: 400~1,000)
```

---

## 2. 테이블 구조

### 2.1 politicians (정치인 기본 정보)

#### 테이블 설명
정치인의 기본 신상정보를 저장하는 마스터 테이블

#### 컬럼 구조
| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| id | UUID | PK | 정치인 고유 ID (자동생성) |
| name | VARCHAR(100) | NOT NULL | 정치인 이름 |
| job_type | VARCHAR(50) | NOT NULL | 직급 (국회의원, 광역단체장 등) |
| party | VARCHAR(100) | NULL | 소속 정당 |
| region | VARCHAR(200) | NULL | 지역구 |
| current_position | VARCHAR(200) | NULL | 현재 직책 |
| profile_image_url | VARCHAR(500) | NULL | 프로필 이미지 URL |
| created_at | TIMESTAMP | DEFAULT NOW() | 생성 시각 |
| updated_at | TIMESTAMP | DEFAULT NOW() | 수정 시각 |

#### 인덱스
- `idx_politicians_name`: name 컬럼 인덱스
- `idx_politicians_job_type`: job_type 컬럼 인덱스
- `idx_politicians_party`: party 컬럼 인덱스

#### 예시 데이터
```sql
INSERT INTO politicians (name, job_type, party, region, current_position)
VALUES ('오세훈', '광역단체장', '국민의힘', '서울특별시', '서울특별시장');
```

---

### 2.2 collected_data (수집된 원본 데이터)

#### 테이블 설명
AI가 수집한 원본 데이터와 Rating을 저장하는 테이블

#### 컬럼 구조
| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| id | UUID | PK | 데이터 고유 ID |
| politician_id | UUID | FK → politicians | 평가 대상 정치인 |
| ai_name | VARCHAR(50) | NOT NULL | AI 이름 (Claude, ChatGPT 등) |
| category_num | INT | 1~10 | 분야 번호 (1=전문성 ~ 10=공익추구) |
| item_num | INT | 1~10 | 항목 번호 (각 분야당 7개 항목) |
| data_type | VARCHAR(50) | NULL | 데이터 유형 (뉴스, 공식기록 등) |
| data_title | VARCHAR(500) | NULL | 데이터 제목 |
| data_content | TEXT | NULL | 데이터 본문 |
| data_url | VARCHAR(500) | NULL | 출처 URL |
| **rating** | **INT** | **-5 ~ +5** | **V6.2 핵심: Rating 점수** |
| reliability | DECIMAL(3,2) | 0.00 ~ 1.00 | 신뢰도 (0~1) |
| collected_at | TIMESTAMP | DEFAULT NOW() | 수집 시각 |

#### 인덱스
- `idx_data_politician`: politician_id 인덱스
- `idx_data_ai_name`: ai_name 인덱스
- `idx_data_category_item`: (category_num, item_num) 복합 인덱스
- `idx_data_politician_ai`: (politician_id, ai_name) 복합 인덱스

#### V6.2 주요 변경사항
```sql
-- V2.0
data_score DECIMAL(4,3) CHECK (data_score BETWEEN 0.000 AND 1.000)

-- V6.2
rating INT NOT NULL CHECK (rating BETWEEN -5 AND 5)
```

#### 예시 데이터
```sql
INSERT INTO collected_data (
  politician_id, ai_name, category_num, item_num,
  data_title, data_content, rating, reliability
)
VALUES (
  'uuid-오세훈',
  'Claude',
  1,  -- 전문성
  1,  -- 법률 전문성
  '오세훈, 서울시 법무행정 개선',
  '...',
  +4,  -- 좋음
  0.95
);
```

---

### 2.3 ai_item_scores (AI별 항목 점수)

#### 테이블 설명
collected_data의 rating을 기반으로 자동 계산된 항목 점수 저장

#### 컬럼 구조
| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| id | UUID | PK | 항목 점수 고유 ID |
| politician_id | UUID | FK → politicians | 평가 대상 정치인 |
| ai_name | VARCHAR(50) | NOT NULL | AI 이름 |
| category_num | INT | 1~10 | 분야 번호 |
| item_num | INT | 1~10 | 항목 번호 |
| **item_score** | **DECIMAL(4,2)** | **4.00 ~ 10.00** | **계산된 항목 점수** |
| rating_avg | DECIMAL(4,2) | NULL | rating 평균값 |
| data_count | INT | DEFAULT 0 | 수집된 데이터 개수 |
| last_updated | TIMESTAMP | DEFAULT NOW() | 마지막 갱신 시각 |

#### UNIQUE 제약
- (politician_id, ai_name, category_num, item_num) 복합 유니크

#### 계산 공식
```sql
-- 트리거 함수에서 자동 계산
rating_avg = AVG(rating) FROM collected_data
item_score = 7.0 + (rating_avg × 0.6)

-- 범위 제한
IF item_score < 4.0 THEN item_score = 4.0
IF item_score > 10.0 THEN item_score = 10.0
```

#### 예시 데이터
```sql
-- collected_data INSERT 시 트리거로 자동 생성
-- (politician_id=오세훈, ai_name=Claude, category_num=1, item_num=1)
-- rating_avg = +3.8
-- item_score = 7.0 + (3.8 × 0.6) = 9.28
```

---

### 2.4 ai_category_scores (AI별 분야 점수)

#### 테이블 설명
7개 항목 점수의 평균(×10)으로 계산된 분야 점수 저장

#### 컬럼 구조
| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| id | UUID | PK | 분야 점수 고유 ID |
| politician_id | UUID | FK → politicians | 평가 대상 정치인 |
| ai_name | VARCHAR(50) | NOT NULL | AI 이름 |
| category_num | INT | 1~10 | 분야 번호 |
| **category_score** | **DECIMAL(5,2)** | **40.00 ~ 100.00** | **분야 점수** |
| items_completed | INT | DEFAULT 0 | 완료된 항목 개수 (최대 7) |
| last_updated | TIMESTAMP | DEFAULT NOW() | 마지막 갱신 시각 |

#### UNIQUE 제약
- (politician_id, ai_name, category_num) 복합 유니크

#### 계산 공식
```sql
-- 트리거 함수에서 자동 계산
item_avg = AVG(item_score) FROM ai_item_scores (7개 항목)
category_score = item_avg × 10
```

#### 예시 데이터
```sql
-- ai_item_scores INSERT 시 트리거로 자동 생성
-- 7개 항목 평균 = 8.55
-- category_score = 8.55 × 10 = 85.5
```

---

### 2.5 ai_final_scores (AI별 최종 점수)

#### 테이블 설명
10개 분야 점수의 합계로 계산된 AI별 최종 점수 및 등급 저장

#### 컬럼 구조
| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| id | UUID | PK | 최종 점수 고유 ID |
| politician_id | UUID | FK → politicians | 평가 대상 정치인 |
| ai_name | VARCHAR(50) | NOT NULL | AI 이름 |
| **total_score** | **INT** | **400 ~ 1,000** | **AI별 최종 점수** |
| grade_code | VARCHAR(2) | NOT NULL | 등급 코드 (M/D/E/P/G/S/B/I/Tn/L) |
| grade_name | VARCHAR(20) | NOT NULL | 등급명 (Mugunghwa 등) |
| grade_emoji | VARCHAR(10) | NOT NULL | 등급 이모지 (🌺💎💚 등) |
| categories_completed | INT | DEFAULT 0 | 완료된 분야 개수 (최대 10) |
| items_completed | INT | DEFAULT 0 | 완료된 항목 개수 (최대 70) |
| total_data_count | INT | DEFAULT 0 | 총 수집 데이터 개수 |
| last_updated | TIMESTAMP | DEFAULT NOW() | 마지막 갱신 시각 |

#### UNIQUE 제약
- (politician_id, ai_name) 복합 유니크

#### 계산 공식
```sql
-- 트리거 함수에서 자동 계산
total_score = SUM(category_score) FROM ai_category_scores (10개 분야)

-- 등급 부여
IF total_score >= 940 THEN grade_code = 'M' (Mugunghwa 🌺)
ELSIF total_score >= 880 THEN grade_code = 'D' (Diamond 💎)
ELSIF total_score >= 820 THEN grade_code = 'E' (Emerald 💚)
...
```

#### 예시 데이터
```sql
-- ai_category_scores INSERT 시 트리거로 자동 생성
-- 10개 분야 합계 = 801
-- total_score = 801
-- grade_code = 'P' (Platinum 🥇)
```

---

### 2.6 combined_final_scores (종합 최종 점수)

#### 테이블 설명
5개 AI의 평균 점수로 계산된 종합 최종 점수 및 등급 저장

#### 컬럼 구조
| 컬럼명 | 타입 | 제약 | 설명 |
|--------|------|------|------|
| id | UUID | PK | 종합 점수 고유 ID |
| politician_id | UUID | FK → politicians, UNIQUE | 평가 대상 정치인 |
| **combined_score** | **INT** | **400 ~ 1,000** | **종합 최종 점수** |
| grade_code | VARCHAR(2) | NOT NULL | 등급 코드 |
| grade_name | VARCHAR(20) | NOT NULL | 등급명 |
| grade_emoji | VARCHAR(10) | NOT NULL | 등급 이모지 |
| ai_count | INT | DEFAULT 0 | 평가한 AI 개수 (1~5) |
| last_updated | TIMESTAMP | DEFAULT NOW() | 마지막 갱신 시각 |

#### UNIQUE 제약
- politician_id (정치인당 1개의 종합 점수)

#### 계산 공식
```sql
-- 트리거 함수에서 자동 계산
combined_score = AVG(total_score) FROM ai_final_scores (5개 AI)

-- 등급 부여 (ai_final_scores와 동일한 기준)
IF combined_score >= 940 THEN grade_code = 'M'
...
```

#### 예시 데이터
```sql
-- ai_final_scores INSERT 시 트리거로 자동 생성
-- 5개 AI 평균: (801 + 798 + 805 + 802 + 799) / 5 = 801
-- combined_score = 801
-- grade_code = 'P' (Platinum 🥇)
```

---

## 3. 트리거 함수

### 3.1 calculate_ai_item_score()

#### 트리거 조건
- **테이블**: collected_data
- **이벤트**: AFTER INSERT OR UPDATE
- **실행**: FOR EACH ROW

#### 동작 과정
1. collected_data에 새 rating 데이터 삽입
2. 해당 항목의 모든 rating 평균 계산
3. `item_score = 7.0 + (rating_avg × 0.6)` 계산
4. ai_item_scores에 UPSERT

#### 코드 예시
```sql
CREATE OR REPLACE FUNCTION calculate_ai_item_score()
RETURNS TRIGGER AS $$
DECLARE
  v_rating_avg DECIMAL(4,2);
  v_item_score DECIMAL(4,2);
BEGIN
  -- rating 평균 계산
  SELECT AVG(rating::DECIMAL)
  INTO v_rating_avg
  FROM collected_data
  WHERE politician_id = NEW.politician_id
    AND ai_name = NEW.ai_name
    AND category_num = NEW.category_num
    AND item_num = NEW.item_num;

  -- V6.2 공식 적용
  v_item_score := 7.0 + (v_rating_avg * 0.6);

  -- 범위 제한
  IF v_item_score < 4.0 THEN v_item_score := 4.0;
  ELSIF v_item_score > 10.0 THEN v_item_score := 10.0;
  END IF;

  -- UPSERT
  INSERT INTO ai_item_scores (...)
  VALUES (v_item_score, ...)
  ON CONFLICT (...) DO UPDATE SET ...;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### 3.2 calculate_ai_category_score()

#### 트리거 조건
- **테이블**: ai_item_scores
- **이벤트**: AFTER INSERT OR UPDATE
- **실행**: FOR EACH ROW

#### 동작 과정
1. ai_item_scores에 새 항목 점수 삽입/갱신
2. 해당 분야의 7개 항목 점수 평균 계산
3. `category_score = item_avg × 10` 계산
4. ai_category_scores에 UPSERT

#### 코드 예시
```sql
CREATE OR REPLACE FUNCTION calculate_ai_category_score()
RETURNS TRIGGER AS $$
DECLARE
  v_item_avg DECIMAL(4,2);
  v_category_score DECIMAL(5,2);
BEGIN
  -- 7개 항목 평균 계산
  SELECT AVG(item_score)
  INTO v_item_avg
  FROM ai_item_scores
  WHERE politician_id = NEW.politician_id
    AND ai_name = NEW.ai_name
    AND category_num = NEW.category_num;

  -- V6.2 공식: × 10
  v_category_score := v_item_avg * 10;

  -- UPSERT
  INSERT INTO ai_category_scores (...)
  VALUES (v_category_score, ...)
  ON CONFLICT (...) DO UPDATE SET ...;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### 3.3 calculate_ai_final_score()

#### 트리거 조건
- **테이블**: ai_category_scores
- **이벤트**: AFTER INSERT OR UPDATE
- **실행**: FOR EACH ROW

#### 동작 과정
1. ai_category_scores에 새 분야 점수 삽입/갱신
2. 해당 AI의 10개 분야 점수 합계 계산
3. `total_score = SUM(category_score)` 계산
4. 10단계 등급 부여
5. ai_final_scores에 UPSERT

#### 등급 부여 로직
```sql
IF v_total_score >= 940 THEN
  v_grade_code := 'M'; v_grade_name := 'Mugunghwa'; v_grade_emoji := '🌺';
ELSIF v_total_score >= 880 THEN
  v_grade_code := 'D'; v_grade_name := 'Diamond'; v_grade_emoji := '💎';
ELSIF v_total_score >= 820 THEN
  v_grade_code := 'E'; v_grade_name := 'Emerald'; v_grade_emoji := '💚';
ELSIF v_total_score >= 760 THEN
  v_grade_code := 'P'; v_grade_name := 'Platinum'; v_grade_emoji := '🥇';
ELSIF v_total_score >= 700 THEN
  v_grade_code := 'G'; v_grade_name := 'Gold'; v_grade_emoji := '🥇';
ELSIF v_total_score >= 640 THEN
  v_grade_code := 'S'; v_grade_name := 'Silver'; v_grade_emoji := '🥈';
ELSIF v_total_score >= 580 THEN
  v_grade_code := 'B'; v_grade_name := 'Bronze'; v_grade_emoji := '🥉';
ELSIF v_total_score >= 520 THEN
  v_grade_code := 'I'; v_grade_name := 'Iron'; v_grade_emoji := '⚫';
ELSIF v_total_score >= 460 THEN
  v_grade_code := 'Tn'; v_grade_name := 'Tin'; v_grade_emoji := '🪨';
ELSE
  v_grade_code := 'L'; v_grade_name := 'Lead'; v_grade_emoji := '⬛';
END IF;
```

---

### 3.4 calculate_combined_final_score()

#### 트리거 조건
- **테이블**: ai_final_scores
- **이벤트**: AFTER INSERT OR UPDATE
- **실행**: FOR EACH ROW

#### 동작 과정
1. ai_final_scores에 새 AI 최종 점수 삽입/갱신
2. 해당 정치인의 모든 AI 점수 평균 계산
3. `combined_score = AVG(total_score)` 계산
4. 10단계 등급 부여
5. combined_final_scores에 UPSERT

---

## 4. 뷰(View)

### 4.1 v_combined_rankings (종합 순위)

#### 설명
모든 정치인의 종합 점수를 순위와 함께 조회

#### 컬럼
- 정치인 기본정보 (name, job_type, party, region)
- 종합 점수 (combined_score, grade_code, grade_name, grade_emoji)
- 순위 (rank, rank_by_job_type)
- 합격 여부 (pass_status: G등급(700점) 이상)

#### SQL
```sql
CREATE OR REPLACE VIEW v_combined_rankings AS
SELECT
  p.name,
  p.job_type,
  c.combined_score,
  c.grade_emoji,
  c.grade_name,
  RANK() OVER (ORDER BY c.combined_score DESC) as rank,
  CASE WHEN c.combined_score >= 700 THEN '합격' ELSE '불합격' END as pass_status
FROM politicians p
JOIN combined_final_scores c ON p.id = c.politician_id
ORDER BY c.combined_score DESC;
```

---

### 4.2 v_ai_scores_detail (AI별 점수 상세)

#### 설명
정치인별 5개 AI의 점수를 비교 조회

#### 컬럼
- 정치인 정보
- AI별 점수 (ai_name, total_score, grade)
- 진행 상황 (categories_completed, items_completed, total_data_count)
- 종합 점수 (combined_score)

---

### 4.3 v_ai_category_details (분야별 상세)

#### 설명
AI별 10개 분야 점수 상세 조회

---

### 4.4 v_ai_item_details (항목별 상세)

#### 설명
AI별 70개 항목 점수 상세 조회

---

### 4.5 v_data_collection_status (데이터 수집 현황)

#### 설명
항목별 수집 데이터 개수 및 평균 rating 조회

#### SQL
```sql
CREATE OR REPLACE VIEW v_data_collection_status AS
SELECT
  p.name,
  cd.ai_name,
  cd.category_num,
  cd.item_num,
  COUNT(*) as data_count,
  AVG(cd.rating) as avg_rating,  -- V6.2: rating 평균
  AVG(cd.reliability) as avg_reliability
FROM politicians p
JOIN collected_data cd ON p.id = cd.politician_id
GROUP BY p.name, cd.ai_name, cd.category_num, cd.item_num;
```

---

## 5. 데이터 흐름

### 5.1 전체 데이터 흐름도
```
[1] AI가 데이터 수집 + rating 부여
    ↓ INSERT INTO collected_data
    ↓ 트리거 1 발동

[2] 항목 점수 자동 계산
    ↓ calculate_ai_item_score()
    ↓ INSERT/UPDATE ai_item_scores
    ↓ 트리거 2 발동

[3] 분야 점수 자동 계산
    ↓ calculate_ai_category_score()
    ↓ INSERT/UPDATE ai_category_scores
    ↓ 트리거 3 발동

[4] AI별 최종 점수 + 등급 계산
    ↓ calculate_ai_final_score()
    ↓ INSERT/UPDATE ai_final_scores
    ↓ 트리거 4 발동

[5] 종합 최종 점수 + 등급 계산
    ↓ calculate_combined_final_score()
    ↓ INSERT/UPDATE combined_final_scores

[6] 결과 조회
    ↓ v_combined_rankings 등 뷰 활용
```

### 5.2 예시: 데이터 1개 삽입 시 연쇄 반응
```sql
-- [1] 데이터 삽입
INSERT INTO collected_data (politician_id, ai_name, category_num, item_num, rating)
VALUES ('uuid-오세훈', 'Claude', 1, 1, +4);

-- [2] 트리거 1 자동 실행 → ai_item_scores 갱신
-- (politician_id, ai_name, category_num=1, item_num=1) 항목의 rating 평균 재계산

-- [3] 트리거 2 자동 실행 → ai_category_scores 갱신
-- (politician_id, ai_name, category_num=1) 분야의 7개 항목 평균 재계산

-- [4] 트리거 3 자동 실행 → ai_final_scores 갱신
-- (politician_id, ai_name) AI의 10개 분야 합계 재계산 + 등급 부여

-- [5] 트리거 4 자동 실행 → combined_final_scores 갱신
-- (politician_id) 정치인의 5개 AI 평균 재계산 + 등급 부여
```

---

## 6. V2.0과의 차이점

### 6.1 테이블 변경사항

#### collected_data
| 항목 | V2.0 | V6.2 |
|------|------|------|
| 점수 컬럼 | `data_score DECIMAL(4,3)` | `rating INT` |
| 점수 범위 | 0.000 ~ 1.000 | -5 ~ +5 |
| 의미 | 0~1 정규화 점수 | 직관적 평가 척도 |

#### ai_item_scores
| 항목 | V2.0 | V6.2 |
|------|------|------|
| 계산 공식 | Bayesian Prior 7.0 + weight 10 | `7.0 + (rating_avg × 0.6)` |
| 점수 범위 | 4.00 ~ 10.00 | 4.00 ~ 10.00 (동일) |
| 추가 컬럼 | - | `rating_avg DECIMAL(4,2)` |

#### ai_category_scores
| 항목 | V2.0 | V6.2 |
|------|------|------|
| 계산 공식 | AVG(item_score) | `AVG(item_score) × 10` |
| 점수 범위 | 4.00 ~ 10.00 | 40.00 ~ 100.00 |

#### ai_final_scores
| 항목 | V2.0 | V6.2 |
|------|------|------|
| 계산 공식 | SUM(category_score) | SUM(category_score) |
| 점수 범위 | 40.0 ~ 100.0 | 400 ~ 1,000 |
| 데이터 타입 | DECIMAL(5,1) | INT |
| 등급 체계 | 8단계 (M/D/E/P/G/S/B/I) | 10단계 (M/D/E/P/G/S/B/I/Tn/L) |
| grade_code | VARCHAR(1) | VARCHAR(2) (Tn 때문에) |

### 6.2 트리거 함수 변경사항

#### calculate_ai_item_score()
```sql
-- V2.0
v_final_score := (v_ai_score * v_data_count + 7.0 * 10) / (v_data_count + 10);

-- V6.2
v_item_score := 7.0 + (v_rating_avg * 0.6);
```

#### calculate_ai_category_score()
```sql
-- V2.0
category_score = AVG(item_score)  -- 4~10 범위

-- V6.2
category_score = AVG(item_score) × 10  -- 40~100 범위
```

#### calculate_ai_final_score() - 등급 기준
```sql
-- V2.0: 8단계
IF v_total_score >= 93 THEN 'M'
ELSIF v_total_score >= 86 THEN 'D'
...
ELSIF v_total_score >= 44 THEN 'I'
ELSE 'F'

-- V6.2: 10단계
IF v_total_score >= 940 THEN 'M'
ELSIF v_total_score >= 880 THEN 'D'
...
ELSIF v_total_score >= 460 THEN 'Tn'
ELSE 'L'
```

### 6.3 주요 개선사항

| 영역 | V2.0 | V6.2 | 개선 효과 |
|------|------|------|-----------|
| **데이터 수집** | 0~1 정규화 점수 | -5~+5 rating | 직관적 평가 |
| **항목 점수** | Bayesian 가중 평균 | 선형 변환 | 계산 단순화 |
| **분야 점수** | 4~10 범위 | 40~100 범위 | 가독성 향상 |
| **최종 점수** | 40~100점 | 400~1,000점 | 세밀한 차별화 |
| **등급 체계** | 8단계 | 10단계 | 더 정교한 등급 |
| **Prior** | Bayesian weight 10 | 고정 기준점 7.0 | 일관성 향상 |

---

## 7. 사용 예시

### 7.1 정치인 추가
```sql
INSERT INTO politicians (name, job_type, party)
VALUES ('나경원', '국회의원', '국민의힘');
```

### 7.2 데이터 수집 (AI가 실행)
```sql
INSERT INTO collected_data (
  politician_id, ai_name, category_num, item_num,
  data_title, rating
)
VALUES (
  (SELECT id FROM politicians WHERE name = '나경원'),
  'Claude',
  1,  -- 전문성
  1,  -- 법률 전문성
  '나경원, 검사 출신 법률 전문가',
  +5  -- 매우 좋음
);

-- 트리거가 자동으로 모든 하위 점수 계산
```

### 7.3 종합 순위 조회
```sql
SELECT name, combined_score, grade_emoji, grade_name, rank
FROM v_combined_rankings
ORDER BY rank;
```

### 7.4 AI별 비교
```sql
SELECT name, ai_name, total_score, grade_code
FROM v_ai_scores_detail
WHERE name = '나경원'
ORDER BY total_score DESC;
```

### 7.5 분야별 비교
```sql
SELECT
  p.name,
  c.category_num,
  AVG(c.category_score) as avg_score
FROM politicians p
JOIN ai_category_scores c ON p.id = c.politician_id
WHERE p.name IN ('오세훈', '박주민', '나경원', '우상호')
GROUP BY p.name, c.category_num
ORDER BY c.category_num, avg_score DESC;
```

---

## 8. 관리 및 유지보수

### 8.1 점수 재계산
```sql
-- 특정 정치인 점수 재계산
SELECT recalculate_politician_scores(
  (SELECT id FROM politicians WHERE name = '나경원')
);

-- 모든 정치인 점수 재계산
SELECT recalculate_all_scores();
```

### 8.2 데이터 백업
```sql
-- 정치인별 전체 데이터 백업
COPY (
  SELECT * FROM v_ai_scores_detail
  WHERE name = '나경원'
) TO '/backup/나경원_backup.csv' CSV HEADER;
```

### 8.3 성능 모니터링
```sql
-- 데이터 수집 현황
SELECT * FROM v_data_collection_status
WHERE data_count < 10;  -- 데이터 부족 항목 확인

-- 진행 상황
SELECT name, ai_name, items_completed, total_data_count
FROM v_ai_scores_detail
WHERE items_completed < 70;  -- 미완료 항목 확인
```

---

## 9. 참고 자료

### 관련 문서
- `1_점수계산_알고리즘_V6.2.md`: 점수 계산 알고리즘 상세
- `schema_v6.2.sql`: 실제 SQL 파일
- `등급체계_10단계_금속_400-1000점.md`: 등급 체계 상세

### 버전 히스토리
- **V2.0** (2025-10-26): 초기 버전, Bayesian Prior, 8단계 등급
- **V6.2** (2025-10-31): Rating 기반, 10단계 금속 등급, 400~1,000점

---

**문서 작성**: Claude Code
**최종 수정**: 2025-10-31
**버전**: V6.2
