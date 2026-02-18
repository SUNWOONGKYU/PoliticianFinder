# Gemini CLI 수집 가이드 (V40 범용)

**모든 정치인에 사용 가능한 범용 가이드**
플레이스홀더 `{...}` 부분만 치환하여 사용하세요.

---

## 1. 개요

V40에서 Gemini CLI는 **Google Search Grounding**을 활용하여 데이터를 수집하는 채널입니다.

### 역할 분담

| 역할 | 수행자 | 내용 |
|------|--------|------|
| DB 조회/저장 | Claude Code (헬퍼 스크립트) | 필요량 확인, 기존 URL 조회, 결과 DB 저장 |
| 웹 검색/수집 | Gemini CLI (Google Search) | 실제 검색 수행, JSON 결과 출력 |
| 프롬프트 전달 | 사용자 또는 오케스트레이터 | 프롬프트를 Gemini CLI에 복사/붙여넣기 |

### 카테고리당 Gemini 수집 목표

| 타입 | 기본 | 버퍼 포함 | sentiment 배분 (neg/pos/free) |
|------|------|----------|-------------------------------|
| OFFICIAL | 30개 | 36개 | 3 / 3 / 24~30 |
| PUBLIC | 20개 | 24개 | 4 / 4 / 12~16 |
| **합계** | **50개** | **60개** | |

---

## 2. 사전 준비

### 작업 디렉토리

```bash
cd C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/scripts
```

### 필요 파일 확인

| 파일 | 경로 (V40 기준) | 용도 |
|------|----------------|------|
| 정치인 정보 | `instructions/1_politicians/{이름}.md` | 이름, 정당, 직책, 지역구, 특이사항 |
| OFFICIAL 프롬프트 템플릿 | `instructions/2_collect/prompts/gemini_official.md` | OFFICIAL 수집 규칙/형식 |
| PUBLIC 프롬프트 템플릿 | `instructions/2_collect/prompts/gemini_public.md` | PUBLIC 수집 규칙/형식 |
| 카테고리별 주제/키워드 | `instructions/2_collect/cat{번호}_{카테고리}.md` | 수집 주제, 검색어 |
| 수집 헬퍼 스크립트 | `scripts/helpers/gemini_collect_helper.py` | DB 조회/저장 |

### 카테고리 목록

| # | 영문명 | 한글명 | cat 파일 |
|---|--------|--------|----------|
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

## 3. 수집 프로세스 (카테고리별 반복)

**각 카테고리마다 OFFICIAL → PUBLIC 순서로 2회 수행합니다.**
10개 카테고리 x 2타입 = **총 20회 반복**

### Step 1: 필요량 확인 (Claude Code 터미널)

```bash
python helpers/gemini_collect_helper.py fetch \
  --politician_id={POLITICIAN_ID} \
  --politician_name={POLITICIAN_NAME} \
  --category={CATEGORY_EN}
```

**출력 확인 사항:**
- `needs.official.{sentiment}.need` → OFFICIAL sentiment별 추가 필요량
- `needs.public.{sentiment}.need` → PUBLIC sentiment별 추가 필요량
- `existing_urls` → 이미 수집된 URL 목록 (중복 방지에 활용)
  - ⚠️ **중복 판단 기준** (V40_전체_프로세스_가이드.md Phase 3-2 참조):
    - URL 정규화: 파라미터(`?key=val`), 앵커(`#section`) 제거 후 비교
    - 제목 유사도: 특수문자/공백 제거 후 95% 이상 유사 시 중복
    - **같은 채널** 내 중복 → 제거 / **다른 채널** 간 중복 → 모두 유지 (자연 가중치)
- `total_need` → 전체 추가 필요 수량

### Step 2: Gemini CLI에 프롬프트 입력

아래 **섹션 4의 범용 프롬프트 템플릿** 중 해당 타입(OFFICIAL/PUBLIC) 선택.
`{...}` 플레이스홀더를 치환하여 Gemini CLI에 **붙여넣기**.

### Step 3: 결과 JSON 파일 저장

Gemini CLI가 출력한 JSON을 다음 경로에 저장:
```
V40/results/collect/gemini_result_{CATEGORY_EN}_{official|public}.json
```

### Step 4: DB 저장 (Claude Code 터미널)

```bash
python helpers/gemini_collect_helper.py save \
  --politician_id={POLITICIAN_ID} \
  --politician_name={POLITICIAN_NAME} \
  --category={CATEGORY_EN} \
  --input=../results/collect/gemini_result_{CATEGORY_EN}_{official|public}.json
```

### Step 5: 현황 확인

```bash
python helpers/gemini_collect_helper.py status \
  --politician_id={POLITICIAN_ID}
```

**PASS 기준**: 각 카테고리 OFFICIAL 30+ / PUBLIC 20+ (합계 50+)

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
| `{DATE_LIMIT_OFFICIAL}` | 2022-02-09 이후 | 수집일 기준 4년 전 |
| `{DATE_LIMIT_PUBLIC}` | 2024-02-09 이후 | 수집일 기준 2년 전 |
| `{EXCLUDE_URLS}` | (Step 1의 existing_urls) | 헬퍼 fetch 출력 |
| `{SPECIAL_NOTES}` | 변호사 출신, 서울시장 출마 예정 | `1_politicians/*.md`의 특이사항 |

---

### 4-A. OFFICIAL 수집 프롬프트

```
너는 구글 검색을 사용해서 한국 정치인의 **공식(OFFICIAL)** 활동 기록을 수집하는 역할이야.

## 작업 방식 (반드시 지켜라)
1. 아래 카테고리 파일에서 주제(topic_instruction)와 검색 키워드를 읽어라
2. {정치인명}을 "{POLITICIAN_NAME}"으로 치환해라
3. 치환된 검색어로 구글 검색을 실행해라
4. 검색 결과의 **실제 URL**을 그대로 복사해라
5. 네가 아는 지식으로 URL을 만들지 마라. 반드시 검색 결과에서 가져와라.

## 대상 정치인
- 이름: {POLITICIAN_NAME}
- 정당: {POLITICIAN_PARTY}
- 직책: {POLITICIAN_POSITION}
- 지역구: {POLITICIAN_DISTRICT}
- 특이사항: {SPECIAL_NOTES}

## 카테고리: {CATEGORY_EN} ({CATEGORY_KR})

## 참조 파일 (반드시 읽어라)
- **카테고리 주제/키워드**: 설계문서_V7.0/V40/instructions/2_collect/cat{CATEGORY_NUM}_{CATEGORY_EN}.md
  - `---TOPIC_INSTRUCTION_START---` ~ `---TOPIC_INSTRUCTION_END---` 사이의 수집 주제 참조
  - `### 공식 데이터 검색어 (Gemini, Naver)` 섹션의 키워드 사용
- **상세 수집 규칙**: 설계문서_V7.0/V40/instructions/2_collect/prompts/gemini_official.md

## 수집 대상 (OFFICIAL만)
- .go.kr 도메인 (assembly.go.kr, korea.kr, moleg.go.kr, likms.assembly.go.kr 등)
- 법안 발의, 국정감사 질의, 위원회 활동, 공식 성명, 정책 발표
- 정부/국회 공식 보도자료, 활동 보고서

## 수집 금지
- PUBLIC 소스 (뉴스, 블로그, 커뮤니티, SNS)
- 동명이인(다른 소속·직업·지역) 자료
- 다른 정치인이 주인공이고 {POLITICIAN_NAME}이(가) 단순 언급만 된 자료
- 엑셀 파일, PDF 다운로드 페이지, 의미 없는 목록 페이지

## 수집 목표: 30~36개
- **negative 3개**: 논란, 비판, 실책, 반대 여론이 포함된 공식 기록
- **positive 3개**: 성과, 수상, 표창, 긍정 평가가 포함된 공식 기록
- **free 24~30개**: 센티멘트 제한 없이 자유 수집 (사실 중심, 중립적 기록)

### sentiment 정의
- **negative**: 논란, 비판, 실책, 반대 입장이 주요 내용 (예: 국감 질타, 공약 미이행 지적)
- **positive**: 성과, 수상, 법안 통과, 표창이 주요 내용 (예: 법안 대표발의 통과)
- **free**: 센티멘트 제한 없음, 사실 중심 자료 (예: 일반 법안 발의, 위원회 참석 기록)

## 기간 제한 (절대 규칙)
- **최근 4년 이내** 자료만 수집 ({DATE_LIMIT_OFFICIAL})
- 4년 이전 자료는 **절대 포함 금지**
- data_date에 실제 게시일을 정확히 기입 (YYYY-MM-DD)
- 날짜를 알 수 없으면 data_date를 빈 문자열("")로 남겨라

## 이미 수집된 URL (중복 수집 금지)
{EXCLUDE_URLS}

## 출력
파일 저장 경로:
설계문서_V7.0/V40/results/collect/gemini_result_{CATEGORY_EN}_official.json

JSON 형식:
{
  "collector_ai": "gemini",
  "data_type": "official",
  "items": [
    {
      "item_num": 1,
      "data_title": "검색 결과에 나온 실제 제목",
      "data_content": "문서 본문 요약 (100자 이상, 날짜·장소·법안명 등 구체적 사실 포함)",
      "data_source": "국회 법제사법위원회",
      "source_url": "검색 결과에서 복사한 실제 URL",
      "source_type": "OFFICIAL",
      "data_date": "2025-01-15",
      "sentiment": "free"
    },
    {
      "item_num": 2,
      "data_title": "...",
      "data_content": "...",
      "data_source": "...",
      "source_url": "...",
      "source_type": "OFFICIAL",
      "data_date": "2024-10-12",
      "sentiment": "negative"
    },
    {
      "item_num": 3,
      "data_title": "...",
      "data_content": "...",
      "data_source": "...",
      "source_url": "...",
      "source_type": "OFFICIAL",
      "data_date": "2024-06-20",
      "sentiment": "positive"
    }
  ]
}

## 절대 금지
- URL을 만들거나 추측하지 마라
- 도메인만 넣지 마라 (예: "https://assembly.go.kr"만 넣기 금지)
- 구글 검색 결과에 나온 URL을 그대로 복사해라

카테고리 파일에서 키워드를 읽고, {정치인명}을 치환하여 구글 검색을 시작해라.
```

---

### 4-B. PUBLIC 수집 프롬프트

```
너는 구글 검색을 사용해서 한국 정치인의 **공개(PUBLIC)** 데이터를 수집하는 역할이야.

## 작업 방식 (반드시 지켜라)
1. 아래 카테고리 파일에서 주제(topic_instruction)와 검색 키워드를 읽어라
2. {정치인명}을 "{POLITICIAN_NAME}"으로 치환해라
3. 치환된 검색어로 구글 검색을 실행해라
4. 검색 결과의 **실제 URL**을 그대로 복사해라
5. 네가 아는 지식으로 URL을 만들지 마라.

## 대상 정치인
- 이름: {POLITICIAN_NAME}
- 정당: {POLITICIAN_PARTY}
- 직책: {POLITICIAN_POSITION}
- 지역구: {POLITICIAN_DISTRICT}
- 특이사항: {SPECIAL_NOTES}

## 카테고리: {CATEGORY_EN} ({CATEGORY_KR})

## 참조 파일 (반드시 읽어라)
- **카테고리 주제/키워드**: 설계문서_V7.0/V40/instructions/2_collect/cat{CATEGORY_NUM}_{CATEGORY_EN}.md
  - `---TOPIC_INSTRUCTION_START---` ~ `---TOPIC_INSTRUCTION_END---` 사이의 수집 주제 참조
  - `### 공개 데이터 검색어 (Gemini, Naver)` 섹션의 키워드 사용
- **상세 수집 규칙**: 설계문서_V7.0/V40/instructions/2_collect/prompts/gemini_public.md

## 수집 대상 (PUBLIC만)
- 뉴스 기사 (각 언론사 = 다른 소스로 인정)
- 블로그, 카페, 커뮤니티, 위키 등
- 다양한 소스에서 수집 (같은 소스 반복 금지)

## 수집 금지
- OFFICIAL 소스 (.go.kr 도메인)
- 동명이인(다른 소속·직업·지역) 자료
- 다른 정치인이 주인공이고 {POLITICIAN_NAME}이(가) 단순 언급만 된 자료
- 엑셀 파일, PDF 다운로드 페이지, 의미 없는 목록 페이지

## 수집 목표: 20~24개
- **negative 4개**: 논란, 비판, 의혹, 반대 여론이 담긴 콘텐츠
- **positive 4개**: 성과, 칭찬, 지지, 긍정 평가가 담긴 콘텐츠
- **free 12~16개**: 센티멘트 제한 없이 자유 수집 (중립적 보도, 사실 전달 등)

### sentiment 정의
- **negative**: 논란, 비판, 의혹, 실책이 주요 내용 (예: 언론 비판 기사, 논란 보도)
- **positive**: 성과, 칭찬, 지지가 주요 내용 (예: 긍정 보도, 성과 분석 기사)
- **free**: 제한 없음, 사실 전달 중심 (예: 중립적 보도, 정책 설명, 인터뷰)

## 기간 제한 (절대 규칙)
- **최근 2년 이내** 자료만 수집 ({DATE_LIMIT_PUBLIC})
- 2년 이전 자료는 **절대 포함 금지**
- data_date에 실제 게시일을 정확히 기입 (YYYY-MM-DD)
- 날짜를 알 수 없으면 data_date를 빈 문자열("")로 남겨라

## 이미 수집된 URL (중복 수집 금지)
{EXCLUDE_URLS}

## 출력
파일 저장 경로:
설계문서_V7.0/V40/results/collect/gemini_result_{CATEGORY_EN}_public.json

JSON 형식:
{
  "collector_ai": "gemini",
  "data_type": "public",
  "items": [
    {
      "item_num": 1,
      "data_title": "검색 결과에 나온 실제 제목",
      "data_content": "기사 요약 (100자 이상, 구체적 사실 포함)",
      "data_source": "한겨레",
      "source_url": "검색 결과에서 복사한 실제 URL",
      "source_type": "PUBLIC",
      "data_date": "2025-06-10",
      "sentiment": "free"
    },
    {
      "item_num": 2,
      "data_title": "...",
      "data_content": "...",
      "data_source": "네이버 블로그 - 정치관찰",
      "source_url": "...",
      "source_type": "PUBLIC",
      "data_date": "2025-01-20",
      "sentiment": "positive"
    },
    {
      "item_num": 3,
      "data_title": "...",
      "data_content": "...",
      "data_source": "오마이뉴스",
      "source_url": "...",
      "source_type": "PUBLIC",
      "data_date": "2024-11-05",
      "sentiment": "negative"
    }
  ]
}

## 절대 금지
- URL을 만들거나 추측하지 마라
- 도메인만 넣지 마라
- .go.kr 공식 소스를 포함하지 마라
- 구글 검색 결과에 나온 URL을 그대로 복사해라

카테고리 파일에서 키워드를 읽고, {정치인명}을 치환하여 구글 검색을 시작해라.
```

---

## 5. 반복 실행 요약

총 **10개 카테고리 x 2타입 = 20회** 반복:

```
카테고리 01 expertise  → OFFICIAL 프롬프트 → 저장 → PUBLIC 프롬프트 → 저장
카테고리 02 leadership → OFFICIAL 프롬프트 → 저장 → PUBLIC 프롬프트 → 저장
...
카테고리 10 publicinterest → OFFICIAL 프롬프트 → 저장 → PUBLIC 프롬프트 → 저장
```

각 반복에서:
1. 섹션 4의 프롬프트 템플릿을 복사
2. 플레이스홀더를 해당 정치인/카테고리에 맞게 치환
3. Gemini CLI에 붙여넣기 → 결과 JSON 출력
4. JSON을 `results/collect/` 폴더에 파일로 저장
5. `gemini_collect_helper.py save`로 DB 저장

## 6. 전체 현황 확인

```bash
python helpers/gemini_collect_helper.py status --politician_id={POLITICIAN_ID}
```

**완료 기준**: 모든 카테고리에서 OFFICIAL 30+ / PUBLIC 20+ 달성

> **중복 처리 규칙 요약**: 수집 시 `existing_urls`에 있는 URL은 건너뜁니다.
> 수집 완료 후 Phase 3-2에서 자동으로 고급 중복 검사(URL 정규화 + 제목 유사도)가 수행됩니다.
> 상세 규칙은 `V40_전체_프로세스_가이드.md`의 Phase 3-2 섹션을 참조하세요.
