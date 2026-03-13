# -*- coding: utf-8 -*-
"""
V60 CCI 전체 상태 확인 스크립트

GPI 수집/평가 + Alpha 수집/평가 + CCI 통합 점수 상태를 한눈에 확인한다.

사용법:
    python check_cci_status.py --politician-id 17270f25
    python check_cci_status.py --group-name "2026 서울시장"
"""

import sys
import argparse
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'helpers'))
from common_cci import (
    supabase, GPI_CATEGORIES, ALPHA_CATEGORIES, ALPHA_CATEGORY_NAMES, ALPHA_TYPE_MAP,
    TABLE_COLLECTED_GPI, TABLE_EVALUATIONS_GPI, TABLE_FINAL_SCORES_GPI,
    TABLE_COLLECTED_ALPHA, TABLE_EVALUATIONS_ALPHA, TABLE_ALPHA_SCORES,
    TABLE_CCI_SCORES, TABLE_COMPETITOR_GROUPS,
    get_politician_info, get_competitor_group, fetch_all_rows, print_status
)


def check_gpi_status(politician_id: str, name: str):
    """GPI (Pipeline A) 상태 확인"""
    print(f"\n{'─'*60}")
    print(f"📊 GPI 상태 — {name} ({politician_id})")
    print(f"{'─'*60}")

    # 수집 상태
    collected = fetch_all_rows(TABLE_COLLECTED_GPI, {'politician_id': politician_id}, 'id,category,collector_ai')
    if collected:
        cat_counts = {}
        ai_counts = {}
        for row in collected:
            cat = row['category']
            ai = row['collector_ai']
            cat_counts[cat] = cat_counts.get(cat, 0) + 1
            ai_counts[ai] = ai_counts.get(ai, 0) + 1

        print(f"\n  [수집] 총 {len(collected)}개")
        for cat in GPI_CATEGORIES:
            cnt = cat_counts.get(cat, 0)
            status = '✅' if cnt >= 50 else '⚠️' if cnt >= 25 else '❌'
            print(f"    {status} {cat:<20} {cnt:>4}개")
        print(f"\n  [수집 AI별]")
        for ai, cnt in sorted(ai_counts.items()):
            print(f"    • {ai}: {cnt}개")
    else:
        print("  [수집] ❌ 데이터 없음")

    # 평가 상태
    evals = fetch_all_rows(TABLE_EVALUATIONS_GPI, {'politician_id': politician_id}, 'id,category,evaluator_ai,rating')
    if evals:
        eval_by_ai = {}
        for e in evals:
            ai = e['evaluator_ai']
            eval_by_ai[ai] = eval_by_ai.get(ai, 0) + 1

        non_x = [e for e in evals if e.get('rating') != 'X']
        print(f"\n  [평가] 총 {len(evals)}개 (X 제외: {len(non_x)}개)")
        for ai, cnt in sorted(eval_by_ai.items()):
            print(f"    • {ai}: {cnt}개")
    else:
        print("  [평가] ❌ 데이터 없음")

    # 최종 점수
    score_result = supabase.table(TABLE_FINAL_SCORES_GPI).select('*').eq(
        'politician_id', politician_id
    ).execute()
    if score_result.data:
        s = score_result.data[0]
        print(f"\n  [GPI 점수] {s['final_score']}점 {s['grade']}등급 ({s.get('grade_name', '')})")
    else:
        print("  [GPI 점수] ❌ 미계산")


def check_alpha_status(politician_id: str, name: str):
    """Alpha (Pipeline B+C) 상태 확인"""
    print(f"\n{'─'*60}")
    print(f"🔮 Alpha 상태 — {name} ({politician_id})")
    print(f"{'─'*60}")

    # 수집 상태
    collected = fetch_all_rows(TABLE_COLLECTED_ALPHA, {'politician_id': politician_id}, 'id,alpha_type,category')
    if collected:
        cat_counts = {}
        for row in collected:
            cat = row['category']
            cat_counts[cat] = cat_counts.get(cat, 0) + 1

        print(f"\n  [Alpha 수집] 총 {len(collected)}개")
        for cat in ALPHA_CATEGORIES:
            cnt = cat_counts.get(cat, 0)
            alpha_type = ALPHA_TYPE_MAP[cat]
            label = f"[{alpha_type}] {cat} ({ALPHA_CATEGORY_NAMES[cat]})"
            status = '✅' if cnt >= 10 else '⚠️' if cnt > 0 else '❌'
            print(f"    {status} {label:<40} {cnt:>4}개")
    else:
        print("  [Alpha 수집] ❌ 데이터 없음")

    # 평가 상태
    evals = fetch_all_rows(TABLE_EVALUATIONS_ALPHA, {'politician_id': politician_id}, 'id,alpha_type,category,rating')
    if evals:
        cat_eval_counts = {}
        for e in evals:
            cat = e['category']
            cat_eval_counts[cat] = cat_eval_counts.get(cat, 0) + 1

        print(f"\n  [Alpha 평가] 총 {len(evals)}개")
        for cat in ALPHA_CATEGORIES:
            cnt = cat_eval_counts.get(cat, 0)
            print(f"    • {cat}: {cnt}개")
    else:
        print("  [Alpha 평가] ❌ 데이터 없음")

    # Alpha 점수
    scores = supabase.table(TABLE_ALPHA_SCORES).select('*').eq(
        'politician_id', politician_id
    ).execute()
    if scores.data:
        print(f"\n  [Alpha 점수]")
        for s in sorted(scores.data, key=lambda x: x['alpha_type'] + x['category']):
            print(f"    • [{s['alpha_type']}] {s['category']}: {s['category_score']}점 (avg {s['avg_rating']})")
    else:
        print("  [Alpha 점수] ❌ 미계산")


def check_cci_status(politician_id: str, name: str):
    """CCI 통합 점수 상태 확인"""
    print(f"\n{'─'*60}")
    print(f"🏆 CCI 통합 상태 — {name} ({politician_id})")
    print(f"{'─'*60}")

    cci = supabase.table(TABLE_CCI_SCORES).select('*').eq(
        'politician_id', politician_id
    ).execute()

    if cci.data:
        for c in cci.data:
            # 그룹 정보
            group = supabase.table(TABLE_COMPETITOR_GROUPS).select('group_name').eq(
                'id', c['competitor_group_id']
            ).execute()
            group_name = group.data[0]['group_name'] if group.data else '?'

            print(f"\n  그룹: {group_name}")
            print(f"  ┌─ GPI:    {c.get('gpi_score', '?')}점 ({c.get('gpi_grade', '?')}등급)")
            print(f"  ├─ Alpha1: {c.get('alpha1_total', '?')}점 (opinion:{c.get('alpha1_opinion_score','?')} media:{c.get('alpha1_media_score','?')} risk:{c.get('alpha1_risk_score','?')})")
            print(f"  ├─ Alpha2: {c.get('alpha2_total', '?')}점 (party:{c.get('alpha2_party_score','?')} candidate:{c.get('alpha2_candidate_score','?')} regional:{c.get('alpha2_regional_score','?')})")
            print(f"  ├─ CCI:    {c.get('cci_score', '?')}점")
            print(f"  └─ 순위:   {c.get('cci_rank', '?')}위 ({c.get('cci_grade', '?')})")
    else:
        print("  ❌ CCI 점수 미계산")


def check_group_status(group_name: str):
    """그룹 전체 상태 확인"""
    result = supabase.table(TABLE_COMPETITOR_GROUPS).select('*').eq(
        'group_name', group_name
    ).execute()

    if not result.data:
        print_status(f"'{group_name}' 그룹을 찾을 수 없습니다.", 'error')
        return

    group = result.data[0]
    print(f"\n{'═'*60}")
    print(f"📋 그룹: {group_name} ({group['election_type']}, {group['region']})")
    print(f"{'═'*60}")

    for pid in group.get('politician_ids', []):
        info = get_politician_info(pid)
        name = info.get('name', '?') if info else '?'
        check_gpi_status(pid, name)
        check_alpha_status(pid, name)
        check_cci_status(pid, name)

    print(f"\n{'═'*60}")


def main():
    parser = argparse.ArgumentParser(description='V60 CCI 상태 확인')
    parser.add_argument('--politician-id', type=str, help='정치인 ID')
    parser.add_argument('--group-name', type=str, help='그룹명')
    args = parser.parse_args()

    if args.group_name:
        check_group_status(args.group_name)
    elif args.politician_id:
        info = get_politician_info(args.politician_id)
        name = info.get('name', '?') if info else '?'
        check_gpi_status(args.politician_id, name)
        check_alpha_status(args.politician_id, name)
        check_cci_status(args.politician_id, name)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
