#!/usr/bin/env python3
"""
모든 테이블 확인 및 조은희/네이버 데이터 찾기
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
else:
    print(f"[ERROR] .env 파일을 찾을 수 없습니다: {ENV_PATH}")
    sys.exit(1)

# Supabase 클라이언트
try:
    from supabase import create_client, Client

    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("[ERROR] SUPABASE_URL 또는 SUPABASE_SERVICE_KEY가 설정되지 않았습니다.")
        sys.exit(1)

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print(f"[OK] Supabase 연결 성공\n")
except Exception as e:
    print(f"[ERROR] Supabase 연결 실패: {e}")
    sys.exit(1)


def find_joheunhee_data():
    """조은희 데이터 찾기"""
    print("="*60)
    print("조은희 데이터 찾기")
    print("="*60)

    # 가능한 테이블들
    possible_tables = [
        'v30_events',
        'v30_evaluations',
        'v30_scores',
        'collected_data',
        'ai_evaluations_v27',
        'ai_final_scores',
        'naver_collected_data'
    ]

    found_tables = []

    for table_name in possible_tables:
        try:
            result = supabase.table(table_name).select('*').limit(1).execute()

            # 테이블이 존재하면 조은희 데이터 찾기
            try:
                # politician_name으로 검색
                joheunhee = supabase.table(table_name).select('*').eq('politician_name', '조은희').limit(5).execute()

                if joheunhee.data:
                    print(f"\n[FOUND] {table_name}")
                    print(f"  조은희 데이터: {len(joheunhee.data)}개 발견")

                    # 샘플 출력
                    sample = joheunhee.data[0]
                    print(f"  샘플:")
                    for key in list(sample.keys())[:10]:
                        value_str = str(sample[key])[:50] if sample[key] else 'NULL'
                        print(f"    - {key}: {value_str}")

                    found_tables.append(table_name)
            except:
                pass

        except Exception as e:
            error_msg = str(e)
            if 'PGRST205' not in error_msg:
                print(f"[ERROR] {table_name}: {error_msg}")

    if not found_tables:
        print(f"\n[WARNING] 조은희 데이터를 찾을 수 없습니다.")

    print()
    return found_tables


def find_naver_data():
    """네이버 수집 데이터 찾기"""
    print("="*60)
    print("네이버 수집 데이터 찾기")
    print("="*60)

    # 가능한 테이블들
    possible_tables = [
        'v30_events',
        'collected_data_v40',
        'collected_data',
        'naver_collected_data',
        'events'
    ]

    found_tables = []

    for table_name in possible_tables:
        try:
            result = supabase.table(table_name).select('*').limit(1).execute()

            # 테이블이 존재하면 네이버 데이터 찾기
            try:
                # source='naver' 또는 data_type='naver' 검색
                naver_data = None

                # source 필드 시도
                try:
                    naver_data = supabase.table(table_name).select('*').eq('source', 'naver').limit(5).execute()
                    if not naver_data.data:
                        naver_data = supabase.table(table_name).select('*').eq('source', 'naver_api').limit(5).execute()
                except:
                    pass

                # data_type 필드 시도
                if not naver_data or not naver_data.data:
                    try:
                        naver_data = supabase.table(table_name).select('*').eq('data_type', 'naver').limit(5).execute()
                    except:
                        pass

                if naver_data and naver_data.data:
                    print(f"\n[FOUND] {table_name}")
                    print(f"  네이버 데이터: {len(naver_data.data)}개 발견")

                    # 샘플 출력
                    sample = naver_data.data[0]
                    print(f"  샘플:")
                    for key in list(sample.keys())[:10]:
                        value_str = str(sample[key])[:50] if sample[key] else 'NULL'
                        print(f"    - {key}: {value_str}")

                    found_tables.append(table_name)
            except:
                pass

        except Exception as e:
            error_msg = str(e)
            if 'PGRST205' not in error_msg:
                print(f"[ERROR] {table_name}: {error_msg}")

    if not found_tables:
        print(f"\n[WARNING] 네이버 데이터를 찾을 수 없습니다.")

    print()
    return found_tables


def main():
    print("\n" + "="*60)
    print("기존 데이터 확인")
    print("="*60 + "\n")

    # 조은희 데이터 찾기
    joheunhee_tables = find_joheunhee_data()

    # 네이버 데이터 찾기
    naver_tables = find_naver_data()

    # 요약
    print("="*60)
    print("요약")
    print("="*60)
    print(f"조은희 데이터 발견: {', '.join(joheunhee_tables) if joheunhee_tables else '없음'}")
    print(f"네이버 데이터 발견: {', '.join(naver_tables) if naver_tables else '없음'}")
    print()

    if not joheunhee_tables and not naver_tables:
        print("[ERROR] 조은희 데이터와 네이버 데이터를 찾을 수 없습니다.")
        print("\n가능성:")
        print("  1. V30 테이블 사용 중 (v30_events, v30_evaluations)")
        print("  2. 다른 테이블 이름 사용")
        print("  3. 데이터가 아직 저장되지 않음")


if __name__ == '__main__':
    main()
