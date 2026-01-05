# -*- coding: utf-8 -*-
"""
V26.0 풀링 방식 점수 계산 스크립트

풀링 방식 점수 계산:
- ai_ratings_v26 테이블에서 rating 조회
- 각 AI가 200개 전체를 평가한 결과 기반
- 4개 AI × 200개 = 800개 rating으로 점수 계산

사용법:
    python calculate_v26_pool_scores.py --politician_id=62e7b453
"""

import os
import sys
import argparse
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 환경 변수 로드
load_dotenv()

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# V26.0 테이블명
TABLE_RATINGS = "ai_ratings_v26"
TABLE_CATEGORY_SCORES = "ai_category_scores_v26"
TABLE_FINAL_SCORES = "ai_final_scores_v26"
TABLE_EVALUATIONS = "ai_evaluations_v26"

# 카테고리 정의
CATEGORIES = [
    "Expertise", "Leadership", "Vision", "Integrity", "Ethics",
    "Accountability", "Transparency", "Communication", "Responsiveness", "PublicInterest"
]

CATEGORY_NAMES_KR = {
    "Expertise": "전문성",
    "Leadership": "리더십",
    "Vision": "비전",
    "Integrity": "청렴성",
    "Ethics": "윤리성",
    "Accountability": "책임성",
    "Transparency": "투명성",
    "Communication": "소통능력",
    "Responsiveness": "대응성",
    "PublicInterest": "공익성"
}

# 알파벳 → 숫자 변환
ALPHABET_TO_NUMBER = {
    'A': 8, 'B': 6, 'C': 4, 'D': 2,
    'E': -2, 'F': -4, 'G': -6, 'H': -8
}

# 등급 체계 (9단계)
GRADE_BOUNDARIES = [
    (889, 1000, 'D', 'Diamond'),
    (778, 888, 'E', 'Emerald'),
    (667, 777, 'P', 'Pearl'),
    (556, 666, 'G', 'Gold'),
    (445, 555, 'S', 'Silver'),
    (334, 444, 'B', 'Bronze'),
    (223, 333, 'I', 'Iron'),
    (200, 222, 'L', 'Lead'),
    (0, 199, 'M', 'Mud')
]

AI_NAMES = ["Claude", "ChatGPT", "Grok", "Gemini"]


def get_ratings_from_pool(politician_id, evaluator_ai, category_name):
    """
    ai_ratings_v26 테이블에서 rating 조회

    풀링 방식:
    - 각 AI가 200개 풀 전체를 평가한 결과
    - collected_data가 아닌 ai_ratings_v26에서 조회
    """
    all_ratings = []
    offset = 0
    limit = 1000

    while True:
        response = supabase.table(TABLE_RATINGS).select('rating').eq(
            'politician_id', politician_id
        ).eq(
            'evaluator_ai_name', evaluator_ai
        ).eq(
            'category_name', category_name
        ).range(offset, offset + limit - 1).execute()

        if not response.data:
            break

        all_ratings.extend(response.data)

        if len(response.data) < limit:
            break

        offset += limit

    return [ALPHABET_TO_NUMBER.get(r['rating'], 0) for r in all_ratings if r['rating'] in ALPHABET_TO_NUMBER]


def calculate_category_score(ratings):
    """
    카테고리 점수 계산

    공식: (PRIOR + avg_rating × COEFFICIENT) × 10
    - PRIOR = 6.0
    - COEFFICIENT = 0.5
    - 결과: 20 ~ 100점
    """
    if not ratings:
        return 0

    PRIOR = 6.0
    COEFFICIENT = 0.5

    avg_rating = sum(ratings) / len(ratings)
    score = (PRIOR + avg_rating * COEFFICIENT) * 10

    return max(20, min(100, round(score, 1)))


def get_grade(total_score):
    """점수 → 등급 변환"""
    for min_score, max_score, grade_code, grade_name in GRADE_BOUNDARIES:
        if min_score <= total_score <= max_score:
            return grade_code, grade_name
    return 'M', 'Mud'


def save_category_score(politician_id, ai_name, category_name, score, rating_count):
    """카테고리 점수 저장"""
    try:
        # 기존 데이터 삭제
        supabase.table(TABLE_CATEGORY_SCORES).delete().eq(
            'politician_id', politician_id
        ).eq('ai_name', ai_name).eq('category_name', category_name).execute()

        # 새 데이터 삽입
        data = {
            'politician_id': politician_id,
            'ai_name': ai_name,
            'category_name': category_name,
            'category_score': score,
            'rating_count': rating_count,
            'calculation_version': 'V26.0_pool',
            'calculation_date': datetime.now().isoformat()
        }
        supabase.table(TABLE_CATEGORY_SCORES).insert(data).execute()
    except Exception as e:
        print(f"    ⚠️ 저장 실패: {e}")


def save_final_score(politician_id, ai_name, total_score, grade_code, grade_name, category_scores):
    """최종 점수 저장"""
    try:
        # 기존 데이터 삭제
        supabase.table(TABLE_FINAL_SCORES).delete().eq(
            'politician_id', politician_id
        ).eq('ai_name', ai_name).execute()

        # 새 데이터 삽입
        data = {
            'politician_id': politician_id,
            'ai_name': ai_name,
            'total_score': total_score,
            'grade_code': grade_code,
            'grade_name': grade_name,
            'category_scores': category_scores,
            'calculation_version': 'V26.0_pool',
            'calculation_date': datetime.now().isoformat()
        }
        supabase.table(TABLE_FINAL_SCORES).insert(data).execute()
    except Exception as e:
        print(f"    ⚠️ 저장 실패: {e}")


def save_combined_evaluation(politician_id, ai_count, avg_score, grade_code, grade_name, ai_scores):
    """종합 평가 저장"""
    try:
        # 기존 데이터 삭제
        supabase.table(TABLE_EVALUATIONS).delete().eq(
            'politician_id', politician_id
        ).execute()

        # 새 데이터 삽입
        data = {
            'politician_id': politician_id,
            'ai_count': ai_count,
            'avg_score': avg_score,
            'grade_code': grade_code,
            'grade_name': grade_name,
            'ai_scores': ai_scores,
            'calculation_version': 'V26.0_pool',
            'calculation_date': datetime.now().isoformat()
        }
        supabase.table(TABLE_EVALUATIONS).insert(data).execute()
    except Exception as e:
        print(f"    ⚠️ 저장 실패: {e}")


def calculate_ai_scores(politician_id, ai_name):
    """단일 AI 점수 계산"""
    print(f"\n  [{ai_name}]")

    category_scores = {}
    total_score = 0

    for category in CATEGORIES:
        ratings = get_ratings_from_pool(politician_id, ai_name, category)
        score = calculate_category_score(ratings)

        category_scores[category] = {
            'score': score,
            'count': len(ratings)
        }
        total_score += score

        cat_kr = CATEGORY_NAMES_KR.get(category, category)
        print(f"    {cat_kr}: {score}점 ({len(ratings)}개 평가)")

        save_category_score(politician_id, ai_name, category, score, len(ratings))

    total_score = round(min(total_score, 1000))
    grade_code, grade_name = get_grade(total_score)

    print(f"    ─────────────────")
    print(f"    총점: {total_score}점 ({grade_code} - {grade_name})")

    save_final_score(politician_id, ai_name, total_score, grade_code, grade_name, category_scores)

    return total_score, grade_code


def calculate_all_scores(politician_id):
    """전체 점수 계산"""
    print("="*60)
    print("V26.0 풀링 방식 점수 계산")
    print("="*60)
    print(f"정치인 ID: {politician_id}")
    print(f"데이터 출처: {TABLE_RATINGS} (풀링 평가 결과)")
    print("="*60)

    ai_scores = {}

    for ai_name in AI_NAMES:
        total_score, grade_code = calculate_ai_scores(politician_id, ai_name)
        ai_scores[ai_name] = {
            'score': total_score,
            'grade': grade_code
        }

    # 종합 점수 계산
    print("\n" + "="*60)
    print("종합 점수")
    print("="*60)

    valid_scores = [ai_scores[ai]['score'] for ai in AI_NAMES if ai_scores[ai]['score'] > 0]

    if valid_scores:
        avg_score = round(sum(valid_scores) / len(valid_scores))
        grade_code, grade_name = get_grade(avg_score)

        print(f"\n  4개 AI 평균: {avg_score}점 ({grade_code} - {grade_name})")
        print(f"\n  상세:")
        for ai_name in AI_NAMES:
            score = ai_scores[ai_name]['score']
            grade = ai_scores[ai_name]['grade']
            print(f"    {ai_name}: {score}점 ({grade})")

        save_combined_evaluation(politician_id, len(valid_scores), avg_score, grade_code, grade_name, ai_scores)
    else:
        print("  ⚠️ 평가 데이터 없음")
        avg_score = 0
        grade_code = 'M'
        grade_name = 'Mud'

    print("\n" + "="*60)
    print("점수 계산 완료!")
    print("="*60)

    return avg_score, grade_code


def main():
    parser = argparse.ArgumentParser(description='V26.0 풀링 방식 점수 계산')
    parser.add_argument('--politician_id', type=str, required=True, help='정치인 ID')
    args = parser.parse_args()

    calculate_all_scores(args.politician_id)


if __name__ == "__main__":
    main()
