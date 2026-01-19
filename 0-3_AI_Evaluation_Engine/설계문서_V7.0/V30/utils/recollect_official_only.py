# -*- coding: utf-8 -*-
"""
V30 Official 데이터 추가 수집 스크립트

목적: official 데이터가 부족한 카테고리에 official 데이터만 추가 수집

사용법:
    python recollect_official_only.py --politician_id=f9e00370 --politician_name="김민석"
"""

import os
import sys
import argparse
from datetime import datetime
from collections import defaultdict

# collect_v30.py의 함수들을 import
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from collect_v30 import (
    supabase, CATEGORIES, CATEGORY_MAP,
    get_existing_count, collect_for_category_data_type,
    TABLE_COLLECTED_DATA
)

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', line_buffering=True)


def get_category_stats(politician_id):
    """카테고리별 official/public 통계"""
    result = supabase.table(TABLE_COLLECTED_DATA)\
        .select('category, data_type')\
        .eq('politician_id', politician_id)\
        .execute()

    stats = defaultdict(lambda: {'official': 0, 'public': 0})
    for item in result.data:
        cat = item.get('category')
        dtype = item.get('data_type', '').lower()
        if cat and dtype:
            stats[cat][dtype] += 1

    return stats


def recollect_official(politician_id, politician_name, target_per_category=50):
    """Official 데이터만 추가 수집"""

    print(f"\n{'#'*60}")
    print(f"# V30 Official 데이터 추가 수집")
    print(f"# 정치인: {politician_name} ({politician_id})")
    print(f"# 목표: 각 카테고리당 official {target_per_category}개")
    print(f"{'#'*60}\n")

    # 현재 상태 확인
    stats = get_category_stats(politician_id)

    # 부족한 개수 계산
    to_collect = {}
    total_needed = 0

    print("카테고리별 official 현황:")
    print(f"{'카테고리':<15} | {'현재':<6} | {'목표':<6} | {'부족':<6}")
    print("-" * 50)

    for cat_eng, cat_kor in CATEGORIES:
        current = stats[cat_eng]['official']
        needed = max(0, target_per_category - current)

        if needed > 0:
            to_collect[cat_eng] = {
                'korean': cat_kor,
                'current': current,
                'needed': needed
            }
            total_needed += needed

        print(f"{cat_eng:<15} | {current:<6} | {target_per_category:<6} | {needed:<6}")

    print("-" * 50)
    print(f"{'총계':<15} | {sum(s['official'] for s in stats.values()):<6} | {target_per_category * 10:<6} | {total_needed:<6}")
    print()

    if not to_collect:
        print("✅ 모든 카테고리가 목표를 달성했습니다.")
        return

    print(f"총 {total_needed}개 official 데이터 추가 수집 시작...\n")

    # AI별 배분 (V30 기준: Gemini 60%, Perplexity 30%, Grok 10%)
    ai_distribution = {
        'Gemini': 0.6,
        'Perplexity': 0.3,
        'Grok': 0.1
    }

    start_time = datetime.now()
    total_collected = 0

    # 카테고리별 수집
    for cat_eng, info in to_collect.items():
        cat_kor = info['korean']
        needed = info['needed']

        print(f"\n{'='*60}")
        print(f"[{cat_kor}] official {needed}개 추가 수집")
        print(f"{'='*60}\n")

        # AI별로 배분
        for ai_name, ratio in ai_distribution.items():
            ai_needed = int(needed * ratio)
            if ai_needed == 0:
                continue

            print(f"  [{ai_name}] official {ai_needed}개 수집 중...")

            # official 데이터 수집 (부정/긍정/자유 비율은 기존과 동일)
            # 전체를 official로 수집
            collected = collect_for_category_data_type(
                politician_id=politician_id,
                politician_name=politician_name,
                category_name=cat_eng,
                category_korean=cat_kor,
                data_type='official',
                ai_name=ai_name,
                target_count=ai_needed
            )

            total_collected += collected
            print(f"    ✅ {collected}개 수집 완료\n")

    # 결과 요약
    elapsed = (datetime.now() - start_time).total_seconds()

    print(f"\n{'='*60}")
    print(f"✅ Official 데이터 추가 수집 완료")
    print(f"   총 수집: {total_collected}개")
    print(f"   소요 시간: {elapsed:.1f}초 ({elapsed/60:.1f}분)")
    print(f"{'='*60}\n")


def main():
    parser = argparse.ArgumentParser(description='V30 Official 데이터 추가 수집')
    parser.add_argument('--politician_id', required=True, help='정치인 ID')
    parser.add_argument('--politician_name', required=True, help='정치인 이름')
    parser.add_argument('--target', type=int, default=50, help='카테고리당 목표 official 개수 (기본: 50)')

    args = parser.parse_args()

    recollect_official(
        politician_id=args.politician_id,
        politician_name=args.politician_name,
        target_per_category=args.target
    )


if __name__ == "__main__":
    main()
