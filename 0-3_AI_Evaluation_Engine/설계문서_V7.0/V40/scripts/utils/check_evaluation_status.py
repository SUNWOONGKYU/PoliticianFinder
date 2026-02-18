#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V40 평가 현황 확인 스크립트"""

import os
import sys
import argparse
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# .env 로드
V40_DIR = Path(__file__).resolve().parent.parent.parent
env_paths = [V40_DIR.parent.parent / '.env', V40_DIR.parent / '.env', V40_DIR / '.env']
for env_path in env_paths:
    if env_path.exists():
        load_dotenv(env_path, override=True)
        break

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

CATEGORIES = [
    'expertise', 'leadership', 'vision', 'integrity', 'ethics',
    'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'
]
EVAL_AIS = ['Claude', 'ChatGPT', 'Gemini', 'Grok']


def fetch_all_evaluations(politician_id):
    """전체 평가 데이터 조회 (1000행 제한 우회)"""
    all_evals = []
    offset = 0
    while True:
        result = supabase.table('evaluations_v40')\
            .select('category, evaluator_ai')\
            .eq('politician_id', politician_id)\
            .range(offset, offset + 999)\
            .execute()
        if not result.data:
            break
        all_evals.extend(result.data)
        if len(result.data) < 1000:
            break
        offset += 1000
    return all_evals


def main():
    parser = argparse.ArgumentParser(description='V40 평가 현황 확인')
    parser.add_argument('--politician-id', required=True, help='정치인 ID (8자리 hex)')
    parser.add_argument('--politician-name', default='', help='정치인 이름 (표시용)')
    args = parser.parse_args()

    politician_id = args.politician_id
    politician_name = args.politician_name or politician_id

    # 수집 데이터 총 건수
    collected_result = supabase.table('collected_data_v40')\
        .select('id', count='exact')\
        .eq('politician_id', politician_id)\
        .execute()
    total_collected = collected_result.count or 0

    # 평가 데이터 조회
    all_evals = fetch_all_evaluations(politician_id)
    total_evals = len(all_evals)

    print(f'\n{"="*70}')
    print(f'  V40 평가 현황: {politician_name} ({politician_id})')
    print(f'{"="*70}')
    print(f'수집 데이터: {total_collected}개 | 총 평가: {total_evals}개\n')

    # AI별 × 카테고리별 카운트
    counts = {}
    for row in all_evals:
        ai = row['evaluator_ai']
        cat = row['category']
        counts[(ai, cat)] = counts.get((ai, cat), 0) + 1

    # 헤더
    cat_header = f"{'카테고리':<20}"
    for ai in EVAL_AIS:
        cat_header += f" {ai:>8}"
    cat_header += f" {'합계':>8}"
    print(cat_header)
    print("-" * 70)

    all_complete = True
    for cat in CATEGORIES:
        row_str = f"{cat:<20}"
        cat_total = 0
        for ai in EVAL_AIS:
            cnt = counts.get((ai, cat), 0)
            cat_total += cnt
            marker = '' if cnt >= 10 else '⚠'
            row_str += f" {cnt:>7}{marker}"
            if cnt < 10:
                all_complete = False
        row_str += f" {cat_total:>8}"
        print(row_str)

    print("-" * 70)

    # AI별 합계
    ai_totals_str = f"{'AI별 합계':<20}"
    grand_total = 0
    for ai in EVAL_AIS:
        ai_total = sum(counts.get((ai, cat), 0) for cat in CATEGORIES)
        grand_total += ai_total
        ai_totals_str += f" {ai_total:>8}"
    ai_totals_str += f" {grand_total:>8}"
    print(ai_totals_str)
    print("=" * 70)

    # 완료 여부
    expected = total_collected * len(EVAL_AIS)
    completion_pct = (total_evals / expected * 100) if expected > 0 else 0
    print(f"\n예상 총 평가 수: {expected}개 ({total_collected} × {len(EVAL_AIS)}AI)")
    print(f"실제 완료: {total_evals}개 ({completion_pct:.1f}%)")

    if all_complete and total_evals >= expected * 0.95:
        print(f"\n✅ 평가 완료! 다음 단계: Phase 4 점수 계산 (calculate_v40_scores.py)")
    else:
        print(f"\n⚠️ 평가 미완료 - 남은 평가 진행 필요")
        print(f"   미완료 항목은 각 AI 헬퍼 스크립트를 재실행하세요:")
        print(f"   Claude: python scripts/helpers/claude_eval_helper.py --politician_id={politician_id} --category=<카테고리>")
        print(f"   ChatGPT: python scripts/helpers/codex_eval_helper.py --politician_id={politician_id} --category=<카테고리>")
        print(f"   Gemini: python scripts/workflow/evaluate_gemini_subprocess.py --politician '<이름>' --category <카테고리>")
        print(f"   Grok: python scripts/helpers/grok_eval_helper.py --politician_id={politician_id} --category=<카테고리>")


if __name__ == '__main__':
    main()
