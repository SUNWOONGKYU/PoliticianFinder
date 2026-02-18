# Naver 데이터 수집 미달 원인 분석 - 박주민

**작성일**: 2026-02-12
**대상 정치인**: 박주민 (politician_id: 8c5dcc89)
**분석 범위**: collected_data_v40 테이블

---

## 1. 현재 수집 상태

### 전체 수집 현황 (collected_data_v40)

```
Total Collected: 1,000개 (10 categories × 100개)

Collector AI Breakdown:
- Gemini: 552개 (55.2%)
- Naver:  448개 (44.8%)

Status:
✅ 전체 1,000개 목표 달성
⚠️ Naver 50% 목표 미달 (448/500 = 89.6%)
```

### 카테고리별 Collector AI 분포

```
Category             Gemini  (%)    Naver  (%)    Total
==================== ======= ====== ====== ====== =====
accountability         37    37.8%    61   62.2%   98
communication          30    37.0%    51   63.0%   81
ethics                 90    79.6%    23   20.4%  113
expertise              39    40.6%    57   59.4%   96
integrity              99    79.2%    26   20.8%  125
leadership             29    34.9%    54   65.1%   83
publicinterest         44    44.9%    54   55.1%   98
responsiveness         73    84.9%    13   15.1%   86
transparency           55    50.0%    55   50.0%  110
vision                 56    50.9%    54   49.1%  110
==================== ======= ====== ====== ====== =====
TOTAL                 552    55.2%   448   44.8% 1000
```

### Naver 수집 데이터 타입 분포

```
⚠️ 심각한 문제 발견!

Expected (per category):
- OFFICIAL: 10개 (10%)
- PUBLIC:   40개 (40%)
- Total:    50개

Actual (all categories):
- OFFICIAL:  0개 (0%)   ← ❌ 완전 누락!
- PUBLIC:  448개 (100%) ← ⚠️ PUBLIC만 수집됨
- Total:   448개

Naver OFFICIAL 목표: 100개 (10 categories × 10)
Naver OFFICIAL 실제:   0개
```

**하지만!** 실제 URL 분석 결과:
```
Total Naver URLs: 448개
.go.kr domains: 109개 (24.3%)
Non-.go.kr:     339개 (75.7%)
```

**결론**: Naver가 109개의 .go.kr 도메인 데이터를 수집했지만, `data_type` 필드가 'OFFICIAL'이 아닌 'public'으로 잘못 저장됨!

---

## 2. 문제 원인 분석

### 원인 1: Naver OFFICIAL 수집 로직 누락 ⚠️⚠️⚠️

**발견된 문제**: `collect_with_ai()` 함수에서 Naver OFFICIAL 수집이 건너뛰어지고 있음

**코드 분석** (collect_v40.py:1149-1152):

```python
# Process OFFICIAL, then PUBLIC
for data_type in ['official', 'public']:
    type_count = ai_distribution.get(data_type, 0)
    if type_count == 0:
        continue  # ← 이 부분이 문제!
```

**문제 발생 메커니즘**:

1. `COLLECT_DISTRIBUTION` 정의 (Line 233-245):
   ```python
   COLLECT_DISTRIBUTION = {
       "Naver": {
           "official": 12,   # ← 12개로 설정되어 있음
           "public": 48,
           "total": 60
       }
   }
   ```

2. DB에 이미 public 데이터가 많이 있는 경우:
   - `existing_counts.get(('official', sentiment), 0)` 확인 (Line 1167)
   - 만약 DB에 이미 다른 방식으로 저장된 데이터가 있으면 MAX 도달로 판단
   - **또는** `ai_distribution.get('official', 0)`가 0을 반환하는 경우 건너뛰기

**가능한 시나리오**:

A. **MAX 도달 오판**: DB에 이미 .go.kr 도메인 데이터가 public으로 저장되어 있어, OFFICIAL 수집이 건너뛰어짐
B. **초기 수집 실패**: 첫 수집 시 OFFICIAL이 제대로 수집되지 않았고, 재수집 시에도 건너뛰어짐
C. **data_type 저장 오류**: 수집은 되었으나 DB 저장 시 data_type이 잘못 매핑됨

### 원인 2: Naver API 검색 결과 부족

**Naver OFFICIAL 수집 방식** (Line 824-826):

```python
if data_type == 'official':
    # OFFICIAL: webkr 우선, 부족하면 doc, encyc
    endpoints = ['webkr', 'doc', 'encyc']
```

**검색 쿼리** (Line 817-819):

```python
# For OFFICIAL, add site:.go.kr filter
if data_type == 'official':
    query += " site:go.kr"
```

**문제점**:

1. **검색 결과 부족**: 박주민 + 특정 키워드 + site:go.kr 조합 시 결과가 10개 미만일 가능성
2. **Naver API 한계**: .go.kr 도메인 인덱싱이 Gemini보다 약함
3. **관련성 필터 과다** (Line 883-886):
   ```python
   # 이름이 title/description에 없으면 제외
   name_in_text = actual_name in title or actual_name in description
   if not name_in_text:
       continue  # ← 너무 엄격한 필터링
   ```

### 원인 3: sentiment 배분 문제

**SENTIMENT_MAX 설정** (Line 290-293):

```python
"Naver": {
    "official": {"negative": 2, "positive": 2, "free": 8},  # 12개 (MAX)
    "public": {"negative": 10, "positive": 10, "free": 28}  # 48개 (MAX)
}
```

**실제 수집 프로세스** (Line 1160-1171):

```python
for topic_mode in ['negative', 'positive', 'free']:
    max_target = type_max.get(topic_mode, 0)
    if max_target == 0:
        continue

    existing = existing_counts.get((data_type, db_sentiment), 0)
    remaining = max_target - existing
    if remaining <= 0:
        print(f"MAX 도달 ({existing}/{max_target}), 건너뛰기")
        continue
```

**문제점**:

1. **negative/positive 수집 어려움**:
   - Naver OFFICIAL에서 negative 2개, positive 2개는 매우 적은 양
   - 공식 자료는 대부분 중립적(free)이므로 negative/positive 찾기 어려움

2. **MAX 도달 오류**:
   - 이미 public으로 저장된 .go.kr 데이터가 있으면 MAX 도달로 오판
   - OFFICIAL 수집이 건너뛰어짐

---

## 3. 데이터 품질 분석

### .go.kr 도메인 데이터의 data_type 오류

**발견 사항**:
```
Naver가 수집한 109개의 .go.kr 도메인 데이터가 모두 data_type='public'으로 저장됨
→ 이는 명백한 데이터 품질 오류!
```

**예상 원인**:

1. **call_naver_search()에서 data_type을 반환하지 않음**
   - Line 896-902: collected_item 생성 시 data_type 필드 누락
   ```python
   collected_item = {
       'title': title,
       'content': description,
       'source': endpoint_key.upper(),
       'source_url': link,
       'date': date_normalized or ''
       # ← data_type 필드 누락!
   }
   ```

2. **collect_with_ai()에서 data_type 파라미터 전달 실패**
   - Line 1225: `item.get('data_type', data_type)` 사용
   - item에 data_type이 없으면 함수 파라미터의 data_type 사용
   - 하지만 Naver API 응답에는 data_type이 없으므로 항상 함수 파라미터 사용해야 함

3. **하지만 실제 저장 시에는 제대로 전달됨**:
   - Line 1225에서 `item.get('data_type', data_type)` 사용
   - data_type 파라미터가 'official'이면 저장도 'official'이어야 함
   - **그런데 모두 'public'으로 저장됨 → OFFICIAL 수집 루프가 실행되지 않았다는 증거!**

---

## 4. 해결 방안

### 방안 1: 기존 .go.kr 데이터의 data_type 수정 (즉시 실행 가능) ✅

**목적**: 이미 수집된 109개 .go.kr 데이터를 OFFICIAL로 재분류

**실행 방법**:

```python
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# Step 1: .go.kr 도메인 데이터 조회
result = supabase.table('collected_data_v40')\
    .select('id, source_url')\
    .eq('politician_id', '8c5dcc89')\
    .eq('collector_ai', 'Naver')\
    .eq('data_type', 'public')\
    .execute()

# Step 2: .go.kr 도메인 필터링 및 OFFICIAL로 업데이트
count = 0
for row in result.data:
    if '.go.kr' in row['source_url']:
        supabase.table('collected_data_v40')\
            .update({'data_type': 'OFFICIAL'})\
            .eq('id', row['id'])\
            .execute()
        count += 1

print(f"Updated {count} items to OFFICIAL")
```

**기대 효과**:
- Naver OFFICIAL: 0개 → 109개
- Naver PUBLIC: 448개 → 339개
- Naver 전체: 448개 (변화 없음)

**한계**:
- 여전히 목표(100개, 10 categories × 10)에는 부족할 수 있음
- 카테고리별 분포가 불균등할 가능성

### 방안 2: Naver OFFICIAL 재수집 (근본 해결) ✅

**목적**: 부족한 OFFICIAL 데이터 추가 수집

**수정 필요 사항**:

1. **call_naver_search()에서 data_type 반환 추가**:
   ```python
   collected_item = {
       'title': title,
       'content': description,
       'source': endpoint_key.upper(),
       'source_url': link,
       'date': date_normalized or '',
       'data_type': data_type  # ← 추가!
   }
   ```

2. **collect_with_ai() MAX 체크 로직 개선**:
   ```python
   # 기존 수량 조회 시 data_type과 sentiment 모두 일치해야 함
   existing = existing_counts.get((data_type, db_sentiment), 0)
   # ← 현재 코드는 올바름, 문제는 OFFICIAL 루프가 실행 안 됨
   ```

3. **OFFICIAL 수집 강제 실행**:
   ```bash
   # 특정 카테고리만 재수집
   python collect_v40.py \
     --politician_id=8c5dcc89 \
     --politician_name="박주민" \
     --ai=Naver \
     --category=1  # expertise부터 시작
   ```

**기대 효과**:
- 카테고리당 10개 OFFICIAL 수집
- 총 100개 OFFICIAL 목표 달성
- Naver 전체: 448개 → 548개 (목표 500개 초과 달성)

### 방안 3: 관련성 필터 완화 (선택 사항) ⚠️

**현재 필터** (Line 883-886):
```python
name_in_text = actual_name in title or actual_name in description
if not name_in_text:
    continue  # ← 너무 엄격
```

**완화 방안**:
```python
# 당명 + 직책 조합도 허용
name_in_text = (
    actual_name in title or actual_name in description or
    (party_name in title and any(kw in title for kw in id_keywords))
)
if not name_in_text:
    continue
```

**주의**:
- 노이즈 데이터 증가 가능성
- 동명이인 혼입 위험
- 신중한 테스트 필요

### 방안 4: Naver API 엔드포인트 확대 (선택 사항)

**현재 OFFICIAL 엔드포인트** (Line 826):
```python
endpoints = ['webkr', 'doc', 'encyc']
```

**확대 방안**:
```python
# news 엔드포인트 추가 (site:go.kr 필터와 함께)
endpoints = ['webkr', 'doc', 'encyc', 'news']
```

**이유**:
- .go.kr 도메인의 보도자료도 OFFICIAL로 간주 가능
- 결과 다양성 증가

---

## 5. 권장 실행 순서

### Phase 1: 긴급 조치 (즉시 실행)

**1-1. 기존 데이터 재분류**
```bash
python fix_naver_official_data_type.py --politician_id=8c5dcc89
```

**예상 시간**: 1분
**효과**: OFFICIAL 0개 → 109개

### Phase 2: 재수집 (1시간 이내)

**2-1. 부족한 카테고리 확인**
```bash
python check_naver_official_by_category.py --politician_id=8c5dcc89
```

**2-2. 부족한 카테고리만 재수집**
```bash
for cat in {부족한 카테고리 번호들}; do
  python collect_v40.py \
    --politician_id=8c5dcc89 \
    --politician_name="박주민" \
    --ai=Naver \
    --category=$cat
done
```

**예상 시간**: 10-20분 (카테고리당 1-2분)
**효과**: OFFICIAL 109개 → 100개 목표 달성

### Phase 3: 검증 (최종 확인)

**3-1. 최종 상태 확인**
```bash
python check_evaluation_status.py --politician "박주민"
```

**3-2. 데이터 품질 검증**
```bash
python scripts/core/validate_v40_fixed.py \
  --politician_id=8c5dcc89 \
  --politician_name="박주민" \
  --no-dry-run
```

---

## 6. 예상 결과

### 수정 전 (현재)

```
Naver 전체: 448개 (목표 500개의 89.6%)
├── OFFICIAL: 0개 (목표 100개의 0%)
└── PUBLIC: 448개 (목표 400개의 112%)

문제:
❌ OFFICIAL 완전 누락
❌ PUBLIC 과다 수집 (112%)
```

### 수정 후 (Phase 1 완료)

```
Naver 전체: 448개 (목표 500개의 89.6%)
├── OFFICIAL: 109개 (목표 100개의 109%) ✅
└── PUBLIC: 339개 (목표 400개의 84.8%) ⚠️

개선:
✅ OFFICIAL 목표 초과 달성
⚠️ PUBLIC 약간 부족 (61개 부족)
```

### 수정 후 (Phase 2 완료)

```
Naver 전체: 509개 (목표 500개의 101.8%) ✅
├── OFFICIAL: 109개 (목표 100개의 109%) ✅
└── PUBLIC: 400개 (목표 400개의 100%) ✅

최종:
✅ 모든 목표 달성
✅ OFFICIAL/PUBLIC 비율 정상
```

---

## 7. 근본 원인 요약

### 핵심 문제 3가지

1. **Naver OFFICIAL 수집 루프가 실행되지 않음**
   - `collect_with_ai()` 함수에서 OFFICIAL이 건너뛰어짐
   - 원인: MAX 도달 오판 또는 초기 수집 실패

2. **수집된 .go.kr 데이터가 PUBLIC으로 잘못 저장됨**
   - 109개의 .go.kr 도메인 데이터가 모두 data_type='public'
   - 원인: OFFICIAL 수집 루프 미실행 → 모든 데이터가 PUBLIC 루프에서 수집됨

3. **Naver API 검색 결과 부족**
   - site:go.kr 필터링 시 결과가 적음
   - 관련성 필터가 너무 엄격함

### 해결 우선순위

1. **최우선**: 기존 .go.kr 데이터 재분류 (방안 1)
2. **필수**: Naver OFFICIAL 재수집 (방안 2)
3. **선택**: 관련성 필터 완화 (방안 3)
4. **선택**: 엔드포인트 확대 (방안 4)

---

## 8. 다음 단계

### 즉시 실행

1. 이 분석 보고서 검토
2. 방안 1 (재분류) 스크립트 작성 및 실행
3. 결과 확인

### 1시간 이내

4. 방안 2 (재수집) 실행
5. 최종 검증

### 장기 개선

6. collect_v40.py 코드 리뷰 및 개선
7. 자동화 워크플로우에 검증 단계 추가
8. 문서화 업데이트

---

**분석 완료일**: 2026-02-12
**분석자**: Claude Code (Backend Specialist)
