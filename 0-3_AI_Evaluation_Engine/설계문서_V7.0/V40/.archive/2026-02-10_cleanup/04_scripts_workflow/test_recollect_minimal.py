#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Minimal test for recollect workflow"""

import sys
import io

print("Step 1: Setting up encoding...")

# UTF-8 출력 설정
if sys.platform == 'win32':
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    except AttributeError:
        pass

print("Step 2: Importing modules...")

import os
from pathlib import Path

print("Step 3: Loading dotenv...")

from dotenv import load_dotenv

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR.parent.parent

print(f"V40_DIR: {V40_DIR}")

# 환경 변수 로드
env_path = V40_DIR.parent / '.env'
print(f"env_path: {env_path}")
print(f"env_path exists: {env_path.exists()}")

if env_path.exists():
    load_dotenv(env_path, override=True)
else:
    load_dotenv(override=True)

print("Step 4: Checking env variables...")

supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

print(f"SUPABASE_URL: {supabase_url[:30] if supabase_url else 'NOT FOUND'}...")
print(f"SUPABASE_KEY: {supabase_key[:20] if supabase_key else 'NOT FOUND'}...")

print("Step 5: Importing Supabase...")

from supabase import create_client

print("Step 6: Creating Supabase client...")

supabase = create_client(supabase_url, supabase_key)

print("Step 7: Testing database query...")

result = supabase.table('collected_data_v40')\
    .select('id', count='exact')\
    .eq('politician_id', '8c5dcc89')\
    .eq('category', 'ethics')\
    .execute()

print(f"Current ethics count: {result.count}")

print("\nAll tests passed!")
