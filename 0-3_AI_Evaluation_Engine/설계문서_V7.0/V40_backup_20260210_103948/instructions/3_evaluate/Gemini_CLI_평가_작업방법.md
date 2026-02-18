# Gemini CLI 평가 가이드 (V40 범용)

**모든 정치인에 사용 가능한 범용 가이드**
플레이스홀더 `{...}` 부분만 치환하여 사용하세요.

---

## 1. 개요

V40에서 Gemini CLI는 4개 평가 AI 중 하나입니다.
수집된 데이터(풀링 풀)를 평가하여 등급(rating)을 매깁니다.

### 역할 분담

| 역할 | 수행자 | 내용 |
|------|--------|------|
| 평가 데이터 조회 | Claude Code (헬퍼 스크립트) | 미평가 데이터 목록 추출, DB 저장 |
| 등급 평가 | Gemini CLI | 데이터를 읽고 등급/근거 판정 |
| 프롬프트 전달 | 사용자 또는 오케스트레이터 | 프롬프트 + 데이터를 Gemini CLI에 복사/붙여넣기 |

### 등급 체계

| rating | score | 의미 |
|--------|-------|------|
| +4 | +8점 | 탁월 |
| +3 | +6점 | 우수 |
| +2 | +4점 | 양호 |
| +1 | +2점 | 보통 |
| -1 | -2점 | 미흡 |
| -2 | -4점 | 부족 |
| -3 | -6점 | 심각 |
| -4 | -8점 | 최악 |
| X | 0점 | 제외 (10년+과거/동명이인/무관/날조) |

**주의**: 이 헬퍼는 rating(등급)만 저장합니다. score 계산은 `calculate_v40_scores.py`의 단독 책임입니다.

---

## 2. 사전 준비

### 작업 디렉토리

```bash
cd C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/scripts
```

### 필요 파일

| 파일 | 경로 (V40 기준) | 용도 |
|------|----------------|------|
| 정치인 정보 | `instructions/1_politicians/{이름}.md` | 이름, 정당, 직책, 지역구 |
| 평가 기준 (카테고리별) | `instructions/3_evaluate/cat{번호}_{카테고리}.md` | 등급 판정 기준 |
| 평가 헬퍼 스크립트 | `scripts/helpers/gemini_eval_helper.py` | DB 조회/저장 |

### 카테고리 목록

| # | 영문명 | 한글명 | 평가 기준 파일 |
|---|--------|--------|--------------|
| 01 | expertise | 전문성 | cat01_expertise.md |
| 02 | leadership | 리더십 | cat02_leadership.md |
| 03 | vision | 비전 | cat03_vision.md |
| 04 | integrity | 청렴성 | cat04_integrity.md |
| 05 | ethics | 윤리성 | cat05_ethics.md |
| 06 | accountability | 책임감 | cat06_accountability.md |
| 07 | transparency | 투명성 | cat07_transparency.md |
| 08 | communication | 소통능력 | cat08_communication.md |
| 09 | responsiveness | 대응성 | cat09_responsiveness.md |
| 10 | publicinterest | 공익성 | cat10_publicinterest.md |

---

## 3. 평가 프로세스 (카테고리별 반복)

### Step 1: 미평가 데이터 조회 (Claude Code 터미널)

```bash
python helpers/gemini_eval_helper.py fetch \
  --politician_id={POLITICIAN_ID} \
  --politician_name={POLITICIAN_NAME} \
  --category={CATEGORY_EN}
```

**출력 내용:**
- `need_evaluation` → 미평가 데이터 개수
- `items` → 평가 대상 데이터 배열 (id, title, content, source_url, collector_ai, sentiment 등)

**주의**: `items` 배열이 클 경우 여러 번에 나눠서 평가합니다. 한 번에 50~100개 권장.

### Step 2: 프롬프트 조립 + Gemini CLI에 입력

1. 아래 **섹션 4의 범용 프롬프트 템플릿** 복사
2. `{...}` 플레이스홀더 치환
3. `[여기에 items 배열 붙여넣기]` 자리에 Step 1의 `items` 배열 붙여넣기
4. 완성된 프롬프트를 Gemini CLI에 입력

### Step 3: 결과 JSON 파일 저장

Gemini CLI가 출력한 JSON을 다음 경로에 저장:
```
V40/results/evaluate/gemini_eval_result_{CATEGORY_EN}.json
```

### Step 4: DB 저장 (Claude Code 터미널)

```bash
python helpers/gemini_eval_helper.py save \
  --politician_id={POLITICIAN_ID} \
  --politician_name={POLITICIAN_NAME} \
  --category={CATEGORY_EN} \
  --input=../results/evaluate/gemini_eval_result_{CATEGORY_EN}.json
```

### Step 5: 현황 확인

```bash
python helpers/gemini_eval_helper.py status \
  --politician_id={POLITICIAN_ID}
```

**DONE 기준**: 수집 데이터 전체가 평가 완료

---

## 4. 범용 프롬프트 템플릿 (Gemini CLI 붙여넣기용)

### 플레이스홀더 치환 방법

| 플레이스홀더 | 예시 (박주민) | 출처 |
|-------------|-------------|------|
| `{POLITICIAN_NAME}` | 박주민 | `1_politicians/박주민.md` |
| `{POLITICIAN_PARTY}` | 더불어민주당 | `1_politicians/박주민.md` |
| `{POLITICIAN_POSITION}` | 국회의원 3선 | `1_politicians/박주민.md` |
| `{POLITICIAN_DISTRICT}` | 서울 은평구 갑 | `1_politicians/박주민.md` |
| `{CATEGORY_NUM}` | 01 | 카테고리 목록 표 |
| `{CATEGORY_EN}` | expertise | 카테고리 목록 표 |
| `{CATEGORY_KR}` | 전문성 | 카테고리 목록 표 |

---

### 평가 프롬프트

```
너는 정치인 평가 AI야. instruction 파일의 평가 기준을 읽고 데이터를 평가해라.

## 대상 정치인
- 이름: {POLITICIAN_NAME}
- 정당: {POLITICIAN_PARTY}
- 직책: {POLITICIAN_POSITION}
- 지역구: {POLITICIAN_DISTRICT}

## 카테고리: {CATEGORY_EN} ({CATEGORY_KR})

## 평가 기준 (instruction 파일 참조 - 반드시 읽어라)

**파일 위치:**
설계문서_V7.0/V40/instructions/3_evaluate/cat{CATEGORY_NUM}_{CATEGORY_EN}.md

**작업:**
1. 위 파일에서 등급 판정 기준을 읽어라
2. 아래 데이터를 하나씩 읽고, 기준에 따라 등급(rating)을 매겨라
3. 각 데이터마다 rating과 rationale(한국어 1문장 근거)을 작성해라

## 등급 체계 (rating → score)

+4 → +8점 (탁월: 해당 카테고리에서 매우 뛰어난 성과/증거)
+3 → +6점 (우수: 해당 카테고리에서 뚜렷한 강점)
+2 → +4점 (양호: 해당 카테고리에서 긍정적 활동)
+1 → +2점 (보통: 기본적인 활동, 특별할 것 없음)
-1 → -2점 (미흡: 소극적이거나 기대 이하)
-2 → -4점 (부족: 명확한 문제점, 비판 근거 있음)
-3 → -6점 (심각: 중대한 문제, 논란)
-4 → -8점 (최악: 심각한 위반, 범법, 대형 스캔들)
X  → 0점  (제외: 10년+과거 자료 / 동명이인 / 해당 카테고리 무관 / 날조·조작)

## 평가 원칙
- {POLITICIAN_NAME}이(가) **주인공**인 자료만 유효 평가 (단순 언급은 X)
- 동명이인(다른 소속·직업·지역) 자료는 반드시 X 처리
- 해당 카테고리({CATEGORY_KR})와 관련 없는 자료는 X 처리
- rating은 반드시 "+4", "+3", "+2", "+1", "-1", "-2", "-3", "-4", "X" 중 하나
- rationale은 한국어 1문장 (최대 50자)
- **모든 item을 빠짐없이 평가** (건너뛰기 금지)

## 평가할 데이터

[여기에 items 배열 붙여넣기]

## 출력

파일 저장 경로:
설계문서_V7.0/V40/results/evaluate/gemini_eval_result_{CATEGORY_EN}.json

JSON 형식:
{
  "evaluations": [
    {
      "id": "원본 item의 id 그대로 복사",
      "rating": "+3",
      "rationale": "전문 분야 법안 발의 실적이 높음"
    },
    {
      "id": "...",
      "rating": "-2",
      "rationale": "관련 위원회 출석률 저조로 비판"
    },
    {
      "id": "...",
      "rating": "X",
      "rationale": "동명이인 데이터, 소속 다름"
    }
  ]
}

## 주의사항
- id는 원본 item의 id를 **그대로** 복사 (절대 변경 금지)
- rating은 문자열: "+4", "+3", "+2", "+1", "-1", "-2", "-3", "-4", "X"
- score는 rating에 정확히 대응: +4→8, +3→6, +2→4, +1→2, -1→-2, -2→-4, -3→-6, -4→-8, X→0
- rationale은 한국어 1문장 (근거 명확히)
- 모든 item을 빠짐없이 평가해라

위 instruction 파일의 평가 기준을 읽고, 모든 데이터를 평가하여 위 경로에 저장해줘.
```

---

## 5. 반복 실행 요약

총 **10개 카테고리** 반복:

```
카테고리 01 expertise     → fetch → 프롬프트 입력 → 결과 저장 → save
카테고리 02 leadership    → fetch → 프롬프트 입력 → 결과 저장 → save
...
카테고리 10 publicinterest → fetch → 프롬프트 입력 → 결과 저장 → save
```

각 반복에서:
1. `gemini_eval_helper.py fetch`로 미평가 데이터 조회
2. 섹션 4의 프롬프트 템플릿에 플레이스홀더 치환 + items 배열 붙여넣기
3. Gemini CLI에 입력 → 결과 JSON 출력
4. JSON을 `results/evaluate/` 폴더에 파일로 저장
5. `gemini_eval_helper.py save`로 DB 저장

## 6. 전체 현황 확인

```bash
python helpers/gemini_eval_helper.py status --politician_id={POLITICIAN_ID}
```

**완료 기준**: 모든 카테고리에서 `DONE` (수집 데이터 전체 평가 완료)
