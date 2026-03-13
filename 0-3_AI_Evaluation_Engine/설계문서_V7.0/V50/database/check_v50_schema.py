# -*- coding: utf-8 -*-
"""V50 스키마 확인 스크립트
- collected_data_v50, evaluations_v50, ai_final_scores_v50 테이블 존재 여부
- politicians 테이블 V50 컬럼 추가 여부
"""

import os, sys
sys.stdout.reconfigure(encoding='utf-8')

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

OK  = '✅'
NG  = '❌'

# ── 1. V50 신규 테이블 3개 확인 ─────────────────────────────────────────
print('=' * 50)
print('V50 신규 테이블 확인')
print('=' * 50)

tables = ['collected_data_v50', 'evaluations_v50', 'ai_category_scores_v50', 'ai_final_scores_v50']
for tbl in tables:
    try:
        res = supabase.table(tbl).select('id').limit(1).execute()
        print(f'{OK} {tbl}')
    except Exception as e:
        print(f'{NG} {tbl}  → {e}')

# ── 2. politicians 테이블 V50 컬럼 6개 확인 ─────────────────────────────
print()
print('=' * 50)
print('politicians 테이블 V50 컬럼 확인')
print('=' * 50)

v50_columns = [
    'processing_status',
    'error_detail',
    'final_score',
    'grade',
    'report_path',
    'completed_at',
]

try:
    # information_schema로 컬럼 목록 조회
    res = supabase.rpc('get_columns', {}).execute() if False else None

    # 직접 SELECT로 컬럼 존재 확인
    row = supabase.table('politicians').select(', '.join(v50_columns)).limit(1).execute()
    for col in v50_columns:
        print(f'{OK} politicians.{col}')

except Exception as e:
    # 컬럼 단위로 개별 확인
    for col in v50_columns:
        try:
            supabase.table('politicians').select(col).limit(1).execute()
            print(f'{OK} politicians.{col}')
        except Exception as ce:
            print(f'{NG} politicians.{col}  → {ce}')

print()
print('확인 완료')
