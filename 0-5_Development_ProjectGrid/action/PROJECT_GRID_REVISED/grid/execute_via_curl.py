#!/usr/bin/env python3
"""
Execute SQL using curl command by converting to single line JSON
"""

import json
import subprocess
import sys

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

print("[INFO] Reading SQL files...")

sql_files = [
    'project_grid_revised_36_schema.sql',
    'phase_gates_schema.sql',
    'project_grid_revised_36_data.sql',
    'phase_gates_data.sql'
]

for sql_file in sql_files:
    print(f"\n[EXECUTE] {sql_file}...")

    try:
        with open(sql_file, 'r', encoding='utf-8') as f:
            sql_content = f.read()

        # Create JSON payload
        payload = json.dumps({"query": sql_content})

        # Build curl command
        curl_cmd = [
            'curl',
            '-X', 'POST',
            f'{SUPABASE_URL}/rest/v1/rpc/exec_sql',
            '-H', f'apikey: {SERVICE_KEY}',
            '-H', f'Authorization: Bearer {SERVICE_KEY}',
            '-H', 'Content-Type: application/json',
            '--data', payload
        ]

        # Execute curl
        result = subprocess.run(curl_cmd, capture_output=True, text=True, timeout=120)

        print(f"[STATUS] {result.returncode}")
        print(f"[OUTPUT] {result.stdout}")

        if result.returncode != 0 or 'error' in result.stdout.lower() or 'PGRST' in result.stdout:
            print(f"[ERROR] {result.stderr}")
            print(f"[WARN] Failed to execute {sql_file}, but continuing...")
        else:
            print(f"[OK] {sql_file} executed")

    except Exception as e:
        print(f"[ERROR] Failed to process {sql_file}: {e}")

print("\n[DONE] Check results above")
