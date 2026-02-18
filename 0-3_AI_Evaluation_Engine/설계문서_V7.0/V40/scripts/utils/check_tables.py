# -*- coding: utf-8 -*-
"""V40 테이블 확인"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client

sys.stdout.reconfigure(encoding='utf-8')

load_dotenv(override=True)

supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
supabase = create_client(supabase_url, supabase_key)

print("V40 관련 테이블 찾는 중...")

# 가능한 테이블 이름들
possible_tables = [
    'v40_politician_events',
    'collected_data_v40',
    'v40_data',
    'v40_collected_data',
    'evaluations_v40',
    'scores_v40',
    'politician_events',
    'ai_evaluation_events',
    'evaluation_events'
]

for table_name in possible_tables:
    try:
        result = supabase.table(table_name).select('*').limit(1).execute()
        print(f"[OK] 테이블 존재: {table_name} (레코드 수: {len(result.data)})")
    except Exception as e:
        pass

print("\n조은희(d0a5d6e1) 관련 데이터 찾는 중...")

# 가능한 테이블에서 조은희 데이터 찾기
for table_name in possible_tables:
    try:
        result = supabase.table(table_name).select('*').eq('politician_id', 'd0a5d6e1').limit(1).execute()
        if result.data:
            print(f"[OK] {table_name}: 조은희 데이터 발견 ({len(result.data)}개)")
    except Exception as e:
        pass

print("\n완료")
