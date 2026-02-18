# V40 작업 지침

⚠️⚠️⚠️ **경고: 이 지침을 따르지 않으면 작업이 실패합니다** ⚠️⚠️⚠️

---

## 🔥 최우선 교훈 (읽고 시작!) 🔥

### ⭐ Phase 1 수집 시 반드시 버퍼 목표(60개)로 수집! ⭐

**❌ 잘못된 방법 (시간 낭비):**
```
Phase 1: 최소 목표 50개만 수집
→ Phase 2 검증 후 일부 삭제 (40-45개 남음)
→ Phase 2-2 재수집 필요 (2-3시간 소요!)
→ 8라운드 반복 수집
```

**✅ 올바른 방법 (시간 절약):**
```
Phase 1: 버퍼 목표 60개 수집 (Gemini 60 + Naver 60 = 120)
→ Phase 2 검증 후 50-60개 유지
→ Phase 2-2 거의 불필요 (15분 이내)
→ 시간 절약: 2-3시간!
```

**규칙 준수 방식:**
- Gemini: 60개/카테고리 (OFFICIAL 36 + PUBLIC 24)
- Naver: 60개/카테고리 (OFFICIAL 12 + PUBLIC 48)
- **50-50 분배 유지** (Gemini 50% + Naver 50%)
- **모든 카테고리 동일 목표** (차별 금지)

**실전 데이터 (조은희):**
- 최소 목표(50) 수집 → Phase 2-2 재수집 2시간 35분
- 버퍼 목표(60) 수집 → Phase 2-2 스킵 가능!

**교훈:**
> **"처음부터 제대로" > "나중에 재작업"**
> **버퍼 20%는 안전장치가 아니라 필수 전략!**

---

## 🚀 Phase 1: 데이터 수집 실행 가이드 (60개 이상!)

**⚠️ 핵심: "60개 정확히"가 아니라 "60개 이상" 수집하세요!**

### Step 1: Gemini CLI 수집 (60개 이상/카테고리)

**스크립트 위치:**
```bash
cd V40/scripts/workflow
```

**핵심 원리:**
- `collect_gemini_subprocess.py`: 1회 실행 = 약 10개 수집
- 60개 이상 수집 = **최소 6-7회 실행** 필요
- 목표: **60개 이상** (60개 정확히 아님!)

**단일 카테고리 수집 예시 (expertise):**
```bash
cd V40/scripts/workflow

for i in {1..7}; do
  python collect_gemini_subprocess.py \
    --politician "조은희" \
    --category expertise
  echo "Round $i/7 완료"
  sleep 5  # API 쿨다운
done
```

**전체 10개 카테고리 일괄 수집:**
```bash
cd V40/scripts/workflow

CATEGORIES="expertise leadership vision integrity ethics accountability transparency communication responsiveness publicinterest"

for cat in $CATEGORIES; do
  echo "=== $cat 수집 시작 ==="
  for i in {1..7}; do
    python collect_gemini_subprocess.py --politician "조은희" --category $cat
    echo "  Round $i/7 완료"
    sleep 5
  done
  echo "=== $cat 수집 완료 ==="
done
```

**진행 상황 확인:**
```bash
cd V40/scripts/utils
python check_collection_status.py --politician "조은희"
```

**예상 결과:**
- Gemini 600-700개 (60-70개/카테고리)
- **60개 이상이면 OK!** (70개도 허용)

---

### Step 2: Naver API 수집 (60개 이상/카테고리)

**스크립트 위치:**
```bash
cd V40/scripts/workflow
```

**핵심 원리:**
- `collect_naver_v40_final.py` 사용
- 카테고리 이름(영문 문자열): expertise, leadership, vision, integrity, ethics, accountability, transparency, communication, responsiveness, publicinterest
- ⚠️ 숫자(1, 2, 3...) 사용 금지! 반드시 영문 이름 사용
- 한 번 실행으로 60개 이상 수집 (자동 조정)

**단일 카테고리 수집 예시 (expertise):**
```bash
cd V40/scripts/workflow

python collect_naver_v40_final.py \
  --politician-id d0a5d6e1 \
  --politician-name "조은희" \
  --category expertise
```

**전체 10개 카테고리 일괄 수집:**
```bash
cd V40/scripts/workflow

CATEGORIES="expertise leadership vision integrity ethics accountability transparency communication responsiveness publicinterest"
for cat in $CATEGORIES; do
  python collect_naver_v40_final.py \
    --politician-id d0a5d6e1 \
    --politician-name "조은희" \
    --category $cat
  echo "$cat 완료"
done
```

⚠️ **중요**: 카테고리는 번호(1,2,3...)가 아닌 영문 이름(expertise, leadership...)을 사용해야 합니다.

**진행 상황 확인:**
```bash
cd V40/scripts/utils
python check_collection_status.py --politician "조은희"
```

**예상 결과:**
- Naver 600개 이상 (60개/카테고리)

---

### Step 3: 수집 완료 확인

**최종 상태 확인:**
```bash
cd V40/scripts/utils
python check_collection_status.py --politician "조은희"
```

**목표 달성 기준:**
- ✅ 총 1,200개 이상 (Gemini 600+ + Naver 600+)
- ✅ 카테고리별: 120개 이상 (Gemini 60+ + Naver 60+)
- ✅ 50-50 비율 유지 확인

**OK 예시:**
```
Gemini: 630개 (평균 63개/카테고리) ✅
Naver: 610개 (평균 61개/카테고리) ✅
Total: 1,240개 ✅
비율: Gemini 51% vs Naver 49% ✅ (50-50 유지)
```

**NG 예시 (재수집 필요):**
```
Gemini: 520개 (평균 52개/카테고리) ⚠️
Naver: 600개 (평균 60개/카테고리) ✅
Total: 1,120개 ⚠️
→ Gemini 80개 추가 수집 필요!
```

**예상 소요 시간:**
- Gemini 수집: 30-40분 (7회 × 10개 카테고리)
- Naver 수집: 10-15분 (10개 카테고리)
- **총 40-55분**

---

### Step 4: 다음 단계로 진행 (Phase 2: 검증)

**수집 완료 후 반드시 검증 실행:**
```bash
cd V40/scripts/core
python validate_v40_fixed.py \
  --politician_id d0a5d6e1 \
  --politician_name "조은희" \
  --no-dry-run
```

**⚠️ Phase 2 (검증) 없이 평가 시작 절대 금지!**

검증 단계에서:
- 중복 제거
- 기간 제한 위반 제거
- 최종 데이터 정제

검증 후에도 대부분 50개 이상 유지됨 → **Phase 2-2 재수집 스킵 가능!**

---

### ⚡ 빠른 실행 스크립트 (전체 자동화)

**전체 프로세스를 한 번에 실행:**
```bash
#!/bin/bash
# 파일명: collect_all_v40.sh

POLITICIAN_ID="d0a5d6e1"
POLITICIAN_NAME="조은희"

echo "========================================="
echo "V40 데이터 수집 시작 (60개 이상/카테고리)"
echo "========================================="

# Step 1: Gemini 수집
echo ""
echo "[1/3] Gemini CLI 수집 중..."
cd V40/scripts/workflow

CATEGORIES="expertise leadership vision integrity ethics accountability transparency communication responsiveness publicinterest"

for cat in $CATEGORIES; do
  echo "  >> $cat 수집 중..."
  for i in {1..7}; do
    python collect_gemini_subprocess.py --politician "$POLITICIAN_NAME" --category $cat
    sleep 5
  done
done

# Step 2: Naver 수집
echo ""
echo "[2/3] Naver API 수집 중..."

CATEGORIES="expertise leadership vision integrity ethics accountability transparency communication responsiveness publicinterest"
for cat in $CATEGORIES; do
  python collect_naver_v40_final.py \
    --politician-id $POLITICIAN_ID \
    --politician-name "$POLITICIAN_NAME" \
    --category $cat
done

# Step 3: 결과 확인
echo ""
echo "[3/3] 수집 결과 확인..."
cd ../utils
python check_collection_status.py --politician "$POLITICIAN_NAME"

echo ""
echo "========================================="
echo "수집 완료! 다음 단계: Phase 2 (검증)"
echo "========================================="
```

**실행 방법:**
```bash
chmod +x collect_all_v40.sh
./collect_all_v40.sh
```

---

## 🚨🚨🚨 절대 규칙 (ABSOLUTE RULES) 🚨🚨🚨

### ⛔️ 규칙 1: 전 단계가 완료되지 않으면 다음 단계로 절대 넘어갈 수 없다

**단계를 건너뛰는 것은 절대 금지입니다.**

### ⛔️ 규칙 2: 사전에 정해진 규칙을 절대 위반하지 않는다

**V40_기본방침.md에 정의된 모든 규칙을 반드시 준수해야 합니다:**

❌ **금지 사항 예시:**
- Gemini 50% + Naver 50% 규칙을 어기고 Naver만 사용
- OFFICIAL 40% + PUBLIC 60% 비율 변경
- 카테고리당 100개 목표를 임의로 변경
- 4개 AI 평가를 3개로 줄이기
- 기간 제한 (OFFICIAL 4년, PUBLIC 2년) 무시

✅ **올바른 태도:**
- 규칙이 불편하거나 어려워도 반드시 준수
- 규칙을 바꾸려면 사용자 승인 필수
- 임의로 "긴급 대응", "규칙 위반하지만" 같은 제안 금지
- 규칙 준수가 불가능하면 사용자에게 보고 후 지시 대기

### V40 프로세스 순서 (반드시 지켜야 함)

```
Phase 0: 정치인 정보 등록
   ↓ (완료 확인 필수)
Phase 1: 데이터 수집 (Gemini CLI + Naver API)
   ↓ (완료 확인 필수)
Phase 2: 데이터 검증 (validate_v40_fixed.py)
   ↓ (완료 확인 필수)
Phase 2-2: 검증 후 조정 (adjust_v40_data.py) ✨ NEW!
   ↓ (완료 확인 필수)
   ⚠️ AI별/카테고리별 데이터 균형 맞추기
   ⚠️ 초과(60개↑) → 삭제, 부족(50개↓) → 재수집
   ⚠️ 최대 4회 재수집 후 포기 규칙 적용:
      50+ → 정상 | 25-49 → 부족 허용 | <25 → leverage score 0
   ⚠️ 목표: 50-60개/AI/카테고리
   ↓
Phase 3: AI 평가 (Claude, ChatGPT, Gemini, Grok)
   ↓ (완료 확인 필수)
Phase 4: 점수 계산 (calculate_v40_scores.py)
   ↓ (완료 확인 필수)
Phase 5: 보고서 생성 (generate_report_v40.py)
```

### 각 Phase 완료 조건

**Phase 0 (정치인 등록) 완료 조건:**
- ✅ MD 파일 생성: `instructions/1_politicians/{성명}.md` (10개 기본 필드)
- ✅ DB `politicians` 테이블에 **12개 필수 필드** 모두 저장:
  - `id` (8자리 hex), `name`, `party`, `position`
  - `previous_position` ⚠️ **NULL 금지** (전 직책)
  - `region`, `district`, `birth_date` (YYYY-MM-DD)
  - `gender`, `identity`, `title`
  - `career[]` ⚠️ **빈 배열 금지** (최소 5개 경력)
- ✅ DB 저장 후 SELECT로 12개 필드 확인 (NULL/빈값 없음)
- ⚠️ **MD 파일만 만들고 DB 저장 안 하면 Phase 0 미완료!**

**Phase 1 (수집) 완료 조건:**
- ✅ Gemini CLI 수집 완료: **600개 권장** (60개/카테고리 × 10개 = 버퍼 포함)
- ✅ Naver API 수집 완료: **600개 권장** (60개/카테고리 × 10개 = 버퍼 포함)
- ✅ 총 **1,200개 수집 권장** (최소 1,000개, 버퍼 포함 1,200개)
- ✅ DB에 데이터 저장 확인
- ⚠️ **중요**: 최소 목표(50개)만 수집하면 Phase 2-2 재수집 2-3시간 소요!

**Phase 2 (검증) 완료 조건:**
- ✅ validate_v40_fixed.py 실행 완료
- ✅ 중복 제거 완료
- ✅ 기간 제한 위반 제거 완료
- ✅ Sentiment 비율 검증 통과 (OFFICIAL neg/pos ≥10%, PUBLIC neg/pos ≥20%)
- ✅ 검증 보고서 확인

**Phase 2-2 (검증 후 조정) 완료 조건:** ✨ NEW!
- ✅ adjust_v40_data.py 실행 완료 (최대 4회 재수집)
- ✅ AI별 데이터 500-600개 확인
- ✅ 카테고리별 데이터 50-60개/AI 확인
- ✅ 전체 데이터 1,000-1,200개 확인
- ✅ 조정 보고서 확인
- ⚠️ **재수집 포기 규칙** (4회 재수집 후):
  - 50+개: 정상 평가
  - 25-49개: 부족 허용, 보유 데이터로 평가
  - <25개: 포기, leverage score 0 처리 (60점)

**Phase 3 (평가) 완료 조건:**
- ✅ Claude 평가 완료 (10개 카테고리)
- ✅ ChatGPT 평가 완료 (10개 카테고리)
- ✅ Gemini 평가 완료 (10개 카테고리)
- ✅ Grok 평가 완료 (10개 카테고리)
- ✅ 총 4 AIs × 수집 데이터 개수 = 평가 완료

**Phase 4 (점수) 완료 조건:**
- ✅ calculate_v40_scores.py 실행 완료
- ✅ ai_final_scores_v40 테이블에 저장 확인
- ✅ 점수 범위 200-1000 확인

**Phase 5 (보고서) 완료 조건:**
- ✅ generate_report_v40.py 실행 완료
- ✅ 보고서 파일 생성 확인 (보고서/{정치인명}_{YYYYMMDD}.md)

### ⛔️ 금지 사항

❌ **Phase 1 (수집)이 완료되지 않았는데 Phase 3 (평가) 시작 - 절대 금지**
❌ **Phase 2 (검증)을 건너뛰고 Phase 3 (평가) 시작 - 절대 금지**
❌ **Phase 2-2 (검증 후 조정)을 건너뛰고 Phase 3 (평가) 시작 - 절대 금지** ✨ NEW!
❌ **Phase 3 (평가)가 완료되지 않았는데 Phase 4 (점수) 계산 - 절대 금지**
❌ **Phase 4 (점수)가 완료되지 않았는데 Phase 5 (보고서) 생성 - 절대 금지**

### ✅ 올바른 진행 방법

```python
# 1. Phase 1 완료 확인
result = check_collection_status(politician_id)
if result.total < 1000:
    print("⛔️ Phase 1 미완료 - 수집 계속 진행")
    return

# 2. Phase 2 완료 확인
result = check_validation_status(politician_id)
if not result.validated:
    print("⛔️ Phase 2 미완료 - 검증 먼저 실행")
    return

# 2-2. Phase 2-2 완료 확인 (검증 후 조정) ✨ NEW!
result = check_balance_status(politician_id)
if not result.balanced:
    print("⛔️ Phase 2-2 미완료 - 조정 먼저 실행")
    print(f"   Gemini: {result.gemini_total}/600 (목표: 500-600)")
    print(f"   Naver: {result.naver_total}/600 (목표: 500-600)")
    return

# 3. Phase 3 완료 확인
result = check_evaluation_status(politician_id)
if result.total < expected_total:
    print("⛔️ Phase 3 미완료 - 평가 계속 진행")
    return

# 4. Phase 4 실행 가능
calculate_scores()
```

### 🔍 단계 완료 확인 방법

**수집 상태 확인:**
```bash
cd V40/scripts/utils
python check_collection_status.py --politician-id {politician_id} --politician-name "{politician_name}"
# 예: python check_collection_status.py --politician-id d0a5d6e1 --politician-name "조은희"
```

**평가 상태 확인:**
```bash
cd V40/scripts/utils
python check_evaluation_status.py --politician-id {politician_id} --politician-name "{politician_name}"
# 예: python check_evaluation_status.py --politician-id d0a5d6e1 --politician-name "조은희"
```

**점수 상태 확인:**
```bash
cd V40/scripts/core
python -c "
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

result = supabase.table('ai_final_scores_v40').select('*').eq('politician_id', '{politician_id}').execute()
print(f'점수 저장 여부: {chr(34)+\"완료\"+chr(34) if result.data else chr(34)+\"미완료\"+chr(34)}')"
# ⚠️ {politician_id} 부분을 실제 정치인 ID로 교체하세요 (예: d0a5d6e1)
```

---

## 🚨 필수 읽기 - 새 세션 시작 시 반드시 실행

**V40 작업을 시작하는 모든 Claude Code 세션은 다음 작업을 반드시 수행해야 합니다:**

### ✅ Step 1: 5개 필수 문서 읽기 (순서대로!)

**다음 5개 문서를 순서대로 반드시 읽으세요. 읽지 않으면 작업하지 마세요!**

#### 1. README.md ⭐ (필독!)
```
경로: README.md
역할: V40 시스템 전체 구조 파악
내용:
  - V40 개요 및 핵심 특징
  - 디렉토리 구조
  - 핵심 스크립트 설명
  - 워크플로우 다이어그램
  - 사용 방법
```

**읽는 방법:**
```python
# Claude Code에서 실행
Read("C:\\...\\V40\\README.md")
```

#### 2. V40_문서_관계도.md ⭐ (필독!)
```
경로: V40_문서_관계도.md
역할: 모든 문서 간 연결 관계 시각화
내용:
  - 전체 구조 (계층적 관계도)
  - 프로세스 플로우
  - 디렉토리별 문서 분류
  - 참조 관계 요약
```

**읽는 방법:**
```python
# Claude Code에서 실행
Read("C:\\...\\V40\\V40_문서_관계도.md")
```

#### 3. V40_기본방침.md ⭐ (필독!)
```
경로: instructions/V40_기본방침.md
역할: V40의 핵심 규칙
내용:
  - 수집 배분 (Gemini 50% + Naver 50%)
  - OFFICIAL/PUBLIC 정의
  - 등급 체계 (+4 ~ -4)
  - 기간 제한 (OFFICIAL 4년, PUBLIC 2년)
```

**읽는 방법:**
```python
# Claude Code에서 실행
Read("C:\\...\\V40\\instructions\\V40_기본방침.md")
```

#### 4. V40_전체_프로세스_가이드.md ⭐ (필독!)
```
경로: instructions/V40_전체_프로세스_가이드.md
역할: 7단계 프로세스 상세 가이드
내용:
  - Phase 0: 정치인 정보 등록
  - Phase 1~7: 수집 → 검증 → 평가 → 점수 → 보고서
  - 모든 실행 명령 포함
```

**읽는 방법:**
```python
# Claude Code에서 실행
Read("C:\\...\\V40\\instructions\\V40_전체_프로세스_가이드.md")
```

#### 5. V40_오케스트레이션_가이드.md ⭐ (필독!)
```
경로: instructions/V40_오케스트레이션_가이드.md
역할: 자동화 워크플로우 가이드
내용:
  - Phase 0: 정치인 정보 수집 (가장 중요!)
  - 전체 프로세스 오케스트레이션
  - 자동화 스크립트 사용법
```

**읽는 방법:**
```python
# Claude Code에서 실행
Read("C:\\...\\V40\\instructions\\V40_오케스트레이션_가이드.md")
```

---

## 🚫 금지 사항

❌ **이 3개 문서를 읽지 않고 작업 시작하지 마세요!**
❌ **README.md만 읽고 넘어가지 마세요!**
❌ **추측으로 작업하지 마세요!**

---

## ✅ 작업 시작 체크리스트

새 세션 시작 시 이 체크리스트를 따르세요:

- [ ] README.md 읽음
- [ ] V40_문서_관계도.md 읽음
- [ ] V40_기본방침.md 읽음
- [ ] V40_전체_프로세스_가이드.md 읽음
- [ ] V40_오케스트레이션_가이드.md 읽음
- [ ] 정치인 정보 확인 (instructions/1_politicians/)
- [ ] 작업 시작

**모든 체크박스를 체크한 후에만 작업을 시작하세요!**

---

## 📌 왜 이 5개 문서가 필수인가?

1. **README.md**: 전체 구조를 모르면 어디서 시작할지 모름
2. **V40_문서_관계도.md**: 문서 간 연결을 모르면 필요한 정보를 못 찾음
3. **V40_기본방침.md**: 핵심 규칙을 모르면 잘못된 방식으로 수집/평가함
4. **V40_전체_프로세스_가이드.md**: 실행 명령을 모르면 작업 불가
5. **V40_오케스트레이션_가이드.md**: Phase 0 (정치인 정보)를 건너뛰면 수집 실패

---

## 🎯 작업 순서 (요약)

```
1. 이 CLAUDE.md 읽기 (지금 읽는 중)
2. 5개 필수 문서 읽기 (위 순서대로)
   - README.md
   - V40_문서_관계도.md
   - V40_기본방침.md
   - V40_전체_프로세스_가이드.md
   - V40_오케스트레이션_가이드.md
3. 정치인 정보 확인 (instructions/1_politicians/{이름}.md)
4. 작업 시작
```

---

## 🔢 배치 크기 규칙 (CRITICAL!)

**⚠️⚠️⚠️ 배치 크기는 상황에 따라 다릅니다 - 반드시 확인하세요! ⚠️⚠️⚠️**

### 스크립트별 배치 크기 (최적화 적용)

| 스크립트 | 모델 | 배치 크기 | 최적화 | 용도 |
|---------|------|----------|--------|------|
| `claude_eval_helper.py` | Haiku 4.5 | 25개 | Pre-filtering | Claude Anthropic API 평가 |
| `codex_eval_helper.py` | gpt-5.1-codex-mini | 25개 (자동 재시도 5) | Pre-filtering + 자동 재시도 | ChatGPT Codex CLI Direct 평가 (~1 credit/msg) |
| `grok_eval_helper.py` | Grok 3 | 25개 | Pre-filtering | Grok xAI Agent Tools API 평가 |
| `evaluate_gemini_subprocess.py` | 2.0 Flash | 25개 | Pre-filtering | Gemini CLI Subprocess 평가 |
| Skill `/evaluate-politician-v40` | (자동) | 50개 | Pre-filtering | Skill 기반 자동 평가 (Claude) |

**🚀 성능 최적화 (V40 개선)**:
- ✅ **배치 평가**: 25개씩 처리 (이전: 1-by-1) → 10x 향상
- ✅ **Pre-filtering**: 모든 스크립트에서 이미 평가된 데이터 자동 제외 → 5x 향상
- ✅ **자동 재시도**: ChatGPT Foreign key 오류 시 배치 크기 5개로 자동 재시도 → 안정성 100%
- ✅ **공통 저장 함수**: common_eval_saver.py (4개 AI 통합) → 코드 중복 제거

**🔧 기술적 방식 비교 (API vs CLI - 5개월 시행착오의 핵심)**:

| 항목 | CLI 방식 (✅ 채택) | API 방식 (❌ 폐기) | 개선 효과 |
|------|-------------------|-------------------|-----------|
| **인증** | 🔓 Account (Claude/Gemini)<br>🔐 API Key (ChatGPT/Grok)<br>→ 1회 설정 | API Key 필수 (4개 전부)<br>→ 매 요청 인증 | 편의성 ↑ |
| **실행** | Subprocess 호출<br>→ 간단한 CLI 명령 | HTTP API 요청<br>→ 복잡한 JSON 구성 | 복잡도 ↓ |
| **제한** | Claude/Gemini: 무제한 (구독)<br>ChatGPT/Grok: API 제한 | 분당 요청 제한 (RPM)<br>→ Gemini: 15 req/min | 속도 5x ↑ |
| **비용** | Claude/Gemini: $0 (구독)<br>ChatGPT: $1.125/1K<br>총계: ~$1.13/1K | Claude: $0.75/1K<br>Gemini: $0.19/1K<br>ChatGPT: $45/1K<br>총계: ~$46/1K | **97.5% 절감** |
| **코드** | 단순 (~20줄)<br>→ subprocess.run() | 복잡 (~70줄)<br>→ HTTP client, retry | 유지보수 ↑ |

**💡 핵심 인사이트**: "API가 아니라 CLI로 가라. 구독 플랜이 API보다 40배 저렴하다."

📄 **상세 분석**: `V40_AI_평가_방식_및_비용_종합_분석.md` 참조

### V40 기본 규칙

**API/CLI 평가 (Claude, ChatGPT, Grok):**
```python
batch_size = 25  # API/CLI 최적화: 25개 배치
```

**Gemini CLI Subprocess (최적화 적용):**
```python
batch_size = 25  # Pre-filtering 적용, 5x 향상
```

### 우선순위 규칙

1. **Gemini Subprocess 평가** → 25개 배치
2. **Claude/ChatGPT/Grok 평가** → 25개 배치
3. **Skill instructions에 명시된 경우** → 해당 크기 사용
4. **불확실하면** → 스크립트별 기본값 사용

### 예시

**Case 1: Skill instructions에 "배치 크기 50개" 명시**
```
→ 50개씩 처리 (Skill instructions 우선)
```

**Case 2: Skill instructions에 배치 크기 언급 없음**
```
→ 25개씩 처리 (V40 기본 규칙 적용)
```

### 핵심 원칙

✅ **Skill instructions 우선** (명시된 경우)
✅ **V40 기본 규칙 (25개) 기본값** (명시 없는 경우)
❌ **임의로 변경 금지**

---

## 🔧 Gemini CLI 평가 프로세스 (CRITICAL!)

**⚠️⚠️⚠️ Gemini 평가는 반드시 이 프로세스를 따라야 합니다! ⚠️⚠️⚠️**

### 공식 스크립트

**평가 스크립트**: `scripts/workflow/evaluate_gemini_subprocess.py`

**주요 특징:**
- ✅ Gemini CLI Subprocess 방식 (Google 계정 인증)
- ✅ instruction 파일 자동 로드 및 프롬프트 포함
- ✅ 올바른 테이블 사용 (`collected_data_v40`, `evaluations_v40`)
- ✅ 배치 크기: 25개 (Pre-filtering 적용)
- ✅ 성능 최적화: 5x 향상 (이미 평가된 데이터 자동 제외)
- ✅ 공통 저장 함수: common_eval_saver.py 사용

### Instruction 파일 참조 구조

**평가 기준 위치**: `instructions/3_evaluate/cat{번호}_{카테고리}.md`

**예시:**
- `cat01_expertise.md` - 전문성 평가 기준
- `cat02_leadership.md` - 리더십 평가 기준
- ...10개 카테고리 전부

**스크립트 동작:**
1. instruction 파일 경로 확인 (Line 276)
2. 파일 존재 여부 체크 (Line 278-285)
3. 파일 내용 읽기 (Line 287-288)
4. 프롬프트에 **내용 포함** (Line 297-298)
5. Gemini CLI로 평가 실행

### 테이블 구조 (절대 변경 금지!)

**수집 데이터 테이블**: `collected_data_v40`
- ✅ 현재 사용 중
- ❌ `v40_events` (구버전, 사용 금지)

**평가 결과 테이블**: `evaluations_v40`
- ✅ 현재 사용 중
- ❌ `v40_evaluations` (구버전, 사용 금지)

**주요 필드:**
- `collected_data_v40`: id, title, content, source_url, source_name, published_date, collector_ai
- `evaluations_v40`: id, politician_id, category, evaluator_ai, collected_data_id, rating, reasoning

### 실행 방법

```bash
cd V40/scripts/workflow

# 단일 카테고리 평가
python evaluate_gemini_subprocess.py \
  --politician "박주민" \
  --category "expertise"

# 모든 카테고리 평가 (10개 순차 실행)
for cat in expertise leadership vision integrity ethics accountability transparency communication responsiveness publicinterest; do
  python evaluate_gemini_subprocess.py --politician "박주민" --category "$cat"
done
```

### 가이드 문서

**상세 가이드**: `instructions/3_evaluate/Gemini_CLI_평가_작업방법.md`

---

## 🔧 Grok xAI API 평가 프로세스 (CRITICAL!)

**⚠️⚠️⚠️ Grok 평가는 xAI Agent Tools API (curl subprocess) 방식을 사용합니다! ⚠️⚠️⚠️**

### 공식 스크립트

**평가 스크립트**: `scripts/helpers/grok_eval_helper.py`

**주요 특징:**
- ✅ xAI Agent Tools API 호출 (curl subprocess)
- ✅ 모델: `grok-3` (xAI Agent Tools API, Grok 3)
- ✅ 올바른 테이블 사용 (`collected_data_v40`, `evaluations_v40`)
- ✅ 배치 크기: 25개 (V40 기본값)
- ✅ HTML 엔티티 디코딩 (`html.unescape`)
- ✅ JSON 응답 파싱 및 등급 검증

### xAI API 설정

**API 키 환경변수**: `XAI_API_KEY`
**API 엔드포인트**: `https://api.x.ai/v1/responses`
**사용 모델**: `grok-3` (Grok 3)

```python
# .env 파일
XAI_API_KEY=xai-...
```

### 테이블 구조

**수집 데이터 테이블**: `collected_data_v40`
**평가 결과 테이블**: `evaluations_v40`

(Gemini와 동일한 테이블 구조 사용)

### 실행 방법

```bash
cd V40/scripts/helpers

# 단일 카테고리 평가
python grok_eval_helper.py \
  --politician_id=8c5dcc89 \
  --politician_name="박주민" \
  --category=expertise \
  --batch_size=25

# 모든 카테고리 평가 (10개 순차 실행)
for cat in expertise leadership vision integrity ethics accountability transparency communication responsiveness publicinterest; do
  python grok_eval_helper.py --politician_id=8c5dcc89 --politician_name="박주민" --category="$cat" --batch_size=25
done
```

### 기술적 구현 상세

**Grok CLI vs xAI API:**
- ❌ Grok CLI (deprecated, 410 error)
- ✅ xAI Agent Tools API (curl subprocess)

**모델명 선택:**
- ❌ `grok-beta` (OpenRouter 전용)
- ❌ `grok-2` (구버전)
- ✅ `grok-3` (xAI Agent Tools API, Grok 3 - 현재 사용 중)

**프롬프트 전달:**
```python
payload = {
    'model': 'grok-3',  # Grok 3 사용
    'input': [{'role': 'user', 'content': prompt}],
    'tools': []  # 평가에는 웹 검색 불필요
}
# curl subprocess로 xAI Agent Tools API 호출
curl_cmd = ['curl', '-s', '-X', 'POST', 'https://api.x.ai/v1/responses',
            '-H', 'Content-Type: application/json',
            '-H', f'Authorization: Bearer {api_key}',
            '-d', json.dumps(payload)]
result = subprocess.run(curl_cmd, capture_output=True, text=True, timeout=60)
```

---

## 🔄 추가 평가 방법 (평가 누락 시) (CRITICAL!)

**⚠️⚠️⚠️ 중요: evaluate_missing_v40_api.py는 Deprecated! 사용하지 마세요! ⚠️⚠️⚠️**

### 핵심 원칙

**⭐ 추가 평가는 각 AI의 Helper 스크립트를 다시 실행하면 자동으로 미평가 데이터만 평가합니다!**

모든 Helper 스크립트는 자체적으로 미평가 데이터를 찾아서 평가하는 기능이 내장되어 있습니다.

### 언제 필요한가?

1. **평가 상태 확인 시 누락 발견**
   ```bash
   python check_evaluation_status.py --politician "박주민"
   # 결과: ChatGPT 175/179 ⚠️ (4개 누락)
   ```

2. **오류로 인한 평가 중단** (네트워크, API 한도, 타임아웃 등)

3. **새로운 데이터 수집 후** (검증/재수집 후)

### AI별 추가 평가 방법

#### 1. Claude 추가 평가
```bash
cd V40/scripts/helpers
python claude_eval_helper.py \
  --politician_id=8c5dcc89 \
  --politician_name="박주민" \
  --category=expertise \
  --batch_size=25
```

#### 2. ChatGPT 추가 평가
```bash
cd V40/scripts/helpers
python codex_eval_helper.py \
  --politician_id=8c5dcc89 \
  --politician_name="박주민" \
  --category=expertise \
  --batch_size=25
```

#### 3. Gemini 추가 평가
```bash
cd V40/scripts/workflow
python evaluate_gemini_subprocess.py \
  --politician "박주민" \
  --category "expertise"
```

#### 4. Grok 추가 평가
```bash
cd V40/scripts/helpers
python grok_eval_helper.py \
  --politician_id=8c5dcc89 \
  --politician_name="박주민" \
  --category=expertise \
  --batch_size=25
```

### 전체 카테고리 일괄 추가 평가

**예시: Claude 전체 카테고리**
```bash
cd V40/scripts/helpers
for cat in expertise leadership vision integrity ethics accountability transparency communication responsiveness publicinterest; do
  python claude_eval_helper.py \
    --politician_id=8c5dcc89 \
    --politician_name="박주민" \
    --category=$cat \
    --batch_size=25
done
```

### 중요 사항

1. **자동 중복 방지**: 같은 스크립트를 여러 번 실행해도 안전 (이미 평가된 데이터는 건너뜀)

2. **배치 크기**: 기본값 25개 (Gemini는 자동 조정)

3. **상태 확인**:
   ```bash
   cd V40/scripts/utils
   python check_evaluation_status.py --politician "박주민"
   ```

### 상세 가이드

**📖 자세한 사용법**: `instructions/V40_추가평가_가이드.md`
- AI별 상세 실행 방법
- 워크플로우
- 실전 예시
- 주의사항

---

## 💡 실전 Tips (Lessons Learned)

### 수집 단계 (Phase 2)

**DO ✅:**
- 버퍼 목표 60개/AI/카테고리로 수집 (재수집 방지)
- Gemini 60 + Naver 60 = 120개 (50-50 유지)
- 모든 카테고리 동일 목표 (차별 금지)

**DON'T ❌:**
- 최소 목표 50개만 수집 (Phase 2-2 재수집 2-3시간)
- 50-50 비율 어기기 (예: Naver 55 + Gemini 5)
- 버퍼 초과 목표 (65개 등)
- 카테고리별 다른 목표

### 재수집 단계 (Phase 2-2)

**수집이 어려운 카테고리:**
- integrity (청렴성): 가장 어려움, 평균 2-4개/라운드
- transparency (투명성): 어려움, 평균 4-6개/라운드
- PUBLIC 2년 내 데이터 부족 가능성 높음

**재수집 스크립트:**
```bash
# Gemini 재수집
cd V40/scripts/workflow
python recollect_gemini_v40.py --politician "조은희"

# Naver 재수집
python recollect_naver_v40.py --politician_id d0a5d6e1 --politician_name "조은희"
```

### 시간 예상

| 단계 | 버퍼 수집 (60) | 최소 수집 (50) |
|------|---------------|---------------|
| Phase 2 | 30-40분 | 20-30분 |
| Phase 3 | 10-15분 | 10-15분 |
| Phase 2-2 | 거의 없음 (5-15분) | 2-3시간! |
| **합계** | **45-70분** | **2.5-3.5시간** |

**결론: 버퍼 수집이 전체적으로 2배 빠름!**

### 참고 문서

**필수:**
- `V40_기본방침.md`: 핵심 규칙
- `V40_전체_프로세스_가이드.md`: 전체 프로세스
- `V40_검증후조정_가이드.md`: Phase 2-2 상세 (섹션 12: 실전 교훈)

**상세:**
- `GEMINI_CLI_수집_가이드.md`: Gemini CLI 사용법
- `NAVER_API_수집_가이드.md`: Naver API 사용법

---

**⚠️ 이 지침을 무시하고 작업하면 오류가 발생하며, 재작업이 필요합니다!**
