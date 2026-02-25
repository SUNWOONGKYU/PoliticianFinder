#!/usr/bin/env python3
"""
poll_rank, poll_support, collected_date 필드를 politicians 테이블에 추가
"""

import os
from dotenv import load_dotenv
import psycopg2
from psycopg2 import sql

# 환경 설정
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
V40_DIR = os.path.dirname(os.path.dirname(SCRIPT_DIR))
load_dotenv(os.path.join(V40_DIR, ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Supabase URL에서 host 추출
# https://xxxxx.supabase.co → xxxxx.supabase.co
supabase_host = SUPABASE_URL.replace("https://", "").replace("http://", "")

print("=" * 70)
print("politicians 테이블에 poll_rank, poll_support, collected_date 필드 추가")
print("=" * 70)

try:
    # PostgreSQL 연결
    print("\n[*] Supabase PostgreSQL 연결 중...")
    conn = psycopg2.connect(
        host=supabase_host,
        port=5432,
        database="postgres",
        user="postgres",
        password=SUPABASE_KEY,
        sslmode="require"
    )
    cursor = conn.cursor()
    print("[OK] 연결 성공")

    # SQL 실행
    sql_commands = [
        # 필드 추가
        """
        ALTER TABLE politicians
        ADD COLUMN IF NOT EXISTS poll_rank INTEGER,
        ADD COLUMN IF NOT EXISTS poll_support TEXT,
        ADD COLUMN IF NOT EXISTS collected_date DATE DEFAULT CURRENT_DATE;
        """,

        # 인덱스 추가
        "CREATE INDEX IF NOT EXISTS idx_politicians_poll_rank ON politicians(poll_rank);",
        "CREATE INDEX IF NOT EXISTS idx_politicians_collected_date ON politicians(collected_date);",
    ]

    print("\n[>>] SQL 실행 중...")
    for i, cmd in enumerate(sql_commands, 1):
        if cmd.strip():
            cursor.execute(cmd)
            print(f"  [{i}/{len(sql_commands)}] 실행 완료")

    # 변경사항 커밋
    conn.commit()
    print("\n[OK] 모든 변경사항 커밋 완료")

    # 필드 확인
    print("\n[>>] 추가된 필드 확인 중...")
    cursor.execute("""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'politicians'
        AND column_name IN ('poll_rank', 'poll_support', 'collected_date')
        ORDER BY ordinal_position;
    """)

    results = cursor.fetchall()
    if results:
        print("[OK] 추가된 필드:")
        for column_name, data_type in results:
            print(f"  - {column_name}: {data_type}")
    else:
        print("[NG] 필드를 찾을 수 없습니다")

    cursor.close()
    conn.close()
    print("\n" + "=" * 70)
    print("완료!")
    print("=" * 70)

except psycopg2.Error as e:
    print(f"\n[NG] PostgreSQL 오류: {e}")
    print("\n대안: Supabase Dashboard에서 SQL을 직접 실행하세요")
    print("1. https://supabase.com/dashboard에 접속")
    print("2. PoliticianFinder 프로젝트 선택")
    print("3. SQL Editor → New Query")
    print(f"4. 다음 SQL 복사 & 붙여넣기:")
    print("""
ALTER TABLE politicians
ADD COLUMN IF NOT EXISTS poll_rank INTEGER,
ADD COLUMN IF NOT EXISTS poll_support TEXT,
ADD COLUMN IF NOT EXISTS collected_date DATE DEFAULT CURRENT_DATE;

CREATE INDEX IF NOT EXISTS idx_politicians_poll_rank ON politicians(poll_rank);
CREATE INDEX IF NOT EXISTS idx_politicians_collected_date ON politicians(collected_date);
    """)

except Exception as e:
    print(f"\n[NG] 오류: {e}")
