# -*- coding: utf-8 -*-
"""
V60 Alpha 평가 결과 검증 (Phase 3-2)

평가(Phase 3) 완료 후 레이팅 결과의 품질을 검증한다:
  1. 등급 분포 이상 여부 (전부 +4/-4 같은 편향 감지)
  2. X(제외) 비율 과다 여부 (30% 초과 시 경고)
  3. reasoning 누락 여부
  4. collected_alpha_id 매칭 오류 여부 (존재하지 않는 수집 ID 참조)
  5. 미평가 데이터 존재 여부

사용법:
    # 검증 (보고만)
    python validate_alpha_eval.py --politician-id 17270f25

    # 그룹 전체
    python validate_alpha_eval.py --group-name "2026 서울시장"
"""

import sys
import argparse
from pathlib import Path
from collections import Counter

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'helpers'))
from common_cci import (
    supabase,
    ALPHA_CATEGORIES, ALPHA_CATEGORY_NAMES, ALPHA_TYPE_MAP, VALID_RATINGS,
    TABLE_COLLECTED_ALPHA, TABLE_EVALUATIONS_ALPHA, TABLE_COMPETITOR_GROUPS,
    get_politician_info, fetch_all_rows, print_status
)

# 검증 기준
MAX_X_RATIO = 0.30          # X(제외) 비율 30% 초과 시 경고
BIAS_THRESHOLD = 0.70       # 단일 등급 비율 70% 초과 시 편향 경고
MIN_REASONING_LENGTH = 10   # reasoning 최소 길이


def validate_eval_results(politician_id: str) -> dict:
    """평가 결과 검증

    Returns:
        {
            'total_collected': int,
            'total_evaluated': int,
            'total_missing': int,
            'categories': {cat: {
                'collected': int,
                'evaluated': int,
                'missing': int,
                'rating_dist': {'+4': N, ...},
                'x_ratio': float,
                'bias_detected': bool,
                'bias_grade': str or None,
                'reasoning_missing': int,
                'orphan_ids': int,
                'issues': [str, ...],
            }},
            'overall_pass': bool,
            'issues': [str, ...],
        }
    """
    info = get_politician_info(politician_id)
    name = info.get('name', '?') if info else '?'

    print(f"\n{'═'*60}")
    print(f"🔍 Alpha 평가 결과 검증 (Phase 3-2): {name} ({politician_id})")
    print(f"{'═'*60}")

    total_collected = 0
    total_evaluated = 0
    total_missing = 0
    cat_results = {}
    all_issues = []

    for cat in ALPHA_CATEGORIES:
        alpha_type = ALPHA_TYPE_MAP[cat]
        issues = []

        # 수집 데이터 ID 조회
        collected = fetch_all_rows(TABLE_COLLECTED_ALPHA, {
            'politician_id': politician_id,
            'category': cat,
        }, 'id')
        collected_ids = {c['id'] for c in collected}
        collected_count = len(collected_ids)
        total_collected += collected_count

        # 평가 데이터 조회
        evaluated = fetch_all_rows(TABLE_EVALUATIONS_ALPHA, {
            'politician_id': politician_id,
            'category': cat,
        })
        evaluated_count = len(evaluated)
        total_evaluated += evaluated_count

        # 1. 미평가 데이터 확인
        evaluated_alpha_ids = {e.get('collected_alpha_id') for e in evaluated if e.get('collected_alpha_id')}
        missing = collected_ids - evaluated_alpha_ids
        missing_count = len(missing)
        total_missing += missing_count

        if missing_count > 0:
            issues.append(f"미평가 {missing_count}개")

        # 2. 등급 분포 분석
        ratings = [e.get('rating', '') for e in evaluated]
        rating_counter = Counter(ratings)

        # 유효하지 않은 등급 체크
        invalid_ratings = [r for r in ratings if r not in VALID_RATINGS]
        if invalid_ratings:
            issues.append(f"잘못된 등급 {len(invalid_ratings)}개: {set(invalid_ratings)}")

        # X(제외) 비율
        x_count = rating_counter.get('X', 0)
        x_ratio = x_count / evaluated_count if evaluated_count > 0 else 0
        if x_ratio > MAX_X_RATIO:
            issues.append(f"X(제외) 과다: {x_ratio:.0%} (기준: {MAX_X_RATIO:.0%})")

        # 편향 감지 (X 제외한 등급 중)
        non_x_ratings = [r for r in ratings if r != 'X' and r in VALID_RATINGS]
        non_x_counter = Counter(non_x_ratings)
        bias_detected = False
        bias_grade = None

        if non_x_ratings:
            most_common_grade, most_common_count = non_x_counter.most_common(1)[0]
            grade_ratio = most_common_count / len(non_x_ratings)
            if grade_ratio > BIAS_THRESHOLD:
                bias_detected = True
                bias_grade = most_common_grade
                issues.append(f"편향 감지: {most_common_grade} = {grade_ratio:.0%} (기준: {BIAS_THRESHOLD:.0%})")

        # 3. reasoning 누락 확인
        reasoning_missing = 0
        for e in evaluated:
            reasoning = e.get('reasoning', '') or ''
            if len(reasoning.strip()) < MIN_REASONING_LENGTH:
                reasoning_missing += 1

        if reasoning_missing > 0:
            issues.append(f"reasoning 누락/부족 {reasoning_missing}개")

        # 4. orphan ID 확인 (수집 데이터에 없는 ID 참조)
        orphan_ids = evaluated_alpha_ids - collected_ids
        orphan_count = len(orphan_ids)
        if orphan_count > 0:
            issues.append(f"orphan ID {orphan_count}개 (수집 데이터 없는 ID 참조)")

        # 결과 저장
        cat_results[cat] = {
            'collected': collected_count,
            'evaluated': evaluated_count,
            'missing': missing_count,
            'rating_dist': dict(rating_counter),
            'x_ratio': x_ratio,
            'bias_detected': bias_detected,
            'bias_grade': bias_grade,
            'reasoning_missing': reasoning_missing,
            'orphan_ids': orphan_count,
            'issues': issues,
        }

        # 출력
        status = '✅' if not issues else '⚠️'
        label = f"[{alpha_type}] {cat} ({ALPHA_CATEGORY_NAMES[cat]})"

        # 등급 분포 한줄 요약
        dist_str = ' '.join(f"{k}:{v}" for k, v in sorted(rating_counter.items()))
        print(f"  {status} {label}")
        print(f"     수집: {collected_count} | 평가: {evaluated_count} | 미평가: {missing_count}")
        print(f"     등급: {dist_str}")

        if issues:
            for issue in issues:
                print(f"     ⚠️ {issue}")
                all_issues.append(f"[{cat}] {issue}")

    # 전체 요약
    overall_pass = len(all_issues) == 0

    print(f"\n{'─'*60}")
    print(f"📊 평가 검증 요약")
    print(f"{'─'*60}")
    print(f"  수집 총: {total_collected}개")
    print(f"  평가 총: {total_evaluated}개")
    print(f"  미평가:  {total_missing}개")

    if overall_pass:
        print(f"\n  ✅ 모든 검증 통과 — Phase 4 (점수 계산) 진행 가능")
    else:
        print(f"\n  ⚠️ {len(all_issues)}개 이슈 발견:")
        for issue in all_issues:
            print(f"     - {issue}")
        print(f"\n  → 이슈 해결 후 재검증 필요")

    print(f"{'═'*60}")

    return {
        'total_collected': total_collected,
        'total_evaluated': total_evaluated,
        'total_missing': total_missing,
        'categories': cat_results,
        'overall_pass': overall_pass,
        'issues': all_issues,
    }


def validate_group(group_name: str):
    """그룹 전체 평가 검증"""
    result = supabase.table(TABLE_COMPETITOR_GROUPS).select('*').eq(
        'group_name', group_name
    ).execute()

    if not result.data:
        print_status(f"'{group_name}' 그룹을 찾을 수 없습니다.", 'error')
        return

    group = result.data[0]
    print(f"\n{'═'*60}")
    print(f"📋 그룹 Alpha 평가 검증 (Phase 3-2): {group_name}")
    print(f"{'═'*60}")

    for pid in group.get('politician_ids', []):
        validate_eval_results(pid)

    print(f"\n{'═'*60}")
    print(f"✅ 그룹 평가 검증 완료")
    print(f"{'═'*60}")


def main():
    parser = argparse.ArgumentParser(description='V60 Alpha 평가 결과 검증 (Phase 3-2)')
    parser.add_argument('--politician-id', type=str, help='정치인 ID')
    parser.add_argument('--group-name', type=str, help='그룹명')
    args = parser.parse_args()

    if args.group_name:
        validate_group(args.group_name)
    elif args.politician_id:
        validate_eval_results(args.politician_id)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
