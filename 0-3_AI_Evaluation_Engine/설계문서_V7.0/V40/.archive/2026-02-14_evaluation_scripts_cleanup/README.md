# 2026-02-14 평가 스크립트 정리

**아카이브 일자**: 2026-02-14
**작업 내용**: 중복 및 구식 Gemini 평가 스크립트 정리

---

## 이동된 파일 (5개)

### 1. gemini_eval_helper.py (helpers/)
**문제점**:
- evaluate_gemini_subprocess.py와 중복
- 공식 스크립트가 아님

**대체**: evaluate_gemini_subprocess.py 사용

---

### 2. evaluate_gemini_cli.py (helpers/)
**문제점**:
- 모델 지정 없음 (`['gemini', prompt]`만 사용)
- `--yolo` 플래그 누락
- Windows 대응 없음 (gemini.cmd 처리 안 함)
- 재시도 로직 없음
- 타임아웃 짧음

**대체**: evaluate_gemini_subprocess.py 사용

---

### 3. evaluate_gemini_simple.py (helpers/)
**문제점**:
- API 방식 사용 (CLI subprocess 아님)
- 잘못된 모델: `gemini-2.5-flash` (올바름: `gemini-2.5-flash-lite`)
- `--yolo` 플래그 누락
- 재시도 로직 없음
- Windows 대응 없음

**대체**: evaluate_gemini_subprocess.py 사용

---

### 4. test_gemini.py (helpers/)
**문제점**:
- 테스트 파일
- API 방식 사용
- 잘못된 모델: `gemini-2.5-flash` (올바름: `gemini-2.5-flash-lite`)

**대체**: evaluate_gemini_subprocess.py 사용

---

### 5. evaluate_gemini_v40.py (workflow/)
**문제점**:
- evaluate_gemini_subprocess.py와 중복
- 불필요한 중복 파일

**대체**: evaluate_gemini_subprocess.py 사용

---

## 올바른 평가 프로세스 (V40 확정)

### 4개 AI 평가 스크립트 - 균형 잡힌 구성

| AI | 스크립트 | 위치 | 방식 | 모델 | 비용 구조 | 배치 크기 |
|---|---------|------|------|------|-----------|----------|
| **Claude** | `claude_eval_helper.py` | helpers/ | CLI Direct | Haiku 4.5 | 구독 포함 ($0.10/$0.40 수준) | 25개 |
| **ChatGPT** | `codex_eval_helper.py` | helpers/ | CLI subprocess | gpt-5.1 | ChatGPT Plus 구독 포함 | 25개 |
| **Grok** | `grok_eval_helper.py` | helpers/ | curl subprocess (xAI API) | grok-3 | API 비용 ($0.30/$0.50) | 25개 |
| **Gemini** | `evaluate_gemini_subprocess.py` | workflow/ | CLI Subprocess | gemini-2.5-flash-lite | API 비용 ($0.10/$0.40) | 25개 |

**핵심 원칙**: CLI 우선, 구독 활용, 최소 API 비용 (Grok + Gemini만 API 비용 발생)

### 상세 설정

#### 1. Claude 평가 (CLI Direct)
```python
# claude_eval_helper.py
# Claude Code가 직접 평가 수행
# ⚠️ 중요: 반드시 Haiku 4.5 모델 사용
모델: Haiku 4.5 ($0.10/M input, $0.40/M output)
```

#### 2. ChatGPT 평가 (CLI subprocess)
```python
# codex_eval_helper.py Line 117
['codex', 'exec']

# 핵심 요소:
- 모델: gpt-5.1 (ChatGPT 계정 기본값, 구독 포함)
- stdin으로 프롬프트 전달
- timeout: 60초
- 별도 API 비용 없음 (ChatGPT Plus 구독 활용)
```

#### 3. Grok 평가 (curl subprocess)
```python
# grok_eval_helper.py Line 131
payload = {"model": "grok-3", ...}
curl -X POST https://api.x.ai/v1/responses

# 핵심 요소:
- 모델: grok-3 (저렴, grok-4-1-fast-reasoning 아님)
- Agent Tools API 사용 (/v1/responses)
- curl subprocess로 CLI 철학 유지
```

#### 4. Gemini 평가 (CLI subprocess)
```python
# evaluate_gemini_subprocess.py
[gemini_cmd, '-m', 'gemini-2.5-flash-lite', '--yolo']

# 핵심 요소:
- 모델: gemini-2.5-flash-lite
- 플래그: --yolo
- 타임아웃: 3600초 (1시간)
- 재시도: 최대 3회
- Windows 대응: gemini.cmd vs gemini
- UTF-8 인코딩
```

---

## 수집 프로세스 경험 반영

Gemini 수집 스크립트에서 검증된 설정들이 평가 스크립트에도 그대로 적용됨:

1. ✅ **모델명 통일**: `gemini-2.5-flash-lite` (flash 아님)
2. ✅ **플래그 적용**: `--yolo` 사용
3. ✅ **타임아웃 설정**: 3600초
4. ✅ **재시도 로직**: 최대 3회, 점진적 대기
5. ✅ **Windows 대응**: gemini.cmd 처리
6. ✅ **UTF-8 인코딩**: 한글 처리

**핵심 원칙**: 수집과 평가에서 **동일한 Gemini CLI 실행 함수** 사용

---

## 배치 크기 통일

**모든 AI가 동일**: 25개

| AI | 배치 크기 |
|---|----------|
| Claude | 25개 |
| ChatGPT | 25개 |
| Grok | 25개 |
| Gemini | 25개 |

**이전 오류**: 문서에 "Gemini 50개"로 잘못 기재
**수정 완료**: 모든 AI가 25개로 통일

---

## 참고

- 수집 스크립트: `collect_gemini_subprocess.py`
- 평가 스크립트: `evaluate_gemini_subprocess.py`
- 공통 함수: `execute_gemini_cli()` (수집 스크립트에서 import)
