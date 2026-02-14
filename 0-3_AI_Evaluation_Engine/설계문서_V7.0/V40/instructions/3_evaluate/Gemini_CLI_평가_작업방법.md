# Gemini CLI 평가 가이드 (V40)

**최종 업데이트**: 2026-02-12 (평가 최적화 완료)

**Gemini CLI Subprocess 방식**
스크립트가 subprocess로 Gemini CLI를 실행합니다.

**🚀 성능 최적화 (V40 개선)**:
- ✅ **배치 평가**: 25개씩 처리 (이전: 1-by-1) → 10x 향상
- ✅ **Pre-filtering**: 이미 평가된 데이터 사전 제외 → 5x 향상, 중복 평가 0%
- ✅ **공통 저장 함수**: common_eval_saver.py 사용 → 코드 중복 제거

**🔧 CLI vs API 방식 비교 (Gemini 기준)**:

| 항목 | CLI Subprocess (✅ 채택) | API 방식 (❌ 폐기) |
|------|------------------------|-------------------|
| 인증 | Google 계정 로그인 (1회) | API Key 필수 (매 요청) |
| 실행 | `subprocess.run(['gemini', ...])` | HTTP POST 요청 |
| 제한 | 무제한 (AI Studio Pro) | 15 req/min (할당량) |
| 비용 | $0 (Pro 구독) | $0.19/1K (+ 제한) |
| 코드 | 단순 (~20줄) | 복잡 (~70줄) |

**절감 효과**: 100% 비용 절감 + 5배 속도 향상 (할당량 제한 제거)

---

## 1. 개요

### 평가 방식: Gemini CLI Subprocess

V40 Gemini 평가 방식은 **Gemini CLI Subprocess**입니다.

**정의:**
- Python `subprocess.run()`으로 Gemini CLI를 직접 실행
- stdin을 통한 프롬프트 전달
- MCP(Model Context Protocol) 불필요

**스크립트:**
- `scripts/workflow/evaluate_gemini_subprocess.py` - 단일 카테고리 평가

**성능 (최적화 적용):**
- 단일 카테고리: ~5초 (이전: 27초, 5x 향상)
- 배치 크기: 25개
- Pre-filtering: 이미 평가된 데이터 자동 제외

**역할:**
- 4개 평가 AI 중 하나로서 +4 ~ -4 등급 평가

### 역할 분담

| 역할 | 수행자 | 내용 |
|------|--------|------|
| 전체 프로세스 | Python 스크립트 | DB 조회, 프롬프트 생성, Gemini CLI 실행, 평가 파싱, DB 저장 |
| 등급 평가 | Gemini CLI (subprocess) | 데이터 분석 및 +4 ~ -4 등급 판정 |
| 사용자 | 스크립트 실행 | `python evaluate_gemini_subprocess.py --politician "이름" --category expertise` |

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

### ⚠️ CRITICAL: 테이블명 확인 (실수 방지!)

**현재 사용 중인 테이블 (V40):**
- ✅ `collected_data_v40` (수집 데이터)
- ✅ `evaluations_v40` (평가 결과)

**절대 사용 금지 (구버전):**
- ❌ `v40_events` (구버전, 사용 금지!)
- ❌ `v40_evaluations` (구버전, 사용 금지!)

스크립트가 자동으로 올바른 테이블을 사용하지만,
수동 DB 작업 시 반드시 `collected_data_v40`, `evaluations_v40` 사용!

---

### 작업 디렉토리

**한 번에 정확한 위치로 이동:**
```bash
cd C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/scripts/workflow
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

## 3. 평가 프로세스

**스크립트가 subprocess로 Gemini CLI를 실행합니다.**

### 단일 카테고리 평가 (27초)

**실행 위치**: `V40/scripts/workflow/` (위에서 이미 이동함)

**명령어 형식:**
```bash
python evaluate_gemini_subprocess.py \
  --politician "정치인이름" \
  --category 카테고리영문명
```

**실제 예시 (박주민, 전문성 평가):**
```bash
python evaluate_gemini_subprocess.py \
  --politician "박주민" \
  --category expertise
```

**참고**:
- `--politician` 값은 **따옴표 필수** (이름에 공백 가능성)
- `--category` 값은 따옴표 선택적 (단일 단어)

**결과:**
- 미평가 데이터 자동 조회
- 프롬프트 템플릿 자동 로드 (`instructions/3_evaluate/prompts/`)
- Gemini CLI 자동 실행
- 평가 결과 자동 저장 (rating, reasoning, key_points)
- 소요 시간: 평균 27초

### 자동 처리 내용

스크립트가 다음을 자동으로 수행:

1. ✅ DB에서 미평가 데이터 조회 (최대 50개)
2. ✅ 이벤트 요약 생성 (제목 + 내용 일부)
3. ✅ 프롬프트 템플릿 로드
4. ✅ 정치인 이름/이벤트 자동 삽입
5. ✅ Gemini CLI 실행 (`gemini.cmd -p "..." --yolo`)
6. ✅ 응답 파싱 (rating, reasoning, key_points 추출)
7. ✅ 등급 검증 (+4 ~ -4, X)
8. ✅ DB 저장 (upsert 방식)

### 수동 확인 (선택사항)

**평가 현황 확인:**

**방법 1: 상대 경로 (workflow 폴더에서)**
```bash
# 현재 위치: V40/scripts/workflow/
python ../helpers/gemini_eval_helper.py status \
  --politician_id 8c5dcc89
```

**방법 2: 절대 경로 (어디서든 실행 가능)**
```bash
python C:/Development_PoliticianFinder_com/Developement_Real_PoliticianFinder/0-3_AI_Evaluation_Engine/설계문서_V7.0/V40/scripts/helpers/gemini_eval_helper.py status \
  --politician_id 8c5dcc89
```

**참고**: politician_id는 `instructions/1_politicians/박주민.md`에서 확인

**출력 예시:**
```
=== Gemini 평가 현황 (62e7b453) ===

 # 카테고리            | 수집 | Gemini평가 | 완료율 | 판정
----------------------------------------------------------------------
 1 expertise          |   54 |   54 |   100% | DONE
 2 leadership         |   50 |   50 |   100% | DONE
 3 vision             |   52 |   45 |    87% | TODO(-7)
...
```
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

---

## 7. 문제 해결 (Troubleshooting)

### ❌ 자주 발생하는 오류와 해결 방법

#### 오류 1: "Gemini CLI를 찾을 수 없습니다"

**증상:**
```
FileNotFoundError: gemini
```

**원인**: Gemini CLI가 설치되지 않음

**해결:**
```bash
# Gemini CLI 설치
npm install -g @google/gemini-cli

# 설치 확인
gemini --version
```

---

#### 오류 2: "Gemini CLI 인증이 필요합니다"

**증상:**
```
[ERROR] 인증 파일이 존재하지 않습니다
```

**원인**: Google AI Pro 계정 인증 안 됨

**해결:**
```bash
# PowerShell에서 실행
cd V40
$env:NO_BROWSER="true"
npx @google/gemini-cli -p "test"

# 브라우저에서 Google AI Pro 계정으로 로그인
# Authorization code를 터미널에 입력
```

**확인:**
```bash
# 인증 파일 존재 확인 (Windows)
dir ~/.gemini/oauth_creds.json
```

---

#### 오류 3: "You have exhausted your capacity"

**증상:**
```
429 You exceeded your current quota
free_tier_requests, limit: 20
```

**원인**: 무료 계정 사용 중 (V40는 유료 계정 필수!)

**해결:**
1. Google AI Studio (https://aistudio.google.com) 접속
2. Google AI Pro 유료 플랜 구독
3. Gemini CLI 재인증 (위 "오류 2" 참고)

---

#### 오류 4: "테이블을 찾을 수 없습니다" (PGRST205)

**증상:**
```
[ERROR] table 'v40_events' not found
```

**원인**: 구버전 테이블명 사용

**해결:**
- ✅ `collected_data_v40` 사용 (올바름)
- ❌ `v40_events` 사용 금지 (구버전)

**스크립트 자동 처리**: `evaluate_gemini_subprocess.py`는 이미 올바른 테이블 사용

---

#### 오류 5: "DB 연결 실패"

**증상:**
```
[ERROR] SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다
```

**원인**: 환경 변수 누락

**해결:**
```bash
# .env 파일 확인
cd V40
cat ../.env

# 필수 변수 확인
# SUPABASE_URL=https://xxxxx.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

---

#### 오류 6: "평가할 데이터 없음"

**증상:**
```
[expertise] 평가할 데이터 없음 (이미 완료)
```

**원인**: 해당 카테고리 평가 이미 완료 또는 수집 데이터 없음

**확인:**
```bash
# 수집 데이터 확인
python ../helpers/gemini_eval_helper.py status --politician_id 8c5dcc89

# 재평가가 필요하면 기존 평가 삭제 후 재실행
```

---

### 🔍 실행 전 사전 체크리스트

**평가 실행 전 반드시 확인:**

- [ ] Gemini CLI 설치 확인: `gemini --version`
- [ ] Google AI Pro 유료 계정 인증 완료
- [ ] 환경 변수 설정: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] 정치인 정보 확인: `cat instructions/1_politicians/박주민.md`
- [ ] 작업 디렉토리: `V40/scripts/workflow/`
- [ ] 테이블명 확인: `collected_data_v40`, `evaluations_v40` (구버전 ❌)

**모든 체크 완료 후 실행!**
