#!/usr/bin/env python3
"""
V40 카테고리별 이상치 검증 스크립트
AI 간 점수 차이가 큰 카테고리의 원본 데이터 분석
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

# UTF-8 출력 설정 (Windows)
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

AIS = ['Claude', 'ChatGPT', 'Gemini', 'Grok']

# 편차가 큰 카테고리 (상위 5개)
HIGH_VARIANCE_CATEGORIES = [
    ('publicinterest', '공익성', 13.5),
    ('transparency', '투명성', 13.0),
    ('responsiveness', '대응성', 13.0),
    ('vision', '비전', 12.0),
    ('accountability', '책임감', 12.0)
]

def get_category_evaluations(category):
    """특정 카테고리의 모든 평가 데이터 가져오기"""
    result = supabase.table('evaluations_v40')\
        .select('*')\
        .eq('category', category)\
        .execute()
    return result.data

def analyze_category(category, category_kr, expected_variance):
    """카테고리별 상세 분석"""

    print("=" * 100)
    print(f"📊 {category_kr} ({category}) - 예상 편차: {expected_variance}점")
    print("=" * 100)

    evals = get_category_evaluations(category)

    if not evals:
        print("❌ 평가 데이터 없음\n")
        return

    # AI별 데이터 분류
    ai_data = defaultdict(list)
    ai_excluded = defaultdict(int)
    ai_total = defaultdict(int)

    for ev in evals:
        ai = ev['evaluator_ai']
        rating = ev['rating']
        ai_total[ai] += 1

        if rating == 'X':
            ai_excluded[ai] += 1
        else:
            try:
                score = int(rating)
                ai_data[ai].append(score)
            except:
                print(f"⚠️  변환 실패: {rating} (AI: {ai}, ID: {ev['id']})")

    print(f"\n📈 1. 데이터 개수 및 제외율")
    print("-" * 100)
    print(f"{'AI':<12} {'전체':<8} {'평가':<8} {'제외(X)':<8} {'제외율':<10}")
    print("-" * 100)

    for ai in AIS:
        total = ai_total.get(ai, 0)
        evaluated = len(ai_data.get(ai, []))
        excluded = ai_excluded.get(ai, 0)
        exc_rate = (excluded / total * 100) if total > 0 else 0

        print(f"{ai:<12} {total:<8} {evaluated:<8} {excluded:<8} {exc_rate:<10.1f}%")

    # 등급 분포
    print(f"\n📊 2. 등급 분포")
    print("-" * 100)
    print(f"{'AI':<12}", end="")
    for rating in ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4']:
        print(f"{rating:>6}", end="")
    print(f"{'평균':>8}")
    print("-" * 100)

    ai_averages = {}

    for ai in AIS:
        scores = ai_data.get(ai, [])
        if not scores:
            print(f"{ai:<12} (데이터 없음)")
            continue

        print(f"{ai:<12}", end="")

        # 등급별 개수
        for rating in [4, 3, 2, 1, -1, -2, -3, -4]:
            count = scores.count(rating)
            pct = (count / len(scores) * 100) if scores else 0
            print(f"{count:>3}({pct:>2.0f}%)", end=" ")

        # 평균
        avg = statistics.mean(scores)
        ai_averages[ai] = avg
        print(f"{avg:>7.2f}")

    # 통계 분석
    print(f"\n📈 3. 통계 분석")
    print("-" * 100)
    print(f"{'AI':<12} {'평균':<10} {'중앙값':<10} {'표준편차':<10} {'최소':<8} {'최대':<8}")
    print("-" * 100)

    for ai in AIS:
        scores = ai_data.get(ai, [])
        if not scores:
            continue

        avg = statistics.mean(scores)
        median = statistics.median(scores)
        stdev = statistics.stdev(scores) if len(scores) > 1 else 0
        min_score = min(scores)
        max_score = max(scores)

        print(f"{ai:<12} {avg:<10.2f} {median:<10.1f} {stdev:<10.2f} {min_score:<8} {max_score:<8}")

    # AI 간 편차
    if len(ai_averages) >= 2:
        print(f"\n📊 4. AI 간 차이")
        print("-" * 100)

        sorted_ais = sorted(ai_averages.items(), key=lambda x: x[1], reverse=True)

        print("순위:")
        for i, (ai, avg) in enumerate(sorted_ais, 1):
            print(f"  {i}. {ai:<10}: {avg:>+6.2f}")

        highest = sorted_ais[0]
        lowest = sorted_ais[-1]
        actual_diff = highest[1] - lowest[1]

        print(f"\n최고: {highest[0]} ({highest[1]:>+6.2f})")
        print(f"최저: {lowest[0]} ({lowest[1]:>+6.2f})")
        print(f"실제 편차: {actual_diff:.2f}점")
        print(f"예상 편차: {expected_variance}점")

        # 점수 환산 (rating → category_score)
        # category_score = (6.0 + avg_score * 0.5) * 10
        highest_cat_score = (6.0 + highest[1] * 0.5) * 10
        lowest_cat_score = (6.0 + lowest[1] * 0.5) * 10
        cat_diff = highest_cat_score - lowest_cat_score

        print(f"\n카테고리 점수 환산:")
        print(f"  최고: {highest_cat_score:.1f}점")
        print(f"  최저: {lowest_cat_score:.1f}점")
        print(f"  환산 편차: {cat_diff:.1f}점")

        # 검증
        print(f"\n🔍 검증:")
        if abs(cat_diff - expected_variance) < 1.0:
            print(f"  ✅ 정상 (환산 편차 {cat_diff:.1f}점 ≈ 예상 편차 {expected_variance}점)")
        else:
            print(f"  ⚠️  불일치 (환산 편차 {cat_diff:.1f}점 ≠ 예상 편차 {expected_variance}점)")

    # 이상치 검출
    print(f"\n🔍 5. 이상치 검출")
    print("-" * 100)

    anomalies_found = False

    for ai in AIS:
        scores = ai_data.get(ai, [])
        if not scores or len(scores) < 3:
            continue

        avg = statistics.mean(scores)
        stdev = statistics.stdev(scores)

        # 평균 ± 2*표준편차 범위를 벗어나는 값
        outliers = [s for s in scores if abs(s - avg) > 2 * stdev]

        if outliers:
            anomalies_found = True
            print(f"\n{ai}:")
            print(f"  이상치 개수: {len(outliers)}개")
            print(f"  이상치 값: {sorted(set(outliers))}")
            print(f"  평균: {avg:.2f}, 표준편차: {stdev:.2f}")

    if not anomalies_found:
        print("  ✅ 이상치 없음")

    # 정치인별 분석
    print(f"\n👤 6. 정치인별 AI 평가")
    print("-" * 100)

    pol_data = defaultdict(lambda: defaultdict(list))

    for ev in evals:
        pol_id = ev['politician_id']
        ai = ev['evaluator_ai']
        rating = ev['rating']

        if rating != 'X':
            try:
                score = int(rating)
                pol_data[pol_id][ai].append(score)
            except:
                pass

    politicians = {
        '8c5dcc89': '박주민',
        'd0a5d6e1': '조은희'
    }

    for pol_id, pol_name in politicians.items():
        if pol_id not in pol_data:
            continue

        print(f"\n[{pol_name}]")

        pol_ai_avgs = []
        for ai in AIS:
            if pol_data[pol_id][ai]:
                avg = statistics.mean(pol_data[pol_id][ai])
                count = len(pol_data[pol_id][ai])
                pol_ai_avgs.append((ai, avg, count))

        pol_ai_avgs.sort(key=lambda x: x[1], reverse=True)

        for ai, avg, count in pol_ai_avgs:
            print(f"  {ai:<10}: {avg:>+6.2f} ({count}개)")

        if len(pol_ai_avgs) >= 2:
            highest = pol_ai_avgs[0]
            lowest = pol_ai_avgs[-1]
            gap = highest[1] - lowest[1]
            print(f"  편차: {gap:.2f}점 (최고 {highest[0]} vs 최저 {lowest[0]})")

    print("\n")

def main():
    """메인 함수"""

    print("=" * 100)
    print("V40 카테고리별 이상치 검증")
    print("편차가 큰 상위 5개 카테고리 분석")
    print("=" * 100)
    print()

    for category, category_kr, variance in HIGH_VARIANCE_CATEGORIES:
        analyze_category(category, category_kr, variance)

    print("=" * 100)
    print("✅ 분석 완료")
    print("=" * 100)

if __name__ == '__main__':
    main()
