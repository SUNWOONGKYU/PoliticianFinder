#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
collected_data_v30 테이블 스키마 확인
"""

import os
import sys
from pathlib import Path
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력 설정
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

# .env 로드
env_path = Path(__file__).parent.parent.parent.parent / '.env'
load_dotenv(env_path)

# Supabase 초기화
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# category ENUM 확인
print("="*60)
print("  collected_data_v30 테이블 category 제약 확인")
print("="*60)

# PostgreSQL에서 ENUM 타입 확인
result = supabase.rpc('run_sql', {
    'query': """
    SELECT enumlabel
    FROM pg_enum
    WHERE enumtypid = (
        SELECT oid
        FROM pg_type
        WHERE typname = 'category_type_v30'
    )
    ORDER BY enumsortorder;
    """
}).execute()

if result.data:
    print("\n✅ category_type_v30 ENUM 값:")
    for i, row in enumerate(result.data, 1):
        print(f"  {i}. {row['enumlabel']}")
else:
    print("\n⚠️ ENUM 타입이 없습니다. CHECK 제약을 확인합니다...")

    # CHECK 제약 확인
    result = supabase.rpc('run_sql', {
        'query': """
        SELECT conname, consrc
        FROM pg_constraint
        WHERE conrelid = 'collected_data_v30'::regclass
        AND contype = 'c'
        AND conname LIKE '%category%';
        """
    }).execute()

    if result.data:
        print("\n✅ category CHECK 제약:")
        for row in result.data:
            print(f"  {row['conname']}: {row['consrc']}")
    else:
        print("\n⚠️ category 제약을 찾을 수 없습니다.")

print("\n" + "="*60)
