#!/usr/bin/env python3
"""
V40 Gemini CLI Batched Collection (배치 분할 수집)
=================================================

문제: 60개 한번에 요청 → 토큰 초과 → 실패
해결: 60개를 3x20으로 분할 요청 → 성공률 향상

Usage:
    python collect_gemini_batched.py --politician "조은희" --category "leadership"
"""

import sys
from pathlib import Path

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent.parent
sys.path.insert(0, str(V40_DIR))

from collect_gemini_subprocess import collect_category
import logging

logging.basicConfig(
    level=logging.INFO,
    format='[%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)


def collect_category_batched(
    politician_name: str,
    category: str,
    target_items: int = 60,
    batch_size: int = 10,
    period_years: int = 2
):
    """
    배치 분할 수집

    Args:
        politician_name: 정치인 이름
        category: 카테고리
        target_items: 목표 개수 (기본 60)
        batch_size: 배치 크기 (기본 20)
        period_years: 수집 기간 (년)

    Returns:
        총 수집 개수
    """
    num_batches = (target_items + batch_size - 1) // batch_size  # 올림 나눗셈
    total_collected = 0

    logger.info(f"\n{'='*60}")
    logger.info(f"[BATCHED] 배치 분할 수집 시작")
    logger.info(f"Politician: {politician_name}")
    logger.info(f"Category: {category}")
    logger.info(f"Target: {target_items} items")
    logger.info(f"Batch size: {batch_size}")
    logger.info(f"Num batches: {num_batches}")
    logger.info(f"{'='*60}\n")

    for batch_num in range(num_batches):
        logger.info(f"\n[BATCH {batch_num + 1}/{num_batches}] Starting...")

        # 각 배치 수집
        result = collect_category(politician_name, category, period_years)

        if result['success']:
            batch_collected = result['events_collected']
            total_collected += batch_collected
            logger.info(f"[BATCH {batch_num + 1}] ✅ {batch_collected}개 수집 (누적: {total_collected}개)")
        else:
            logger.error(f"[BATCH {batch_num + 1}] ❌ 실패: {result['error']}")

        # 목표 달성 시 조기 종료
        if total_collected >= target_items:
            logger.info(f"\n[SUCCESS] 목표 {target_items}개 달성! (총 {total_collected}개)")
            break

    logger.info(f"\n{'='*60}")
    logger.info(f"[FINAL] 총 {total_collected}/{target_items}개 수집 완료")
    logger.info(f"{'='*60}\n")

    return total_collected


def main():
    """메인 실행 함수"""
    import argparse

    parser = argparse.ArgumentParser(
        description='V40 Gemini CLI Batched Collection (배치 분할 수집)'
    )
    parser.add_argument('--politician', required=True, help='정치인 이름')
    parser.add_argument('--category', required=True,
                       choices=[
                           'expertise', 'leadership', 'vision', 'integrity', 'ethics',
                           'accountability', 'transparency', 'communication',
                           'responsiveness', 'publicinterest'
                       ],
                       help='카테고리')
    parser.add_argument('--target', type=int, default=60,
                       help='목표 개수 (기본값: 60)')
    parser.add_argument('--batch-size', type=int, default=10,
                       help='배치 크기 (기본값: 10)')
    parser.add_argument('--period', type=int, default=2,
                       help='수집 기간 (년, 기본값: 2)')

    args = parser.parse_args()

    # 배치 분할 수집 실행
    total = collect_category_batched(
        args.politician,
        args.category,
        args.target,
        args.batch_size,
        args.period
    )

    # 결과 출력
    print(f"\n{'='*60}")
    print(f"[RESULT] 배치 수집 완료")
    print(f"{'='*60}")
    print(f"Politician: {args.politician}")
    print(f"Category: {args.category}")
    print(f"Target: {args.target}")
    print(f"Collected: {total}")
    print(f"Success rate: {(total/args.target)*100:.1f}%")
    print(f"{'='*60}\n")

    sys.exit(0 if total >= args.target else 1)


if __name__ == '__main__':
    main()
