#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Task ID: P2D1
Check current Supabase schema
"""
import os
import sys
from supabase import create_client

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

try:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    # Known tables based on task description
    known_tables = [
        "profiles",
        "politicians",
        "posts",
        "comments",
        "favorite_politicians",
        "notifications",
        "payments",
        "follows",
        "shares",
        "votes",
        "reports",
        "audit_logs",
        "advertisements",
        "policies",
        "notification_templates",
        "system_settings",
        "admin_actions",
        "ai_evaluations",
        "politician_verification",
        "careers",
        "pledges"
    ]

    print("=" * 80)
    print("Current Supabase Tables Check")
    print("=" * 80)
    print()

    existing_tables = []
    missing_tables = []

    for table_name in known_tables:
        try:
            response = supabase.table(table_name).select("*").limit(1).execute()
            existing_tables.append(table_name)
            print(f"[OK] {table_name}: EXISTS")
            if response.data and len(response.data) > 0:
                columns = list(response.data[0].keys())
                print(f"  Columns: {', '.join(columns)}")
        except Exception as e:
            missing_tables.append(table_name)
            print(f"[  ] {table_name}: MISSING")

    print()
    print("=" * 80)
    print(f"Summary: {len(existing_tables)} existing, {len(missing_tables)} missing")
    print("=" * 80)
    print()
    print("Existing tables:")
    for t in existing_tables:
        print(f"  - {t}")
    print()
    print("Missing tables:")
    for t in missing_tables:
        print(f"  - {t}")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
