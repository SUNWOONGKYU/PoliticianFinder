# -*- coding: utf-8 -*-
"""
김민석 데이터 확인 스크립트
"""
import os
import sys
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv()

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# 김민석 데이터 확인
politician_id = 'f9e00370'
result = supabase.table('collected_data_v30').select('*', count='exact').eq('politician_id', politician_id).execute()

print(f'김민석 (ID: {politician_id}) 데이터:')
print(f'  총 {result.count}개')

if result.count > 0:
    # AI별 분포
    ai_count = {}
    for item in result.data:
        ai = item.get('collector_ai', 'Unknown')
        ai_count[ai] = ai_count.get(ai, 0) + 1

    print(f'\n  AI별 분포:')
    for ai, count in sorted(ai_count.items()):
        print(f'    - {ai}: {count}개')

    # 카테고리별 분포
    cat_count = {}
    for item in result.data:
        cat = item.get('category', 'Unknown')
        cat_count[cat] = cat_count.get(cat, 0) + 1

    print(f'\n  카테고리별 분포:')
    for cat, count in sorted(cat_count.items()):
        print(f'    - {cat}: {count}개')
else:
    print('  ❌ 데이터 없음 (삭제되었거나 수집 안 됨)')
