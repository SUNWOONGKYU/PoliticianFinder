#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
V40 Naver 재수집 스크립트
========================

⭐ 목적:
    Phase 3-3 검증 후 조정에서 사용
    Naver 부족 카테고리 자동 재수집

⭐ 이 스크립트가 필요한 이유:
    Phase 2에서 최소 목표(50개)만 수집한 경우
    검증 후 일부 카테고리가 50개 미만으로 떨어짐
    → 이 스크립트로 자동 재수집

⭐ 예방 방법:
    Phase 2부터 버퍼 목표(60개/카테고리)로 수집하면
    이 스크립트가 거의 필요 없음! (시간 절약!)

기능:
    1. 현재 Naver 수집량 확인 (카테고리별)
    2. 50개 미만 카테고리 식별
    3. collect_v40.py (Naver API) 자동 실행
    4. 60개 목표 달성까지 반복 (최대 4회, 포기 규칙 적용)

⚠️ 장점:
    - Naver API는 빠름 (1-2분/라운드)
    - Gemini보다 재수집이 훨씬 빠름

사용법:
    # 전체 카테고리 재수집
    python recollect_naver_v40.py --politician_id d0a5d6e1 --politician_name "조은희"

    # 특정 카테고리만
    python recollect_naver_v40.py --politician_id d0a5d6e1 --politician_name "조은희" --category expertise

    # DRY RUN (시뮬레이션)
    python recollect_naver_v40.py --politician_id d0a5d6e1 --politician_name "조은희" --dry-run

실전 교훈:
    - 조은희: 6개 카테고리 부족 → 1라운드 완료 (10분)
    - Gemini보다 훨씬 빠름!
    - 하지만 Phase 2부터 60개 수집하면 더 빠름!
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
COLLECT_V40_SCRIPT = V40_DIR.parent.parent / 'collect_v40.py'  # 0-3_AI_Evaluation_Engine/collect_v40.py

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


def check_naver_status(politician_id: str, target_category: str = None):
    """
    Naver 수집 현황 확인

    Returns:
        dict: {category: count}
    """
    result = supabase.table(TABLE_COLLECTED)\
        .select('category')\
        .eq('politician_id', politician_id)\
        .eq('collector_ai', 'Naver')\
        .execute()

    stats = defaultdict(int)
    for row in result.data:
        stats[row['category']] += 1

    # 특정 카테고리만 필터링
    if target_category:
        return {target_category: stats.get(target_category, 0)}

    return dict(stats)


def collect_category(politician_id: str, politician_name: str, category: str, dry_run: bool = False) -> bool:
    """
    특정 카테고리 Naver 재수집

    Returns:
        성공 여부
    """
    if dry_run:
        print(f"  [DRY RUN] Naver {CATEGORY_KR[category]} 재수집 예정")
        return True

    print(f"  [재수집 시작] Naver {CATEGORY_KR[category]}...")

    # 카테고리 번호 (1-based)
    category_num = CATEGORIES.index(category) + 1

    cmd = [
        sys.executable,
        str(COLLECT_V40_SCRIPT),
        '--politician_id', politician_id,
        '--politician_name', politician_name,
        '--ai', 'Naver',
        '--category', str(category_num)
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


def recollect_naver(politician_id: str, politician_name: str, target_category: str = None, dry_run: bool = False):
    """
    Naver 재수집 메인 함수

    Args:
        politician_id: 정치인 ID
        politician_name: 정치인 이름
        target_category: 특정 카테고리만 재수집 (None이면 전체)
        dry_run: True면 시뮬레이션만
    """
    print("\n" + "=" * 80)
    print(f"  V40 Naver 재수집 - {politician_name}")
    print("=" * 80)

    if dry_run:
        print("\n⚠️ DRY RUN 모드: 실제 수집 없이 시뮬레이션만 수행합니다.\n")
    else:
        print("\n⚠️ 실제 재수집 모드: Naver 데이터를 수집합니다.\n")

    print(f"정치인 ID: {politician_id}")

    categories_to_check = [target_category] if target_category else CATEGORIES

    for round_num in range(1, MAX_ROUNDS + 1):
        print(f"\n--- 재수집 라운드 {round_num}/{MAX_ROUNDS} ---\n")

        # Step 1: 현황 확인
        stats = check_naver_status(politician_id, target_category)

        print("현재 Naver 수집 현황:")
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
            if collect_category(politician_id, politician_name, cat, dry_run):
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

    final_stats = check_naver_status(politician_id, target_category)
    total = sum(final_stats.values())

    print("Naver 최종 수집 현황:")
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
        description='V40 Naver 재수집 스크립트',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
사용 예시:
  # 전체 카테고리 재수집
  python recollect_naver_v40.py --politician_id d0a5d6e1 --politician_name "조은희"

  # 특정 카테고리만
  python recollect_naver_v40.py --politician_id d0a5d6e1 --politician_name "조은희" --category expertise

  # DRY RUN
  python recollect_naver_v40.py --politician_id d0a5d6e1 --politician_name "조은희" --dry-run
        """
    )

    parser.add_argument('--politician_id', required=True, help='정치인 ID (8자리 hex)')
    parser.add_argument('--politician_name', required=True, help='정치인 이름')
    parser.add_argument('--category',
                        choices=CATEGORIES,
                        help='특정 카테고리만 재수집 (선택)')
    parser.add_argument('--dry-run', action='store_true',
                        help='시뮬레이션만 (실제 수집 안 함)')

    args = parser.parse_args()

    recollect_naver(
        politician_id=args.politician_id,
        politician_name=args.politician_name,
        target_category=args.category,
        dry_run=args.dry_run
    )


if __name__ == '__main__':
    main()
