# V30 정치인 평가 시스템

**버전**: V30
**최종 업데이트**: 2026-01-19
**목적**: 웹검색 기반 3개 AI 분담 수집 (비용 최적화) + 4개 AI 풀링 평가

---

## 📋 목차

1. [개요](#개요)
2. [디렉토리 구조](#디렉토리-구조)
3. [핵심 스크립트](#핵심-스크립트)
4. [사용 방법](#사용-방법)
5. [워크플로우](#워크플로우)
6. [주요 변경사항](#주요-변경사항)
7. [참고 문서](#참고-문서)

---

## 개요

### V30의 핵심 특징

**수집 (Collection):**
- **2개 AI 분담**: Gemini (90%), Grok (10%)
- **Perplexity 제거**: 401 에러 + 비용 폭탄 ($1,050+/100명)
- **웹검색 필수**: AI 기억 기반 수집 금지, 실제 URL 필수
- **비용 최적화**: Claude/ChatGPT 수집 제외 (웹검색 비용 문제)
- **카테고리당 100개**: OFFICIAL 50개 + PUBLIC 50개

**평가 (Evaluation):**
- **4개 AI 평가**: Claude, ChatGPT, Gemini, Grok
- **풀링 방식**: 모든 AI가 전체 데이터 평가
- **등급 체계**: +4 ~ -4 (점수 = 등급 × 2)
- **세션 분리**: 수집 시점 ≠ 평가 시점 (객관성 보장)

**자동화:**
- ✅ 수집 → 검증 → 재수집 자동화
- ✅ 평가 → 검증 → 재평가 자동화
- ✅ 품질 검증 (수집 110%, 평가 97%)
- ✅ 점수 계산 자동화

---

## 디렉토리 구조

```
V30/
├── README.md                           ← 현재 문서
├── V30_비용최적화_배분변경.md          ← 비용 최적화 설명
│
├── instructions/                       ← 지침 문서
│   ├── V30_기본방침.md                 ← 핵심 방침 (필독!)
│   ├── V30_전체_프로세스_가이드.md     ← 전체 프로세스 설명
│   ├── V30_오케스트레이션_가이드.md    ← 자동화 가이드
│   ├── V30_검증요청서.md               ← 검증 관련
│   ├── V30_검증결과_*.md               ← 검증 결과 (3개)
│   │
│   ├── 1_politicians/                  ← 정치인별 정보
│   │   ├── 박주민.md
│   │   ├── 추미애.md
│   │   └── 한동훈.md
│   │
│   ├── 2_collect/                      ← 수집 지침 (10개 카테고리)
│   │   ├── cat01_expertise.md         (전문성)
│   │   ├── cat02_leadership.md        (리더십)
│   │   ├── cat03_vision.md            (비전)
│   │   ├── cat04_integrity.md         (청렴성)
│   │   ├── cat05_ethics.md            (윤리성)
│   │   ├── cat06_accountability.md    (책임감)
│   │   ├── cat07_transparency.md      (투명성)
│   │   ├── cat08_communication.md     (소통능력)
│   │   ├── cat09_responsiveness.md    (대응성)
│   │   └── cat10_publicinterest.md    (공익성)
│   │
│   └── 3_evaluate/                     ← 평가 지침 (10개 카테고리)
│       ├── cat01_expertise.md
│       ├── cat02_leadership.md
│       ├── ... (동일 구조)
│       └── cat10_publicinterest.md
│
├── scripts/                            ← 핵심 실행 스크립트
│   ├── run_v30_workflow.py            ⭐ 전체 자동화 (권장)
│   ├── collect_v30.py                 📥 수집
│   ├── validate_v30.py                ✓ 검증 + 재수집
│   ├── evaluate_v30.py                📊 평가
│   ├── calculate_v30_scores.py        🔢 점수 계산
│   ├── check_v30_results.py           👁️ 결과 확인
│   └── clear_evaluations_v30.py       🗑️ 평가 초기화
│
└── utils/                              ← 유틸리티 스크립트
    ├── analyze_date_distribution.py   (날짜 분포 분석)
    ├── analyze_low_scores.py          (낮은 점수 분석)
    ├── analyze_ratings.py             (등급 분포 분석)
    ├── fix_grounding_urls.py          (URL 수정)
    ├── fix_sentiment_constraint.py    (sentiment 제약 수정)
    ├── recollect_official_only.py     (Official 재수집)
    ├── configure_stdout_safe.py       (출력 설정)
    ├── test_gemini.py                 (Gemini 테스트)
    ├── check_progress.sh              (진행 상황 모니터링)
    └── run_fill_missing_safe*.py      (안전 실행 래퍼)
```

---

## 핵심 스크립트

### 1. run_v30_workflow.py ⭐ (전체 자동화)

**역할**: 전체 워크플로우 자동 실행

**프로세스**:
```
1. 수집 (collect_v30.py)
2. 수집 검증 (110% 이내)
3. 데이터 검증 및 재수집 (validate_v30.py) ✅
4. 평가 (evaluate_v30.py)
5. 평가 검증 (97% 이상)
6. 재평가 (누락 평가 자동 처리) ✅
7. 점수 계산 (calculate_v30_scores.py)
```

**사용법**:
```bash
cd scripts

# 전체 자동 실행 (권장)
python run_v30_workflow.py \
  --politician_id=d0a5d6e1 \
  --politician_name="조은희" \
  --parallel

# 수집 건너뛰기 (이미 수집된 경우)
python run_v30_workflow.py \
  --politician_id=d0a5d6e1 \
  --politician_name="조은희" \
  --skip_collect

# 평가 건너뛰기 (이미 평가된 경우)
python run_v30_workflow.py \
  --politician_id=d0a5d6e1 \
  --politician_name="조은희" \
  --skip_evaluate
```

---

### 2. collect_v30.py 📥 (데이터 수집)

**역할**: 2개 AI로 데이터 수집

**수집 AI**:
- **Gemini (90%)**: 공식 50개 + 공개 40개
  - OFFICIAL: 국회, 정부 공식 데이터 (50개)
  - PUBLIC: **뉴스, SNS, 위키, 블로그, 커뮤니티** (40개) ⚠️ X 제외
- **Grok (10%)**: 공개 10개
  - X/트위터 전담 (10개)
- ~~Perplexity~~: 제거 (401 에러 + 비용 폭탄 $1,050+/100명)

**사용법**:
```bash
# 전체 수집 (순차)
python collect_v30.py --politician_id=d0a5d6e1 --politician_name="조은희"

# 전체 수집 (병렬, 빠름)
python collect_v30.py --politician_id=d0a5d6e1 --politician_name="조은희" --parallel

# 특정 AI만
python collect_v30.py --politician_id=d0a5d6e1 --politician_name="조은희" --ai=Gemini

# 특정 카테고리만
python collect_v30.py --politician_id=d0a5d6e1 --politician_name="조은희" --category=1
```

---

### 3. validate_v30.py ✓ (검증 + 재수집)

**역할**: 수집 데이터 검증 및 재수집

**검증 항목**:
- URL 실제 존재 여부 (HEAD/GET 요청)
- 도메인 유효성 (OFFICIAL/PUBLIC 매칭)
- 필수 필드 (title, content, source_url)
- 기간 제한 (공식 4년, 공개 2년)

**사용법**:
```bash
# 전체 검증 + 재수집
python validate_v30.py --politician_id=d0a5d6e1 --politician_name="조은희" --mode=all

# 검증만
python validate_v30.py --politician_id=d0a5d6e1 --politician_name="조은희" --mode=validate

# 재수집만
python validate_v30.py --politician_id=d0a5d6e1 --politician_name="조은희" --mode=recollect
```

---

### 4. evaluate_v30.py 📊 (데이터 평가)

**역할**: 4개 AI로 데이터 평가

**평가 AI**:
- Claude (평가만)
- ChatGPT (평가만)
- Gemini (수집+평가)
- Grok (수집+평가)

**등급 체계**: +4 ~ -4 (점수 = 등급 × 2)

**사용법**:
```bash
# 전체 평가 (순차)
python evaluate_v30.py --politician_id=d0a5d6e1 --politician_name="조은희"

# 전체 평가 (병렬, 빠름)
python evaluate_v30.py --politician_id=d0a5d6e1 --politician_name="조은희" --parallel

# 특정 AI만
python evaluate_v30.py --politician_id=d0a5d6e1 --politician_name="조은희" --ai=Claude
```

---

### 5. calculate_v30_scores.py 🔢 (점수 계산)

**역할**: 4개 AI 평가 결과 종합 → 최종 점수 산출

**점수 계산 공식**:
```python
PRIOR = 6.0
COEFFICIENT = 0.5

# 카테고리 점수 (20~100점)
category_score = (PRIOR + avg_rating * COEFFICIENT) * 10

# 최종 점수 (200~1000점)
final_score = min(sum(10개 카테고리), 1000)
```

**최종 등급**: M, D, E, P, G, S, B, I, Tn, L (10단계)

**사용법**:
```bash
python calculate_v30_scores.py --politician_id=d0a5d6e1 --politician_name="조은희"
```

---

### 6. check_v30_results.py 👁️ (결과 확인)

**역할**: 수집/평가/점수 결과 확인

**사용법**:
```bash
python check_v30_results.py --politician_id=d0a5d6e1
```

---

### 7. clear_evaluations_v30.py 🗑️ (평가 초기화)

**역할**: 평가 데이터 삭제 (재평가 시)

**사용법**:
```bash
python clear_evaluations_v30.py --politician_id=d0a5d6e1
```

---

## 사용 방법

### 🚀 빠른 시작 (권장)

**1단계: 환경 변수 설정**

`.env` 파일에 API 키 설정:
```bash
# 수집용 (2개)
GEMINI_API_KEY=AIza...           # Gemini (90% 수집 + 평가)
XAI_API_KEY=xai-...              # Grok (10% 수집 + 평가)
# PERPLEXITY_API_KEY=pplx-...   # ⚠️ 제거 (401 에러 + 비용 폭탄)

# 평가용 (2개)
ANTHROPIC_API_KEY=sk-ant-...     # Claude (평가만)
OPENAI_API_KEY=sk-...            # ChatGPT (평가만)

# Supabase
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**2단계: 전체 워크플로우 실행**

```bash
cd scripts

python run_v30_workflow.py \
  --politician_id=d0a5d6e1 \
  --politician_name="조은희" \
  --parallel
```

**끝!** 모든 프로세스가 자동으로 실행됩니다.

---

### 📝 개별 스크립트 실행

**수집만**:
```bash
python collect_v30.py --politician_id=d0a5d6e1 --politician_name="조은희" --parallel
```

**검증 + 재수집만**:
```bash
python validate_v30.py --politician_id=d0a5d6e1 --politician_name="조은희" --mode=all
```

**평가만**:
```bash
python evaluate_v30.py --politician_id=d0a5d6e1 --politician_name="조은희" --parallel
```

**점수 계산만**:
```bash
python calculate_v30_scores.py --politician_id=d0a5d6e1 --politician_name="조은희"
```

---

## 워크플로우

### 완전 자동화 프로세스

```
┌─────────────────────────────────────────────────────────────┐
│ run_v30_workflow.py 실행                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ [1단계] 수집 (collect_v30.py)                              │
│ - Gemini (90%): 공식 50 + 공개 40 (뉴스, SNS, 위키 등)    │
│ - Grok (10%): 공개 10 (X/트위터만)                         │
│ - ~~Perplexity~~: 제거 (401 에러 + 비용 폭탄)             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ [2단계] 수집 검증                                           │
│ - 목표: 1,000개                                            │
│ - 기준: 110% 이내 (≤1,100개)                               │
│ - 초과 시: 경고 + 사용자 확인                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ [3단계] 데이터 검증 및 재수집 (validate_v30.py) ✅         │
│ - URL 실제 존재 여부 확인                                  │
│ - 도메인 유효성 검사 (OFFICIAL/PUBLIC)                     │
│ - 기간 제한 검증 (공식 4년, 공개 2년)                      │
│ - 검증 실패 시 자동 재수집                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ [4단계] 평가 (evaluate_v30.py)                             │
│ - Claude, ChatGPT, Gemini, Grok (4개 AI)                   │
│ - 각 AI가 전체 데이터(100개) 평가                          │
│ - 등급: +4 ~ -4                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ [5단계] 평가 검증                                           │
│ - 기준: 97% 이상 완료                                      │
│ - 계산: (평가 개수 / (수집 × 4 AIs)) × 100                 │
│ - 미달 시: 재평가 단계 자동 실행                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ [6단계] 재평가 (누락 평가 자동 처리) ✅                    │
│ - 누락된 평가 자동 감지                                    │
│ - evaluate_v30.py 재실행                                   │
│ - 누락된 평가만 자동 처리 (100% 완료까지)                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ [7단계] 점수 계산 (calculate_v30_scores.py)                │
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

### V28 → V30 변경 사항

| 항목 | V28 | V30 |
|------|-----|-----|
| **수집 AI** | Claude, ChatGPT, Grok, Gemini (4개) | Gemini, Grok (2개) |
| **수집 비율** | 균등 | Gemini 90%, Grok 10% |
| **평가 AI** | 4개 | Claude, ChatGPT, Gemini, Grok (4개) |
| **Claude/ChatGPT** | 수집+평가 | ⚠️ 평가만 (웹검색 비용 문제) |
| **Perplexity** | 수집+평가 | ⚠️ 제거 (401 에러 + 비용 폭탄) |
| **재수집 자동화** | ❌ | ✅ validate_v30.py 통합 |
| **재평가 자동화** | ❌ | ✅ run_v30_workflow.py 통합 |
| **비용** | ~$14.05/정치인 | ~$2.80/정치인 (80% 절감) |

### 비용 최적화 (2026-01-17)

**문제**: Claude web_search 도구 검색당 $0.01 추가 과금 → 김민석 350개 수집 시 약 $100 비용 발생

**해결**:
- Claude/ChatGPT 수집 제외 → 평가만 담당
- Gemini Google Search 무료 활용 → 90% 수집
- ~~Perplexity 검색~~ → 제거 (401 에러 + 비용 폭탄)
- Grok X 접근 무료 → 10% 수집

**결과**: ~$14.05 → ~$2.80 (80% 절감) ✅

### 자동화 개선 (2026-01-19)

**재수집 자동화**:
- validate_v30.py를 run_v30_workflow.py에 통합
- URL/도메인/기간 검증 및 자동 재수집

**재평가 자동화**:
- evaluate_v30.py 버그 수정 (90% → 100% 완료 체크)
- 누락 평가 자동 감지 및 처리
- 97% 기준 미달 시 자동 재평가

---

## 참고 문서

### 필독 문서

1. **V30_기본방침.md** ⭐
   - V30의 핵심 방침 및 규칙
   - 수집/평가 AI 배분
   - 웹검색 필수 규칙
   - 등급 체계 (+4 ~ -4)

2. **V30_전체_프로세스_가이드.md** ⭐
   - 전체 프로세스 상세 설명
   - 각 스크립트 사용법
   - 검증 규칙
   - 실행 예시

3. **V30_오케스트레이션_가이드.md**
   - 자동화 워크플로우 설명
   - 메인 에이전트 역할
   - 검증 트리거
   - 진행 상황 모니터링

4. **V30_비용최적화_배분변경.md**
   - Claude 웹검색 비용 문제
   - AI별 웹검색 비용 비교
   - 60-30-10 배분 근거
   - 비용 절감 효과

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

**정치인별 지시사항** (instructions/1_politicians/):
- 박주민.md
- 추미애.md
- 한동훈.md

---

## 문제 해결

### 자주 발생하는 문제

**1. 평가 완성도가 97% 미만**
- **원인**: 병렬 실행 중 일부 AI 실패, 네트워크 오류
- **해결**: 자동으로 재평가 실행됨

**2. 수집 비율 110% 초과**
- **원인**: AI가 너무 많은 데이터 수집
- **해결**: 경고만 출력 (계속 진행 가능)

**3. DB 저장 오류**
- **원인**: ai_final_scores_v30 테이블 스키마 문제
- **해결**: 점수 계산은 정상 완료 (화면 출력 정상)

---

## 연락처 및 지원

- **프로젝트**: PoliticianFinder
- **버전**: V30
- **최종 업데이트**: 2026-01-19

---

**문서 끝**
