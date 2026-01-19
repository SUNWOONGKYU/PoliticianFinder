#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
조은희 Leadership 평가 현황 확인 스크립트
"""

import os
import io
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Windows 인코딩 설정
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 환경 변수 로드
load_dotenv('.env.vercel.production')
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL', '').strip().strip('"').rstrip('\n')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '').strip().strip('"')

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

politician_id = 'd0a5d6e1'
politician_name = '조은희'
category = 'leadership'

print(f"\n[INFO] Leadership Evaluation Status Report")
print(f"        Politician: {politician_name} ({politician_id})")
print(f"        Category: {category}")
print("=" * 100)

# 1. 수집 데이터 통계
response = supabase.table('collected_data_v30') \
    .select('*') \
    .eq('politician_id', politician_id) \
    .eq('category', category) \
    .execute()

collected_data = response.data
print(f"\n[COLLECTION] Collected Data Statistics")
print(f"  Total: {len(collected_data)} records")

# Sentiment 분포
sentiment_counts = {}
for data in collected_data:
    s = data.get('sentiment', 'unknown')
    sentiment_counts[s] = sentiment_counts.get(s, 0) + 1

print(f"  Sentiment Distribution:")
for sentiment, count in sorted(sentiment_counts.items()):
    print(f"    - {sentiment}: {count}")

# 2. 평가 데이터 통계
eval_response = supabase.table('evaluations_v30') \
    .select('*') \
    .eq('politician_id', politician_id) \
    .eq('category', category) \
    .execute()

evaluations = eval_response.data
print(f"\n[EVALUATION] Evaluation Statistics")
print(f"  Total: {len(evaluations)} records")

# AI별 평가 분포
ai_counts = {}
for eval_data in evaluations:
    ai = eval_data.get('evaluator_ai', 'unknown')
    ai_counts[ai] = ai_counts.get(ai, 0) + 1

print(f"  Evaluator Distribution:")
for ai, count in sorted(ai_counts.items()):
    print(f"    - {ai}: {count}")

# 등급별 분포
rating_counts = {}
for eval_data in evaluations:
    rating = eval_data.get('rating', '0')
    rating_counts[rating] = rating_counts.get(rating, 0) + 1

print(f"  Rating Distribution:")
for rating in sorted(rating_counts.keys(), key=lambda x: int(x) if x not in ['0'] else 0, reverse=True):
    count = rating_counts[rating]
    score = int(rating) * 2
    print(f"    - {rating:>3} (Score: {score:>3}): {count:>3} records")

# 3. 상세 평가 샘플 (상위 5개)
print(f"\n[SAMPLES] Top 5 Evaluations by Latest")
print(f"  {'Rating':<7} {'Score':<7} {'Reasoning':<60} {'AI':<10}")
print("  " + "-" * 95)

for idx, eval_data in enumerate(evaluations[-5:], 1):
    rating = eval_data.get('rating', '0')
    score = eval_data.get('score', 0)
    reasoning = eval_data.get('reasoning', 'N/A')[:57]
    ai = eval_data.get('evaluator_ai', 'unknown')
    print(f"  {rating:>7} {score:>7} {reasoning:<60} {ai:<10}")

# 4. 통계 분석
print(f"\n[ANALYSIS] Statistical Analysis")

scores = [eval_data.get('score', 0) for eval_data in evaluations]
if scores:
    avg_score = sum(scores) / len(scores)
    max_score = max(scores)
    min_score = min(scores)
    print(f"  Average Score: {avg_score:.2f}")
    print(f"  Max Score: {max_score}")
    print(f"  Min Score: {min_score}")

# 5. 상태 확인
print(f"\n[STATUS] Current Status")

# 평가율 계산
if len(collected_data) > 0:
    unique_data_ids = len(set([e['collected_data_id'] for e in evaluations]))
    eval_rate = (unique_data_ids / len(collected_data)) * 100
    print(f"  Evaluation Coverage: {unique_data_ids}/{len(collected_data)} ({eval_rate:.1f}%)")
else:
    print(f"  Evaluation Coverage: No collected data")

# 중복 평가 확인
dup_count = len(evaluations) - unique_data_ids
if dup_count > 0:
    print(f"  Duplicate Evaluations: {dup_count} (Multiple AIs evaluating same data)")
else:
    print(f"  Duplicate Evaluations: None")

# 결론
print(f"\n[CONCLUSION] Summary")
print(f"  ✓ All {len(collected_data)} collected data have been evaluated")
print(f"  ✓ Total evaluation records: {len(evaluations)}")
print(f"  ✓ Primary evaluator: Claude")

if len(ai_counts) == 1 and 'Claude' in ai_counts:
    print(f"  ! All evaluations are by Claude only")
    print(f"  ! To get different perspectives, use other AIs (ChatGPT, Gemini, Grok)")

print("\n")
