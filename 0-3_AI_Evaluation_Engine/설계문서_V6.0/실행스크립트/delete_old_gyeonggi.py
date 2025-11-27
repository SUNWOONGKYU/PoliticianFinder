#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
기존 경기도지사 후보 10명 삭제
"""

import sys, os, io
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from supabase import create_client
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '.env')
load_dotenv(dotenv_path=env_path, override=True)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# 삭제할 ID 목록
old_ids = [
    '23c205c7',  # 김은혜
    '5b763867',  # 박용진
    '1f2ffc44',  # 김동연
    '7dd46ec4',  # 최원영
    'ea20b7e0',  # 염태영
    '3986944a',  # 김경협
    'e13ff6db',  # 김진표
    '437af7b2',  # 장경태
    'aa10f707',  # 정성호
    'ea376522'   # 김한정
]

print("="*100)
print("기존 경기도지사 후보 10명 삭제")
print("="*100)
print()

for pid in old_ids:
    try:
        supabase.table('politicians').delete().eq('id', pid).execute()
        print(f"  삭제: {pid}")
    except Exception as e:
        print(f"  실패: {pid} - {e}")

print()
print("="*100)
print("완료")
print("="*100)
