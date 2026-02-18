#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V30 점수 테이블 생성 스크립트"""

import sys
import os
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력
if sys.platform == 'win32':
    import io
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    except AttributeError:
        pass

load_dotenv(override=True)

# Supabase 연결
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

print("="*80)
print("V30 점수 테이블 생성")
print("="*80)
print()

# SQL 실행 함수
def execute_sql(description, sql):
    print(f"🔨 {description}...")
    try:
        result = supabase.rpc('execute_sql', {'query': sql}).execute()
        print(f"   ✅ 완료")
        return True
    except Exception as e:
        # RPC가 없는 경우, 직접 테이블 생성 시도
        print(f"   ⚠️ RPC 방식 실패, 대체 방법 시도...")
        return False

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

if not execute_sql("ai_category_scores_v30 생성", sql_category):
    print("   📋 Supabase Dashboard에서 직접 실행 필요")
    print("   위치: Supabase Dashboard → SQL Editor")
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

if not execute_sql("ai_final_scores_v30 생성", sql_final):
    print("   📋 Supabase Dashboard에서 직접 실행 필요")
    print("   위치: Supabase Dashboard → SQL Editor")
    print()

print()
print("="*80)
print("📝 수동 실행이 필요한 경우")
print("="*80)
print()
print("Supabase Dashboard에 접속:")
print("1. https://supabase.com/dashboard")
print("2. 프로젝트 선택")
print("3. SQL Editor 메뉴")
print("4. 아래 SQL 복사 & 실행")
print()
print("="*80)
print()

print("-- ai_category_scores_v30 테이블")
print(sql_category)
print()
print("-- ai_final_scores_v30 테이블")
print(sql_final)
print()
print("="*80)
