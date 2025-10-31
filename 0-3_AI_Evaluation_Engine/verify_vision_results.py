#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
비전 카테고리 평가 결과 확인
"""

import os
from dotenv import load_dotenv
import requests
import json

load_dotenv()

POLITICIAN_NAME = '오세훈'
CATEGORY_NUM = 3
CATEGORY_NAME = '비전'
AI_NAME = 'Claude'

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

HEADERS = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
    'Content-Type': 'application/json'
}

VISION_ITEMS = {
    1: '중장기 발전 계획 수립 여부',
    2: '미래 투자 예산 비율',
    3: '지속가능발전(SDGs) 예산 비율',
    4: '디지털 전환 관련 예산/사업 건수',
    5: '미래 키워드 언론 보도 건수',
    6: '해외 언론 보도 건수',
    7: '청년층 여론조사 지지율/SNS 반응'
}


def get_politician_uuid():
    """정치인 UUID 조회"""
    url = f"{SUPABASE_URL}/rest/v1/politicians"
    params = {'name': f'eq.{POLITICIAN_NAME}'}

    response = requests.get(url, headers=HEADERS, params=params)

    if response.status_code == 200:
        data = response.json()
        if data and len(data) > 0:
            return data[0]['id']

    return None


def main():
    print("="*80)
    print(f"카테고리 {CATEGORY_NUM}: {CATEGORY_NAME} 평가 결과")
    print(f"정치인: {POLITICIAN_NAME}")
    print(f"AI: {AI_NAME}")
    print("="*80)

    try:
        politician_uuid = get_politician_uuid()
        if not politician_uuid:
            print("오류: 정치인을 찾을 수 없습니다.")
            return

        print(f"\n정치인 UUID: {politician_uuid}")

        # collected_data 조회
        url = f"{SUPABASE_URL}/rest/v1/collected_data"
        params = {
            'politician_id': f'eq.{politician_uuid}',
            'category_num': f'eq.{CATEGORY_NUM}',
            'ai_name': f'eq.{AI_NAME}',
            'select': 'item_num,rating'
        }

        response = requests.get(url, headers=HEADERS, params=params)

        if response.status_code == 200:
            data = response.json()

            print("\n" + "="*80)
            print("[1] 수집된 원본 데이터 (collected_data)")
            print("="*80)

            # 항목별 통계
            item_stats = {}
            for row in data:
                item_num = row['item_num']
                rating = row['rating']

                if item_num not in item_stats:
                    item_stats[item_num] = {'count': 0, 'ratings': []}

                item_stats[item_num]['count'] += 1
                item_stats[item_num]['ratings'].append(rating)

            for item_num in sorted(item_stats.keys()):
                stats = item_stats[item_num]
                avg_rating = sum(stats['ratings']) / len(stats['ratings'])
                item_name = VISION_ITEMS[item_num]

                print(f"\n항목 {item_num}: {item_name}")
                print(f"  - 데이터 개수: {stats['count']}개")
                print(f"  - 평균 Rating: {avg_rating:.2f}")
                print(f"  - Rating 분포: {stats['ratings']}")

            # 전체 통계
            total_count = len(data)
            all_ratings = [row['rating'] for row in data]
            overall_avg = sum(all_ratings) / len(all_ratings) if all_ratings else 0

            print("\n" + "-"*80)
            print(f"총 데이터 개수: {total_count}개")
            print(f"전체 평균 Rating: {overall_avg:.2f}")
            print("-"*80)

        # ai_item_scores 조회
        url = f"{SUPABASE_URL}/rest/v1/ai_item_scores"
        params = {
            'politician_id': f'eq.{politician_uuid}',
            'category_num': f'eq.{CATEGORY_NUM}',
            'ai_name': f'eq.{AI_NAME}',
            'select': 'item_num,item_score,rating_avg,data_count',
            'order': 'item_num'
        }

        response = requests.get(url, headers=HEADERS, params=params)

        if response.status_code == 200:
            scores = response.json()

            if scores:
                print("\n" + "="*80)
                print("[2] 자동 계산된 항목 점수 (ai_item_scores)")
                print("="*80)
                print("공식: Item_Score = 7.0 + (rating_avg × 0.6)")
                print("-"*80)

                total_item_score = 0
                for row in scores:
                    item_num = row['item_num']
                    item_name = VISION_ITEMS[item_num]
                    item_score = row['item_score']
                    rating_avg = row['rating_avg']
                    data_count = row['data_count']

                    total_item_score += item_score

                    print(f"\n항목 {item_num}: {item_name}")
                    print(f"  - 항목 점수: {item_score:.2f}/10.0")
                    print(f"  - Rating 평균: {rating_avg:.2f}")
                    print(f"  - 데이터 개수: {data_count}개")
                    print(f"  - 계산: 7.0 + ({rating_avg:.2f} × 0.6) = {item_score:.2f}")

                avg_item_score = total_item_score / len(scores) if scores else 0
                print("\n" + "-"*80)
                print(f"7개 항목 평균 점수: {avg_item_score:.2f}/10.0")
                print("-"*80)

        # ai_category_scores 조회
        url = f"{SUPABASE_URL}/rest/v1/ai_category_scores"
        params = {
            'politician_id': f'eq.{politician_uuid}',
            'category_num': f'eq.{CATEGORY_NUM}',
            'ai_name': f'eq.{AI_NAME}',
            'select': 'category_score,items_completed'
        }

        response = requests.get(url, headers=HEADERS, params=params)

        if response.status_code == 200:
            category_result = response.json()

            if category_result and len(category_result) > 0:
                row = category_result[0]
                print("\n" + "="*80)
                print("[3] 자동 계산된 분야 점수 (ai_category_scores)")
                print("="*80)
                print("공식: Category_Score = (7개 항목 평균) × 10")
                print("-"*80)
                print(f"\n카테고리 {CATEGORY_NUM}: {CATEGORY_NAME}")
                print(f"  - 분야 점수: {row['category_score']:.2f}/100.0")
                print(f"  - 완료 항목: {row['items_completed']}/7개")
                print(f"  - 계산: {row['category_score']/10:.2f} × 10 = {row['category_score']:.2f}")

        print("\n" + "="*80)
        print("완료: 카테고리 3 (비전) 평가 완료")
        print("="*80)

    except Exception as e:
        print(f"\n오류 발생: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
