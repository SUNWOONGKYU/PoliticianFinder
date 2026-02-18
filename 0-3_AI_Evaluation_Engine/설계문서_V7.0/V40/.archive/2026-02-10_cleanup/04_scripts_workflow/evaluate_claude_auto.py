#!/usr/bin/env python3
"""
Claude API 자동 평가 스크립트 (프롬프트 캐싱 + 병렬 처리)
========================================================

최적화:
1. 프롬프트 캐싱: 90% 시간/비용 절감 (배치 2-4)
2. 배치 처리: 25개씩 묶어서 평가
3. 병렬 처리: 10개 카테고리 동시 실행

목표 시간: 2-3분 (4 AI 중 1개)

사용법:
    python evaluate_claude_auto.py --politician-id 8c5dcc89 --politician-name "박주민"
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime
from concurrent.futures import ProcessPoolExecutor, as_completed
from typing import Dict, List
import anthropic

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent.parent
sys.path.insert(0, str(V40_DIR / "scripts" / "core"))

from supabase import create_client

# 환경 변수
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')

# 10개 카테고리
CATEGORIES = [
    'expertise', 'leadership', 'vision', 'integrity', 'ethics',
    'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'
]

# 카테고리 정의 (프롬프트 캐싱용)
CATEGORY_DEFINITIONS = {
    'expertise': """전문성: 정치인의 정책 분야 전문 지식과 입법 능력""",
    'leadership': """리더십: 정치적 영향력과 당내외 주도력""",
    'vision': """비전: 미래를 향한 정책 비전과 장기 계획 수립 능력""",
    'integrity': """청렴성: 부패 방지와 공직자 윤리 준수""",
    'ethics': """윤리성: 도덕적 품성과 사회적 책임""",
    'accountability': """책임성: 공약 이행과 정치적 책임 의식""",
    'transparency': """투명성: 정보 공개와 의사결정 투명성""",
    'communication': """소통: 국민/지역구민과의 소통 능력""",
    'responsiveness': """대응성: 이슈에 대한 신속하고 적절한 대응""",
    'publicinterest': """공익성: 공공이익 우선과 사회적 가치 추구"""
}


def create_cached_system_prompt(category: str, politician_name: str) -> List[Dict]:
    """프롬프트 캐싱을 위한 시스템 프롬프트 생성"""

    definition = CATEGORY_DEFINITIONS[category]

    system_prompt = [
        {
            "type": "text",
            "text": f"""당신은 정치인 평가 전문 AI입니다.

**평가 대상**: {politician_name}
**평가 카테고리**: {category}

{definition}

**평가 기준**:
- +4: 매우 우수 (탁월한 성과, 모범 사례)
- +3: 우수 (명확한 긍정적 기여)
- +2: 양호 (긍정적이지만 제한적)
- +1: 보통 (약간 긍정적)
- -1: 미흡 (약간 부정적)
- -2: 불량 (명확한 문제점)
- -3: 매우 불량 (심각한 문제)
- -4: 극히 불량 (중대한 실책)
- X: 평가 불가 (정보 부족, 관련성 없음)

**평가 원칙**:
1. 객관적 사실에 기반
2. 카테고리 정의에 부합하는지 판단
3. 긍정/부정 요소를 모두 고려
4. 정보가 불충분하면 'X'

**출력 형식** (JSON):
```json
{
  "rating": "+4" | "+3" | "+2" | "+1" | "-1" | "-2" | "-3" | "-4" | "X",
  "reason": "평가 근거 (100자 이내)"
}
```
""",
            "cache_control": {"type": "ephemeral"}  # 프롬프트 캐싱!
        }
    ]

    return system_prompt


def fetch_unevaluated_data(politician_id: str, category: str,
                          batch_size: int = 25) -> List[Dict]:
    """미평가 데이터 조회 (배치 크기만큼)"""

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    try:
        # collected_data_v40에서 미평가 데이터 조회
        result = supabase.table('collected_data_v40') \
            .select('*') \
            .eq('politician_id', politician_id) \
            .eq('category', category) \
            .is_('evaluated_by_claude', 'null') \
            .limit(batch_size) \
            .execute()

        return result.data if result.data else []

    except Exception as e:
        print(f"⚠️  DB 조회 실패: {e}")
        return []


def evaluate_batch_with_claude(client: anthropic.Anthropic,
                               category: str, politician_name: str,
                               batch: List[Dict]) -> List[Dict]:
    """배치를 Claude API로 평가 (프롬프트 캐싱 적용)"""

    if not batch:
        return []

    # 시스템 프롬프트 (캐싱됨)
    system_prompt = create_cached_system_prompt(category, politician_name)

    # 사용자 메시지 (평가 대상 데이터)
    batch_data = []
    for item in batch:
        batch_data.append({
            'id': item['id'],
            'title': item['title'],
            'date': item['date'],
            'summary': item['summary'],
            'data_type': item['data_type'],
            'sentiment': item['sentiment']
        })

    user_message = f"""다음 {len(batch)}개 항목을 평가해주세요.

각 항목에 대해 JSON 형식으로 평가 결과를 반환하세요:

```json
[
  {{"id": "항목ID", "rating": "+4", "reason": "평가 근거"}},
  ...
]
```

**평가 대상**:
{json.dumps(batch_data, ensure_ascii=False, indent=2)}
"""

    try:
        response = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=4096,
            system=system_prompt,  # 프롬프트 캐싱됨!
            messages=[
                {"role": "user", "content": user_message}
            ]
        )

        # 응답 파싱
        content = response.content[0].text

        # JSON 추출
        if '```json' in content:
            start = content.find('```json') + 7
            end = content.find('```', start)
            content = content[start:end].strip()
        elif '```' in content:
            start = content.find('```') + 3
            end = content.find('```', start)
            content = content[start:end].strip()

        evaluations = json.loads(content)

        return evaluations

    except Exception as e:
        print(f"⚠️  Claude API 오류: {e}")
        return []


def save_evaluations(politician_id: str, category: str,
                    evaluations: List[Dict]) -> int:
    """평가 결과를 DB에 저장"""

    if not evaluations:
        return 0

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    saved_count = 0

    for eval_item in evaluations:
        try:
            data_id = eval_item['id']
            rating = eval_item['rating']
            reason = eval_item['reason']

            # evaluations_v40 테이블에 저장
            insert_data = {
                'politician_id': politician_id,
                'data_id': data_id,
                'category': category,
                'ai_name': 'claude',
                'rating': rating,
                'reason': reason,
                'evaluated_at': datetime.now().isoformat()
            }

            result = supabase.table('evaluations_v40').insert(insert_data).execute()

            if result.data:
                # collected_data_v40에 평가 완료 표시
                supabase.table('collected_data_v40') \
                    .update({'evaluated_by_claude': True}) \
                    .eq('id', data_id) \
                    .execute()

                saved_count += 1

        except Exception as e:
            print(f"⚠️  저장 실패 (ID: {eval_item.get('id')}): {e}")
            continue

    return saved_count


def evaluate_single_category(politician_id: str, politician_name: str,
                            category: str, batch_size: int = 25) -> Dict:
    """단일 카테고리 평가 (배치 처리 + 프롬프트 캐싱)"""

    print(f"🤖 [{category}] Claude 평가 시작...")

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    total_evaluated = 0
    batch_num = 0

    while True:
        # 미평가 데이터 조회
        batch = fetch_unevaluated_data(politician_id, category, batch_size)

        if not batch:
            break  # 더 이상 평가할 데이터 없음

        batch_num += 1

        # Claude API로 평가
        evaluations = evaluate_batch_with_claude(
            client, category, politician_name, batch
        )

        # DB에 저장
        saved = save_evaluations(politician_id, category, evaluations)
        total_evaluated += saved

        print(f"  ✅ Batch {batch_num}: {saved}/{len(batch)}개 평가 완료")

        # 배치가 가득 차지 않았으면 마지막 배치
        if len(batch) < batch_size:
            break

    return {
        'category': category,
        'evaluated': total_evaluated,
        'batches': batch_num
    }


def evaluate_claude_parallel(politician_id: str, politician_name: str,
                            max_workers: int = 10,
                            batch_size: int = 25) -> Dict:
    """10개 카테고리 병렬 Claude 평가"""

    print(f"\n{'='*60}")
    print(f"🤖 Claude API 병렬 평가 시작 - {politician_name}")
    print(f"   병렬 작업 수: {max_workers}")
    print(f"   배치 크기: {batch_size}")
    print(f"{'='*60}\n")

    start_time = datetime.now()
    results = {}

    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        futures = {}

        # 10개 카테고리 동시 실행
        for category in CATEGORIES:
            future = executor.submit(
                evaluate_single_category,
                politician_id,
                politician_name,
                category,
                batch_size
            )
            futures[future] = category

        # 결과 수집
        for future in as_completed(futures):
            category = futures[future]
            try:
                result = future.result(timeout=600)  # 10분 타임아웃
                results[category] = result

            except Exception as e:
                print(f"❌ [{category}] 오류 발생: {e}")
                results[category] = {
                    'category': category,
                    'evaluated': 0,
                    'batches': 0
                }

    # 결과 요약
    elapsed = (datetime.now() - start_time).total_seconds()
    total_evaluated = sum(r.get('evaluated', 0) for r in results.values())
    total_batches = sum(r.get('batches', 0) for r in results.values())

    print(f"\n{'='*60}")
    print(f"✅ Claude 평가 완료 - {elapsed:.1f}초 소요")
    print(f"   총 평가: {total_evaluated}개")
    print(f"   총 배치: {total_batches}개")
    print(f"{'='*60}\n")

    return {
        'success': total_evaluated > 0,
        'total_evaluated': total_evaluated,
        'total_batches': total_batches,
        'elapsed_seconds': elapsed,
        'results': results
    }


def main():
    """메인 실행 함수"""
    import argparse

    parser = argparse.ArgumentParser(description='Claude API 자동 평가')
    parser.add_argument('--politician-id', required=True, help='정치인 ID')
    parser.add_argument('--politician-name', required=True, help='정치인 이름')
    parser.add_argument('--workers', type=int, default=10, help='병렬 작업 수')
    parser.add_argument('--batch-size', type=int, default=25, help='배치 크기')

    args = parser.parse_args()

    result = evaluate_claude_parallel(
        args.politician_id,
        args.politician_name,
        args.workers,
        args.batch_size
    )

    if result['success']:
        print(f"\n✅ 성공: {result['total_evaluated']}개 평가")
        sys.exit(0)
    else:
        print(f"\n❌ 실패")
        sys.exit(1)


if __name__ == '__main__':
    main()
