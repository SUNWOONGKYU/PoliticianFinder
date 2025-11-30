#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Step 1: 기초 데이터 조회 - 김동연 (수정: 정확한 AI 이름 사용)
DB에서 AI별 수집 데이터 기본 통계 확인
"""
import os
import sys
from supabase import create_client
from dotenv import load_dotenv
from collections import Counter

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv()

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

POLITICIAN_ID = "0756ec15"
POLITICIAN_NAME = "김동연"

# 카테고리 목록
CATEGORIES = [
    'Expertise', 'Leadership', 'Vision', 'Integrity', 'Ethics',
    'Accountability', 'Transparency', 'Communication', 'Responsiveness', 'PublicInterest'
]

# 등급 → 숫자 변환
ALPHABET_GRADES = {
    'A': 8, 'B': 6, 'C': 4, 'D': 2,
    'E': -2, 'F': -4, 'G': -6, 'H': -8
}

def get_ai_data(ai_name):
    """특정 AI의 김동연 데이터 조회"""
    try:
        response = supabase.table('collected_data').select('*').eq(
            'politician_id', POLITICIAN_ID
        ).eq('ai_name', ai_name).execute()

        return response.data if response.data else []
    except Exception as e:
        print(f"❌ DB 조회 오류 ({ai_name}): {e}")
        return []

def analyze_ai_data(ai_name, data):
    """AI별 데이터 분석"""
    print(f"\n{'='*80}")
    print(f"[{ai_name}] 분석 결과")
    print(f"{'='*80}")

    if not data:
        print(f"❌ 데이터 없음")
        return None

    # 기본 통계
    total_items = len(data)
    print(f"\n1. 기본 통계")
    print(f"   총 항목 수: {total_items}개")

    # 출처 타입 분포
    source_types = Counter([item.get('source_type', 'UNKNOWN') for item in data])
    official_count = source_types.get('OFFICIAL', 0)
    public_count = source_types.get('PUBLIC', 0)

    print(f"\n2. 출처 분포")
    print(f"   OFFICIAL: {official_count}개 ({official_count*100//total_items}%)")
    print(f"   PUBLIC:   {public_count}개 ({public_count*100//total_items}%)")

    # 카테고리별 항목 수
    categories = Counter([item.get('category_name', 'UNKNOWN') for item in data])

    print(f"\n3. 카테고리별 항목 수")
    for cat in CATEGORIES:
        count = categories.get(cat, 0)
        print(f"   {cat:15s}: {count:3d}개")

    # 등급 분포
    ratings = []
    for item in data:
        rating_val = item.get('rating')
        if rating_val:
            rating_str = str(rating_val).strip().upper()
            if rating_str in ALPHABET_GRADES:
                ratings.append(rating_str)

    rating_dist = Counter(ratings)

    print(f"\n4. 등급 분포")
    for grade in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']:
        count = rating_dist.get(grade, 0)
        if count > 0:
            pct = count * 100 // len(ratings) if ratings else 0
            print(f"   {grade}: {count:3d}개 ({pct:2d}%)")

    # 긍정/부정 비율
    positive = sum(rating_dist.get(g, 0) for g in ['A', 'B', 'C', 'D'])
    negative = sum(rating_dist.get(g, 0) for g in ['E', 'F', 'G', 'H'])
    total_rated = positive + negative

    print(f"\n5. 긍정/부정 비율")
    if total_rated > 0:
        print(f"   긍정 (A~D): {positive}개 ({positive*100//total_rated}%)")
        print(f"   부정 (E~H): {negative}개 ({negative*100//total_rated}%)")

    # 평균 등급 계산
    if ratings:
        numeric_ratings = [ALPHABET_GRADES[r] for r in ratings]
        avg_rating = sum(numeric_ratings) / len(numeric_ratings)
        print(f"\n6. 평균 등급")
        print(f"   평균 숫자 값: {avg_rating:+.2f}")

        # 점수 계산 (V24 알고리즘)
        category_scores = {}
        for cat in CATEGORIES:
            cat_data = [item for item in data if item.get('category_name') == cat]
            cat_ratings = []
            for item in cat_data:
                rating_val = item.get('rating')
                if rating_val:
                    rating_str = str(rating_val).strip().upper()
                    if rating_str in ALPHABET_GRADES:
                        cat_ratings.append(ALPHABET_GRADES[rating_str])

            if cat_ratings:
                cat_avg = sum(cat_ratings) / len(cat_ratings)
                cat_score = (6.0 + cat_avg * 0.5) * 10
                category_scores[cat] = {
                    'avg_rating': cat_avg,
                    'score': cat_score,
                    'count': len(cat_ratings)
                }

        total_score = sum(cs['score'] for cs in category_scores.values())
        final_score = round(min(total_score, 1000))

        print(f"\n7. 카테고리별 점수")
        for cat in CATEGORIES:
            if cat in category_scores:
                cs = category_scores[cat]
                print(f"   {cat:15s}: 평균 {cs['avg_rating']:+5.2f} → {cs['score']:5.1f}점 (항목: {cs['count']}개)")

        print(f"\n8. 최종 점수")
        print(f"   총점: {final_score}점")

    return {
        'total_items': total_items,
        'source_distribution': dict(source_types),
        'category_distribution': dict(categories),
        'rating_distribution': dict(rating_dist),
        'positive_count': positive,
        'negative_count': negative,
        'avg_rating': avg_rating if ratings else 0,
        'final_score': final_score if ratings else 0,
        'category_scores': category_scores if ratings else {}
    }

def main():
    print("="*80)
    print(f"김동연 (ID: {POLITICIAN_ID}) - AI별 기초 데이터 분석 (수정)")
    print("="*80)

    # 정확한 AI 이름 사용
    ai_models = [
        ("ChatGPT", "ChatGPT"),
        ("Grok", "Grok"),
        ("Claude", "claude-3-5-haiku-20241022")
    ]

    results = {}

    for display_name, db_name in ai_models:
        data = get_ai_data(db_name)
        analysis = analyze_ai_data(display_name, data)
        if analysis:
            results[display_name] = analysis

    # 비교 요약
    print(f"\n\n{'='*80}")
    print("AI 간 비교 요약")
    print(f"{'='*80}")

    print(f"\n{'항목':<20s}{'ChatGPT':>15s}{'Grok':>15s}{'Claude':>15s}")
    print("-" * 80)

    # 총 항목 수
    print(f"{'총 데이터 항목':<20s}", end='')
    for ai in ["ChatGPT", "Grok", "Claude"]:
        if ai in results:
            print(f"{results[ai]['total_items']:>15d}", end='')
    print()

    # 최종 점수
    print(f"{'최종 점수':<20s}", end='')
    for ai in ["ChatGPT", "Grok", "Claude"]:
        if ai in results:
            print(f"{results[ai]['final_score']:>15d}", end='')
    print()

    # 평균 등급
    print(f"{'평균 등급':<20s}", end='')
    for ai in ["ChatGPT", "Grok", "Claude"]:
        if ai in results:
            print(f"{results[ai]['avg_rating']:>15.2f}", end='')
    print()

    # 긍정/부정 비율
    print(f"\n{'긍정(A~D) 개수':<20s}", end='')
    for ai in ["ChatGPT", "Grok", "Claude"]:
        if ai in results:
            print(f"{results[ai]['positive_count']:>15d}", end='')
    print()

    print(f"{'부정(E~H) 개수':<20s}", end='')
    for ai in ["ChatGPT", "Grok", "Claude"]:
        if ai in results:
            print(f"{results[ai]['negative_count']:>15d}", end='')
    print()

    # 등급 분포
    print(f"\n등급 분포:")
    for ai in ["ChatGPT", "Grok", "Claude"]:
        if ai in results:
            dist = results[ai]['rating_distribution']
            print(f"  {ai:10s}: {dist}")

    # DB 점수와 비교
    print(f"\n\n{'='*80}")
    print("DB에 저장된 최종 점수와 비교")
    print(f"{'='*80}")

    try:
        response = supabase.table('ai_final_scores').select('ai_name, total_score').eq(
            'politician_id', POLITICIAN_ID
        ).execute()

        print(f"\n{'AI':<20s}{'계산값':>15s}{'DB 저장값':>15s}{'차이':>15s}")
        print("-" * 80)

        for item in response.data:
            ai_name_db = item['ai_name']
            db_score = item['total_score']

            # 표시 이름 변환
            if ai_name_db == "claude-3-5-haiku-20241022":
                display = "Claude"
            else:
                display = ai_name_db

            if display in results:
                calc_score = results[display]['final_score']
                diff = db_score - calc_score
                print(f"{display:<20s}{calc_score:>15d}{db_score:>15d}{diff:>15d}")
            else:
                print(f"{display:<20s}{'N/A':>15s}{db_score:>15d}{'N/A':>15s}")

    except Exception as e:
        print(f"❌ ai_final_scores 조회 오류: {e}")

if __name__ == "__main__":
    main()
