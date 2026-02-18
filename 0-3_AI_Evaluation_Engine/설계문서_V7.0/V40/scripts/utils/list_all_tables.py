#!/usr/bin/env python3
"""
Supabase의 모든 테이블 나열
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import psycopg2
from urllib.parse import quote_plus

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
ENV_PATH = SCRIPT_DIR.parent.parent / '.env'

# .env 파일 로드
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)
else:
    print(f"[ERROR] .env 파일을 찾을 수 없습니다: {ENV_PATH}")
    sys.exit(1)

# DB 연결 정보
SUPABASE_URL = os.getenv('SUPABASE_URL')
DB_PASSWORD = os.getenv('SUPABASE_PASSWORD')

if not SUPABASE_URL or not DB_PASSWORD:
    print("[ERROR] SUPABASE_URL 또는 SUPABASE_PASSWORD가 설정되지 않았습니다.")
    sys.exit(1)

# Project ref 추출
project_ref = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '')
# 비밀번호 URL encode
encoded_password = quote_plus(DB_PASSWORD)
db_url = f"postgres://postgres:{encoded_password}@db.{project_ref}.supabase.co:5432/postgres"

print(f"[INFO] PostgreSQL 연결 중...\n")

try:
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()
    print(f"[OK] 연결 성공\n")

    # 모든 public 테이블 나열
    cursor.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
    """)

    tables = cursor.fetchall()

    print("="*60)
    print("Supabase public 스키마의 모든 테이블")
    print("="*60)
    print(f"총 {len(tables)}개 테이블\n")

    for i, (table_name,) in enumerate(tables, 1):
        # 각 테이블의 레코드 수 확인
        try:
            cursor.execute(f"SELECT COUNT(*) FROM public.{table_name}")
            count = cursor.fetchone()[0]
            print(f"{i:3d}. {table_name:<40} ({count:,} rows)")
        except:
            print(f"{i:3d}. {table_name:<40} (count failed)")

    cursor.close()
    conn.close()

except Exception as e:
    print(f"[ERROR] {e}")
    sys.exit(1)
