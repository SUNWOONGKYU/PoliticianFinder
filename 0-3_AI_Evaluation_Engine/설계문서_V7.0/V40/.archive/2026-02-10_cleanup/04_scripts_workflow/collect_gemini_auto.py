#!/usr/bin/env python3
"""
Gemini CLI 자동 수집 스크립트 (병렬 처리)
==========================================

최적화:
- 10개 카테고리 병렬 실행 (ProcessPoolExecutor)
- Gemini CLI headless mode: gemini -p "prompt" --yolo
- 목표 시간: 3-5분

사용법:
    python collect_gemini_auto.py --politician-id 8c5dcc89 --politician-name "박주민"
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from datetime import datetime, timedelta
from concurrent.futures import ProcessPoolExecutor, as_completed
from typing import Dict, List, Tuple

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent.parent
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

# 수집 목표 (V40 기본방침)
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


def create_collection_prompt(politician_name: str, category: str,
                            data_type: str, sentiment: str,
                            count: int) -> str:
    """수집 프롬프트 생성"""

    category_ko = CATEGORY_NAMES_KO[category]

    # 데이터 타입별 설명
    if data_type == 'official':
        type_desc = """**OFFICIAL (공식 활동)**:
- 법안 발의/공동발의
- 국회 본회의 발언
- 상임위/특위 질의/발언
- 정부 질의
- 공식 성명/논평
- 예산안 관련 활동
- 출처: 국회 공식 시스템 (국회의안정보시스템, 국회의사록, 의원실 공식 보도자료)
- 기간: 최근 4년"""
    else:  # public
        type_desc = """**PUBLIC (공적 활동)**:
- 언론 인터뷰/기고
- SNS 공개 게시물
- 공개 토론회/세미나 발언
- 정당 공식 입장/발표
- 출처: 언론사, 정당 공식 채널, 본인 SNS
- 기간: 최근 2년"""

    # 센티멘트별 설명
    if sentiment == 'negative':
        sentiment_desc = "부정적 평가를 받을 가능성이 있는 내용"
        sentiment_examples = "예: 논란, 비판, 실책, 공약 미이행, 부적절한 발언"
    elif sentiment == 'positive':
        sentiment_desc = "긍정적 평가를 받을 가능성이 있는 내용"
        sentiment_examples = "예: 성과, 공헌, 모범 사례, 칭찬, 수상"
    else:  # free
        sentiment_desc = "평가 방향이 중립적이거나 혼합된 내용"
        sentiment_examples = "예: 단순 활동 보고, 일상적 의정 활동, 중립적 사실"

    prompt = f"""**정치인**: {politician_name}
**카테고리**: {category_ko} ({category})

{type_desc}

**센티멘트**: {sentiment}
- {sentiment_desc}
- {sentiment_examples}

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


def run_gemini_cli(prompt: str, timeout: int = 180) -> Dict:
    """Gemini CLI 실행 (headless mode)"""

    try:
        cmd = ['gemini', '-p', prompt, '--yolo']

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout
        )

        if result.returncode != 0:
            return {
                'success': False,
                'error': f"Gemini CLI failed: {result.stderr}"
            }

        # JSON 파싱
        output = result.stdout.strip()

        # JSON 블록 추출 (```json ... ``` 제거)
        if '```json' in output:
            start = output.find('```json') + 7
            end = output.find('```', start)
            output = output[start:end].strip()
        elif '```' in output:
            start = output.find('```') + 3
            end = output.find('```', start)
            output = output[start:end].strip()

        data = json.loads(output)

        return {
            'success': True,
            'data': data
        }

    except subprocess.TimeoutExpired:
        return {
            'success': False,
            'error': f"Gemini CLI timeout ({timeout}s)"
        }
    except json.JSONDecodeError as e:
        return {
            'success': False,
            'error': f"JSON parse error: {e}",
            'raw_output': result.stdout
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def save_to_database(politician_id: str, politician_name: str,
                    category: str, data: List[Dict]) -> int:
    """수집 데이터를 DB에 저장"""

    if not data:
        return 0

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    saved_count = 0

    for item in data:
        try:
            # collected_data_v40 테이블에 저장
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
                'collection_source': 'gemini_cli',
                'collected_at': datetime.now().isoformat()
            }

            result = supabase.table('collected_data_v40').insert(insert_data).execute()

            if result.data:
                saved_count += 1

        except Exception as e:
            print(f"⚠️  DB 저장 실패: {e}")
            continue

    return saved_count


def collect_single_category(politician_id: str, politician_name: str,
                           category: str) -> Dict:
    """단일 카테고리 수집 (OFFICIAL + PUBLIC)"""

    print(f"🔍 [{category}] 수집 시작...")

    total_collected = 0
    errors = []

    # OFFICIAL 수집
    for sentiment in ['negative', 'positive', 'free']:
        count = GEMINI_TARGETS['official'][sentiment]

        prompt = create_collection_prompt(
            politician_name, category, 'official', sentiment, count
        )

        result = run_gemini_cli(prompt)

        if result['success']:
            saved = save_to_database(
                politician_id, politician_name, category, result['data']
            )
            total_collected += saved
            print(f"  ✅ OFFICIAL/{sentiment}: {saved}개")
        else:
            error_msg = f"OFFICIAL/{sentiment}: {result['error']}"
            errors.append(error_msg)
            print(f"  ❌ {error_msg}")

    # PUBLIC 수집
    for sentiment in ['negative', 'positive', 'free']:
        count = GEMINI_TARGETS['public'][sentiment]

        prompt = create_collection_prompt(
            politician_name, category, 'public', sentiment, count
        )

        result = run_gemini_cli(prompt)

        if result['success']:
            saved = save_to_database(
                politician_id, politician_name, category, result['data']
            )
            total_collected += saved
            print(f"  ✅ PUBLIC/{sentiment}: {saved}개")
        else:
            error_msg = f"PUBLIC/{sentiment}: {result['error']}"
            errors.append(error_msg)
            print(f"  ❌ {error_msg}")

    return {
        'category': category,
        'collected': total_collected,
        'errors': errors
    }


def collect_gemini_parallel(politician_id: str, politician_name: str,
                           max_workers: int = 10) -> Dict:
    """10개 카테고리 병렬 수집"""

    print(f"\n{'='*60}")
    print(f"🚀 Gemini CLI 병렬 수집 시작 - {politician_name}")
    print(f"   병렬 작업 수: {max_workers}")
    print(f"{'='*60}\n")

    start_time = datetime.now()
    results = {}

    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        futures = {}

        # 10개 카테고리 동시 실행
        for category in CATEGORIES:
            future = executor.submit(
                collect_single_category,
                politician_id,
                politician_name,
                category
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
                    'collected': 0,
                    'errors': [str(e)]
                }

    # 결과 요약
    elapsed = (datetime.now() - start_time).total_seconds()
    total_collected = sum(r.get('collected', 0) for r in results.values())
    total_errors = sum(len(r.get('errors', [])) for r in results.values())

    print(f"\n{'='*60}")
    print(f"✅ 수집 완료 - {elapsed:.1f}초 소요")
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

    parser = argparse.ArgumentParser(description='Gemini CLI 자동 수집')
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
        print(f"\n✅ 성공: {result['total_collected']}개 수집")
        sys.exit(0)
    else:
        print(f"\n❌ 실패: {result['total_errors']}개 오류")
        sys.exit(1)


if __name__ == '__main__':
    main()
