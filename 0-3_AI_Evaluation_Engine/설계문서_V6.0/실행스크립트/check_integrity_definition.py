#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
청렴성(Integrity) 정의와 수집 데이터 일치성 검토
"""

import sys, os, io
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from supabase import create_client
from dotenv import load_dotenv
import random

env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(dotenv_path=env_path, override=True)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# 인스트럭션에서 추출한 청렴성 정의
INTEGRITY_DEFINITION = """
청렴성 (Integrity): 부패 방지, 윤리 준수, 이해충돌 회피
"""

# 청렴성의 세부 평가 기준 (정의 분해)
INTEGRITY_CRITERIA = {
    "부패 방지": [
        "뇌물", "금품 수수", "비리", "불법", "부정", "횡령", "배임"
    ],
    "윤리 준수": [
        "윤리", "도덕성", "공직자 윤리", "행동강령", "징계"
    ],
    "이해충돌 회피": [
        "이해충돌", "이해관계", "공사 구분", "겸직", "사적 이익"
    ],
    "기타 청렴성 관련": [
        "청렴", "투명성", "정직성", "신뢰", "공정성", "정보 유출",
        "민감 정보", "직권 남용", "부적절", "의혹"
    ]
}

def categorize_by_criteria(title, content):
    """데이터를 청렴성 기준에 맞춰 분류"""
    text = f"{title} {content}".lower()

    matched_criteria = []
    for criteria_name, keywords in INTEGRITY_CRITERIA.items():
        for keyword in keywords:
            if keyword in text:
                matched_criteria.append(criteria_name)
                break

    return matched_criteria if matched_criteria else ["분류 불가"]

def analyze_integrity_data(politician_id, politician_name):
    """청렴성 데이터 분석"""

    print('='*100)
    print(f'{politician_name} - 청렴성(Integrity) 정의 일치성 검토')
    print('='*100)
    print()

    print('📋 인스트럭션에 명시된 청렴성 정의:')
    print(INTEGRITY_DEFINITION)
    print()
    print('세부 평가 기준:')
    for criteria, keywords in INTEGRITY_CRITERIA.items():
        print(f'  - {criteria}: {", ".join(keywords[:5])}...')
    print()

    # 데이터 조회
    result = supabase.table('collected_data') \
        .select('item_num, data_title, data_content, rating, source_type') \
        .eq('politician_id', politician_id) \
        .eq('category_name', 'Integrity') \
        .execute()

    if not result.data:
        print('데이터 없음')
        return

    total = len(result.data)
    print(f'총 데이터: {total}개')
    print()

    # 기준별 분류
    criteria_counts = {k: 0 for k in INTEGRITY_CRITERIA.keys()}
    criteria_counts["분류 불가"] = 0

    unmatched_items = []

    for item in result.data:
        matched = categorize_by_criteria(item['data_title'], item['data_content'])

        for m in matched:
            criteria_counts[m] += 1

        if matched == ["분류 불가"]:
            unmatched_items.append(item)

    print('='*100)
    print('청렴성 기준별 데이터 분포')
    print('='*100)
    print()

    for criteria, count in criteria_counts.items():
        percentage = (count / total) * 100
        print(f'{criteria:20s}: {count:3d}개 ({percentage:.1f}%)')

    print()

    # 일치율 계산
    matched_count = total - criteria_counts["분류 불가"]
    match_rate = (matched_count / total) * 100

    print('='*100)
    print(f'정의 일치율: {match_rate:.1f}% ({matched_count}/{total}개)')
    print('='*100)
    print()

    # 분류 불가 항목 샘플 출력
    if unmatched_items:
        print('⚠️  청렴성 정의와 맞지 않는 항목 샘플:')
        print('-'*100)
        samples = random.sample(unmatched_items, min(5, len(unmatched_items)))

        for i, item in enumerate(samples, 1):
            print(f'\n[샘플 {i}] 항목 #{item["item_num"]} - 등급: {item["rating"]} ({item["source_type"]})')
            print(f'제목: {item["data_title"]}')
            print(f'내용: {item["data_content"][:150]}...')
    else:
        print('✅ 모든 항목이 청렴성 정의와 일치합니다!')

    print()

def main():
    # 한동훈 분석
    analyze_integrity_data('7abadf92', '한동훈')

    print('\n\n')

    # 이준석 분석
    analyze_integrity_data('567e2c27', '이준석')

    print()
    print('='*100)
    print('청렴성 정의 일치성 검토 완료')
    print('='*100)
    print()
    print('결론:')
    print('- 90% 이상 일치: 데이터 수집이 정의에 부합')
    print('- 70~90% 일치: 일부 개선 필요')
    print('- 70% 미만: 인스트럭션 수정 필요')
    print()

if __name__ == "__main__":
    main()
