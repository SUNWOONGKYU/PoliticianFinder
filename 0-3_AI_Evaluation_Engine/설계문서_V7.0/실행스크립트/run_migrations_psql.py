# -*- coding: utf-8 -*-
"""
V26.0 테이블 생성 마이그레이션 스크립트

psycopg2를 사용하여 Supabase PostgreSQL에 직접 SQL 실행
"""

import os
import sys

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

def get_connection_string():
    """Supabase 연결 문자열 생성"""
    supabase_url = os.getenv('SUPABASE_URL')

    if not supabase_url:
        print("오류: SUPABASE_URL이 설정되지 않았습니다.")
        return None

    # URL에서 호스트 추출: https://xxx.supabase.co -> xxx.supabase.co
    host = supabase_url.replace('https://', '').replace('http://', '')

    # Supabase DB 연결 정보
    # 기본 포트: 5432, DB 이름: postgres
    db_password = os.getenv('SUPABASE_DB_PASSWORD')

    if not db_password:
        print("오류: SUPABASE_DB_PASSWORD가 설정되지 않았습니다.")
        print("Supabase 대시보드 > Settings > Database > Connection string에서 확인하세요.")
        return None

    # Connection pooler 사용 (포트 6543)
    # host 형식: db.xxx.supabase.co
    db_host = host.replace('.supabase.co', '.pooler.supabase.com')

    return f"postgresql://postgres.{host.split('.')[0]}:{db_password}@{db_host}:6543/postgres"

def run_sql_file(sql_path):
    """SQL 파일 실행"""
    try:
        import psycopg2
    except ImportError:
        print("오류: psycopg2가 설치되지 않았습니다.")
        print("설치: pip install psycopg2-binary")
        return False

    conn_string = get_connection_string()
    if not conn_string:
        return False

    print(f"SQL 파일: {sql_path}")

    # SQL 파일 읽기
    if not os.path.exists(sql_path):
        print(f"오류: 파일을 찾을 수 없습니다: {sql_path}")
        return False

    with open(sql_path, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    # -- 로 시작하는 주석 라인 제거, 실행할 SQL만 추출
    statements = []
    current_stmt = []

    for line in sql_content.split('\n'):
        stripped = line.strip()
        if stripped.startswith('--') or not stripped:
            continue
        current_stmt.append(line)
        if stripped.endswith(';'):
            statements.append('\n'.join(current_stmt))
            current_stmt = []

    if current_stmt:
        statements.append('\n'.join(current_stmt))

    print(f"실행할 SQL 문: {len(statements)}개")

    try:
        conn = psycopg2.connect(conn_string)
        conn.autocommit = True
        cursor = conn.cursor()

        success_count = 0
        for i, stmt in enumerate(statements, 1):
            if not stmt.strip():
                continue
            try:
                cursor.execute(stmt)
                success_count += 1
                print(f"  [{i}] 성공")
            except Exception as e:
                print(f"  [{i}] 실패: {e}")

        cursor.close()
        conn.close()

        print(f"\n완료: {success_count}/{len(statements)} SQL 문 실행 성공")
        return success_count == len(statements)

    except Exception as e:
        print(f"연결 오류: {e}")
        return False

def run_inline_sql():
    """인라인 SQL 실행 (psycopg2 없이 Supabase REST API 사용)"""
    import requests
    import json

    supabase_url = os.getenv('SUPABASE_URL')
    service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

    if not supabase_url or not service_key:
        print("오류: Supabase 환경 변수가 설정되지 않았습니다.")
        return False

    # Supabase REST API를 통한 SQL 실행은 지원되지 않음
    # 대신 테이블을 생성하는 대안 제시
    print("\n" + "=" * 60)
    print("Supabase 대시보드에서 SQL 실행 필요")
    print("=" * 60)
    print("\n1. Supabase 대시보드 접속:")
    print(f"   {supabase_url}")
    print("\n2. SQL Editor 메뉴 클릭")
    print("\n3. 다음 SQL 실행:")

    sql_path = os.path.join(os.path.dirname(__file__), '..', 'Database', 'create_ai_scores_v26.sql')
    if os.path.exists(sql_path):
        with open(sql_path, 'r', encoding='utf-8') as f:
            print("\n" + "-" * 60)
            print(f.read())
            print("-" * 60)

    return False

def main():
    print("=" * 60)
    print("V26.0 테이블 생성 마이그레이션")
    print("=" * 60)

    sql_path = os.path.join(
        os.path.dirname(__file__),
        '..',
        'Database',
        'create_ai_scores_v26.sql'
    )
    sql_path = os.path.abspath(sql_path)

    # psycopg2 설치 여부 확인
    try:
        import psycopg2
        has_psycopg2 = True
    except ImportError:
        has_psycopg2 = False

    if has_psycopg2 and os.getenv('SUPABASE_DB_PASSWORD'):
        print("\npsycopg2로 직접 실행 시도...")
        success = run_sql_file(sql_path)
        if success:
            print("\n테이블 생성 완료!")
            print("점수 계산 다시 실행:")
            print("  python calculate_v26_pool_scores.py --politician_id=62e7b453")
        return

    # psycopg2 없으면 안내
    run_inline_sql()

if __name__ == "__main__":
    main()
