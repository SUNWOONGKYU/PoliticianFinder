#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
한동훈/이준석 청렴성/투명성 데이터 상세 검토
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

def review_category_detailed(politician_id, politician_name, category_name, category_kor):
    """카테고리 데이터 상세 검토"""

    print('='*100)
    print(f'{politician_name} - {category_kor} ({category_name}) 데이터 상세 검토')
    print('='*100)
    print()

    # 데이터 조회
    result = supabase.table('collected_data') \
        .select('item_num, data_title, data_content, rating, rating_rationale, source_type, data_source') \
        .eq('politician_id', politician_id) \
        .eq('category_name', category_name) \
        .order('item_num') \
        .execute()

    if not result.data:
        print('데이터 없음')
        return

    total = len(result.data)
    print(f'총 데이터: {total}개')
    print()

    # 등급별 분류
    ratings = {}
    for item in result.data:
        r = item['rating']
        if r not in ratings:
            ratings[r] = []
        ratings[r].append(item)

    print('등급별 개수:')
    for grade in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']:
        if grade in ratings:
            print(f'  {grade}: {len(ratings[grade])}개')
    print()

    # 부정 평가 샘플 (E, F, G, H 등급)
    negative_items = []
    for grade in ['E', 'F', 'G', 'H']:
        if grade in ratings:
            negative_items.extend(ratings[grade])

    if negative_items:
        print('='*100)
        print(f'부정 평가 상세 샘플 (총 {len(negative_items)}개 중 3개)')
        print('='*100)
        samples = random.sample(negative_items, min(3, len(negative_items)))

        for i, item in enumerate(samples, 1):
            print()
            print(f'[샘플 {i}] 항목 #{item["item_num"]} - 등급: {item["rating"]} ({item["source_type"]})')
            print('-'*100)
            print(f'제목: {item["data_title"]}')
            print()
            print(f'출처: {item["data_source"]}')
            print()
            print('내용:')
            content = item["data_content"]
            if len(content) > 300:
                print(f'{content[:300]}...')
            else:
                print(content)
            print()
            print('평가 근거:')
            print(item["rating_rationale"])
            print()

    # 긍정 평가 샘플 (A, B, C 등급)
    positive_items = []
    for grade in ['A', 'B', 'C']:
        if grade in ratings:
            positive_items.extend(ratings[grade])

    if positive_items:
        print('='*100)
        print(f'긍정 평가 상세 샘플 (총 {len(positive_items)}개 중 2개)')
        print('='*100)
        samples = random.sample(positive_items, min(2, len(positive_items)))

        for i, item in enumerate(samples, 1):
            print()
            print(f'[샘플 {i}] 항목 #{item["item_num"]} - 등급: {item["rating"]} ({item["source_type"]})')
            print('-'*100)
            print(f'제목: {item["data_title"]}')
            print()
            print(f'출처: {item["data_source"]}')
            print()
            print('내용:')
            content = item["data_content"]
            if len(content) > 300:
                print(f'{content[:300]}...')
            else:
                print(content)
            print()
            print('평가 근거:')
            print(item["rating_rationale"])
            print()

    print()

def main():
    # 한동훈 청렴성
    review_category_detailed('7abadf92', '한동훈', 'Integrity', '청렴성')

    print('\n\n')

    # 한동훈 투명성
    review_category_detailed('7abadf92', '한동훈', 'Transparency', '투명성')

    print('\n\n')

    # 이준석 청렴성
    review_category_detailed('567e2c27', '이준석', 'Integrity', '청렴성')

    print()
    print('='*100)
    print('데이터 품질 검토 완료')
    print('='*100)
    print()
    print('✅ 검토 기준:')
    print('1. 제목이 청렴성/투명성 카테고리와 직접 관련 있는가?')
    print('2. 내용이 해당 카테고리 주제를 다루고 있는가?')
    print('3. 평가 근거가 카테고리 기준에 맞는가?')
    print('4. 엉뚱한 주제나 무관한 내용이 없는가?')
    print()

if __name__ == "__main__":
    main()
