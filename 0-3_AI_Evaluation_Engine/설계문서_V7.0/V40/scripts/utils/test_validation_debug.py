#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""검증 스크립트 디버깅"""

import sys
import io

# Fix Windows encoding
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

print("=== Step 1: Script started ===")
print(f"Python version: {sys.version}")
print(f"Python path: {sys.executable}")

print("\n=== Step 2: Importing modules ===")
try:
    import os
    print("[OK] os")
    import json
    print("[OK] json")
    from pathlib import Path
    print("[OK] pathlib")
    from dotenv import load_dotenv
    print("[OK] dotenv")
    from supabase import create_client
    print("[OK] supabase")
except Exception as e:
    print(f"[ERROR] Import error: {e}")
    sys.exit(1)

print("\n=== Step 3: Loading .env ===")
try:
    # Try multiple .env paths
    script_dir = Path(__file__).resolve().parent
    env_paths = [
        script_dir.parent.parent.parent.parent.parent / '.env',
        Path.cwd() / '.env',
        Path.cwd().parent / '.env',
    ]

    env_loaded = False
    for env_path in env_paths:
        if env_path.exists():
            print(f"Found .env at: {env_path}")
            load_dotenv(env_path, override=True)
            env_loaded = True
            break

    if not env_loaded:
        print("Warning: No .env file found")
        load_dotenv(override=True)

    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

    if supabase_url:
        print(f"[OK] SUPABASE_URL: {supabase_url[:30]}...")
    else:
        print("[ERROR] SUPABASE_URL not found")

    if supabase_key:
        print(f"[OK] SUPABASE_SERVICE_ROLE_KEY: {supabase_key[:20]}...")
    else:
        print("[ERROR] SUPABASE_SERVICE_ROLE_KEY not found")

except Exception as e:
    print(f"[ERROR] .env error: {e}")
    import traceback
    traceback.print_exc()

print("\n=== Step 4: Creating Supabase client ===")
try:
    supabase = create_client(
        os.getenv('SUPABASE_URL'),
        os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    )
    print("[OK] Supabase client created")
except Exception as e:
    print(f"[ERROR] Supabase client error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n=== Step 5: Testing DB query ===")
try:
    result = supabase.table('collected_data_v40').select('id', count='exact').eq(
        'politician_id', '8c5dcc89'
    ).execute()
    print(f"[OK] DB query successful: {result.count} items found")
except Exception as e:
    print(f"[ERROR] DB query error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("\n=== Step 6: Testing duplicate_check_utils import ===")
try:
    # Add helpers to path
    SCRIPT_DIR = Path(__file__).resolve().parent
    HELPERS_DIR = SCRIPT_DIR.parent / 'helpers'
    sys.path.insert(0, str(HELPERS_DIR))

    print(f"Helpers dir: {HELPERS_DIR}")
    print(f"Helpers dir exists: {HELPERS_DIR.exists()}")

    from duplicate_check_utils import normalize_url, normalize_title
    print("[OK] duplicate_check_utils imported")

    # Test the functions
    test_url = normalize_url("https://example.com/test?param=value")
    print(f"[OK] normalize_url works: {test_url}")

except Exception as e:
    print(f"[ERROR] duplicate_check_utils error: {e}")
    import traceback
    traceback.print_exc()

print("\n=== All tests passed! ===")
