#!/usr/bin/env python3
"""
Gemini MCP 클라이언트 - AI 평가
=================================

✅ Gemini CLI를 MCP를 통해 사용 (비용 절감!)

동작 방식:
    1. 이 스크립트 (클라이언트)
       ↓ MCP 프로토콜 (JSON-RPC)
    2. Gemini MCP 서버 (gemini_mcp_server.py)
       ↓ subprocess.run(['gemini', ...])
    3. ✅ Gemini CLI 실행 (비용 절감!)

비용 구조:
    - Gemini CLI 사용 = 무료/저렴 ✅
    - Gemini API 사용 = 비싼 요금 ❌

사용법:
    python evaluate_gemini_mcp.py --politician-id 8c5dcc89 --politician-name "박주민"
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime
from concurrent.futures import ProcessPoolExecutor, as_completed
from typing import Dict, List
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent.parent
MCP_DIR = V40_DIR / "scripts" / "mcp"
sys.path.insert(0, str(V40_DIR / "scripts" / "core"))

from supabase import create_client

# 환경 변수
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

# 10개 카테고리
CATEGORIES = [
    'expertise', 'leadership', 'vision', 'integrity', 'ethics',
    'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'
]

# 카테고리 정의
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


def create_evaluation_prompt(category: str, politician_name: str,
                            batch: List[Dict]) -> str:
    """평가 프롬프트 생성"""

    definition = CATEGORY_DEFINITIONS[category]

    batch_data = []
    for item in batch:
        batch_data.append({
            'id': item['id'],
            'title': item['title'],
            'date': item['date'],
            'summary': item['summary']
        })

    prompt = f"""당신은 정치인 평가 전문 AI입니다.

**평가 대상**: {politician_name}
**평가 카테고리**: {category}

{definition}

**평가 기준**:
- +4: 매우 우수
- +3: 우수
- +2: 양호
- +1: 보통
- -1: 미흡
- -2: 불량
- -3: 매우 불량
- -4: 극히 불량
- X: 평가 불가

다음 {len(batch)}개 항목을 평가해주세요.

**출력 형식** (JSON):
```json
[
  {{"id": "항목ID", "rating": "+4", "reason": "평가 근거"}},
  ...
]
```

**평가 대상**:
{json.dumps(batch_data, ensure_ascii=False, indent=2)}
"""

    return prompt


async def call_gemini_mcp(prompt: str) -> Dict:
    """MCP를 통해 Gemini CLI 호출"""

    server_params = StdioServerParameters(
        command="python",
        args=[str(MCP_DIR / "gemini_mcp_server.py")]
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            result = await session.call_tool(
                "gemini_generate_json",
                arguments={"prompt": prompt, "timeout": 180}
            )

            return result.content[0].text if result.content else {}


def fetch_unevaluated_data(politician_id: str, category: str,
                          batch_size: int = 25) -> List[Dict]:
    """미평가 데이터 조회"""

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    try:
        result = supabase.table('collected_data_v40') \
            .select('*') \
            .eq('politician_id', politician_id) \
            .eq('category', category) \
            .is_('evaluated_by_gemini', 'null') \
            .limit(batch_size) \
            .execute()

        return result.data if result.data else []

    except Exception as e:
        print(f"⚠️  DB 조회 실패: {e}")
        return []


def save_evaluations(politician_id: str, category: str,
                    evaluations: List[Dict]) -> int:
    """평가 결과 저장"""

    if not evaluations:
        return 0

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    saved_count = 0

    for eval_item in evaluations:
        try:
            data_id = eval_item['id']
            rating = eval_item['rating']
            reason = eval_item['reason']

            insert_data = {
                'politician_id': politician_id,
                'data_id': data_id,
                'category': category,
                'ai_name': 'gemini',
                'rating': rating,
                'reason': reason,
                'evaluated_at': datetime.now().isoformat()
            }

            result = supabase.table('evaluations_v40').insert(insert_data).execute()

            if result.data:
                supabase.table('collected_data_v40') \
                    .update({'evaluated_by_gemini': True}) \
                    .eq('id', data_id) \
                    .execute()

                saved_count += 1

        except Exception as e:
            print(f"⚠️  저장 실패: {e}")
            continue

    return saved_count


def evaluate_single_category(politician_id: str, politician_name: str,
                            category: str, batch_size: int = 25) -> Dict:
    """단일 카테고리 Gemini 평가"""

    import asyncio

    print(f"🤖 [{category}] Gemini 평가 시작...")

    total_evaluated = 0
    batch_num = 0

    while True:
        batch = fetch_unevaluated_data(politician_id, category, batch_size)

        if not batch:
            break

        batch_num += 1

        prompt = create_evaluation_prompt(category, politician_name, batch)

        try:
            result = asyncio.run(call_gemini_mcp(prompt))
            result_dict = json.loads(result) if isinstance(result, str) else result

            if result_dict.get('success'):
                evaluations = result_dict.get('data', [])
                saved = save_evaluations(politician_id, category, evaluations)
                total_evaluated += saved
                print(f"  ✅ Batch {batch_num}: {saved}/{len(batch)}개")
            else:
                print(f"  ❌ Batch {batch_num}: {result_dict.get('error', 'Unknown')}")

        except Exception as e:
            print(f"  ❌ Batch {batch_num}: {str(e)}")

        if len(batch) < batch_size:
            break

    return {
        'category': category,
        'evaluated': total_evaluated,
        'batches': batch_num
    }


def evaluate_gemini_parallel(politician_id: str, politician_name: str,
                            max_workers: int = 10,
                            batch_size: int = 25) -> Dict:
    """10개 카테고리 병렬 Gemini 평가"""

    print(f"\n{'='*60}")
    print(f"🤖 Gemini MCP 병렬 평가 시작 - {politician_name}")
    print(f"   병렬 작업 수: {max_workers}")
    print(f"   배치 크기: {batch_size}")
    print(f"{'='*60}\n")

    start_time = datetime.now()
    results = {}

    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        futures = {}

        for category in CATEGORIES:
            future = executor.submit(
                evaluate_single_category,
                politician_id,
                politician_name,
                category,
                batch_size
            )
            futures[future] = category

        for future in as_completed(futures):
            category = futures[future]
            try:
                result = future.result(timeout=600)
                results[category] = result
            except Exception as e:
                print(f"❌ [{category}] 오류: {e}")
                results[category] = {'category': category, 'evaluated': 0, 'batches': 0}

    elapsed = (datetime.now() - start_time).total_seconds()
    total_evaluated = sum(r.get('evaluated', 0) for r in results.values())

    print(f"\n{'='*60}")
    print(f"✅ Gemini 평가 완료 - {elapsed:.1f}초")
    print(f"   총 평가: {total_evaluated}개")
    print(f"{'='*60}\n")

    return {
        'success': total_evaluated > 0,
        'total_evaluated': total_evaluated,
        'elapsed_seconds': elapsed,
        'results': results
    }


def main():
    import argparse

    parser = argparse.ArgumentParser(description='Gemini MCP 자동 평가')
    parser.add_argument('--politician-id', required=True)
    parser.add_argument('--politician-name', required=True)
    parser.add_argument('--workers', type=int, default=10)
    parser.add_argument('--batch-size', type=int, default=25)

    args = parser.parse_args()

    result = evaluate_gemini_parallel(
        args.politician_id,
        args.politician_name,
        args.workers,
        args.batch_size
    )

    sys.exit(0 if result['success'] else 1)


if __name__ == '__main__':
    main()
