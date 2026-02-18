#!/usr/bin/env python3
"""
Gemini MCP Production Client - 데이터 수집
==========================================

[PRODUCTION-READY] Gemini CLI MCP 클라이언트 (고속도로 방식!)

Perplexity MCP 사용 원리와 동일:
    Claude Code → MCP 프로토콜 → Gemini MCP Server → Gemini CLI

비용 구조:
    - Gemini CLI 사용 = 무료/저렴 [OK]
    - Gemini API 사용 = 비싼 요금 [ERROR]

사용법:
    python collect_gemini_mcp_production.py --politician-id 507226bb --politician-name "박주민"
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime
from concurrent.futures import ProcessPoolExecutor, as_completed
from typing import Dict, List

# MCP 클라이언트 import
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

# 카테고리별 한글 이름
CATEGORY_NAMES_KO = {
    'expertise': '전문성',
    'leadership': '리더십',
    'vision': '비전',
    'integrity': '청렴성',
    'ethics': '윤리성',
    'accountability': '책임성',
    'transparency': '투명성',
    'communication': '소통',
    'responsiveness': '대응성',
    'publicinterest': '공익성'
}

# 수집 목표
GEMINI_TARGETS = {
    'official': {
        'total': 30,
        'buffer': 36,
        'negative': 3,
        'positive': 3,
        'free': 24
    },
    'public': {
        'total': 20,
        'buffer': 24,
        'negative': 4,
        'positive': 4,
        'free': 12
    }
}


async def call_gemini_mcp(prompt: str, timeout: int = 180) -> Dict:
    """
    [OK] MCP를 통해 Gemini CLI 호출 (고속도로 방식!)

    Perplexity MCP 사용 방식과 동일:
        1. MCP 서버 연결
        2. gemini_generate_json 도구 호출
        3. 결과 반환

    Args:
        prompt: 프롬프트
        timeout: 타임아웃 (초)

    Returns:
        {
            "success": bool,
            "data": Any or None,
            "raw_output": str or None,
            "error": str or None
        }
    """
    # MCP 서버 파라미터 (STDIO 모드)
    server_params = StdioServerParameters(
        command="python",
        args=[str(MCP_DIR / "gemini_mcp_server_production.py")]
    )

    # MCP 서버 연결 (Perplexity와 동일한 패턴)
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            # 세션 초기화
            await session.initialize()

            # gemini_generate_json 도구 호출
            result = await session.call_tool(
                "gemini_generate_json",
                arguments={"prompt": prompt, "timeout": timeout}
            )

            # 결과 파싱
            if result.content:
                response_text = result.content[0].text
                try:
                    return json.loads(response_text)
                except json.JSONDecodeError:
                    return {"success": False, "error": "Invalid JSON response"}
            else:
                return {"success": False, "error": "Empty response"}


def create_collection_prompt(politician_name: str, category: str,
                            data_type: str, sentiment: str,
                            count: int) -> str:
    """수집 프롬프트 생성"""

    category_ko = CATEGORY_NAMES_KO[category]

    if data_type == 'official':
        type_desc = """**OFFICIAL (공식 활동)**:
- 법안 발의/공동발의
- 국회 본회의 발언
- 상임위/특위 질의/발언
- 정부 질의
- 공식 성명/논평
- 예산안 관련 활동
- 출처: 국회 공식 시스템
- 기간: 최근 4년"""
    else:
        type_desc = """**PUBLIC (공적 활동)**:
- 언론 인터뷰/기고
- SNS 공개 게시물
- 공개 토론회/세미나 발언
- 정당 공식 입장/발표
- 출처: 언론사, 정당 공식 채널, SNS
- 기간: 최근 2년"""

    if sentiment == 'negative':
        sentiment_desc = "부정적 평가를 받을 가능성이 있는 내용"
    elif sentiment == 'positive':
        sentiment_desc = "긍정적 평가를 받을 가능성이 있는 내용"
    else:
        sentiment_desc = "평가 방향이 중립적이거나 혼합된 내용"

    prompt = f"""**정치인**: {politician_name}
**카테고리**: {category_ko} ({category})

{type_desc}

**센티멘트**: {sentiment}
- {sentiment_desc}

**수집 요청**: {count}개

**출력 형식** (JSON):
```json
[
  {{
    "title": "활동/사건 제목",
    "date": "YYYY-MM-DD",
    "url": "출처 URL (필수)",
    "summary": "활동 내용 요약 (100-200자)",
    "category": "{category}",
    "data_type": "{data_type}",
    "sentiment": "{sentiment}"
  }}
]
```

**중요**:
1. URL은 반드시 실제 존재하는 링크
2. 날짜는 반드시 YYYY-MM-DD 형식
3. 중복 없이 {count}개 정확히 수집
4. 반드시 JSON 배열로 출력
"""

    return prompt


def save_to_database(politician_id: str, politician_name: str,
                    category: str, data: List[Dict]) -> int:
    """수집 데이터를 DB에 저장"""

    if not data:
        return 0

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    saved_count = 0

    for item in data:
        try:
            insert_data = {
                'politician_id': politician_id,
                'politician_name': politician_name,
                'category': category,
                'data_type': item['data_type'],
                'sentiment': item['sentiment'],
                'title': item['title'],
                'date': item['date'],
                'url': item['url'],
                'summary': item['summary'],
                'collection_source': 'gemini_mcp',
                'collected_at': datetime.now().isoformat()
            }

            result = supabase.table('collected_data_v40').insert(insert_data).execute()

            if result.data:
                saved_count += 1

        except Exception as e:
            print(f"[WARN] DB 저장 실패: {e}")
            continue

    return saved_count


def collect_single_category(politician_id: str, politician_name: str,
                           category: str) -> Dict:
    """단일 카테고리 수집 (OFFICIAL + PUBLIC)"""

    import asyncio

    print(f"[COLLECT] [{category}] 수집 시작...")

    total_collected = 0
    errors = []

    # OFFICIAL 수집
    for sentiment in ['negative', 'positive', 'free']:
        count = GEMINI_TARGETS['official'][sentiment]

        prompt = create_collection_prompt(
            politician_name, category, 'official', sentiment, count
        )

        try:
            # MCP를 통해 Gemini CLI 호출 (고속도로!)
            result = asyncio.run(call_gemini_mcp(prompt))

            if result.get('success'):
                data = result.get('data', [])
                if isinstance(data, list):
                    saved = save_to_database(politician_id, politician_name, category, data)
                    total_collected += saved
                    print(f"  [OK] OFFICIAL/{sentiment}: {saved}개")
                else:
                    error_msg = f"OFFICIAL/{sentiment}: Invalid data format"
                    errors.append(error_msg)
                    print(f"  [ERROR] {error_msg}")
            else:
                error_msg = f"OFFICIAL/{sentiment}: {result.get('error', 'Unknown')}"
                errors.append(error_msg)
                print(f"  [ERROR] {error_msg}")

        except Exception as e:
            error_msg = f"OFFICIAL/{sentiment}: {str(e)}"
            errors.append(error_msg)
            print(f"  [ERROR] {error_msg}")

    # PUBLIC 수집
    for sentiment in ['negative', 'positive', 'free']:
        count = GEMINI_TARGETS['public'][sentiment]

        prompt = create_collection_prompt(
            politician_name, category, 'public', sentiment, count
        )

        try:
            # MCP를 통해 Gemini CLI 호출 (고속도로!)
            result = asyncio.run(call_gemini_mcp(prompt))

            if result.get('success'):
                data = result.get('data', [])
                if isinstance(data, list):
                    saved = save_to_database(politician_id, politician_name, category, data)
                    total_collected += saved
                    print(f"  [OK] PUBLIC/{sentiment}: {saved}개")
                else:
                    error_msg = f"PUBLIC/{sentiment}: Invalid data format"
                    errors.append(error_msg)
                    print(f"  [ERROR] {error_msg}")
            else:
                error_msg = f"PUBLIC/{sentiment}: {result.get('error', 'Unknown')}"
                errors.append(error_msg)
                print(f"  [ERROR] {error_msg}")

        except Exception as e:
            error_msg = f"PUBLIC/{sentiment}: {str(e)}"
            errors.append(error_msg)
            print(f"  [ERROR] {error_msg}")

    return {
        'category': category,
        'collected': total_collected,
        'errors': errors
    }


def collect_gemini_parallel(politician_id: str, politician_name: str,
                           max_workers: int = 10) -> Dict:
    """10개 카테고리 병렬 수집"""

    print(f"\n{'='*60}")
    print(f"[Gemini MCP] Parallel Collection Started - {politician_name}")
    print(f"   Workers: {max_workers}")
    print(f"{'='*60}\n")

    start_time = datetime.now()
    results = {}

    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        futures = {}

        for category in CATEGORIES:
            future = executor.submit(
                collect_single_category,
                politician_id,
                politician_name,
                category
            )
            futures[future] = category

        for future in as_completed(futures):
            category = futures[future]
            try:
                result = future.result(timeout=600)
                results[category] = result

            except Exception as e:
                print(f"[ERROR] [{category}] 오류: {e}")
                results[category] = {
                    'category': category,
                    'collected': 0,
                    'errors': [str(e)]
                }

    elapsed = (datetime.now() - start_time).total_seconds()
    total_collected = sum(r.get('collected', 0) for r in results.values())
    total_errors = sum(len(r.get('errors', [])) for r in results.values())

    print(f"\n{'='*60}")
    print(f"[OK] 수집 완료 - {elapsed:.1f}초 소요")
    print(f"   총 수집: {total_collected}개")
    print(f"   총 오류: {total_errors}개")
    print(f"{'='*60}\n")

    return {
        'success': total_collected > 0,
        'total_collected': total_collected,
        'total_errors': total_errors,
        'elapsed_seconds': elapsed,
        'results': results
    }


def main():
    """메인 실행 함수"""
    import argparse

    parser = argparse.ArgumentParser(description='Gemini MCP Production - 자동 수집')
    parser.add_argument('--politician-id', required=True, help='정치인 ID')
    parser.add_argument('--politician-name', required=True, help='정치인 이름')
    parser.add_argument('--workers', type=int, default=10, help='병렬 작업 수')

    args = parser.parse_args()

    result = collect_gemini_parallel(
        args.politician_id,
        args.politician_name,
        args.workers
    )

    if result['success']:
        print(f"\n[OK] 성공: {result['total_collected']}개 수집")
        sys.exit(0)
    else:
        print(f"\n[ERROR] 실패: {result['total_errors']}개 오류")
        sys.exit(1)


if __name__ == '__main__':
    main()
