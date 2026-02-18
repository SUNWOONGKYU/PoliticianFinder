# evaluate-politician-v30

**Command**: `/evaluate-politician-v30`

**Description**: V30 정치인 평가 (Claude Code Subscription 모드, API 비용 $0)

**Usage**:
```
/evaluate-politician-v30 --politician_id=f9e00370 --politician_name=김민석 --category=responsiveness
```

---

## 🎯 목적

V30 풀링 평가 시스템에서 Claude가 **subscription mode**로 평가를 수행합니다.
- ✅ API 비용 $0 (Claude Code subscription 사용)
- ✅ Native Claude Code context (subprocess 없음)
- ✅ Database 직접 조회 및 저장
- ✅ V30 등급 체계 (+4 ~ -4) 적용

---

## 📋 작업 프로세스

### 1단계: 환경 확인
- Supabase 연결 확인
- 정치인 정보 조회
- 카테고리 데이터 확인

### 2단계: 데이터 조회
- `collected_data_v30` 테이블에서 미평가 데이터 조회
- 중복 제거 (같은 AI가 같은 URL 2번 수집한 경우만)
- 배치 크기: 10개씩

### 3단계: 평가 수행
- V30 등급 체계 적용 (+4 ~ -4)
- 정치인 프로필 정보 참조
- 객관적 평가 수행

### 4단계: 결과 저장
- `evaluations_v30` 테이블에 저장
- 중복 키 에러 처리
- 저장 실패 시 재시도

---

## 🔧 Parameters

| Parameter | Required | Description | Example |
|-----------|----------|-------------|---------|
| `--politician_id` | ✅ Yes | 정치인 ID (8자리 hex) | `f9e00370` |
| `--politician_name` | ✅ Yes | 정치인 이름 | `김민석` |
| `--category` | ✅ Yes | 카테고리 영문명 | `responsiveness` |
| `--batch_size` | ❌ No | 배치 크기 (기본: 10) | `10` |

---

## 📊 V30 등급 체계 (+4 ~ -4)

| 등급 | 점수(×2) | 판단 기준 |
|------|----------|-----------|
| +4 | +8점 | 탁월함 - 해당 분야 모범 사례 |
| +3 | +6점 | 우수함 - 긍정적 평가 |
| +2 | +4점 | 양호함 - 기본 충족 |
| +1 | +2점 | 보통 - 평균 수준 |
| -1 | -2점 | 미흡함 - 개선 필요 |
| -2 | -4점 | 부족함 - 문제 있음 |
| -3 | -6점 | 매우 부족 - 심각한 문제 |
| -4 | -8점 | 극히 부족 - 정치인 부적합 |

---

## 🤖 Implementation Instructions

When this command is invoked, you MUST:

### Step 1: Parse Arguments
```python
import argparse
parser = argparse.ArgumentParser()
parser.add_argument('--politician_id', required=True)
parser.add_argument('--politician_name', required=True)
parser.add_argument('--category', required=True)
parser.add_argument('--batch_size', type=int, default=10)
args = parser.parse_args()
```

### Step 2: Connect to Database
```python
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(override=True)
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)
```

### Step 3: Query Unevaluated Data
```python
# 1. 이미 평가된 데이터 ID 조회
evaluated_result = supabase.table('evaluations_v30')\
    .select('collected_data_id')\
    .eq('politician_id', args.politician_id)\
    .eq('evaluator_ai', 'Claude')\
    .eq('category', args.category.lower())\
    .execute()

evaluated_ids = {item['collected_data_id'] for item in evaluated_result.data if item.get('collected_data_id')}

# 2. 수집된 데이터 조회 (풀링: 4개 AI 수집 데이터 통합)
collected_result = supabase.table('collected_data_v30')\
    .select('*')\
    .eq('politician_id', args.politician_id)\
    .eq('category', args.category.lower())\
    .execute()

# 3. 미평가 데이터 필터링
unevaluated_items = [
    item for item in collected_result.data
    if item['id'] not in evaluated_ids
]

# 4. AI별 URL 중복 제거
seen_by_ai = {}
unique_items = []
for item in unevaluated_items:
    ai_name = item.get('collector_ai', 'unknown')
    url = item.get('source_url', '')

    if ai_name not in seen_by_ai:
        seen_by_ai[ai_name] = set()

    if url and url in seen_by_ai[ai_name]:
        continue  # 같은 AI가 같은 URL 중복 → 제거

    if url:
        seen_by_ai[ai_name].add(url)
    unique_items.append(item)

print(f"📊 미평가 데이터: {len(unique_items)}개")
```

### Step 4: Get Politician Profile
```python
# 정치인 프로필 조회
profile_result = supabase.table('politicians')\
    .select('*')\
    .eq('id', args.politician_id)\
    .execute()

profile = profile_result.data[0] if profile_result.data else {}

profile_text = f"""**대상 정치인**: {args.politician_name}

**정치인 기본 정보**:
- 이름: {profile.get('name', args.politician_name)}
- 신분: {profile.get('identity', 'N/A')}
- 직책: {profile.get('title', 'N/A')}
- 정당: {profile.get('party', 'N/A')}
- 지역: {profile.get('region', 'N/A')}

⚠️ **중요**: 반드시 위 정보와 일치하는 "{args.politician_name}"에 대해 평가하세요."""
```

### Step 5: Batch Evaluation (10개씩)
```python
from datetime import datetime

CATEGORY_MAP = {
    "expertise": "전문성",
    "leadership": "리더십",
    "vision": "비전",
    "integrity": "청렴성",
    "ethics": "윤리성",
    "accountability": "책임감",
    "transparency": "투명성",
    "communication": "소통능력",
    "responsiveness": "대응성",
    "publicinterest": "공익성"
}

RATING_TO_SCORE = {
    '+4': 8, '+3': 6, '+2': 4, '+1': 2,
    '-1': -2, '-2': -4, '-3': -6, '-4': -8
}

cat_kor = CATEGORY_MAP.get(args.category.lower(), args.category)
batch_size = args.batch_size
total_saved = 0

for i in range(0, len(unique_items), batch_size):
    batch = unique_items[i:i+batch_size]

    # 배치 데이터 포맷
    items_text = ""
    for idx, item in enumerate(batch, 1):
        items_text += f"""
[항목 {idx}]
- ID: {item.get('id', '')}
- 제목: {item.get('title', 'N/A')}
- 내용: {item.get('content', 'N/A')[:300]}...
- 출처: {item.get('source_name', item.get('source_url', 'N/A'))}
- 날짜: {item.get('published_date', 'N/A')}
- 수집AI: {item.get('collector_ai', 'N/A')}
"""

    # ===== 🎯 핵심: Claude Code Native 평가 (Subscription Mode) =====
    # subprocess 없음, API 호출 없음, Claude가 직접 평가!
    prompt = f"""당신은 정치인 평가 전문가입니다.

{profile_text}

**평가 카테고리**: {cat_kor} ({args.category})

아래 데이터를 **객관적으로 평가**하여 등급을 부여하세요.

**등급 체계** (+4 ~ -4):
| 등급 | 판단 기준 | 점수 |
|------|-----------|------|
| +4 | 탁월함 - 해당 분야 모범 사례 | +8 |
| +3 | 우수함 - 긍정적 평가 | +6 |
| +2 | 양호함 - 기본 충족 | +4 |
| +1 | 보통 - 평균 수준 | +2 |
| -1 | 미흡함 - 개선 필요 | -2 |
| -2 | 부족함 - 문제 있음 | -4 |
| -3 | 매우 부족 - 심각한 문제 | -6 |
| -4 | 극히 부족 - 정치인 부적합 | -8 |

**평가 기준**:
- 긍정적 내용 (성과, 업적, 칭찬) → +4, +3, +2
- 경미한 긍정 (보통, 평범) → +1
- 부정적 내용 (논란, 비판, 문제) → -1, -2, -3, -4 (심각도에 따라)

**평가할 데이터**:
{items_text}

**반드시 모든 항목에 대해 평가하세요.**

다음 JSON 형식으로 반환:
```json
{{
  "evaluations": [
    {{
      "id": "데이터 ID 값",
      "rating": "+4, +3, +2, +1, -1, -2, -3, -4 중 하나",
      "rationale": "평가 근거 (1문장)"
    }}
  ]
}}
```"""

    # 🎯 YOU (Claude) evaluate directly here in this context!
    # This is native Claude Code execution, NOT API call!
    print(f"\n[배치 {i//batch_size + 1}] {len(batch)}개 항목 평가 중...")
    print(prompt)
    print("\n👆 위 프롬프트에 따라 평가를 수행하고 JSON 형식으로 반환하세요.")
    print("⚠️ 이 평가는 Claude Code subscription mode로 실행되므로 API 비용이 청구되지 않습니다.")

    # Wait for YOUR evaluation response...
    # (User will provide the evaluation result, or you generate it directly)

    # ===== Parse evaluation result =====
    # After you generate the evaluation, parse it:
    import json
    import re

    # Extract JSON from response
    # (Implementation note: In actual execution, YOU will generate the evaluation
    #  and then parse your own response here)

    # Example parsing (to be filled with actual evaluation result):
    """
    evaluation_response = YOUR_EVALUATION_RESPONSE_HERE

    json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', evaluation_response)
    if json_match:
        json_str = json_match.group(1)
    else:
        json_str = evaluation_response

    data = json.loads(json_str)
    evaluations = data.get('evaluations', [])

    # Validate and save
    records = []
    for idx, ev in enumerate(evaluations):
        rating = str(ev.get('rating', '')).strip()
        if rating in ['4', '3', '2', '1']:
            rating = '+' + rating

        if rating in ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4']:
            # Match evaluation to batch item by index
            if idx < len(batch):
                record = {
                    'politician_id': args.politician_id,
                    'politician_name': args.politician_name,
                    'category': args.category.lower(),
                    'evaluator_ai': 'Claude',
                    'collected_data_id': batch[idx]['id'],
                    'rating': rating,
                    'score': RATING_TO_SCORE[rating],
                    'reasoning': ev.get('rationale', '')[:1000],
                    'evaluated_at': datetime.now().isoformat()
                }
                records.append(record)

    # Save to database
    if records:
        try:
            result = supabase.table('evaluations_v30').insert(records).execute()
            saved_count = len(result.data) if result.data else 0
            total_saved += saved_count
            print(f"  ✅ {saved_count}개 평가 저장 완료")
        except Exception as e:
            if 'duplicate key' in str(e).lower():
                print(f"  ⚠️ 중복 평가 건너뛰기")
            else:
                print(f"  ❌ 저장 실패: {e}")
    """

print(f"\n{'='*60}")
print(f"✅ 평가 완료: {args.politician_name} - {cat_kor}")
print(f"   총 저장: {total_saved}건")
print(f"{'='*60}")
```

---

## ⚠️ CRITICAL: Subscription Mode 보장

This command MUST run natively within Claude Code session:
- ✅ **NO** `subprocess.run()` or `claude.cmd` calls
- ✅ **NO** API client initialization
- ✅ **YES** Direct evaluation by YOU (Claude) in current context
- ✅ **YES** Database operations only (Supabase client)

**How this works**:
1. Command loads data from database
2. Formats evaluation prompt
3. **YOU (Claude) read the prompt and generate evaluation directly in this session**
4. Parse your own evaluation response
5. Save to database

**No external process = No API charges = Subscription mode only! ✅**

---

## 📝 Example Usage

```bash
# Evaluate responsiveness category (23 missing items)
python -c "
from commands.evaluate_politician_v30 import evaluate_politician_v30
evaluate_politician_v30(
    politician_id='f9e00370',
    politician_name='김민석',
    category='responsiveness',
    batch_size=10
)
"
```

Or invoke via Claude Code:
```
/evaluate-politician-v30 --politician_id=f9e00370 --politician_name=김민석 --category=responsiveness
```

---

## 🔄 Integration with evaluate_v30.py

To use this command in the existing workflow:

1. **Replace** `call_claude_cli()` function
2. **Use** Task tool with this command:
   ```python
   from claude_code import Task

   Task(
       subagent_type="general-purpose",
       description=f"Evaluate {category}",
       prompt=f"/evaluate-politician-v30 --politician_id={politician_id} --politician_name={politician_name} --category={category}"
   )
   ```

3. **Benefit**: No API charges, subscription mode only!

---

**최종 업데이트**: 2026-01-21
**버전**: V30 Subscription Mode
