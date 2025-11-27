#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Compare queries from different scripts
"""

import os
import sys
from supabase import create_client
from dotenv import load_dotenv

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv()

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

oh_id = '62e7b453-9bb6-4f6e-ac3b-1e72a8b5e3f4'

print('=' * 100)
print('Query Comparison')
print('=' * 100)
print()

# Query 1: 간단한 쿼리
print('Query 1: Simple select')
data1 = supabase.table('collected_data').select('rating').eq('politician_id', oh_id).limit(5).execute()
print(f'Results: {[item["rating"] for item in data1.data]}')
print()

# Query 2: category_name도 함께 조회
print('Query 2: With category_name')
data2 = supabase.table('collected_data').select('category_name, rating').eq('politician_id', oh_id).limit(5).execute()
print(f'Results:')
for item in data2.data:
    print(f'  {item["category_name"]}: {repr(item["rating"])}')
print()

# Query 3: Order by collection_date desc
print('Query 3: Order by collection_date desc')
data3 = supabase.table('collected_data').select('rating, collection_date').eq('politician_id', oh_id).order('collection_date', desc=True).limit(5).execute()
print(f'Results:')
for item in data3.data:
    print(f'  {item["collection_date"]}: {repr(item["rating"])}')
print()

# Query 4: Count total
print('Query 4: Total count')
count = supabase.table('collected_data').select('collected_data_id', count='exact').eq('politician_id', oh_id).execute()
print(f'Total items: {count.count}')
