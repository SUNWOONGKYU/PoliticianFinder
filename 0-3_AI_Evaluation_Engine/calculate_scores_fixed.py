#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
점수 계산 (실제 DB 스키마에 맞춤)
"""

import os
from dotenv import load_dotenv
import requests

load_dotenv()

POLITICIAN_NAME = '오세훈'
CATEGORY_NUM = 3
AI_NAME = 'Claude'

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

HEADERS = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
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


def calculate_item_scores(politician_uuid):
    """항목 점수 계산 및 삽입"""
    print("\n[Step 1] 항목 점수 (ai_item_scores) 계산 중...")

    # collected_data에서 항목별 rating 평균 조회
    url = f"{SUPABASE_URL}/rest/v1/collected_data"
    params = {
        'politician_id': f'eq.{politician_uuid}',
        'category_num': f'eq.{CATEGORY_NUM}',
        'ai_name': f'eq.{AI_NAME}',
        'select': 'item_num,rating'
    }

    response = requests.get(url, headers=HEADERS, params=params)

    if response.status_code != 200:
        print(f"오류: collected_data 조회 실패 - {response.status_code}")
        return

    data = response.json()

    # 항목별 통계 계산
    item_stats = {}
    for row in data:
        item_num = row['item_num']
        rating = row['rating']

        if item_num not in item_stats:
            item_stats[item_num] = {'ratings': [], 'count': 0}

        item_stats[item_num]['ratings'].append(rating)
        item_stats[item_num]['count'] += 1

    # 기존 데이터 삭제
    delete_url = f"{SUPABASE_URL}/rest/v1/ai_item_scores?politician_id=eq.{politician_uuid}&ai_name=eq.{AI_NAME}&category_num=eq.{CATEGORY_NUM}"
    requests.delete(delete_url, headers=HEADERS)

    # 항목 점수 계산 및 삽입
    url = f"{SUPABASE_URL}/rest/v1/ai_item_scores"
    total_score = 0

    for item_num in sorted(item_stats.keys()):
        stats = item_stats[item_num]
        rating_avg = sum(stats['ratings']) / len(stats['ratings'])
        item_score = 7.0 + (rating_avg * 0.6)

        # 범위 제한
        if item_score < 4.0:
            item_score = 4.0
        elif item_score > 10.0:
            item_score = 10.0

        total_score += item_score

        payload = {
            'politician_id': politician_uuid,
            'ai_name': AI_NAME,
            'category_num': CATEGORY_NUM,
            'item_num': item_num,
            'item_score': round(item_score, 2),
            'data_count': stats['count']
        }

        response = requests.post(url, headers=HEADERS, json=payload)

        if response.status_code in [200, 201]:
            print(f"  항목 {item_num}: 점수={item_score:.2f}, rating_avg={rating_avg:.2f}, 데이터={stats['count']}개")
        else:
            print(f"  항목 {item_num}: 오류 - {response.status_code}")

    avg_score = total_score / len(item_stats) if item_stats else 0
    print(f"\n  7개 항목 평균: {avg_score:.2f}/10.0")
    return avg_score


def calculate_category_score(politician_uuid, item_avg):
    """분야 점수 계산 및 삽입"""
    print("\n[Step 2] 분야 점수 (ai_category_scores) 계산 중...")

    category_score = item_avg * 10

    # 기존 데이터 삭제
    delete_url = f"{SUPABASE_URL}/rest/v1/ai_category_scores?politician_id=eq.{politician_uuid}&ai_name=eq.{AI_NAME}&category_num=eq.{CATEGORY_NUM}"
    requests.delete(delete_url, headers=HEADERS)

    # 분야 점수 삽입
    payload = {
        'politician_id': politician_uuid,
        'ai_name': AI_NAME,
        'category_num': CATEGORY_NUM,
        'category_score': round(category_score, 2)
    }

    url = f"{SUPABASE_URL}/rest/v1/ai_category_scores"
    response = requests.post(url, headers=HEADERS, json=payload)

    if response.status_code in [200, 201]:
        print(f"  분야 점수: {category_score:.2f}/100.0")
        print(f"  계산식: {item_avg:.2f} × 10 = {category_score:.2f}")
    else:
        print(f"  오류: {response.status_code} - {response.text}")


def display_final_results(politician_uuid):
    """최종 결과 표시"""
    print("\n" + "="*80)
    print("최종 결과 요약")
    print("="*80)

    # 항목 점수 조회
    url = f"{SUPABASE_URL}/rest/v1/ai_item_scores"
    params = {
        'politician_id': f'eq.{politician_uuid}',
        'category_num': f'eq.{CATEGORY_NUM}',
        'ai_name': f'eq.{AI_NAME}',
        'select': 'item_num,item_score,data_count',
        'order': 'item_num'
    }

    response = requests.get(url, headers=HEADERS, params=params)

    if response.status_code == 200:
        scores = response.json()
        print("\n[항목별 점수]")
        for row in scores:
            print(f"  항목 {row['item_num']}: {row['item_score']:.2f}/10.0 ({row['data_count']}개 데이터)")

    # 분야 점수 조회
    url = f"{SUPABASE_URL}/rest/v1/ai_category_scores"
    params = {
        'politician_id': f'eq.{politician_uuid}',
        'category_num': f'eq.{CATEGORY_NUM}',
        'ai_name': f'eq.{AI_NAME}',
        'select': 'category_score'
    }

    response = requests.get(url, headers=HEADERS, params=params)

    if response.status_code == 200:
        result = response.json()
        if result:
            print(f"\n[분야 점수]")
            print(f"  카테고리 {CATEGORY_NUM} (비전): {result[0]['category_score']:.2f}/100.0")


def main():
    print("="*80)
    print("카테고리 3 (비전) 점수 계산")
    print(f"정치인: {POLITICIAN_NAME}")
    print(f"AI: {AI_NAME}")
    print("="*80)

    try:
        politician_uuid = get_politician_uuid()
        if not politician_uuid:
            print("오류: 정치인을 찾을 수 없습니다.")
            return

        print(f"\n정치인 UUID: {politician_uuid}")

        # Step 1: 항목 점수 계산
        item_avg = calculate_item_scores(politician_uuid)

        # Step 2: 분야 점수 계산
        calculate_category_score(politician_uuid, item_avg)

        # 최종 결과 표시
        display_final_results(politician_uuid)

        print("\n" + "="*80)
        print("완료: 카테고리 3 (비전) 완료")
        print("="*80)

    except Exception as e:
        print(f"\n오류 발생: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
