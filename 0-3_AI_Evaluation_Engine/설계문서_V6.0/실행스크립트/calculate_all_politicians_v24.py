#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
V24.0 전체 정치인 점수 계산 (DB 자동 조회)
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

# .env 파일 명시적 경로 지정 (루트 디렉터리)
env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(dotenv_path=env_path, override=True)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

# Verify environment
print(f"[ENV] SUPABASE_URL: {SUPABASE_URL}")
print(f"[ENV] Loaded from: {env_path}")
print()

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

# V24.0: 알파벳 → 숫자 변환 매핑
ALPHABET_GRADES = {
    'A': 8, 'B': 6, 'C': 4, 'D': 2,
    'E': -2, 'F': -4, 'G': -6, 'H': -8
}

def calculate_score(politician_id, politician_name):
    """정치인 점수 계산"""

    # Fresh connection to avoid caching
    fresh_supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    # 데이터 조회
    response = fresh_supabase.table('collected_data') \
        .select('category_name, rating') \
        .eq('politician_id', politician_id) \
        .execute()

    if not response.data:
        return None

    # DEBUG: 오세훈만 샘플 출력
    if politician_name == "오세훈" and politician_id == "62e7b453":
        print(f"\n[DEBUG] Raw data for {politician_name} (ID: {politician_id})")
        print(f"  Total items: {len(response.data)}")
        print(f"  Sample ratings: {[item['rating'] for item in response.data[:10]]}")
        print()

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

        # V24.0: 알파벳 → 숫자 변환
        numeric_ratings = [ALPHABET_GRADES.get(r, 0) for r in ratings]

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

def save_to_db(politician_id, result):
    """점수를 DB에 저장"""
    ai_name = 'Claude'

    try:
        # 1. 카테고리별 점수 저장 (ai_category_scores)
        print(f"  💾 카테고리 점수 저장 중...")

        for cat_eng, cat_kor in CATEGORIES:
            if cat_kor in result['category_scores']:
                cat_score = result['category_scores'][cat_kor]['score']

                # UPSERT (있으면 UPDATE, 없으면 INSERT)
                supabase.table('ai_category_scores').upsert({
                    'politician_id': politician_id,
                    'ai_name': ai_name,
                    'category_name': cat_eng,
                    'category_score': round(cat_score)
                }, on_conflict='politician_id,ai_name,category_name').execute()

        print(f"     ✅ 카테고리 점수 10개 저장 완료")

        # 2. 최종 점수 저장 (ai_final_scores)
        print(f"  💾 최종 점수 저장 중...")

        # 등급 코드 추출 (예: "M (Mugunghwa)" → "M")
        grade_code = result['final_grade'].split()[0]

        supabase.table('ai_final_scores').upsert({
            'politician_id': politician_id,
            'ai_name': ai_name,
            'total_score': result['final_score'],
            'grade_code': grade_code,
            'grade_name': result['grade_desc']
        }, on_conflict='politician_id,ai_name').execute()

        print(f"     ✅ 최종 점수 저장 완료")

        return True

    except Exception as e:
        print(f"     ❌ DB 저장 실패: {e}")
        return False

def main():
    print("="*100)
    print("V24.0 전체 정치인 최종 점수 (계산 및 DB 저장)")
    print("="*100)
    print()

    # DB에서 전체 정치인 목록 조회
    pol_response = supabase.table('politicians').select('id, name').order('name').execute()
    politicians = [(p['id'], p['name']) for p in pol_response.data]

    print(f"총 {len(politicians)}명의 정치인 점수 계산 중...")
    print()

    results = []
    for pol_id, pol_name in politicians:
        result = calculate_score(pol_id, pol_name)
        if result:
            results.append(result)
            result['politician_id'] = pol_id  # ID 저장

            print(f"{pol_name} (ID: {pol_id}):")
            print(f"  최종 점수: {result['final_score']}점")
            print(f"  최종 등급: {result['final_grade']} - {result['grade_desc']}")
            print(f"  데이터 개수: {result['data_count']}개")
            print()

            # 카테고리별 점수 출력
            for cat_name, cat_info in result['category_scores'].items():
                print(f"    {cat_name}: {cat_info['score']:.2f}점 (평균: {cat_info['avg_rating']:.2f})")
            print()

            # DB 저장
            save_to_db(pol_id, result)
            print()

    # 점수 순으로 정렬
    results.sort(key=lambda x: x['final_score'], reverse=True)

    print("="*100)
    print("최종 순위")
    print("="*100)
    print()

    for i, result in enumerate(results, 1):
        print(f"{i}위: {result['name']} (ID: {result['politician_id']}) - {result['final_score']}점 ({result['final_grade']})")

    print()
    print("="*100)
    print("✅ 모든 정치인의 점수가 DB에 저장되었습니다!")
    print("="*100)

if __name__ == "__main__":
    main()
