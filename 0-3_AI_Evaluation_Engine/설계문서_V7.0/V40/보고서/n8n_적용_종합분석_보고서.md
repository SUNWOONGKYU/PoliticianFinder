# n8n V40 적용 종합 분석 보고서

**작성일**: 2026-02-19 (2차 개정)
**분석 대상**: n8n 워크플로우 엔진 → V40 AI 평가 파이프라인 적용
**개정 이유**: `generate_report_v40.py` 변경사항 반영 (키워드 지도 제거, 경쟁자 용어 변경, 인수 단순화)

---

## 1. 핵심 전제 정리

### 1.1 "자동화" vs "배치 처리" 용어 정의

| 용어 | 정확한 의미 | V40에서 해당하는 것 |
|------|------------|-------------------|
| **배치 처리** | 여러 건을 묶어서 한번에 처리 | 25개씩 AI 평가 (모든 AI 공통) |
| **배치 처리 파이프라인** | 여러 단계를 순서대로 자동 실행 | n8n이 Phase 1→2→3→4→5 순서 실행 |

> **핵심**: n8n은 "자동화 마법"이 아니라,
> **배치 처리 방식을 Phase 간 연결해서 실행해주는 파이프라인 엔진**

### 1.2 Claude Code 배치 처리 방식

```
[오해] Claude는 API가 없어서 n8n에서 실행 불가

[사실] Claude Code는 API 없이 직접 배치 처리 가능
  fetch(25개) → Claude Code 직접 평가 → save
  비용: $0 (구독), 속도: 다른 AI와 동일

[실제 제약] Claude는 "사람(Claude Code 세션)"이 직접 판단해야 하는 구조
  → n8n Execute Command만으로는 이 단계 완전 자동화 불가
  → 3.1절 참조
```

---

## 2. 현재 상태

### 2.1 n8n 설정 현황

| 항목 | 상태 | 비고 |
|------|------|------|
| n8n 설치 | ✅ v2.7.5 | `n8n_start.sh`로 실행 |
| 워크플로우 파일 | ✅ 완성 | `v40_workflow.json` (15개 노드) |
| GUI 임포트 | ❌ 미완료 | `.n8n/` 데이터 폴더 비어 있음 |
| Shell 실행 | ✅ 완료 이력 | 오준환 Phase 1 수집 완료 (로그 451KB) |

### 2.2 워크플로우 노드 구성

```
[Manual Trigger]
    ↓
[Set Variables: 정치인 ID/이름]
    ↓
[병렬] ─────────────────────────────────────────
│  Gemini 수집 (10카테고리 × 7라운드 = 70회)     │
│  Naver 수집  (10카테고리 × 1회   = 10회)       │
──────────────────────────────────────────────
    ↓ [Merge: 둘 다 완료될 때까지 대기]
[Phase Gate 1: 총 1,000개 이상?]
    ├── NO  → 정지 (데이터 부족)
    └── YES ↓
[Phase 2: validate_v40_fixed.py  (중복/기간 제거)]
    ↓
[Phase 2-2: adjust_v40_data.py  (50-60개 균형)]
    ↓
[Phase Gate 2: 모든 AI/카테고리 50개 이상?]
    ├── NO  → 정지 (데이터 부족)
    └── YES ↓
[병렬] ─────────────────────────────────────────
│  Claude 평가   (10카테고리 × 25개 배치) ❌DISABLED│
│  ChatGPT 평가  (10카테고리 × 25개 배치)          │
│  Gemini 평가   (10카테고리 × 25개 배치)          │
│  Grok 평가     (10카테고리 × 25개 배치)          │
──────────────────────────────────────────────
    ↓ [Merge: 4개 AI 모두 완료 대기]
[Phase Gate 3: 평가 2,000개 이상?]
    ├── NO  → 정지 (평가 부족)
    └── YES ↓
[Phase 4: calculate_v40_scores.py]
    ↓
[Phase 5: generate_report_v40.py --type=A/B/AB]
    ↓
[완료: 보고서 생성]
```

---

## 3. 적용 가능성

### 3.1 결론: **조건부 적용 가능** (수정 필요 2건)

| 구성요소 | 가능 여부 | 이유 |
|---------|---------|------|
| Phase 1 수집 (Gemini/Naver) | ✅ 가능 | Shell Script 실행 이력 있음 |
| Phase 2 검증 | ✅ 가능 | `validate_v40_fixed.py` Execute Command |
| Phase 2-2 조정 | ✅ 가능 | `adjust_v40_data.py` Execute Command |
| Phase 3 Claude 평가 | ⚠️ **불가** | Claude Code 세션 의존성 → 사람 개입 필수 (5.1절 참조) |
| Phase 3 ChatGPT/Gemini/Grok | ✅ 가능 | 이미 활성화됨 |
| Phase 4 점수 계산 | ✅ 가능 | `calculate_v40_scores.py` Execute Command |
| Phase 5 보고서 생성 | ✅ 가능 | `generate_report_v40.py --type=AB` Execute Command |

> **Phase 3 Claude 평가는 n8n으로 완전 자동화 불가**
> 구조적 이유: claude_eval_helper.py는 데이터 조회/저장만 담당하며,
> 실제 평가는 Claude Code 세션(사람)이 직접 수행해야 함.

### 3.2 수정 필요 사항 (2건)

**[수정 1] `v40_workflow.json` Claude 평가 노드 처리:**

```json
// 현재 옵션 A: disabled 상태 (완전 자동화 불가)
"disabled": true

// 권장: 비활성 유지 + 사람 개입 단계로 워크플로우 재설계
// → Phase 3에서 "Claude 평가 완료 후 계속" Wait 노드 추가
```

**[수정 2] Phase Gate 2 기준 완화 (재수집 포기 규칙 반영):**

```
현재: COUNT(*) < 50 → 정지
수정: COUNT(*) < 25 → 정지  (포기 규칙: 25-49개는 부족허용, <25개는 0점처리)
```

---

## 4. 적용 효과

### 4.1 시간 단축

| 단계 | 현재 (수동) | n8n (배치 파이프라인) | 절감 |
|------|------------|---------------------|------|
| Phase 1 수집 | 40-55분 (수동 실행) | 40-55분 (동일, 단 자동 시작) | 사람 대기 없음 |
| Phase 2 검증 | 10분 + 수동 확인 | 자동 실행 후 자동 다음 단계 | 사람 개입 제거 |
| Phase 2-2 조정 | 30-120분 + 수동 판단 | 자동 실행 (최대 4라운드) | 판단 자동화 |
| Phase 3 평가 (ChatGPT/Gemini/Grok) | 1-2시간 + 3개 AI 수동 실행 | **3개 AI 병렬** 자동 실행 | **67% 단축** |
| Phase 3 Claude | 30-60분 (수동 필수) | **수동 필수** (구조적 한계) | 0% |
| Phase 4-5 | 5-10분 + 수동 실행 | 자동 실행 | 사람 개입 제거 |
| **합계** | **3-5시간 + 지속적 관찰** | **1.5-2시간 (Claude 제외 방치)** | **50% 이상 절감** |

### 4.2 품질 향상

```
Phase Gate 1: 수집 1,000개 미달 → 자동 정지 (경고)
Phase Gate 2: AI/카테고리별 25개 미달 → 자동 정지 (경고)
Phase Gate 3: 평가 2,000개 미달 → 자동 정지 (경고)

→ 기준 미달 상태로 다음 단계 진행하는 인적 오류 원천 차단
```

### 4.3 운영 편의성

```
[현재]                              [n8n 적용 후]
사용자 → 수동으로 각 스크립트 실행   사용자 → "정치인 ID/이름 입력" + [실행 버튼]
       → 완료 확인                         → Claude 평가 수행 (필수 수동)
       → 다음 스크립트 실행                → 나머지 단계 자동 완료
       → 완료 확인                         → 보고서 생성 완료 알림
       → 반복 × 5단계
```

### 4.4 병렬 처리 효과 (ChatGPT/Gemini/Grok 3개 AI)

```
[현재] ChatGPT → 완료 → Gemini → 완료 → Grok
       (순차: 약 1.5시간)

[n8n] ChatGPT ─┐
       Gemini  ├─ 병렬 동시 실행 → 가장 느린 AI 완료 시 다음 단계
       Grok    ┘  (약 30-40분)

       (Claude는 별도 수동 수행)
```

---

## 5. 적용 시 문제점

### 5.1 Claude Code 세션 의존성 ⚠️ (구조적 한계)

```
[정확한 구조]
claude_eval_helper.py의 역할:
  - fetch: DB에서 미평가 데이터 25개 조회 → JSON 출력
  - save:  평가 결과 JSON → DB 저장
  - (ANTHROPIC_API_KEY 불필요! Claude Code가 평가자)

[실제 문제]
fetch → [Claude Code가 직접 읽고 평가] → save
                  ↑
         반드시 사람(Claude Code 세션)이 개입해야 함
         n8n Execute Command만으로는 이 단계 불가

[이게 API 문제가 아닌 이유]
API Key가 없는 게 아니라,
"사람이 평가 판단을 내려야 하는" 구조적 특성
```

**해결책 옵션 3가지:**

| 방안 | 설명 | 비용 | 완전자동화 |
|------|------|------|-----------|
| **A) 현행 유지** | n8n이 나머지 자동 → Claude Code 수동 평가 | $0 | ❌ (Claude만) |
| **B) Claude API** | claude_eval_helper.py에 Anthropic SDK 직접 호출 추가 | ~$0.75/1K | ✅ |
| **C) claude_eval.py 신규** | API 방식 전용 스크립트 별도 작성 | ~$0.75/1K | ✅ |

> **권장**: A안 유지 (Claude Code 평가 품질이 API 호출보다 높음)
> n8n의 나머지 3개 AI (ChatGPT/Gemini/Grok)는 완전 자동화
> Claude만 수동 평가 → Phase 3에서 "Claude 완료 후 계속" Wait 노드로 처리

### 5.2 Phase 2-2 재수집 루프 한계

```
현재 adjust_v40_data.py: 최대 4라운드 자동 재수집
n8n에서의 한계: 노드가 단순 Execute Command →
  4라운드 내부 루프는 스크립트 내에서 처리
  n8n 차원의 루프 제어 어려움

→ 실질적 영향: 없음 (스크립트 내부에서 4라운드 처리)
```

### 5.3 Gemini CLI 3단계 Fallback

```
수집 스크립트: collect_gemini_subprocess.py
평가 스크립트: evaluate_gemini_subprocess.py

3단계 Fallback 구조:
  Step 1: gemini-2.5-flash (CLI)
  Step 2: gemini-2.0-flash (CLI, quota 소진 또는 timeout 시)
  Step 3: REST API (CLI 전부 실패 시)

n8n에서의 영향: Fallback은 스크립트 내부에서 자동 처리
  → n8n은 최종 결과만 받음 (Fallback 여부 무관)
  → Step 3 REST API 사용 시 추가 비용 발생 가능

→ 대응: Gemini API quota 모니터링 + 한도 초과 시 알림 설정
```

### 5.4 Windows 인코딩 문제

```
문제: Windows console cp949 코덱 → 한글/이모지 출력 시 오류
      n8n Execute Command 노드의 stdout 파싱 실패 가능성

로그 확인: "UnicodeEncodeError: 'cp949' codec" 기록 있음

→ 대응: 모든 스크립트에 UTF-8 강제 설정 (이미 일부 적용됨)
         n8n Execute Command 환경변수: PYTHONIOENCODING=utf-8
```

### 5.5 Phase Gate 2 임시 해결책 부재

```
현재 Phase Gate 2:
  일부 카테고리가 50개 미만이면 → 워크플로우 정지

문제: 재수집 포기 규칙(25-49개 허용, <25개 0점)을
      n8n Phase Gate가 모름
      → 25-49개인 경우도 정지로 처리

→ 대응: Phase Gate 2 로직 수정 필요
         "50개 미만" → "25개 미만" 으로 기준 완화 (포기 규칙 반영)
```

### 5.6 n8n GUI 임포트 미완료

```
현재: v40_workflow.json 파일 존재
      but .n8n/ 데이터 폴더 비어 있음
      → GUI에서 워크플로우 실행 불가

→ 해결: 30분 내 가능
   1. n8n_start.sh 실행
   2. localhost:5678 접속
   3. v40_workflow.json 임포트
   4. Supabase 크리덴셜 설정
```

---

## 6. 문제점별 해결 방안 (우선순위)

| 우선순위 | 문제 | 해결 방안 | 난이도 |
|---------|------|----------|--------|
| 🔴 1순위 | n8n GUI 미임포트 | `n8n_start.sh` → 임포트 → 크리덴셜 설정 | 하 |
| 🔴 2순위 | Phase Gate 2 기준 | `HAVING COUNT(*) < 25` 로 수정 | 하 |
| 🟡 3순위 | Claude 노드 처리 | Wait 노드 추가 + 수동 단계 안내 | 중 |
| 🟡 4순위 | Windows 인코딩 | Execute Command에 `PYTHONIOENCODING=utf-8` | 하 |
| 🟢 5순위 | Gemini quota | n8n 알림 노드 추가 (Slack/Email) | 중 |

---

## 7. 종합 평가

### 7.1 적용 권장도: **★★★★☆ (4/5)**

```
장점:
✅ 워크플로우 이미 설계됨 (v40_workflow.json)
✅ 실제 실행 이력 있음 (Phase 1: 오준환 완료)
✅ Phase Gate로 품질 자동 보장
✅ ChatGPT/Gemini/Grok 3개 AI 병렬 평가로 시간 대폭 단축
✅ 사람 개입 최소화 (Claude 수동 + 나머지 자동)

단점:
❌ Claude Code 직접 평가 ↔ n8n 자동 실행 간 구조적 충돌 (해결 불가)
❌ 일부 수정 사항 남아 있음 (Phase Gate 2, Claude 노드)
❌ Windows 환경 인코딩 이슈
```

### 7.2 적용 후 운영 모델

```
[정치인 추가 시 절차]

1. Phase 0 (사람): 정치인 정보 MD 파일 + DB 등록 (10분)

2. n8n 실행 (자동):
   - 정치인 ID/이름 입력
   - [실행] 버튼 클릭
   - Phase 1~2-2 자동 완료 (약 1시간)
   - ChatGPT/Gemini/Grok 평가 자동 완료 (약 30-40분)

3. Claude 평가 (사람 필수):
   - /evaluate-politician-v40 실행 (약 30-60분)
   - 완료 후 n8n "계속" 신호 전송

4. 나머지 자동 완료:
   - Phase 4: 점수 계산
   - Phase 5: 보고서 생성

5. 결과 확인 (사람):
   - 보고서 파일 확인 (보고서/{이름}_{날짜}.md)
   - 이상 없으면 공개

→ 사람이 해야 할 일: Phase 0 (10분) + Claude 평가 (30-60분) + 결과 확인 (5분)
→ 현재: 3-5시간 전부 수동
```

### 7.3 당장 할 수 있는 것 (30분 작업)

```bash
# Step 1: n8n 시작
bash n8n/n8n_start.sh

# Step 2: 브라우저
# http://localhost:5678 → Import → v40_workflow.json

# Step 3: Phase Gate 2 기준 수정
# v40_workflow.json 편집: COUNT(*) < 50 → COUNT(*) < 25

# Step 4: 크리덴셜 설정
# Supabase URL + Service Role Key 등록

# Step 5: 테스트 실행 (신규 정치인으로)
```

---

## 8. generate_report_v40.py 변경사항 (2026-02-19 기준)

### 8.1 주요 변경 요약

| 항목 | 이전 | 현재 |
|------|------|------|
| `--with-keywords` 옵션 | 있음 | **제거됨** |
| 키워드 지도 섹션 (Type B 6절) | 있음 | **삭제됨** |
| "Big 4" 용어 | `BIG4_IDS`, `"Big 4"` | **"경쟁자"로 변경** |
| Type B 생성 함수 인수 | `evaluations_with_reasoning`, `collected_with_text`, `svg_filename` 포함 | **단순화 (제거됨)** |
| `get_grade_context()` 함수 | 없음 | **신규 추가** |
| 데이터 분석 표 합계 행 | 총 건수만 | **OFFICIAL/PUBLIC 비율 추가** |

### 8.2 현재 올바른 실행 명령

```bash
# n8n Phase 5 노드에 반드시 이 형식 사용!

# Type A 요약본 생성
python scripts/core/generate_report_v40.py \
  --politician_id=d0a5d6e1 \
  --politician_name=조은희 \
  --type=A

# Type B 상세본 생성
python scripts/core/generate_report_v40.py \
  --politician_id=d0a5d6e1 \
  --politician_name=조은희 \
  --type=B

# A+B 동시 생성 (권장)
python scripts/core/generate_report_v40.py \
  --politician_id=d0a5d6e1 \
  --politician_name=조은희 \
  --type=AB

# ❌ 잘못된 명령 (이제 존재하지 않음)
# python generate_report_v40.py --type=AB --with-keywords
```

### 8.3 출력 파일

```
보고서/{정치인명}_{YYYYMMDD}_A.md  ← Type A: 공개용 요약본 (3섹션)
보고서/{정치인명}_{YYYYMMDD}_B.md  ← Type B: 상세본 (8섹션, 키워드 지도 없음)
```

### 8.4 n8n 워크플로우 업데이트 필요 여부

```
v40_workflow.json Phase 5 노드의 실행 명령에서:
  --with-keywords 옵션이 포함되어 있다면 → 제거 필요
  (오류 발생: unrecognized arguments: --with-keywords)

--type 인수는 그대로 유지 가능
```

---

**결론**: n8n을 "자동화 마법"으로 오해했던 부분을 바로잡고 보면,
실제로는 **V40 배치 처리 파이프라인을 Phase 간 자동 연결해주는 실용적인 도구**입니다.
Claude 평가는 구조적으로 수동이 필요하지만, 나머지 3개 AI와 전체 파이프라인은
이미 설계가 완료된 상태이며, 수정 사항 몇 건만 처리하면 즉시 운영 가능합니다.

---

*분석 기준: v40_workflow.json (15노드), run_phase1_collection.sh, phase1_collection.log*
*generate_report_v40.py 변경사항: 2026-02-19 반영*
*작성: PoliticianFinder AI V40 | 2026-02-19*
