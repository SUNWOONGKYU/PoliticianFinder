#!/usr/bin/env python3
"""
정치인 테이블 중복 데이터 제거
- 같은 이름의 정치인 중 가장 오래된(첫 번째) 레코드만 유지
- 나머지는 삭제
"""
import os, sys
from supabase import create_client
from collections import defaultdict

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("=" * 100)
print("Remove Duplicate Politicians")
print("=" * 100)
print()

# Get all politicians
result = supabase.table('politicians').select('*').order('created_at').execute()
politicians = result.data

print(f"Total politicians before: {len(politicians)}")
print()

# Group by name
by_name = defaultdict(list)
for p in politicians:
    by_name[p['name']].append(p)

# Find duplicates
duplicates_to_delete = []

for name, records in by_name.items():
    if len(records) > 1:
        print(f"Name: {name} - {len(records)} records")
        # Keep first (oldest), delete rest
        keep = records[0]
        delete = records[1:]

        print(f"  KEEP: ID={keep['id'][:20]}... created_at={keep.get('created_at', 'N/A')[:19]}")
        for d in delete:
            print(f"  DELETE: ID={d['id'][:20]}... created_at={d.get('created_at', 'N/A')[:19]}")
            duplicates_to_delete.append(d['id'])
        print()

print(f"Total duplicates to delete: {len(duplicates_to_delete)}")
print()

if duplicates_to_delete:
    confirm = input(f"Delete {len(duplicates_to_delete)} duplicate politicians? (yes/no): ")

    if confirm.lower() == 'yes':
        deleted_count = 0
        for politician_id in duplicates_to_delete:
            try:
                supabase.table('politicians').delete().eq('id', politician_id).execute()
                deleted_count += 1
                if deleted_count % 10 == 0:
                    print(f"  Deleted {deleted_count}/{len(duplicates_to_delete)}...")
            except Exception as e:
                print(f"  Error deleting {politician_id[:20]}: {str(e)[:100]}")

        print()
        print(f"Deleted {deleted_count} duplicate politicians")
    else:
        print("Deletion cancelled")
else:
    print("[OK] No duplicates to delete")

print()
print("=" * 100)
print("Final Count")
print("=" * 100)

# Get final count
final_result = supabase.table('politicians').select('id', count='exact').execute()
final_count = final_result.count

print(f"Total politicians after: {final_count}")
print()
