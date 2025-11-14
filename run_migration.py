#!/usr/bin/env python3
import os, sys
from supabase import create_client

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Read SQL file
with open('../add_politician_fields.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

print("Executing migration...")
print("SQL commands:")
print(sql)
print("\nNote: Supabase Python client doesn't support direct SQL execution.")
print("Please run this SQL manually in Supabase SQL Editor:")
print(f"\n1. Go to {SUPABASE_URL}/project/_/sql")
print("2. Paste the SQL above")
print("3. Click 'Run'")
