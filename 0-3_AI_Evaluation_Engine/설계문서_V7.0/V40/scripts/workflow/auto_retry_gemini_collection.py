#!/usr/bin/env python3
"""
V40 Gemini 수집 자동 재시도 스크립트
=====================================

1시간마다 Gemini 수집을 자동으로 재시도합니다.
서버 용량이 생길 때까지 계속 시도합니다.

Usage:
    python auto_retry_gemini_collection.py --politician "조은희"

Features:
    - 1시간 간격으로 자동 재시도
    - 성공 시 로그 저장 및 계속 진행
    - 실패 시 에러 로그 + 1시간 대기
    - Ctrl+C로 중지 가능
    - 진행 상황 실시간 표시
"""

import os
import sys
import time
import subprocess
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
CORE_DIR = SCRIPT_DIR.parent / "core"
V40_DIR = SCRIPT_DIR.parent.parent
sys.path.insert(0, str(V40_DIR))

from dotenv import load_dotenv
from supabase import create_client, Client

# .env 로드
ENV_PATH = V40_DIR.parent / '.env'
load_dotenv(ENV_PATH if ENV_PATH.exists() else None)

# 로깅 설정
LOG_DIR = V40_DIR / "logs"
LOG_DIR.mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler(LOG_DIR / f"auto_retry_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log", encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Supabase 설정
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 10개 카테고리
CATEGORIES = [
    'expertise', 'leadership', 'vision', 'integrity', 'ethics',
    'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'
]

# 1시간 = 3600초
RETRY_INTERVAL = 3600


def check_collection_status(politician_name: str) -> Dict[str, int]:
    """
    현재 수집 상태 확인

    Returns:
        {"category": count, ...}
    """
    result = supabase.table('collected_data_v40').select('category').eq(
        'politician_name', politician_name
    ).eq('collector_ai', 'Gemini').execute()

    status = {cat: 0 for cat in CATEGORIES}
    for item in result.data:
        cat = item['category']
        if cat in status:
            status[cat] += 1

    return status


def collect_single_category(politician_name: str, category: str) -> Dict:
    """
    단일 카테고리 수집 시도

    Returns:
        {"success": bool, "count": int, "error": str or None}
    """
    logger.info(f"▶ [{category}] 수집 시작...")

    # collect_gemini_subprocess.py 실행
    script_path = SCRIPT_DIR / "collect_gemini_subprocess.py"

    try:
        result = subprocess.run(
            [
                sys.executable,
                str(script_path),
                '--politician', politician_name,
                '--category', category
            ],
            capture_output=True,
            text=True,
            timeout=7200,  # 2시간 타임아웃
            encoding='utf-8',
            errors='replace'
        )

        if result.returncode == 0:
            # 성공 - 수집된 개수 확인
            status = check_collection_status(politician_name)
            count = status.get(category, 0)
            logger.info(f"✅ [{category}] 성공! (수집: {count}개)")
            return {"success": True, "count": count, "error": None}
        else:
            # 실패
            error_msg = result.stderr if result.stderr else result.stdout

            # 서버 용량 부족 에러 확인
            if 'MODEL_CAPACITY_EXHAUSTED' in error_msg or 'RESOURCE_EXHAUSTED' in error_msg or '429' in error_msg:
                logger.warning(f"⚠️ [{category}] 서버 용량 부족 (재시도 예정)")
                return {"success": False, "count": 0, "error": "SERVER_CAPACITY"}
            else:
                logger.error(f"❌ [{category}] 실패: {error_msg[:200]}")
                return {"success": False, "count": 0, "error": error_msg[:500]}

    except subprocess.TimeoutExpired:
        logger.error(f"⏱️ [{category}] 타임아웃 (2시간 초과)")
        return {"success": False, "count": 0, "error": "TIMEOUT"}

    except Exception as e:
        logger.exception(f"❌ [{category}] 예외 발생: {e}")
        return {"success": False, "count": 0, "error": str(e)}


def run_collection_cycle(politician_name: str) -> Dict:
    """
    전체 카테고리 수집 사이클 실행

    Returns:
        {"total": int, "success": int, "failed": int, "categories": {...}}
    """
    logger.info("=" * 80)
    logger.info(f"🚀 수집 사이클 시작: {politician_name}")
    logger.info(f"⏰ 시작 시각: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("=" * 80)

    # 현재 상태 확인
    current_status = check_collection_status(politician_name)
    logger.info(f"📊 현재 상태:")
    for cat, count in current_status.items():
        logger.info(f"   {cat}: {count}개")

    # 미수집 카테고리 찾기
    pending_categories = [cat for cat, count in current_status.items() if count < 50]  # 목표: 50개 이상

    if not pending_categories:
        logger.info("✅ 모든 카테고리 수집 완료!")
        return {"total": 10, "success": 10, "failed": 0, "categories": current_status}

    logger.info(f"📝 미수집 카테고리: {len(pending_categories)}개")
    logger.info(f"   {', '.join(pending_categories)}")
    logger.info("")

    # 각 카테고리 수집 시도
    results = {}
    success_count = 0
    failed_count = 0

    for i, category in enumerate(pending_categories, 1):
        logger.info(f"[{i}/{len(pending_categories)}] {category} 처리 중...")
        result = collect_single_category(politician_name, category)
        results[category] = result

        if result['success']:
            success_count += 1
        else:
            failed_count += 1

            # 서버 용량 부족이면 더 이상 시도하지 않음
            if result['error'] == 'SERVER_CAPACITY':
                logger.warning("⚠️ 서버 용량 부족 감지 - 이번 사이클 중단")
                logger.warning("⏳ 1시간 후 재시도 예정")
                break

        logger.info("")

    # 최종 상태 확인
    final_status = check_collection_status(politician_name)
    total_collected = sum(final_status.values())

    logger.info("=" * 80)
    logger.info(f"📊 사이클 완료 결과:")
    logger.info(f"   성공: {success_count}개 카테고리")
    logger.info(f"   실패: {failed_count}개 카테고리")
    logger.info(f"   총 수집: {total_collected}개 이벤트")
    logger.info("=" * 80)
    logger.info("")

    return {
        "total": len(pending_categories),
        "success": success_count,
        "failed": failed_count,
        "categories": final_status
    }


def main():
    """메인 실행 함수"""
    import argparse

    parser = argparse.ArgumentParser(
        description='V40 Gemini 수집 자동 재시도 스크립트'
    )
    parser.add_argument('--politician', required=True, help='정치인 이름')
    parser.add_argument('--interval', type=int, default=3600,
                       help='재시도 간격 (초, 기본값: 3600 = 1시간)')
    parser.add_argument('--max-cycles', type=int, default=0,
                       help='최대 사이클 수 (0 = 무제한)')

    args = parser.parse_args()

    logger.info("╔" + "=" * 78 + "╗")
    logger.info("║" + " " * 78 + "║")
    logger.info("║" + "  V40 Gemini 자동 재시도 스크립트".center(78) + "║")
    logger.info("║" + " " * 78 + "║")
    logger.info("╚" + "=" * 78 + "╝")
    logger.info("")
    logger.info(f"정치인: {args.politician}")
    logger.info(f"재시도 간격: {args.interval}초 ({args.interval // 60}분)")
    logger.info(f"최대 사이클: {'무제한' if args.max_cycles == 0 else args.max_cycles}")
    logger.info("")
    logger.info("⚠️ 중지하려면 Ctrl+C를 누르세요")
    logger.info("")

    cycle = 0

    try:
        while True:
            cycle += 1
            logger.info(f"🔄 사이클 #{cycle}")

            # 수집 실행
            result = run_collection_cycle(args.politician)

            # 완료 체크
            total_collected = sum(result['categories'].values())
            if total_collected >= 500:  # 목표: 500개 이상
                logger.info("🎉 목표 달성! 수집 완료!")
                break

            # 최대 사이클 체크
            if args.max_cycles > 0 and cycle >= args.max_cycles:
                logger.info(f"⏹️ 최대 사이클 도달 ({args.max_cycles})")
                break

            # 대기
            next_time = datetime.now().timestamp() + args.interval
            next_time_str = datetime.fromtimestamp(next_time).strftime('%Y-%m-%d %H:%M:%S')
            logger.info(f"⏳ 다음 시도: {next_time_str} ({args.interval // 60}분 후)")
            logger.info("")

            time.sleep(args.interval)

    except KeyboardInterrupt:
        logger.info("")
        logger.info("⏹️ 사용자가 중지했습니다.")
        logger.info("")

    # 최종 결과
    final_status = check_collection_status(args.politician)
    total = sum(final_status.values())

    logger.info("=" * 80)
    logger.info("📊 최종 수집 결과:")
    for cat, count in final_status.items():
        status = "✅" if count >= 50 else "⚠️"
        logger.info(f"   {status} {cat}: {count}개")
    logger.info(f"   총합: {total}개")
    logger.info("=" * 80)


if __name__ == '__main__':
    main()
