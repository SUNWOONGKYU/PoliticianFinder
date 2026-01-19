# -*- coding: utf-8 -*-
"""조은희 청렴성 평가 리포트"""

import os
import sys
from supabase import create_client
from dotenv import load_dotenv
from collections import Counter

# UTF-8 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

load_dotenv(override=True)

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

politician_id = 'd0a5d6e1'
category = 'integrity'

print("=" * 70)
print("조은희 (Jo Eun-hui) - 청렴성(integrity) 평가 리포트")
print("=" * 70)

# Collected data
try:
    collected_result = supabase.table('collected_data_v30') \
        .select('id, title, collector_ai, data_type, published_date', count='exact') \
        .eq('politician_id', politician_id) \
        .eq('category', category) \
        .execute()

    collected_items = collected_result.data if collected_result.data else []
    collected_count = collected_result.count if collected_result.count else 0

    print(f"\n📊 수집된 데이터 통계")
    print(f"   총 항목: {collected_count}개")

    # AI별 분포
    ai_dist = Counter([item.get('collector_ai') for item in collected_items])
    print(f"   AI별 분포:")
    for ai, count in sorted(ai_dist.items()):
        print(f"      - {ai}: {count}개")

    # Data type 분포
    data_type_dist = Counter([item.get('data_type') for item in collected_items])
    print(f"   Data type별 분포:")
    for dtype, count in sorted(data_type_dist.items()):
        print(f"      - {dtype}: {count}개")

except Exception as e:
    print(f"❌ 수집 데이터 조회 실패: {e}")

# Evaluations
try:
    eval_result = supabase.table('evaluations_v30') \
        .select('id, rating, evaluator_ai, score', count='exact') \
        .eq('politician_id', politician_id) \
        .eq('category', category) \
        .execute()

    eval_items = eval_result.data if eval_result.data else []
    eval_count = eval_result.count if eval_result.count else 0

    print(f"\n📋 평가 결과 통계")
    print(f"   총 평가: {eval_count}개")

    # AI별 평가 분포
    ai_eval_dist = Counter([item.get('evaluator_ai') for item in eval_items])
    print(f"   평가자 AI 분포:")
    for ai, count in sorted(ai_eval_dist.items()):
        print(f"      - {ai}: {count}개")

    # 등급 분포
    rating_dist = Counter([item.get('rating') for item in eval_items])
    print(f"   등급 분포:")
    for rating in ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4']:
        count = rating_dist.get(rating, 0)
        if count > 0:
            print(f"      - {rating}: {count}개")

    # 평균 점수
    scores = [item.get('score', 0) for item in eval_items if item.get('score') is not None]
    if scores:
        avg_score = sum(scores) / len(scores)
        total_score = sum(scores)
        print(f"   점수 통계:")
        print(f"      - 총점: {total_score}")
        print(f"      - 평균: {avg_score:.2f}")
        print(f"      - 범위: {min(scores)} ~ {max(scores)}")

except Exception as e:
    print(f"❌ 평가 데이터 조회 실패: {e}")

# Sample evaluations
print(f"\n📝 샘플 평가 (5개)")
try:
    sample_result = supabase.table('evaluations_v30') \
        .select('rating, reasoning') \
        .eq('politician_id', politician_id) \
        .eq('category', category) \
        .limit(5) \
        .execute()

    if sample_result.data:
        for i, item in enumerate(sample_result.data, 1):
            print(f"\n   [{i}] 등급: {item.get('rating')}")
            print(f"      근거: {item.get('reasoning', 'N/A')[:100]}")

except Exception as e:
    print(f"❌ 샘플 조회 실패: {e}")

print(f"\n{'='*70}\n")
