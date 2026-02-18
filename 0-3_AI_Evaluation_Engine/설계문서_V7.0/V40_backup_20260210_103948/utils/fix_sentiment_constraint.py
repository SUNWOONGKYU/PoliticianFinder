# -*- coding: utf-8 -*-
"""
V40 sentiment 제약 조건 수정 스크립트

실행 방법:
1. Supabase Dashboard 접속
2. SQL Editor 열기
3. migrations/add_free_sentiment.sql 파일 내용 복사
4. 실행

또는:
python fix_sentiment_constraint.py
"""

import os
from dotenv import load_dotenv

load_dotenv(override=True)

SQL_FILE = "../migrations/add_free_sentiment.sql"

print("=" * 60)
print("V40 sentiment 제약 조건 수정")
print("=" * 60)
print()
print("⚠️ 이 작업은 Supabase Dashboard에서 수동으로 실행해야 합니다.")
print()
print("📋 실행 단계:")
print()
print("1. Supabase Dashboard 접속:")
print(f"   {os.getenv('SUPABASE_URL').replace('/rest/v1', '')}")
print()
print("2. 좌측 메뉴에서 'SQL Editor' 클릭")
print()
print("3. 'New query' 클릭")
print()
print("4. 다음 SQL 복사하여 붙여넣기:")
print()
print("=" * 60)

# SQL 파일 읽기
with open(SQL_FILE, 'r', encoding='utf-8') as f:
    sql_content = f.read()

print(sql_content)
print("=" * 60)
print()
print("5. 'RUN' 버튼 클릭하여 실행")
print()
print("6. 성공 메시지 확인:")
print("   ✅ sentiment 컬럼 제약 조건 수정 완료")
print()
print("=" * 60)
