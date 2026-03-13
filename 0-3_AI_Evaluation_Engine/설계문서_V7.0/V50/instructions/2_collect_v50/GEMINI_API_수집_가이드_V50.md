# Gemini API 수집 가이드 (V50)

**Gemini API 방식**
수동 복사/붙여넣기 불필요 - 스크립트가 모든 것을 처리합니다.

---

## 1. 개요

### 수집 방식: Gemini API (REST API 직접 호출)

V50 공식 수집 방식은 **Gemini REST API 직접 호출**입니다.

**정의:**
- Python `requests` 라이브러리로 Gemini REST API 직접 호출
- GEMINI_API_KEY 환경변수 사용
- Google Search Grounding 활성화 (`google_search` 도구)

**스크립트:**
- `scripts/workflow/collect_gemini_api.py` - 단일 카테고리
- `scripts/workflow/collect_gemini_api_parallel.py` - 병렬 수집 (권장)

**장점:**
- CLI 설치 불필요 (API Key만 설정)
- 안정적인 REST API 호출
- 서버 환경에서도 동작

### 역할 분담

| 역할 | 수행자 | 내용 |
|------|--------|------|
| 전체 프로세스 | Python 스크립트 | DB 조회, 프롬프트 생성, Gemini REST API 호출, 결과 파싱, DB 저장 |
| 웹 검색 | Gemini REST API | Google Search Grounding 기반 검색 (google_search 도구) |
| 사용자 | 스크립트 실행 | `python collect_gemini_api_parallel.py --politician "이름"` |

### 카테고리당 Gemini 수집 목표 (V50)

| 타입 | 기본 | 버퍼 포함 | sentiment 배분 (neg/pos/free) |
|------|------|----------|-------------------------------|
| OFFICIAL | 30개 | 36개 | 3 / 3 / 24~30 |
| PUBLIC | 10개 | 12개 | 2 / 2 / 6~8 |
| **합계** | **40개** | **48개** | |

**V50 배분 (확정):**
```
Gemini API:  48개/카테고리 (40%) — OFFICIAL 30 + PUBLIC 10
Grok(X):     12개/카테고리 (10%) — PUBLIC only, 센티멘트 구분 없음 (전부 free)
Naver NCP:   60개/카테고리 (50%) — OFFICIAL 10 + PUBLIC 40
합계:       120개/카테고리
순서: 항상 Gemini → Grok → Naver
```

---

## 2. 사전 준비

### ⚠️ **필수: Gemini API Key 설정**

**중요: V50에서는 REST API 방식을 사용합니다. CLI 설치 불필요!**

**API Key 발급 방법:**
1. [Google AI Studio](https://aistudio.google.com) 접속
2. 로그인 → "Get API Key" 클릭
3. API Key 복사

**환경변수 설정:**
```bash
# .env 파일에 추가
GEMINI_API_KEY=AIzaSy...
```

**API Key 확인:**
```bash
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print('OK' if os.getenv('GEMINI_API_KEY') else 'MISSING')"
```

---

### 작업 디렉토리

```bash
cd C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V50/scripts
```

### 필요 파일 확인

| 파일 | 경로 (V50 기준) | 용도 |
|------|----------------|------|
| 정치인 정보 | `instructions/1_politicians/{이름}.md` | 이름, 정당, 직책, 지역구, 특이사항 |
| OFFICIAL 프롬프트 템플릿 | `instructions/2_collect_v50/prompts/gemini_official.md` | OFFICIAL 수집 규칙/형식 |
| PUBLIC 프롬프트 템플릿 | `instructions/2_collect_v50/prompts/gemini_public.md` | PUBLIC 수집 규칙/형식 |
| 카테고리별 주제/키워드 | `instructions/2_collect_v50/cat{번호}_{카테고리}.md` | 수집 주제, 검색어 |
| 수집 스크립트 | `scripts/workflow/collect_gemini_api.py` | Gemini API 자동 수집/DB 저장 |

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

## 3. 자동 수집 프로세스

**스크립트가 모든 작업을 자동으로 처리합니다.**
수동 복사/붙여넣기 불필요!

### 방법 1: 10개 카테고리 병렬 수집 (권장)

```bash
cd scripts/workflow

python collect_gemini_api_parallel.py \
  --politician "{POLITICIAN_NAME}"
```

**예시:**
```bash
python collect_gemini_api_parallel.py \
  --politician "박주민"
```

**결과:**
- 10개 카테고리 동시 수집
- 각 카테고리: OFFICIAL 30개 + PUBLIC 10개 = 40개 (버퍼 48개)
- 자동 DB 저장
- JSON 보고서: `reports/{정치인명}_collection_{timestamp}.json`

### 방법 2: 단일 카테고리 수집

```bash
cd scripts/workflow

python collect_gemini_api.py \
  --politician "{POLITICIAN_NAME}" \
  --category {CATEGORY_EN}
```

**예시:**
```bash
python collect_gemini_api.py \
  --politician "박주민" \
  --category "expertise"
```

### 자동 처리 내용

스크립트가 다음을 자동으로 수행:

1. ✅ DB에서 기존 수집 데이터 조회
2. ✅ 필요량 계산 (OFFICIAL 30, PUBLIC 10)
3. ✅ 프롬프트 템플릿 로드 (`instructions/2_collect_v50/prompts/`)
4. ✅ 정치인 이름/기간 자동 삽입
5. ✅ Gemini REST API 호출 (Google Search Grounding 활성화)
6. ✅ 응답 파싱 (JSON 추출)
7. ✅ DB 저장 (중복 체크 포함)
8. ✅ 결과 보고서 생성

### 수동 확인 (선택사항)

수집 현황 확인:
```bash
cd scripts/utils

python check_collection_status.py --politician "{POLITICIAN_NAME}"
```

**PASS 기준**: 각 카테고리 Gemini 합계 40+ (OFFICIAL 30+ / PUBLIC 10+)

---

## 4. 범용 프롬프트 템플릿 (Gemini REST API용)

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
- **카테고리 주제/키워드**: 설계문서_V7.0/V50/instructions/2_collect_v50/cat{CATEGORY_NUM}_{CATEGORY_EN}.md
  - `---TOPIC_INSTRUCTION_START---` ~ `---TOPIC_INSTRUCTION_END---` 사이의 수집 주제 참조
  - `### 공식 데이터 검색어 (Gemini, Naver)` 섹션의 키워드 사용
- **상세 수집 규칙**: 설계문서_V7.0/V50/instructions/2_collect_v50/prompts/gemini_official.md

## 수집 대상 (OFFICIAL만)
- .go.kr 도메인 (assembly.go.kr, korea.kr, moleg.go.kr, likms.assembly.go.kr 등)
- 법안 발의, 국정감사 질의, 위원회 활동, 공식 성명, 정책 발표
- 정부/국회 공식 보도자료, 활동 보고서

## 수집 금지
- PUBLIC 소스 (뉴스, 블로그, 커뮤니티, SNS)
- 동명이인(다른 소속·직업·지역) 자료
- 다른 정치인이 주인공이고 {POLITICIAN_NAME}이(가) 단순 언급만 된 자료
- 엑셀 파일, PDF 다운로드 페이지, 의미 없는 목록 페이지

## 수집 목표: 30~36개 (V50 Gemini OFFICIAL)
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
설계문서_V7.0/V50/results/collect/gemini_result_{CATEGORY_EN}_official.json

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
- **카테고리 주제/키워드**: 설계문서_V7.0/V50/instructions/2_collect_v50/cat{CATEGORY_NUM}_{CATEGORY_EN}.md
  - `---TOPIC_INSTRUCTION_START---` ~ `---TOPIC_INSTRUCTION_END---` 사이의 수집 주제 참조
  - `### 공개 데이터 검색어 (Gemini, Naver)` 섹션의 키워드 사용
- **상세 수집 규칙**: 설계문서_V7.0/V50/instructions/2_collect_v50/prompts/gemini_public.md

## 수집 대상 (PUBLIC만)
- 뉴스 기사 (각 언론사 = 다른 소스로 인정)
- 블로그, 카페, 커뮤니티, 위키 등
- 다양한 소스에서 수집 (같은 소스 반복 금지)

## 수집 금지
- OFFICIAL 소스 (.go.kr 도메인)
- 동명이인(다른 소속·직업·지역) 자료
- 다른 정치인이 주인공이고 {POLITICIAN_NAME}이(가) 단순 언급만 된 자료
- 엑셀 파일, PDF 다운로드 페이지, 의미 없는 목록 페이지

## 수집 목표: 10~12개 (V50 Gemini PUBLIC)
- **negative 2개**: 논란, 비판, 의혹, 반대 여론이 담긴 콘텐츠
- **positive 2개**: 성과, 칭찬, 지지, 긍정 평가가 담긴 콘텐츠
- **free 6~8개**: 센티멘트 제한 없이 자유 수집 (중립적 보도, 사실 전달 등)

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
설계문서_V7.0/V50/results/collect/gemini_result_{CATEGORY_EN}_public.json

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

## 5. 반복 실행 요약 (V50: Gemini 40개/카테고리)

총 **10개 카테고리 x 2타입 = 20회** 반복:

```
카테고리 01 expertise  → OFFICIAL 프롬프트 → 저장 → PUBLIC 프롬프트 → 저장
카테고리 02 leadership → OFFICIAL 프롬프트 → 저장 → PUBLIC 프롬프트 → 저장
...
카테고리 10 publicinterest → OFFICIAL 프롬프트 → 저장 → PUBLIC 프롬프트 → 저장
```

각 반복에서:
1. 섹션 4의 프롬프트 템플릿을 참고용으로 확인
2. 플레이스홀더를 해당 정치인/카테고리에 맞게 치환
3. Gemini REST API 호출 → 결과 JSON 출력 (스크립트 자동 처리)
4. JSON을 `results/collect/` 폴더에 파일로 저장
5. 스크립트가 자동으로 DB 저장 (수동 저장 불필요)

## 6. 전체 현황 확인

```bash
python utils/check_collection_status.py --politician "{POLITICIAN_NAME}"
```

**완료 기준**: 모든 카테고리에서 Gemini OFFICIAL 30+ / PUBLIC 10+ 달성 (합계 40+)

> **중복 처리 규칙 요약**: 수집 시 `existing_urls`에 있는 URL은 건너뜁니다.
> 수집 완료 후 Phase 2 (validate_v50.py)에서 자동으로 고급 중복 검사(URL 정규화 + 제목 유사도)가 수행됩니다.
> 상세 규칙은 V50 전체 프로세스 가이드의 Phase 2 섹션을 참조하세요.

---

## 7. 문제 해결 (Troubleshooting)

### 7-1. API Key 오류

**증상:**
- `401 Unauthorized` 또는 `API key not valid` 오류
- 스크립트 실행 시 인증 실패

**원인:**
- `.env` 파일에 `GEMINI_API_KEY` 누락 또는 오타
- API Key 비활성화

**해결:**
```bash
# 1. .env 파일 확인
cat .env | grep GEMINI

# 2. API Key 재확인 (Google AI Studio)
# 3. .env 파일 수정 후 재실행
```

### 7-2. API Quota 초과

**증상:**
- "429 RESOURCE_EXHAUSTED" 오류
- 수집 중 작업 실패

**원인:**
- 일일 요청 한도 초과
- 분당 요청 한도 초과

**해결:**
```bash
# 1. 대기 후 순차 실행
python collect_gemini_api.py --politician "박주민" --category transparency
# 완료 후 다음 카테고리
python collect_gemini_api.py --politician "박주민" --category integrity
```

- 동시에 여러 스크립트 실행 금지
- 한 번에 하나씩만 실행 (quota 부족 시)

### 7-3. 의존성 문제

**증상:**
- Python 모듈 not found 오류

**해결 방법:**
```bash
pip install -r requirements.txt
```

### 7-4. 체크리스트

Gemini API 문제 발생 시 순서대로 확인:

- [ ] GEMINI_API_KEY 설정 확인 (`cat .env | grep GEMINI`)
- [ ] API Key 유효성 확인 (Google AI Studio)
- [ ] Quota 확인 (Google AI Studio > API Usage)
- [ ] 동시 실행 금지 확인 (순차 실행으로 변경)
- [ ] Python 의존성 확인 (`pip install -r requirements.txt`)
