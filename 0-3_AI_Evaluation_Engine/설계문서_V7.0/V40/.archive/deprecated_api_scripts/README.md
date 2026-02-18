# Deprecated API 방식 평가 스크립트

**이동 날짜**: 2026-02-12
**이유**: V40에서 CLI/Direct 방식으로 전환

---

## 📋 보관된 파일 목록

### 1. evaluate_missing_v40_api.py
- **목적**: 추가 평가 (API 방식 전용)
- **지원 AI**: ChatGPT, Grok만 (API 방식)
- **문제점**:
  - Claude, Gemini 미지원
  - 실제 사용 방식과 불일치 (ChatGPT는 Codex CLI 사용)
  - 모든 Helper가 자체 미평가 조회 기능 내장

**대체 방법**: 각 AI의 Helper 스크립트 직접 실행
- `scripts/helpers/claude_eval_helper.py`
- `scripts/helpers/codex_eval_helper.py`
- `scripts/workflow/evaluate_gemini_subprocess.py`
- `scripts/helpers/grok_eval_helper.py`

---

### 2. evaluate_gemini_api.py
- **목적**: Gemini API 방식 평가
- **문제점**:
  - Google API 할당량 제한
  - CLI Subprocess 방식이 더 빠르고 안정적

**대체 방법**: `scripts/workflow/evaluate_gemini_subprocess.py`
- Gemini CLI Subprocess 사용
- Google 계정 인증 방식
- 할당량 제한 없음

---

### 3. evaluate_grok_api.py
- **목적**: Grok API 방식 평가
- **문제점**:
  - 구버전 Groq API 사용
  - 현재는 xAI API 직접 호출 방식 사용

**대체 방법**: `scripts/helpers/grok_eval_helper.py`
- xAI API 직접 호출 (requests)
- grok-3 모델 사용
- 더 간단하고 명확한 구조

---

## 🔄 마이그레이션 가이드

### 기존 방식 (Deprecated)
```bash
# 추가 평가
python scripts/core/evaluate_missing_v40_api.py --politician "박주민" --ai ChatGPT
```

### 새로운 방식 (Current)
```bash
# ChatGPT 추가 평가
cd scripts/helpers
python codex_eval_helper.py \
  --politician_id=8c5dcc89 \
  --politician_name="박주민" \
  --category=expertise \
  --batch_size=25
```

**참고**: `instructions/V40_추가평가_가이드.md`

---

## 🎯 왜 변경했는가?

### 문제점
1. **불일치**: API 방식 스크립트 vs 실제 Helper 방식
2. **중복**: 추가 평가 로직이 각 Helper에 이미 내장
3. **복잡성**: 별도 스크립트 유지보수 부담
4. **제한적**: 일부 AI만 지원

### 해결책
1. **단일 진실**: 각 Helper가 모든 기능 포함
2. **자동 감지**: 미평가 데이터 자동 조회
3. **단순화**: Helper 스크립트만 관리
4. **완전 지원**: 4개 AI 모두 동일한 방식

---

## 📚 관련 문서

- **새로운 가이드**: `instructions/V40_추가평가_가이드.md`
- **연구 보고서**: `.archive/추가평가_방법_연구보고서.md`
- **CLAUDE.md**: 추가 평가 섹션 참조

---

**보관 이유**: 미래 참조 및 연구 목적
**복원 필요**: 없음 (새로운 방식이 우월)
