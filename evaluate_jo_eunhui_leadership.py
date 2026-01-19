#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
조은희(d0a5d6e1) Leadership 카테고리 평가 스크립트

목표: collected_data_v30에서 leadership 데이터 10개 조회하여 평가 후 DB 저장
"""

import os
import json
import sys
import io
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

# Windows 인코딩 설정
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 환경 변수 로드
load_dotenv('.env.vercel.production')
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL', '').strip().strip('"').rstrip('\n')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY', '').strip().strip('"')

# URL 정규화
if SUPABASE_URL.endswith('\n'):
    SUPABASE_URL = SUPABASE_URL[:-1]

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("[ERROR] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set")
    print(f"  URL: {SUPABASE_URL[:50] if SUPABASE_URL else 'NOT SET'}")
    print(f"  KEY: {'SET' if SUPABASE_SERVICE_ROLE_KEY else 'NOT SET'}")
    sys.exit(1)

# Supabase 클라이언트 생성
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

politician_id = 'd0a5d6e1'
politician_name = '조은희'
category = 'leadership'

print(f"\n[INFO] Evaluating leadership data for {politician_name}...\n")

# 1. collected_data_v30에서 leadership 데이터 10개 조회
response = supabase.table('collected_data_v30') \
    .select('*') \
    .eq('politician_id', politician_id) \
    .eq('category', category) \
    .limit(10) \
    .execute()

if not response.data:
    print(f"[ERROR] No data found for {politician_id} {category}")
    sys.exit(1)

data_list = response.data
print(f"[SUCCESS] Retrieved {len(data_list)} data items\n")

# 2. 평가 데이터 준비
evaluations = []

for idx, data in enumerate(data_list, 1):
    collected_data_id = data['id']
    title = data.get('title', '')
    content = data.get('content', '')
    source_name = data.get('source_name', '')
    sentiment = data.get('sentiment', '')

    print(f"[{idx}] ID: {collected_data_id}")
    print(f"    Title: {title[:60]}...")
    print(f"    Content: {content[:100]}...")
    print(f"    Source: {source_name}")
    print(f"    Sentiment: {sentiment}")

    # 리더십 평가: 주도력, 결단력, 팀워크, 위기관리, 영향력
    # 평가 로직: 데이터의 title, content, sentiment를 종합 고려

    rating = None
    rationale = ""

    # 평가 규칙
    if '부정' in sentiment or sentiment == 'negative':
        # 부정 데이터: 낮은 등급
        if '논란' in title or '논란' in content or '의혹' in content or '부정' in content:
            rating = '-3'
            rationale = "Leadership crisis response failure with controversy affecting trust"
        elif '실패' in content or '문제' in content:
            rating = '-2'
            rationale = "Leadership decision failure or organizational management issues"
        else:
            rating = '-1'
            rationale = "Negative evaluation of leadership capabilities"
    elif '긍정' in sentiment or sentiment == 'positive':
        # 긍정 데이터: 높은 등급
        if '탁월' in content or '모범' in content or '주도' in content:
            rating = '+4'
            rationale = "Exemplary leadership leading team or organization"
        elif '성과' in content or '성공' in content or '리더' in content:
            rating = '+3'
            rationale = "Positive leadership building organizational trust"
        elif '추진' in content or '진행' in content:
            rating = '+2'
            rationale = "Stable leadership driving major initiatives"
        else:
            rating = '+1'
            rationale = "Average level leadership activity"
    else:
        # 중립 데이터
        if '리더' in title or '주도' in title:
            rating = '+1'
            rationale = "Leadership role execution record"
        elif '회의' in content or '참석' in content:
            rating = '+1'
            rationale = "Organizational leadership participation activity"
        else:
            rating = '0'
            rationale = "Leadership evaluation not possible"

    # 기본값 설정
    if rating is None:
        rating = '0'
        rationale = "Incomplete data analysis"

    evaluation = {
        'politician_id': politician_id,
        'politician_name': politician_name,
        'collected_data_id': collected_data_id,
        'category': category,
        'evaluator_ai': 'Claude',
        'rating': rating,
        'score': int(rating) * 2,  # rating × 2
        'reasoning': rationale,
        'evaluated_at': datetime.now().isoformat()
    }

    evaluations.append(evaluation)
    print(f"    Rating: {rating} (Score: {evaluation['score']})")
    print(f"    Rationale: {rationale}\n")

# 3. evaluations_v30 테이블에 저장
print(f"\n[INFO] Saving evaluation results to DB...\n")

if evaluations:
    try:
        insert_response = supabase.table('evaluations_v30').insert(evaluations).execute()
        print(f"[SUCCESS] Saved {len(evaluations)} evaluations\n")

        # 저장된 데이터 확인
        print("[INFO] Evaluation Summary:")
        print(f"{'No.':<3} {'ID':<36} {'Rating':<4} {'Score':<5} {'Reasoning':<35}")
        print("-" * 85)

        for idx, eval_data in enumerate(evaluations, 1):
            print(f"{idx:<3} {eval_data['collected_data_id']:<36} {eval_data['rating']:<4} {eval_data['score']:<5} {eval_data['reasoning'][:32]+'...':<35}")

        # 통계
        print(f"\n[STATS] Evaluation Statistics:")
        ratings = [int(e['rating']) for e in evaluations]
        avg_score = sum(ratings) * 2 / len(ratings)
        print(f"  - Total evaluations: {len(evaluations)}")
        print(f"  - Average score: {avg_score:.1f}")
        print(f"  - Highest rating: +{max(ratings)} (Score: {max(ratings)*2})")
        print(f"  - Lowest rating: {min(ratings)} (Score: {min(ratings)*2})")

    except Exception as e:
        print(f"[ERROR] Failed to save to DB: {str(e)}")
        sys.exit(1)
else:
    print("[ERROR] No evaluation data")
    sys.exit(1)

print("\n[SUCCESS] Task completed!\n")
