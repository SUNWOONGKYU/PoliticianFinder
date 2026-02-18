#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""검증 실패 원인 분석"""

import os
import sys
import io
import requests
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv()

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

politician_id = 'd0a5d6e1'

print('=' * 80)
print('검증 실패 원인 분석')
print('=' * 80)

# Gemini 데이터 샘플 (10개)
print('\n[1] Gemini URL 샘플 (10개)')
print('-' * 80)
result = supabase.table('collected_data_v30').select('source_url, title, source_name, data_type, published_date')\
    .eq('politician_id', politician_id)\
    .eq('collector_ai', 'Gemini')\
    .limit(10)\
    .execute()

gemini_urls = []
for idx, item in enumerate(result.data, 1):
    url = item['source_url']
    gemini_urls.append(url)
    print(f"\n{idx}. {item['title'][:50]}...")
    print(f"   Source: {item.get('source_name', 'N/A')} ({item['data_type']})")
    print(f"   Date: {item.get('published_date', 'N/A')}")
    print(f"   URL: {url}")

    # URL 실제 접근 테스트
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.head(url, headers=headers, timeout=10, allow_redirects=True)
        if response.status_code < 400:
            print(f"   ✅ 접근 가능 (status: {response.status_code})")
        else:
            print(f"   ❌ 접근 불가 (status: {response.status_code})")
    except requests.exceptions.Timeout:
        print(f"   ⏱️ Timeout (10초)")
    except requests.exceptions.ConnectionError:
        print(f"   🔌 Connection Error")
    except Exception as e:
        print(f"   ❌ Error: {type(e).__name__}")

# Perplexity 데이터 샘플 (10개)
print('\n\n[2] Perplexity URL 샘플 (10개)')
print('-' * 80)
result = supabase.table('collected_data_v30').select('source_url, title, source_name, data_type, published_date')\
    .eq('politician_id', politician_id)\
    .eq('collector_ai', 'Perplexity')\
    .limit(10)\
    .execute()

perplexity_urls = []
for idx, item in enumerate(result.data, 1):
    url = item['source_url']
    perplexity_urls.append(url)
    print(f"\n{idx}. {item['title'][:50]}...")
    print(f"   Source: {item.get('source_name', 'N/A')} ({item['data_type']})")
    print(f"   Date: {item.get('published_date', 'N/A')}")
    print(f"   URL: {url}")

    # URL 실제 접근 테스트
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.head(url, headers=headers, timeout=10, allow_redirects=True)
        if response.status_code < 400:
            print(f"   ✅ 접근 가능 (status: {response.status_code})")
        else:
            print(f"   ❌ 접근 불가 (status: {response.status_code})")
    except requests.exceptions.Timeout:
        print(f"   ⏱️ Timeout (10초)")
    except requests.exceptions.ConnectionError:
        print(f"   🔌 Connection Error")
    except Exception as e:
        print(f"   ❌ Error: {type(e).__name__}")

# 통계
print('\n\n[3] AI별 전체 현황')
print('-' * 80)
for ai in ['Gemini', 'Perplexity']:
    result = supabase.table('collected_data_v30').select('*', count='exact')\
        .eq('politician_id', politician_id)\
        .eq('collector_ai', ai)\
        .execute()
    print(f'{ai}: {result.count}개')

print('\n' + '=' * 80)
