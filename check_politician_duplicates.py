#!/usr/bin/env python3
"""
정치인 테이블 중복 데이터 확인
"""
import os, sys
from supabase import create_client
from collections import Counter

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("=" * 100)
print("Politicians Table - Duplicate Check")
print("=" * 100)
print()

# Get all politicians
result = supabase.table('politicians').select('id, name, party, position, region, district').execute()
politicians = result.data

print(f"Total politicians: {len(politicians)}")
print()

# Check for duplicates by name
names = [p['name'] for p in politicians]
name_counts = Counter(names)

duplicates = {name: count for name, count in name_counts.items() if count > 1}

if duplicates:
    print(f"Found {len(duplicates)} politicians with duplicate names:")
    print()

    for name, count in sorted(duplicates.items(), key=lambda x: x[1], reverse=True):
        print(f"Name: {name} ({count} records)")

        # Show all records with this name
        matching = [p for p in politicians if p['name'] == name]
        for i, p in enumerate(matching, 1):
            print(f"  {i}. ID: {p['id'][:20]}... | Party: {p['party']} | Position: {p['position']} | Region: {p.get('region', 'N/A')}")
        print()
else:
    print("[OK] No duplicate names found!")

print()
print("=" * 100)
print("Summary")
print("=" * 100)
print(f"Total records: {len(politicians)}")
print(f"Unique names: {len(set(names))}")
print(f"Duplicates: {sum(duplicates.values()) - len(duplicates) if duplicates else 0} records")
print()
