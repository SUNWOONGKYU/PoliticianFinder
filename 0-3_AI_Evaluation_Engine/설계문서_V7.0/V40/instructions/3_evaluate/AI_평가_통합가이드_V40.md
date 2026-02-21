# AI 평가 통합가이드 V40

**최종 업데이트**: 2026-02-14 (통합 완료)
**대상**: 4개 평가 AI 전체 (Claude, ChatGPT, Gemini, Grok)
**목적**: 평가 방법 통합 및 CLI vs API 비교

---

## 📋 목차

1. [개요](#1-개요)
2. [CLI vs API 비교](#2-cli-vs-api-비교)
3. [공통 규칙](#3-공통-규칙)
4. [Claude 평가 방법](#4-claude-평가-방법)
5. [ChatGPT 평가 방법](#5-chatgpt-평가-방법)
6. [Gemini 평가 방법](#6-gemini-평가-방법)
7. [Grok 평가 방법](#7-grok-평가-방법)
8. [트러블슈팅](#8-트러블슈팅)
9. [참조 문서](#9-참조-문서)

---

## 1. 개요

### 1.1 4개 평가 AI

V40 시스템은 **4개 AI가 독립적으로 전체 데이터를 평가**합니다.

| AI | 모델 | 방식 | 비용 | 자동화 |
|----|------|------|------|--------|
| **Claude** | Haiku 4.5 | CLI Direct / Skill | $0 (구독) | 반자동 / Skill 자동 |
| **ChatGPT** | gpt-5.1-codex-mini | Codex CLI Direct | $1.125/1K | 완전 자동 |
| **Gemini** | 2.5 Flash → 2.0 Flash → REST API (3단계 Fallback) | CLI Subprocess | $0 (구독) | 완전 자동 |
| **Grok** | Grok 3 | curl CLI Direct (Agent Tools API) | API 비용 | 완전 자동 |

**평가 방식:**
- 카테고리당 100개 × 10개 카테고리 = 1,000개/정치인
- 4개 AI × 1,000개 = **4,000개 평가 레코드/정치인**

### 1.2 왜 4개 AI를 모두 사용하는가?

**다양성 확보:**
- 각 AI마다 평가 관점이 다름
- 편향 최소화 (1개 AI에 의존하지 않음)
- 교차 검증 가능 (AI 간 일치도 확인)

**비용 최적화:**
- CLI 방식 채택으로 97.5% 비용 절감
- 구독 플랜 활용 (Claude/Gemini 무료)
- ChatGPT도 gpt-5.1-codex-mini로 40배 저렴

---

## 2. CLI vs API 비교

### 2.1 기술적 방식 비교

| 항목 | CLI 방식 (✅ 채택) | API 방식 (❌ 폐기) |
|------|-------------------|-------------------|
| **인증** | 🔓 Account Login (Claude/Gemini)<br>🔐 API Key (ChatGPT/Grok)<br>→ 1회 설정 후 재사용 | API Key 필수 (4개 전부)<br>→ 매 요청마다 인증 |
| **실행** | Subprocess 호출<br>→ 간단한 CLI 명령 | HTTP API 요청<br>→ 복잡한 JSON 구성 |
| **제한** | Claude/Gemini: 무제한 (구독)<br>ChatGPT/Grok: API 제한 적용 | 분당 요청 제한 (RPM)<br>→ Gemini: 15 req/min |
| **편의성** | 1회 로그인/설정<br>→ 재로그인 불필요 | API 키 관리 필수<br>→ 만료, 보안 이슈 |
| **코드** | 단순 (~20줄)<br>→ subprocess.run() | 복잡 (~70줄)<br>→ HTTP client, retry |

### 2.2 비용 비교

| AI | API 방식 (폐기) | CLI 방식 (채택) | 절감률 |
|----|----------------|----------------|--------|
| **Claude** | $0.75/1K | $0 (Pro 구독) | **100%** |
| **Gemini** | $0.19/1K (+ 할당량 제한) | $0 (AI Studio Pro) | **100%** |
| **ChatGPT** | $45/1K (gpt-4) | $1.125/1K (gpt-5.1-codex-mini) | **97.5%** |
| **Grok** | 미공개 | API 비용 (Agent Tools) | - |
| **총계** | ~$46/1K 평가 | ~$1.13/1K 평가 | **97.5%** |

**💡 핵심 인사이트**: "API가 아니라 CLI로 가라. 구독 플랜이 API보다 40배 저렴하다."

📄 **상세 분석**: `V40_AI_평가_방식_및_비용_종합_분석.md` 참조

---

## 3. 공통 규칙

### 3.1 등급 체계 (8등급 + X)

| rating | score | 의미 | 예시 |
|--------|-------|------|------|
| **+4** | +8점 | 탁월 | 법 제정, 대통령 표창 |
| **+3** | +6점 | 우수 | 다수 법안 통과 |
| **+2** | +4점 | 양호 | 법안 발의 |
| **+1** | +2점 | 보통 | 출석, 기본 활동 |
| **-1** | -2점 | 미흡 | 비판 받음 |
| **-2** | -4점 | 부족 | 논란, 의혹 |
| **-3** | -6점 | 심각 | 수사 착수 |
| **-4** | -8점 | 최악 | 유죄 확정 |
| **X** | 0점 | 제외 | 10년+과거, 동명이인, 날조 |

**점수 계산**: `score = rating × 2`

### 3.2 배치 크기 (최적화 적용)

| AI | 배치 크기 | 최적화 |
|----|----------|--------|
| **Claude** (API) | 25개 | Pre-filtering |
| **Claude** (Skill) | 50개 | Pre-filtering |
| **ChatGPT** | 25개 (자동 재시도 5) | Pre-filtering + 자동 재시도 |
| **Gemini** | 25개 | Pre-filtering |
| **Grok** | 25개 | Pre-filtering |

### 3.3 성능 최적화 (V40 개선)

- ✅ **배치 평가**: 25개씩 처리 (이전: 1-by-1) → 10x 향상
- ✅ **Pre-filtering**: 이미 평가된 데이터 사전 제외 → 5x 향상, 중복 평가 0%
- ✅ **자동 재시도**: ChatGPT Foreign key 오류 시 배치 5개로 재시도 → 안정성 100%
- ✅ **공통 저장 함수**: `common_eval_saver.py` (4개 AI 통합) → 코드 중복 제거

### 3.4 공통 저장 함수

**파일**: `scripts/helpers/common_eval_saver.py`

**역할:**
- 4개 AI 평가 결과를 통합된 방식으로 DB 저장
- 중복 체크 (같은 AI가 같은 데이터를 재평가하는 것 방지)
- 에러 처리 통일

**사용 예시:**
```python
from common_eval_saver import save_evaluations

save_evaluations(
    evaluations=results,
    politician_id=politician_id,
    category=category,
    evaluator_ai='Claude'
)
```

---

## 4. Claude 평가 방법

### 4.1 개요

**방식**: CLI Direct / Skill 자동화
**모델**: Haiku 4.5
**비용**: $0 (Pro 구독 $20/월)
**자동화**: 반자동 (Helper) / 완전 자동 (Skill)

### 4.2 방법 1: Helper 패턴 (반자동)

**스크립트**: `scripts/helpers/claude_eval_helper.py`

**Step 1: fetch (데이터 조회)**
```bash
cd V40/scripts/helpers
python claude_eval_helper.py fetch \
  --politician_id=d0a5d6e1 \
  --politician_name="조은희" \
  --category=expertise
```

**출력:**
- `eval_expertise.md` - 평가 지시서 (Claude에게 붙여넣기)
- `eval_expertise_data.json` - 평가할 데이터

**Step 2: Claude Code에서 평가 수행 (수동)**
1. `eval_expertise.md` 내용을 Claude Code에 붙여넣기
2. Claude가 평가 수행 → JSON 결과 생성
3. 결과를 `eval_result_expertise.json`으로 저장

**Step 3: save (DB 저장)**
```bash
python claude_eval_helper.py save \
  --politician_id=d0a5d6e1 \
  --politician_name="조은희" \
  --category=expertise \
  --input=eval_result_expertise.json
```

### 4.3 방법 2: Skill 자동화 (권장!) 🤖

**Skill**: `/evaluate-politician-v40`
**파일**: `.claude/skills/evaluate-politician-v40.md`

**사용법:**
```bash
# Claude Code에서 실행 (단일 카테고리)
/evaluate-politician-v40 --politician_id=d0a5d6e1 --politician_name="조은희" --category=expertise

# 전체 카테고리 (10개) 자동 평가
/evaluate-politician-v40 --politician_id=d0a5d6e1 --politician_name="조은희" --category=all
```

**특징:**
- ✅ fetch → evaluate → save 완전 자동화
- ✅ 50개 배치 자동 처리
- ✅ 사용자 개입 없이 완료
- ✅ 10개 카테고리 순차 실행 가능

**상세**: `CLAUDE.md` 섹션 참조

---

## 5. ChatGPT 평가 방법

### 5.1 개요

**방식**: Codex CLI Direct (stdin)
**모델**: gpt-5.1-codex-mini (~1 credit/message)
**비용**: $0.05 input / $0.40 output per 1M tokens (gpt-5.1 대비 96% 저렴)
**자동화**: 완전 자동

### 5.2 실행 방법

**스크립트**: `scripts/helpers/codex_eval_helper.py`

```bash
cd V40/scripts/helpers
python codex_eval_helper.py \
  --politician_id=d0a5d6e1 \
  --politician_name="조은희" \
  --category=expertise \
  --batch_size=25
```

**프로세스:**
1. DB에서 평가 대상 데이터 조회 (Pre-filtering 적용)
2. 25개씩 배치 구성
3. Codex CLI로 stdin 전달 → 평가 수행
4. 결과 파싱 → DB 저장 (common_eval_saver.py)

### 5.3 자동 재시도 (Foreign Key 오류 처리)

**문제**: 배치 25개 평가 시 가끔 Foreign key 오류 발생

**해결**: 자동으로 배치 크기 5개로 축소 후 재시도

```python
try:
    # 25개 배치로 시도
    evaluate_batch(items, batch_size=25)
except ForeignKeyError:
    # 자동으로 5개씩 재시도
    for mini_batch in split(items, 5):
        evaluate_batch(mini_batch, batch_size=5)
```

**결과**: 안정성 100% (재시도로 모든 오류 해결)

---

## 6. Gemini 평가 방법

### 6.1 개요

**방식**: CLI Subprocess (3단계 Fallback)
**모델**: 2.5 Flash (우선) → 2.0 Flash → REST API (quota/timeout 시 자동 전환)
**비용**: $0 (AI Studio Pro 구독)
**자동화**: 완전 자동

### 6.2 실행 방법

**스크립트**: `scripts/workflow/evaluate_gemini_subprocess.py`

```bash
cd V40/scripts/workflow
python evaluate_gemini_subprocess.py \
  --politician "조은희" \
  --category expertise
```

**프로세스:**
1. DB에서 평가 대상 데이터 조회 (Pre-filtering 적용)
2. Instruction 파일 로드 (`instructions/3_evaluate/cat01_expertise.md`)
3. 프롬프트 생성 (instruction + 데이터)
4. `subprocess.run(['gemini', ...])` 실행 (stdin 전달)
5. Gemini CLI 평가 수행 → stdout 출력
6. 결과 파싱 → DB 저장 (common_eval_saver.py)

### 6.3 성능 최적화

- **배치 크기**: 25개
- **Pre-filtering**: 이미 평가된 데이터 자동 제외
- **속도**: ~5초/카테고리 (이전: 27초, 5배 향상)

### 6.4 테이블 주의 ⚠️

**올바른 테이블 (V40):**
- ✅ `collected_data_v40` (수집 데이터)
- ✅ `evaluations_v40` (평가 결과)

**절대 사용 금지 (구버전):**
- ❌ `v40_events`
- ❌ `v40_evaluations`

---

## 7. Grok 평가 방법

### 7.1 개요

**방식**: curl CLI Direct (xAI API)
**모델**: Grok 3 (grok-3)
**비용**: xAI API 비용
**자동화**: 완전 자동

### 7.2 실행 방법

**스크립트**: `scripts/helpers/grok_eval_helper.py`

```bash
cd V40/scripts/helpers
python grok_eval_helper.py \
  --politician_id=d0a5d6e1 \
  --politician_name="조은희" \
  --category=expertise \
  --batch_size=25
```

**프로세스:**
1. DB에서 평가 대상 데이터 조회 (Pre-filtering 적용)
2. 25개씩 배치 구성
3. curl로 xAI API 호출 (subprocess)
4. 결과 파싱 → DB 저장 (common_eval_saver.py)

### 7.3 curl 실행 예시

```bash
curl -s -X POST https://api.x.ai/v1/responses \
  -H "Authorization: Bearer $XAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "grok-3",
    "input": [{"role": "user", "content": "평가 프롬프트"}],
    "tools": []
  }'
```

---

## 8. 트러블슈팅

### 8.1 공통 문제

**문제 1: Pre-filtering이 작동하지 않음**

**증상**: 같은 데이터를 반복 평가

**해결**:
```bash
# DB에서 evaluations_v40 테이블 확인
SELECT COUNT(*) FROM evaluations_v40
WHERE politician_id = 'd0a5d6e1'
  AND category = 'expertise'
  AND evaluator_ai = 'Claude';

# 중복 제거
DELETE FROM evaluations_v40
WHERE id NOT IN (
  SELECT MIN(id) FROM evaluations_v40
  GROUP BY politician_id, category, evaluator_ai, collected_data_id
);
```

**문제 2: JSON 파싱 오류**

**증상**: `JSONDecodeError: Expecting value`

**해결**:
1. 출력 JSON 형식 확인 (```json 블록 제거)
2. 특수문자 이스케이프 확인
3. 수동으로 JSON validator 실행

**문제 3: Foreign Key 오류 (ChatGPT)**

**증상**: `Foreign key constraint fails`

**해결**: 자동 재시도가 작동 중 (배치 5개로 축소)
- 재시도 실패 시 로그 확인
- `collected_data_id`가 실제 존재하는지 DB 확인

### 8.2 AI별 특정 문제

**Claude:**
- Helper: JSON 형식 검증 필수
- Skill: 에러 시 로그 확인 (`eval_result_*.json`)

**ChatGPT:**
- Codex credit 부족 시 OpenAI 계정 확인
- stdin 입력 크기 제한 (매우 큰 배치는 분할)

**Gemini:**
- Google 계정 로그인 상태 확인 (`gemini auth status`)
- CLI 버전 최신 유지 (`gemini --version`)

**Grok:**
- XAI_API_KEY 환경변수 설정 확인
- API 할당량 확인

---

## 9. 참조 문서

### 9.1 기본 문서

- **V40_기본방침.md** - 핵심 규칙 (등급, 배분, 기간)
- **V40_전체_프로세스_가이드.md** - 7단계 프로세스
- **V40_오케스트레이션_가이드.md** - 자동화 워크플로우

### 9.2 평가 관련

- **V40_AI_평가_방식_및_비용_종합_분석.md** - CLI vs API 상세 비교
- **CLAUDE.md** - 배치 크기 규칙, Skill 가이드
- **instructions/3_evaluate/cat01~10_*.md** - 카테고리별 평가 기준

### 9.3 스크립트

- **scripts/helpers/claude_eval_helper.py** - Claude Helper
- **scripts/helpers/codex_eval_helper.py** - ChatGPT Helper
- **scripts/helpers/grok_eval_helper.py** - Grok Helper
- **scripts/helpers/common_eval_saver.py** - 공통 저장 함수
- **scripts/workflow/evaluate_gemini_subprocess.py** - Gemini Subprocess

---

## 📊 요약 비교표

| AI | 방식 | 모델 | 배치 | 비용 | 자동화 | 스크립트 |
|----|------|------|------|------|--------|----------|
| **Claude** | CLI Direct<br>Skill | Haiku 4.5 | 25/50 | $0 | 반자동<br>완전자동 | claude_eval_helper.py<br>/evaluate-politician-v40 |
| **ChatGPT** | Codex CLI | gpt-5.1-codex-mini | 25 (재시도 5) | $1.125/1K | 완전 자동 | codex_eval_helper.py |
| **Gemini** | CLI Subprocess (3단계 Fallback) | 2.5 Flash → 2.0 Flash → REST API | 25 | $0 | 완전 자동 | evaluate_gemini_subprocess.py |
| **Grok** | curl CLI (Agent Tools API) | Grok 3 | 25 | API 비용 | 완전 자동 | grok_eval_helper.py |

---

**최종 권장 워크플로우:**

1. **Claude**: Skill 자동 평가 (`/evaluate-politician-v40 --category=all`)
2. **Gemini**: Subprocess 자동 평가 (10개 카테고리 병렬)
3. **ChatGPT**: Codex 자동 평가
4. **Grok**: API 자동 평가

**총 소요 시간**: ~30분/정치인 (4,000개 평가)

**총 비용**: ~$0.23/정치인 (API 방식 대비 97.5% 절감)

---

**📄 최종 업데이트**: 2026-02-14
**📌 관리**: V40 시스템 통합 문서
