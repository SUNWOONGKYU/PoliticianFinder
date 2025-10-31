#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PostgreSQL/Supabase DB 연결 테스트
"""

import os
import sys
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

print("=" * 80)
print("PostgreSQL/Supabase DB 연결 테스트")
print("=" * 80)
print()

# 1. 환경 변수 확인
print("1. 환경 변수 확인")
print("-" * 80)

supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
supabase_host = os.getenv('SUPABASE_HOST')
supabase_port = os.getenv('SUPABASE_PORT', '5432')
supabase_db = os.getenv('SUPABASE_DB', 'postgres')
supabase_user = os.getenv('SUPABASE_USER', 'postgres')
supabase_password = os.getenv('SUPABASE_PASSWORD')

print(f"SUPABASE_URL: {'설정됨' if supabase_url else '❌ 없음'}")
print(f"SUPABASE_SERVICE_KEY: {'설정됨' if supabase_key else '❌ 없음'}")
print(f"SUPABASE_HOST: {supabase_host if supabase_host else '❌ 없음'}")
print(f"SUPABASE_PORT: {supabase_port}")
print(f"SUPABASE_DB: {supabase_db}")
print(f"SUPABASE_USER: {supabase_user}")
print(f"SUPABASE_PASSWORD: {'설정됨' if supabase_password else '❌ 없음'}")
print()

if not supabase_host or not supabase_password:
    print("⚠️  Supabase 연결 정보가 .env 파일에 설정되지 않았습니다.")
    print()
    print("다음 정보를 .env 파일에 추가해주세요:")
    print()
    print("# Supabase PostgreSQL 연결")
    print("SUPABASE_HOST=db.xxxxxxxxxxxxx.supabase.co")
    print("SUPABASE_PORT=5432")
    print("SUPABASE_DB=postgres")
    print("SUPABASE_USER=postgres")
    print("SUPABASE_PASSWORD=your-password-here")
    print()
    print("또는")
    print()
    print("# Supabase URL 방식")
    print("SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co")
    print("SUPABASE_SERVICE_KEY=your-service-key-here")
    print()
    sys.exit(1)

# 2. psycopg2 설치 확인
print("2. psycopg2 라이브러리 확인")
print("-" * 80)

try:
    import psycopg2
    print("✓ psycopg2 설치됨")
    print(f"  버전: {psycopg2.__version__}")
except ImportError:
    print("❌ psycopg2가 설치되지 않았습니다.")
    print()
    print("다음 명령어로 설치해주세요:")
    print("  pip install psycopg2-binary")
    print()
    sys.exit(1)

print()

# 3. DB 연결 테스트
print("3. PostgreSQL 연결 테스트")
print("-" * 80)

try:
    conn = psycopg2.connect(
        host=supabase_host,
        port=supabase_port,
        database=supabase_db,
        user=supabase_user,
        password=supabase_password
    )

    print(f"✓ 연결 성공!")
    print(f"  Host: {supabase_host}")
    print(f"  Database: {supabase_db}")
    print()

    # 4. 테이블 존재 확인
    print("4. V6.2 스키마 테이블 확인")
    print("-" * 80)

    cursor = conn.cursor()

    tables = [
        'politicians',
        'collected_data',
        'ai_item_scores',
        'ai_category_scores',
        'ai_final_scores',
        'combined_final_scores'
    ]

    existing_tables = []
    missing_tables = []

    for table in tables:
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = %s
            )
        """, (table,))

        exists = cursor.fetchone()[0]

        if exists:
            existing_tables.append(table)
            print(f"  ✓ {table}")
        else:
            missing_tables.append(table)
            print(f"  ❌ {table} (없음)")

    print()

    if missing_tables:
        print("⚠️  V6.2 스키마가 설치되지 않았습니다.")
        print()
        print(f"누락된 테이블: {', '.join(missing_tables)}")
        print()
        print("다음 명령어로 스키마를 설치해주세요:")
        print("  psql -h [HOST] -U postgres -d postgres -f 설계문서_V3.0/schema_v6.2.sql")
        print()
        print("또는 Python으로 실행:")
        print("  python install_schema.py")
        print()
    else:
        print("✅ 모든 테이블이 설치되어 있습니다!")
        print()

        # 5. 샘플 데이터 확인
        print("5. 기존 데이터 확인")
        print("-" * 80)

        cursor.execute("SELECT COUNT(*) FROM politicians")
        politician_count = cursor.fetchone()[0]
        print(f"  정치인 수: {politician_count}명")

        cursor.execute("SELECT COUNT(*) FROM collected_data")
        data_count = cursor.fetchone()[0]
        print(f"  수집된 데이터: {data_count}개")

        cursor.execute("SELECT COUNT(*) FROM ai_final_scores")
        score_count = cursor.fetchone()[0]
        print(f"  최종 점수: {score_count}개")

        if politician_count > 0:
            print()
            cursor.execute("""
                SELECT name, final_score, grade_code, grade_emoji
                FROM politicians p
                LEFT JOIN ai_final_scores afs ON p.id = afs.politician_id
                WHERE afs.ai_name = 'Claude'
                ORDER BY final_score DESC
                LIMIT 10
            """)

            results = cursor.fetchall()
            if results:
                print("  최근 평가된 정치인:")
                for name, score, grade, emoji in results:
                    if score:
                        print(f"    - {name}: {score:.2f}점 ({grade} {emoji})")
                    else:
                        print(f"    - {name}: 평가 전")

        print()

    cursor.close()
    conn.close()

    print("=" * 80)
    print("DB 연결 테스트 완료")
    print("=" * 80)

except psycopg2.Error as e:
    print(f"❌ 연결 실패!")
    print(f"  에러: {e}")
    print()
    print("연결 정보를 확인해주세요:")
    print(f"  Host: {supabase_host}")
    print(f"  Port: {supabase_port}")
    print(f"  Database: {supabase_db}")
    print(f"  User: {supabase_user}")
    print()
    sys.exit(1)

except Exception as e:
    print(f"❌ 예상치 못한 오류!")
    print(f"  에러: {e}")
    sys.exit(1)
