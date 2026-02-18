# V40 정치인 평가 시스템

**버전**: V40
**최종 업데이트**: 2026-02-09 (문서 정비 완료)
**목적**: 웹검색 기반 2개 채널 분담 수집 (Gemini 50 + Naver 50) + 4개 AI 풀링 평가

---

## 새 세션 퀵스타트 (New Agent Start Here)

**새로운 Claude Code 세션이 V40 작업을 시작할 때 이 순서대로 읽으세요:**

### 1단계: 핵심 방침 파악
1. **이 README.md** (현재 파일) - 전체 구조 파악
2. **`instructions/V40_기본방침.md`** - V40의 핵심 규칙 (수집 배분, 등급 체계, 기간 제한)

### 2단계: 대상 정치인 확인
3. **`instructions/1_politicians/{이름}.md`** - 평가 대상 정치인 정보 (ID, 정당, 직책 등)

### 3단계: 프로세스 이해
4. **`instructions/V40_전체_프로세스_가이드.md`** - 7단계 프로세스 상세

### 4단계: 실행
- **자동화 실행**: `scripts/workflow/run_v40_workflow.py` (Naver 수집 + API 평가 자동)
- **Gemini CLI 수동 수집**: `instructions/2_collect/GEMINI_CLI_수집_가이드.md`
- **Gemini CLI 수동 평가**: `instructions/3_evaluate/Gemini_CLI_평가_작업방법.md`

### 핵심 용어 정리
| 용어 | 의미 |
|------|------|
| **수집 채널** (2개) | Gemini CLI (Google Search), Naver API |
| **평가 AI** (4개) | Claude, ChatGPT, Gemini, Grok |
| **OFFICIAL** | .go.kr 공식 자료 (4년 이내) |
| **PUBLIC** | 뉴스/블로그/카페 등 (2년 이내) |
| **풀링** | 2채널이 수집한 100개를 4개 AI가 각각 전체 평가 |
| **sentiment** | negative / positive / free (3종류) |

---

## 목차

1. [개요](#개요)
2. [디렉토리 구조](#디렉토리-구조)
3. [핵심 스크립트](#핵심-스크립트)
4. [사용 방법](#사용-방법)
5. [워크플로우](#워크플로우)
6. [주요 변경사항](#주요-변경사항)
7. [참고 문서](#참고-문서)

---

## 개요

### V40의 핵심 특징

**수집 (Collection):**
- **2개 채널 분담**: Gemini (50%), Naver (50%) - 완전 균등 배분
- **OFFICIAL vs PUBLIC 분담**: 객관적 사실 vs 의견/평가 구분
  - Gemini: OFFICIAL 30개 + PUBLIC 20개 = 50개
  - Naver: OFFICIAL 10개 + PUBLIC 40개 = 50개
  - 총 100개 = OFFICIAL 40개 + PUBLIC 60개
- **웹검색 필수**: AI 기억 기반 수집 금지, 실제 URL 필수
- **소스 제한 없음**: Naver 뉴스 외 모든 신뢰 가능 소스 허용 (블로그, 카페, 지식인, 학술자료 등)
- **비용 최적화**: Gemini + Naver 조합
- **카테고리당 100개**: OFFICIAL 40개 + PUBLIC 60개

**평가 (Evaluation):**
- **4개 AI 평가**: Claude, ChatGPT, Gemini, Grok
- **풀링 방식**: 모든 AI가 전체 100개 데이터 평가
- **등급 체계**: +4 ~ -4 (점수 = 등급 × 2)
- **세션 분리**: 수집 시점 ≠ 평가 시점 (객관성 보장)
- **Claude CLI Direct**: API 비용 $0 평가 가능

**자동화/수동 구분:**
- **자동화**: Naver 수집, API 평가(Claude/ChatGPT/Grok), 검증, 점수 계산
- **수동(Gemini CLI)**: Gemini 수집/평가는 CLI 터미널에 프롬프트 붙여넣기 방식
  - 수집: `instructions/2_collect/GEMINI_CLI_수집_가이드.md` 참조
  - 평가: `instructions/3_evaluate/Gemini_CLI_평가_작업방법.md` 참조
  - 헬퍼: `scripts/helpers/gemini_collect_helper.py`, `gemini_eval_helper.py`

---

## 디렉토리 구조

```
V40/
├── README.md                            ← 현재 문서 (퀵스타트 포함)
│
├── instructions/                        ← 지침 문서
│   ├── V40_기본방침.md                  ← 핵심 방침 (필독!)
│   ├── V40_전체_프로세스_가이드.md      ← 7단계 프로세스 상세
│   ├── V40_오케스트레이션_가이드.md     ← 자동화 가이드
│   │
│   ├── 1_politicians/                   ← 정치인별 정보 (범용 템플릿 기반)
│   │   ├── _TEMPLATE.md                 ← 새 정치인 추가 시 복사하여 사용
│   │   ├── 조은희.md
│   │   └── 박주민.md
│   │
│   ├── 2_collect/                       ← 수집 지침
│   │   ├── GEMINI_CLI_수집_가이드.md    ← Gemini CLI 수동 수집 절차 (범용)
│   │   ├── cat01_expertise.md ~ cat10_publicinterest.md (10개 카테고리)
│   │   └── prompts/                     ← 범용 프롬프트 템플릿
│   │       ├── gemini_official.md       ← Gemini OFFICIAL 수집 프롬프트
│   │       ├── gemini_public.md         ← Gemini PUBLIC 수집 프롬프트
│   │       ├── naver_official.md        ← Naver OFFICIAL 수집 프롬프트
│   │       └── naver_public.md          ← Naver PUBLIC 수집 프롬프트
│   │
│   └── 3_evaluate/                      ← 평가 지침
│       ├── Gemini_CLI_평가_작업방법.md  ← Gemini CLI 수동 평가 절차 (범용)
│       ├── Claude_평가_종합가이드_V40.md ← Claude 평가 가이드
│       └── cat01_expertise.md ~ cat10_publicinterest.md (10개 카테고리)
│
├── scripts/                             ← 실행 스크립트
│   ├── workflow/
│   │   └── run_v40_workflow.py         ← 전체 자동화 (권장)
│   ├── core/
│   │   ├── evaluate_v40.py             ← API 평가 자동화 (Claude, ChatGPT, Grok)
│   │   ├── calculate_v40_scores.py     ← 점수 계산
│   │   ├── validate_v40_fixed.py       ← 검증 + 재수집
│   │   └── generate_report_v40.py      ← 보고서 생성
│   ├── helpers/
│   │   ├── gemini_collect_helper.py    ← Gemini 수집: DB 조회/저장
│   │   ├── gemini_eval_helper.py       ← Gemini 평가: DB 조회/저장
│   │   ├── claude_eval_helper.py       ← Claude 평가: DB 조회/저장
│   │   └── duplicate_check_utils.py    ← 중복 체크
│   └── utils/                          ← 유틸리티 (결과 확인, 검증)
│       ├── check_v40_results.py
│       └── verify_collection.py
│
├── results/                             ← 수집/평가 결과 JSON (임시 저장)
│   ├── collect/                         ← 수집 결과
│   └── evaluate/                        ← 평가 결과
│
└── utils/                               ← 유틸리티 스크립트
    ├── analyze_date_distribution.py
    ├── analyze_low_scores.py
    ├── analyze_ratings.py
    └── test_naver.py

⚠️ **중요**: `collect_v40.py` (Naver 수집)는 상위 디렉토리에 위치
- 경로: `C:\...\0-3_AI_Evaluation_Engine\collect_v40.py`
- V40 폴더가 아닌 AI 평가 엔진 루트에 위치
```

---

## 핵심 스크립트

### 1. workflow/run_v40_workflow.py ⭐ (전체 자동화)

**역할**: 전체 워크플로우 자동 실행

**프로세스**:
```
1. 수집 (../../collect_v40.py - 상위 디렉토리에 위치)
2. 수집 검증 (버퍼 20%, 최대 120% 이내)
3. 데이터 검증 및 재수집 (core/validate_v40_fixed.py) ✅
4. 평가 (core/evaluate_v40.py)
5. 평가 검증 (97% 이상)
6. 재평가 (누락 평가 자동 처리) ✅
7. 점수 계산 (core/calculate_v40_scores.py)
```

**사용법**:
```bash
cd scripts/workflow

# 전체 자동 실행 (권장)
python run_v40_workflow.py \
  --politician_id={POLITICIAN_ID} \
  --politician_name="{POLITICIAN_NAME}" \
  --parallel

# 수집 건너뛰기 (이미 수집된 경우)
python run_v40_workflow.py \
  --politician_id={POLITICIAN_ID} \
  --politician_name="{POLITICIAN_NAME}" \
  --skip_collect

# 평가 건너뛰기 (이미 평가된 경우)
python run_v40_workflow.py \
  --politician_id={POLITICIAN_ID} \
  --politician_name="{POLITICIAN_NAME}" \
  --skip_evaluate
```

---

### 2. ../../collect_v40.py 📥 (Naver 수집 자동화)

**위치**: `0-3_AI_Evaluation_Engine/collect_v40.py` (V40 폴더 상위)

**역할**: Naver API를 통한 자동 수집 (50개)

**수집 배분**:
- **Naver (50%)**: OFFICIAL 10개 + PUBLIC 40개 = 50개
  - OFFICIAL: 국회, 정부 공식 데이터 (10개, Naver API 활용)
  - PUBLIC: Naver Search 기반 (40개) - **소스 제한 없음** (뉴스, 블로그, 카페, 지식인, 학술자료 등)

**Gemini (나머지 50%)**: CLI 수동 수집
- OFFICIAL 30개 + PUBLIC 20개 = 50개
- `instructions/2_collect/GEMINI_CLI_수집_가이드.md` 참조
- `scripts/helpers/gemini_collect_helper.py` 활용

**사용법**:
```bash
# V40 상위 디렉토리에서 실행
cd C:\Development_PoliticianFinder_com\Developement_Real_PoliticianFinder\0-3_AI_Evaluation_Engine

# 전체 수집 (순차)
python collect_v40.py --politician_id={POLITICIAN_ID} --politician_name="{POLITICIAN_NAME}"

# 전체 수집 (병렬, 빠름)
python collect_v40.py --politician_id={POLITICIAN_ID} --politician_name="{POLITICIAN_NAME}" --parallel

# 특정 AI만
python collect_v40.py --politician_id={POLITICIAN_ID} --politician_name="{POLITICIAN_NAME}" --ai=Naver

# 특정 카테고리만
python collect_v40.py --politician_id={POLITICIAN_ID} --politician_name="{POLITICIAN_NAME}" --category=1
```

---

### 3. core/validate_v40_fixed.py ✓ (검증 + 재수집)

**역할**: 수집 데이터 검증 및 재수집

**검증 항목**:
- URL 실제 존재 여부 (HEAD/GET 요청)
- 도메인 유효성 (OFFICIAL/PUBLIC 매칭)
- 필수 필드 (title, content, source_url)
- 기간 제한 (공식 4년, 공개 2년)

**사용법**:
```bash
cd scripts/core

# 검증 (DRY RUN - 삭제 없이 로그만)
python validate_v40_fixed.py --politician_id={POLITICIAN_ID} --politician_name="{POLITICIAN_NAME}"

# 검증 + 실제 삭제 수행
python validate_v40_fixed.py --politician_id={POLITICIAN_ID} --politician_name="{POLITICIAN_NAME}" --no-dry-run
```

---

### 4. core/evaluate_v40.py 📊 (API 평가 자동화)

**역할**: 4개 AI로 100개 데이터 평가

**평가 AI**:
- Claude (평가만) - CLI Direct (helpers/claude_eval_helper.py)
- ChatGPT (평가만) - API
- Gemini (수집+평가) - CLI (helpers/gemini_eval_helper.py)
- Grok (평가만) - API

**등급 체계**: +4 ~ -4 (점수 = 등급 × 2)

**사용법**:
```bash
cd scripts/core

# 전체 평가 (순차)
python evaluate_v40.py --politician_id={POLITICIAN_ID} --politician_name="{POLITICIAN_NAME}"

# 전체 평가 (병렬, 빠름)
python evaluate_v40.py --politician_id={POLITICIAN_ID} --politician_name="{POLITICIAN_NAME}" --parallel

# 특정 AI만
python evaluate_v40.py --politician_id={POLITICIAN_ID} --politician_name="{POLITICIAN_NAME}" --ai=Claude
```

---

### 5. core/calculate_v40_scores.py 🔢 (점수 계산)

**역할**: 4개 AI 평가 결과 종합 → 최종 점수 산출

**점수 계산 공식**:
```python
PRIOR = 6.0
COEFFICIENT = 0.5

# 카테고리 점수 (20~100점)
category_score = (PRIOR + avg_rating * COEFFICIENT) * 10

# 최종 점수 (200~1000점)
final_score = round(min(sum(10개 카테고리), 1000))
```

**최종 등급 (10단계)**:

| 등급 | 이름 | 점수 범위 | 설명 |
|------|------|-----------|------|
| M | Mugunghwa | 920~1000 | 최우수 |
| D | Diamond | 840~919 | 우수 |
| E | Emerald | 760~839 | 양호 |
| P | Platinum | 680~759 | 보통+ |
| G | Gold | 600~679 | 보통 |
| S | Silver | 520~599 | 보통- |
| B | Bronze | 440~519 | 미흡 |
| I | Iron | 360~439 | 부족 |
| Tn | Tin | 280~359 | 상당히 부족 |
| L | Lead | 200~279 | 매우 부족 |

**사용법**:
```bash
cd scripts/core

python calculate_v40_scores.py --politician_id={POLITICIAN_ID} --politician_name="{POLITICIAN_NAME}"
```

---

### 6. utils/check_v40_results.py 👁️ (결과 확인)

**역할**: 수집/평가/점수 결과 확인

**사용법**:
```bash
cd scripts/utils

python check_v40_results.py --politician_id={POLITICIAN_ID}
```

---

### 7. core/generate_report_v40.py 📄 (보고서 생성)

**역할**: 평가 결과 기반 상세 보고서 생성

**참조 가이드**: `보고서/AI_기반_정치인_상세평가보고서_생성_가이드_V40.md`

**사용법**:
```bash
cd scripts/core

python generate_report_v40.py {POLITICIAN_ID} {POLITICIAN_NAME}
```

**출력 파일**: `보고서/{POLITICIAN_NAME}_{YYYYMMDD}.md`

---

## 사용 방법

### 🚀 빠른 시작 (권장)

**1단계: 환경 변수 설정**

`.env` 파일에 API 키 설정:
```bash
# 수집용 (1개 API + 1개 CLI)
# ⚠️ Gemini는 CLI 사용 (API 키 불필요) - gemini_collect_helper.py 참조
NAVER_CLIENT_ID=...              # Naver (50% 수집) - 무료
NAVER_CLIENT_SECRET=...          # Naver (50% 수집) - 무료

# 평가용 (2개 API + 2개 CLI)
# ⚠️ Claude는 CLI Direct 사용 (API 키 불필요)
# ⚠️ Gemini는 CLI 사용 (API 키 불필요) - gemini_eval_helper.py 참조
OPENAI_API_KEY=sk-...            # ChatGPT (평가만, API)
XAI_API_KEY=xai-...              # Grok (평가만, API)

# Supabase
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**2단계: 전체 워크플로우 실행**

```bash
cd scripts/workflow

python run_v40_workflow.py \
  --politician_id={POLITICIAN_ID} \
  --politician_name="{POLITICIAN_NAME}" \
  --parallel
```

**끝!** 모든 프로세스가 자동으로 실행됩니다.

---

### 📝 개별 스크립트 실행

**Naver 수집만** (상위 디렉토리):
```bash
cd C:\Development_PoliticianFinder_com\Developement_Real_PoliticianFinder\0-3_AI_Evaluation_Engine
python collect_v40.py --politician_id={POLITICIAN_ID} --politician_name="{POLITICIAN_NAME}" --parallel
```

**검증만**:
```bash
cd scripts/core
python validate_v40_fixed.py --politician_id={POLITICIAN_ID} --politician_name="{POLITICIAN_NAME}"
```

**평가만**:
```bash
cd scripts/core
python evaluate_v40.py --politician_id={POLITICIAN_ID} --politician_name="{POLITICIAN_NAME}" --parallel
```

**점수 계산만**:
```bash
cd scripts/core
python calculate_v40_scores.py --politician_id={POLITICIAN_ID} --politician_name="{POLITICIAN_NAME}"
```

---

## 워크플로우

### 완전 자동화 프로세스

```
┌─────────────────────────────────────────────────────────────┐
│ run_v40_workflow.py 실행                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ [0단계] 준비 - 정치인 정보 작성 및 DB 등록 (⚠️ 수동)       │
│ - instructions/1_politicians/{정치인명}.md 작성             │
│   (_TEMPLATE.md 복사 후 플레이스홀더 치환)                  │
│ - politician_id 생성: python -c "import uuid; ..."         │
│ - politicians 테이블에 INSERT                              │
│ ※ 이 단계는 자동화 대상 아님 (사용자가 직접 수행)          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ [1단계] 수집 (../../collect_v40.py - Naver 자동)           │
│ - Naver (50%): OFFICIAL 10 + PUBLIC 40 = 50개              │
│ - Gemini (50%): CLI 수동 (helpers/gemini_collect_helper)   │
│ - 총 100개 (소스 제한 없음 - 뉴스, 블로그, 카페, 학술 등) │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ [2단계] 수집 검증                                           │
│ - 목표: 1,000개 (카테고리 10개 × 100개)                    │
│ - 기준: 버퍼 20%, 최대 120% 이내 (≤1,200개)                 │
│ - 초과 시: 경고 + 사용자 확인                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ [3단계] 데이터 검증 및 재수집 (core/validate_v40_fixed) ✅ │
│ - URL 실제 존재 여부 확인                                  │
│ - 도메인 유효성 검사 (OFFICIAL/PUBLIC)                     │
│ - 기간 제한 검증 (공식 4년, 공개 2년)                      │
│ - 검증 실패 시 자동 재수집                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ [4단계] 평가 (core/evaluate_v40.py)                        │
│ - Claude (CLI helper), ChatGPT (API)                       │
│ - Gemini (CLI helper), Grok (API)                          │
│ - 각 AI가 전체 100개 평가, 등급: +4 ~ -4                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ [5단계] 평가 검증                                           │
│ - 기준: 97% 이상 완료                                      │
│ - 계산: (평가 개수 / (100개 × 4 AIs)) × 100                │
│ - 미달 시: 재평가 단계 자동 실행                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ [6단계] 재평가 (누락 평가 자동 처리) ✅                    │
│ - 누락된 평가 자동 감지                                    │
│ - core/evaluate_v40.py 재실행                              │
│ - 누락된 평가만 자동 처리 (100% 완료까지)                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ [7단계] 점수 계산 (core/calculate_v40_scores.py)           │
│ - 4개 AI 평가 결과 종합                                    │
│ - 카테고리 점수 (10개) 계산                                │
│ - 최종 점수 (200~1000점) 산출                              │
│ - 등급 (M, D, E, P, G, S, B, I, Tn, L) 결정                │
└─────────────────────────────────────────────────────────────┘
                            ↓
                        ✅ 완료!
```

---

## 주요 변경사항

### V40 핵심 사항

| 항목 | V40 |
|------|-----|
| **수집 채널** | Gemini, Naver (2개) |
| **수집 비율** | Gemini 50%, Naver 50% (완전 균등) |
| **카테고리당 개수** | 100개 (OFFICIAL 40 + PUBLIC 60) |
| **평가 AI** | Claude, ChatGPT, Gemini, Grok (4개) |
| **Naver 소스** | ✅ 제한 없음 (뉴스, 블로그, 카페, 지식인, 학술자료) |
| **재수집 자동화** | ✅ validate_v40_fixed.py 통합 |
| **재평가 자동화** | ✅ run_v40_workflow.py 통합 |
| **비용** | **$0** (Gemini + Naver 모두 무료) |

### 비용 최적화 (2026-02-01 최종 확정)

**V40 구성**:
- **Gemini (50%, 무료)**: OFFICIAL 30 + PUBLIC 20 (Google Search Grounding 무료)
- **Naver (50%, 무료)**: OFFICIAL 10 + PUBLIC 40 (Naver Search API 무료)
- **소스 제한 없음**: Naver 뉴스 외에도 블로그, 카페, 지식인, 학술자료 등 모든 신뢰 가능 소스 허용

**결과**: **$0** (100% 무료) ✅

### 데이터 품질 향상 (2026-02-01)

**카테고리당 개수 증가**:
- V30: 50개 (OFFICIAL 20 + PUBLIC 30)
- V40: 100개 (OFFICIAL 40 + PUBLIC 60)
- 평가 데이터 2배 증가로 정확도 향상

**Naver 소스 다양화**:
- 뉴스뿐만 아니라 블로그, 카페, 지식인, 학술자료 등 다양한 소스 활용
- 정치인에 대한 더 풍부한 정보 수집 가능

---

## 참고 문서

### 필독 문서

1. **V40_기본방침.md** ⭐
   - V40의 핵심 방침 및 규칙
   - 수집/평가 AI 배분 (Gemini 50 + Naver 50)
   - 웹검색 필수 규칙
   - 등급 체계 (+4 ~ -4)

2. **V40_전체_프로세스_가이드.md** ⭐
   - 전체 프로세스 상세 설명
   - 각 스크립트 사용법
   - 검증 규칙
   - 실행 예시

3. **V40_오케스트레이션_가이드.md**
   - 자동화 워크플로우 설명
   - 메인 에이전트 역할
   - 검증 트리거
   - 진행 상황 모니터링

### 카테고리별 지침

**수집 지침** (instructions/2_collect/):
- 각 카테고리의 수집 기준
- 평가 범위 (구체적 10개 항목)
- AI별 역할 분담
- 20-20-60 균형 (부정-긍정-자유)

**평가 지침** (instructions/3_evaluate/):
- 각 카테고리의 평가 기준
- 등급 체계 (+4 ~ -4)
- 객관적 판단 기준
- 풀링 평가 방식

### 정치인 정보

**정치인별 정보** (instructions/1_politicians/):
- _TEMPLATE.md (새 정치인 추가 시 복사하여 사용)
- 조은희.md
- 박주민.md

**새 정치인 추가 방법**:
1. `_TEMPLATE.md`를 복사하여 `{이름}.md`로 저장
2. 모든 `{...}` 플레이스홀더를 실제 값으로 치환
3. `politician_id` 생성: `python -c "import uuid; print(str(uuid.uuid4())[:8])"`
4. 특별 지시사항 (수집/평가 주의점, 논란, 성과) 작성
5. 작성 완료 후 수집/평가 프로세스 실행

---

## 문제 해결

### 자주 발생하는 문제

**1. 평가 완성도가 97% 미만**
- **원인**: 병렬 실행 중 일부 AI 실패, 네트워크 오류
- **해결**: 자동으로 재평가 실행됨

**2. 수집 비율 120% 초과 (버퍼 20% 초과)**
- **원인**: AI가 너무 많은 데이터 수집
- **해결**: 경고만 출력 (계속 진행 가능)

**3. Naver API 오류**
- **원인**: Client ID/Secret 설정 오류 또는 일일 한도 초과
- **해결**: .env 파일 확인 및 Naver Developers에서 한도 확인

**4. DB 저장 오류**
- **원인**: ai_final_scores_v40 테이블 스키마 문제
- **해결**: 점수 계산은 정상 완료 (화면 출력 정상)

---

## 연락처 및 지원

- **프로젝트**: PoliticianFinder
- **버전**: V40
- **최종 업데이트**: 2026-02-01

---

**문서 끝**
