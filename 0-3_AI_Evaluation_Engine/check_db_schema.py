#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DB 스키마 확인
"""

import os
from dotenv import load_dotenv
import requests

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

HEADERS = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
    'Content-Type': 'application/json'
}


def check_table(table_name):
    """테이블 샘플 데이터 조회"""
    print(f"\n{'='*80}")
    print(f"테이블: {table_name}")
    print('='*80)

    url = f"{SUPABASE_URL}/rest/v1/{table_name}"
    params = {'limit': 1}

    response = requests.get(url, headers=HEADERS, params=params)

    if response.status_code == 200:
        data = response.json()
        if data and len(data) > 0:
            print("컬럼:")
            for key in data[0].keys():
                print(f"  - {key}")
        else:
            print("데이터 없음")
    else:
        print(f"오류: {response.status_code}")
        print(response.text)


def main():
    print("="*80)
    print("DB 스키마 확인")
    print("="*80)

    tables = [
        'politicians',
        'collected_data',
        'ai_item_scores',
        'ai_category_scores',
        'ai_final_scores',
        'combined_final_scores'
    ]

    for table in tables:
        check_table(table)


if __name__ == '__main__':
    main()
