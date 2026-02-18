# V40 공식 용어 정의

## 수집 방식

### Gemini CLI Direct Subprocess (재미나 CLI 다이렉트 서브프로세스)

**정의:**
Python `subprocess.run()`을 사용하여 Gemini CLI를 직접 실행하는 수집 방식

**특징:**
- MCP(Model Context Protocol) 불필요
- stdin을 통한 프롬프트 전달
- subprocess로 CLI 실행
- Google AI Pro 구독 시 1,500 requests/day quota

**구현:**
```python
import subprocess

result = subprocess.run(
    ['gemini.cmd', '--yolo'],
    input=prompt,
    capture_output=True,
    text=True,
    timeout=600,
    encoding='utf-8',
    errors='replace'
)
```

**스크립트:**
- `scripts/workflow/collect_gemini_subprocess.py` - 단일 카테고리
- `scripts/workflow/collect_gemini_subprocess_parallel.py` - 병렬 수집 (권장)

**실행 예시:**
```bash
python collect_gemini_subprocess_parallel.py --politician "박주민" --period 2
```

**장점:**
1. API 직접 사용 대비 95% 비용 절감
2. 10배 높은 무료 quota (1,000 vs 100 requests/day)
3. 설정 불필요 (API key 불필요)
4. Google AI Pro 구독 시 충분한 quota (1,500/day)

**성능:**
- 단일 카테고리: 27초
- 10개 병렬 (5+5 배치): 30-35초

---

## 수집 채널

### 1. Gemini CLI (재미나 CLI)
- **방식:** Direct Subprocess
- **데이터 타입:** OFFICIAL + PUBLIC
- **특징:** Google 검색 기반, 실시간 데이터

### 2. Naver API (네이버 API)
- **방식:** REST API 직접 호출
- **데이터 타입:** OFFICIAL + PUBLIC (OFFICIAL 10개 + PUBLIC 40개/카테고리)
- **특징:** 네이버 뉴스/블로그, 한국어 최적화

---

## 평가 방식

### Claude CLI Direct (클로드 CLI 다이렉트)
- **정의:** Claude Code 세션에서 직접 평가하는 방식 (API 아님)
- **비용:** $0 (Anthropic 구독 포함)
- **프로세스:**
  1. `claude_eval_helper.py fetch` → 미평가 데이터 JSON 조회
  2. Claude Code가 직접 읽고 평가 (25개 배치)
  3. `claude_eval_helper.py save` → 평가 결과 DB 저장
- **Skill 자동화:** `/evaluate-politician-v40` (50개 배치, 자동 진행)
- **중요:** claude_api_evaluator.py (API 방식)는 .archive/ 폴더에 보관됨 - 절대 사용 금지

### Gemini CLI Subprocess 평가
- **정의:** `evaluate_gemini_subprocess.py`로 Gemini CLI를 subprocess 호출하여 평가
- **비용:** $0 (Google AI Pro 구독)
- **배치 크기:** 25개 (Pre-filtering 적용)

### ChatGPT (Codex CLI Direct)
- **정의:** Codex CLI stdin 방식으로 gpt-5.1-codex-mini 평가
- **비용:** ~$0 (OpenAI 구독)
- **스크립트:** `scripts/helpers/codex_eval_helper.py`
- **배치 크기:** 25개 (자동 재시도: Foreign key 오류 시 5개 배치로 전환)

### Grok (xAI Agent Tools API)
- **정의:** xAI API (curl subprocess)로 grok-3 모델 평가
- **비용:** 소량 과금 (API Key 필요)
- **스크립트:** `scripts/helpers/grok_eval_helper.py`
- **배치 크기:** 25개

---

## 테이블 명칭

- `politicians` - 기본 정치인 테이블 (전체)
- `collected_data_v40` - V40 수집 데이터 (Gemini + Naver)
- `evaluations_v40` - V40 평가 결과 (4개 AI)
- `ai_category_scores_v40` - AI 카테고리별 점수
- `ai_final_scores_v40` - 최종 점수

❌ **사용 금지 (구버전):**
- `v40_events` → `collected_data_v40` 사용
- `v40_evaluations` → `evaluations_v40` 사용
- `politicians_v40` → `politicians` 사용

---

## 용어 사용 규칙

### ✅ 올바른 표현
- "Gemini CLI Direct Subprocess 방식으로 수집"
- "재미나 CLI 다이렉트 서브프로세스"
- "subprocess.run()으로 Gemini CLI 실행"

### ❌ 잘못된 표현
- "Gemini MCP 방식" (MCP는 사용하지 않음)
- "Gemini API 직접 호출" (CLI를 통해 간접 사용)
- "수동 수집" (subprocess로 자동 실행됨)

---

**최종 업데이트:** 2026-02-18 (4명 평가 완료 후 실전 반영)
**버전:** V40
