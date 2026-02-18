#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
evaluations_v40 외래 키 CASCADE 수정 적용

목적: 고아 평가 방지
- 현재: ON DELETE SET NULL
- 변경: ON DELETE CASCADE
"""
import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# UTF-8 출력 설정
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# .env 로드
load_dotenv()

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

# SQL 파일 경로
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
V40_DIR = os.path.dirname(os.path.dirname(SCRIPT_DIR))
SQL_FILE = os.path.join(V40_DIR, 'Database', 'fix_evaluations_v40_cascade.sql')

def read_sql_file(file_path):
    """SQL 파일 읽기"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

def execute_sql(sql):
    """SQL 실행"""
    try:
        # Supabase에서 직접 SQL 실행은 제한적이므로,
        # psycopg2를 사용하거나 Supabase SQL Editor를 사용해야 함

        # 여기서는 안내 메시지만 출력
        print('=' * 80)
        print('⚠️ 수동 실행 필요')
        print('=' * 80)
        print()
        print('다음 SQL을 Supabase SQL Editor에서 실행하세요:')
        print()
        print('Supabase Dashboard:')
        print('  1. https://supabase.com/dashboard')
        print('  2. 프로젝트 선택')
        print('  3. SQL Editor 메뉴 클릭')
        print('  4. 아래 SQL 복사하여 실행')
        print()
        print('-' * 80)
        print(sql)
        print('-' * 80)
        print()

        # 또는 psycopg2 사용 안내
        print('또는 psycopg2로 직접 실행:')
        print()
        print('  pip install psycopg2-binary')
        print()
        print('  import psycopg2')
        print('  import os')
        print('  from dotenv import load_dotenv')
        print()
        print('  load_dotenv()')
        print('  conn = psycopg2.connect(os.getenv("DATABASE_URL"))')
        print('  cur = conn.cursor()')
        print('  cur.execute(sql)')
        print('  conn.commit()')
        print('  cur.close()')
        print('  conn.close()')
        print()

    except Exception as e:
        print(f'❌ 오류: {e}')
        return False

    return True

def main():
    print('=' * 80)
    print('evaluations_v40 외래 키 CASCADE 수정')
    print('=' * 80)
    print()
    print(f'SQL 파일: {SQL_FILE}')
    print()

    # SQL 파일 읽기
    if not os.path.exists(SQL_FILE):
        print(f'❌ SQL 파일을 찾을 수 없습니다: {SQL_FILE}')
        return

    sql = read_sql_file(SQL_FILE)

    # SQL 실행 (안내)
    execute_sql(sql)

    print()
    print('=' * 80)
    print('완료 후 다음 명령으로 확인:')
    print('=' * 80)
    print()
    print('SELECT')
    print('    tc.constraint_name,')
    print('    tc.table_name,')
    print('    kcu.column_name,')
    print('    ccu.table_name AS foreign_table_name,')
    print('    ccu.column_name AS foreign_column_name,')
    print('    rc.delete_rule')
    print('FROM information_schema.table_constraints tc')
    print('JOIN information_schema.key_column_usage kcu')
    print('    ON tc.constraint_name = kcu.constraint_name')
    print('JOIN information_schema.constraint_column_usage ccu')
    print('    ON ccu.constraint_name = tc.constraint_name')
    print('JOIN information_schema.referential_constraints rc')
    print('    ON rc.constraint_name = tc.constraint_name')
    print('WHERE tc.constraint_type = \'FOREIGN KEY\'')
    print('    AND tc.table_name = \'evaluations_v40\'')
    print('    AND kcu.column_name = \'collected_data_id\';')
    print()
    print('결과 확인:')
    print('  - delete_rule이 "CASCADE"이면 성공!')
    print()

if __name__ == '__main__':
    main()
