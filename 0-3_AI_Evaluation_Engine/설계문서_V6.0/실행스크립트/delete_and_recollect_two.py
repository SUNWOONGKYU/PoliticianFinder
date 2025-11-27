#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
이준석/한동훈 데이터 삭제 및 재수집
"""

import sys, os, io
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from supabase import create_client
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(dotenv_path=env_path, override=True)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

POLITICIANS = [
    ('567e2c27', '이준석'),
    ('7abadf92', '한동훈')
]

def delete_politician_data(politician_id, politician_name):
    """정치인 데이터 삭제"""
    print(f'\n{"="*80}')
    print(f'{politician_name} (ID: {politician_id}) 데이터 삭제')
    print('='*80)

    try:
        # collected_data 삭제
        result = supabase.table('collected_data').delete().eq('politician_id', politician_id).execute()
        print(f'✅ collected_data: 삭제 완료')

        # ai_category_scores 삭제
        result = supabase.table('ai_category_scores').delete().eq('politician_id', politician_id).execute()
        print(f'✅ ai_category_scores: 삭제 완료')

        # ai_final_scores 삭제
        result = supabase.table('ai_final_scores').delete().eq('politician_id', politician_id).execute()
        print(f'✅ ai_final_scores: 삭제 완료')

        print(f'\n✅ {politician_name} 모든 데이터 삭제 완료')

    except Exception as e:
        print(f'❌ 삭제 실패: {e}')

def main():
    print('='*80)
    print('이준석/한동훈 데이터 삭제 및 재수집 준비')
    print('='*80)
    print()
    print('개선된 인스트럭션으로 재수집합니다.')
    print('- 10개 카테고리 정의 개선 적용')
    print('- 카테고리 간 혼동 방지')
    print('- 데이터 품질 향상 기대')
    print()

    for pol_id, pol_name in POLITICIANS:
        delete_politician_data(pol_id, pol_name)

    print()
    print('='*80)
    print('✅ 삭제 완료')
    print('='*80)
    print()
    print('다음 명령으로 재수집하세요:')
    print()
    print('# 이준석 재수집')
    print('python collect_v24.py --politician_id=567e2c27 --politician_name="이준석"')
    print()
    print('# 한동훈 재수집')
    print('python collect_v24.py --politician_id=7abadf92 --politician_name="한동훈"')
    print()

if __name__ == "__main__":
    main()
