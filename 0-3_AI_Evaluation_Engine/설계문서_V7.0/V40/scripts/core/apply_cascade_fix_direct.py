#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
evaluations_v40 외래 키 CASCADE 수정 적용 (psycopg2 사용)

목적: 고아 평가 방지
- 현재: ON DELETE SET NULL
- 변경: ON DELETE CASCADE
"""
import os
import sys
from dotenv import load_dotenv

# UTF-8 출력 설정
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# .env 로드
load_dotenv()

# psycopg2 import (없으면 설치 안내)
try:
    import psycopg2
except ImportError:
    print('❌ psycopg2 패키지가 설치되어 있지 않습니다.')
    print()
    print('설치 방법:')
    print('  pip install psycopg2-binary')
    print()
    sys.exit(1)

# SQL 파일 경로
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
V40_DIR = os.path.dirname(os.path.dirname(SCRIPT_DIR))
SQL_FILE = os.path.join(V40_DIR, 'Database', 'fix_evaluations_v40_cascade.sql')

def read_sql_file(file_path):
    """SQL 파일 읽기"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

def execute_sql(conn, sql):
    """SQL 실행"""
    try:
        cur = conn.cursor()
        cur.execute(sql)
        conn.commit()

        # 서버 메시지 출력
        for notice in conn.notices:
            print(notice.strip())

        cur.close()
        return True

    except Exception as e:
        print(f'❌ SQL 실행 오류: {e}')
        conn.rollback()
        return False

def verify_cascade(conn):
    """CASCADE 설정 확인"""
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT
                tc.constraint_name,
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name,
                rc.delete_rule
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu
                ON ccu.constraint_name = tc.constraint_name
            JOIN information_schema.referential_constraints rc
                ON rc.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
                AND tc.table_name = 'evaluations_v40'
                AND kcu.column_name = 'collected_data_id';
        """)

        row = cur.fetchone()
        cur.close()

        if row:
            print()
            print('=' * 80)
            print('✅ CASCADE 설정 확인')
            print('=' * 80)
            print(f'제약 이름: {row[0]}')
            print(f'테이블: {row[1]}.{row[2]}')
            print(f'참조: {row[3]}.{row[4]}')
            print(f'DELETE 규칙: {row[5]}')
            print()

            if row[5] == 'CASCADE':
                print('✅ CASCADE 설정 완료!')
                return True
            else:
                print(f'⚠️ DELETE 규칙이 {row[5]}입니다. CASCADE가 아닙니다.')
                return False
        else:
            print('⚠️ 외래 키 제약을 찾을 수 없습니다.')
            return False

    except Exception as e:
        print(f'❌ 확인 오류: {e}')
        return False

def main():
    print('=' * 80)
    print('evaluations_v40 외래 키 CASCADE 수정')
    print('=' * 80)
    print()

    # DATABASE_URL 확인
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print('❌ DATABASE_URL 환경 변수가 설정되어 있지 않습니다.')
        print()
        print('.env 파일에 다음을 추가하세요:')
        print('  DATABASE_URL=postgresql://user:password@host:port/database')
        print()
        return

    print(f'SQL 파일: {SQL_FILE}')
    print()

    # SQL 파일 읽기
    if not os.path.exists(SQL_FILE):
        print(f'❌ SQL 파일을 찾을 수 없습니다: {SQL_FILE}')
        return

    sql = read_sql_file(SQL_FILE)

    # 데이터베이스 연결
    print('데이터베이스 연결 중...')
    try:
        conn = psycopg2.connect(database_url)
        print('✅ 연결 성공')
        print()
    except Exception as e:
        print(f'❌ 연결 실패: {e}')
        return

    try:
        # SQL 실행
        print('SQL 실행 중...')
        if execute_sql(conn, sql):
            print()
            print('✅ SQL 실행 완료')

            # CASCADE 설정 확인
            verify_cascade(conn)
        else:
            print('❌ SQL 실행 실패')

    finally:
        conn.close()
        print()
        print('데이터베이스 연결 종료')

if __name__ == '__main__':
    main()
