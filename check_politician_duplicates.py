#!/usr/bin/env python3
import os
from supabase import create_client, Client
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), '1_Frontend', '.env.local')
load_dotenv(env_path)

url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

supabase: Client = create_client(url, key)

print("=== CHECKING c34753dd ===\n")

response = supabase.table('politician_details').select('*').eq('politician_id', 'c34753dd').execute()

print(f"Records for c34753dd: {len(response.data)}")

if len(response.data) == 0:
    print("ERROR: No records!")
elif len(response.data) == 1:
    print("OK: 1 record")
    print(f"Data: {response.data[0]}")
else:
    print(f"ERROR: {len(response.data)} records (DUPLICATE)!")
    for i, record in enumerate(response.data, 1):
        print(f"Record {i}: {record}")

print("\n=== CHECKING ALL DUPLICATES ===\n")
all_response = supabase.table('politician_details').select('politician_id').execute()
all_ids = [r['politician_id'] for r in all_response.data]

from collections import Counter
duplicates = {pid: count for pid, count in Counter(all_ids).items() if count > 1}

if duplicates:
    print(f"Found {len(duplicates)} duplicates:")
    for pid, count in list(duplicates.items())[:10]:
        print(f"  {pid}: {count} records")
else:
    print("No duplicates!")

print(f"\nTotal: {len(all_ids)}, Unique: {len(set(all_ids))}")
