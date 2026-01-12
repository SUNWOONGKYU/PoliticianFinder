# -*- coding: utf-8 -*-
"""
V27.0 독립 방식 점수 계산 스크립트

독립 방식 점수 계산:
- collected_data_v27 테이블에서 rating 조회
- 각 AI가 자기가 수집한 50개만 평가한 결과 기반
- 4개 AI × 50개 = 200개 rating (카테고리당)

V26(풀링) vs V27(독립) 차이:
- V26: 4개 AI가 200개 풀 전체를 평가 → 점수 수렴
- V27: 각 AI가 자기 수집 50개만 평가 → 독립적 점수 → 변별력 확보

사용법:
    python calculate_v27_scores.py --politician_id=62e7b453
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

# 환경 변수 로드 (override=True로 .env 우선)
load_dotenv(override=True)

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# V28 테이블명
TABLE_COLLECTED_DATA = "collected_data_v28"
TABLE_CATEGORY_SCORES = "ai_category_scores_v28"
TABLE_FINAL_SCORES = "ai_final_scores_v28"
TABLE_EVALUATIONS = "ai_evaluations_v28"

# 카테고리 정의 (영문명 - DB 저장 형식)
CATEGORIES = [
    "Expertise", "Leadership", "Vision", "Integrity", "Ethics",
    "Accountability", "Transparency", "Communication", "Responsiveness", "PublicInterest"
]

# 한글 카테고리명 (출력용)
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

# V28: 숫자 문자열 → 점수 변환
RATING_TO_SCORE = {
    '+4': 8, '+3': 6, '+2': 4, '+1': 2,
    '-1': -2, '-2': -4, '-3': -6, '-4': -8
}

# V28: AI별 모델명 (자동 추적용)
AI_MODEL_NAMES = {
    "Claude": "claude-3-5-haiku-20241022",
    "ChatGPT": "gpt-4o-mini",
    "Grok": "grok-4-fast",
    "Gemini": "gemini-2.0-flash"
}

# 등급 체계 (10단계)
GRADE_BOUNDARIES = [
    (920, 1000, 'M', 'Mugunghwa'),   # 최우수
    (840, 919, 'D', 'Diamond'),      # 우수
    (760, 839, 'E', 'Emerald'),      # 양호
    (680, 759, 'P', 'Platinum'),     # 보통+
    (600, 679, 'G', 'Gold'),         # 보통
    (520, 599, 'S', 'Silver'),       # 보통-
    (440, 519, 'B', 'Bronze'),       # 미흡
    (360, 439, 'I', 'Iron'),         # 부족
    (280, 359, 'Tn', 'Tin'),         # 상당히 부족
    (200, 279, 'L', 'Lead')          # 매우 부족
]

AI_NAMES = ["Claude", "ChatGPT", "Grok", "Gemini"]


def get_exact_count(table_name, filters=None):
    """
    정확한 개수 조회 (Supabase 기본 limit 1000 문제 방지)

    ⚠️ 중요: Supabase select()는 기본 1000개만 반환
    → count='exact' 옵션 필수!

    사용법:
        count = get_exact_count('collected_data_v28', {
            'politician_id': 'f9e00370',
            'ai_name': 'Claude'
        })
    """
    try:
        query = supabase.table(table_name).select('*', count='exact')
        if filters:
            for key, value in filters.items():
                if value is not None:
                    query = query.eq(key, value)
        response = query.limit(1).execute()  # 데이터는 1개만, count만 사용
        return response.count if response.count else 0
    except Exception as e:
        print(f"  ⚠️ count 조회 실패: {e}")
        return 0


def get_ratings_from_collected_data(politician_id, ai_name, category_name):
    """
    collected_data_v27 테이블에서 rating 조회

    V27 독립 방식:
    - 각 AI가 자기가 수집한 데이터의 rating만 조회
    - rating이 NULL이 아닌 것만 (평가 완료된 것)
    """
    all_ratings = []
    offset = 0
    limit = 1000

    while True:
        response = supabase.table(TABLE_COLLECTED_DATA).select('rating').eq(
            'politician_id', politician_id
        ).eq(
            'ai_name', ai_name
        ).eq(
            'category_name', category_name
        ).not_.is_('rating', 'null').range(offset, offset + limit - 1).execute()

        if not response.data:
            break

        all_ratings.extend(response.data)

        if len(response.data) < limit:
            break

        offset += limit

    return [RATING_TO_SCORE.get(r['rating'], 0) for r in all_ratings if r['rating'] in RATING_TO_SCORE]


def calculate_category_score(ratings):
    """
    카테고리 점수 계산

    공식: (PRIOR + avg_rating × COEFFICIENT) × 10
    - PRIOR = 6.0
    - COEFFICIENT = 0.5
    - 결과: 20 ~ 100점
    """
    if not ratings:
        return 0, 0

    PRIOR = 6.0
    COEFFICIENT = 0.5

    avg_rating = sum(ratings) / len(ratings)
    score = (PRIOR + avg_rating * COEFFICIENT) * 10

    return max(20, min(100, round(score, 1))), round(avg_rating, 2)


def get_grade(total_score):
    """점수 → 등급 변환"""
    for min_score, max_score, grade_code, grade_name in GRADE_BOUNDARIES:
        if min_score <= total_score <= max_score:
            return grade_code, grade_name
    return 'L', 'Lead'


def save_category_score(politician_id, ai_name, category_name, score, rating_count, avg_rating):
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
            'model_name': AI_MODEL_NAMES.get(ai_name, ''),  # V28: 모델명 추가
            'category_name': category_name,
            'category_score': score,
            'rating_count': rating_count,
            'avg_rating': avg_rating,
            'calculation_version': 'V28',
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
            'model_name': AI_MODEL_NAMES.get(ai_name, ''),  # V28: 모델명 추가
            'total_score': total_score,
            'grade_code': grade_code,
            'grade_name': grade_name,
            'category_scores': category_scores,
            'calculation_version': 'V28',
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
            'calculation_version': 'V28',
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
    total_ratings = 0

    for category in CATEGORIES:
        ratings = get_ratings_from_collected_data(politician_id, ai_name, category)
        score, avg_rating = calculate_category_score(ratings)

        category_scores[category] = {
            'score': score,
            'count': len(ratings),
            'avg_rating': avg_rating
        }
        total_score += score
        total_ratings += len(ratings)

        cat_kr = CATEGORY_NAMES_KR.get(category, category)
        print(f"    {cat_kr}: {score}점 ({len(ratings)}개 평가, 평균: {avg_rating})")

        save_category_score(politician_id, ai_name, category, score, len(ratings), avg_rating)

    total_score = round(min(total_score, 1000))
    grade_code, grade_name = get_grade(total_score)

    print(f"    ─────────────────")
    print(f"    총점: {total_score}점 ({grade_code} - {grade_name})")
    print(f"    총 평가 수: {total_ratings}개")

    save_final_score(politician_id, ai_name, total_score, grade_code, grade_name, category_scores)

    return total_score, grade_code, total_ratings


def check_data_exists(politician_id):
    """수집 데이터 존재 여부 확인"""
    try:
        response = supabase.table(TABLE_COLLECTED_DATA).select(
            'ai_name', count='exact'
        ).eq('politician_id', politician_id).not_.is_('rating', 'null').execute()

        if response.count and response.count > 0:
            # AI별 개수 확인
            ai_counts = {}
            for ai_name in AI_NAMES:
                ai_response = supabase.table(TABLE_COLLECTED_DATA).select(
                    'collected_data_id', count='exact'
                ).eq('politician_id', politician_id).eq(
                    'ai_name', ai_name
                ).not_.is_('rating', 'null').execute()
                ai_counts[ai_name] = ai_response.count or 0

            return True, ai_counts
        return False, {}
    except Exception as e:
        print(f"⚠️ 데이터 확인 오류: {e}")
        return False, {}


def calculate_all_scores(politician_id):
    """전체 점수 계산"""
    print("="*60)
    print("V27.0 독립 방식 점수 계산")
    print("="*60)
    print(f"정치인 ID: {politician_id}")
    print(f"데이터 출처: {TABLE_COLLECTED_DATA} (독립 수집+평가 결과)")
    print("="*60)

    # 데이터 존재 확인
    exists, ai_counts = check_data_exists(politician_id)

    if not exists:
        print("\n⚠️ 평가 데이터가 없습니다!")
        print("먼저 collect_v27.py로 수집+평가를 실행하세요.")
        return 0, 'L'

    print("\n📊 수집된 평가 데이터:")
    for ai_name in AI_NAMES:
        count = ai_counts.get(ai_name, 0)
        print(f"  {ai_name}: {count}개")

    ai_scores = {}

    for ai_name in AI_NAMES:
        if ai_counts.get(ai_name, 0) == 0:
            print(f"\n  [{ai_name}]")
            print(f"    ⚠️ 데이터 없음 - 건너뜀")
            ai_scores[ai_name] = {'score': 0, 'grade': 'N/A', 'count': 0}
            continue

        total_score, grade_code, total_ratings = calculate_ai_scores(politician_id, ai_name)
        ai_scores[ai_name] = {
            'score': total_score,
            'grade': grade_code,
            'count': total_ratings
        }

    # 종합 점수 계산
    print("\n" + "="*60)
    print("종합 점수")
    print("="*60)

    valid_scores = [ai_scores[ai]['score'] for ai in AI_NAMES if ai_scores[ai]['score'] > 0]

    if valid_scores:
        avg_score = round(sum(valid_scores) / len(valid_scores))
        grade_code, grade_name = get_grade(avg_score)

        print(f"\n  {len(valid_scores)}개 AI 평균: {avg_score}점 ({grade_code} - {grade_name})")
        print(f"\n  상세:")
        for ai_name in AI_NAMES:
            score = ai_scores[ai_name]['score']
            grade = ai_scores[ai_name]['grade']
            count = ai_scores[ai_name]['count']
            if score > 0:
                print(f"    {ai_name}: {score}점 ({grade}) - {count}개 평가")
            else:
                print(f"    {ai_name}: 데이터 없음")

        # 변별력 분석
        if len(valid_scores) >= 2:
            score_range = max(valid_scores) - min(valid_scores)
            print(f"\n  📈 변별력 분석:")
            print(f"    최고점: {max(valid_scores)}점")
            print(f"    최저점: {min(valid_scores)}점")
            print(f"    점수 범위: {score_range}점")

            if score_range > 50:
                print(f"    → ✅ 높은 변별력 (범위 > 50점)")
            elif score_range > 20:
                print(f"    → 🔶 중간 변별력 (범위 20~50점)")
            else:
                print(f"    → ⚠️ 낮은 변별력 (범위 < 20점)")

        save_combined_evaluation(politician_id, len(valid_scores), avg_score, grade_code, grade_name, ai_scores)
    else:
        print("  ⚠️ 평가 데이터 없음")
        avg_score = 0
        grade_code = 'L'
        grade_name = 'Lead'

    print("\n" + "="*60)
    print("점수 계산 완료!")
    print("="*60)

    return avg_score, grade_code


def main():
    parser = argparse.ArgumentParser(description='V27.0 독립 방식 점수 계산')
    parser.add_argument('--politician_id', type=str, required=True, help='정치인 ID')
    args = parser.parse_args()

    calculate_all_scores(args.politician_id)


if __name__ == "__main__":
    main()
