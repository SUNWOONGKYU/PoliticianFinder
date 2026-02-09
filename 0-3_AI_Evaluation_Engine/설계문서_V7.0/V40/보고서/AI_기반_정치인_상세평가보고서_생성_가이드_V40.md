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

## 📂 데이터 소스 위치

### DB vs JSON 파일

V40 시스템은 **2가지 데이터 저장 방식**을 사용합니다:

**1. 데이터베이스 (Supabase)**:
- `collected_data_v40` - 수집 데이터
- `evaluations_v40` - AI 평가 결과
- `ai_final_scores_v40` - 최종 점수
- **용도**: 대규모 쿼리, 통계 분석, 보고서 생성

**2. JSON 파일 (results/ 폴더)**:
- **용도**: AI 작업 결과 백업, 개별 검토, 재처리
- **위치**: `설계문서_V7.0/V40/results/evaluate/{AI이름}/{정치인이름}/`

### JSON 파일 구조

```
results/evaluate/
├── gemini/
│   └── 조은희/
│       ├── expertise_수집.json       (Gemini가 수집한 원본 자료)
│       ├── expertise_평가.json       (Gemini의 평가 결과)
│       ├── leadership_수집.json
│       ├── leadership_평가.json
│       └── ... (10개 카테고리 × 2)
├── chatgpt/
│   └── 조은희/
│       ├── expertise_수집.json
│       ├── expertise_평가.json
│       └── ...
├── grok/
│   └── 조은희/
└── claude/
    └── 조은희/
```

### 파일 형식

**{카테고리}_수집.json** (원본 자료):
```json
[
  {
    "title": "조은희 의원, 영유아보육법 개정안 대표 발의",
    "content": "서울시 영유아 보육 정책 전문가로서의 경험을 바탕으로...",
    "source": "국회 의안정보시스템",
    "source_url": "https://...",
    "date": "2024-05-15",
    "data_type": "official",
    "sentiment": "positive"
  }
]
```

**{카테고리}_평가.json** (AI 평가):
```json
{
  "evaluations": [
    {
      "id": "94632a73-ed4f-46eb-a7ec-19914797c5fe",
      "rating": "+3",
      "score": 6,
      "rationale": "영유아보육법 개정안 대표 발의로 정책 전문성 입증"
    }
  ]
}
```

### 10개 카테고리

1. **expertise** (전문성)
2. **leadership** (리더십)
3. **vision** (비전)
4. **integrity** (청렴성)
5. **ethics** (윤리성)
6. **accountability** (책임성)
7. **transparency** (투명성)
8. **communication** (소통능력)
9. **responsiveness** (대응성)
10. **publicinterest** (공익성)

### 보고서 생성 시 활용

**DB 우선 사용**:
- 점수 계산 → `ai_final_scores_v40`
- 통계 분석 → `evaluations_v40`
- 전체 데이터 조회 → `collected_data_v40`

**JSON 파일 참조**:
- 구체적 사례 인용 → `{카테고리}_수집.json`
- AI 평가 근거 확인 → `{카테고리}_평가.json`
- 특정 AI 데이터만 조회

⚠️ **주의**: JSON 파일은 백업용이므로, 보고서 자동 생성은 DB를 우선 사용합니다.

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

## 📄 V40 보고서 구성 요소 (8섹션 구조)

### 보고서 목차

```
# {정치인} AI 기반 정치인 상세평가보고서

1. 정치인 프로필                           (~30줄)
2. 평가 요약                               (~80줄)
3. 강점 분석 (TOP 3~5)              ★주력  (~180줄)
4. 약점 분석 (TOP 3)                ★주력  (~120줄)
5. 카테고리별 요약                         (~150줄)
6. 데이터 분석                             (~120줄)
7. 평가의 한계 및 유의사항                  (~50줄)
8. 참고자료 및 마무리                       (~60줄)

총: 약 790줄
```

### 섹션 1: 정치인 프로필

기본 정보, 주요 경력, 전문 분야, 정치적 특징

### 섹션 2: 평가 요약

```markdown
## 평가 요약

### 최종 점수 및 등급
- **최종 점수**: {점수}점 / 1,000점
- **등급**: {등급} ({등급명})

### 한 줄 평가
> **"{강점 카테고리} 분야에서 높은 AI 합의를 얻었으며, {약점 카테고리} 강화 시 종합 평가 상승 여지가 큼"**

### 핵심 인사이트
- (4개 AI 모두 합의한 강점/약점 카테고리)
- (AI 간 편차가 큰 카테고리 + 의미)
- (데이터 신뢰도 관련 핵심 사항)

### AI별 점수

| AI | 점수 |
|---|:---:|
| ChatGPT | {점수}점 |
| Grok | {점수}점 |
| Gemini | {점수}점 |
| Claude | {점수}점 |
| **4 AIs 평균** | **{점수}점** |

### 카테고리별 점수 (10개)

| 카테고리 | 점수 | 평가 |
|---------|:----:|------|
| {1위 카테고리} | {점수}점 | ⭐ 최고 |
...
| {10위 카테고리} | {점수}점 | ⚠️ 개선 필요 |

### 긍정/부정/X 비율
긍정: ████████████████████ {%}% ({개수}개)
부정: █ {%}% ({개수}개)
X:    ██ {%}% ({개수}개)
```

### 섹션 3: 강점 분석 (점수 기반, 뉴스 사례 X)

```markdown
## 강점 분석

### 강점 1: {카테고리명} ({점수}점) ⭐

#### 왜 강점인가
- 4개 AI 평균 {점수}점, 10개 카테고리 중 {N}위
- AI별 점수: ChatGPT {점수}점, Grok {점수}점, Gemini {점수}점, Claude {점수}점

#### AI 일치도
- 표준편차 {N}점 (해석)
- 최고 AI: {AI명} ({점수}점), 최저 AI: {AI명} ({점수}점)

#### 긍정/부정 비율
- 긍정 {%}%, 부정 {%}%, X {%}%

#### 핵심 강점 요인
{3~5문장 패턴 서술. 점수가 높은 이유를 패턴으로 분석. 개별 뉴스 제목 인용 금지}

#### 강화 방향 ⭐
1. {전략1}: 실행 방법 + 기대 효과
2. {전략2}: 실행 방법 + 기대 효과
3. {전략3}: 실행 방법 + 기대 효과

(강점 2~5 동일 구조)
```

### 섹션 4: 약점 분석 (점수 기반, 뉴스 사례 X)

```markdown
## 약점 분석

### 약점 1: {카테고리명} ({점수}점) ⚠️

#### 왜 약점인가
- 4개 AI 평균 {점수}점, 10개 카테고리 중 하위 {N}위
- AI별 점수: ChatGPT {점수}점, Grok {점수}점, Gemini {점수}점, Claude {점수}점

#### AI 평가 편차
- 표준편차 {N}점 (해석)

#### 부정 비율
- 긍정 {%}%, 부정 {%}%, X {%}%

#### 핵심 약점 요인
{3~5문장 패턴 서술. 점수가 낮은 이유를 패턴으로 분석. 개별 뉴스 제목 인용 금지}

#### 개선 방향 ⭐
1. {방안1}: 실행 방법 + 기대 효과
2. {방안2}: 실행 방법 + 기대 효과
3. {방안3}: 실행 방법 + 기대 효과

(약점 2~3 동일 구조)
```

### 섹션 5: 카테고리별 요약 (축소, 카테고리당 15줄)

```markdown
## 카테고리별 요약

### 5.1 {카테고리명} ({점수}점)

| AI | 점수 | 평가 |
|---|:----:|------|
| ChatGPT | {점수}점 | {평가} |
| Grok | {점수}점 | {평가} |
| Gemini | {점수}점 | {평가} |
| Claude | {점수}점 | {평가} |
| **평균** | **{점수}점** | **{평가}** |

**종합 평가**: {1~2문장}
**핵심 포인트**: - {포인트1} - {포인트2}

(5.2 ~ 5.10 동일 구조)
```

### 섹션 6: 데이터 분석 (출처 분석 통합!)

```markdown
## 데이터 분석

### 6.1 긍정/부정/X 분포

| 구분 | 개수 | 비율 |
|------|:----:|:----:|
| 긍정 | {개수}개 | {%} |
| 부정 | {개수}개 | {%} |
| X (제외) | {개수}개 | {%} |
| **총합** | **{개수}개** | **100%** |

카테고리별 긍정/부정 분포 표

### 6.2 데이터 출처 분석

| 유형 | 개수 | 비율 |
|------|:----:|:----:|
| OFFICIAL | {개수} | {%} |
| PUBLIC | {개수} | {%} |

AI별 수집 특성 표

### 6.3 데이터 품질

- 총 수집: {개수}개
- 유효 평가 (X 제외): {개수}개 ({%})
- 평가 제외 (X): {개수}개 ({%})
```

### 섹션 7: 평가의 한계 및 유의사항

데이터 수집 한계, AI 평가 한계, 이용 시 유의사항

### 섹션 8: 참고자료 및 마무리

평가 시스템 설명, 등급 체계, 핵심 메시지, 다음 단계 제안

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
    """V40 보고서 마크다운 생성 (V40.1 - 8섹션 구조)"""

    import statistics

    # JSONB 데이터 파싱
    ai_final_scores = final_scores.get('ai_final_scores', {})
    if isinstance(ai_final_scores, str):
        ai_final_scores = json.loads(ai_final_scores)

    ai_category_scores = final_scores.get('ai_category_scores', {})
    if isinstance(ai_category_scores, str):
        ai_category_scores = json.loads(ai_category_scores)

    # 카테고리별 평균 점수 계산 (정렬용)
    cat_avg_scores = {}
    for cat_en, cat_kr in CATEGORIES.items():
        scores = [ai_category_scores.get(ai, {}).get(cat_en, 0)
                 for ai in ['Claude', 'ChatGPT', 'Grok', 'Gemini']]
        cat_avg_scores[cat_en] = {
            'avg': sum(scores) / len(scores) if scores else 0,
            'scores': scores,
            'stdev': statistics.stdev(scores) if len(scores) > 1 else 0,
            'kr': cat_kr
        }

    # 점수 높은 순/낮은 순 정렬
    sorted_by_score = sorted(cat_avg_scores.items(), key=lambda x: x[1]['avg'], reverse=True)
    top_categories = sorted_by_score[:5]    # 강점 TOP 5
    bottom_categories = sorted_by_score[-3:]  # 약점 TOP 3

    top_names = ', '.join([cat_avg_scores[c]['kr'] for c, _ in top_categories[:3]])
    bottom_names = ', '.join([cat_avg_scores[c]['kr'] for c, _ in bottom_categories])

    # === 섹션 1: 정치인 프로필 ===
    report = f"""# {politician_name} AI 기반 정치인 상세평가보고서

**평가 버전**: V40.0
**평가 일자**: {datetime.now().strftime('%Y-%m-%d')}
**총 평가 수**: 4,000개 (4 AIs × 1,000개)
**평가 AI**: Claude, ChatGPT, Grok, Gemini

---

## 1. 정치인 프로필

(정치인 기본 정보, 경력, 전문 분야 - DB politicians 테이블에서 조회)

---

"""

    # === 섹션 2: 평가 요약 ===
    report += f"""## 2. 평가 요약

### 최종 점수 및 등급
- **최종 점수**: **{final_scores['final_score']}점** / 1,000점
- **등급**: **{final_scores['grade']}**
- **종합 평가**: {get_grade_description(final_scores['grade'], ai_category_scores)}

### 한 줄 평가
> **"{top_names} 분야에서 높은 AI 합의를 얻었으며, {bottom_names} 강화 시 종합 평가 상승 여지가 큼"**

### 핵심 인사이트
- (4개 AI 합의/편차 분석 - 자동 생성 필요)
- (AI 간 편차가 큰 카테고리 분석 - 자동 생성 필요)
- (데이터 신뢰도 관련 핵심 사항 - 자동 생성 필요)

### AI별 점수

| AI | 점수 | 평균 등급 |
|---|:---:|:--------:|
"""

    ai_scores_sorted = sorted(ai_final_scores.items(), key=lambda x: x[1], reverse=True)
    for ai, score in ai_scores_sorted:
        avg_rating = ai_stats[ai]['avg_rating']
        report += f"| {ai} | {score}점 | {avg_rating:+.2f} |\n"

    avg_score = final_scores['final_score']
    avg_rating = sum(ai_stats[ai]['avg_rating'] for ai in ['Claude', 'ChatGPT', 'Grok', 'Gemini']) / 4
    report += f"| **4 AIs 평균** | **{avg_score}점** | **{avg_rating:+.2f}** |\n"

    # 카테고리별 점수 표
    report += "\n### 카테고리별 점수 (10개)\n\n"
    report += "| 카테고리 | 점수 | 평가 |\n"
    report += "|---------|:----:|------|\n"

    for cat_en, info in sorted_by_score:
        report += f"| {info['kr']} ({cat_en.title()}) | {info['avg']:.0f}점 | {get_score_evaluation(info['avg'])} |\n"

    # 긍정/부정/X 비율
    total_positive = sum(ai_stats[ai]['positive_count'] for ai in ai_stats)
    total_negative = sum(ai_stats[ai]['negative_count'] for ai in ai_stats)
    total_x = sum(ai_stats[ai]['x_count'] for ai in ai_stats)
    total_all = sum(ai_stats[ai]['total'] for ai in ai_stats)

    pos_pct = total_positive / total_all * 100 if total_all > 0 else 0
    neg_pct = total_negative / total_all * 100 if total_all > 0 else 0
    x_pct = total_x / total_all * 100 if total_all > 0 else 0

    report += f"""
### 긍정/부정/X 비율

긍정: {'█' * int(pos_pct / 5)} {pos_pct:.1f}% ({total_positive}개)
부정: {'█' * max(1, int(neg_pct / 5))} {neg_pct:.1f}% ({total_negative}개)
X:    {'█' * max(1, int(x_pct / 5))} {x_pct:.1f}% ({total_x}개)

---

"""

    # === 섹션 3: 강점 분석 (점수 기반, 뉴스 사례 X) ===
    report += "## 3. 강점 분석\n\n"

    for rank, (cat_en, info) in enumerate(top_categories, 1):
        cat_kr = info['kr']
        avg = info['avg']
        stdev = info['stdev']
        scores = info['scores']  # [Claude, ChatGPT, Grok, Gemini]
        ai_names = ['Claude', 'ChatGPT', 'Grok', 'Gemini']

        max_idx = scores.index(max(scores))
        min_idx = scores.index(min(scores))

        # 카테고리별 긍정/부정 비율 계산
        analysis = category_analysis[cat_en]
        cat_total = analysis['total_evals']
        cat_pos = sum(1 for e in [c['evaluation'] for c in analysis['positive_cases']])
        cat_neg = sum(1 for e in [c['evaluation'] for c in analysis['negative_cases']])

        report += f"""### 강점 {rank}: {cat_kr} ({avg:.0f}점) ⭐

#### 왜 강점인가
- 4개 AI 평균 {avg:.0f}점, 10개 카테고리 중 {rank}위
- AI별 점수: {', '.join([f'{ai_names[i]} {scores[i]:.0f}점' for i in range(4)])}

#### AI 일치도
- 표준편차 {stdev:.1f}점
- 최고 AI: {ai_names[max_idx]} ({scores[max_idx]:.0f}점)
- 최저 AI: {ai_names[min_idx]} ({scores[min_idx]:.0f}점)
- 차이: {scores[max_idx] - scores[min_idx]:.0f}점

#### 핵심 강점 요인
(카테고리 점수와 AI 일치도를 종합한 분석 서술)

#### 강화 방향 ⭐
1. (전략 1: 실행 방법 + 기대 효과)
2. (전략 2: 실행 방법 + 기대 효과)
3. (전략 3: 실행 방법 + 기대 효과)

"""

    report += "---\n\n"

    # === 섹션 4: 약점 분석 ===
    report += "## 4. 약점 분석\n\n"

    for rank, (cat_en, info) in enumerate(bottom_categories, 1):
        cat_kr = info['kr']
        avg = info['avg']
        stdev = info['stdev']
        scores = info['scores']
        ai_names = ['Claude', 'ChatGPT', 'Grok', 'Gemini']

        max_idx = scores.index(max(scores))
        min_idx = scores.index(min(scores))

        report += f"""### 약점 {rank}: {cat_kr} ({avg:.0f}점) ⚠️

#### 왜 약점인가
- 4개 AI 평균 {avg:.0f}점, 10개 카테고리 중 하위
- AI별 점수: {', '.join([f'{ai_names[i]} {scores[i]:.0f}점' for i in range(4)])}

#### AI 평가 편차
- 표준편차 {stdev:.1f}점
- 최고 AI: {ai_names[max_idx]} ({scores[max_idx]:.0f}점)
- 최저 AI: {ai_names[min_idx]} ({scores[min_idx]:.0f}점)
- 차이: {scores[max_idx] - scores[min_idx]:.0f}점

#### 핵심 약점 요인
(카테고리 점수와 AI 편차를 종합한 분석 서술)

#### 개선 방향 ⭐
1. (방안 1: 실행 방법 + 기대 효과)
2. (방안 2: 실행 방법 + 기대 효과)
3. (방안 3: 실행 방법 + 기대 효과)

"""

    report += "---\n\n"

    # === 섹션 5: 카테고리별 요약 ===
    report += "## 5. 카테고리별 요약\n\n"

    for idx, (cat_en, cat_kr) in enumerate(CATEGORIES.items(), 1):
        info = cat_avg_scores[cat_en]
        scores = info['scores']
        ai_names = ['Claude', 'ChatGPT', 'Grok', 'Gemini']

        report += f"### 5.{idx} {cat_kr} ({info['avg']:.0f}점)\n\n"
        report += "| AI | 점수 | 평가 |\n"
        report += "|---|:----:|------|\n"

        for i, ai in enumerate(ai_names):
            report += f"| {ai} | {scores[i]:.0f}점 | {get_score_evaluation(scores[i])} |\n"

        report += f"| **평균** | **{info['avg']:.0f}점** | **{get_score_evaluation(info['avg'])}** |\n\n"
        report += f"**종합 평가**: (이 카테고리에 대한 1~2문장 핵심 평가)\n\n"

    report += "---\n\n"

    # === 섹션 6: 데이터 분석 ===
    report += f"""## 6. 데이터 분석

### 6.1 긍정/부정/X 분포

| 구분 | 개수 | 비율 |
|------|:----:|:----:|
| 긍정 평가 | {total_positive}개 | {pos_pct:.1f}% |
| 부정 평가 | {total_negative}개 | {neg_pct:.1f}% |
| 평가 제외 (X) | {total_x}개 | {x_pct:.1f}% |
| **총합** | **{total_all}개** | **100%** |

### 6.2 데이터 출처 분석

| AI | 총 수집 | OFFICIAL | PUBLIC |
|---|:------:|:--------:|:------:|
"""

    for ai in ['Claude', 'ChatGPT', 'Grok', 'Gemini']:
        total = ai_stats[ai]['total']
        report += f"| {ai} | {total}개 | (조회 필요) | (조회 필요) |\n"

    report += f"""
### 6.3 데이터 품질

- **총 수집 데이터**: {total_all}개
- **유효 평가 (X 제외)**: {total_all - total_x}개 ({(total_all - total_x) / total_all * 100:.1f}%)
- **평가 제외 (X)**: {total_x}개 ({x_pct:.1f}%)

---

"""

    # === 섹션 7: 평가의 한계 및 유의사항 ===
    report += """## 7. 평가의 한계 및 유의사항

### 데이터 수집 한계
1. **수집 기간 제한**: OFFICIAL 최근 4년, PUBLIC 최근 1년
2. **데이터 소스 제한**: AI 검색 결과에 의존

### AI 평가 한계
1. **주관성**: AI도 학습 데이터에 따른 편향 존재 가능 (4개 AI 평균으로 완화)
2. **맥락 이해**: 정치적 배경을 완전히 파악하지 못할 수 있음

### 이용 시 유의사항
1. 이 보고서는 **참고 자료**입니다.
2. **여론조사가 아닙니다**. 긍정/부정 비율은 시민 여론과 다를 수 있습니다.
3. **법적 판단이 아닙니다**. 논란/의혹은 법적 유무죄와 무관합니다.
4. **실시간 업데이트 안 됨**. 평가 일자 이후 활동은 미반영입니다.

---

"""

    # === 섹션 8: 참고자료 및 마무리 ===
    report += f"""## 8. 참고자료 및 마무리

### 평가 시스템
- 4개 AI가 각각 독립적으로 수집 (카테고리당 100개, AI당)
- 수집 채널 ≠ 평가 AI (객관성 확보)
- Rating: +4 ~ -4, X (제외)
- 카테고리 점수 = (평균 Rating × 0.5 + 6.0) × 10
- 최종 점수 = 10개 카테고리 점수 합산

### 핵심 메시지
1. **강점 ({top_names})**은 최상위 수준입니다. 이를 더욱 강화하세요.
2. **약점 ({bottom_names})**은 즉시 개선 가능합니다.

### 다음 단계
- [ ] 강점 TOP의 "강화 방향" 실행 계획 수립
- [ ] 약점 TOP의 "개선 방향" 즉시 착수
- [ ] 6개월 후 재평가 실시하여 개선 진척도 측정

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
- [ ] OFFICIAL 40% + PUBLIC 60% 비율 충족
- [ ] 부정 주제 최소 20% 보장

### 점수 계산 단계
- [ ] AI별 카테고리 점수 계산 (10개 × 4 AIs)
- [ ] AI별 최종 점수 계산 (4개)
- [ ] 4 AIs 평균 점수 계산
- [ ] 최종 등급 부여 (M~L, 10단계)
- [ ] `ai_final_scores_v40` 테이블 저장 확인

### 보고서 생성 단계 (8섹션)
- [ ] 섹션 1: 정치인 프로필 작성
- [ ] 섹션 2: 평가 요약 작성 (점수 + 등급 + 한 줄 평가 + 핵심 인사이트 + 카테고리 표 + 비율)
- [ ] 섹션 3: 강점 분석 작성 (점수 기반 TOP 3~5, 뉴스 사례 X)
- [ ] 섹션 4: 약점 분석 작성 (점수 기반 TOP 3, 뉴스 사례 X)
- [ ] 섹션 5: 카테고리별 요약 작성 (10개 × 15줄, 축소)
- [ ] 섹션 6: 데이터 분석 작성 (긍정/부정/X + 출처 통합 + 품질)
- [ ] 섹션 7: 한계 및 유의사항 작성
- [ ] 섹션 8: 참고자료 및 마무리 작성
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
**최종 수정**: 2026-02-09
**버전**: V40.1 (8섹션 구조 개선)
**용도**: 멀티 AI 기반 정치인 종합 평가 보고서 생성
