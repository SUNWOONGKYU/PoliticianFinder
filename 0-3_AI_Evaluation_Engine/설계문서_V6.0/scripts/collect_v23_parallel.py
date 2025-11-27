#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
V23.0 병렬 데이터 수집 (자동 재수집 기능 포함)
- 카테고리 5개씩 병렬 처리
- 각 카테고리 내에서는 API 호출 4번 순차 처리
- 목표 미달 시 최대 4회 자동 재수집
"""

import os
import sys
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from collect_v23_final import collect_category, CATEGORIES
from supabase import create_client, Client
from dotenv import load_dotenv
from collections import defaultdict

# 환경 변수 로드
load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# UTF-8 출력 설정 제거 - 백그라운드 실행 시 stdout closed 문제 방지

def collect_category_group(politician_id, politician_name, category_start, category_end):
    """
    카테고리 그룹 병렬 수집

    Args:
        politician_id: 정치인 ID
        politician_name: 정치인 이름
        category_start: 시작 카테고리 번호 (1-based)
        category_end: 종료 카테고리 번호 (1-based, inclusive)
    """
    print(f"\n{'='*80}")
    print(f"카테고리 그룹 {category_start}~{category_end} 병렬 수집 시작")
    print(f"{'='*80}\n")

    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {}

        # 카테고리 제출
        for i in range(category_start, category_end + 1):
            future = executor.submit(collect_category, politician_id, politician_name, i)
            futures[future] = i

        # 완료 대기
        for future in as_completed(futures):
            category_num = futures[future]
            cat_eng, cat_kor = CATEGORIES[category_num - 1]

            try:
                future.result()
                print(f"✅ 카테고리 {category_num} ({cat_kor}) 완료")
            except Exception as e:
                print(f"❌ 카테고리 {category_num} ({cat_kor}) 실패: {e}")

    print(f"\n{'='*80}")
    print(f"카테고리 그룹 {category_start}~{category_end} 완료")
    print(f"{'='*80}\n")

def check_collection_status(politician_id):
    """현재 수집 상태 확인"""
    response = supabase.table('collected_data').select('category_name').eq('politician_id', politician_id).execute()

    if not response.data:
        return {}

    category_counts = defaultdict(int)
    for item in response.data:
        category_counts[item['category_name']] += 1

    return dict(category_counts)

def collect_all_parallel(politician_id, politician_name, max_retries=4):
    """
    전체 10개 카테고리를 5개씩 2그룹으로 병렬 수집 (자동 재수집 포함)

    Args:
        politician_id: 정치인 ID
        politician_name: 정치인 이름
        max_retries: 최대 재수집 횟수 (기본 4회)
    """
    print("="*80)
    print("V23.0 병렬 데이터 수집 시작 (자동 재수집 기능)")
    print("="*80)
    print(f"정치인: {politician_name} (ID: {politician_id})")
    print(f"모델: claude-3-5-haiku-20241022 (Haiku 3.5)")
    print(f"병렬 처리: 카테고리 5개씩 병렬")
    print(f"자동 재수집: 최대 {max_retries}회")
    print("="*80)
    print()

    retry_count = 0

    while retry_count <= max_retries:
        if retry_count > 0:
            print(f"\n{'='*80}")
            print(f"🔄 재수집 {retry_count}회차 시작")
            print(f"{'='*80}\n")

        # 그룹 1: 카테고리 1~5 병렬 처리
        collect_category_group(politician_id, politician_name, 1, 5)

        # 그룹 2: 카테고리 6~10 병렬 처리
        collect_category_group(politician_id, politician_name, 6, 10)

        # 수집 상태 확인
        print(f"\n{'='*80}")
        print(f"📊 수집 상태 확인 (재수집 {retry_count}회차 완료)")
        print(f"{'='*80}\n")

        category_counts = check_collection_status(politician_id)

        incomplete_categories = []
        for i, (cat_eng, cat_kor) in enumerate(CATEGORIES, 1):
            count = category_counts.get(cat_eng, 0)
            if count < 50:
                print(f"⚠️  카테고리 {i} ({cat_kor}): {count}/50개 (부족: {50-count}개)")
                incomplete_categories.append((i, cat_eng, cat_kor, count))
            else:
                print(f"✅ 카테고리 {i} ({cat_kor}): {count}/50개")

        # 모든 카테고리가 50개 이상이면 완료
        if not incomplete_categories:
            print(f"\n{'='*80}")
            print("✅ 모든 카테고리 50개 달성! 수집 완료!")
            print(f"{'='*80}")
            break

        # 재수집 횟수 초과 시 종료
        if retry_count >= max_retries:
            print(f"\n{'='*80}")
            print(f"⚠️  최대 재수집 횟수({max_retries}회) 도달")
            print(f"   미달 카테고리: {len(incomplete_categories)}개")
            for i, cat_eng, cat_kor, count in incomplete_categories:
                print(f"   - 카테고리 {i} ({cat_kor}): {count}/50개")
            print(f"{'='*80}")
            break

        retry_count += 1

    print("\n" + "="*80)
    print("✅ V23.0 병렬 수집 완료!")
    print("="*80)

def main():
    parser = argparse.ArgumentParser(description='V23.0 병렬 데이터 수집')
    parser.add_argument('--politician_id', type=str, required=True, help='정치인 ID (숫자+문자 10자 이내)')
    parser.add_argument('--politician_name', type=str, required=True, help='정치인 이름')

    args = parser.parse_args()

    collect_all_parallel(args.politician_id, args.politician_name)

if __name__ == "__main__":
    main()
