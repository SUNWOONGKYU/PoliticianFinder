#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
V24.0 정확한 점수 계산 (숫자 문자열 처리)
"""

import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv
from collections import defaultdict

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

CATEGORIES = [
    ('Expertise', '전문성'),
    ('Leadership', '리더십'),
    ('Vision', '비전'),
    ('Integrity', '청렴성'),
    ('Ethics', '윤리성'),
    ('Accountability', '책임성'),
    ('Transparency', '투명성'),
    ('Communication', '소통능력'),
    ('Responsiveness', '대응성'),
    ('PublicInterest', '공익성')
]

# V24.0 알파벳 -> 숫자 변환 매핑
ALPHABET_TO_NUMERIC = {
    'A': 8, 'B': 6, 'C': 4, 'D': 2,
    'E': -2, 'F': -4, 'G': -6, 'H': -8
}

def convert_rating_to_numeric(rating):
    """rating을 숫자로 변환 (알파벳 또는 숫자 문자열 모두 지원)"""
    if rating is None:
        return None

    # 이미 숫자인 경우
    if isinstance(rating, (int, float)):
        return float(rating)

    # 문자열인 경우
    rating_str = str(rating).strip().upper()

    # 알파벳인 경우 (V24.0 형식)
    if rating_str in ALPHABET_TO_NUMERIC:
        return ALPHABET_TO_NUMERIC[rating_str]

    # 숫자 문자열인 경우 (이전 형식)
    try:
        return float(rating_str)
    except ValueError:
        return None

def calculate_score(politician_id, politician_name):
    """정치인 점수 계산"""

    # 데이터 조회
    response = supabase.table('collected_data') \
        .select('category_name, rating') \
        .eq('politician_id', politician_id) \
        .execute()

    if not response.data:
        return None

    # 카테고리별 데이터 분류
    category_data = defaultdict(list)
    for item in response.data:
        category_data[item['category_name']].append(item['rating'])

    # 카테고리별 점수 계산
    category_scores = {}

    for cat_eng, cat_kor in CATEGORIES:
        ratings = category_data.get(cat_eng, [])

        if not ratings:
            continue

        # rating을 숫자로 변환 (알파벳 또는 숫자 문자열 모두 지원)
        numeric_ratings = [convert_rating_to_numeric(r) for r in ratings]
        numeric_ratings = [r for r in numeric_ratings if r is not None]

        if not numeric_ratings:
            continue

        # 평균 계산
        avg_rating = sum(numeric_ratings) / len(numeric_ratings)

        # 카테고리 점수 계산
        category_score = (6.0 + avg_rating * 0.5) * 10

        category_scores[cat_kor] = {
            'score': category_score,
            'avg_rating': avg_rating,
            'count': len(ratings)
        }

    # 최종 점수 계산 (반올림)
    total_score = sum(cs['score'] for cs in category_scores.values())
    final_score = round(min(total_score, 1000))

    # 최종 등급
    if final_score >= 925:
        final_grade = "M (Mugunghwa)"
        grade_desc = "최우수"
    elif final_score >= 850:
        final_grade = "D (Diamond)"
        grade_desc = "우수"
    elif final_score >= 775:
        final_grade = "E (Emerald)"
        grade_desc = "양호"
    elif final_score >= 700:
        final_grade = "P (Platinum)"
        grade_desc = "보통+"
    elif final_score >= 625:
        final_grade = "G (Gold)"
        grade_desc = "보통"
    elif final_score >= 550:
        final_grade = "S (Silver)"
        grade_desc = "보통-"
    elif final_score >= 475:
        final_grade = "B (Bronze)"
        grade_desc = "미흡"
    elif final_score >= 400:
        final_grade = "I (Iron)"
        grade_desc = "부족"
    else:
        final_grade = "L (Lead)"
        grade_desc = "매우 부족"

    return {
        'name': politician_name,
        'final_score': final_score,
        'final_grade': final_grade,
        'grade_desc': grade_desc,
        'category_scores': category_scores,
        'data_count': len(response.data)
    }

def main():
    print("="*100)
    print("V24.0 3명 정치인 최종 점수")
    print("="*100)
    print()

    politicians = [
        ('88aaecf2', '나경원'),
        ('507226bb', '박주민'),
        ('62e7b453', '오세훈')
    ]

    results = []
    for pol_id, pol_name in politicians:
        result = calculate_score(pol_id, pol_name)
        if result:
            results.append(result)

            print(f"{pol_name}:")
            print(f"  최종 점수: {result['final_score']}점")
            print(f"  최종 등급: {result['final_grade']} - {result['grade_desc']}")
            print()

            # 카테고리별 점수 출력
            for cat_name, cat_info in result['category_scores'].items():
                print(f"    {cat_name}: {cat_info['score']:.2f}점 (평균: {cat_info['avg_rating']:.2f})")
            print()

    # 점수 순으로 정렬
    results.sort(key=lambda x: x['final_score'], reverse=True)

    print("="*100)
    print("최종 순위")
    print("="*100)
    print()

    for i, result in enumerate(results, 1):
        print(f"{i}위: {result['name']} - {result['final_score']}점 ({result['final_grade']})")

    print()
    print("="*100)

if __name__ == "__main__":
    main()
