#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

"""
V40 Naver 야간 자동 수집 스케줄러 (Step 3)
===========================================

목적:
- 낮 시간 수집 부족 카테고리를 밤 11시부터 자동 재수집
- Rate Limit 회복 시간 활용 (야간 트래픽 적음)
- 평가 중에 백그라운드에서 진행

사용법:
    python recollect_naver_v40_scheduler.py --start-time 23:00 --politician-id d0a5d6e1 --politician-name "조은희"

실행 환경:
    1. 로컬: cron job으로 매일 밤 11시 실행
    2. Windows: Task Scheduler로 매일 밤 11시 실행
    3. 서버: systemd timer로 설정
"""

import os
import sys
import json
import argparse
import subprocess
from pathlib import Path
from datetime import datetime, time as dt_time
from typing import List, Dict
import time

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent.parent
CORE_DIR = V40_DIR / "scripts" / "core"

sys.path.insert(0, str(CORE_DIR))

from supabase import create_client
from dotenv import load_dotenv

# .env 파일 로드
ENV_PATH = V40_DIR.parent / '.env'
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)
else:
    load_dotenv()

# Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')


def get_missing_categories(politician_id: str) -> Dict[str, int]:
    """
    부족한 카테고리 파악
    - 50개 미만인 카테고리 반환
    """
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

        categories = [
            'expertise', 'leadership', 'vision', 'integrity', 'ethics',
            'accountability', 'transparency', 'communication',
            'responsiveness', 'publicinterest'
        ]

        missing = {}

        for cat in categories:
            result = supabase.table('collected_data_v40').select(
                'count'
            ).eq('politician_id', politician_id).eq('category', cat).execute()

            count = result.data[0]['count'] if result.data else 0

            if count < 50:
                missing[cat] = max(0, 50 - count)
                print(f"  ⚠️  {cat}: {count}/50 ({missing[cat]}개 부족)")
            else:
                print(f"  ✅ {cat}: {count}/50 (충분함)")

        return missing

    except Exception as e:
        print(f"[ERROR] 부족 카테고리 파악 실패: {e}")
        return {}


def run_recollection(politician_id: str, politician_name: str, categories: List[str]) -> None:
    """
    부족한 카테고리 재수집
    """
    print(f"\n📥 Naver 재수집 시작 ({len(categories)}개 카테고리)")
    print(f"   정치인: {politician_name}")
    print(f"   카테고리: {', '.join(categories)}")
    print(f"   시작 시간: {datetime.now().strftime('%H:%M:%S')}")

    for cat in categories:
        print(f"\n  🔄 {cat} 재수집 중...")

        # Naver 수집 스크립트 실행
        cmd = [
            'python',
            str(SCRIPT_DIR / 'collect_naver_v40_final.py'),
            '--politician-id', politician_id,
            '--politician-name', politician_name,
            '--category', cat
        ]

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)

            if result.returncode == 0:
                print(f"    ✅ {cat} 완료")
            else:
                print(f"    ⚠️  {cat} 오류: {result.stderr[:100]}")

        except subprocess.TimeoutExpired:
            print(f"    ⏱️  {cat} 타임아웃 (5분 초과)")
        except Exception as e:
            print(f"    ❌ {cat} 실패: {e}")

        # Rate Limit 회피: 각 카테고리 사이 1초 대기
        time.sleep(1)

    print(f"\n✅ 재수집 완료 ({datetime.now().strftime('%H:%M:%S')})")


def wait_until_time(target_time_str: str) -> None:
    """
    지정된 시간까지 대기
    예: "23:00" → 밤 11시까지 대기
    """
    target_time = datetime.strptime(target_time_str, '%H:%M').time()

    while True:
        now = datetime.now()
        current_time = now.time()

        if current_time >= target_time:
            print(f"✅ {target_time_str} 도달! 재수집 시작...")
            return

        # 1분마다 확인
        time.sleep(60)


def main():
    parser = argparse.ArgumentParser(description='V40 Naver 야간 자동 수집 스케줄러')
    parser.add_argument('--politician-id', required=True, help='정치인 ID (e.g., d0a5d6e1)')
    parser.add_argument('--politician-name', required=True, help='정치인 이름 (e.g., 조은희)')
    parser.add_argument('--start-time', default='23:00', help='시작 시간 (기본: 23:00)')
    parser.add_argument('--check-now', action='store_true', help='즉시 확인 후 실행 (시간 제한 없음)')

    args = parser.parse_args()

    print(f"""
╔════════════════════════════════════════════════════════════════╗
║       V40 Naver 야간 자동 수집 스케줄러 (Step 3)              ║
╚════════════════════════════════════════════════════════════════╝

🎯 정치인: {args.politician_name} (ID: {args.politician_id})
⏰ 시작 시간: {args.start_time}
🌙 모드: {'즉시 실행' if args.check_now else '야간 예약'}
""")

    # Step 1: 부족 카테고리 파악
    print("📋 부족한 카테고리 확인 중...")
    missing = get_missing_categories(args.politician_id)

    if not missing:
        print("✅ 모든 카테고리가 충분합니다! 재수집 불필요.")
        return

    missing_categories = list(missing.keys())
    total_missing = sum(missing.values())

    print(f"\n⚠️  {len(missing_categories)}개 카테고리 부족 ({total_missing}개 항목)")

    # Step 2: 시간 대기 (또는 즉시 실행)
    if not args.check_now:
        print(f"\n⏳ {args.start_time}까지 대기 중... (평가 중에 백그라운드에서 진행)")
        wait_until_time(args.start_time)
    else:
        print("\n▶️  즉시 실행 모드 (--check-now)")

    # Step 3: 재수집 실행
    run_recollection(
        args.politician_id,
        args.politician_name,
        missing_categories
    )

    # Step 4: 최종 상태 확인
    print("\n📊 최종 상태 확인...")
    final_missing = get_missing_categories(args.politician_id)

    if not final_missing:
        print("✅ 모든 카테고리 완료!")
    else:
        print(f"⚠️  여전히 {len(final_missing)}개 카테고리 부족 (재시도 필요)")


if __name__ == '__main__':
    main()
