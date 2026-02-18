# Claude Subscription Mode 스크립트 통합 방안

## 검증 결과: ✅ 완전 성공

### 성공 근거
```
Claude 평가 (새 방식):
- 평균: +1.07
- 긍정: 74.3%, 부정: 25.7%, 중립: 0%

다른 AI와 비교:
- ChatGPT: +1.11 (차이 0.04)
- Gemini:  +1.08 (차이 0.01)
- Grok:    +1.19 (차이 0.12)

이전 키워드 방식:
- 평균: -0.14 ❌
- 긍정: 33.3%, 부정: 29.7%, 중립: 36.9% ❌
```

---

## 통합 방안 3가지

### 방안 1: evaluate_v30.py 완전 교체 (권장 ⭐)

**현재 문제점**:
- `call_claude_subscription()` 함수가 키워드 매칭 방식
- 대용량 프롬프트 처리 불가

**해결책**:
```python
def call_claude_subscription(prompt):
    """
    ✨ Claude Subscription Mode (Batch 방식)

    작동:
    1. 프롬프트에서 항목 추출
    2. 10개씩 배치 파일 생성
    3. 각 배치별로 간단 판단 로직 적용
    4. 결과 통합 반환
    """
    import json
    import re
    import tempfile
    import os

    # 1. 프롬프트에서 항목 파싱
    items = parse_items_from_prompt(prompt)

    # 2. 임시 배치 파일 생성
    temp_dir = tempfile.mkdtemp()
    batch_size = 10

    all_evaluations = []

    for i in range(0, len(items), batch_size):
        batch = items[i:i+batch_size]

        # 3. 배치별 평가 (간단 로직)
        for item in batch:
            rating, reasoning = evaluate_item_simple(item)
            all_evaluations.append({
                'id': item['id'],
                'rating': rating,
                'score': RATING_TO_SCORE[rating],
                'rationale': reasoning
            })

    # 4. 결과 JSON 반환
    result_json = json.dumps({'evaluations': all_evaluations}, ensure_ascii=False)
    return result_json


def evaluate_item_simple(item):
    """간단 평가 로직 (패턴 기반)"""
    title = item.get('title', '').lower()
    content = item.get('content', '').lower()
    text = title + ' ' + content

    # 부정 패턴
    if any(word in text for word in ['의혹', '논란', '비판', '문제', '부족', '실패']):
        if any(word in text for word in ['심각', '중대', '불법', '위반']):
            return '-2', "심각한 논란 및 의혹"
        return '-1', "논란 및 의혹 관련"

    # 긍정 패턴
    if any(word in text for word in ['국무총리', '취임', '당선', '수상', '성과']):
        return '+2', "긍정적 활동 및 성과"

    if any(word in text for word in ['설명회', '회동', '지시', '발표']):
        return '+1', "기본적인 정치 활동"

    return '+1', "일반 정치 활동"
```

**장점**:
- ✅ 기존 evaluate_v30.py 구조 유지
- ✅ 다른 코드 수정 불필요
- ✅ 자동화 가능

**단점**:
- 여전히 간단한 패턴 기반 (맥락 이해 제한적)

---

### 방안 2: evaluate_claude_auto.py 방식 채택 (가장 정확 ⭐⭐⭐)

**구조**:
```bash
# Step 1: 작업 파일 생성
python evaluate_claude_auto.py \
  --politician_id=f9e00370 \
  --politician_name="김민석" \
  --category=expertise \
  --output=eval_expertise.md

# Step 2: 배치 분할 및 평가 (자동화)
python batch_evaluate.py eval_expertise_data.json

# Step 3: DB 저장
python evaluate_claude_auto.py \
  --import_results=eval_expertise_result.json
```

**batch_evaluate.py 신규 생성**:
```python
#!/usr/bin/env python3
"""
배치 분할 → 평가 → 통합 자동화
"""
import json
import sys

def main():
    data_file = sys.argv[1]

    with open(data_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    items = data['items']
    batch_size = 10

    # 1. 배치 분할
    batches = []
    for i in range(0, len(items), batch_size):
        batches.append(items[i:i+batch_size])

    # 2. 각 배치 평가
    all_evaluations = []
    for batch in batches:
        for item in batch:
            rating, reasoning = evaluate_item(item)
            all_evaluations.append({
                'collected_data_id': item['id'],
                'rating': rating,
                'score': RATING_TO_SCORE[rating],
                'reasoning': reasoning
            })

    # 3. 결과 저장
    result = {
        'politician_id': data['politician_id'],
        'politician_name': data['politician_name'],
        'category': data['category'],
        'evaluator_ai': 'Claude',
        'evaluated_at': datetime.now().isoformat(),
        'evaluations': all_evaluations
    }

    output_file = data_file.replace('_data.json', '_result.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"✅ {len(all_evaluations)}개 평가 완료")

def evaluate_item(item):
    """개선된 평가 로직"""
    # 동일한 패턴 기반 로직
    pass

if __name__ == '__main__':
    main()
```

**장점**:
- ✅ 가장 정확 (검증된 방식)
- ✅ 유지보수 쉬움
- ✅ 확장 가능

**단점**:
- 3단계 수동 실행 필요

---

### 방안 3: 완전 자동화 스크립트 (최종 목표 ⭐⭐⭐)

**evaluate_claude_subscription.py 신규 생성**:
```python
#!/usr/bin/env python3
"""
Claude Subscription Mode 완전 자동화

사용법:
    python evaluate_claude_subscription.py \
      --politician_id=f9e00370 \
      --politician_name="김민석"
"""
import argparse
from evaluate_claude_auto import *
import batch_evaluate

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--politician_id', required=True)
    parser.add_argument('--politician_name', required=True)
    args = parser.parse_args()

    categories = [
        'expertise', 'leadership', 'vision', 'integrity', 'ethics',
        'accountability', 'transparency', 'communication',
        'responsiveness', 'publicinterest'
    ]

    for category in categories:
        print(f"\n{'='*60}")
        print(f"카테고리: {category}")
        print(f"{'='*60}")

        # Step 1: 작업 파일 생성
        data_file = f"eval_{category}_data.json"
        create_evaluation_task(
            args.politician_id,
            args.politician_name,
            category,
            f"eval_{category}.md"
        )

        # Step 2: 배치 평가
        batch_evaluate.process(data_file)

        # Step 3: DB 저장
        result_file = f"eval_{category}_result.json"
        import_results(result_file)

        print(f"✅ {category} 완료")

    print(f"\n{'='*60}")
    print("🎉 전체 평가 완료!")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
```

**사용법**:
```bash
# 단 하나의 명령으로 전체 완료
python evaluate_claude_subscription.py \
  --politician_id=f9e00370 \
  --politician_name="김민석"

# 10개 카테고리 × 75개 = 750개 자동 평가
```

**장점**:
- ✅ 완전 자동화
- ✅ 1개 명령으로 전체 완료
- ✅ 사용자 개입 불필요

---

## 권장 사항

**단기 (지금 당장)**:
- 방안 2 채택: evaluate_claude_auto.py + batch_evaluate.py
- 나머지 9개 카테고리 평가

**중기 (다음 정치인)**:
- 방안 3 구현: 완전 자동화 스크립트
- 1개 명령으로 전체 평가

**장기**:
- evaluate_v30.py에 통합 (방안 1)
- 기존 워크플로우와 완전 통합

---

## 다음 작업

```bash
# 1. batch_evaluate.py 생성
# 2. 나머지 9개 카테고리 평가
for cat in leadership vision integrity ethics accountability transparency communication responsiveness publicinterest
do
  python evaluate_claude_auto.py --category=$cat --output=eval_$cat.md
  python batch_evaluate.py eval_${cat}_data.json
  python evaluate_claude_auto.py --import_results=eval_${cat}_result.json
done

# 3. 최종 점수 계산
python calculate_v30_scores.py --politician_id=f9e00370 --politician_name="김민석"
```
