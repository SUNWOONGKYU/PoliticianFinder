#!/usr/bin/env python3
"""
조은희/네이버 데이터 직접 검색
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
ENV_PATH = SCRIPT_DIR.parent.parent / '.env'

# .env 파일 로드
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)

# Supabase 클라이언트
from supabase import create_client, Client

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 시도할 테이블 이름들
TABLE_CANDIDATES = [
    # V30
    'v30_events', 'v30_evaluations', 'v30_scores', 'v30_collected_data',
    # V40
    'v40_events', 'v40_evaluations', 'v40_scores',
    # Generic
    'events', 'evaluations', 'scores', 'collected_data',
    'naver_data', 'naver_collected', 'naver_events',
    # AI evaluation
    'ai_evaluations', 'ai_evaluations_v27', 'ai_final_scores',
    # Data collection
    'politician_events', 'politician_data', 'collection_data'
]

print("\n" + "="*60)
print("조은희/네이버 데이터 검색")
print("="*60 + "\n")

found_data = {}

for table_name in TABLE_CANDIDATES:
    try:
        # 조은희 검색
        try:
            result = supabase.table(table_name).select('*').ilike('politician_name', '%조은희%').limit(1).execute()
            if result.data:
                if 'joheunhee' not in found_data:
                    found_data['joheunhee'] = []
                found_data['joheunhee'].append(table_name)
                print(f"[FOUND] 조은희 데이터: {table_name}")
        except:
            pass

        # 네이버 검색 (source 필드)
        try:
            result = supabase.table(table_name).select('*').or_('source.eq.naver,source.eq.naver_api').limit(1).execute()
            if result.data:
                if 'naver' not in found_data:
                    found_data['naver'] = []
                found_data['naver'].append(table_name)
                print(f"[FOUND] 네이버 데이터 (source): {table_name}")
        except:
            pass

        # 네이버 검색 (data_type 필드)
        try:
            result = supabase.table(table_name).select('*').eq('data_type', 'naver').limit(1).execute()
            if result.data:
                if 'naver' not in found_data:
                    found_data['naver'] = []
                if table_name not in found_data['naver']:
                    found_data['naver'].append(table_name)
                    print(f"[FOUND] 네이버 데이터 (data_type): {table_name}")
        except:
            pass

    except Exception as e:
        # 테이블이 없으면 무시
        if 'PGRST205' in str(e):
            continue

print("\n" + "="*60)
print("요약")
print("="*60)
if 'joheunhee' in found_data:
    print(f"조은희 데이터: {', '.join(found_data['joheunhee'])}")
else:
    print("조은희 데이터: 없음")

if 'naver' in found_data:
    print(f"네이버 데이터: {', '.join(set(found_data['naver']))}")
else:
    print("네이버 데이터: 없음")

# 상세 정보
if 'joheunhee' in found_data:
    print("\n" + "="*60)
    print("조은희 데이터 상세")
    print("="*60)
    for table_name in set(found_data['joheunhee']):
        try:
            result = supabase.table(table_name).select('*').ilike('politician_name', '%조은희%').limit(3).execute()
            count_result = supabase.table(table_name).select('id', count='exact').ilike('politician_name', '%조은희%').execute()
            count = count_result.count if hasattr(count_result, 'count') else len(count_result.data)

            print(f"\n[{table_name}]")
            print(f"  총 {count}개 레코드")
            if result.data:
                sample = result.data[0]
                print(f"  샘플 컬럼: {', '.join(list(sample.keys())[:8])}")
        except Exception as e:
            print(f"[{table_name}] 조회 실패: {e}")

print()
