# -*- coding: utf-8 -*-
"""
V30 Claude 진짜 AI 평가 (Task tool 방식)

핵심:
- Task tool로 general-purpose agent 호출
- 진짜 AI가 내용 읽고 평가
- 배치당 10개씩 처리
- API 비용 $0 (Claude Code Subscription)

사용법:
    python evaluate_claude_real_ai.py --politician_id=d0a5d6e1 --politician_name="조은희" --category=expertise
"""

import os
import sys
import json
import argparse
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

# 등급 → 점수 변환 (8단계)
RATING_TO_SCORE = {
    '+4': 8, '+3': 6, '+2': 4, '+1': 2,
    '-1': -2, '-2': -4, '-3': -6, '-4': -8
}

VALID_RATINGS = ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4']


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


def create_evaluation_prompt(items, politician_name, category_korean):
    """평가 프롬프트 생성"""

    prompt = f"""다음 {len(items)}개의 데이터를 {category_korean} 기준으로 평가해주세요.

정치인: {politician_name}
카테고리: {category_korean}

평가 기준 (8단계):
- +4 (8점): 최우수 - 법안 제정, 전국적 인정, 대통령 표창
- +3 (6점): 우수 - 계량 가능한 정책 성과 (다수 법안 통과, 우수의원 선정)
- +2 (4점): 양호 - 일반적 긍정 활동 (법안 발의, 정책 제안)
- +1 (2점): 약간 긍정 - 노력, 참석, 기본 역량 (기본값)
- -1 (-2점): 약간 부정 - 비판, 지적
- -2 (-4점): 부정 - 논란, 의혹 제기
- -3 (-6점): 심각한 부정 - 조사 시작, 문제 제기
- -4 (-8점): 최악 - 위반 확정, 법적 처벌

평가할 데이터:

"""

    for i, item in enumerate(items, 1):
        prompt += f"""[{i}] ID: {item['id']}
제목: {item['title']}
내용: {item['content']}
타입: {item['data_type']}

"""

    prompt += """각 데이터에 대해 다음 형식의 JSON으로 응답해주세요:

```json
[
  {
    "id": "...",
    "rating": "+2",
    "score": 4,
    "rationale": "간결한 평가 이유"
  },
  ...
]
```

중요:
- 반드시 JSON 형식으로만 응답
- 8단계 등급만 사용 (+4, +3, +2, +1, -1, -2, -3, -4)
- rationale은 한 줄로 간결하게
- 내용을 정확히 읽고 맥락을 고려하여 평가"""

    return prompt


def save_evaluations_batch(politician_id, politician_name, category, evaluations_data):
    """평가 결과 배치 저장"""
    if not evaluations_data:
        return 0

    records = []

    for ev in evaluations_data:
        rating = str(ev.get('rating', '')).strip()

        # '+' 기호 없이 숫자만 온 경우 처리
        if rating in ['4', '3', '2', '1']:
            rating = '+' + rating

        if rating not in VALID_RATINGS:
            print(f"    ⚠️ 잘못된 등급 건너뛰기: {rating}")
            continue

        record = {
            'politician_id': politician_id,
            'politician_name': politician_name,
            'category': category.lower(),
            'evaluator_ai': 'Claude',
            'collected_data_id': ev['id'],
            'rating': rating,
            'score': RATING_TO_SCORE[rating],
            'rationale': ev.get('rationale', ''),
            'evaluated_at': datetime.utcnow().isoformat()
        }

        records.append(record)

    if records:
        try:
            result = supabase.table('evaluations_v30').insert(records).execute()
            return len(result.data)
        except Exception as e:
            print(f"    ❌ 저장 실패: {e}")
            return 0

    return 0


def evaluate_category(politician_id, politician_name, category, batch_size=10):
    """카테고리 평가 (Task tool 방식)"""

    category_korean = CATEGORY_MAP.get(category, category)

    print(f"\n{'#'*60}")
    print(f"# V30 Claude 진짜 AI 평가 (Task tool)")
    print(f"# 정치인: {politician_name} ({politician_id})")
    print(f"# 카테고리: {category_korean}")
    print(f"# 배치 크기: {batch_size}")
    print(f"{'#'*60}")

    # 미평가 데이터 조회
    print(f"\n[1/3] 미평가 데이터 조회 중...")
    unevaluated_items = get_unevaluated_data(politician_id, category)

    if not unevaluated_items:
        print("  ℹ️ 평가할 데이터가 없습니다.")
        return

    print(f"  미평가 데이터: {len(unevaluated_items)}개")

    # 배치 처리
    print(f"\n[2/3] 배치 평가 시작 (Task tool 방식)")
    print(f"  ⚠️ 주의: Task tool 사용으로 시간이 소요됩니다.")
    print(f"  각 배치마다 AI가 직접 내용을 읽고 평가합니다.\n")

    total_batches = (len(unevaluated_items) + batch_size - 1) // batch_size
    total_evaluated = 0

    for batch_num in range(total_batches):
        start_idx = batch_num * batch_size
        end_idx = min((batch_num + 1) * batch_size, len(unevaluated_items))
        batch_items = unevaluated_items[start_idx:end_idx]

        print(f"  배치 {batch_num + 1}/{total_batches}: {len(batch_items)}개 항목 평가 중...")

        # 프롬프트 생성
        prompt = create_evaluation_prompt(batch_items, politician_name, category_korean)

        # 프롬프트 파일 저장 (디버깅용)
        prompt_file = f"prompt_batch_{batch_num + 1}.txt"
        with open(prompt_file, 'w', encoding='utf-8') as f:
            f.write(prompt)

        print(f"    - 프롬프트 저장: {prompt_file}")
        print(f"    - Task tool 호출 중... (AI가 평가 수행)")
        print(f"    ⏳ 잠시만 기다려주세요...")

        # 사용자에게 수동으로 Task tool 실행 요청
        print(f"\n    {'='*60}")
        print(f"    📋 다음 Task tool을 실행해주세요:")
        print(f"    {'='*60}")
        print(f"""
    Task tool 파라미터:
    - subagent_type: general-purpose
    - model: haiku
    - prompt: {prompt_file} 파일 내용

    결과를 result_batch_{batch_num + 1}.json 파일로 저장해주세요.
    """)
        print(f"    {'='*60}\n")

        input(f"    배치 {batch_num + 1} 평가 완료 후 Enter를 눌러주세요...")

        # 결과 파일 읽기
        result_file = f"result_batch_{batch_num + 1}.json"
        try:
            with open(result_file, 'r', encoding='utf-8') as f:
                evaluations = json.load(f)

            # DB 저장
            saved_count = save_evaluations_batch(
                politician_id, politician_name, category, evaluations
            )

            print(f"    ✅ 평가 및 저장: {saved_count}개\n")
            total_evaluated += saved_count

        except FileNotFoundError:
            print(f"    ❌ 결과 파일 없음: {result_file}")
            print(f"    배치 {batch_num + 1} 건너뜀\n")
        except Exception as e:
            print(f"    ❌ 오류 발생: {e}\n")

    print(f"\n[3/3] 완료")
    print(f"  총 평가: {total_evaluated}개")
    print(f"\n{'='*60}")
    print(f"✅ Claude 진짜 AI 평가 완료: {politician_name} - {category_korean}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='V30 Claude 진짜 AI 평가')
    parser.add_argument('--politician_id', required=True, help='정치인 ID')
    parser.add_argument('--politician_name', required=True, help='정치인 이름')
    parser.add_argument('--category', required=True, help='평가 카테고리')
    parser.add_argument('--batch_size', type=int, default=10, help='배치 크기 (기본: 10)')

    args = parser.parse_args()

    evaluate_category(
        args.politician_id,
        args.politician_name,
        args.category,
        args.batch_size
    )
