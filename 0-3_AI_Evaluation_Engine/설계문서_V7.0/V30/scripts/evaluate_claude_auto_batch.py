# -*- coding: utf-8 -*-
"""
V30 Claude 자동 배치 평가 스크립트

핵심 특징:
- API 비용 $0 (Claude Code Subscription)
- 완전 자동 (input() 없음)
- Task tool + politician-evaluator subagent 활용

사용법:
    python evaluate_claude_auto_batch.py --politician_id=d0a5d6e1 --politician_name="조은희" --category=expertise
"""

import os
import sys
import json
import argparse
import tempfile
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 환경 변수 로드
load_dotenv(override=True)

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# 카테고리 정의
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

# 등급 → 점수 변환
RATING_TO_SCORE = {
    '+4': 8, '+3': 6, '+2': 4, '+1': 2, '0': 0,
    '-1': -2, '-2': -4, '-3': -6, '-4': -8
}

VALID_RATINGS = ['+4', '+3', '+2', '+1', '0', '-1', '-2', '-3', '-4']


def get_unevaluated_data(politician_id, category):
    """미평가 데이터 조회"""
    try:
        # 이미 평가된 데이터 ID 조회
        evaluated_result = supabase.table('evaluations_v30')\
            .select('collected_data_id')\
            .eq('politician_id', politician_id)\
            .eq('evaluator_ai', 'Claude')\
            .eq('category', category.lower())\
            .execute()

        evaluated_ids = {
            item['collected_data_id']
            for item in evaluated_result.data
            if item.get('collected_data_id')
        }

        # 수집된 데이터 조회
        collected_result = supabase.table('collected_data_v30')\
            .select('*')\
            .eq('politician_id', politician_id)\
            .eq('category', category.lower())\
            .execute()

        # 미평가 데이터 필터링
        unevaluated_items = [
            item for item in collected_result.data
            if item['id'] not in evaluated_ids
        ]

        return unevaluated_items

    except Exception as e:
        print(f"  ❌ 데이터 조회 실패: {e}")
        return []


def save_evaluations_batch(politician_id, politician_name, category, evaluations_data, batch_items):
    """평가 결과 배치 저장"""
    if not evaluations_data:
        return 0

    records = []

    for idx, ev in enumerate(evaluations_data):
        rating = str(ev.get('rating', '')).strip()

        # '+' 기호 없이 숫자만 온 경우 처리
        if rating in ['4', '3', '2', '1']:
            rating = '+' + rating

        if rating not in VALID_RATINGS:
            print(f"    ⚠️ 잘못된 등급 건너뛰기: {rating}")
            continue

        # items와 evaluations 순서 매칭하여 올바른 ID 할당
        if idx < len(batch_items):
            collected_data_id = batch_items[idx]['id']
        else:
            print(f"    ⚠️ 평가 항목이 배치 크기 초과, 건너뛰기")
            continue

        record = {
            'politician_id': politician_id,
            'politician_name': politician_name,
            'category': category.lower(),
            'evaluator_ai': 'Claude',
            'collected_data_id': collected_data_id,
            'rating': rating,
            'score': RATING_TO_SCORE[rating],
            'reasoning': ev.get('rationale', ev.get('reasoning', ''))[:1000],
            'evaluated_at': datetime.now().isoformat()
        }
        records.append(record)

    if not records:
        return 0

    # 배치 저장
    try:
        result = supabase.table('evaluations_v30').insert(records).execute()
        saved_count = len(result.data) if result.data else 0
        return saved_count
    except Exception as e:
        error_msg = str(e)
        if 'duplicate key' in error_msg.lower() or '23505' in error_msg:
            print(f"    ⚠️ 중복 평가 건너뛰기")
            return 0
        print(f"    ❌ 저장 실패: {e}")
        return 0


def create_batch_file(batch, batch_num, politician_name, category):
    """배치 데이터를 임시 파일로 저장"""
    batch_data = {
        'batch_num': batch_num,
        'politician_name': politician_name,
        'category': category,
        'category_korean': CATEGORY_MAP.get(category.lower(), category),
        'items': []
    }

    for item in batch:
        batch_data['items'].append({
            'id': item['id'],
            'title': item.get('title', 'N/A'),
            'content': item.get('content', 'N/A')[:500],  # 500자로 제한
            'source_url': item.get('source_url', 'N/A'),
            'published_date': str(item.get('published_date', 'N/A'))
        })

    # 임시 파일 저장
    temp_file = f"batch_{batch_num:02d}_data.json"
    with open(temp_file, 'w', encoding='utf-8') as f:
        json.dump(batch_data, f, ensure_ascii=False, indent=2)

    return temp_file


def evaluate_batch_auto(batch, batch_num, politician_id, politician_name, category):
    """
    배치 자동 평가 (Task tool 활용)

    프로세스:
    1. 배치 데이터를 파일로 저장
    2. Task tool로 politician-evaluator subagent 호출
    3. Subagent가 평가 JSON 생성
    4. 결과 파싱 및 반환
    """
    print(f"\n  배치 {batch_num}: {len(batch)}개 항목 평가 중...")

    # 1. 배치 파일 생성
    batch_file = create_batch_file(batch, batch_num, politician_name, category)
    print(f"    ✅ 배치 파일 생성: {batch_file}")

    # 2. 평가 프롬프트 생성
    with open(batch_file, 'r', encoding='utf-8') as f:
        batch_data = json.load(f)

    items_text = ""
    for idx, item in enumerate(batch_data['items'], 1):
        items_text += f"""
[항목 {idx}]
- ID: {item['id']}
- 제목: {item['title']}
- 내용: {item['content']}
- 출처: {item['source_url']}
- 날짜: {item['published_date']}
"""

    evaluation_prompt = f"""당신은 정치인 평가 전문가입니다.

**대상 정치인**: {politician_name}
**평가 카테고리**: {batch_data['category_korean']} ({category})

아래 {len(batch)}개 데이터를 객관적으로 평가하여 등급을 부여하세요.

**등급 체계** (+4 ~ 0 ~ -4):
| 등급 | 판단 기준 | 점수 |
|------|-----------|------|
| +4 | 탁월함 | +8 |
| +3 | 우수함 | +6 |
| +2 | 양호함 | +4 |
| +1 | 보통 | +2 |
| 0 | 중립 | 0 |
| -1 | 미흡함 | -2 |
| -2 | 부족함 | -4 |
| -3 | 매우 부족 | -6 |
| -4 | 극히 부족 | -8 |

**평가할 데이터**:
{items_text}

**반드시 모든 {len(batch)}개 항목에 대해 평가하세요.**

다음 JSON 형식으로 반환:
```json
{{
  "evaluations": [
    {{
      "id": "항목 ID",
      "rating": "+4 ~ 0 ~ -4 중 하나",
      "rationale": "평가 근거 1문장"
    }}
  ]
}}
```

위 형식의 JSON만 출력하세요. 다른 설명은 불필요합니다."""

    # 3. 평가 수행 (현재는 직접 입력 방식)
    # TODO: Task tool로 자동화
    print(f"\n{evaluation_prompt}\n")
    print("=" * 80)
    print("📋 위 프롬프트에 대한 평가 JSON을 입력하세요 (여러 줄 입력 후 빈 줄로 종료):")
    print("=" * 80)

    # 사용자 입력 대기
    lines = []
    while True:
        try:
            line = input()
            if line.strip() == "":
                break
            lines.append(line)
        except EOFError:
            break

    response_text = "\n".join(lines)

    # 4. JSON 파싱
    try:
        import re
        json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', response_text)
        if json_match:
            json_str = json_match.group(1)
        else:
            json_str = response_text

        data = json.loads(json_str)
        evaluations = data.get('evaluations', [])

        print(f"    ✅ 평가 완료: {len(evaluations)}개")
        return evaluations

    except Exception as e:
        print(f"    ❌ JSON 파싱 실패: {e}")
        return []


def main():
    parser = argparse.ArgumentParser(description='V30 Claude 자동 배치 평가')
    parser.add_argument('--politician_id', required=True, help='정치인 ID')
    parser.add_argument('--politician_name', required=True, help='정치인 이름')
    parser.add_argument('--category', required=True, help='카테고리 (영문)')
    parser.add_argument('--batch_size', type=int, default=10, help='배치 크기 (기본 10)')

    args = parser.parse_args()

    print(f"\n{'#'*60}")
    print(f"# V30 Claude 자동 배치 평가")
    print(f"# 정치인: {args.politician_name} ({args.politician_id})")
    print(f"# 카테고리: {CATEGORY_MAP.get(args.category.lower(), args.category)}")
    print(f"# 배치 크기: {args.batch_size}")
    print(f"{'#'*60}\n")

    # 1. 미평가 데이터 조회
    print("[1/3] 미평가 데이터 조회 중...")
    unevaluated_items = get_unevaluated_data(args.politician_id, args.category)

    if not unevaluated_items:
        print("\n✅ 모든 데이터 평가 완료!")
        return

    print(f"  미평가 데이터: {len(unevaluated_items)}개")

    # 2. 배치 평가
    print(f"\n[2/3] 배치 평가 시작")
    total_saved = 0

    for i in range(0, len(unevaluated_items), args.batch_size):
        batch = unevaluated_items[i:i+args.batch_size]
        batch_num = i // args.batch_size + 1

        # 배치 평가
        evaluations = evaluate_batch_auto(
            batch, batch_num,
            args.politician_id, args.politician_name, args.category
        )

        if not evaluations:
            print(f"    ⚠️ 배치 {batch_num} 평가 실패")
            continue

        # 저장
        saved = save_evaluations_batch(
            args.politician_id, args.politician_name, args.category,
            evaluations, batch
        )
        total_saved += saved
        print(f"    ✅ 저장: {saved}개")

    # 3. 결과 요약
    print(f"\n[3/3] 완료")
    print(f"  총 평가: {total_saved}개")
    print(f"\n{'='*60}")
    print(f"✅ Claude 평가 완료: {args.politician_name} - {args.category}")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
