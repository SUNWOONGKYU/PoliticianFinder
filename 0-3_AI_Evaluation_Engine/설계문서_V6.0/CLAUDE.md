# CLAUDE.md - V24.0 AI 평가 엔진 작업 지침

**작성일**: 2025-11-21
**버전**: V24.0
**대상**: 모든 Claude Code 인스턴스

---

## 🎯 필수 작업 원칙

### 1. 설계문서 V5.0 기준 작업

**모든 Claude Code는 반드시 `설계문서_V5.0` 폴더의 문서를 기준으로 작업해야 합니다.**

### 2. V14.0 필수 참조 문서

#### 📖 V14.0 핵심 문서 (Claude Code용)
1. **`설계문서_V5.0/README.md`** - V14.0 자동화 아키텍처 개요
2. **`설계문서_V5.0/V13.0_작업지시서_전체_10개카테고리.md`** - 10개 카테고리 통합 작업지시서 (시스템 이해용)
3. **`설계문서_V5.0/V14.0_점수계산_알고리즘_FINAL.md`** - 최종 승인된 점수 계산 알고리즘
4. **`설계문서_V5.0/자동화_아키텍처_설계서.md`** - 전체 시스템 아키텍처
5. **`등급체계_10단계_200-1000점_V24.md`** - 🔴 **필독!** 최종 등급체계 (M=Mugunghwa, 80점 간격)

#### 📄 평가 인스트럭션 (Claude API용)
- **`instructions/` 폴더**: 카테고리별 개별 인스트럭션 파일
  - 예: `category_1_integrity.txt`, `category_2_expertise.txt` 등
  - 실제 데이터 수집 시 Claude API에 전달되는 평가 지침
  - 통합 작업지시서를 카테고리별로 분할한 실행용 파일

**역할 구분**:
- **Claude Code**: 통합 작업지시서를 읽고 전체 시스템 이해
- **Claude API**: `instructions/` 폴더의 개별 파일로 실제 평가 수행

---

## ⚠️ 금지 사항

1. **구버전 문서 참조 금지** - `설계문서_백업/`, `Archive/` 사용 금지
2. **임의의 알고리즘 변경 금지** - Prior 6.0, Coefficient 0.5 고정
3. **등급 범위 변경 금지** - A/B/C/D/E/F/G/H (8단계 알파벳) 고정
4. **메인에이전트의 데이터 생성 절대 금지** - Claude API만 데이터 생성
5. **🔴 CRITICAL: rating 저장 형식 위반 금지** - 반드시 알파벳 문자열로 저장, 숫자 변환 절대 금지

---

## 🗄️ DB 스키마 (필독!)

### collected_data 테이블
**Primary Key**: `collected_data_id`

**⚠️ 절대 주의 - 반복되는 오류 방지**:
- ❌ `id` 컬럼은 **존재하지 않습니다**
- ❌ `item_id` 컬럼은 **존재하지 않습니다**
- ✅ 모든 DELETE/UPDATE 작업 시 **`collected_data_id`** 사용 필수

### 🔴 CRITICAL: rating 컬럼 저장 형식

**V24.0 필수 규칙 - 절대 위반 금지**:

```python
# ✅ 올바른 저장 형식 (알파벳 문자열)
rating = 'A'  # 최고
rating = 'B'  # 우수
rating = 'C'  # 양호
rating = 'D'  # 보통
rating = 'E'  # 미흡
rating = 'F'  # 부족
rating = 'G'  # 상당히 부족
rating = 'H'  # 매우 부족

# ❌ 잘못된 저장 형식 (숫자) - 절대 금지!
rating = 8   # 금지
rating = 6   # 금지
rating = -2  # 금지
rating = -8  # 금지
```

**데이터 흐름**:
1. **Claude API 응답**: 알파벳 등급 ('A', 'B', 'C', ...)
2. **DB 저장**: 알파벳 그대로 저장 (변환 금지!)
3. **점수 계산 시에만**: 숫자로 변환 (A→8, B→6, ..., H→-8)

**collect_v24_final.py 핵심 로직**:
```python
# ✅ 올바른 예시
alphabet_rating = raw_rating.strip().upper()  # 'A', 'B', 'C', ...
item['rating'] = alphabet_rating  # 알파벳 그대로 저장

# ❌ 잘못된 예시 - 절대 사용 금지!
numeric_rating = ALPHABET_GRADES[raw_rating]  # 8, 6, 4, ...
item['rating'] = numeric_rating  # 숫자로 변환하여 저장 (금지!)
```

### 전체 컬럼 목록
```python
[
    'collected_data_id',  # PRIMARY KEY - 이것만 사용!
    'politician_id',
    'ai_name',
    'category_name',
    'item_num',
    'data_title',
    'data_content',
    'data_source',
    'source_url',
    'collection_date',
    'rating',
    'rating_rationale',
    'source_type'
]
```

### 올바른 사용 예시
```python
# ✅ 올바른 예시
result = supabase.table('collected_data').select('collected_data_id, item_num')
supabase.table('collected_data').delete().eq('collected_data_id', delete_id)

# ❌ 잘못된 예시 - 절대 사용 금지!
result = supabase.table('collected_data').select('id, item_num')  # 에러 발생
supabase.table('collected_data').delete().eq('id', delete_id)  # 에러 발생
supabase.table('collected_data').delete().eq('item_id', delete_id)  # 에러 발생
```

---

## 📋 V24.0 핵심 사양

### 알고리즘
```python
PRIOR = 6.0  # V24.0: 6.5 → 6.0 변경
COEFFICIENT = 0.5
RATING_GRADES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']  # 8단계 알파벳
ALPHABET_GRADES = {
    'A': 8, 'B': 6, 'C': 4, 'D': 2,
    'E': -2, 'F': -4, 'G': -6, 'H': -8
}
MODEL = "claude-3-5-haiku-20241022"  # Haiku 3.5
AI_NAME = "Claude"  # DB 저장 시 사용 (평가 주체 구분)
```

### AI 이름 규칙 (CRITICAL!)

**DB 저장 시 `ai_name` 필드 사용 규칙**:

```python
# ✅ 올바른 ai_name 값 (평가 주체 구분)
ai_name = "Claude"     # Claude 시스템 (Haiku, Sonnet, Opus 등 모든 모델 포함)
ai_name = "ChatGPT"    # ChatGPT 시스템
ai_name = "Grok"       # Grok 시스템
ai_name = "Gemini"     # Gemini 시스템

# ❌ 잘못된 예시 - 모델명을 넣지 마세요!
ai_name = "claude-3-5-haiku-20241022"  # 금지
ai_name = "gpt-4"                       # 금지
```

**규칙 요약**:
- `ai_name`은 **평가 주체(AI 에이전트)**를 구분
- 모델 버전이 바뀌어도 `ai_name`은 동일 유지
- 예: Haiku → Sonnet 변경 시에도 `ai_name = "Claude"`
- 목적: 다중 AI 평가 시 각 AI의 점수를 구분하여 저장

### 점수 계산

**📖 자세한 내용은 `V24_점수계산_알고리즘_상세가이드.md` 참조**

**3단계 프로세스**:
```
단계 1: 카테고리별 점수 (10개)
  1-1. DB에서 알파벳 등급 조회 (50개)
  1-2. 알파벳 → 숫자 변환 (A=8, B=6, ..., H=-8)
  1-3. 평균 계산 (합계 / 50)
  1-4. 점수 계산: (6.0 + 평균 × 0.5) × 10

단계 2: 총점 계산
  2-1. 10개 카테고리 점수 합산
  2-2. 상한 적용: min(총합, 1000)
  2-3. 반올림: round()

단계 3: 최종 등급 산정
  750~799점 → B (Bronze, 우수)
```

**공식**:
```python
# 카테고리 점수
category_score = (6.0 + avg_rating × 0.5) × 10

# 최종 점수
final_score = round(min(sum(10개 카테고리 점수), 1000))
```

**핵심 체크리스트**:
- [ ] 알파벳 → 숫자 변환은 **계산 시에만** 수행
- [ ] Prior 6.0, Coefficient 0.5 **고정**
- [ ] 반올림은 **마지막 단계**에서만 적용
- [ ] 상한 1000점 **반드시 적용**

### 점수 범위
- **카테고리 점수**: 20~100점 (Prior 6.0 기준)
- **최종 점수**: 200~1,000점
- **최종 등급**: M/D/E/P/G/S/B/I/Tn/L (10단계 금속)

### 🚀 병렬 처리 정책 (V24.0)

#### Claude API 설정
- **모델**: `claude-3-5-haiku-20241022` (Haiku 3.5)
- **Temperature**: 1.0
- **Max Tokens**: 8000
- **Rate Limits**:
  - 50 requests/min
  - 50,000 tokens/min

#### 병렬 처리 구조
```python
# collect_v24.py (기본 스크립트 - 병렬 처리)
정치인 1명 (10개 카테고리)
├── [그룹 1] 카테고리 1~5 (5개 동시 병렬 처리)
│   └── 각 카테고리: API 호출 4번 순차 처리
│       ├── 부정 주제 - OFFICIAL (5개, 최대 5회 재시도)
│       ├── 부정 주제 - PUBLIC (5개, 최대 5회 재시도)
│       ├── 자유 평가 - OFFICIAL (20개, 최대 5회 재시도)
│       └── 자유 평가 - PUBLIC (20개, 최대 5회 재시도)
│
└── [그룹 2] 카테고리 6~10 (5개 동시 병렬 처리)
    └── 각 카테고리: API 호출 4번 순차 처리 (동일)
```

#### 상세 수집 프로세스

**📖 자세한 내용은 `V24_수집지침_및_프로세스.md` 참조**

**요약**:
```
카테고리당 50개 = Phase 1 (부정 10개) + Phase 2 (자유 40개)

Phase 1: 부정 주제 10개 (최소 20% 보장)
├── Step 1: OFFICIAL 부정 5개 (공공기록/공식자료)
└── Step 2: PUBLIC 부정 5개 (언론보도/SNS)

Phase 2: 자유 평가 40개 (긍정+부정 혼합)
├── Step 3: OFFICIAL 자유 20개
└── Step 4: PUBLIC 자유 20개

결과: OFFICIAL 25개 (50%) + PUBLIC 25개 (50%)
```

**핵심 체크리스트**:
- [ ] Rating은 **알파벳 (A~H)** 그대로 저장
- [ ] OFFICIAL/PUBLIC 비율 **50:50** 유지
- [ ] 부정 주제 **최소 10개 (20%)** 보장
- [ ] 카테고리당 **50개 달성** 확인

#### 소요 시간 (1명 정치인)
- **순차 처리**: 약 7분 (10개 카테고리 × 40초)
- **병렬 처리**: 약 1.5분 (2그룹 × 40초) **← 5배 빠름**
- **전체 11명**: 약 16분 (병렬) vs 77분 (순차)

#### 사용법
```bash
# 병렬 처리 (기본 - 권장)
python collect_v24.py --politician_id=88aaecf2 --politician_name="나경원"

# 순차 처리 (디버깅/테스트 전용)
python collect_v24_sequential.py --politician_id=88aaecf2 --politician_name="나경원" --category=1
```

**실행 스크립트 구조**:
- **`collect_v24.py`**: 병렬 처리 (기본/권장) - 5개씩 2그룹, 자동 재수집
- **`collect_v24_sequential.py`**: 순차 처리 (디버깅/테스트 전용) - 단일 카테고리 수집
- **원칙**: 병렬 처리가 기본, 순차는 특수 목적 전용

### 데이터 수집 및 자동 재수집
- **카테고리당 목표**: 50개 (허용: 45~60개)
- **출처 비율**: OFFICIAL 50% + PUBLIC 50%
- **부정 주제**: 최소 20% (10개) 보장
- **중복 방지**: UNIQUE 제약 (politician_id, category_name, item_num)

#### 🔄 자동 재수집 로직 (CRITICAL!)
**`collect_v24.py`는 목표 미달 시 자동으로 재수집합니다**:

1. **1회차 수집**: 전체 10개 카테고리 수집 (5개씩 2그룹)
2. **상태 확인**: 각 카테고리 50개 달성 여부 DB 조회
3. **미달 시 재수집**: 50개 미달 카테고리가 있으면 자동으로 2회차 수집
4. **최대 5회 반복**: 모든 카테고리 50개 달성 또는 5회 도달까지 자동 반복
5. **자동 종료**: 목표 달성 또는 최대 횟수 도달 시 종료

**재수집 중 로직**:
- API 호출 레벨: 각 20개 수집 시 최대 5회 재시도
- 카테고리 레벨: 50개 미달 시 전체 재수집
- 프로세스 레벨: 최대 5회까지 전체 카테고리 재수집

**예시**:
```
1회차: 10개 카테고리 수집 → Accountability 30개 (미달)
2회차: 10개 카테고리 재수집 → Accountability 48개 (여전히 미달)
3회차: 10개 카테고리 재수집 → Accountability 52개 (달성!)
→ 모든 카테고리 50개 달성, 수집 완료
```

### 등급 시스템
- **등급 범위**: A, B, C, D, E, F, G, H (8단계 알파벳)
- **등급 값**: A(+8), B(+6), C(+4), D(+2), E(-2), F(-4), G(-6), H(-8)
- **등급 강제**: Instructions에 명시, B+/C+ 같은 잘못된 등급 생성 방지
- **카테고리 점수 범위**: 20 ~ 100점 (Prior 6.0 기준)
- **최종 점수 범위**: 200 ~ 1,000점 (상한 적용)
- **최종 등급**: M/D/E/P/G/S/B/I/Tn/L (10단계 금속)

---

## 📂 디렉토리 구조

```
0-3_AI_Evaluation_Engine/
├── CLAUDE.md
├── requirements.txt
├── scripts/
│   ├── collect_all_categories_v13.py
│   ├── calculate_scores_v13.py
│   ├── auto_complete_v13_workflow.py
│   └── split_instructions.py
├── 설계문서_V5.0/
├── instructions/
├── Database/
└── src/
    ├── main_orchestrator.py
    ├── data_collector_parallel.py
    └── score_calculator.py
```

---

## 🚀 실행 가이드

### 전체 자동 평가
```bash
python src/main_orchestrator.py --politician_id=1 --politician_name="오세훈"
```

---

## 📚 관련 문서

### 필수 참조 문서
- **`V24_수집지침_및_프로세스.md`**: 데이터 수집 프로세스 상세 가이드 ⭐
- **`V24_점수계산_알고리즘_상세가이드.md`**: 점수 계산 알고리즘 상세 설명 ⭐
- **`등급체계_10단계_200-1000점_V24.md`**: 등급 시스템 및 점수 범위
- **`instructions/`**: 카테고리별 평가 인스트럭션

### 참고 문서
- **`설계문서_V5.0/README.md`**: 전체 시스템 아키텍처
- **`Database/V15.0_AI_EVALUATION_TABLES.md`**: DB 스키마 상세

---

**최종 업데이트**: 2025-11-24
**버전**: V24.0

---

## 🔄 V24.0 주요 변경사항

1. **🔴 CRITICAL FIX: rating 저장 형식 변경**
   - **이전**: 숫자로 저장 (8, 6, -2, -8 등) ❌
   - **V24.0**: 알파벳 문자열로 저장 ('A', 'B', 'E', 'H' 등) ✅
   - **변환 위치**: 점수 계산 시에만 숫자 변환
   - **영향**: `collect_v24_final.py` Line 213, 344 수정

2. **Prior 값 변경**: 6.5 → 6.0
   - 카테고리 점수 범위: 25~105점 → 20~100점
   - 최종 점수 범위: 250~1,000점 → 200~1,000점
   - 변별력 향상을 위한 조정

3. **점수 반올림 적용**: `round()` 함수로 소수점 이하 반올림
   - 이전: 695.60점, 820.00점
   - V24.0: 696점, 820점

4. **등급 시스템 명확화**:
   - A/B/C/D/E/F/G/H (8단계) 확정
   - 등급 값: A(+8), B(+6), C(+4), D(+2), E(-2), F(-4), G(-6), H(-8)
