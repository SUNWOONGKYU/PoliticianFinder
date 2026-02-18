#!/usr/bin/env python3
"""
V40 테이블 생성 스크립트
========================

이 스크립트는 V40 시스템에 필요한 테이블을 Supabase에 생성합니다.

테이블:
- collected_data_v40: 수집 데이터
- evaluations_v40: 평가 결과
- scores_v40: 최종 점수

사용법:
    python setup_v40_tables.py
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent
ENV_PATH = V40_DIR.parent / '.env'

# .env 파일 로드
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)
    print(f"✅ .env 파일 로드: {ENV_PATH}")
else:
    print(f"❌ .env 파일을 찾을 수 없습니다: {ENV_PATH}")
    sys.exit(1)

# Supabase 클라이언트
try:
    from supabase import create_client, Client

    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')  # SERVICE_ROLE_KEY 사용 (DDL 권한 필요)

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.")
        sys.exit(1)

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print(f"✅ Supabase 연결 성공")
except Exception as e:
    print(f"❌ Supabase 연결 실패: {e}")
    sys.exit(1)


def read_sql_file() -> str:
    """SQL 파일 읽기"""
    sql_file = SCRIPT_DIR / 'create_v40_tables.sql'

    if not sql_file.exists():
        print(f"❌ SQL 파일을 찾을 수 없습니다: {sql_file}")
        sys.exit(1)

    with open(sql_file, 'r', encoding='utf-8') as f:
        sql = f.read()

    print(f"✅ SQL 파일 읽기 완료: {sql_file.name} ({len(sql)} chars)")
    return sql


def execute_sql(sql: str) -> bool:
    """
    SQL 실행

    주의: supabase-py는 raw SQL 실행을 직접 지원하지 않습니다.
    대신 Supabase Database REST API의 rpc() 함수를 사용하거나,
    psycopg2를 사용해야 합니다.

    여기서는 psycopg2를 사용합니다.
    """
    try:
        import psycopg2
        from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
    except ImportError:
        print("❌ psycopg2가 설치되지 않았습니다.")
        print("   설치: pip install psycopg2-binary")
        return False

    # Supabase PostgreSQL 연결 정보
    # SUPABASE_URL: https://xxxxx.supabase.co
    # PostgreSQL: postgres://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres

    db_password = os.getenv('SUPABASE_DB_PASSWORD')
    if not db_password:
        print("❌ SUPABASE_DB_PASSWORD가 설정되지 않았습니다.")
        print("   .env 파일에 SUPABASE_DB_PASSWORD=your_password 추가 필요")
        return False

    # Supabase URL에서 프로젝트 ref 추출
    # https://ooddlafwdpzgxfefgsrx.supabase.co -> ooddlafwdpzgxfefgsrx
    project_ref = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '')

    # PostgreSQL 연결 문자열
    db_url = f"postgres://postgres:{db_password}@db.{project_ref}.supabase.co:5432/postgres"

    print(f"\n📡 PostgreSQL 연결 중...")
    print(f"   Host: db.{project_ref}.supabase.co")
    print(f"   Database: postgres")

    try:
        # PostgreSQL 연결
        conn = psycopg2.connect(db_url)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()

        print(f"✅ PostgreSQL 연결 성공\n")

        # SQL 실행
        print(f"🔧 SQL 실행 중...")
        cursor.execute(sql)

        print(f"✅ SQL 실행 완료\n")

        # 생성된 테이블 확인
        print(f"📋 생성된 테이블 확인:")
        cursor.execute("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND (table_name LIKE '%_v40' OR table_name LIKE 'v40_%')
            ORDER BY table_name
        """)

        tables = cursor.fetchall()
        for table in tables:
            print(f"   ✓ {table[0]}")

        cursor.close()
        conn.close()

        print(f"\n✅ V40 테이블 생성 완료!")
        return True

    except psycopg2.Error as e:
        print(f"❌ PostgreSQL 오류: {e}")
        return False
    except Exception as e:
        print(f"❌ 예상치 못한 오류: {e}")
        return False


def main():
    """메인 실행"""
    print("\n" + "="*60)
    print("V40 테이블 생성 스크립트")
    print("="*60 + "\n")

    # SQL 파일 읽기
    sql = read_sql_file()

    # SQL 실행
    success = execute_sql(sql)

    if success:
        print("\n" + "="*60)
        print("✅ 성공!")
        print("="*60)
        print("\n다음 단계:")
        print("  1. 데이터 수집: python scripts/workflow/collect_gemini_subprocess_parallel.py --politician '박주민'")
        print("  2. 데이터 평가: python scripts/core/evaluate_v40.py --politician '박주민' --ai claude")
        print("  3. 점수 계산: python scripts/core/calculate_v40_scores.py --politician '박주민'")
        sys.exit(0)
    else:
        print("\n" + "="*60)
        print("❌ 실패!")
        print("="*60)
        print("\n대안:")
        print("  1. Supabase Dashboard (https://supabase.com/dashboard)")
        print("  2. SQL Editor에서 create_v40_tables.sql 파일 내용을 직접 실행")
        sys.exit(1)


if __name__ == '__main__':
    main()
