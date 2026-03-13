---
description: "소대 편제 방식으로 정치인 AI 평가 전체 파이프라인 자동 실행 (V50 기준)"
user-invocable: true
---

# /evaluate-politician-platoon-슈퍼스킬

이 스킬 하나로 소대를 자동 편제하고 정치인 AI 평가 파이프라인(Phase 0~5)을 완전 자동 실행한다.

## 인자

```
/evaluate-politician-platoon --politicians="이름1,이름2,..." [--phase=0-5] [--platoon-size=N]
```

| 인자 | 필수 | 기본값 | 설명 |
|------|------|--------|------|
| `--politicians` | ✅ | — | 평가할 정치인 이름 목록 (쉼표 구분) |
| `--phase` | — | all | 특정 Phase만 실행 (0~5, 기본=전체) |
| `--platoon-size` | — | 5 | 동시 처리 분대원 수 |

---

## Step 1. 소대 편제

### 1-1. 참조 스킬 로드

```
platoon-formation-슈퍼스킬2  →  소대 편제 방법 확인
evaluate-politician-v40      →  개별 정치인 평가 파이프라인 확인 (V50 규칙 적용)
  ※ evaluate-politician-v50 스킬은 아직 미생성 상태.
  ※ V50 스킬 생성 후 아래 참조를 evaluate-politician-v50 으로 교체할 것.
```

### 1-2. 소대 구성

```
[소대장: Claude Opus]
  ├── [연락병: Claude Sonnet]   ← 소대장-분대 간 메시지 중계
  │
  ├── [분대 Alpha]
  │    ├── 분대장 (Sonnet)
  │    └── 분대원 × --platoon-size명 (Haiku)  ← 정치인 1명씩 담당
  │
  ├── [분대 Bravo]  (정치인 수에 따라 자동 추가)
  └── ...
```

### 1-3. 역할 배분

```
정치인 N명 → ceil(N / platoon-size) 분대 자동 생성
각 분대원 = 정치인 1명의 Phase 0~5 전담

예시:
  10명 / size=5  → 분대 2개 (Alpha 5명, Bravo 5명) — 10명 동시
  25명 / size=5  → 분대 5개 (Alpha~Echo) — 25명 동시
  1명  / size=5  → 분대 1개 (Alpha 1명) — 단독 테스트
  100명 / size=5 → 분대 20개 — 100명 동시 (메모리 주의)
```

---

## Step 2. 분대원별 파이프라인 실행

각 분대원은 독립적으로 아래 파이프라인을 실행한다.

**실행 방식**: 분대원이 n8n Webhook을 트리거 → n8n이 각 Phase 순차 오케스트레이션
- n8n 트리거: `POST $N8N_WEBHOOK_URL` (환경변수: N8N_WEBHOOK_URL)
- n8n: HTTP Request(수집·평가 API 호출) + Code 노드(검증·조정·점수 로직)
- soldier.py: Supabase 30초 폴링 → Phase 완료 감지 → n8n Webhook POST로 다음 Phase 재개

**⚠️ 다중 분대원 동시 실행 시 Webhook 중복 호출 방지**
- 각 분대원은 `politician_id`를 Webhook Body에 포함 → n8n이 ID별로 독립 워크플로우 실행
- soldier.py: 동일 politician_id의 Webhook 호출은 1회만 (중복 감지 후 무시)

```
Pre-Phase 0: politicians 테이블 등록 확인 (12개 필드)
     ↓
Phase 1: 데이터 수집  [n8n HTTP Request — 3채널 병렬, 순서: Gemini → Grok-X → Naver]
  - Gemini 2.0 Flash-Lite API (48개/카테고리, 40%) — OFFICIAL 30 + PUBLIC 10
  - Grok-X Live Search API (12개/카테고리, 10%) — PUBLIC only, 전부 free
  - Naver NCP API (60개/카테고리, 50%) — OFFICIAL 10 + PUBLIC 40
  - 목표: 카테고리당 120개 (Gemini 48 + Grok-X 12 + Naver 60)
     ↓
Phase 2: 데이터 검증  [n8n Code 노드: v50-p2-validate]
  - Supabase pagination fetch (1000행/페이지, while 루프)
  - 기간위반 삭제 (OFFICIAL 4년 / PUBLIC 2년 초과 → DELETE)
  - 중복 제거 (title 정규화 기준, 100개씩 chunk DELETE)
     ↓
Phase 2-2: 검증 후 조정  [3개 노드: Check Balance → IF Balance OK → Recollect Gemini]
  - Check Balance: 카테고리별 건수 집계 (MIN=50, 최대 4라운드)
  - IF Balance OK: 50개↑ → 평가 진행 / 미달 → Recollect Gemini 루프
  - Recollect Gemini: Gemini API 재수집 + Supabase 저장 + 라운드 카운터
  - 4라운드 초과 시 강제 통과 (give-up: <25개 → leverage score 0, 60점)
     ↓
Phase 3: 4AI 독립 평가  [n8n HTTP Request 4개 노드 동시 실행]
  ※ n8n SplitInBatches는 순차 — 4AI 병렬은 HTTP Request 4개를 같은 레벨에 배치해야 함
  - Prepare Eval Prompts: 10카테고리 × 4배치인덱스 = 40개 아이템 생성
  - Fetch Batch Data: Supabase에서 카테고리별 25개 slice 실시간 fetch (offset=batch_index×25)
  - IF Data Exists?: 빈 배치 → Category Eval Loop 스킵
  - Build Eval Prompt: 수집 데이터 번호 목록으로 full_prompt 생성 (실제 ID 포함)
  - Claude Haiku 4.5 / Gemini 2.0 Flash-Lite / ChatGPT gpt-4o-mini / Grok grok-3-mini
  - 4개 AI 모두 $json.full_prompt 사용 (실제 데이터 임베드)
     ↓
Phase 3-2: 평가 결과 검증 Gate  [n8n Code 노드]
  - evaluations_v50 = collected × 4 확인
     ↓
Phase 4: 점수 계산  [n8n Code 노드]
  - category_score = (6.0 + avg_score × 0.5) × 10
  - final_score = round(min(Σ 10카테고리, 1000))
     ↓
Phase 4.5: PO 승인 게이트  [인간 개입 필수 — CCI 결과 보고 후 승인 대기]
     ↓
Phase 5: HTML 보고서 생성 + GitHub Pages 배포  [n8n Code + GitHub]
  - 파일명: 보고서/{정치인명}_{YYYYMMDD}_{등급}.html
  - 배포: sunwoongkyu.github.io/PoliticianFinder/
```

---

## Step 3. 소대장 관제

### 진행 상황 모니터링

```
분대원이 n8n Webhook 트리거 후 soldier.py가 완료 감지
→ 분대장을 통해 소대장에게 Phase 완료 보고:

[분대원 → 소대장] "Phase 1 완료: {정치인명} — {N}개 수집"
[분대원 → 소대장] "Phase 3 완료: {정치인명} — 4AI 평가 완료"
[분대원 → 소대장] "Phase 5 완료: {정치인명} — {점수}점 {등급}"
```

### 오류 처리

```
분대원이 오류 보고 시:
  → 소대장이 해당 Phase 재시작 지시
  → 2회 실패 시 해당 정치인 제외 + 사용자 보고

통신 실패 시 복구:
  → 분대원 무응답 3분 초과: 소대장이 해당 분대장에게 상태 확인 요청
  → 분대장 무응답: 연락병을 통해 재시도
  → 복구 불가: 해당 정치인 처리 중단 + 나머지 계속 진행
```

### 완료 보고 형식

```
✅ 소대 평가 완료 보고

총 정치인: N명
완료: N명 / 실패: N명

결과:
  - {정치인명}: {점수}점 {등급}
    URL: https://sunwoongkyu.github.io/PoliticianFinder/{정치인명}_{YYYYMMDD}_{등급}.html
  - {정치인명}: {점수}점 {등급}
    URL: https://sunwoongkyu.github.io/PoliticianFinder/{정치인명}_{YYYYMMDD}_{등급}.html
  ...

배포 URL: https://sunwoongkyu.github.io/PoliticianFinder/
```

---

## 필수 환경변수

```
# n8n
N8N_WEBHOOK_URL=https://[n8n-instance]/webhook/[id]

# Supabase
SUPABASE_URL=https://[project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# 수집 API
GEMINI_API_KEY=AIza...
NAVER_CLIENT_ID=...
NAVER_CLIENT_SECRET=...
XAI_API_KEY=xai-...          (Grok Live Search)

# 평가 API
ANTHROPIC_API_KEY=sk-ant-...  (Claude Haiku 4.5)
OPENAI_API_KEY=sk-...         (ChatGPT gpt-4o-mini)
```

---

## 실행 예시 (1명 테스트)

```
/evaluate-politician-platoon --politicians="이재준" --platoon-size=1

→ Step 1: 소대 편제 (분대 Alpha 1개, 분대원 1명)
→ Step 2: 이재준 Phase 0~5 순차 실행
→ Step 3: 완료 보고

→ Phase 0-5 순차 완료 후 최종 보고
```

---

## 핵심 규칙 (CRITICAL)

### DB 규칙
- `politician_id`: TEXT 8자리 hex (INTEGER 절대 금지)
- `rating`: TEXT '+4'~'-4', 'X' (숫자 변환 금지)
- `evaluator_ai`: 'Claude' / 'Gemini' / 'ChatGPT' / 'Grok' (시스템명)
- Supabase 1000행 제한 → `.range()` pagination 필수

### Phase 순서 절대 건너뛰기 금지
- Phase 2 완료 전 Phase 3 시작 금지
- Phase 2-2 완료 전 Phase 3 시작 금지
- Gate 통과 전 다음 Phase 진입 금지

### 수집 규칙
- 버퍼 목표: 120개/카테고리 (Gemini 48 + Grok-X 12 + Naver 60)
- 채널 비율: Gemini 40% + Grok-X 10% + Naver 50%
- 채널 순서: 항상 Gemini → Grok-X → Naver
- 기간: OFFICIAL 4년, PUBLIC 2년

---

## 참조 문서

```
설계문서: V50/V50_기획안.md
아키텍처: V50/V50_아키텍처_전체구조도.svg
스킬:     platoon-formation-슈퍼스킬2
파이프라인: evaluate-politician-v40  # TODO: V50 스킬 생성 후 evaluate-politician-v50으로 교체
```
