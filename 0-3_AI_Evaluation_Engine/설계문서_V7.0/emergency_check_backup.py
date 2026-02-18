#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""긴급 백업 테이블 확인"""

import os
import sys
import io
from supabase import create_client
from dotenv import load_dotenv

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'V30', 'scripts'))
load_dotenv()

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))
politician_id = 'd0a5d6e1'

print('='*80)
print('긴급 백업 확인')
print('='*80)

# 1. 현재 collected_data_v30 개수
result = supabase.table('collected_data_v30').select('*', count='exact').eq('politician_id', politician_id).execute()
current = result.count
print(f'\n현재 collected_data_v30: {current}개')

# 2. 백업 테이블 확인
backup_tables = [
    'collected_data_v30_backup',
    'collected_data_backup',
    'v30_backup',
    'collected_data_v30_original',
]

for table in backup_tables:
    try:
        result = supabase.table(table).select('*', count='exact').eq('politician_id', politician_id).execute()
        print(f'✅ {table}: {result.count}개 발견!')
    except Exception as e:
        if '42P01' in str(e):  # table does not exist
            print(f'❌ {table}: 테이블 없음')
        else:
            print(f'⚠️ {table}: 에러 ({str(e)[:50]})')

# 3. PostgreSQL WAL/트랜잭션 로그 확인 (Supabase SQL Editor로 확인 필요)
print('\n' + '='*80)
print('다음 SQL을 Supabase Dashboard에서 실행하세요:')
print('='*80)
print("""
-- 테이블 목록 확인
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%backup%' OR table_name LIKE '%v30%';

-- 삭제 전 스냅샷 테이블 확인
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
""")
