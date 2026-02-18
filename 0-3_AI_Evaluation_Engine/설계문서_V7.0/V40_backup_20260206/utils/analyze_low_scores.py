# -*- coding: utf-8 -*-
"""
낮은 점수 카테고리 상세 분석 스크립트
"""

import os
import sys
from collections import Counter
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

TABLE_EVALUATIONS = "evaluations_v30"
TABLE_COLLECTED = "collected_data_v30"

RATING_TO_SCORE = {
    '+4': 8, '+3': 6, '+2': 4, '+1': 2,
    '-1': -2, '-2': -4, '-3': -6, '-4': -8
}

def analyze_category(politician_id, category_name, category_korean):
    """카테고리 상세 분석"""
    print(f"\n{'='*80}")
    print(f"📊 {category_korean} ({category_name}) 상세 분석")
    print(f"{'='*80}\n")

    # 1. 평가 데이터 조회
    result = supabase.table(TABLE_EVALUATIONS).select('*').eq(
        'politician_id', politician_id
    ).eq('category', category_name.lower()).execute()

    if not result.data:
        print("평가 데이터가 없습니다.")
        return

    evaluations = result.data
    total_count = len(evaluations)

    print(f"총 평가 개수: {total_count}개\n")

    # 2. 등급 분포 분석
    print(f"{'─'*80}")
    print(f"📈 등급 분포")
    print(f"{'─'*80}\n")

    ratings = [ev['rating'] for ev in evaluations]
    rating_counts = Counter(ratings)

    # 등급별 집계
    positive_counts = {'+4': 0, '+3': 0, '+2': 0, '+1': 0}
    negative_counts = {'-1': 0, '-2': 0, '-3': 0, '-4': 0}

    for rating, count in rating_counts.items():
        if rating.startswith('+'):
            positive_counts[rating] = count
        else:
            negative_counts[rating] = count

    total_positive = sum(positive_counts.values())
    total_negative = sum(negative_counts.values())

    print("긍정 평가:")
    for rating in ['+4', '+3', '+2', '+1']:
        count = positive_counts[rating]
        pct = (count / total_count * 100) if total_count > 0 else 0
        score = RATING_TO_SCORE[rating]
        print(f"  {rating} ({score:+3d}점): {count:4d}개 ({pct:5.1f}%)")

    print(f"\n부정 평가:")
    for rating in ['-1', '-2', '-3', '-4']:
        count = negative_counts[rating]
        pct = (count / total_count * 100) if total_count > 0 else 0
        score = RATING_TO_SCORE[rating]
        print(f"  {rating} ({score:+3d}점): {count:4d}개 ({pct:5.1f}%)")

    positive_pct = (total_positive / total_count * 100) if total_count > 0 else 0
    negative_pct = (total_negative / total_count * 100) if total_count > 0 else 0

    print(f"\n총계:")
    print(f"  긍정 (+1 이상): {total_positive:4d}개 ({positive_pct:5.1f}%)")
    print(f"  부정 (-1 이하): {total_negative:4d}개 ({negative_pct:5.1f}%)")

    # 3. AI별 평균 점수
    print(f"\n{'─'*80}")
    print(f"🤖 AI별 평가 경향")
    print(f"{'─'*80}\n")

    ais = ['Claude', 'ChatGPT', 'Gemini', 'Grok']
    ai_scores = {}

    for ai in ais:
        ai_evals = [ev for ev in evaluations if ev['evaluator_ai'] == ai]
        if ai_evals:
            scores = [RATING_TO_SCORE.get(ev['rating'], 0) for ev in ai_evals]
            avg_score = sum(scores) / len(scores) if scores else 0
            ai_scores[ai] = (avg_score, len(ai_evals))
            print(f"  {ai:10s}: 평균 {avg_score:+.2f}점 ({len(ai_evals)}개 평가)")

    # 4. 부정 평가 주요 근거 분석
    print(f"\n{'─'*80}")
    print(f"⚠️ 부정 평가 (-2 이하) 주요 근거")
    print(f"{'─'*80}\n")

    negative_evals = [ev for ev in evaluations if ev['rating'] in ['-2', '-3', '-4']]

    if negative_evals:
        print(f"부정 평가 {len(negative_evals)}개 중 주요 사례:\n")

        # AI별로 그룹화
        for ai in ais:
            ai_negatives = [ev for ev in negative_evals if ev['evaluator_ai'] == ai]
            if ai_negatives:
                print(f"[{ai}] ({len(ai_negatives)}개)")
                # 가장 낮은 평가 3개만 출력
                sorted_negatives = sorted(ai_negatives, key=lambda x: RATING_TO_SCORE[x['rating']])
                for ev in sorted_negatives[:3]:
                    rating = ev['rating']
                    score = RATING_TO_SCORE[rating]
                    reasoning = ev.get('reasoning', 'N/A')[:200]
                    print(f"  {rating} ({score:+3d}점): {reasoning}...")
                print()
    else:
        print("부정 평가가 없습니다.\n")

    # 5. 긍정 평가가 적은 이유 분석
    print(f"{'─'*80}")
    print(f"💡 점수 하락 원인 분석")
    print(f"{'─'*80}\n")

    high_positive = sum([positive_counts['+4'], positive_counts['+3']])
    high_positive_pct = (high_positive / total_count * 100) if total_count > 0 else 0

    print(f"고평가 (+3, +4) 비율: {high_positive_pct:.1f}%")
    print(f"부정 평가 비율: {negative_pct:.1f}%")

    if negative_pct > 20:
        print(f"\n⚠️ 주요 원인: 부정 평가가 {negative_pct:.1f}%로 높음")
        print(f"   - 논란/문제/비판 관련 데이터가 많이 수집됨")
    elif high_positive_pct < 30:
        print(f"\n⚠️ 주요 원인: 고평가(+3, +4)가 {high_positive_pct:.1f}%로 낮음")
        print(f"   - 탁월한 성과나 모범 사례가 부족함")
        print(f"   - 대부분 보통(+1, +2) 수준의 평가")

    # 6. 수집된 데이터 분석
    print(f"\n{'─'*80}")
    print(f"📦 수집 데이터 특성")
    print(f"{'─'*80}\n")

    collected_result = supabase.table(TABLE_COLLECTED).select('*').eq(
        'politician_id', politician_id
    ).eq('category', category_name.lower()).execute()

    if collected_result.data:
        collected = collected_result.data
        sentiments = Counter([item.get('sentiment', 'unknown') for item in collected])

        print(f"수집 데이터 {len(collected)}개:")
        for sentiment, count in sentiments.most_common():
            pct = (count / len(collected) * 100) if collected else 0
            print(f"  {sentiment}: {count}개 ({pct:.1f}%)")

        if sentiments.get('negative', 0) > sentiments.get('positive', 0):
            print(f"\n⚠️ 부정 데이터가 긍정 데이터보다 많음")
            print(f"   → 논란/비판 관련 기사/발언이 더 많이 수집됨")

def main():
    import argparse

    parser = argparse.ArgumentParser(description='낮은 점수 카테고리 분석')
    parser.add_argument('--politician_id', required=True, help='정치인 ID')
    parser.add_argument('--categories', nargs='+', required=True, help='카테고리 목록 (integrity ethics)')
    args = parser.parse_args()

    category_map = {
        'integrity': '청렴성',
        'ethics': '윤리성',
        'expertise': '전문성',
        'leadership': '리더십',
        'vision': '비전',
        'accountability': '책임감',
        'transparency': '투명성',
        'communication': '소통능력',
        'responsiveness': '대응성',
        'publicinterest': '공익성'
    }

    for category in args.categories:
        korean_name = category_map.get(category, category)
        analyze_category(args.politician_id, category, korean_name)

if __name__ == "__main__":
    main()
