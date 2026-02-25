# V40 실행 타입 A/B/C 비교 분석

**작성일**: 2026-02-22
**목적**: V40 시스템의 3가지 실행 타입을 정의하고 비교 분석
**상태**: 연구 문서 (구현 전 기획 자료)

---

## 1. 3-Type 정의

| 구분 | Type A | Type B | Type C |
|------|--------|--------|--------|
| **명칭** | 수동 + CLI | n8n + CLI | n8n + API |
| **오케스트레이션** | 사람 (수동) | n8n (자동) | n8n (자동) |
| **AI 호출 방식** | CLI/Subprocess | CLI/Subprocess | HTTP API |
| **상태** | **현재 운영 중** | 워크플로우 설계 완료 | 미구현 (연구 단계) |

### Type A: 수동 + CLI (현재 V40)
- 사람이 터미널에서 스크립트를 직접 실행
- Phase 간 전환도 사람이 확인하고 진행
- Claude Pro / Google AI Studio Pro 구독 활용 (CLI 무료)
- ChatGPT: Codex CLI (API 키, 저렴), Grok: xAI API (curl subprocess)

### Type B: n8n + CLI
- n8n 워크플로우가 기존 CLI 스크립트를 자동 오케스트레이션
- "Execute Command" 노드로 기존 Python 스크립트 호출
- Phase 간 Gate 검증 자동화 (SQL 쿼리로 완료 확인)
- 기존 CLI 도구 동일 사용 → 비용 구조 Type A와 동일

### Type C: n8n + API
- n8n 워크플로우가 4개 AI의 HTTP API를 직접 호출
- "HTTP Request" 노드로 각 AI API 엔드포인트 호출
- CLI 도구 설치 불필요 (claude CLI, gemini CLI, codex CLI 불필요)
- 구독 불필요, 순수 API 종량제 비용만 발생
- 가장 빠르고, 가장 이식성 높음

---

## 2. 아키텍처 비교

### Type A: 수동 + CLI

```
[사람] → 터미널에서 스크립트 실행
  │
  ├─ Phase 1: python collect_gemini_subprocess.py (Gemini CLI → subprocess)
  ├─ Phase 1: python collect_naver_v40_final.py (Naver API → HTTP)
  │   └─ (사람이 수집 완료 확인)
  ├─ Phase 2: python validate_v40_fixed.py
  ├─ Phase 2-2: python adjust_v40_data.py
  │   └─ (사람이 검증 완료 확인)
  ├─ Phase 3: python claude_eval_helper.py (Claude Code 직접 평가)
  ├─ Phase 3: python codex_eval_helper.py (Codex CLI → subprocess)
  ├─ Phase 3: python evaluate_gemini_subprocess.py (Gemini CLI → subprocess)
  ├─ Phase 3: python grok_eval_helper.py (xAI API → curl subprocess)
  │   └─ (사람이 평가 완료 확인)
  ├─ Phase 4: python calculate_v40_scores.py
  └─ Phase 5: python generate_report_v40.py
```

### Type B: n8n + CLI

```
[n8n Manual Trigger] → 워크플로우 자동 실행
  │
  ├─ [Execute Command] collect_gemini_subprocess.py
  ├─ [Execute Command] collect_naver_v40_final.py
  │   └─ [Postgres Gate] SELECT COUNT(*) >= 1000
  ├─ [Execute Command] validate_v40_fixed.py
  ├─ [Execute Command] adjust_v40_data.py
  │   └─ [Postgres Gate] 균형 확인
  ├─ [Execute Command] claude_eval_helper.py    ← CLI 동일
  ├─ [Execute Command] codex_eval_helper.py     ← CLI 동일
  ├─ [Execute Command] evaluate_gemini_subprocess.py ← CLI 동일
  ├─ [Execute Command] grok_eval_helper.py      ← CLI 동일
  │   └─ [Postgres Gate] 평가 완료 확인
  ├─ [Execute Command] calculate_v40_scores.py
  └─ [Execute Command] generate_report_v40.py
```

### Type C: n8n + API

```
[n8n Manual Trigger] → 워크플로우 자동 실행
  │
  ├─ [HTTP Request] Gemini 2.0 Flash API (수집)
  ├─ [HTTP Request] Naver API (수집)
  │   └─ [Postgres Gate] SELECT COUNT(*) >= 1000
  ├─ [Code Node] 검증 로직 (JS/Python)
  ├─ [Code Node] 조정 로직 (JS/Python)
  │   └─ [Postgres Gate] 균형 확인
  ├─ [HTTP Request] Claude Haiku 4.5 API (평가)     ← API 직접
  ├─ [HTTP Request] ChatGPT o4-mini API (평가)       ← API 직접
  ├─ [HTTP Request] Gemini 2.0 Flash API (평가)      ← API 직접
  ├─ [HTTP Request] Grok 3 API (평가)                ← API 직접
  │   └─ [Postgres Gate] 평가 완료 확인
  ├─ [Code Node] 점수 계산 (JS/Python)
  └─ [Code Node] 보고서 생성
```

---

## 3. 비용 비교

### 3-1. API 가격표 (2026년 2월 기준)

| AI 모델 | Input (1M tokens) | Output (1M tokens) | 비고 |
|---------|-------------------|--------------------|----|
| Claude Haiku 4.5 | $1.00 | $5.00 | Batch API 50% 할인 가능 |
| Gemini 2.0 Flash | $0.10 | $0.40 | 최저가 |
| ChatGPT o4-mini | $1.10 | $4.40 | |
| Grok 3 | 미공개 | 미공개 | Grok-3-mini: $0.30/$0.50 |
| Grok 3 (추정) | ~$3.00 | ~$15.00 | 경쟁사 대비 추정 |

### 3-2. 구독 비용 (Type A/B에만 해당)

| 구독 | 월 비용 | 용도 |
|------|---------|------|
| Claude Pro | $20/월 | Claude CLI 무제한 사용 |
| Google AI Studio Pro | $20/월 | Gemini CLI 무제한 사용 |
| **합계** | **$40/월** | |

### 3-3. 정치인 1명당 비용 비교

**토큰 사용량 추정 (정치인 1명):**
- 수집 (Phase 1): Gemini 10카테고리 × 7라운드 = ~210K tokens
- 평가 (Phase 3): AI당 40배치 × 4.5K tokens = ~180K tokens/AI
- 총 평가: 4 AI × 180K = ~720K tokens
- 점수/보고서 (Phase 4-5): ~50K tokens

#### Type A: 수동 + CLI

| 항목 | 비용 | 비고 |
|------|------|------|
| Claude 수집 | - | 수집에 Claude 미사용 |
| Gemini 수집 | $0 | CLI (구독 내) |
| Naver 수집 | $0 | 무료 API |
| Claude 평가 | $0 | CLI Direct (구독 내) |
| Gemini 평가 | $0 | CLI Subprocess (구독 내) |
| ChatGPT 평가 | ~$0.23 | Codex CLI (API 키) |
| Grok 평가 | ~$2.00 | xAI API (curl, 추정) |
| **소계 (변동비)** | **~$2.23** | |
| **구독비 배분 (10명)** | **+$4.00** | $40/월 ÷ 10명 |
| **총계 (1명)** | **~$6.23** | |

#### Type B: n8n + CLI

| 항목 | 비용 | 비고 |
|------|------|------|
| (Type A와 동일한 비용 구조) | | |
| n8n 서버 | $0 | 로컬 self-hosted |
| **총계 (1명)** | **~$6.23** | Type A와 동일 |

#### Type C: n8n + API

| 항목 | 비용 | 비고 |
|------|------|------|
| Gemini 수집 (API) | ~$0.06 | 2.0 Flash 최저가 |
| Naver 수집 | $0 | 무료 API |
| Claude 평가 (API) | ~$0.42 | Haiku 4.5 |
| Gemini 평가 (API) | ~$0.04 | 2.0 Flash 최저가 |
| ChatGPT 평가 (API) | ~$0.40 | o4-mini |
| Grok 평가 (API) | ~$1.26 | Grok 3 (추정) |
| **총계 (1명)** | **~$2.18** | 구독 없음 |

### 3-4. 월 10명 기준 비용 비교

| 항목 | Type A | Type B | Type C |
|------|--------|--------|--------|
| 구독비 | $40.00 | $40.00 | $0 |
| 변동비 (10명) | ~$22.30 | ~$22.30 | ~$21.80 |
| **월 총비용** | **~$62.30** | **~$62.30** | **~$21.80** |
| 정치인당 평균 | ~$6.23 | ~$6.23 | ~$2.18 |

> **Type C는 Type A/B 대비 약 65% 저렴** (구독비 $40 제거 효과)

### 3-5. 규모별 손익분기점

| 월 평가 인원 | Type A/B 비용 | Type C 비용 | 유리한 타입 |
|-------------|--------------|------------|-----------|
| 1명 | $42.23 | $2.18 | **Type C** (95% 절감) |
| 5명 | $51.15 | $10.90 | **Type C** (79% 절감) |
| 10명 | $62.30 | $21.80 | **Type C** (65% 절감) |
| 20명 | $84.60 | $43.60 | **Type C** (49% 절감) |
| 50명 | $151.50 | $109.00 | **Type C** (28% 절감) |

> **모든 규모에서 Type C가 저렴**. 구독비($40) 제거가 가장 큰 요인.
> 단, Type C는 Grok 3 실제 가격에 따라 변동 가능.

---

## 4. 속도 비교

### 4-1. Phase별 소요 시간 (정치인 1명)

| Phase | Type A (수동+CLI) | Type B (n8n+CLI) | Type C (n8n+API) |
|-------|-----------------|-----------------|-----------------|
| Phase 1 (수집) | 40-55분 | 40-55분 | 15-25분 |
| Phase 2 (검증) | 5-10분 | 5-10분 | 3-5분 |
| Phase 2-2 (조정) | 5-60분* | 5-60분* | 3-30분* |
| Phase 3 (평가) | 60-120분 | 45-90분 | 20-40분 |
| Phase 4 (점수) | 2-3분 | 2-3분 | 1-2분 |
| Phase 5 (보고서) | 2-3분 | 2-3분 | 1-2분 |
| **Phase 간 대기** | **15-30분** | **0분** | **0분** |
| **총 소요** | **~2-4.5시간** | **~1.5-3.5시간** | **~0.7-1.7시간** |

> *Phase 2-2는 데이터 부족 시 재수집 필요하여 변동 큼

### 4-2. 다중 정치인 소요 시간 (4명)

**핵심: 3가지 타입 모두 병렬 처리 가능, 단 방식과 효율이 다름**

| 항목 | Type A (수동 병렬) | Type B (n8n 자동 병렬) | Type C (n8n+API 병렬) |
|------|:----------:|:----------:|:----------:|
| **병렬 방식** | CLI 세션 4개 동시 | n8n 자동 분배 | n8n + HTTP 동시 호출 |
| P1 수집 | 40-55분 (4세션 병렬) | 40-55분 (n8n 병렬) | 15-25분 (API 병렬) |
| Gate 확인 | ~20분 (사람이 4개 확인) | 0분 (SQL 자동) | 0분 (SQL 자동) |
| P2/2-2 검증·조정 | 10-70분 (4세션 병렬) | 10-70분 (자동 병렬) | 5-15분 (자동) |
| Gate 확인 | ~20분 (사람이 4개 확인) | 0분 (SQL 자동) | 0분 (SQL 자동) |
| P3 평가 | 60-120분 (4세션 병렬) | 45-90분 (정치인 순차*) | **10-20분** (API 완전 병렬) |
| Gate 확인 | ~15분 (사람이 4개 확인) | 0분 (SQL 자동) | 0분 (SQL 자동) |
| P4-5 점수·보고서 | 5-10분 | 8-12분 | 3-5분 |
| **총 소요** | **~3-5시간** | **~1.5-3.5시간** | **~0.5-1.1시간** |
| **Type A 대비** | 기준 | **~50% 절감** | **~85% 절감** |

> *Type B Phase 3: 같은 머신에서 CLI 4세트 동시 실행 시 리소스 경합 → 정치인별 순차, AI별 병렬

**타입별 병렬 처리 방식 비교:**

| 항목 | Type A | Type B | Type C |
|------|--------|--------|--------|
| **병렬 단위** | CLI 세션 (터미널 창) | n8n Execute Command | HTTP Request |
| **병렬 제약** | 사람이 4개 모니터링 | CLI 리소스 경합 | API Rate Limit만 |
| **Phase 간 전환** | 사람이 수동 확인 (~20분/회) | n8n SQL Gate (0분) | n8n SQL Gate (0분) |
| **실패 대응** | 사람이 개입 필요 | n8n Log & Continue | n8n Log & Continue |
| **Gate 대기 총합** | **~55분** (3회 × ~18분) | **0분** | **0분** |

**Type A 수동 병렬의 현실:**
- Claude Code 세션 4개 동시 실행 → 수집/평가 자체는 병렬 가능
- **단, Phase 간 Gate 확인은 사람이 세션 1개씩 순차로 해야 함**
- 4세션 × 3번 Gate = 12회 수동 확인 → 약 55분 오버헤드
- 에러 발생 시 사람이 즉시 대응해야 함 (4세션 동시 모니터링 부담)

**Type C가 월등히 빠른 이유 (Phase 3):**
- HTTP API 호출: 배치당 2-5초 응답
- 4개 AI = 4개 다른 프로바이더 → **완전 독립 병렬**
- 4명 × 4 AI = 16개 스트림 동시 처리 가능
- 1명당 40배치 × 5초 = 3분, 4명 병렬 = **여전히 3분**
- Rate Limit 고려해도 10-20분이면 4명 전체 평가 완료

### 4-3. 속도 병목 분석

| 병목 요인 | Type A | Type B | Type C |
|----------|--------|--------|--------|
| 사람 대기 시간 | **큼** (Phase 간 수동 확인) | 없음 | 없음 |
| CLI 초기화 오버헤드 | 있음 (CLI 로딩) | 있음 (동일) | **없음** (HTTP 직접) |
| API Rate Limit | 없음 (구독 무제한) | 없음 (동일) | **있음** (분당 제한) |
| 네트워크 지연 | 낮음 | 낮음 | 낮음 |

---

## 5. 기술 구현 비교

### 5-1. 필요 인프라

| 항목 | Type A | Type B | Type C |
|------|--------|--------|--------|
| Python 3.10+ | **필수** | **필수** | 선택 (n8n Code Node) |
| Node.js | 불필요 | **필수** (n8n) | **필수** (n8n) |
| n8n | 불필요 | **필수** | **필수** |
| claude CLI | **필수** | **필수** | 불필요 |
| gemini CLI | **필수** | **필수** | 불필요 |
| codex CLI | **필수** | **필수** | 불필요 |
| PostgreSQL/Supabase | **필수** | **필수** | **필수** |

### 5-2. 필요 인증 정보

| 항목 | Type A | Type B | Type C |
|------|--------|--------|--------|
| Claude 계정 로그인 | **필수** | **필수** | 불필요 |
| Google 계정 인증 | **필수** | **필수** | 불필요 |
| ANTHROPIC_API_KEY | 불필요 | 불필요 | **필수** |
| GEMINI_API_KEY | 불필요 | 불필요 | **필수** |
| OPENAI_API_KEY | **필수** | **필수** | **필수** |
| XAI_API_KEY | **필수** | **필수** | **필수** |
| NAVER_CLIENT_ID/SECRET | **필수** | **필수** | **필수** |
| SUPABASE_URL/KEY | **필수** | **필수** | **필수** |

### 5-3. 코드 복잡도

| 항목 | Type A | Type B | Type C |
|------|--------|--------|--------|
| Python 스크립트 | ~15개 (기존) | ~15개 (동일) | 불필요 (n8n 내장) |
| n8n 워크플로우 | 없음 | 1-2개 JSON | 1-2개 JSON |
| 셸 스크립트 | 5-6개 | 2-3개 (n8n이 대체) | 0개 |
| 총 유지보수 대상 | ~20개 파일 | ~18개 파일 | ~2개 JSON |

### 5-4. 에러 처리

| 항목 | Type A | Type B | Type C |
|------|--------|--------|--------|
| 실패 시 대응 | 사람이 확인/재실행 | n8n 자동 재시도 | n8n 자동 재시도 |
| 부분 실패 격리 | 수동 확인 | Log & Continue | Log & Continue |
| Rate Limit 대응 | N/A (구독) | N/A (구독) | 지수 백오프 필요 |
| Timeout 처리 | 스크립트 내 | 스크립트 내 | n8n HTTP 설정 |

---

## 6. 이식성 및 운영 비교

| 항목 | Type A | Type B | Type C |
|------|--------|--------|--------|
| **이식성** | 낮음 | 중간 | **높음** |
| 다른 서버 이전 | CLI 전부 재설치 | n8n + CLI 재설치 | n8n만 설치 + API 키 |
| Docker 배포 | 어려움 | 가능 | **용이** |
| 클라우드 운영 | 불가 (GUI 필요) | 가능 (n8n cloud) | **최적** (n8n cloud) |
| **확장성** | 낮음 | 중간 | **높음** |
| 동시 처리 | 사람 1명 한계 | n8n 워커 수 | API 동시 호출 수 |
| 스케일 아웃 | 불가 | 제한적 | API 병렬 처리 |
| **모니터링** | | | |
| 진행 상황 | 터미널 출력 | n8n 대시보드 | n8n 대시보드 |
| 로그 | 파일 로그 | n8n 실행 로그 | n8n 실행 로그 |
| 알림 | 없음 | n8n 알림 노드 | n8n 알림 노드 |
| **안정성** | | | |
| 장애 복구 | 수동 재실행 | n8n 자동 재시도 | n8n 자동 재시도 |
| 야간 자동 실행 | 불가 | **가능** | **가능** |

---

## 7. 장단점 종합

### Type A: 수동 + CLI

**장점:**
- 현재 운영 중, 검증된 시스템
- 세밀한 제어 가능 (사람이 각 단계 확인)
- 구독 내 무제한 사용 (Claude, Gemini)
- 별도 인프라 불필요

**단점:**
- 사람 개입 필수 (Phase 간 대기 시간)
- 동시 다수 정치인 처리 어려움
- 야간/자동 실행 불가
- CLI 도구 설치/관리 필요

**추천 시나리오:**
- 소수 정치인 (1-3명) 긴급 평가
- 새로운 프로세스 테스트/디버깅
- CLI 환경이 이미 구축된 로컬 머신

---

### Type B: n8n + CLI

**장점:**
- 자동화로 사람 대기 시간 제거
- 기존 CLI 스크립트 재사용 (마이그레이션 비용 0)
- 비용 구조 Type A와 동일 (구독 활용)
- n8n 대시보드로 진행 상황 시각화
- 다중 정치인 자동 처리

**단점:**
- n8n 설치/설정 필요
- CLI 도구가 모두 설치된 환경에서만 실행 가능
- 클라우드 이전 시 CLI 재설치 필요
- CLI 의존성으로 Docker 배포 복잡

**추천 시나리오:**
- 정기 평가 (월 5-10명) 자동화
- 기존 CLI 투자를 유지하면서 자동화 원할 때
- 로컬 서버에서 운영하는 경우

---

### Type C: n8n + API

**장점:**
- CLI 의존성 제거 (가장 가벼운 구조)
- 가장 빠른 실행 속도
- 클라우드/Docker 배포 용이
- 구독 불필요 (순수 종량제)
- 이식성 최고 (API 키만 있으면 어디서든)
- 모든 규모에서 비용 절감

**단점:**
- API Rate Limit 관리 필요
- Grok 3 API 가격 불확실
- API 키 4개 관리 필요 (ANTHROPIC, GEMINI, OPENAI, XAI)
- 기존 스크립트 재작성 필요 (n8n 노드로 변환)
- API 장애 시 대체 수단 없음 (CLI fallback 불가)

**추천 시나리오:**
- 대량 평가 (월 20명 이상)
- 긴급 평가 (최단 시간 필요)
- 클라우드 환경 운영
- 새로운 서버에 빠른 배포 필요

---

## 8. 마이그레이션 경로

```
현재 상태           목표 상태
────────────────────────────────

Type A (현재)  ──→  Type B  ──→  Type C
  수동+CLI          n8n+CLI       n8n+API

마이그레이션 1 (A→B):
  - n8n 설치
  - 기존 스크립트를 Execute Command로 래핑
  - Gate 검증 SQL 쿼리 구성
  - 난이도: ★★☆☆☆ (기존 코드 재사용)

마이그레이션 2 (B→C):
  - Execute Command → HTTP Request 노드로 교체
  - 프롬프트를 API 형식으로 변환
  - Rate Limit 처리 로직 추가
  - 응답 파싱 로직 n8n Code Node로 구현
  - 난이도: ★★★★☆ (전면 재작성)

직접 마이그레이션 (A→C):
  - 위 두 단계를 한 번에
  - 난이도: ★★★★★ (가장 어려움, 비추천)
```

**권장 순서: A → B → C (단계적)**

---

## 9. 의사결정 매트릭스

| 기준 (가중치) | Type A | Type B | Type C |
|-------------|--------|--------|--------|
| 비용 효율 (25%) | ★★★☆☆ | ★★★☆☆ | ★★★★★ |
| 실행 속도 (20%) | ★★☆☆☆ | ★★★☆☆ | ★★★★★ |
| 안정성 (20%) | ★★★★☆ | ★★★★☆ | ★★★☆☆ |
| 이식성 (15%) | ★☆☆☆☆ | ★★☆☆☆ | ★★★★★ |
| 구현 난이도 (10%) | ★★★★★ | ★★★★☆ | ★★☆☆☆ |
| 유지보수 (10%) | ★★★☆☆ | ★★★☆☆ | ★★★★☆ |
| **가중 평균** | **2.75** | **3.10** | **4.00** |

---

## 10. 결론 및 권장 전략

### 단기 (현재~1개월)
- **Type A 유지** + Type B 구현 시작
- n8n 워크플로우(v40_multi_workflow.json) 완성 및 테스트

### 중기 (1~3개월)
- **Type B 운영** (정기 평가 자동화)
- Type C 프로토타입 개발 (1개 AI부터)

### 장기 (3개월~)
- **Type C 완성** (긴급 평가용)
- Type B + Type C 병행 운영
  - 정기 평가: Type B (비용 안정)
  - 긴급 평가: Type C (속도 우선)

### 핵심 인사이트

> **"Type B는 현재의 투자를 지키는 자동화, Type C는 미래의 확장을 여는 혁신"**

- Type A → B: 사람의 시간을 아낀다 (자동화)
- Type B → C: CLI 의존성을 없앤다 (이식성)
- Type A → C: 모든 것을 바꾼다 (비추천, 리스크 큼)

---

## 참조 문서

| 문서 | 위치 | 관련 |
|------|------|------|
| V40 비용 분석 | `V40_AI_평가_방식_및_비용_종합_분석.md` | Type A 비용 상세 |
| n8n 워크플로우 | `n8n/v40_workflow.json` | Type B 기반 |
| n8n 다중 워크플로우 | `n8n/v40_multi_workflow.json` | Type B 다중 정치인 |
| 전체 프로세스 | `instructions/V40_전체_프로세스_가이드.md` | Phase 0-5 상세 |
| 기본방침 | `instructions/V40_기본방침.md` | 수집/평가 규칙 |

---

**작성자**: V40 개발팀
**최종 검증**: 2026-02-22
**버전**: 1.0
**상태**: 연구 문서 (사용자 승인 후 구현)
