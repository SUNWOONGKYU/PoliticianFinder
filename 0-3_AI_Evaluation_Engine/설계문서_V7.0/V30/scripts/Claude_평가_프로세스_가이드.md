# Claude 평가 프로세스 가이드

**버전**: V30
**작성일**: 2026-01-21
**대상**: Claude Code 세션

---

## 개요

Claude는 API를 사용하지 않고 **Claude Code Subscription Mode**로 평가합니다.
- **비용**: $0 (API 호출 없음)
- **방식**: Claude Code 세션이 파일을 직접 읽고 이해하여 평가
- **장점**: 맥락을 이해한 평가 (키워드 매칭 아님)

---

## 전체 프로세스

```
[Step 1] Python 스크립트: 작업 파일 생성
         ↓
[Step 2] Claude Code 세션: 배치별 평가 (이 가이드)
         ↓
[Step 3] Python 스크립트: 결과 DB import
```

---

## Step 1: 작업 파일 생성

### 명령어

```bash
cd 설계문서_V7.0/V30/scripts

python evaluate_claude_auto.py \
  --politician_id=f9e00370 \
  --politician_name="김민석" \
  --category=leadership \
  --output=eval_leadership.md
```

### 생성되는 파일

```
eval_leadership.md           # 사람이 읽을 마크다운
eval_leadership_data.json    # 평가할 데이터 (75개 항목)
```

### eval_leadership_data.json 구조

```json
{
  "politician_id": "f9e00370",
  "politician_name": "김민석",
  "category": "leadership",
  "total_items": 75,
  "items": [
    {
      "id": "dc8a158e-5e10-4451-bd7e-704ba5168dae",
      "title": "김민석 국무총리 후보자 재산·자녀 의혹...",
      "content": "...",
      "source_type": "OFFICIAL",
      "data_source": "국회의사록",
      "event_date": "2024-12-14"
    }
    // ... 74개 더
  ]
}
```

---

## Step 2: Claude Code 배치 평가 (핵심!)

### 2-1. 데이터 분할

75개 항목을 **10개씩 배치**로 나눕니다.

```bash
python split_batches.py eval_leadership_data.json
```

**생성 결과**:
```
batch_01.json (10개)
batch_02.json (10개)
batch_03.json (10개)
batch_04.json (10개)
batch_05.json (10개)
batch_06.json (10개)
batch_07.json (10개)
batch_08.json (5개)
```

### 2-2. 배치별 평가 (Claude Code가 직접 수행)

#### ⚠️ 중요: 이것은 자동화할 수 없습니다!

Claude Code(AI)가 **각 항목을 실제로 읽고 이해하고 판단**해야 합니다.

#### 평가 방법

**각 배치마다 다음을 수행**:

1. **파일 읽기**
   ```
   Read tool: batch_01.json
   ```

2. **각 항목 평가**
   - 제목과 내용을 읽고 이해
   - 카테고리 관점에서 판단
     - leadership → 리더십 관련성
     - expertise → 전문성 관련성
     - integrity → 청렴성 관련성
     - 등등
   - 등급 결정 (+4, +3, +2, +1, 0, -1, -2, -3, -4)
   - 이유(reasoning) 작성

3. **결과 저장**
   ```json
   {
     "batch_num": 1,
     "politician_id": "f9e00370",
     "politician_name": "김민석",
     "category": "leadership",
     "evaluator_ai": "Claude",
     "evaluated_at": "2026-01-21T20:58:00",
     "evaluations": [
       {
         "collected_data_id": "dc8a158e-5e10-4451-bd7e-704ba5168dae",
         "rating": "-1",
         "score": -2,
         "reasoning": "재산 형성 및 자녀 관련 의혹이 제기되어 국무총리 후보자로서의 검증 과정에서 리더십 평가에 부정적 영향"
       }
       // ... 9개 더
     ]
   }
   ```

   **파일명**: `batch_01_result.json`

#### 평가 예시 (expertise 카테고리)

**항목**:
```
제목: 김민석 국무총리 취임 첫날 전공의·의대생과 회동
내용: 김민석 국무총리가 취임 첫날 의정 갈등 해결을 위해 전공의·의대생 대표들과 회동...
```

**평가 판단 과정**:
- 이것은 전문성과 관련있는가? → Yes
- 긍정인가 부정인가? → 긍정 (현안 대응)
- 얼마나 긍정인가? → 상당히 긍정 (취임 첫날, 직접 회동)
- 등급: +2
- 이유: "국무총리 취임 첫날 의정 갈등 현안에 대해 전공의·의대생과 직접 회동하여 해결 방안 논의, 현안 대응 능력 양호"

**❌ 잘못된 방법 (키워드 매칭)**:
```python
if "국무총리" in text:
    rating = "+2"
```

**✅ 올바른 방법 (맥락 이해)**:
- 제목과 내용 전체를 읽음
- 전문성 관점에서 의미 파악
- 구체적인 이유와 함께 등급 결정

#### 8개 배치 반복

```
batch_01.json → 평가 → batch_01_result.json
batch_02.json → 평가 → batch_02_result.json
batch_03.json → 평가 → batch_03_result.json
batch_04.json → 평가 → batch_04_result.json
batch_05.json → 평가 → batch_05_result.json
batch_06.json → 평가 → batch_06_result.json
batch_07.json → 평가 → batch_07_result.json
batch_08.json → 평가 → batch_08_result.json
```

### 2-3. 결과 통합

```bash
python merge_batch_results.py eval_leadership
```

**생성 결과**:
```
eval_leadership_result.json  # 전체 75개 평가 결과
```

**구조**:
```json
{
  "politician_id": "f9e00370",
  "politician_name": "김민석",
  "category": "leadership",
  "evaluator_ai": "Claude",
  "evaluated_at": "2026-01-21T21:45:00",
  "total_evaluations": 75,
  "evaluations": [
    // 75개 평가 결과
  ]
}
```

---

## Step 3: DB Import

### 명령어

```bash
python evaluate_claude_auto.py \
  --import_results=eval_leadership_result.json
```

### 확인

```sql
SELECT
  category,
  COUNT(*) as count,
  AVG(score) as avg_score
FROM evaluations_v30
WHERE politician_id = 'f9e00370'
  AND evaluator_ai = 'Claude'
GROUP BY category;
```

---

## 전체 10개 카테고리 진행

```bash
# 1. expertise (완료)
✅ 70/75 evaluations saved

# 2. leadership
python evaluate_claude_auto.py --category=leadership --output=eval_leadership.md
[Claude Code 배치 평가]
python evaluate_claude_auto.py --import_results=eval_leadership_result.json

# 3. vision
python evaluate_claude_auto.py --category=vision --output=eval_vision.md
[Claude Code 배치 평가]
python evaluate_claude_auto.py --import_results=eval_vision_result.json

# 4-10. 나머지 7개 동일
```

---

## 평가 기준

### 등급 체계

| 등급 | 점수 | 의미 |
|------|------|------|
| +4 | 8 | 매우 긍정적 (탁월한 성과) |
| +3 | 6 | 긍정적 (우수한 활동) |
| +2 | 4 | 긍정적 (좋은 활동) |
| +1 | 2 | 약간 긍정적 (기본 활동) |
| 0 | 0 | 중립 (관련성 낮음) |
| -1 | -2 | 약간 부정적 (논란) |
| -2 | -4 | 부정적 (심각한 논란) |
| -3 | -6 | 매우 부정적 (중대한 문제) |
| -4 | -8 | 극도로 부정적 (범죄 수준) |

### 카테고리별 관점

**expertise (전문성)**:
- 정책 능력, 업무 지식, 현안 대응
- 관련 없는 것: 단순 윤리 의혹 (integrity로)

**leadership (리더십)**:
- 조직 관리, 위기 대응, 의사결정
- 팀 구성, 방향 제시

**vision (비전)**:
- 장기 계획, 정책 방향, 미래 청사진

**integrity (청렴성)**:
- 부정부패, 재산 형성 과정, 이해충돌

**ethics (윤리성)**:
- 도덕적 판단, 사회적 책임

**accountability (책임성)**:
- 약속 이행, 결과 책임

**transparency (투명성)**:
- 정보 공개, 소통 개방성

**communication (소통능력)**:
- 설명 능력, 대화 자세

**responsiveness (대응성)**:
- 민원 처리, 현안 대응 속도

**publicinterest (공익 추구)**:
- 국민 이익 우선, 특정 집단 편향 배제

---

## 검증 완료 사례

### expertise 카테고리 (김민석, f9e00370)

**결과**:
- Claude: 70/75 평가 완료
- 평균: +1.07
- 긍정: 74.3%
- 부정: 25.7%
- 중립: 0%

**다른 AI 비교**:
- ChatGPT: +1.11 (차이 0.04)
- Gemini: +1.08 (차이 0.01)
- Grok: +1.19 (차이 0.12)

✅ **거의 동일한 평가 결과**

---

## 체크리스트

### Step 1 전

- [ ] politician_id 확인
- [ ] politician_name 확인
- [ ] category 확인
- [ ] evaluate_claude_auto.py 실행

### Step 2 (Claude Code)

- [ ] 데이터 분할 (75개 → 8개 배치)
- [ ] batch_01 ~ batch_08 평가
- [ ] 각 평가에서 맥락 이해 확인
- [ ] reasoning이 구체적인지 확인
- [ ] 결과 통합

### Step 3 전

- [ ] eval_CATEGORY_result.json 생성 확인
- [ ] total_evaluations 개수 확인
- [ ] import 실행
- [ ] DB에서 확인

---

## 주의사항

1. **키워드 매칭 금지**
   - ❌ "의혹" 단어 → 무조건 부정
   - ✅ 맥락 이해 → 판단

2. **카테고리 관점 유지**
   - 윤리 의혹을 expertise로 평가하지 말 것
   - 각 카테고리의 정의에 맞게

3. **reasoning 필수**
   - 왜 이 등급인지 설명
   - 구체적으로 작성

4. **중립(0) 사용**
   - 카테고리와 관련 없으면 0
   - 관련 있으면 긍정/부정 판단

---

## 참조 문서

- `comparison_analysis.md` - 다른 Claude Code와의 방법 비교
- `claude_subscription_integration_plan.md` - 통합 방안 연구

---

**최종 업데이트**: 2026-01-21
