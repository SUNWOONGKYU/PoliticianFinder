#!/usr/bin/env python3
"""
V40 Gemini CLI Parallel Collection (Direct Subprocess)
======================================================

공식 수집 방식: Gemini CLI Direct Subprocess (재미나 CLI 다이렉트 서브프로세스)

특징:
    - 10개 카테고리 병렬 수집
    - Python subprocess.run()으로 Gemini CLI 직접 실행
    - subprocess 방식

성능:
    - 단일 카테고리: 27초
    - 10개 병렬: 30-35초 (ProcessPoolExecutor 사용)

Usage:
    python collect_gemini_subprocess_parallel.py --politician "박주민"
    python collect_gemini_subprocess_parallel.py --politician "박주민" --period 4
"""

import os
import sys
import json
import logging
from pathlib import Path
from datetime import datetime
from concurrent.futures import ProcessPoolExecutor, as_completed
from typing import Dict, List

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent.parent
sys.path.insert(0, str(V40_DIR))

# Gemini CLI 인증 체크 유틸리티
from scripts.utils.gemini_auth_check import require_gemini_auth

# collect_gemini_subprocess에서 함수 import
from collect_gemini_subprocess import (
    execute_gemini_cli,
    parse_gemini_response,
    save_to_db,
    load_category_instruction
)

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='[%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

# 10개 카테고리
CATEGORIES = [
    'expertise',
    'leadership',
    'vision',
    'integrity',
    'ethics',
    'accountability',
    'transparency',
    'communication',
    'responsiveness',
    'publicinterest'
]


def collect_single_category(
    politician_name: str,
    category: str,
    period_years: int
) -> Dict:
    """
    단일 카테고리 수집 (ProcessPoolExecutor용)

    Args:
        politician_name: 정치인 이름
        category: 카테고리
        period_years: 수집 기간 (년)

    Returns:
        {
            "category": str,
            "success": bool,
            "events_collected": int,
            "error": str or None,
            "duration_seconds": float
        }
    """
    start_time = datetime.now()
    logger.info(f"[{category.upper()}] Starting collection...")

    try:
        # 카테고리별 instruction 로드 (Section 4: 평가 범위, Section 11: 검색 키워드)
        instruction = load_category_instruction(category)

        current_year = datetime.now().year
        official_start_year = current_year - 4  # OFFICIAL: 4년
        public_start_year = current_year - 2    # PUBLIC: 2년

        # 카테고리별 한글명
        category_kr_map = {
            'expertise': '전문성', 'leadership': '리더십', 'vision': '비전',
            'integrity': '청렴성', 'ethics': '윤리성', 'accountability': '책임감',
            'transparency': '투명성', 'communication': '소통능력',
            'responsiveness': '대응성', 'publicinterest': '공익성'
        }
        category_kr = category_kr_map.get(category, category)

        prompt = f"""
You are collecting data about Korean politician {politician_name} ({category_kr} category).

평가 범위 (10개 평가 항목):
{instruction['section_4']}

검색 키워드 (긍정/부정/자유):
{instruction['section_11']}

Task: Search Google and collect information about {politician_name}'s {category_kr} based on the above criteria.

Return results in JSON format:

{{
  "events": [
    {{
      "date": "YYYY-MM-DD",
      "title": "제목",
      "content": "내용 (200자 이내)",
      "url": "출처 URL",
      "sentiment": "negative/positive/free"
    }}
  ]
}}

Requirements:
1. OFFICIAL (.go.kr): 36 items (20% buffer), period: {official_start_year}-{current_year}
2. PUBLIC (news/blogs): 24 items (20% buffer), period: {public_start_year}-{current_year}
3. Total: 60 items minimum
4. Use REAL URLs with actual publish dates
5. Follow the search keywords and evaluation criteria above
6. Classify sentiment based on content (negative/positive/free)
"""

        # Gemini 3단계 Fallback 실행 (execute_gemini_cli에서 import)
        # Step 1: CLI gemini-2.5-flash → Step 2: CLI gemini-2.0-flash → Step 3: API fallback
        result = execute_gemini_cli(prompt, timeout=600, max_retries=2)

        if not result['success']:
            duration = (datetime.now() - start_time).total_seconds()
            logger.error(f"[{category.upper()}] Gemini CLI failed: {result['error']}")
            return {
                "category": category,
                "success": False,
                "events_collected": 0,
                "error": result['error'],
                "duration_seconds": duration
            }

        # 응답 파싱
        parsed = parse_gemini_response(result['output'])

        # DB 저장
        saved_count = save_to_db(politician_name, category, parsed.get('events', []))

        duration = (datetime.now() - start_time).total_seconds()
        logger.info(f"[{category.upper()}] Complete: {saved_count} events in {duration:.1f}s")

        return {
            "category": category,
            "success": True,
            "events_collected": saved_count,
            "error": None,
            "duration_seconds": duration
        }

    except Exception as e:
        duration = (datetime.now() - start_time).total_seconds()
        logger.exception(f"[{category.upper()}] Unexpected error: {e}")
        return {
            "category": category,
            "success": False,
            "events_collected": 0,
            "error": str(e),
            "duration_seconds": duration
        }


def collect_all_categories_parallel(
    politician_name: str,
    period_years: int = 2,
    max_workers: int = 5,
    batch_size: int = 5
) -> Dict:
    """
    10개 카테고리 배치 병렬 수집 (5개씩 2배치)

    Args:
        politician_name: 정치인 이름
        period_years: 수집 기간 (년)
        max_workers: 배치당 최대 워커 수 (기본값: 5)
        batch_size: 배치 크기 (기본값: 5)

    Returns:
        {
            "success": bool,
            "total_events": int,
            "results_by_category": {category: result},
            "total_duration_seconds": float,
            "errors": [str]
        }
    """
    logger.info(f"\n{'='*60}")
    logger.info(f"[BATCH PARALLEL] Starting batch parallel collection")
    logger.info(f"Politician: {politician_name}")
    logger.info(f"Period: {period_years} years")
    logger.info(f"Workers per batch: {max_workers}")
    logger.info(f"Batch size: {batch_size}")
    logger.info(f"Total batches: {len(CATEGORIES) // batch_size}")
    logger.info(f"{'='*60}\n")

    start_time = datetime.now()
    results_by_category = {}
    errors = []
    total_events = 0

    # 카테고리를 배치로 분할
    batches = [CATEGORIES[i:i+batch_size] for i in range(0, len(CATEGORIES), batch_size)]

    for batch_num, batch_categories in enumerate(batches, 1):
        logger.info(f"\n{'='*60}")
        logger.info(f"[BATCH {batch_num}/{len(batches)}] Starting batch")
        logger.info(f"Categories: {', '.join(batch_categories)}")
        logger.info(f"{'='*60}\n")

        batch_start = datetime.now()

        with ProcessPoolExecutor(max_workers=max_workers) as executor:
            # 배치 내 카테고리 작업 제출
            futures = {
                executor.submit(
                    collect_single_category,
                    politician_name,
                    category,
                    period_years
                ): category
                for category in batch_categories
            }

            # 완료되는 대로 결과 수집
            batch_completed = 0
            for future in as_completed(futures):
                category = futures[future]
                batch_completed += 1

                try:
                    result = future.result()
                    results_by_category[category] = result

                    if result['success']:
                        total_events += result['events_collected']
                        logger.info(
                            f"[Batch {batch_num} - {batch_completed}/{len(batch_categories)}] {category}: "
                            f"{result['events_collected']} events "
                            f"({result['duration_seconds']:.1f}s)"
                        )
                    else:
                        errors.append(f"{category}: {result['error']}")
                        logger.error(f"[Batch {batch_num} - {batch_completed}/{len(batch_categories)}] {category}: FAILED - {result['error']}")

                except Exception as e:
                    errors.append(f"{category}: {str(e)}")
                    logger.exception(f"[Batch {batch_num} - {batch_completed}/{len(batch_categories)}] {category}: EXCEPTION - {e}")

        batch_duration = (datetime.now() - batch_start).total_seconds()
        logger.info(f"\n[BATCH {batch_num}] Complete in {batch_duration:.1f}s\n")

        # 배치 간 대기 (API 할당량 리셋)
        if batch_num < len(batches):
            wait_seconds = 5
            logger.info(f"[WAIT] Waiting {wait_seconds}s before next batch (API quota reset)...")
            import time
            time.sleep(wait_seconds)

    total_duration = (datetime.now() - start_time).total_seconds()

    # 결과 요약
    logger.info(f"\n{'='*60}")
    logger.info(f"[SUMMARY] Parallel collection complete")
    logger.info(f"Total events: {total_events}")
    logger.info(f"Total duration: {total_duration:.1f}s")
    logger.info(f"Success: {len([r for r in results_by_category.values() if r['success']])}/10")
    logger.info(f"Failures: {len(errors)}")
    if errors:
        logger.error(f"Errors: {errors}")
    logger.info(f"{'='*60}\n")

    return {
        "success": len(errors) == 0,
        "total_events": total_events,
        "results_by_category": results_by_category,
        "total_duration_seconds": total_duration,
        "errors": errors
    }


def save_collection_report(
    politician_name: str,
    results: Dict,
    output_dir: Path
) -> Path:
    """
    수집 결과 보고서 저장

    Args:
        politician_name: 정치인 이름
        results: collect_all_categories_parallel() 결과
        output_dir: 출력 디렉토리

    Returns:
        저장된 파일 경로
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    report_file = output_dir / f'{politician_name}_collection_{timestamp}.json'

    report_data = {
        "politician_name": politician_name,
        "collected_at": datetime.now().isoformat(),
        "summary": {
            "success": results['success'],
            "total_events": results['total_events'],
            "total_duration_seconds": results['total_duration_seconds'],
            "errors_count": len(results['errors'])
        },
        "results_by_category": results['results_by_category'],
        "errors": results['errors']
    }

    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report_data, f, ensure_ascii=False, indent=2)

    logger.info(f"[REPORT] Saved to: {report_file}")
    return report_file


def main():
    """메인 실행 함수"""
    import argparse

    parser = argparse.ArgumentParser(
        description='V40 Gemini CLI Batch Parallel Collection (Direct Subprocess)'
    )
    parser.add_argument('--politician', required=True, help='정치인 이름')
    parser.add_argument('--period', type=int, default=2,
                       help='수집 기간 (년, 기본값: 2)')
    parser.add_argument('--workers', type=int, default=5,
                       help='배치당 최대 워커 수 (기본값: 5)')
    parser.add_argument('--batch-size', type=int, default=5,
                       help='배치 크기 (기본값: 5)')
    parser.add_argument('--output-dir', type=str, default='./reports',
                       help='보고서 저장 디렉토리')

    args = parser.parse_args()

    # ⚠️ 필수: Gemini CLI 인증 확인 (Google AI Pro 유료 계정)
    # require_gemini_auth()  # 임시 비활성화: 서버 용량 부족 시 타임아웃 방지

    # 배치 병렬 수집 실행
    results = collect_all_categories_parallel(
        args.politician,
        args.period,
        args.workers,
        args.batch_size
    )

    # 보고서 저장
    output_dir = Path(args.output_dir)
    report_file = save_collection_report(args.politician, results, output_dir)

    # 결과 출력
    print(f"\n{'='*60}")
    print(f"[RESULT] Parallel Collection Complete")
    print(f"{'='*60}")
    print(f"Politician: {args.politician}")
    print(f"Total events: {results['total_events']}")
    print(f"Duration: {results['total_duration_seconds']:.1f}s")
    print(f"Success: {results['success']}")
    print(f"Report: {report_file}")
    print(f"{'='*60}\n")

    sys.exit(0 if results['success'] else 1)


if __name__ == '__main__':
    main()
