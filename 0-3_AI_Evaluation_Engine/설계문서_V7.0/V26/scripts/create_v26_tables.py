# -*- coding: utf-8 -*-
"""
V26.0 점수 저장 테이블 생성 스크립트

Supabase에 다음 테이블 생성:
- ai_category_scores_v26
- ai_final_scores_v26
- ai_evaluations_v26
"""

import os
import sys
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 환경 변수 로드
load_dotenv()

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

def check_table_exists(table_name):
    """테이블 존재 여부 확인"""
    try:
        response = supabase.table(table_name).select('*').limit(1).execute()
        return True
    except Exception as e:
        if 'PGRST205' in str(e):
            return False
        return False

def create_tables_via_rpc():
    """
    RPC를 통한 테이블 생성은 Supabase에서 지원하지 않음
    대신 테이블이 없으면 안내 메시지 출력
    """
    tables = [
        'ai_category_scores_v26',
        'ai_final_scores_v26',
        'ai_evaluations_v26'
    ]

    missing = []
    for table in tables:
        exists = check_table_exists(table)
        status = "있음" if exists else "없음"
        print(f"  {table}: {status}")
        if not exists:
            missing.append(table)

    return missing

def main():
    print("=" * 60)
    print("V26.0 점수 저장 테이블 확인")
    print("=" * 60)

    print("\n테이블 존재 여부 확인:")
    missing = create_tables_via_rpc()

    if missing:
        print("\n" + "=" * 60)
        print("테이블 생성 필요!")
        print("=" * 60)
        print("\n누락된 테이블:")
        for table in missing:
            print(f"  - {table}")

        print("\n해결 방법:")
        print("1. Supabase 대시보드 > SQL Editor 접속")
        print("2. 다음 SQL 파일 내용 복사하여 실행:")
        print("   설계문서_V7.0/Database/create_ai_scores_v26.sql")
        print("\n또는 직접 실행:")
        print("-" * 60)

        # SQL 내용 출력
        sql_path = os.path.join(os.path.dirname(__file__), '..', 'Database', 'create_ai_scores_v26.sql')
        if os.path.exists(sql_path):
            with open(sql_path, 'r', encoding='utf-8') as f:
                print(f.read())
    else:
        print("\n모든 테이블이 존재합니다.")
        print("점수 계산 스크립트를 다시 실행하세요:")
        print("  python calculate_v26_pool_scores.py --politician_id=62e7b453")

if __name__ == "__main__":
    main()
