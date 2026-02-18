#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
collected_data_v30 필드 확인
어떤 필드들이 있는지 확인
"""

import os
import sys
import json
from pathlib import Path
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력 설정
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# .env 파일 로드
env_path = Path(__file__).parent.parent.parent.parent / '.env'
load_dotenv(env_path)

# Supabase 초기화
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

def check_fields():
    """필드 확인"""

    # 조은희 ID 조회
    response = supabase.table('politicians') \
        .select('id') \
        .eq('name', "조은희") \
        .execute()

    if not response.data:
        print("❌ 조은희 정치인을 찾을 수 없습니다.")
        return

    politician_id = response.data[0]['id']

    # 1개 레코드만 조회해서 필드 확인
    response = supabase.table('collected_data_v30') \
        .select('*') \
        .eq('politician_id', politician_id) \
        .limit(1) \
        .execute()

    if response.data:
        record = response.data[0]
        print(f"📋 collected_data_v30 테이블 필드:")
        print(f"=" * 60)
        for key in sorted(record.keys()):
            value = record[key]
            value_str = str(value)[:50] + "..." if len(str(value)) > 50 else str(value)
            print(f"  {key}: {value_str}")
    else:
        print("❌ 데이터가 없습니다.")

if __name__ == "__main__":
    check_fields()
