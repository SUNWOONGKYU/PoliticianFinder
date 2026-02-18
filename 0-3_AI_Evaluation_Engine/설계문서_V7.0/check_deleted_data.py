#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""삭제된 데이터 확인 및 복구 가능성 분석"""

import os
import sys
import io
from supabase import create_client
from dotenv import load_dotenv

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
load_dotenv()

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

politician_id = 'd0a5d6e1'

print('=' * 80)
print('데이터 삭제 확인')
print('=' * 80)

# 현재 남은 데이터
result = supabase.table('collected_data_v30').select('*', count='exact')\
    .eq('politician_id', politician_id)\
    .execute()

print(f'\n현재 남은 데이터: {result.count}개')

# AI별
for ai in ['Gemini', 'Perplexity']:
    result = supabase.table('collected_data_v30').select('*', count='exact')\
        .eq('politician_id', politician_id)\
        .eq('collector_ai', ai)\
        .execute()
    print(f'  {ai}: {result.count}개')

# 백업 테이블 확인
print('\n백업 테이블 확인:')
backup_tables = [
    'collected_data_v30_backup',
    'collected_data_backup',
    'collected_data_v26_backup',
]

for table in backup_tables:
    try:
        result = supabase.table(table).select('*', count='exact')\
            .eq('politician_id', politician_id)\
            .execute()
        print(f'  {table}: {result.count}개 ✅')
    except Exception as e:
        print(f'  {table}: 없음 ❌')

# Supabase 복구 기능 안내
print('\n' + '=' * 80)
print('복구 옵션:')
print('=' * 80)
print('\n1. Supabase Time Travel (Pro 플랜)')
print('   - Supabase Dashboard → Database → Backups')
print('   - Point-in-time recovery 가능')
print('   - 최근 7일 내 복구 가능')

print('\n2. 백업 테이블에서 복구')
print('   - 백업 테이블이 있으면 복사')

print('\n3. 재수집')
print('   - collect_v30.py 재실행')
print('   - 약 2-3시간 소요 예상')

print('\n현재 상황:')
if result.count < 100:
    print('  ⚠️ 데이터 대부분 삭제됨')
    print('  ⚠️ 백업 또는 재수집 필요')
else:
    print('  ✅ 데이터 일부 남아있음')

print('=' * 80)
