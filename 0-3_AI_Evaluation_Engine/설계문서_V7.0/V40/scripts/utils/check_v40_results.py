# -*- coding: utf-8 -*-
"""
V40 평가 결과 확인 스크립트
"""

import os
import sys
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

# 환경 변수 로드
load_dotenv(override=True)

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

TABLE_EVALUATIONS = "evaluations_v40"
TABLE_COLLECTED = "collected_data_v40"

CATEGORIES = [
    ("expertise", "전문성"),
    ("leadership", "리더십"),
    ("vision", "비전"),
    ("integrity", "청렴성"),
    ("ethics", "윤리성"),
    ("accountability", "책임감"),
    ("transparency", "투명성"),
    ("communication", "소통능력"),
    ("responsiveness", "대응성"),
    ("publicinterest", "공익성")
]

AIS = ["Claude", "ChatGPT", "Gemini", "Grok"]

def check_results(politician_id):
    """V40 평가 결과 상세 확인"""
    print(f"\n{'='*80}")
    print(f"V40 평가 결과 확인: {politician_id}")
    print(f"{'='*80}\n")

    # 전체 통계
    total_eval_result = supabase.table(TABLE_EVALUATIONS).select('id', count='exact').eq(
        'politician_id', politician_id
    ).execute()
    total_evaluations = total_eval_result.count if total_eval_result.count else 0

    total_collected_result = supabase.table(TABLE_COLLECTED).select('id', count='exact').eq(
        'politician_id', politician_id
    ).execute()
    total_collected = total_collected_result.count if total_collected_result.count else 0

    expected_evaluations = total_collected * 4  # 4개 AI

    print(f"📊 전체 통계:")
    print(f"   수집 데이터: {total_collected}개")
    print(f"   예상 평가: {expected_evaluations}개 ({total_collected} × 4 AIs)")
    print(f"   실제 평가: {total_evaluations}개")
    print(f"   완료율: {(total_evaluations/expected_evaluations*100) if expected_evaluations > 0 else 0:.1f}%\n")

    # AI별 통계
    print(f"\n{'='*80}")
    print(f"AI별 평가 현황")
    print(f"{'='*80}\n")

    ai_stats = {}
    for ai in AIS:
        ai_result = supabase.table(TABLE_EVALUATIONS).select('id', count='exact').eq(
            'politician_id', politician_id
        ).eq('evaluator_ai', ai).execute()
        count = ai_result.count if ai_result.count else 0
        ai_stats[ai] = count
        completion_rate = (count / total_collected * 100) if total_collected > 0 else 0
        print(f"  {ai:10s}: {count:4d}개 ({completion_rate:5.1f}%)")

    # 카테고리별 상세 통계
    print(f"\n{'='*80}")
    print(f"카테고리별 평가 현황")
    print(f"{'='*80}\n")

    print(f"{'카테고리':<12} | {'수집':>4} | {'예상':>4} | {'실제':>4} | {'완료율':>6} | AI별 (Claude/ChatGPT/Gemini/Grok)")
    print(f"{'-'*80}")

    category_stats = {}
    for cat_eng, cat_kor in CATEGORIES:
        # 수집 데이터 개수
        collected_result = supabase.table(TABLE_COLLECTED).select('id', count='exact').eq(
            'politician_id', politician_id
        ).eq('category', cat_eng.lower()).execute()
        collected_count = collected_result.count if collected_result.count else 0

        # 평가 데이터 개수
        eval_result = supabase.table(TABLE_EVALUATIONS).select('id', count='exact').eq(
            'politician_id', politician_id
        ).eq('category', cat_eng.lower()).execute()
        eval_count = eval_result.count if eval_result.count else 0

        expected_count = collected_count * 4
        completion_rate = (eval_count / expected_count * 100) if expected_count > 0 else 0

        # AI별 개수
        ai_counts = []
        for ai in AIS:
            ai_cat_result = supabase.table(TABLE_EVALUATIONS).select('id', count='exact').eq(
                'politician_id', politician_id
            ).eq('category', cat_eng.lower()).eq('evaluator_ai', ai).execute()
            ai_cat_count = ai_cat_result.count if ai_cat_result.count else 0
            ai_counts.append(ai_cat_count)

        category_stats[cat_eng] = {
            'collected': collected_count,
            'expected': expected_count,
            'evaluated': eval_count,
            'completion_rate': completion_rate,
            'ai_counts': ai_counts
        }

        ai_counts_str = f"{ai_counts[0]:3d}/{ai_counts[1]:3d}/{ai_counts[2]:3d}/{ai_counts[3]:3d}"
        print(f"{cat_kor:<12} | {collected_count:4d} | {expected_count:4d} | {eval_count:4d} | {completion_rate:5.1f}% | {ai_counts_str}")

    # 문제 카테고리 식별
    print(f"\n{'='*80}")
    print(f"⚠️ 미완료 카테고리 (90% 미만)")
    print(f"{'='*80}\n")

    incomplete_categories = []
    for cat_eng, cat_kor in CATEGORIES:
        stats = category_stats[cat_eng]
        if stats['completion_rate'] < 90:
            incomplete_categories.append((cat_kor, stats))
            print(f"  ❌ {cat_kor}: {stats['evaluated']}/{stats['expected']} ({stats['completion_rate']:.1f}%)")
            for i, ai in enumerate(AIS):
                ai_completion = (stats['ai_counts'][i] / stats['collected'] * 100) if stats['collected'] > 0 else 0
                if ai_completion < 90:
                    print(f"      - {ai}: {stats['ai_counts'][i]}/{stats['collected']} ({ai_completion:.1f}%)")

    if not incomplete_categories:
        print("  ✅ 모든 카테고리 90% 이상 완료!")

    print(f"\n{'='*80}\n")

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='V40 평가 결과 확인')
    parser.add_argument('--politician_id', required=True, help='정치인 ID')
    args = parser.parse_args()

    check_results(args.politician_id)
