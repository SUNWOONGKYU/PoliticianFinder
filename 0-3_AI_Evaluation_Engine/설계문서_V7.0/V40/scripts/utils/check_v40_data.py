# -*- coding: utf-8 -*-
"""V40 데이터 확인 (수정본)"""

import os
import sys
import argparse
from dotenv import load_dotenv
from supabase import create_client

# stdout 인코딩 설정
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv(override=True)

def main():
    parser = argparse.ArgumentParser(description='V40 데이터 수집 현황 확인')
    parser.add_argument('--politician-id', type=str, required=True, help='정치인 ID')
    args = parser.parse_args()

    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('SUPABASE_SERVICE_KEY')
    if not supabase_url or not supabase_key:
        print("[ERROR] API 키 설정이 없습니다. .env 파일을 확인하세요.")
        return

    supabase = create_client(supabase_url, supabase_key)

    categories = [
        'expertise', 'leadership', 'vision', 'integrity', 'ethics',
        'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'
    ]

    print(f"============================================================")
    print(f" 정치인 ID: {args.politician_id} 수집 현황")
    print(f"============================================================")

    # 전체 데이터 확인
    try:
        total_result = supabase.table('collected_data_v40')\
            .select('*', count='exact')\
            .eq('politician_id', args.politician_id)\
            .execute()
        
        print(f" 전체 데이터: {total_result.count} / 1000개")
        print(f"------------------------------------------------------------")

        # 카테고리별 확인
        for cat in categories:
            cat_result = supabase.table('collected_data_v40')\
                .select('*', count='exact')\
                .eq('politician_id', args.politician_id)\
                .eq('category', cat)\
                .execute()
            
            status = "✅" if cat_result.count >= 100 else "🔴"
            print(f" {status} {cat:15}: {cat_result.count:3} / 100개")

        # AI별 확인
        print(f"------------------------------------------------------------")
        for ai in ['Gemini', 'Naver']:
            ai_result = supabase.table('collected_data_v40')\
                .select('*', count='exact')\
                .eq('politician_id', args.politician_id)\
                .eq('collector_ai', ai)\
                .execute()
            print(f" [{ai:6}] 수집 데이터: {ai_result.count}개")

    except Exception as e:
        print(f"[ERROR] 데이터 조회 중 오류 발생: {e}")

    print(f"============================================================")

if __name__ == "__main__":
    main()
