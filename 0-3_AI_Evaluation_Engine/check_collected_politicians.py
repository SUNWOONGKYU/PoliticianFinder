#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import sys
from supabase import create_client
from dotenv import load_dotenv

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

# collected_data에서 정치인별 데이터 수 확인
response = supabase.table('collected_data').select('politician_id').execute()

from collections import Counter
politician_counts = Counter([item['politician_id'] for item in response.data])

# politicians 테이블에서 이름 가져오기
politicians = supabase.table('politicians').select('id, name').execute()
name_map = {p['id']: p['name'] for p in politicians.data}

print('데이터가 수집된 정치인:')
print('='*60)
for pid, count in politician_counts.most_common():
    print(f'{name_map.get(pid, "이름없음")} (ID: {pid}): {count}개')
