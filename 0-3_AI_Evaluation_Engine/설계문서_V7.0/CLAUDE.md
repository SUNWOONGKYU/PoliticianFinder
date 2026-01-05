# CLAUDE.md - V26.0 AI 평가 엔진 작업 지침

**버전**: V7.0 (수집 규칙 V26.0)
**작성일**: 2026-01-04

---

## 핵심 변경사항 (V6.0 → V7.0)

| 항목 | 이전 | V7.0 |
|------|------|------|
| AI 개수 | 3개 | **4개 (+Gemini)** |
| OFFICIAL 기간 | 무제한 | **4년 이내** |
| PUBLIC 기간 | 무제한 | **1년 이내** |

---

## 필수 설정

### 환경 변수 (.env)

```bash
# 4개 AI API 키 (모두 필수)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
XAI_API_KEY=xai-...
GEMINI_API_KEY=AIza...          # ← 신규

# Supabase
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## 수집 스크립트

### 개별 AI 수집

```bash
# Claude
python collect_v26_claude.py --politician_id=ID --politician_name="이름"

# ChatGPT
python collect_v26_chatgpt.py --politician_id=ID --politician_name="이름"

# Grok
python collect_v26_grok.py --politician_id=ID --politician_name="이름"

# Gemini (신규)
python collect_v26_gemini.py --politician_id=ID --politician_name="이름"
```

### 4개 AI 일괄 수집

```bash
# 순차 실행
python collect_v26_all.py --politician_id=ID --politician_name="이름"

# 병렬 실행 (빠름)
python collect_v26_all.py --politician_id=ID --politician_name="이름" --parallel
```

---

## V26.0 기간 제한

### 규칙

```python
from datetime import datetime, timedelta

evaluation_date = datetime.now()  # 2026-01-04

# OFFICIAL: 4년 이내
official_start = evaluation_date - timedelta(days=365*4)
# → 2022-01-04 ~ 2026-01-04

# PUBLIC: 1년 이내
public_start = evaluation_date - timedelta(days=365)
# → 2025-01-04 ~ 2026-01-04
```

### 프롬프트에 포함

모든 수집 프롬프트에 다음 내용이 자동 포함됨:

```
⚠️ V26.0 기간 제한:
- OFFICIAL 데이터: 2022-01-04 ~ 2026-01-04 (최근 4년)
- PUBLIC 데이터: 2025-01-04 ~ 2026-01-04 (최근 1년)
위 기간 외의 데이터는 수집하지 마세요.
```

---

## DB 규칙 (CRITICAL!)

### ai_name 필드

```python
# ✅ 올바른 값 (시스템명)
ai_name = "Claude"
ai_name = "ChatGPT"
ai_name = "Grok"
ai_name = "Gemini"   # ← 신규

# ❌ 잘못된 값 (모델명 금지)
ai_name = "claude-3-5-haiku-20241022"
ai_name = "gpt-4o-mini"
```

### rating 필드

```python
# ✅ 알파벳 그대로 저장
rating = 'A'
rating = 'B'
rating = 'H'

# ❌ 숫자 변환 금지!
rating = 8
rating = -8
```

### politician_id 타입

```python
# ✅ TEXT (8자리 hex)
politician_id = '62e7b453'

# ❌ INTEGER/BIGINT 금지
politician_id = 62e7b453  # 숫자 아님!
```

---

## 수집 구조 (카테고리당 50개)

```
카테고리 50개 = Phase 1 (10개) + Phase 2 (40개)

Phase 1: 부정 주제 10개 (최소 20% 보장)
├── OFFICIAL 부정 5개 (4년 이내)
└── PUBLIC 부정 5개 (1년 이내)

Phase 2: 자유 평가 40개
├── OFFICIAL 자유 20개 (4년 이내)
└── PUBLIC 자유 20개 (1년 이내)

결과: OFFICIAL 25개 (50%) + PUBLIC 25개 (50%)
```

---

## 4개 AI 풀링 (핵심!)

**📄 상세 문서**: `V26_풀링_전체프로세스.md`

```
풀링 = "모두가 찾은 것을 각자가 평가"

[1단계: 수집] - rating 없이!
4개 AI × 50개 = 200개 풀 (카테고리당)
- 중복 제거 안 함
- 가중치 계산 안 함
- 그냥 있는 그대로 합침

[2단계: 평가] - 타이밍 분리 = 객관성!
4개 AI가 각각 200개 전체 평가
- 수집 시점 ≠ 평가 시점 (다른 세션)
- 독립적 판단 = 더 객관적

자연 가중치:
- 4개 AI가 동일 뉴스 수집 → 풀에 4번 포함 → 4배 영향
- 별도 계산 불필요, 자연스럽게 반영
```

---

## 점수 계산 (V24와 동일)

```python
PRIOR = 6.0
COEFFICIENT = 0.5

# 카테고리 점수 (20~100점)
category_score = (PRIOR + avg_rating * COEFFICIENT) * 10

# 최종 점수 (200~1000점)
final_score = round(min(sum(10개 카테고리), 1000))
```

---

## 백업 및 마이그레이션

### V24.0 데이터 백업

```bash
# 1. 백업 실행
python backup_v24_data.py

# 2. 백업 확인
python backup_v24_data.py --verify
```

### 백업 테이블

```
collected_data → collected_data_v24_backup
ai_category_scores → ai_category_scores_v24_backup
ai_final_scores → ai_final_scores_v24_backup
ai_evaluations → ai_evaluations_v24_backup
```

### V26.0 수집 전 초기화

```bash
# 주의: 백업 확인 후에만 실행!
python clear_for_v26.py --confirm
```

---

## 체크리스트

### 수집 전

- [ ] 4개 API 키 설정 (.env)
- [ ] Supabase 연결 확인
- [ ] V24.0 데이터 백업 완료
- [ ] 정치인 ID/이름 확인

### 수집 중

- [ ] 기간 제한 적용 확인
- [ ] ai_name = 시스템명 확인
- [ ] rating = 알파벳 확인
- [ ] 카테고리당 50개 달성

### 수집 후

- [ ] 4개 AI × 10개 카테고리 × 50개 = 2,000개 확인
- [ ] 점수 계산 실행
- [ ] V24 vs V26 비교 분석

---

## 참조 문서

- `README.md` - 전체 구조
- `V26_수집지침_및_프로세스.md` - 수집 규칙 상세
- `V26_멀티AI_구현계획.md` - 4개 AI 상세
- `V24_점수계산_알고리즘_상세가이드.md` - 점수 계산

---

**최종 업데이트**: 2026-01-04
