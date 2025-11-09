#!/usr/bin/env python3
"""
Execute combined_setup.sql using Supabase REST API
"""

import requests
import sys

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

print("[INFO] Reading combined_setup.sql...")

try:
    with open('combined_setup.sql', 'r', encoding='utf-8') as f:
        sql_content = f.read()
except Exception as e:
    print(f"[ERROR] Failed to read SQL file: {e}")
    sys.exit(1)

print(f"[INFO] SQL file size: {len(sql_content)} characters")
print("[INFO] Executing SQL via POST to Supabase...")

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json"
}

# Try to execute via RPC
payload = {
    "query": sql_content
}

try:
    response = requests.post(
        f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
        headers=headers,
        json=payload,
        timeout=120
    )

    print(f"[RESPONSE] Status: {response.status_code}")
    print(f"[RESPONSE] Body: {response.text}")

    if response.status_code in [200, 201, 204]:
        print("[SUCCESS] SQL executed successfully!")
        sys.exit(0)
    else:
        print("[ERROR] SQL execution failed")
        sys.exit(1)

except Exception as e:
    print(f"[ERROR] Request failed: {e}")
    sys.exit(1)
