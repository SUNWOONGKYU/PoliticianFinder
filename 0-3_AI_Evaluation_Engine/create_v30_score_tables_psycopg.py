#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V30 점수 테이블 생성 (psycopg2 사용)"""

import sys
import os
from dotenv import load_dotenv

# UTF-8 출력
if sys.platform == 'win32':
    import io
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    except AttributeError:
        pass

load_dotenv(override=True)

print("="*80)
print("V30 점수 테이블 생성 (psycopg2)")
print("="*80)
print()

# psycopg2 설치 확인
try:
    import psycopg2
    print("✅ psycopg2 설치 확인됨")
except ImportError:
    print("❌ psycopg2가 설치되지 않았습니다.")
    print()
    print("설치 방법:")
    print("  pip install psycopg2-binary")
    print()
    sys.exit(1)

# Supabase 연결 정보
SUPABASE_URL = os.getenv('SUPABASE_URL')
SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

# DB 연결 문자열 생성
# Supabase URL: https://xxxxxxxx.supabase.co
# DB Host: db.xxxxxxxx.supabase.co
project_ref = SUPABASE_URL.replace('https://', '').replace('.supabase.co', '')
db_host = f"db.{project_ref}.supabase.co"

# DB 비밀번호 필요
db_password = os.getenv('SUPABASE_DB_PASSWORD')
if not db_password:
    print()
    print("⚠️ SUPABASE_DB_PASSWORD 환경 변수가 필요합니다.")
    print()
    print(".env 파일에 추가:")
    print("  SUPABASE_DB_PASSWORD=your_db_password")
    print()
    print("비밀번호 찾는 방법:")
    print("  1. Supabase Dashboard → Settings → Database")
    print("  2. Connection string 섹션에서 비밀번호 확인")
    print()
    sys.exit(1)

print(f"🔗 연결 정보:")
print(f"   Host: {db_host}")
print(f"   Database: postgres")
print(f"   User: postgres")
print()

# PostgreSQL 연결
try:
    conn = psycopg2.connect(
        host=db_host,
        database="postgres",
        user="postgres",
        password=db_password,
        port=5432
    )
    print("✅ PostgreSQL 연결 성공")
    print()

    cursor = conn.cursor()

    # 1. ai_category_scores_v30 테이블
    print("1️⃣ ai_category_scores_v30 테이블 생성")

    sql_category = """
    CREATE TABLE IF NOT EXISTS ai_category_scores_v30 (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        politician_id TEXT NOT NULL,
        politician_name TEXT NOT NULL,
        category TEXT NOT NULL,
        score INTEGER NOT NULL CHECK (score >= 20 AND score <= 100),
        ai_details JSONB,
        calculated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_v30_cat_scores_politician ON ai_category_scores_v30(politician_id);
    CREATE INDEX IF NOT EXISTS idx_v30_cat_scores_category ON ai_category_scores_v30(category);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_v30_cat_scores_unique ON ai_category_scores_v30(politician_id, category);
    """

    cursor.execute(sql_category)
    conn.commit()
    print("   ✅ 생성 완료")
    print()

    # 2. ai_final_scores_v30 테이블
    print("2️⃣ ai_final_scores_v30 테이블 생성")

    sql_final = """
    CREATE TABLE IF NOT EXISTS ai_final_scores_v30 (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        politician_id TEXT NOT NULL,
        politician_name TEXT NOT NULL,
        final_score INTEGER NOT NULL CHECK (final_score >= 200 AND final_score <= 1000),
        grade TEXT NOT NULL CHECK (grade IN ('M', 'D', 'E', 'P', 'G', 'S', 'B', 'I', 'Tn', 'L')),
        grade_name TEXT,
        category_scores JSONB,
        calculated_at TIMESTAMPTZ DEFAULT NOW(),
        version TEXT DEFAULT 'V30'
    );

    CREATE INDEX IF NOT EXISTS idx_v30_final_politician ON ai_final_scores_v30(politician_id);
    CREATE INDEX IF NOT EXISTS idx_v30_final_grade ON ai_final_scores_v30(grade);
    CREATE INDEX IF NOT EXISTS idx_v30_final_score ON ai_final_scores_v30(final_score DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_v30_final_unique ON ai_final_scores_v30(politician_id);
    """

    cursor.execute(sql_final)
    conn.commit()
    print("   ✅ 생성 완료")
    print()

    # 3. grade_reference_v30 테이블 (참조용)
    print("3️⃣ grade_reference_v30 테이블 생성")

    sql_grade_ref = """
    CREATE TABLE IF NOT EXISTS grade_reference_v30 (
        grade TEXT PRIMARY KEY,
        grade_name TEXT NOT NULL,
        min_score INTEGER NOT NULL,
        max_score INTEGER NOT NULL,
        description TEXT
    );

    INSERT INTO grade_reference_v30 (grade, grade_name, min_score, max_score, description)
    VALUES
        ('M', 'Mugunghwa', 920, 1000, '최우수'),
        ('D', 'Diamond', 840, 919, '우수'),
        ('E', 'Emerald', 760, 839, '양호'),
        ('P', 'Platinum', 680, 759, '보통+'),
        ('G', 'Gold', 600, 679, '보통'),
        ('S', 'Silver', 520, 599, '보통-'),
        ('B', 'Bronze', 440, 519, '미흡'),
        ('I', 'Iron', 360, 439, '부족'),
        ('Tn', 'Tin', 280, 359, '상당히 부족'),
        ('L', 'Lead', 200, 279, '매우 부족')
    ON CONFLICT (grade) DO NOTHING;
    """

    cursor.execute(sql_grade_ref)
    conn.commit()
    print("   ✅ 생성 완료")
    print()

    cursor.close()
    conn.close()

    print("="*80)
    print("✅ V30 점수 테이블 생성 완료!")
    print("="*80)
    print()
    print("생성된 테이블:")
    print("  1. ai_category_scores_v30")
    print("  2. ai_final_scores_v30")
    print("  3. grade_reference_v30")
    print()

except Exception as e:
    print(f"❌ 오류: {e}")
    print()
    print("해결 방법:")
    print("  1. .env에 SUPABASE_DB_PASSWORD 추가")
    print("  2. Supabase Dashboard에서 DB 비밀번호 확인")
    print("  3. 또는 Supabase Dashboard → SQL Editor에서 직접 실행")
    print()
    sys.exit(1)
