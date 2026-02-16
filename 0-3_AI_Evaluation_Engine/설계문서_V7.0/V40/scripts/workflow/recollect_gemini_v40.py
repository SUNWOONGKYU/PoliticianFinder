#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
V40 Gemini 재수집 스크립트
=========================

⭐ 목적:
    Phase 3-3 검증 후 조정에서 사용
    Gemini 부족 카테고리 자동 재수집

⭐ 이 스크립트가 필요한 이유:
    Phase 2에서 최소 목표(50개)만 수집한 경우
    검증 후 일부 카테고리가 50개 미만으로 떨어짐
    → 이 스크립트로 자동 재수집 (2-3시간 소요 가능)

⭐ 예방 방법:
    Phase 2부터 버퍼 목표(60개/카테고리)로 수집하면
    이 스크립트가 거의 필요 없음! (시간 절약!)

기능:
    1. 현재 Gemini 수집량 확인 (카테고리별)
    2. 50개 미만 카테고리 식별
    3. collect_gemini_subprocess.py 자동 실행
    4. 60개 목표 달성까지 반복 (최대 4회, 포기 규칙 적용)

⚠️ 주의:
    - Gemini CLI는 느림 (5-10분/라운드)
    - integrity(청렴성) 카테고리는 특히 어려움 (8라운드 소요 가능)
    - 버퍼 목표(60)로 초기 수집하는 것이 훨씬 빠름!

사용법:
    # 전체 카테고리 재수집
    python recollect_gemini_v40.py --politician "조은희"

    # 특정 카테고리만
    python recollect_gemini_v40.py --politician "조은희" --category integrity

    # DRY RUN (시뮬레이션)
    python recollect_gemini_v40.py --politician "조은희" --dry-run

실전 교훈:
    - 조은희: integrity 18→51 (8라운드, 2시간 소요)
    - 다음번엔 Phase 2부터 60개 수집 → 이 스크립트 거의 불필요!
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path
from collections import defaultdict
from dotenv import load_dotenv
from supabase import create_client

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent  # workflow/
V40_DIR = SCRIPT_DIR.parent.parent  # V40/ (workflow → scripts → V40)

# .env 로드
env_paths = [
    V40_DIR.parent.parent / '.env',
    V40_DIR.parent / '.env',
    V40_DIR / '.env',
]
for env_path in env_paths:
    if env_path.exists():
        load_dotenv(env_path, override=True)
        break

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# 상수
TABLE_COLLECTED = "collected_data_v40"
CATEGORIES = [
    'expertise', 'leadership', 'vision', 'integrity', 'ethics',
    'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'
]

CATEGORY_KR = {
    'expertise': '전문성', 'leadership': '리더십', 'vision': '비전',
    'integrity': '청렴성', 'ethics': '윤리성', 'accountability': '책임감',
    'transparency': '투명성', 'communication': '소통능력', 'responsiveness': '대응성',
    'publicinterest': '공익성'
}

MIN_TARGET = 50  # 최소 목표
MAX_TARGET = 60  # 버퍼 목표
MAX_ROUNDS = 3   # 최대 재수집 라운드


def get_politician_id(politician_name: str) -> str:
    """정치인 이름으로 ID 조회"""
    result = supabase.table('politicians_v40').select('id').eq('name', politician_name).execute()
    if not result.data:
        raise ValueError(f"정치인을 찾을 수 없습니다: {politician_name}")
    return result.data[0]['id']


def check_gemini_status(politician_id: str, target_category: str = None):
    """
    Gemini 수집 현황 확인

    Returns:
        dict: {category: count}
    """
    result = supabase.table(TABLE_COLLECTED)\
        .select('category')\
        .eq('politician_id', politician_id)\
        .eq('collector_ai', 'Gemini')\
        .execute()

    stats = defaultdict(int)
    for row in result.data:
        stats[row['category']] += 1

    # 특정 카테고리만 필터링
    if target_category:
        return {target_category: stats.get(target_category, 0)}

    return dict(stats)


def collect_category(politician_name: str, category: str, dry_run: bool = False) -> bool:
    """
    특정 카테고리 Gemini 재수집

    Returns:
        성공 여부
    """
    if dry_run:
        print(f"  [DRY RUN] Gemini {CATEGORY_KR[category]} 재수집 예정")
        return True

    print(f"  [재수집 시작] Gemini {CATEGORY_KR[category]}...")

    script_path = SCRIPT_DIR / 'collect_gemini_subprocess.py'
    cmd = [
        sys.executable,
        str(script_path),
        '--politician', politician_name,
        '--category', category
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)

        if result.returncode == 0:
            print(f"    ✅ 성공")
            return True
        else:
            print(f"    ❌ 실패")
            if result.stderr:
                print(f"       {result.stderr[:200]}")
            return False

    except subprocess.TimeoutExpired:
        print(f"    ❌ 시간 초과 (5분)")
        return False
    except Exception as e:
        print(f"    ❌ 오류: {str(e)}")
        return False


def recollect_gemini(politician_name: str, target_category: str = None, dry_run: bool = False):
    """
    Gemini 재수집 메인 함수

    Args:
        politician_name: 정치인 이름
        target_category: 특정 카테고리만 재수집 (None이면 전체)
        dry_run: True면 시뮬레이션만
    """
    print("\n" + "=" * 80)
    print(f"  V40 Gemini 재수집 - {politician_name}")
    print("=" * 80)

    if dry_run:
        print("\n⚠️ DRY RUN 모드: 실제 수집 없이 시뮬레이션만 수행합니다.\n")
    else:
        print("\n⚠️ 실제 재수집 모드: Gemini 데이터를 수집합니다.\n")

    # 정치인 ID 조회
    politician_id = get_politician_id(politician_name)
    print(f"정치인 ID: {politician_id}")

    categories_to_check = [target_category] if target_category else CATEGORIES

    for round_num in range(1, MAX_ROUNDS + 1):
        print(f"\n--- 재수집 라운드 {round_num}/{MAX_ROUNDS} ---\n")

        # Step 1: 현황 확인
        stats = check_gemini_status(politician_id, target_category)

        print("현재 Gemini 수집 현황:")
        print(f"{'카테고리':<15} {'개수':>6} {'상태':<10}")
        print("-" * 35)

        shortage_categories = []
        for cat in categories_to_check:
            count = stats.get(cat, 0)
            if count < MIN_TARGET:
                status = f"부족 ({MIN_TARGET - count}개)"
                shortage_categories.append((cat, count))
            elif count > MAX_TARGET:
                status = f"초과 ({count - MAX_TARGET}개)"
            else:
                status = "OK"

            print(f"{CATEGORY_KR[cat]:<15} {count:>6} {status:<10}")

        if not shortage_categories:
            print("\n✅ 모든 카테고리가 목표를 달성했습니다!")
            break

        # Step 2: 부족 카테고리 재수집
        print(f"\n부족 카테고리 {len(shortage_categories)}개 재수집:")

        success_count = 0
        for cat, count in shortage_categories:
            if collect_category(politician_name, cat, dry_run):
                success_count += 1

        print(f"\n재수집 결과: {success_count}/{len(shortage_categories)} 성공")

        if round_num == MAX_ROUNDS:
            print(f"\n⚠️ 최대 재수집 횟수({MAX_ROUNDS}회)에 도달했습니다.")
            if shortage_categories:
                print("   일부 카테고리가 아직 목표에 미달합니다.")
                print("   필요시 스크립트를 다시 실행하세요.")

    # Step 3: 최종 결과
    print("\n" + "=" * 80)
    print("  최종 결과")
    print("=" * 80 + "\n")

    final_stats = check_gemini_status(politician_id, target_category)
    total = sum(final_stats.values())

    print("Gemini 최종 수집 현황:")
    print(f"{'카테고리':<15} {'개수':>6} {'상태':<10}")
    print("-" * 35)

    all_ok = True
    for cat in categories_to_check:
        count = final_stats.get(cat, 0)
        if count < MIN_TARGET:
            status = "⚠️ 부족"
            all_ok = False
        elif count > MAX_TARGET:
            status = "⚠️ 초과"
        else:
            status = "✅ OK"

        print(f"{CATEGORY_KR[cat]:<15} {count:>6} {status:<10}")

    print("-" * 35)
    print(f"{'합계':<15} {total:>6}")

    if all_ok:
        print("\n✅ 재수집 완료! 모든 카테고리가 균형을 달성했습니다.")
    else:
        print("\n⚠️ 일부 카테고리가 아직 균형을 달성하지 못했습니다.")


def main():
    parser = argparse.ArgumentParser(
        description='V40 Gemini 재수집 스크립트',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
사용 예시:
  # 전체 카테고리 재수집
  python recollect_gemini_v40.py --politician "조은희"

  # 특정 카테고리만
  python recollect_gemini_v40.py --politician "조은희" --category integrity

  # DRY RUN
  python recollect_gemini_v40.py --politician "조은희" --dry-run
        """
    )

    parser.add_argument('--politician', required=True, help='정치인 이름')
    parser.add_argument('--category',
                        choices=CATEGORIES,
                        help='특정 카테고리만 재수집 (선택)')
    parser.add_argument('--dry-run', action='store_true',
                        help='시뮬레이션만 (실제 수집 안 함)')

    args = parser.parse_args()

    recollect_gemini(
        politician_name=args.politician,
        target_category=args.category,
        dry_run=args.dry_run
    )


if __name__ == '__main__':
    main()
