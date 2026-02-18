#!/usr/bin/env python3
"""
V40 AI 성향 분석 스크립트
AI별 평가 성향 및 일관성 분석
"""

import os
import sys
from pathlib import Path
from collections import defaultdict
import statistics

# V40 루트로 경로 설정
SCRIPT_DIR = Path(__file__).parent
V40_ROOT = SCRIPT_DIR.parent.parent
sys.path.insert(0, str(V40_ROOT))

from dotenv import load_dotenv
load_dotenv(V40_ROOT / '.env')

from supabase import create_client

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

POLITICIANS = [
    {'id': '8c5dcc89', 'name': '박주민', 'party': '더불어민주당'},
    {'id': 'd0a5d6e1', 'name': '조은희', 'party': '국민의힘'}
]

CATEGORIES = [
    'expertise', 'leadership', 'vision', 'integrity', 'ethics',
    'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'
]

CATEGORY_KR = {
    'expertise': '전문성',
    'leadership': '리더십',
    'vision': '비전',
    'integrity': '청렴성',
    'ethics': '윤리성',
    'accountability': '책임감',
    'transparency': '투명성',
    'communication': '소통능력',
    'responsiveness': '대응성',
    'publicinterest': '공익성'
}

AIS = ['Claude', 'ChatGPT', 'Gemini', 'Grok']

def get_evaluations():
    """모든 평가 데이터 가져오기"""
    result = supabase.table('evaluations_v40').select('*').execute()
    return result.data

def calculate_rating_distribution(evals):
    """AI별 등급 분포 계산"""
    dist = defaultdict(lambda: defaultdict(int))

    for ev in evals:
        ai = ev['evaluator_ai']
        rating = ev['rating']
        if rating != 'X':
            dist[ai][rating] += 1

    return dist

def calculate_average_by_ai_category(evals):
    """AI별, 카테고리별 평균 점수"""
    scores = defaultdict(lambda: defaultdict(list))

    for ev in evals:
        ai = ev['evaluator_ai']
        cat = ev['category']
        rating = ev['rating']

        if rating == 'X':
            continue

        score = int(rating)
        scores[ai][cat].append(score)

    # 평균 계산
    averages = {}
    for ai in AIS:
        averages[ai] = {}
        for cat in CATEGORIES:
            if scores[ai][cat]:
                averages[ai][cat] = statistics.mean(scores[ai][cat])
            else:
                averages[ai][cat] = None

    return averages

def calculate_exclusion_rate(evals):
    """AI별 제외(X) 비율"""
    total = defaultdict(int)
    excluded = defaultdict(int)

    for ev in evals:
        ai = ev['evaluator_ai']
        total[ai] += 1
        if ev['rating'] == 'X':
            excluded[ai] += 1

    rates = {}
    for ai in AIS:
        if total[ai] > 0:
            rates[ai] = (excluded[ai] / total[ai]) * 100
        else:
            rates[ai] = 0

    return rates, excluded, total

def calculate_politician_bias(evals):
    """정치인별 AI 성향 분석"""
    scores = defaultdict(lambda: defaultdict(list))

    for ev in evals:
        ai = ev['evaluator_ai']
        pol_id = ev['politician_id']
        rating = ev['rating']

        if rating == 'X':
            continue

        score = int(rating)
        scores[pol_id][ai].append(score)

    # 평균 계산
    averages = {}
    for pol in POLITICIANS:
        pol_id = pol['id']
        averages[pol_id] = {}
        for ai in AIS:
            if scores[pol_id][ai]:
                averages[pol_id][ai] = statistics.mean(scores[pol_id][ai])
            else:
                averages[pol_id][ai] = None

    return averages

def analyze_consistency():
    """AI 간 일관성 분석"""
    import sys
    if sys.platform == 'win32':
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    evals = get_evaluations()

    print("=" * 80)
    print("V40 AI 성향 분석")
    print("=" * 80)
    print()

    # 1. AI별 등급 분포
    print("📊 1. AI별 등급 분포")
    print("-" * 80)
    dist = calculate_rating_distribution(evals)

    for ai in AIS:
        print(f"\n[{ai}]")
        total = sum(dist[ai].values())
        for rating in ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4']:
            count = dist[ai].get(rating, 0)
            pct = (count / total * 100) if total > 0 else 0
            print(f"  {rating:>3}: {count:>4}개 ({pct:>5.1f}%)")

    print("\n" + "=" * 80)

    # 2. AI별 평균 점수 (카테고리별)
    print("\n📊 2. AI별 카테고리별 평균 점수")
    print("-" * 80)
    averages = calculate_average_by_ai_category(evals)

    # 헤더
    print(f"{'카테고리':<12}", end="")
    for ai in AIS:
        print(f"{ai:>10}", end="")
    print(f"{'  편차':>10}")
    print("-" * 80)

    for cat in CATEGORIES:
        cat_kr = CATEGORY_KR[cat]
        print(f"{cat_kr:<12}", end="")

        cat_scores = []
        for ai in AIS:
            avg = averages[ai][cat]
            if avg is not None:
                print(f"{avg:>10.2f}", end="")
                cat_scores.append(avg)
            else:
                print(f"{'N/A':>10}", end="")

        if len(cat_scores) >= 2:
            std_dev = statistics.stdev(cat_scores)
            print(f"{std_dev:>10.2f}")
        else:
            print(f"{'N/A':>10}")

    print("\n" + "=" * 80)

    # 3. AI별 제외율
    print("\n📊 3. AI별 제외(X) 비율")
    print("-" * 80)
    rates, excluded, total = calculate_exclusion_rate(evals)

    for ai in AIS:
        print(f"{ai:<10}: {excluded[ai]:>4}/{total[ai]:>4} ({rates[ai]:>5.1f}%)")

    print("\n" + "=" * 80)

    # 4. 정치인별 AI 성향
    print("\n📊 4. 정치인별 AI 평가 성향")
    print("-" * 80)
    pol_avg = calculate_politician_bias(evals)

    for pol in POLITICIANS:
        pol_id = pol['id']
        pol_name = pol['name']
        pol_party = pol['party']

        print(f"\n[{pol_name} - {pol_party}]")

        ai_scores = []
        for ai in AIS:
            avg = pol_avg[pol_id][ai]
            if avg is not None:
                print(f"  {ai:<10}: 평균 {avg:>+5.2f}")
                ai_scores.append((ai, avg))

        if len(ai_scores) >= 2:
            ai_scores.sort(key=lambda x: x[1], reverse=True)
            highest = ai_scores[0]
            lowest = ai_scores[-1]
            diff = highest[1] - lowest[1]

            print(f"\n  최고: {highest[0]} ({highest[1]:>+5.2f})")
            print(f"  최저: {lowest[0]} ({lowest[1]:>+5.2f})")
            print(f"  편차: {diff:>5.2f}")

    print("\n" + "=" * 80)

    # 5. 성향 분석 결론
    print("\n🔍 5. AI 성향 분석 결론")
    print("-" * 80)

    # AI별 전체 평균
    all_scores = defaultdict(list)
    for ev in evals:
        ai = ev['evaluator_ai']
        rating = ev['rating']
        if rating != 'X':
            all_scores[ai].append(int(rating))

    ai_overall = []
    for ai in AIS:
        if all_scores[ai]:
            avg = statistics.mean(all_scores[ai])
            ai_overall.append((ai, avg))

    ai_overall.sort(key=lambda x: x[1], reverse=True)

    print("\nAI별 전체 평균 점수:")
    for ai, avg in ai_overall:
        tendency = ""
        if avg > 3.5:
            tendency = "매우 관대"
        elif avg > 2.5:
            tendency = "관대"
        elif avg > 1.5:
            tendency = "중립"
        elif avg > 0.5:
            tendency = "엄격"
        else:
            tendency = "매우 엄격"

        print(f"  {ai:<10}: {avg:>+5.2f} ({tendency})")

    # 일관성 분석
    print("\n일관성 분석:")

    # 카테고리별 AI 간 표준편차 평균
    cat_stdevs = []
    for cat in CATEGORIES:
        cat_scores = [averages[ai][cat] for ai in AIS if averages[ai][cat] is not None]
        if len(cat_scores) >= 2:
            cat_stdevs.append(statistics.stdev(cat_scores))

    if cat_stdevs:
        avg_stdev = statistics.mean(cat_stdevs)
        print(f"  카테고리별 AI 간 평균 편차: {avg_stdev:.2f}")

        if avg_stdev < 0.5:
            print(f"  → 매우 일관적 (편차 < 0.5)")
        elif avg_stdev < 1.0:
            print(f"  → 일관적 (편차 < 1.0)")
        elif avg_stdev < 1.5:
            print(f"  → 보통 (편차 < 1.5)")
        else:
            print(f"  → 일관성 낮음 (편차 ≥ 1.5)")

    print("\n" + "=" * 80)

if __name__ == '__main__':
    analyze_consistency()
