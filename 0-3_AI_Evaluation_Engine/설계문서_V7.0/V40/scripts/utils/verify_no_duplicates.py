#!/usr/bin/env python3
"""Verify no same-AI duplicates exist"""

import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client
from collections import defaultdict

ENV_PATH = Path(__file__).resolve().parent.parent.parent.parent.parent / '.env'
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)
else:
    load_dotenv()

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

print("\n=== Verifying Same-AI Duplicates ===\n")

# Get all data (with pagination to avoid 1000 row limit)
all_data = []
page_size = 1000
offset = 0

while True:
    result = supabase.table('collected_data_v40').select(
        'id, category, source_url, collector_ai, created_at'
    ).eq('politician_id', '8c5dcc89').range(offset, offset + page_size - 1).execute()

    if not result.data:
        break

    all_data.extend(result.data)

    if len(result.data) < page_size:
        break

    offset += page_size

print(f"Total data: {len(all_data)}")

# Group by (category, collector_ai, url)
groups = defaultdict(list)
for item in all_data:
    key = (item['category'], item['collector_ai'], item['source_url'])
    groups[key].append(item)

# Find same-AI duplicates
same_ai_duplicates = []
for key, items in groups.items():
    if len(items) > 1:
        category, ai, url = key
        same_ai_duplicates.append({
            'key': key,
            'count': len(items),
            'ids': [item['id'] for item in items],
            'dates': [item['created_at'] for item in items]
        })

if same_ai_duplicates:
    print(f"\nWARNING: Found {len(same_ai_duplicates)} same-AI duplicate groups!")
    print(f"Total duplicate items: {sum(d['count'] - 1 for d in same_ai_duplicates)}\n")

    print("Examples (first 5):")
    for i, dup in enumerate(same_ai_duplicates[:5], 1):
        category, ai, url = dup['key']
        print(f"\n{i}. [{category}] {ai}")
        print(f"   URL: {url[:80]}...")
        print(f"   Count: {dup['count']}x")
        print(f"   IDs: {dup['ids']}")
        print(f"   Dates: {dup['dates']}")
else:
    print("\nOK: No same-AI duplicates found!")

# Also check for cross-AI duplicates (these are ALLOWED)
cross_ai_groups = defaultdict(list)
for item in all_data:
    key = (item['category'], item['source_url'])
    cross_ai_groups[key].append(item['collector_ai'])

cross_ai_duplicates = 0
for key, ais in cross_ai_groups.items():
    if len(ais) > 1 and len(set(ais)) > 1:
        cross_ai_duplicates += 1

print(f"\nInfo: {cross_ai_duplicates} cross-AI duplicates (ALLOWED by design)\n")
