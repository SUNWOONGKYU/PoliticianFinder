# /evaluate-cci-v60 $ARGUMENTS

너(Claude Code)는 이 명령을 받으면 아래 프로세스를 **처음부터 끝까지 자동으로** 실행한다.
사용자에게 중간에 물어보지 마라. 모든 단계를 스스로 완료하라.

---

## 0. 인자 파싱

```
/evaluate-cci-v60 --politician-id=17270f25 --group-name="2026 서울시장" --phase=all
```

인자 추출:
- `politician_id` (필수, 예: 17270f25) — 8자리 hex TEXT
- `group_name` (선택, 예: "2026 서울시장") — 경쟁자 그룹명
- `phase` (선택, 기본: all) — 실행할 단계:
  - `alpha-collect` — Phase 1 수집
  - `alpha-validate` — Phase 1.5 검증
  - `alpha-adjust` — Phase 2 조정
  - `alpha-eval` — Phase 3 평가
  - `alpha-eval-validate` — Phase 3.5 평가 검증
  - `cci-calc` — Phase 4 점수 계산
  - `cci-report` — Phase 5 보고서
  - `all` — 전체 (Phase 1~5 순서대로)

`phase=all`이면 아래 Phase 1~5를 순서대로 전부 처리한다.

---

## 사전 확인: GPI 완료 여부

CCI는 GPI(40%)가 필수 전제조건이다.
**GPI가 완료되지 않은 정치인은 CCI를 계산할 수 없다.**

```bash
cd 설계문서_V7.0/V60_CCI/scripts/helpers
python -c "
from common_cci import supabase, TABLE_FINAL_SCORES_GPI
r = supabase.table(TABLE_FINAL_SCORES_GPI).select('final_score,grade').eq('politician_id', '{politician_id}').execute()
if r.data:
    print(f'GPI: {r.data[0][\"final_score\"]}점 {r.data[0][\"grade\"]}등급 — OK')
else:
    print('GPI: 미완료 — V40 파이프라인을 먼저 실행하세요!')
"
```

GPI가 없으면 → 즉시 중단, 사용자에게 보고.

---

## Phase 1: Alpha 데이터 수집

### 1-1. 경쟁자 그룹 확인/등록

group_name이 지정된 경우:

```bash
cd 설계문서_V7.0/V60_CCI/scripts/utils
python register_competitor_group.py list
```

그룹이 없으면 사용자에게 그룹 등록 필요 안내 후 중단:
```bash
python register_competitor_group.py create \
  --group-name "2026 서울시장" \
  --election-type "지방선거" \
  --region "서울특별시" \
  --election-date "2026-06-03" \
  --politician-ids 17270f25,de49f056,eeefba98
```

### 1-2. Alpha 6개 카테고리 수집

```bash
cd 설계문서_V7.0/V60_CCI/scripts/collect

# 단일 정치인
python collect_alpha.py \
  --politician-id {politician_id} \
  --categories opinion,media,risk,party,candidate,regional

# 그룹 전체
python collect_alpha.py \
  --group-name "{group_name}" \
  --categories all
```

수집 완료 후 상태 확인:
```bash
cd 설계문서_V7.0/V60_CCI/scripts/utils
python check_cci_status.py --politician-id {politician_id}
```

**완료 기준:**
- 카테고리당 120개 (기본100 + 버퍼20)
- 6개 카테고리 모두 수집 완료
- 소스 다양성 확인 (뉴스+블로그+카페+공공API)

---

## Phase 1.5: Alpha 데이터 검증

```bash
cd 설계문서_V7.0/V60_CCI/scripts/core

# 단일 정치인
python validate_alpha.py --politician-id {politician_id} --no-dry-run

# 그룹 전체
python validate_alpha.py --group-name "{group_name}" --no-dry-run
```

**완료 기준:**
- 중복 제거 완료
- 기간 제한 위반 제거 완료 (OFFICIAL 4년, PUBLIC 2년)
- 검증 보고서 확인

---

## Phase 2: 검증 후 조정 (Phase 2-2)

```bash
cd 설계문서_V7.0/V60_CCI/scripts/core

# 단일 정치인
python adjust_alpha.py --politician-id {politician_id} --no-dry-run

# 그룹 전체
python adjust_alpha.py --group-name "{group_name}" --no-dry-run
```

**완료 기준:**
- 카테고리별 100-120개 확인
- 초과 데이터 삭제 완료
- 부족 카테고리 재수집 완료 (최대 4회)
- Give-Up 규칙: 50+ 정상 | 25-49 부족허용 | <25 leverage score 0

**⚠️ Phase 2 미완료 시 Phase 3 진행 절대 금지!**

---

## Phase 3: Alpha 평가 — 플래툰 포메이션 필수! 🚨

**⛔️ 순차 실행 절대 금지! 반드시 플래툰 포메이션으로 병렬 실행한다.**

Alpha 평가는 상대평가다. 모든 경쟁 후보를 **동시에, 같은 기준으로** 평가해야 한다.

### 플래툰 편성 구조

```
소대장 (Opus, Teammate) — 전체 조율 + 교차 검증
│
├── Alpha 분대장 (Sonnet, Teammate) — 정치인 1 담당
│   ├── 분대원 1 (Haiku, Subagent) — opinion  평가
│   ├── 분대원 2 (Haiku, Subagent) — media    평가
│   ├── 분대원 3 (Haiku, Subagent) — risk     평가
│   ├── 분대원 4 (Haiku, Subagent) — party    평가
│   ├── 분대원 5 (Haiku, Subagent) — candidate 평가
│   └── 분대원 6 (Haiku, Subagent) — regional 평가
│
├── Bravo 분대장 (Sonnet, Teammate) — 정치인 2 담당
│   └── (분대원 6명, 동일 구조)
│
├── Charlie 분대장 (Sonnet, Teammate) — 정치인 3 담당
│   └── (분대원 6명, 동일 구조)
│
└── Delta 분대장 (Sonnet, Teammate) — 정치인 4 담당
    └── (분대원 6명, 동일 구조)
```

### 실행 순서

**Step 1: 팀 생성**
```
/platoon-formation-슈퍼스킬2 호출
TeamCreate("V60-CCI-platoon")
```

**Step 2: 분대장 병렬 스폰 (정치인 수만큼 동시에)**
- 2026 서울시장: Alpha(정원오), Bravo(오세훈), Charlie(조은희), Delta(박주민)
- run_in_background: true, team_name: V60-CCI-platoon

**Step 3: 소대장 → 전체 분대장에게 브로드캐스트 (평가 기준 통일)**
```
"Alpha 평가 기준:
- opinion: 여론조사 수치 기반, 1위=+4, 2위=+3, 3위=+2, 하위=+1
- media: 언론 논조 종합 평가
- risk: 역산 (리스크 없으면 +4, 심각할수록 마이너스)
- party: 정당 지지율 수치 + PVI 기반
- candidate: 현직효과 + 인지도 + 공천 확정
- regional: 지역 연고 + 조직 동원력 + 지역 서비스
각 분대원에게 동일 기준 하달하고 동시 실행하세요."
```

**Step 4: 각 분대장이 분대원 6개 동시 스폰**
각 분대원은 아래 표준 프로세스 실행:

#### 분대원 표준 프로세스 (카테고리 1개 담당)

```bash
# 1. 데이터 fetch
cd 설계문서_V7.0/V60_CCI/scripts/helpers
python alpha_eval_helper.py fetch \
  --politician_id={politician_id} \
  --politician_name="{politician_name}" \
  --category={category}
```

JSON 파싱:
- `total_count == 0` → 이미 완료, 종료
- `items` → 평가할 데이터
- `profile` → 정치인 기본 정보

```
# 2. 25개씩 배치 분할 후 평가
items를 25개씩 배치 → 각 배치별:
  - 각 item의 id, title, content, source_type 읽기
  - 평가 기준에 따라 등급 부여
  - evaluations JSON 생성
```

평가 기준:
```
+4(+8점) 탁월 — 압도적 1위, 독보적 우세
+3(+6점) 우수 — 안정적 선두, 구체적 강점
+2(+4점) 양호 — 유리한 조건, 긍정적
+1(+2점) 보통 — 평균적 경쟁력, 기본 활동
-1(-2점) 미흡 — 하락세, 경미한 비판
-2(-4점) 부족 — 의혹·논란, 불리한 구도
-3(-6점) 심각 — 수사·조사, 치명적 리스크
-4(-8점) 최악 — 가능성 사실상 없음
X (0점)  제외 — 확실한 오류만 (동명이인, 무관 기사)
```

**⚠️ 키워드 매칭 절대 금지! 기사 내용을 직접 읽고 경쟁 맥락에서 판단!**

결과 JSON 형식:
```json
{
  "evaluations": [
    {"id": "UUID그대로", "rating": "+3", "rationale": "여론조사 안정적 선두"},
    {"id": "UUID그대로", "rating": "X", "rationale": "무관 데이터"}
  ]
}
```

```bash
# 3. 저장
python alpha_eval_helper.py save \
  --politician_id={politician_id} \
  --politician_name="{politician_name}" \
  --category={category} \
  --input=eval_alpha_{category}_batch_{N}.json

# 4. 임시 파일 삭제
rm eval_alpha_{category}_batch_{N}.json
```

**Step 5: 분대장 → 소대장 보고**
각 분대장이 6개 카테고리 완료 후 결과 요약 보고:
```
"오세훈 평가 완료:
 opinion: 평균 +2.3, media: 평균 +1.8, risk: 평균 -1.2
 party: 평균 +2.1, candidate: 평균 +2.5, regional: 평균 +2.8"
```

**Step 6: 소대장 교차 검증**
모든 분대장 보고 수집 후:
- 정치인 간 상대적 수치 비교 (논리적 일관성 확인)
- 이상치 발견 시 해당 분대장에게 재검토 요청

### 평가 상태 확인

```bash
cd 설계문서_V7.0/V60_CCI/scripts/helpers
python alpha_eval_helper.py status --politician_id={politician_id}
```

---

## Phase 3.5: 평가 결과 검증

```bash
cd 설계문서_V7.0/V60_CCI/scripts/core
python validate_alpha_eval.py --politician-id {politician_id}
```

그룹인 경우:
```bash
python validate_alpha_eval.py --group-name "{group_name}"
```

**검증 항목:**
- 등급 분포 편향 감지 (단일 등급 70% 초과 시 경고)
- X(제외) 비율 과다 (30% 초과 시 경고)
- reasoning 누락/부족 검출 (10자 미만)
- orphan ID 검출 (수집 데이터에 없는 ID 참조)
- 미평가 데이터 존재 여부

**통과 기준:**
- `overall_pass = True` → Phase 4 진행
- 이슈 발견 시 → 해결 후 재검증

**⚠️ Phase 3.5 미통과 시 Phase 4 진행 절대 금지!**

---

## Phase 4: CCI 점수 계산

### 4-1. 단일 정치인

```bash
cd 설계문서_V7.0/V60_CCI/scripts/core
python calculate_cci_scores.py --politician-id {politician_id}
```

### 3-2. 그룹 전체 (순위 포함)

group_name이 있는 경우:

```bash
cd 설계문서_V7.0/V60_CCI/scripts/core
python calculate_cci_scores.py --group-name "{group_name}"
```

그룹 모드는:
1. 각 후보 CCI 계산
2. 순위 산정 (cci_rank)
3. 등급 부여 (압도적 선두/경쟁 우위/경합/열세/후순위)

**완료 기준:**
- CCI 점수 저장 확인
- 그룹인 경우 순위 산정 완료

---

## Phase 4.5: PO 승인 게이트 🛑 (인간 개입 필수!)

**⚠️ CCI 점수 계산 완료 후 반드시 PO(사용자)에게 결과를 보고하고 승인을 받아야 한다.**
**PO 승인 없이 Phase 5(보고서 생성)를 절대 진행하지 않는다.**

### 보고 형식

```
📊 CCI 계산 완료 — PO 승인 요청
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
그룹: {group_name}

순위  CCI점수   이름       정당
─────────────────────────────────────────────
 1      {CCI}   {이름}     {정당}
 2      {CCI}   {이름}     {정당}
 3      {CCI}   {이름}     {정당}
 4      {CCI}   {이름}     {정당}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CCI 결과를 확인하셨습니까?
Phase 5(CCI 전략보고서 생성)를 진행하려면 승인해 주십시오.
```

### 승인 후 진행

PO 승인 → Phase 5 보고서 생성 시작
PO 수정 지시 → 이유 확인 후 재계산 또는 조정

---

## Phase 5: CCI 전략보고서 생성

```bash
cd 설계문서_V7.0/V60_CCI/scripts/core
python generate_cci_report.py \
  --politician-id {politician_id} \
  --group-name "{group_name}" \
  --output "보고서/{politician_name}_CCI_{YYYYMMDD}.html"
```

**보고서 구조:**
1. 종합 대시보드 (CCI 점수 + 경쟁자 매트릭스)
2. GPI 분석 (기존 GPI 보고서 내용)
3. Alpha 1 민심·여론 분석
4. Alpha 2 선거구조 분석
5. 경쟁자 비교 (순위표)
6. 전략 제언

**보고서 위치:** `보고서/{정치인명}_CCI_{YYYYMMDD}.html`

---

## Phase 6: 최종 상태 확인

```bash
cd 설계문서_V7.0/V60_CCI/scripts/utils
python check_cci_status.py --politician-id {politician_id}
```

그룹인 경우:
```bash
python check_cci_status.py --group-name "{group_name}"
```

결과를 사용자에게 보여준다.

---

## 속도 최적화 규칙 (반드시 지켜라)

1. **배치 크기 25개** — Alpha 데이터 특성에 맞춤
2. **출력 최소화** — 매 배치마다 간단히:
   ```
   [opinion] 배치 1/2 완료 (25개 평가, 25개 저장)
   [opinion] 배치 2/2 완료 (15개 평가, 15개 저장)
   ```
3. **중간 보고 하지 마라** — 끝까지 자동 진행
4. **rationale 짧게** — 1문장, 최대 30자
5. **fetch 결과 기억** — 한 번 fetch하면 전체 items 기억, 배치별로 잘라서 처리

---

## 에러 처리

| 상황 | 대응 |
|------|------|
| GPI 점수 없음 | 중단, "V40 파이프라인 먼저 실행" 안내 |
| fetch에서 items 0개 | "이미 완료" 출력, 다음 카테고리로 |
| save에서 중복 에러 | 정상. 무시하고 진행 |
| save에서 다른 에러 | 사용자에게 보고 후 다음 배치 계속 |
| 그룹에 정치인 미등록 | 그룹 등록 안내 |

---

## CCI 점수 공식 (참고)

```python
# GPI, Alpha1, Alpha2 모두 동일 스케일 (200~1000) — 정규화 불필요!

# Alpha 카테고리 점수 (200~1000)
category_score = (6.0 + avg_score * 0.5) * 100
# avg_score = rating × 2의 평균 (범위: -8 ~ +8)
# 기준값(0점) = 600점, 최고(+8) = 1000점, 최저(-8) = 200점

# Alpha 합계 (3개 카테고리 균등 평균)
alpha1_total = (opinion + media + risk) / 3   # 200~1000
alpha2_total = (party + candidate + regional) / 3  # 200~1000

# CCI 통합 점수 (200~1000)
cci_score = gpi_score * 0.4 + alpha1_total * 0.3 + alpha2_total * 0.3
# GPI(40%) + Alpha1(30%) + Alpha2(30%) 동일 스케일 가중합
```

---

## 🚨 실행 위임 원칙 (7대 원칙 — 원칙 7)

**이 스킬이 호출되면 = 사용자가 실행을 위임한 것이다.**

### 중간 승인 판단 기준

```
질문해야 하는가? → 아래 3가지에 해당하는가?

1. 계획에 없던 새로운 결정이 필요한가?     → YES → 질문
2. 되돌릴 수 없는 파괴적 작업인가?          → YES → 질문
3. 비용이 발생하는 작업인가?               → YES → 질문

3가지 모두 NO → 질문하지 말고 실행
```

### Phase별 질문 허용/금지 매트릭스

| Phase | 자동 실행 | 질문 허용 |
|:---|:---|:---|
| Phase 1 (수집) | 수집 스크립트 실행, 상태 확인 | 경쟁자 그룹 미등록 시 |
| Phase 1.5 (검증) | 검증 실행, 결과 판단 | 없음 |
| Phase 2 (조정) | 조정 실행, 재수집 결정 | 없음 |
| Phase 3 (평가) | 플래툰 생성, 평가, 교차 검증 | 없음 |
| Phase 3.5 (평가 검증) | 검증 실행 | 없음 |
| Phase 4 (점수 계산) | 계산 실행 | 없음 |
| **Phase 4.5 (PO 게이트)** | — | **반드시 보고 후 승인 대기** |
| Phase 5 (보고서) | 생성, gh-pages 배포 | 없음 |
| Phase 6 (상태 확인) | 확인 후 최종 보고 | 없음 |

### 절대 금지 — 불필요한 질문 유형

```
❌ "push할까요?" — 배포가 계획에 포함되어 있으면 그냥 push
❌ "다음 Phase 진행할까요?" — Phase 게이트(4.5) 외에는 자동 진행
❌ "파일명을 변경해도 될까요?" — 기술적 판단은 스스로
❌ "검증을 실행할까요?" — 검증은 필수이므로 무조건 실행
❌ "이 오류를 어떻게 처리할까요?" — 에러 처리 표에 따라 자동 대응
```

### 올바른 실행 흐름

```
/evaluate-cci-v60 호출
→ Phase 1~4: 논스톱 자동 실행 (보고 안 함)
→ Phase 4.5: CCI 순위표 보고 + PO 승인 요청 (유일한 중단점)
→ PO 승인
→ Phase 5~6: 논스톱 자동 실행
→ 최종 결과만 보고: "완료. URL은 여기"
```

**사용자 상호작용 최대 2회**: ①스킬 호출 ②Phase 4.5 승인

---

## 핵심 원칙

- **GPI 없이 CCI 계산 절대 금지**
- **Alpha 평가는 상대평가** (경쟁 맥락 반영)
- **risk 카테고리는 역산** (리스크 없으면 높은 점수)
- **politician_id는 TEXT** (8자리 hex, parseInt 금지)
- **rating은 문자열** (+4, +3, ..., -4, X)
- **Phase 4.5 PO 승인 게이트는 반드시 거쳐야 한다** — CCI 결과 보고 후 PO 승인 대기
- **Phase 4.5 이전**: 자동 실행 (사용자에게 질문 금지)
- **Phase 4.5 이후**: PO 승인 후 Phase 5~6 자동 실행
- **실행 위임 원칙**: 스킬 호출 = 위임. 예외 3가지(새 결정/파괴적/비용) 외 질문 금지
