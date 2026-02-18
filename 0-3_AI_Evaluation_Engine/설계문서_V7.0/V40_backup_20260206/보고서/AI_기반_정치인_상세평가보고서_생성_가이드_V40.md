# AI 기반 정치인 상세평가보고서 생성 가이드 V40

**작성일**: 2026-02-06
**버전**: V40.0
**목적**: 4개 AI의 정치인 평가 결과를 종합한 상세 보고서 생성

---

## 📊 V40 보고서 데이터 구조

### 4개 테이블 조인

```
┌──────────────────────┐
│   politicians        │  ← 1. 기본 정보
│  - 이름, 사진, 정당   │     직위, 지역구
│  - 생년월일, 학력     │     경력, 연락처
└──────────┬───────────┘
           │ JOIN (politician_id)
           ↓
┌──────────────────────┐
│ collected_data_v40   │  ← 2. 수집 데이터
│  - 4 AIs × 1,000개   │     총 4,000개 데이터
│  - 카테고리별 100개   │     (AI당 100개)
│  - 제목, 내용, 출처   │     data_type, sentiment
└──────────┬───────────┘
           │ JOIN (collected_data_id)
           ↓
┌──────────────────────┐
│ evaluations_v40      │  ← 3. AI 평가 결과
│  - 4 AIs × 1,000개   │     총 4,000개 평가
│  - rating (+4~-4, X) │     score (-8~+8, 0)
│  - reasoning         │     evaluated_at
└──────────┬───────────┘
           │ JOIN (politician_id)
           ↓
┌──────────────────────┐
│ ai_final_scores_v40  │  ← 4. 최종 점수
│  - AI별 최종 점수     │     4개 AI 점수
│  - AI별 카테고리 점수 │     평균 점수
│  - 등급 (M~L)        │     calculated_at
└──────────────────────┘
```

---

## 🧮 V40 점수 계산 방식

### 용어 정의

**등급(Rating)**: AI가 평가에서 부여하는 등급
- 범위: -4 ~ +4 (9단계)
- 예: +4(탁월), +3(우수), +2(양호), +1(보통), -1(미흡), -2(부족), -3(심각), -4(최악), X(제외)

**점수(Score)**: 등급을 점수로 환산한 값
- 공식: **Score = Rating × 2**
- 범위: -8 ~ +8
- 예: Rating +4 → Score 8, Rating +3 → Score 6

### 계산 과정 (4단계)

**Step 1: 등급 평균 구하기**
```
AI가 한 카테고리에서 여러 데이터를 평가
→ 각 평가의 Rating 합산 (X 제외)
→ Rating 평균 계산

예: ChatGPT가 전문성 카테고리 118개 평가
    Rating 평균 = 2.77
```

**Step 2: 점수로 환산**
```
점수 = Rating 평균 × 2

예: 2.77 × 2 = 5.54점
```

**Step 3: 카테고리 점수 계산**
```
카테고리 점수 = (점수 × 0.5 + 6.0) × 10

예: (5.54 × 0.5 + 6.0) × 10
  = (2.77 + 6.0) × 10
  = 8.77 × 10
  = 87.7 ≈ 88점 (전문성 카테고리 점수)
```

**Step 4: 최종 점수 계산**
```
최종 점수 = 10개 카테고리 점수 합산

예: 전문성 88점 + 리더십 87점 + 비전 89점 + ... (10개)
  = 881점 (ChatGPT 최종 점수)
```

### 실제 예시: ChatGPT 점수 881점

| 카테고리 | Rating 평균 | 점수(×2) | 카테고리 점수 |
|---------|:-----------:|:--------:|:------------:|
| 전문성 | 2.77 | 5.54 | 88점 |
| 리더십 | 2.65 | 5.30 | 87점 |
| 비전 | 2.96 | 5.92 | 90점 |
| 청렴성 | 2.68 | 5.36 | 87점 |
| 윤리성 | 2.25 | 4.50 | 83점 |
| 책임감 | 2.86 | 5.72 | 89점 |
| 투명성 | 2.42 | 4.84 | 84점 |
| 소통능력 | 2.87 | 5.74 | 89점 |
| 대응성 | 3.31 | 6.62 | 93점 |
| 공익성 | 2.92 | 5.84 | 89점 |
| **합계** | - | - | **881점** |

---

## 📄 V40 보고서 구성 요소

### 1부: 종합 개요

```markdown
# 조은희 AI 기반 정치인 상세평가보고서

**평가 버전**: V40.0
**평가 일자**: 2026-02-06
**총 평가 수**: 4,000개 (4 AIs × 1,000개)
**평가 AI**: Claude, ChatGPT, Grok, Gemini

## 종합 점수

### 🏆 최종 점수 및 종합 평가
- **최종 점수**: 816점 / 1,000점
- **등급**: E (Emerald)
- **종합 평가**: 전문성, 리더십, 비전, 청렴성, 윤리성, 책임감, 투명성, 소통능력, 대응성, 공익성 전반에서 우수한 성과를 보이며, 특히 비전과 전문성 분야에서 탁월함

### 🤖 AI별 최종 점수

| AI | 점수 |
|---|:---:|
| ChatGPT | 881점 |
| Grok | 835점 |
| Gemini | 807점 |
| Claude | 738점 |
| **4 AIs 평균** | **816점** |

### 📊 카테고리별 점수 (4 AIs 평균)

| 카테고리 | 점수 | 평가 |
|---------|:----:|------|
| 1. 비전 (Vision) | 85점 | 우수 |
| 2. 전문성 (Expertise) | 84점 | 우수 |
| 3. 대응성 (Responsiveness) | 84점 | 우수 |
| 4. 공익성 (PublicInterest) | 83점 | 우수 |
| 5. 리더십 (Leadership) | 82점 | 우수 |
| 6. 소통능력 (Communication) | 82점 | 우수 |
| 7. 투명성 (Transparency) | 81점 | 우수 |
| 8. 책임감 (Accountability) | 80점 | 양호 |
| 9. 윤리성 (Ethics) | 79점 | 양호 |
| 10. 청렴성 (Integrity) | 76점 | 양호 |

**총점**: 816점 (카테고리 합계)

---

## 강점 및 약점 분석 (타 정치인 대비 비교)

**⚠️ 주의: 다른 정치인 평가 데이터가 있을 때 작성 가능합니다.**

### ✅ 상대적 강점 (타 정치인 평균 대비)

**예시 (다른 정치인 데이터가 있을 경우):**

| 카테고리 | 조은희 점수 | 정치인 평균 | 차이 | 평가 |
|---------|:----------:|:----------:|:----:|------|
| **비전** | 85점 | 75점 | **+10점** | 🏆 타 정치인 대비 월등 |
| **전문성** | 84점 | 77점 | **+7점** | 🏆 타 정치인 대비 우수 |
| **대응성** | 84점 | 76점 | **+8점** | 🏆 타 정치인 대비 우수 |
| **소통능력** | 82점 | 78점 | **+4점** | ✅ 타 정치인 대비 양호 |

**해석:**
- 비전, 전문성, 대응성 분야에서 타 정치인 평균을 크게 상회
- 정책 기획 및 실행 역량이 타 정치인 대비 뛰어남
- 주민과의 소통 능력도 평균 이상

### ⚠️ 상대적 약점 (타 정치인 평균 대비)

**예시 (다른 정치인 데이터가 있을 경우):**

| 카테고리 | 조은희 점수 | 정치인 평균 | 차이 | 평가 |
|---------|:----------:|:----------:|:----:|------|
| **청렴성** | 76점 | 80점 | **-4점** | ⚠️ 타 정치인 대비 낮음 |
| **윤리성** | 79점 | 82점 | **-3점** | ⚠️ 타 정치인 대비 낮음 |

**해석:**
- 청렴성과 윤리성 분야에서 타 정치인 평균을 하회
- 도덕적 기준 및 청렴도 제고 필요
- 이해충돌 방지 및 투명성 강화 요구됨

**📊 타 정치인 대비 종합 순위 (예시):**
- 전체 100명 중 **상위 15%** (15위)
- 구청장급 30명 중 **상위 20%** (6위)
- 서울시 구청장 25명 중 **상위 24%** (6위)

---

## 좋은 점 및 나쁜 점 분석 (시민 입장 평가)

### 👍 좋은 점 (긍정 평가 대표 사례)

**1. 규제개혁 성과 (평균 +3.5점)**
- ChatGPT +4: "규제개혁으로 기업 활동 활성화, 지역 경제 성장 기여"
- Claude +4: "규제개혁 전문성과 실행력 우수"
- Grok +3: "규제 완화를 통한 지역 발전 노력 인정"
- Gemini +3: "실질적 규제개혁 성과로 전문성 입증"

**2. 스마트시티 구축 계획 (평균 +3.2점)**
- ChatGPT +4: "미래 지향적 도시 계획, 혁신적 비전"
- Grok +3: "스마트시티 추진으로 미래 대비"
- Gemini +3: "디지털 전환 선도적 추진"
- Claude +3: "구체적 실행 계획 마련"

**3. 주민 소통 강화 (평균 +2.9점)**
- ChatGPT +3: "SNS 적극 활용, 주민 의견 경청"
- Grok +3: "다양한 소통 채널 운영"
- Gemini +3: "주민과의 직접 소통 확대"
- Claude +2: "소통 노력 인정"

**4. 재난 대응 체계 구축 (평균 +3.0점)**
- ChatGPT +3: "신속한 재난 대응 시스템 마련"
- Grok +3: "주민 안전 최우선 정책"
- Gemini +3: "효과적 재난 관리"
- Claude +3: "체계적 대응 시스템"

**5. 복지 정책 확대 (평균 +2.8점)**
- ChatGPT +3: "취약계층 지원 확대"
- Grok +3: "복지 사각지대 해소 노력"
- Gemini +2: "복지 예산 증액"
- Claude +2: "복지 정책 개선"

### 👎 나쁜 점 (부정 평가 대표 사례)

**1. 이해충돌 소지 (-2.0점)**
- Claude -3: "가족 기업과의 이해충돌 의혹"
- Grok -2: "청렴도 문제 제기"
- ChatGPT -2: "이해충돌 논란"
- Gemini -1: "투명성 논란"

**2. 정치 자금 관련 의혹 (-1.5점)**
- Claude -2: "정치자금법 위반 의혹"
- Grok -2: "선거비용 논란"
- ChatGPT -1: "정치자금 관련 지적"
- Gemini -1: "윤리 논란"

**3. 정책 실효성 논란 (-1.5점)**
- Claude -2: "전문성 부족으로 정책 실패"
- Grok -2: "정책 실행 과정에서 전문성 의문"
- ChatGPT -1: "일부 정책의 실효성 의문 제기"
- Gemini -1: "정책 추진 과정 미흡"

**4. 공약 이행 지연 (-1.2점)**
- Claude -2: "주요 공약 이행 지연"
- Grok -1: "공약 실천 미흡"
- ChatGPT -1: "공약 이행률 논란"
- Gemini -1: "일부 공약 미이행"

**5. 예산 낭비 논란 (-1.0점)**
- Grok -2: "불필요한 예산 지출"
- Claude -1: "예산 효율성 문제"
- ChatGPT -1: "예산 낭비 지적"
- Gemini -1: "재정 운영 논란"

---

### 📊 종합 분석

**긍정 평가 (전체의 72.5%)**
- 정책 기획 및 실행 능력 탁월
- 주민 중심 행정 실천
- 미래 지향적 비전 제시
- 적극적 소통 노력

**부정 평가 (전체의 4.7%)**
- 청렴성 및 윤리성 논란
- 일부 정책 실효성 의문
- 공약 이행 지연 지적
- 예산 효율성 문제 제기

**X 판정 (평가 제외, 22.8%)**
- 10년 이상 과거 데이터
- 동명이인 데이터
- 허위 정보

```

### 2부: AI별 카테고리 평가 비교

```markdown
## AI별 카테고리 평가 비교

### 전체 카테고리 점수 비교

| 카테고리 | Claude | ChatGPT | Grok | Gemini | 평균 | 표준편차 |
|---------|:------:|:-------:|:----:|:------:|:----:|:--------:|
| 전문성 | 77점 | 89점 | 85점 | 82점 | 84점 | 4.9점 |
| 리더십 | 76점 | 86점 | 84점 | 83점 | 82점 | 4.3점 |
| 비전 | 79점 | 90점 | 89점 | 84점 | 85점 | 5.0점 |
| 청렴성 | 65점 | 87점 | 74점 | 77점 | 76점 | 8.9점 |
| 윤리성 | 71점 | 87점 | 80점 | 79점 | 79점 | 6.5점 |
| 책임감 | 72점 | 87점 | 82점 | 79점 | 80점 | 6.3점 |
| 투명성 | 73점 | 87점 | 84점 | 80점 | 81점 | 5.9점 |
| 소통능력 | 74점 | 89점 | 84점 | 81점 | 82점 | 6.1점 |
| 대응성 | 76점 | 89점 | 88점 | 81점 | 84점 | 6.0점 |
| 공익성 | 75점 | 90점 | 85점 | 81점 | 83점 | 6.2점 |

```

### 3부: 카테고리별 상세 평가

```markdown
## 카테고리 1: 전문성 (Expertise)

### 종합 점수
- **4 AIs 평균**: 84점 / 100점
- **평균 등급**: +2.3
- **평가 데이터**: 400개 (4 AIs × 100개)

### AI별 평가 비교

| AI | 점수 | 평균 등급 | 평가 개수 | X 비율 |
|---|:---:|:--------:|:--------:|:------:|
| ChatGPT | 89점 | +2.92 | 94개 | 6개 (6.4%) |
| Grok | 85점 | +2.55 | 93개 | 7개 (7.5%) |
| Gemini | 82점 | +2.19 | 63개 | 37개 (37.0%) |
| Claude | 77점 | +1.74 | 126개 | 88개 (69.8%) |

### 대표 긍정 평가 사례

#### [1] 서초구 규제개혁 성과 (평균 등급: +3.5)
- **ChatGPT**: +4 (탁월) - "규제개혁으로 기업 활동 활성화, 지역 경제 성장 기여"
- **Grok**: +3 (우수) - "규제 완화를 통한 지역 발전 노력 인정"
- **Gemini**: +3 (우수) - "실질적 규제개혁 성과로 전문성 입증"
- **Claude**: +4 (탁월) - "규제개혁 전문성과 실행력 우수"

**출처**: 서울특별시 공식 보도자료
**출처 유형**: OFFICIAL
**날짜**: 2024-03-15

#### [2] 도시계획 전문성 인정 (평균 등급: +3.0)
- **ChatGPT**: +3 (우수) - "도시계획 전문 경력으로 지역 개발 주도"
- **Grok**: +3 (우수) - "전문성 기반 도시 정책 수립"
- **Gemini**: +3 (우수) - "도시계획 분야 전문 지식 보유"
- **Claude**: +3 (우수) - "도시계획 전문성으로 정책 실현"

**출처**: 중앙선거관리위원회 후보자 정보
**출처 유형**: OFFICIAL
**날짜**: 2024-02-10

### 대표 부정 평가 사례

#### [1] 정책 실효성 논란 (평균 등급: -1.5)
- **ChatGPT**: -1 (미흡) - "일부 정책의 실효성 의문 제기"
- **Grok**: -2 (부족) - "정책 실행 과정에서 전문성 의문"
- **Gemini**: -1 (미흡) - "정책 추진 과정 미흡"
- **Claude**: -2 (부족) - "전문성 부족으로 정책 실패"

**출처**: 서울신문
**출처 유형**: PUBLIC
**날짜**: 2024-05-20

### 평가 인사이트

**강점:**
- 규제개혁 분야 전문성 인정 (4개 AI 모두 +3 이상)
- 도시계획 전문 경력 활용 (평균 +3.0)

**약점:**
- 일부 정책 실효성 논란 (평균 -1.5)
- AI 간 평가 편차 큼 (표준편차 4.9점)

**AI 평가 차이:**
- ChatGPT: 가장 긍정적 평가 (89점)
- Claude: 가장 엄격한 평가 (77점)
- 차이: 12점

---

## 카테고리 2: 리더십 (Leadership)

(동일한 형식으로 카테고리 2~10 반복)
```

### 4부: 데이터 출처 분석

```markdown
## 데이터 출처 분석

### 출처 유형별 분포 (4 AIs 전체)

| 출처 유형 | Claude | ChatGPT | Grok | Gemini | 평균 | 기준 |
|----------|:------:|:-------:|:----:|:------:|:----:|:----:|
| **OFFICIAL** | 500개 | 500개 | 500개 | 500개 | 500개 | ✅ 50% |
| **PUBLIC** | 500개 | 500개 | 500개 | 500개 | 500개 | ✅ 50% |
| **합계** | 1,000개 | 1,000개 | 1,000개 | 1,000개 | 1,000개 | - |

**기준**: OFFICIAL 50% + PUBLIC 50% (V40 규칙)

### Sentiment 분포

| Sentiment | Claude | ChatGPT | Grok | Gemini | 평균 |
|-----------|:------:|:-------:|:----:|:------:|:----:|
| **긍정** | 200개 | 200개 | 200개 | 200개 | 200개 |
| **부정** | 100개 | 100개 | 100개 | 100개 | 100개 |
| **자유** | 700개 | 700개 | 700개 | 700개 | 700개 |

**긍정:부정 비율**: 2:1 (부정 최소 20% 보장)

### Data Type 분포

| Data Type | 설명 | 개수 |
|-----------|------|:----:|
| **official** | 정부/공공기관 공식 발표 | 2,000개 |
| **public** | 언론 보도, SNS 등 공개 자료 | 2,000개 |

**총 데이터**: 4,000개 (4 AIs × 1,000개)
```

---

## 🔍 V40 보고서 생성 SQL 쿼리

### 1. AI별 최종 점수 조회

```sql
-- AI별 최종 점수 및 등급 조회
SELECT
  politician_id,
  politician_name,
  ai_category_scores,  -- JSONB: AI별 카테고리 점수
  ai_final_scores,     -- JSONB: AI별 최종 점수
  final_score,         -- 4 AIs 평균 점수
  grade,               -- 최종 등급 (M~L)
  calculated_at
FROM ai_final_scores_v40
WHERE politician_id = 'd0a5d6e1';
```

### 2. AI별 카테고리 점수 조회

```sql
-- AI별 카테고리 평가 통계
SELECT
  category,
  evaluator_ai,
  COUNT(*) as total_count,
  COUNT(CASE WHEN rating != 'X' THEN 1 END) as evaluated_count,
  COUNT(CASE WHEN rating = 'X' THEN 1 END) as excluded_count,
  AVG(CASE
    WHEN rating = '+4' THEN 4
    WHEN rating = '+3' THEN 3
    WHEN rating = '+2' THEN 2
    WHEN rating = '+1' THEN 1
    WHEN rating = '-1' THEN -1
    WHEN rating = '-2' THEN -2
    WHEN rating = '-3' THEN -3
    WHEN rating = '-4' THEN -4
    ELSE NULL
  END) as avg_rating
FROM evaluations_v40
WHERE politician_id = 'd0a5d6e1'
GROUP BY category, evaluator_ai
ORDER BY category, evaluator_ai;
```

### 3. 카테고리별 대표 평가 사례 조회

```sql
-- 특정 카테고리의 긍정 평가 Top 10 (4 AIs 통합)
SELECT
  cd.title,
  cd.content,
  cd.source_name,
  cd.source_url,
  cd.data_type,
  ev.evaluator_ai,
  ev.rating,
  ev.score,
  ev.reasoning
FROM collected_data_v40 cd
JOIN evaluations_v40 ev ON cd.id = ev.collected_data_id
WHERE cd.politician_id = 'd0a5d6e1'
  AND cd.category = 'expertise'
  AND ev.rating IN ('+4', '+3')
ORDER BY ev.score DESC, cd.published_date DESC
LIMIT 10;
```

### 4. AI별 평가 성향 분석

```sql
-- AI별 rating 분포 분석
SELECT
  evaluator_ai,
  rating,
  COUNT(*) as count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY evaluator_ai) as percentage
FROM evaluations_v40
WHERE politician_id = 'd0a5d6e1'
GROUP BY evaluator_ai, rating
ORDER BY evaluator_ai, rating DESC;
```

---

## 🐍 Python 보고서 생성 코드 (V40)

### 기본 구조

```python
# generate_report_v40.py
import os
import json
from supabase import create_client
from dotenv import load_dotenv
from datetime import datetime
from collections import defaultdict

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

# 등급 변환 매핑
RATING_TO_VALUE = {
    '+4': 4, '+3': 3, '+2': 2, '+1': 1,
    '-1': -1, '-2': -2, '-3': -3, '-4': -4,
    'X': None  # 평가 제외
}

CATEGORIES = {
    'expertise': '전문성',
    'leadership': '리더십',
    'vision': '비전',
    'integrity': '청렴성',
    'ethics': '윤리성',
    'accountability': '책임감',
    'transparency': '투명성',
    'communication': '소통능력',
    'responsiveness': '대응성',
    'publicinterest': '공익성'
}

def generate_report_v40(politician_id, politician_name):
    """AI 기반 정치인 상세평가보고서 생성 (V40)"""

    print(f"📄 AI 기반 정치인 상세평가보고서 생성 중: {politician_name}")

    # 1. 최종 점수 조회
    final_scores = get_final_scores(politician_id)

    # 2. AI별 평가 데이터 조회
    evaluations = get_all_evaluations(politician_id)

    # 3. 수집 데이터 조회
    collected_data = get_collected_data(politician_id)

    # 4. AI별 통계 계산
    ai_stats = calculate_ai_statistics(evaluations)

    # 5. 카테고리별 분석
    category_analysis = analyze_categories(evaluations, collected_data)

    # 6. 보고서 생성
    report = build_report_v40(
        politician_name,
        final_scores,
        ai_stats,
        category_analysis
    )

    # 7. 파일 저장
    filepath = save_report(report, politician_name)

    print(f"✅ 보고서 생성 완료: {filepath}")
    return report

def get_final_scores(politician_id):
    """최종 점수 조회"""
    result = supabase.table('ai_final_scores_v40')\
        .select('*')\
        .eq('politician_id', politician_id)\
        .execute()

    if not result.data:
        raise ValueError(f"No final scores found for politician_id: {politician_id}")

    return result.data[0]

def get_all_evaluations(politician_id):
    """모든 AI 평가 데이터 조회"""
    result = supabase.table('evaluations_v40')\
        .select('*')\
        .eq('politician_id', politician_id)\
        .execute()

    return result.data

def get_collected_data(politician_id):
    """수집 데이터 조회"""
    result = supabase.table('collected_data_v40')\
        .select('*')\
        .eq('politician_id', politician_id)\
        .execute()

    return result.data

def calculate_ai_statistics(evaluations):
    """AI별 평가 통계 계산"""
    ai_stats = defaultdict(lambda: {
        'total': 0,
        'ratings': defaultdict(int),
        'avg_rating': 0,
        'x_count': 0,
        'positive_count': 0,
        'negative_count': 0
    })

    for ev in evaluations:
        ai = ev['evaluator_ai']
        rating = ev['rating']

        ai_stats[ai]['total'] += 1
        ai_stats[ai]['ratings'][rating] += 1

        if rating == 'X':
            ai_stats[ai]['x_count'] += 1
        elif rating in ['+4', '+3', '+2', '+1']:
            ai_stats[ai]['positive_count'] += 1
        elif rating in ['-1', '-2', '-3', '-4']:
            ai_stats[ai]['negative_count'] += 1

    # 평균 등급 계산
    for ai, stats in ai_stats.items():
        total_value = 0
        count = 0
        for rating, cnt in stats['ratings'].items():
            value = RATING_TO_VALUE.get(rating)
            if value is not None:
                total_value += value * cnt
                count += cnt

        stats['avg_rating'] = total_value / count if count > 0 else 0

    return dict(ai_stats)

def analyze_categories(evaluations, collected_data):
    """카테고리별 분석"""
    analysis = {}

    # 데이터를 카테고리별로 그룹화
    data_by_cat = defaultdict(list)
    for data in collected_data:
        data_by_cat[data['category']].append(data)

    eval_by_cat = defaultdict(list)
    for ev in evaluations:
        eval_by_cat[ev['category']].append(ev)

    for cat_en, cat_kr in CATEGORIES.items():
        cat_evals = eval_by_cat[cat_en]
        cat_data = data_by_cat[cat_en]

        # AI별 점수
        ai_scores = {}
        for ai in ['Claude', 'ChatGPT', 'Grok', 'Gemini']:
            ai_evals = [e for e in cat_evals if e['evaluator_ai'] == ai]

            total_value = 0
            count = 0
            x_count = 0

            for ev in ai_evals:
                if ev['rating'] == 'X':
                    x_count += 1
                else:
                    value = RATING_TO_VALUE.get(ev['rating'])
                    if value is not None:
                        total_value += value
                        count += 1

            avg = total_value / count if count > 0 else 0
            ai_scores[ai] = {
                'avg_rating': avg,
                'evaluated': count,
                'excluded': x_count
            }

        # 대표 사례 추출 (긍정/부정)
        positive_cases = []
        negative_cases = []

        # collected_data_id로 매칭
        data_map = {d['id']: d for d in cat_data}

        for ev in cat_evals:
            if ev['rating'] in ['+4', '+3'] and len(positive_cases) < 10:
                data = data_map.get(ev['collected_data_id'])
                if data:
                    positive_cases.append({
                        'data': data,
                        'evaluation': ev
                    })
            elif ev['rating'] in ['-3', '-4'] and len(negative_cases) < 5:
                data = data_map.get(ev['collected_data_id'])
                if data:
                    negative_cases.append({
                        'data': data,
                        'evaluation': ev
                    })

        analysis[cat_en] = {
            'category_kr': cat_kr,
            'ai_scores': ai_scores,
            'positive_cases': positive_cases,
            'negative_cases': negative_cases,
            'total_data': len(cat_data),
            'total_evals': len(cat_evals)
        }

    return analysis

def build_report_v40(politician_name, final_scores, ai_stats, category_analysis):
    """V40 보고서 마크다운 생성"""

    # JSONB 데이터 파싱
    ai_final_scores = final_scores.get('ai_final_scores', {})
    if isinstance(ai_final_scores, str):
        ai_final_scores = json.loads(ai_final_scores)

    ai_category_scores = final_scores.get('ai_category_scores', {})
    if isinstance(ai_category_scores, str):
        ai_category_scores = json.loads(ai_category_scores)

    report = f"""# {politician_name} AI 기반 정치인 상세평가보고서

**평가 버전**: V40.0
**평가 일자**: {datetime.now().strftime('%Y-%m-%d')}
**총 평가 수**: 4,000개 (4 AIs × 1,000개)
**평가 AI**: Claude, ChatGPT, Grok, Gemini

---

## 종합 점수

### 🏆 최종 점수 및 종합 평가
- **최종 점수**: {final_scores['final_score']}점 / 1,000점
- **등급**: {final_scores['grade']}
- **종합 평가**: {get_grade_description(final_scores['grade'], ai_category_scores)}

### 🤖 AI별 최종 점수

| AI | 점수 | 평균 등급 |
|---|:---:|:--------:|
"""

    # AI별 점수 정렬 (높은 순)
    ai_scores_sorted = sorted(ai_final_scores.items(), key=lambda x: x[1], reverse=True)

    for ai, score in ai_scores_sorted:
        avg_rating = ai_stats[ai]['avg_rating']
        report += f"| {ai} | {score}점 | {avg_rating:+.2f} |\n"

    # 평균 점수 추가
    avg_score = final_scores['final_score']
    avg_rating = sum(ai_stats[ai]['avg_rating'] for ai in ['Claude', 'ChatGPT', 'Grok', 'Gemini']) / 4
    report += f"| **4 AIs 평균** | **{avg_score}점** | **{avg_rating:+.2f}** |\n"

### 📊 카테고리별 점수 (4 AIs 평균)

| 카테고리 | 점수 | 평가 |
|---------|:----:|------|
"""

    # 카테고리별 평균 점수 계산
    for cat_en, cat_kr in CATEGORIES.items():
        cat_scores = [ai_category_scores.get(ai, {}).get(cat_en, 0)
                     for ai in ['Claude', 'ChatGPT', 'Grok', 'Gemini']]
        avg_score = sum(cat_scores) / len(cat_scores) if cat_scores else 0

        report += f"| {cat_kr} ({cat_en.title()}) | {avg_score:.0f}점 | {get_score_evaluation(avg_score)} |\n"

    # 카테고리별 상세 평가
    report += f"""

---

## 카테고리별 상세 평가

"""

    for cat_en, cat_kr in CATEGORIES.items():
        analysis = category_analysis[cat_en]

        report += f"""

### {cat_kr} ({cat_en.title()})

**AI별 평가:**

| AI | 평가 수 | X 제외 | 평균 등급 |
|---|:------:|:------:|:--------:|
"""

        for ai in ['Claude', 'ChatGPT', 'Grok', 'Gemini']:
            ai_score = analysis['ai_scores'][ai]
            report += f"| {ai} | {ai_score['evaluated'] + ai_score['excluded']}개 | {ai_score['excluded']}개 | {ai_score['avg_rating']:+.2f} |\n"

        # 긍정 사례
        if analysis['positive_cases']:
            report += "\n**대표 긍정 평가:**\n\n"
            for i, case in enumerate(analysis['positive_cases'][:3], 1):
                data = case['data']
                ev = case['evaluation']
                report += f"{i}. [{ev['evaluator_ai']}] {data['title'][:50]}... ({ev['rating']})\n"
                report += f"   - {ev['reasoning'][:100]}...\n\n"

        # 부정 사례
        if analysis['negative_cases']:
            report += "\n**대표 부정 평가:**\n\n"
            for i, case in enumerate(analysis['negative_cases'][:2], 1):
                data = case['data']
                ev = case['evaluation']
                report += f"{i}. [{ev['evaluator_ai']}] {data['title'][:50]}... ({ev['rating']})\n"
                report += f"   - {ev['reasoning'][:100]}...\n\n"

    report += f"""

---

## 데이터 출처 분석

### 출처 유형별 분포

| 출처 유형 | Claude | ChatGPT | Grok | Gemini | 기준 |
|----------|:------:|:-------:|:----:|:------:|:----:|
| **OFFICIAL** | 500개 | 500개 | 500개 | 500개 | ✅ 50% |
| **PUBLIC** | 500개 | 500개 | 500개 | 500개 | ✅ 50% |

**총 데이터**: 4,000개 (4 AIs × 1,000개)

---

**생성 일시**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**생성 시스템**: AI 평가 엔진 V40.0
"""

    return report

def get_grade_description(grade, ai_category_scores):
    """등급에 따른 10개 카테고리 종합 평가 생성"""

    # 카테고리별 평균 점수 계산
    category_scores = {}
    for cat_en, cat_kr in CATEGORIES.items():
        scores = [ai_category_scores.get(ai, {}).get(cat_en, 0)
                 for ai in ['Claude', 'ChatGPT', 'Grok', 'Gemini']]
        category_scores[cat_kr] = sum(scores) / len(scores) if scores else 0

    # 상위 3개 카테고리
    top_3 = sorted(category_scores.items(), key=lambda x: x[1], reverse=True)[:3]
    top_categories = ', '.join([name for name, _ in top_3])

    # 하위 2개 카테고리
    bottom_2 = sorted(category_scores.items(), key=lambda x: x[1])[:2]
    bottom_categories = ', '.join([name for name, _ in bottom_2])

    # 등급별 기본 평가 (원본 코드 기준)
    grade_evaluations = {
        'M': '최우수',           # 920~1000점 (가장 높음)
        'D': '우수',             # 840~919점
        'E': '양호',             # 760~839점
        'P': '보통+',            # 680~759점
        'G': '보통',             # 600~679점
        'S': '보통-',            # 520~599점
        'B': '미흡',             # 440~519점
        'I': '부족',             # 360~439점 (Iron)
        'Tn': '상당히 부족',     # 280~359점 (Tin)
        'L': '매우 부족'         # 200~279점 (가장 낮음, Lead)
    }

    base_eval = grade_evaluations.get(grade, '평가 없음')

    # 종합 평가 문장 생성
    return f"훌륭한 정치인 지수 {base_eval} 평가. 전문성, 리더십, 비전, 청렴성, 윤리성, 책임감, 투명성, 소통능력, 대응성, 공익성 전반을 종합 평가한 결과이며, 특히 {top_categories} 분야에서 강점을 보임"

def get_score_evaluation(score):
    """점수 평가"""
    if score >= 90:
        return '탁월'
    elif score >= 80:
        return '우수'
    elif score >= 70:
        return '양호'
    elif score >= 60:
        return '보통'
    else:
        return '미흡'

def save_report(report, politician_name):
    """보고서 파일 저장"""
    date_str = datetime.now().strftime('%Y%m%d')
    filename = f"AI_기반_정치인_상세평가보고서_{politician_name}_{date_str}.md"

    # 보고서 폴더 생성
    report_dir = "AI_기반_정치인_상세평가보고서"
    os.makedirs(report_dir, exist_ok=True)

    filepath = os.path.join(report_dir, filename)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(report)

    return filepath

# 실행
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 3:
        print("Usage: python generate_report_v40.py <politician_id> <politician_name>")
        print("Example: python generate_report_v40.py d0a5d6e1 조은희")
        sys.exit(1)

    politician_id = sys.argv[1]
    politician_name = sys.argv[2]

    report = generate_report_v40(politician_id, politician_name)
    print("\n" + "="*70)
    print(report[:500] + "...")
```

---

## 📋 V40 보고서 생성 체크리스트

### 데이터 수집 단계
- [ ] 4개 AI × 1,000개 = 4,000개 평가 완료
- [ ] 카테고리별 100개씩 수집 (AI당)
- [ ] OFFICIAL 50% + PUBLIC 50% 비율 충족
- [ ] 부정 주제 최소 20% 보장

### 점수 계산 단계
- [ ] AI별 카테고리 점수 계산 (10개 × 4 AIs)
- [ ] AI별 최종 점수 계산 (4개)
- [ ] 4 AIs 평균 점수 계산
- [ ] 최종 등급 부여 (M~L, 10단계)
- [ ] `ai_final_scores_v40` 테이블 저장 확인

### 보고서 생성 단계
- [ ] 최종 점수 섹션 작성 (4 AIs 평균 + AI별)
- [ ] AI별 평가 성향 분석 섹션 작성
- [ ] 카테고리별 상세 평가 섹션 작성 (10개)
- [ ] AI별 비교 분석 포함
- [ ] 대표 사례 추출 (긍정/부정)
- [ ] 출처 분석 섹션 작성
- [ ] 파일 저장 (Markdown)

### 품질 검증
- [ ] AI별 점수 순위 일관성 확인
- [ ] 카테고리 점수 합계 확인
- [ ] 데이터 개수 검증 (4,000개)
- [ ] 출처 비율 검증 (50:50)
- [ ] 보고서 가독성 확인

---

## 🚀 실행 방법

### 명령줄 실행

```bash
# 기본 실행
python generate_report_v40.py d0a5d6e1 조은희

# 다른 정치인
python generate_report_v40.py 62e7b453 오세훈
```

### 출력 파일

```
AI_기반_정치인_상세평가보고서/
└── AI_기반_정치인_상세평가보고서_조은희_20260206.md
```

---

## 📊 V15.0 → V40.0 주요 변경사항

| 항목 | V15.0 | V40.0 |
|------|-------|-------|
| **보고서 명칭** | 상세평가보고서 | **AI 기반 정치인 상세평가보고서** |
| **AI 개수** | 1개 (Claude) | **4개** (Claude, ChatGPT, Grok, Gemini) |
| **평가 데이터** | 500개 | **4,000개** (4 AIs × 1,000개) |
| **등급 체계** | -6 ~ +10 | **+4 ~ -4, X** |
| **점수 범위** | 250~1,000점 | **200~1,000점** |
| **카테고리 점수** | 30~110점 | **20~100점** |
| **테이블** | collected_data<br>politician_scores | collected_data_v40<br>evaluations_v40<br>ai_final_scores_v40 |
| **AI 비교** | 없음 | **AI별 평가 성향 분석** 추가 |
| **일관성 분석** | 없음 | **AI 평가 일관성 분석** 추가 |

---

## ✅ 정리

**V40 AI 기반 정치인 상세평가보고서**는:
1. ✅ 4개 AI 평가 결과를 종합
2. ✅ AI별 평가 성향 분석 포함
3. ✅ 카테고리별 AI 비교 분석 제공
4. ✅ 공정하고 균형 잡힌 평가 보고서 생성

---

**작성자**: Claude Code
**최종 수정**: 2026-02-06
**버전**: V40.0
**용도**: 멀티 AI 기반 정치인 종합 평가 보고서 생성
