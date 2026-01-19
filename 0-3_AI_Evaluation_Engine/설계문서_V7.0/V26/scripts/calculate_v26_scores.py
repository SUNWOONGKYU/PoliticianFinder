#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
V26.0 점수 계산 스크립트
- collected_data_v26 테이블에서 데이터 읽기
- 4개 AI (Claude, ChatGPT, Grok, Gemini) 데이터 통합
- 카테고리별/AI별 점수 계산
"""

import os
import sys
import argparse
from supabase import create_client, Client
from dotenv import load_dotenv
from collections import defaultdict

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# .env 로드
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(env_path)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# V26 테이블명
TABLE_COLLECTED_DATA = "collected_data_v26"

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

AIS = ['Claude', 'ChatGPT', 'Grok', 'Gemini']

# V26.0 알파벳 -> 숫자 변환 매핑
ALPHABET_TO_NUMERIC = {
    'A': 8, 'B': 6, 'C': 4, 'D': 2,
    'E': -2, 'F': -4, 'G': -6, 'H': -8
}


def convert_rating_to_numeric(rating):
    """rating을 숫자로 변환"""
    if rating is None:
        return None

    if isinstance(rating, (int, float)):
        return float(rating)

    rating_str = str(rating).strip().upper()

    if rating_str in ALPHABET_TO_NUMERIC:
        return ALPHABET_TO_NUMERIC[rating_str]

    try:
        return float(rating_str)
    except ValueError:
        return None


def get_grade(score):
    """점수를 등급으로 변환"""
    if score >= 925:
        return "M (Mugunghwa)", "최우수"
    elif score >= 850:
        return "D (Diamond)", "우수"
    elif score >= 775:
        return "E (Emerald)", "양호"
    elif score >= 700:
        return "P (Platinum)", "보통+"
    elif score >= 625:
        return "G (Gold)", "보통"
    elif score >= 550:
        return "S (Silver)", "보통-"
    elif score >= 475:
        return "B (Bronze)", "미흡"
    elif score >= 400:
        return "I (Iron)", "부족"
    else:
        return "L (Lead)", "매우 부족"


def calculate_v26_score(politician_id, politician_name=None):
    """V26 데이터로 정치인 점수 계산"""

    print(f"\n{'='*60}")
    print(f"V26.0 점수 계산: {politician_name or politician_id}")
    print(f"{'='*60}")

    # V26 데이터 조회 (전체 - pagination 사용)
    all_data = []
    batch_size = 1000
    offset = 0

    while True:
        response = supabase.table(TABLE_COLLECTED_DATA) \
            .select('ai_name, category_name, rating') \
            .eq('politician_id', politician_id) \
            .range(offset, offset + batch_size - 1) \
            .execute()

        if not response.data:
            break

        all_data.extend(response.data)
        offset += batch_size

        if len(response.data) < batch_size:
            break

    if not all_data:
        print("❌ 데이터 없음")
        return None

    total_data = len(all_data)
    print(f"총 데이터: {total_data}개")

    # AI별/카테고리별 데이터 분류
    data_by_ai_category = defaultdict(lambda: defaultdict(list))

    for item in all_data:
        ai = item['ai_name']
        cat = item['category_name']
        rating = item['rating']
        data_by_ai_category[ai][cat].append(rating)

    # AI별 카테고리 점수 계산
    ai_category_scores = {}

    for ai in AIS:
        ai_category_scores[ai] = {}

        for cat_eng, cat_kor in CATEGORIES:
            ratings = data_by_ai_category.get(ai, {}).get(cat_eng, [])

            if not ratings:
                continue

            numeric_ratings = [convert_rating_to_numeric(r) for r in ratings]
            numeric_ratings = [r for r in numeric_ratings if r is not None]

            if not numeric_ratings:
                continue

            avg_rating = sum(numeric_ratings) / len(numeric_ratings)
            category_score = (6.0 + avg_rating * 0.5) * 10

            ai_category_scores[ai][cat_kor] = {
                'score': category_score,
                'avg_rating': avg_rating,
                'count': len(ratings)
            }

    # AI별 최종 점수 계산
    ai_final_scores = {}

    for ai in AIS:
        if ai not in ai_category_scores or not ai_category_scores[ai]:
            continue

        total = sum(cs['score'] for cs in ai_category_scores[ai].values())
        final_score = round(min(total, 1000))
        grade, grade_desc = get_grade(final_score)

        ai_final_scores[ai] = {
            'score': final_score,
            'grade': grade,
            'grade_desc': grade_desc
        }

    # 방식 1: 4개 AI 점수 평균
    if ai_final_scores:
        avg_score = sum(s['score'] for s in ai_final_scores.values()) / len(ai_final_scores)
        avg_method_score = round(avg_score)
        avg_method_grade, avg_method_desc = get_grade(avg_method_score)
    else:
        avg_method_score = 0
        avg_method_grade, avg_method_desc = "N/A", "데이터 없음"

    # 방식 2: 풀링 방식 (200개 전체 데이터로 평균 - 가중치 자연 반영)
    pooled_category_scores = {}
    for cat_eng, cat_kor in CATEGORIES:
        all_ratings = []
        for ai in AIS:
            ratings = data_by_ai_category.get(ai, {}).get(cat_eng, [])
            all_ratings.extend(ratings)

        if not all_ratings:
            continue

        numeric_ratings = [convert_rating_to_numeric(r) for r in all_ratings]
        numeric_ratings = [r for r in numeric_ratings if r is not None]

        if not numeric_ratings:
            continue

        avg_rating = sum(numeric_ratings) / len(numeric_ratings)
        category_score = (6.0 + avg_rating * 0.5) * 10

        pooled_category_scores[cat_kor] = {
            'score': category_score,
            'avg_rating': avg_rating,
            'count': len(numeric_ratings)
        }

    # 풀링 최종 점수
    if pooled_category_scores:
        pooled_total = sum(cs['score'] for cs in pooled_category_scores.values())
        pooled_score = round(min(pooled_total, 1000))
        pooled_grade, pooled_desc = get_grade(pooled_score)
    else:
        pooled_score = 0
        pooled_grade, pooled_desc = "N/A", "데이터 없음"

    # 기본 통합 점수는 풀링 방식 사용
    final_combined_score = pooled_score
    combined_grade = pooled_grade
    combined_grade_desc = pooled_desc

    # 결과 출력
    print(f"\n📊 AI별 점수:")
    for ai, scores in ai_final_scores.items():
        print(f"  {ai}: {scores['score']}점 ({scores['grade']})")

    print(f"\n📊 통합 점수: {final_combined_score}점")
    print(f"📊 통합 등급: {combined_grade} - {combined_grade_desc}")

    # 카테고리별 상세 (통합)
    print(f"\n📊 카테고리별 점수 (AI별 평균):")
    for cat_eng, cat_kor in CATEGORIES:
        cat_scores = []
        for ai in AIS:
            if ai in ai_category_scores and cat_kor in ai_category_scores[ai]:
                cat_scores.append(ai_category_scores[ai][cat_kor]['score'])

        if cat_scores:
            avg_cat_score = sum(cat_scores) / len(cat_scores)
            print(f"  {cat_kor}: {avg_cat_score:.1f}점")

    return {
        'politician_id': politician_id,
        'politician_name': politician_name,
        'total_data': total_data,
        'ai_final_scores': ai_final_scores,
        'combined_score': final_combined_score,
        'combined_grade': combined_grade,
        'combined_grade_desc': combined_grade_desc,
        'ai_category_scores': ai_category_scores
    }


def main():
    parser = argparse.ArgumentParser(description='V26.0 점수 계산')
    parser.add_argument('--politician_id', type=str, help='정치인 ID')
    parser.add_argument('--politician_name', type=str, help='정치인 이름')
    parser.add_argument('--all', action='store_true', help='V26 데이터가 있는 모든 정치인')

    args = parser.parse_args()

    print("="*60)
    print("V26.0 점수 계산")
    print("="*60)

    if args.all:
        # V26 데이터가 있는 모든 정치인 조회
        response = supabase.table(TABLE_COLLECTED_DATA) \
            .select('politician_id') \
            .execute()

        politician_ids = list(set(item['politician_id'] for item in response.data))
        print(f"정치인 {len(politician_ids)}명 발견")

        results = []
        for pid in politician_ids:
            # 이름 조회
            p = supabase.table('politicians').select('name').eq('id', pid).single().execute()
            name = p.data.get('name', 'Unknown') if p.data else 'Unknown'

            result = calculate_v26_score(pid, name)
            if result:
                results.append(result)

        # 순위 출력
        if results:
            print("\n" + "="*60)
            print("📊 V26.0 최종 순위")
            print("="*60)

            results.sort(key=lambda x: x['combined_score'], reverse=True)
            for i, r in enumerate(results, 1):
                print(f"{i}위: {r['politician_name']} - {r['combined_score']}점 ({r['combined_grade']})")

    elif args.politician_id:
        calculate_v26_score(args.politician_id, args.politician_name)

    else:
        # 기본: 오세훈
        calculate_v26_score('62e7b453', '오세훈')


if __name__ == "__main__":
    main()
