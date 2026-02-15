# V40 정치인 평가 시스템

**버전**: V40
**최종 업데이트**: 2026-02-12 (평가 최적화 완료)
**목적**: 웹검색 기반 2개 채널 분담 수집 (Gemini 50 + Naver 50) + 4개 AI 풀링 평가

**🚀 주요 변경사항 (2026-02-12)**:
- ✅ **ChatGPT 모델**: gpt-5-nano → gpt-5.1-codex-mini
- ✅ **배치 평가**: Gemini, ChatGPT 25개씩 처리 (10x 향상)
- ✅ **Pre-filtering**: 이미 평가된 데이터 자동 제외 (5x 향상)
- ✅ **자동 재시도**: ChatGPT Foreign key 오류 대응
- ✅ **공통 저장 함수**: common_eval_saver.py 통합

---

## ⚠️⚠️⚠️ 새 세션 필수 읽기 (New Agent MUST Read First) ⚠️⚠️⚠️

**🚨 경고: V40 작업을 시작하는 모든 Claude Code 세션은 아래 3개 문서를 반드시 먼저 읽어야 합니다!**

### 📋 필수 문서 (순서대로 반드시 읽기!)

#### 1. **이 `README.md`** ⭐ 필독!
- **역할**: V40 시스템 전체 구조 파악
- **내용**: 개요, 디렉토리 구조, 핵심 스크립트, 워크플로우
- **⚠️ 읽지 않으면**: 전체 구조를 모르고 작업하게 됨

#### 2. **`V40_문서_관계도.md`** ⭐ 필독!
- **역할**: 모든 문서 간 연결 관계 시각화
- **내용**: 계층적 관계도, 프로세스 플로우, 참조 관계
- **⚠️ 읽지 않으면**: 필요한 정보를 어디서 찾을지 모름

#### 3. **`instructions/V40_기본방침.md`** ⭐ 필독!
- **역할**: V40의 핵심 규칙
- **내용**: 수집 배분, OFFICIAL/PUBLIC 정의, 등급 체계, 기간 제한
- **⚠️ 읽지 않으면**: 잘못된 방식으로 수집/평가하게 됨

#### 4. **`instructions/V40_전체_프로세스_가이드.md`** ⭐ 필독!
- **역할**: 7단계 프로세스 상세 가이드
- **내용**: Phase 0~7 전체 프로세스, 모든 실행 명령 포함
- **⚠️ 읽지 않으면**: 실행 명령을 몰라 작업 불가

#### 5. **`instructions/V40_오케스트레이션_가이드.md`** ⭐ 필독!
- **역할**: 자동화 워크플로우 가이드
- **내용**: Step 0 (정치인 정보 수집), 전체 오케스트레이션
- **⚠️ 읽지 않으면**: Step 0를 건너뛰어 수집 실패

### 🚫 경고

❌ **이 5개 문서를 읽지 않고 작업 시작하지 마세요!**
❌ **README.md만 읽고 넘어가지 마세요!**
❌ **추측으로 작업하지 마세요!**

### ✅ 작업 시작 전 체크리스트

- [ ] README.md 읽음 (이 문서)
- [ ] V40_문서_관계도.md 읽음
- [ ] V40_기본방침.md 읽음
- [ ] V40_전체_프로세스_가이드.md 읽음
- [ ] V40_오케스트레이션_가이드.md 읽음
- [ ] 정치인 정보 확인 (instructions/1_politicians/)

**모든 체크박스를 체크한 후에만 작업을 시작하세요!**

---

## 추가 참고 문서

### 4단계: 실행 방법 확인
- **자동화 실행**: `scripts/workflow/run_v40_workflow.py` (Naver 수집 + API 평가 자동)
- **Gemini CLI Subprocess 수집**: `instructions/2_collect/GEMINI_CLI_수집_가이드.md`
- **Gemini CLI Subprocess 평가**: `instructions/3_evaluate/Gemini_CLI_평가_작업방법.md`
- **공식 용어 정의**: `TERMINOLOGY.md`
- **문서 관계도**: `V40_문서_관계도.md`

### 핵심 용어 정리
| 용어 | 의미 |
|------|------|
| **수집 채널** (2개) | Gemini CLI Direct Subprocess, Naver API |
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

### ⚠️ **필수 요구사항: Google AI Pro 유료 계정**

**V40 시스템은 Google AI Pro 유료 계정 없이 작동할 수 없습니다!**

**무료 계정 사용 시 발생하는 문제:**
- ❌ API Quota 제한으로 인한 수집 실패
- ❌ "You have exhausted your capacity on this model" 오류 반복
- ❌ 불완전한 데이터 수집 및 작업 중단
- ❌ V40 워크플로우 정상 작동 불가

**유료 계정 필수 이유:**
- ✅ 일일 1,500 requests 쿼터 (안정적인 대량 수집)
- ✅ Gemini CLI를 통한 웹검색 기반 수집 가능
- ✅ 10개 카테고리 × 100개 데이터 수집 가능
- ✅ 4개 AI 평가 프로세스 정상 작동

**유료 계정 인증 방법:**
자세한 내용은 `instructions/2_collect/GEMINI_CLI_수집_가이드.md` 섹션 2 참조

---

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
- **4개 AI 평가**: Claude (Haiku 4.5), ChatGPT (gpt-5.1-codex-mini), Gemini (2.0 Flash), Grok (2)
- **풀링 방식**: 모든 AI가 전체 100개 데이터 평가
- **등급 체계**: +4 ~ -4 (점수 = 등급 × 2)
- **세션 분리**: 수집 시점 ≠ 평가 시점 (객관성 보장)
- **CLI Direct 3개**: Claude, Codex (ChatGPT gpt-5.1-codex-mini), Gemini - API 비용 $0
  - ChatGPT gpt-5.1-codex-mini: ~1 credit/message, $0.05/$0.40 per 1M tokens (96% cheaper than gpt-5.1)
- **API 1개**: Grok (xAI API)
- **자동화**: Claude Skill `/evaluate-politician-v40` (50개 배치 자동 평가)
- **최적화**: 배치 평가 25개 + Pre-filtering + 자동 재시도 → 평균 7배 빠른 속도

**🔧 기술적 방식 비교 (API vs CLI)**:

| 항목 | CLI (✅ 채택) | API (❌ 폐기) | 개선 |
|------|--------------|--------------|------|
| 인증 | 1회 설정 | 매 요청 | 편의성 ↑ |
| 실행 | Subprocess | HTTP | 복잡도 ↓ |
| 제한 | 무제한 (구독) | RPM 제한 | 속도 ↑ |
| 비용 | ~$1.13/1K | ~$46/1K | **97.5% 절감** |

📄 상세: `V40_AI_평가_방식_및_비용_종합_분석.md`

**자동화 방식:**
- **Naver 수집**: API (collect_v40.py)
- **Gemini 수집/평가**: **Gemini CLI Subprocess**
  - 정의: Python `subprocess.run()`으로 Gemini CLI 직접 실행
  - `collect_gemini_subprocess.py` - 단일 카테고리 수집 (27초)
  - `collect_gemini_subprocess_parallel.py` - 10개 카테고리 병렬 수집 (30-35초)
  - `evaluate_gemini_subprocess.py` - Gemini 평가 (~5초/카테고리, Pre-filtering 적용)
- **평가 헬퍼 스크립트** (scripts/helpers/):
  - Claude: `claude_eval_helper.py` (Anthropic API, Haiku 4.5)
  - ChatGPT: `codex_eval_helper.py` (Codex CLI Direct, gpt-5.1-codex-mini, stdin, 배치 25 + 자동 재시도)
  - Gemini: `evaluate_gemini_subprocess.py` (Gemini CLI Subprocess, 2.0 Flash, Pre-filtering)
  - Grok: `grok_eval_helper.py` (xAI API Direct, Grok 2)
  - **공통 저장**: `common_eval_saver.py` (4개 AI 통합 저장 함수)
- **자동화**: Claude Skill (`/evaluate-politician-v40`) - 50개 배치 자동 평가
- **검증, 점수 계산**: 자동

**공식 용어:**
- V40 Gemini 수집/평가 방식: **Gemini CLI Subprocess**
- 상세 정의: `TERMINOLOGY.md` 참조

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
│       ├── Gemini_CLI_평가_작업방법.md  ← Gemini CLI Subprocess 평가
│       ├── Claude_평가_종합가이드_V40.md ← Claude 평가 가이드
│       └── cat01_expertise.md ~ cat10_publicinterest.md (10개 카테고리)
│
├── scripts/                             ← 실행 스크립트
│   ├── workflow/
│   │   └── run_v40_workflow.py         ← 전체 자동화 (권장)
│   ├── core/
│   │   ├── calculate_v40_scores.py     ← 점수 계산
│   │   ├── validate_v40_fixed.py       ← 검증 + 재수집
│   │   └── generate_report_v40.py      ← 보고서 생성
│   ├── helpers/
│   │   ├── gemini_collect_helper.py    ← Gemini 수집: DB 조회/저장
│   │   ├── gemini_eval_helper.py       ← Gemini 평가: DB 조회/저장
│   │   ├── claude_eval_helper.py       ← Claude 평가: Anthropic API
│   │   ├── codex_eval_helper.py        ← ChatGPT 평가: Codex CLI (stdin)
│   │   ├── grok_eval_helper.py         ← Grok 평가: xAI API Direct
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
4. 평가 (helpers/*_eval_helper.py - AI별 Helper 사용)
5. 평가 검증 (95% 이상)
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

**Gemini (나머지 50%)**: Direct Subprocess 자동 수집
- OFFICIAL 30개 + PUBLIC 20개 = 50개
- `scripts/workflow/collect_gemini_subprocess.py` (단일 카테고리)
- `scripts/workflow/collect_gemini_subprocess_parallel.py` (10개 병렬)
- 평균 응답 시간: 27초/카테고리, 10개 병렬 30-35초

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

### 3. core/validate_and_recollect_v40.py ✓ (검증 + 재수집 통합)

**역할**: 수집 데이터 검증 및 자동 재수집 (통합 프로세스)

**핵심 규칙**:
- **초기 수집 목표**: 120개/카테고리 (100 + 20% 버퍼)
- **최소 목표**: 100개/카테고리 (필수 달성)
- **재수집 목표**: 100개까지만 (버퍼 제외)

**검증 항목**:
- URL 실제 존재 여부 (HEAD/GET 요청)
- 도메인 유효성 (OFFICIAL/PUBLIC 매칭)
- 필수 필드 (title, content, source_url)
- 기간 제한 (공식 4년, 공개 2년)
- 최소 목표 100개 달성 여부

**프로세스**:
```
1. 검증 수행 (플래깅만, 삭제 안 함)
2. 카테고리별 체크 (100개 기준)
3. 100개 미만 카테고리만 재수집
4. 재수집 목표는 100개까지
5. 최종 보고
```

**사용법**:
```bash
cd scripts/core

# 검증 + 재수집 (전체 자동)
python validate_and_recollect_v40.py --politician_id={POLITICIAN_ID} --politician_name="{POLITICIAN_NAME}"

# 시뮬레이션만 (실제 수집 안 함)
python validate_and_recollect_v40.py --politician_id={POLITICIAN_ID} --politician_name="{POLITICIAN_NAME}" --dry-run
```

**구형 스크립트** (참고용):
- `validate_v40_fixed.py` - 검증만 수행 (재수집 미포함)
- `validate_v40_redesigned.py` - 플래깅만 (삭제 안 함)

---

### 4. 평가 📊 (AI별 Helper 사용)

**역할**: 4개 AI로 100개 데이터 평가 (각 AI별 Helper 직접 실행)

**평가 AI 및 도구**:
- **Claude** (Haiku 4.5): CLI Direct → `helpers/claude_eval_helper.py` (배치 25개)
- **ChatGPT** (gpt-5.1-codex-mini): CLI stdin → `helpers/codex_eval_helper.py` (배치 25개)
  - 비용: $0.05/$0.40 per 1M tokens (96% cheaper than gpt-5.1)
- **Gemini** (2.0 Flash): CLI Subprocess → `workflow/evaluate_gemini_subprocess.py` (배치 50개)
- **Grok** (Grok 2): xAI API → `helpers/grok_eval_helper.py` (배치 25개)

**등급 체계**: +4 ~ -4 (점수 = 등급 × 2)

**배치 크기 규칙**:
- API 평가 (Claude/ChatGPT/Grok): 25개 배치
- Gemini CLI Subprocess: 50개 배치
- Claude Skill 자동 평가: 50개 배치

**사용법 예시**:
```bash
# ChatGPT 평가
cd scripts/helpers
python codex_eval_helper.py \
  --politician_id=8c5dcc89 \
  --politician_name="박주민" \
  --category=expertise \
  --batch_size=25

# Gemini 평가
cd scripts/workflow
python evaluate_gemini_subprocess.py \
  --politician "박주민" \
  --category "expertise"

# Grok 평가
cd scripts/helpers
python grok_eval_helper.py \
  --politician_id=8c5dcc89 \
  --politician_name="박주민" \
  --category=expertise \
  --batch_size=25
```

**참고**: 상세한 평가 방법은 `instructions/V40_전체_프로세스_가이드.md` Phase 4 참조

---

### 4-2. Claude Skill 자동 평가 🤖 (권장!)

**역할**: Claude Code Skill을 통한 완전 자동 평가

**특징**:
- ✅ 50개 배치 자동 처리 (빠름!)
- ✅ fetch → evaluate → save 자동화
- ✅ 사용자 개입 없이 전체 프로세스 완료
- ✅ 10개 카테고리 순차 실행 가능

**사용법**:
```bash
# Claude Code에서 실행 (단일 카테고리)
/evaluate-politician-v40 --politician_id=d0a5d6e1 --politician_name="조은희" --category=expertise

# 전체 카테고리 자동 평가
/evaluate-politician-v40 --politician_id=d0a5d6e1 --politician_name="조은희" --category=all
```

**Skill 파일**: `.claude/skills/evaluate-politician-v40.md`

**상세 가이드**: `CLAUDE.md` 섹션 "배치 크기 규칙" 참조

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
# 수집용 (Naver API + Gemini CLI Direct Subprocess)
# ⚠️ Gemini CLI는 직접 subprocess 호출 (API 키 불필요)
NAVER_CLIENT_ID=...              # Naver (50% 수집) - 무료
NAVER_CLIENT_SECRET=...          # Naver (50% 수집) - 무료

# 평가용 (4개 AI: Claude Haiku 4.5, ChatGPT gpt-5.1-codex-mini, Gemini 2.0 Flash, Grok 2)
ANTHROPIC_API_KEY=sk-ant-...     # Claude API (Haiku 4.5)
OPENAI_API_KEY=sk-...            # Codex CLI (ChatGPT gpt-5.1-codex-mini, $0.05/$0.40/1M tokens) - 선택적
XAI_API_KEY=xai-...              # Grok API (Grok 2)
# ⚠️ Gemini는 CLI Subprocess 사용 (API 키 불필요, 2.0 Flash)

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

**검증 & 재수집**:
```bash
cd scripts/core

# ⚠️ 실제 실행 (무효 데이터 삭제 수행)
python validate_v40_fixed.py \
  --politician_id={POLITICIAN_ID} \
  --politician_name="{POLITICIAN_NAME}" \
  --no-dry-run

# 시뮬레이션만 (삭제 안 함, 검증만)
python validate_v40_fixed.py \
  --politician_id={POLITICIAN_ID} \
  --politician_name="{POLITICIAN_NAME}"
```

**평가만** (AI별 Helper 사용):
```bash
# ChatGPT 평가
cd scripts/helpers
python codex_eval_helper.py --politician_id={POLITICIAN_ID} --politician_name="{POLITICIAN_NAME}" --category={CATEGORY} --batch_size=25

# Gemini 평가
cd scripts/workflow
python evaluate_gemini_subprocess.py --politician "{POLITICIAN_NAME}" --category "{CATEGORY}"

# Grok 평가
cd scripts/helpers
python grok_eval_helper.py --politician_id={POLITICIAN_ID} --politician_name="{POLITICIAN_NAME}" --category={CATEGORY} --batch_size=25
```

**점수 계산만**:
```bash
cd scripts/core
python calculate_v40_scores.py --politician_id={POLITICIAN_ID} --politician_name="{POLITICIAN_NAME}"
```

---

### 🔄 추가 평가 (평가 누락 시)

**⚠️ evaluate_missing_v40_api.py는 Deprecated! 사용하지 마세요!**

**핵심 원칙**: 각 AI의 Helper 스크립트를 다시 실행하면 자동으로 미평가 데이터만 평가합니다.

#### 언제 필요한가?
- 평가 상태 확인 시 누락 발견 (예: ChatGPT 175/179)
- 오류로 인한 평가 중단
- 새로운 데이터 수집 후

#### AI별 추가 평가 명령

**Claude**:
```bash
cd scripts/helpers
python claude_eval_helper.py --politician_id={ID} --politician_name="{NAME}" --category=expertise --batch_size=25
```

**ChatGPT**:
```bash
cd scripts/helpers
python codex_eval_helper.py --politician_id={ID} --politician_name="{NAME}" --category=expertise --batch_size=25
```

**Gemini**:
```bash
cd scripts/workflow
python evaluate_gemini_subprocess.py --politician "{NAME}" --category "expertise"
```

**Grok**:
```bash
cd scripts/helpers
python grok_eval_helper.py --politician_id={ID} --politician_name="{NAME}" --category=expertise --batch_size=25
```

#### 상태 확인
```bash
cd scripts/utils
python check_evaluation_status.py --politician "{NAME}"
```

**📖 상세 가이드**: `instructions/V40_추가평가_가이드.md`

---

## 워크플로우

### 자동화 프로세스

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
│ [1단계] 수집 (자동화)                                       │
│ - Naver (50%): OFFICIAL 10 + PUBLIC 40 = 50개              │
│   (../../collect_v40.py - API 자동)                        │
│ - Gemini (50%): OFFICIAL 30 + PUBLIC 20 = 50개             │
│   (workflow/collect_gemini_subprocess_parallel.py - 자동)  │
│ - 총 100개 (소스 제한 없음 - 뉴스, 블로그, 카페, 학술 등) │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ [2단계] 수집 검증                                           │
│ - 초기 목표: 1,200개 (카테고리 10개 × 120개, 버퍼 포함)    │
│ - 최소 목표: 1,000개 (카테고리 10개 × 100개, 필수)         │
│ - 기준: 버퍼 20%, 최대 120% 이내 (≤1,200개)                 │
│ - 초과 시: 경고 + 사용자 확인                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ [3단계] 검증 (validate_v40_fixed.py) ✅                    │
│ - URL 실제 존재 여부 확인                                  │
│ - 도메인 유효성 검사 (OFFICIAL/PUBLIC)                     │
│ - 기간 제한 검증 (OFFICIAL 4년, PUBLIC 2년)                │
│ - 같은 AI 내 중복 제거 (다른 AI는 유지)                   │
│ - 가짜 URL 패턴 탐지                                       │
│ ⚠️ 다음 단계: Phase 3-3 (검증 후 조정)                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ [3-3단계] 검증 후 조정 (Phase 3-3) ⚖️ ✨ NEW!              │
│                                                             │
│ AI별/카테고리별 데이터 균형 조정                            │
│                                                             │
│ 📊 목표:                                                    │
│ - AI별: 500-600개 (Gemini 500-600, Naver 500-600)          │
│ - 카테고리별: 50-60개/AI                                    │
│ - 전체: 1,000-1,200개                                       │
│                                                             │
│ 🔄 조정:                                                     │
│ - 초과(60개↑): 오래된 데이터부터 삭제 (adjust_v40_data.py) │
│ - 부족(50개↓): AI별 재수집 (recollect_gemini/naver_v40.py) │
│                                                             │
│ ⭐ 시간 절약 팁:                                             │
│ - Phase 2에서 버퍼 60개 수집 → 이 단계 거의 스킵!          │
│ - Phase 2에서 최소 50개만 수집 → 재수집 2-3시간 소요!      │
│                                                             │
│ 📖 상세: instructions/V40_검증후조정_가이드.md              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ [4단계] 평가 (자동화)                                       │
│ - Claude (CLI Direct), Codex/ChatGPT (CLI Direct)         │
│ - Gemini (CLI Subprocess), Grok (API)                     │
│ - 각 AI가 전체 100개 평가, 등급: +4 ~ -4                   │
│ - 평균 응답: 27초/카테고리 (Claude, Gemini)                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ [5단계] 평가 검증                                           │
│ - 기준: 95% 이상 완료                                      │
│ - 계산: (평가 개수 / (수집 개수 × 4 AIs)) × 100            │
│ - 예) 1,000개 수집 → 3,800개 평가 / 950개 데이터 평가 완료 │
│ - 미달 시: 재평가 단계 자동 실행                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ [6단계] 재평가 (누락 평가 자동 처리) ✅                    │
│ - 누락된 평가 자동 감지                                    │
│ - 각 AI Helper 재실행 (자동으로 미평가만 처리)             │
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

## 검증 및 재수집 규칙 (V40 현행)

### 수집 목표 체계

V40에서는 **AI별 균형 목표 체계**를 사용합니다:

| 목표 유형 | AI별/카테고리 | AI별 합계 | 전체 합계 | 적용 시점 |
|----------|-------------|----------|----------|----------|
| **버퍼 목표** (권장) | 60개 | 600개 | 1,200개 | Phase 2: 수집 |
| **최소 목표** (필수) | 50개 | 500개 | 1,000개 | Phase 3-3: 조정 |

**핵심 원칙**:
- **50-50 분배**: Gemini 50% + Naver 50% (절대 규칙)
- **카테고리 동일**: 모든 카테고리 동일 목표 (차별 금지)

### Phase별 프로세스

**Phase 2: 데이터 수집**
- 목표: 60개/AI/카테고리 (Gemini 60 + Naver 60 = 120)
- 이유: 검증 과정에서 일부 데이터 손실 예상 (약 10-20%)
- **⭐ 권장**: 처음부터 버퍼 목표(60개)로 수집!

**Phase 3: 검증**
- 스크립트: `validate_v40_fixed.py --no-dry-run`
- 기능: 중복 제거, 기간 제한 체크, URL 유효성 검증
- 결과: 데이터 일부 삭제 (검증 실패 항목)

**Phase 3-3: 검증 후 조정** ✨ NEW!
- 스크립트: `adjust_v40_data.py` (자동 삭제) + `recollect_*.py` (수동 재수집)
- 목표 범위: 50-60개/AI/카테고리
- 조정:
  - 60개 초과 → 오래된 데이터부터 자동 삭제
  - 50개 미만 → AI별 재수집 (recollect_gemini_v40.py / recollect_naver_v40.py)

### 시간 비교 (버퍼 수집 vs 최소 수집)

| 수집 방식 | Phase 2 | Phase 3 | Phase 3-3 | 합계 |
|----------|---------|---------|-----------|------|
| **버퍼 60개** ✅ | 30-40분 | 10-15분 | 5-15분 | **45-70분** |
| **최소 50개** ❌ | 20-30분 | 10-15분 | **2-3시간!** | **2.5-3.5시간** |

**결론**: 처음부터 버퍼 목표(60개)로 수집하면 전체 시간이 2배 빠름!

### 예시

**Case 1: 버퍼 수집 (권장) ✅**
```
Phase 2 수집: Gemini 63개, Naver 62개 (총 125개)
Phase 3 검증: 8개 삭제 → Gemini 59개, Naver 58개 (총 117개)
Phase 3-3 조정: 균형 OK! (50-60개 범위) → 스킵 (5분)
```

**Case 2: 최소 수집 (비권장) ❌**
```
Phase 2 수집: Gemini 52개, Naver 51개 (총 103개)
Phase 3 검증: 10개 삭제 → Gemini 47개, Naver 46개 (총 93개)
Phase 3-3 조정: 부족! (50개 미만) → 재수집 (2-3시간)
  - Gemini 47 → 53 (6개 재수집, 6라운드)
  - Naver 46 → 52 (6개 재수집, 10분)
```

### 사용 스크립트

**Phase 3: 검증**
```bash
cd V40/scripts/core
python validate_v40_fixed.py \
  --politician_id=d0a5d6e1 \
  --politician_name="조은희" \
  --no-dry-run
```

**Phase 3-3: 검증 후 조정**
```bash
# 1. 자동 조정 (60개 초과 삭제)
cd V40/scripts/core
python adjust_v40_data.py --politician_id=d0a5d6e1

# 2. 재수집 (50개 미만 시만)
cd V40/scripts/workflow
python recollect_gemini_v40.py --politician "조은희"
python recollect_naver_v40.py --politician_id d0a5d6e1 --politician_name "조은희"
```

### 재수집 프로세스 (50개 미만 시)

**전체 흐름**:
```
Step 1: 부족 카테고리 식별
  ├─ check_collection_status.py 실행
  └─ 50개 미만 카테고리 확인
  ↓
Step 2: AI별 재수집 실행
  ├─ Gemini: recollect_gemini_v40.py
  │   └─ 6-7회 실행 (1회=10개, 5-10분)
  └─ Naver: recollect_naver_v40.py
      └─ 1회 실행 (60개 목표, 1-2분)
  ↓
Step 3: 확인 및 반복
  ├─ 상태 재확인 (check_collection_status.py)
  ├─ 60개 이상 → ✅ 완료
  ├─ 50-59개 → ✅ 완료 (최소 목표 달성)
  └─ 50개 미만 → 🔄 Step 2 반복 (최대 3회)
```

**실전 사례 (조은희 integrity)**:
```
검증 후: Gemini 18개 (부족 42개!)
→ 라운드 1-4: recollect_gemini_v40.py 실행 (40개 수집)
→ 중간 확인: Gemini 58개
→ 라운드 5-6: 추가 실행 (10개 수집)
→ 최종: Gemini 68개 ✅
소요 시간: 8라운드 × 5-10분 = 40-80분
```

**참고**: 상세한 조정 방법은 `instructions/V40_검증후조정_가이드.md` 참조

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

4. **V40_검증후조정_가이드.md** ✨ NEW!
   - Phase 3-3 검증 후 조정 프로세스
   - AI별/카테고리별 데이터 균형 조정
   - 삭제 전략 (시간 기반 vs 품질 기반)
   - 재수집 절차 및 목표
   - 무한루프 방지 메커니즘

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

**1. 평가 완성도가 95% 미만**
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

## MCP 방식 (보관됨, 미래 사용 예정)

### 현재 상황
- **사용 중**: Direct Subprocess 방식 (27초)
- **보관됨**: MCP 방식 (`scripts/mcp/` 폴더)

### 성능 비교

| 방식 | 소요 시간 | 상태 |
|------|----------|------|
| Direct subprocess | 27초 | ✅ 현재 사용 중 |
| MCP (현재 기술) | 60-120초 | ⚠️ 너무 느림 (보관) |
| MCP (미래 공식 지원) | 27초 (예상) | 🔜 대기 중 |

### 보관된 MCP 파일들
- `scripts/mcp/gemini_mcp_server_production.py` - MCP 서버 구현
- `scripts/mcp/MCP_SERVER_SETUP.md` - MCP 설정 가이드
- `scripts/mcp/MCP_연구결과.md` - 성능 분석 결과

### 미래 전환 조건
Gemini CLI가 공식 MCP 서버 모드를 지원하고 다음 조건을 충족하면 전환:
1. 응답 시간 < 35초
2. 안정성 99%+
3. 공식 지원 (베타 아님)

자세한 내용: `MCP_TO_SUBPROCESS_MIGRATION_PLAN.md` 참조

---

## 연락처 및 지원

- **프로젝트**: PoliticianFinder
- **버전**: V40
- **최종 업데이트**: 2026-02-01

---

**문서 끝**
