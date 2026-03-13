# -*- coding: utf-8 -*-
"""
V60 CCI 통합 점수 계산 스크립트

GPI(40%) + Alpha 1(30%) + Alpha 2(30%) → CCI 통합 점수 계산

프로세스:
  1. GPI 점수 조회 (ai_final_scores_v60)
  2. Alpha 카테고리별 평균 레이팅 → 점수 변환
  3. Alpha 1/2 합계 계산
  4. CCI 통합 점수 = GPI×0.4 + A1×0.3 + A2×0.3
  5. 경쟁자 그룹 내 순위 산정
  6. cci_scores_v60 저장

사용법:
    # 단일 정치인
    python calculate_cci_scores.py --politician-id 17270f25

    # 그룹 전체 (순위 포함)
    python calculate_cci_scores.py --group-name "2026 서울시장"
"""

import sys
import argparse
from pathlib import Path
from datetime import datetime

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'helpers'))
from common_cci import (
    supabase,
    ALPHA1_CATEGORIES, ALPHA2_CATEGORIES, ALPHA_CATEGORIES,
    ALPHA_TYPE_MAP, ALPHA_CATEGORY_NAMES,
    RATING_TO_SCORE, PRIOR, COEFFICIENT,
    CCI_WEIGHT_GPI, CCI_WEIGHT_ALPHA1, CCI_WEIGHT_ALPHA2,
    GIVE_UP_THRESHOLD,
    TABLE_FINAL_SCORES_GPI, TABLE_EVALUATIONS_ALPHA, TABLE_ALPHA_SCORES,
    TABLE_CCI_SCORES, TABLE_COMPETITOR_GROUPS,
    get_politician_info, get_competitor_group, fetch_all_rows,
    calculate_category_score, get_grade, print_status
)


def calculate_alpha_scores(politician_id: str, group_id: str = None) -> dict:
    """Alpha 카테고리별 점수 계산

    Returns:
        {
            'opinion': 72.5, 'media': 68.0, 'risk': 75.0,
            'party': 80.0, 'candidate': 65.0, 'regional': 70.0,
            'alpha1_total': 71.8, 'alpha2_total': 71.7
        }
    """
    scores = {}

    for cat in ALPHA_CATEGORIES:
        alpha_type = ALPHA_TYPE_MAP[cat]

        # 평가 데이터 조회
        evals = fetch_all_rows(TABLE_EVALUATIONS_ALPHA, {
            'politician_id': politician_id,
            'category': cat,
        })

        # X 제외, 유효 평가만
        valid_evals = [e for e in evals if e.get('rating') and e['rating'] != 'X']

        if len(valid_evals) < GIVE_UP_THRESHOLD:
            # 데이터 부족 → leverage score 0 (60점)
            cat_score = calculate_category_score(0)
            print_status(f"  [{cat}] 평가 {len(valid_evals)}개 < {GIVE_UP_THRESHOLD} → 60점 (leverage 0)", 'warn')
        else:
            # 평균 계산
            total_score = sum(RATING_TO_SCORE.get(e['rating'], 0) for e in valid_evals)
            avg_score = total_score / len(valid_evals)
            cat_score = calculate_category_score(avg_score)

        scores[cat] = round(cat_score)

        # alpha_scores_v60 저장
        avg_rating = 0
        if valid_evals:
            ratings_numeric = [RATING_TO_SCORE.get(e['rating'], 0) / 2 for e in valid_evals]
            avg_rating = sum(ratings_numeric) / len(ratings_numeric)

        score_row = {
            'politician_id': politician_id,
            'alpha_type': alpha_type,
            'category': cat,
            'avg_rating': round(avg_rating, 2),
            'category_score': scores[cat],
            'total_evaluations': len(valid_evals),
            'calculated_at': datetime.now().isoformat(),
        }
        if group_id:
            score_row['competitor_group_id'] = group_id

        # Upsert
        try:
            existing = supabase.table(TABLE_ALPHA_SCORES).select('id').eq(
                'politician_id', politician_id
            ).eq('category', cat).execute()

            if existing.data:
                supabase.table(TABLE_ALPHA_SCORES).update(score_row).eq(
                    'id', existing.data[0]['id']
                ).execute()
            else:
                supabase.table(TABLE_ALPHA_SCORES).insert(score_row).execute()
        except Exception as e:
            print_status(f"  [{cat}] 점수 저장 오류: {e}", 'error')

    # Alpha 합계 (3개 카테고리 균등 평균)
    a1_scores = [scores[c] for c in ALPHA1_CATEGORIES]
    a2_scores = [scores[c] for c in ALPHA2_CATEGORIES]

    scores['alpha1_total'] = round(sum(a1_scores) / len(a1_scores))
    scores['alpha2_total'] = round(sum(a2_scores) / len(a2_scores))

    return scores


def calculate_cci(politician_id: str, group_id: str = None):
    """CCI 통합 점수 계산"""
    info = get_politician_info(politician_id)
    name = info.get('name', '?') if info else '?'

    print(f"\n{'─'*50}")
    print(f"🔢 CCI 점수 계산: {name} ({politician_id})")
    print(f"{'─'*50}")

    # 1. GPI 점수 조회
    gpi_result = supabase.table(TABLE_FINAL_SCORES_GPI).select('*').eq(
        'politician_id', politician_id
    ).execute()

    if not gpi_result.data:
        print_status("GPI 점수 없음 — GPI 파이프라인을 먼저 완료하세요.", 'error')
        return None

    gpi = gpi_result.data[0]
    gpi_score = gpi['final_score']
    gpi_grade = gpi['grade']

    print(f"  GPI: {gpi_score}점 ({gpi_grade})")

    # 2. Alpha 점수 계산
    alpha_scores = calculate_alpha_scores(politician_id, group_id)

    print(f"  Alpha 1 (민심·여론): {alpha_scores['alpha1_total']}점")
    print(f"    opinion={alpha_scores['opinion']}, media={alpha_scores['media']}, risk={alpha_scores['risk']}")
    print(f"  Alpha 2 (선거구조): {alpha_scores['alpha2_total']}점")
    print(f"    party={alpha_scores['party']}, candidate={alpha_scores['candidate']}, regional={alpha_scores['regional']}")

    # 3. CCI 통합 점수 계산
    # GPI: 200~1000 / Alpha1: 200~1000 / Alpha2: 200~1000 → 동일 스케일 가중합
    a1_total = alpha_scores['alpha1_total']
    a2_total = alpha_scores['alpha2_total']

    cci_score = round(
        gpi_score * CCI_WEIGHT_GPI +
        a1_total * CCI_WEIGHT_ALPHA1 +
        a2_total * CCI_WEIGHT_ALPHA2
    )

    print(f"\n  CCI = {gpi_score}×{CCI_WEIGHT_GPI} + {a1_total}×{CCI_WEIGHT_ALPHA1} + {a2_total}×{CCI_WEIGHT_ALPHA2}")
    print(f"  CCI = {cci_score}점")

    # 4. 저장
    cci_row = {
        'politician_id': politician_id,
        'gpi_score': gpi_score,
        'gpi_grade': gpi_grade,
        'alpha1_opinion_score': alpha_scores['opinion'],
        'alpha1_media_score': alpha_scores['media'],
        'alpha1_risk_score': alpha_scores['risk'],
        'alpha1_total': a1_total,
        'alpha2_party_score': alpha_scores['party'],
        'alpha2_candidate_score': alpha_scores['candidate'],
        'alpha2_regional_score': alpha_scores['regional'],
        'alpha2_total': a2_total,
        'cci_score': cci_score,
        'calculated_at': datetime.now().isoformat(),
    }
    if group_id:
        cci_row['competitor_group_id'] = group_id

    try:
        existing = supabase.table(TABLE_CCI_SCORES).select('id').eq(
            'politician_id', politician_id
        ).execute()

        if group_id:
            existing = supabase.table(TABLE_CCI_SCORES).select('id').eq(
                'politician_id', politician_id
            ).eq('competitor_group_id', group_id).execute()

        if existing.data:
            supabase.table(TABLE_CCI_SCORES).update(cci_row).eq(
                'id', existing.data[0]['id']
            ).execute()
        else:
            supabase.table(TABLE_CCI_SCORES).insert(cci_row).execute()

        print_status(f"CCI 점수 저장 완료: {cci_score}점", 'ok')
    except Exception as e:
        print_status(f"CCI 점수 저장 오류: {e}", 'error')

    return cci_score


def calculate_group_rankings(group_name: str):
    """경쟁자 그룹 전체 CCI 계산 + 순위 산정"""
    result = supabase.table(TABLE_COMPETITOR_GROUPS).select('*').eq(
        'group_name', group_name
    ).execute()

    if not result.data:
        print_status(f"'{group_name}' 그룹을 찾을 수 없습니다.", 'error')
        return

    group = result.data[0]
    group_id = group['id']
    politician_ids = group.get('politician_ids', [])

    print(f"\n{'═'*60}")
    print(f"🏆 그룹 CCI 계산: {group_name} ({len(politician_ids)}명)")
    print(f"{'═'*60}")

    # 각 후보 CCI 계산
    cci_results = []
    for pid in politician_ids:
        cci_score = calculate_cci(pid, group_id)
        if cci_score is not None:
            info = get_politician_info(pid)
            cci_results.append({
                'politician_id': pid,
                'name': info.get('name', '?') if info else '?',
                'party': info.get('party', '?') if info else '?',
                'cci_score': cci_score,
            })

    # 순위 산정
    cci_results.sort(key=lambda x: x['cci_score'], reverse=True)

    print(f"\n{'═'*60}")
    print(f"📊 {group_name} CCI 순위")
    print(f"{'═'*60}")
    print(f"{'순위':<5} {'CCI':>8}  {'이름':<10} {'정당':<15}")
    print(f"{'─'*60}")

    for rank, r in enumerate(cci_results, 1):
        # 순위 업데이트
        try:
            supabase.table(TABLE_CCI_SCORES).update({
                'cci_rank': rank,
                'cci_grade': _cci_grade(rank, len(cci_results)),
            }).eq('politician_id', r['politician_id']).eq(
                'competitor_group_id', group_id
            ).execute()
        except Exception:
            pass

        print(f"{rank:<5} {r['cci_score']:>8}  {r['name']:<10} {r['party']:<15}")

    print(f"{'═'*60}")


def _cci_grade(rank: int, total: int) -> str:
    """순위 → CCI 등급"""
    if total <= 2:
        return '선두' if rank == 1 else '추격'
    pct = rank / total
    if pct <= 0.2:
        return '압도적 선두'
    elif pct <= 0.4:
        return '경쟁 우위'
    elif pct <= 0.6:
        return '경합'
    elif pct <= 0.8:
        return '열세'
    else:
        return '후순위'


def main():
    parser = argparse.ArgumentParser(description='V60 CCI 통합 점수 계산')
    parser.add_argument('--politician-id', type=str, help='정치인 ID')
    parser.add_argument('--group-name', type=str, help='그룹 전체 계산 + 순위')
    args = parser.parse_args()

    if args.group_name:
        calculate_group_rankings(args.group_name)
    elif args.politician_id:
        calculate_cci(args.politician_id)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
