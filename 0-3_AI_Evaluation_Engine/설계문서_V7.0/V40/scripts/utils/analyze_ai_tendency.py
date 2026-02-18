#!/usr/bin/env python3
"""
V40 AI 성향 분석 스크립트 (점수 기반)
ai_final_scores_v40 테이블에서 데이터 추출
"""

import os
import sys
from pathlib import Path
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

def analyze_ai_tendency():
    """AI 성향 분석"""

    # 데이터 가져오기
    result = supabase.table('ai_final_scores_v40').select('*').execute()
    data = result.data

    if not data:
        print("❌ 데이터가 없습니다.")
        return

    print("=" * 100)
    print("V40 AI 성향 분석 (점수 기반)")
    print("=" * 100)
    print()

    # ===== 1. 정치인별 AI 점수 비교 =====
    print("📊 1. 정치인별 AI 점수")
    print("-" * 100)

    for pol_data in data:
        pol_name = pol_data['politician_name']
        pol_party = "더불어민주당" if pol_data['politician_id'] == '8c5dcc89' else "국민의힘"
        final_score = pol_data['final_score']
        ai_scores = pol_data['ai_final_scores']

        print(f"\n[{pol_name} - {pol_party}] 최종: {final_score}점")

        # AI별 점수 정렬
        sorted_ais = sorted(ai_scores.items(), key=lambda x: x[1], reverse=True)

        for ai, score in sorted_ais:
            diff = score - final_score
            print(f"  {ai:<10}: {score:>4}점 ({diff:>+4}점)")

        # 최고/최저 차이
        highest = sorted_ais[0]
        lowest = sorted_ais[-1]
        gap = highest[1] - lowest[1]
        print(f"\n  편차: {gap}점 (최고 {highest[0]} vs 최저 {lowest[0]})")

    print("\n" + "=" * 100)

    # ===== 2. AI별 평균 점수 =====
    print("\n📊 2. AI별 전체 평균 점수")
    print("-" * 100)

    ai_totals = {ai: [] for ai in AIS}

    for pol_data in data:
        ai_scores = pol_data['ai_final_scores']
        for ai, score in ai_scores.items():
            ai_totals[ai].append(score)

    ai_averages = []
    for ai in AIS:
        if ai_totals[ai]:
            avg = statistics.mean(ai_totals[ai])
            ai_averages.append((ai, avg))

    ai_averages.sort(key=lambda x: x[1], reverse=True)

    print()
    for ai, avg in ai_averages:
        tendency = ""
        if avg >= 850:
            tendency = "매우 관대"
        elif avg >= 800:
            tendency = "관대"
        elif avg >= 750:
            tendency = "중립"
        elif avg >= 700:
            tendency = "엄격"
        else:
            tendency = "매우 엄격"

        print(f"  {ai:<10}: {avg:>6.1f}점 ({tendency})")

    # 표준편차
    all_avgs = [avg for _, avg in ai_averages]
    if len(all_avgs) >= 2:
        stdev = statistics.stdev(all_avgs)
        print(f"\n  편차: {stdev:.1f}점")

    print("\n" + "=" * 100)

    # ===== 3. 카테고리별 AI 성향 =====
    print("\n📊 3. 카테고리별 AI 점수")
    print("-" * 100)

    # 카테고리별 AI 점수 수집
    cat_scores = {cat: {ai: [] for ai in AIS} for cat in CATEGORIES}

    for pol_data in data:
        ai_cat_scores = pol_data['ai_category_scores']
        for ai, categories in ai_cat_scores.items():
            for cat, score in categories.items():
                cat_scores[cat][ai].append(score)

    # 출력
    print(f"\n{'카테고리':<12}", end="")
    for ai in AIS:
        print(f"{ai:>12}", end="")
    print(f"{'편차':>10} {'최고-최저':>12}")
    print("-" * 100)

    cat_stdevs = []

    for cat in CATEGORIES:
        cat_kr = CATEGORY_KR[cat]
        print(f"{cat_kr:<12}", end="")

        cat_avgs = []
        for ai in AIS:
            if cat_scores[cat][ai]:
                avg = statistics.mean(cat_scores[cat][ai])
                cat_avgs.append(avg)
                print(f"{avg:>12.1f}", end="")
            else:
                print(f"{'N/A':>12}", end="")

        # 표준편차와 최고-최저 차이
        if len(cat_avgs) >= 2:
            stdev = statistics.stdev(cat_avgs)
            cat_stdevs.append(stdev)
            max_score = max(cat_avgs)
            min_score = min(cat_avgs)
            gap = max_score - min_score
            print(f"{stdev:>10.1f} {gap:>12.1f}")
        else:
            print(f"{'N/A':>10} {'N/A':>12}")

    print("\n" + "=" * 100)

    # ===== 4. 일관성 분석 =====
    print("\n🔍 4. 일관성 분석")
    print("-" * 100)

    if cat_stdevs:
        avg_stdev = statistics.mean(cat_stdevs)
        max_stdev = max(cat_stdevs)
        min_stdev = min(cat_stdevs)

        print(f"\n카테고리별 AI 간 편차:")
        print(f"  평균: {avg_stdev:.2f}점")
        print(f"  최대: {max_stdev:.2f}점")
        print(f"  최소: {min_stdev:.2f}점")

        print(f"\n일관성 평가:")
        if avg_stdev < 3:
            print(f"  ✅ 매우 일관적 (평균 편차 < 3점)")
        elif avg_stdev < 5:
            print(f"  ✅ 일관적 (평균 편차 < 5점)")
        elif avg_stdev < 8:
            print(f"  ⚠️  보통 (평균 편차 < 8점)")
        else:
            print(f"  ❌ 일관성 낮음 (평균 편차 ≥ 8점)")

    print("\n" + "=" * 100)

    # ===== 5. 정당별 성향 =====
    print("\n🔍 5. 정당별 AI 성향")
    print("-" * 100)

    party_ai_scores = {
        '더불어민주당': {ai: [] for ai in AIS},
        '국민의힘': {ai: [] for ai in AIS}
    }

    for pol_data in data:
        party = "더불어민주당" if pol_data['politician_id'] == '8c5dcc89' else "국민의힘"
        ai_scores = pol_data['ai_final_scores']

        for ai, score in ai_scores.items():
            party_ai_scores[party][ai].append(score)

    print()
    for party in ['더불어민주당', '국민의힘']:
        print(f"[{party}]")

        ai_party_avgs = []
        for ai in AIS:
            if party_ai_scores[party][ai]:
                avg = statistics.mean(party_ai_scores[party][ai])
                ai_party_avgs.append((ai, avg))

        ai_party_avgs.sort(key=lambda x: x[1], reverse=True)

        for ai, avg in ai_party_avgs:
            print(f"  {ai:<10}: {avg:>6.1f}점")

        if len(ai_party_avgs) >= 2:
            highest = ai_party_avgs[0]
            lowest = ai_party_avgs[-1]
            gap = highest[1] - lowest[1]
            print(f"  편차: {gap:.1f}점 (최고 {highest[0]} vs 최저 {lowest[0]})")

        print()

    print("=" * 100)

    # ===== 6. 주요 인사이트 =====
    print("\n💡 6. 주요 인사이트")
    print("-" * 100)
    print()

    # 가장 관대한 AI
    most_generous = ai_averages[0]
    print(f"✅ 가장 관대한 AI: {most_generous[0]} ({most_generous[1]:.1f}점)")

    # 가장 엄격한 AI
    most_strict = ai_averages[-1]
    print(f"❌ 가장 엄격한 AI: {most_strict[0]} ({most_strict[1]:.1f}점)")

    # AI 간 점수 차이
    gap = most_generous[1] - most_strict[1]
    print(f"📊 AI 간 평균 점수 차이: {gap:.1f}점")

    # 일관성 결론
    if cat_stdevs:
        avg_stdev = statistics.mean(cat_stdevs)
        if avg_stdev < 5:
            print(f"✅ AI들의 평가 성향이 일관적입니다 (카테고리별 평균 편차 {avg_stdev:.1f}점)")
        else:
            print(f"⚠️  AI들의 평가 성향이 다소 차이가 있습니다 (카테고리별 평균 편차 {avg_stdev:.1f}점)")

    print("\n" + "=" * 100)

if __name__ == '__main__':
    analyze_ai_tendency()
