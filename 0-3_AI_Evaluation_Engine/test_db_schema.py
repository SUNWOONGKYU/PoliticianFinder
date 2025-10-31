#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import requests
import os
import json
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

# 1. collected_data 테이블 스키마 확인
print("1. collected_data 테이블 조회 테스트")
url = f"{SUPABASE_URL}/rest/v1/collected_data"
headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json'
}

response = requests.get(url + "?select=*&limit=1", headers=headers)
print(f"Status: {response.status_code}")
print(f"Response: {response.text[:500]}")

# 2. 테스트 데이터 삽입
print("\n2. 테스트 데이터 삽입")
test_data = {
    'politician_id': '272',
    'ai_name': 'Claude',
    'category_num': 6,
    'item_num': 1,
    'data_type': '테스트',
    'data_title': '테스트 제목',
    'data_content': '테스트 내용',
    'data_url': 'https://test.com',
    'rating': 3,
    'reliability': 0.95
}

response = requests.post(url, headers=headers, json=test_data)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")

# 3. politicians 테이블 확인
print("\n3. politicians 테이블 확인")
url_politicians = f"{SUPABASE_URL}/rest/v1/politicians"
response = requests.get(url_politicians + "?select=*&name=eq.오세훈", headers=headers)
print(f"Status: {response.status_code}")
print(f"Response: {response.text}")
