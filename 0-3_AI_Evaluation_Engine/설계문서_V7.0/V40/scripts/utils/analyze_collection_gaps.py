#!/usr/bin/env python3
"""Analyze collection gaps and determine what needs re-collection"""

import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

ENV_PATH = Path(__file__).resolve().parent.parent.parent.parent.parent / '.env'
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)
else:
    load_dotenv()

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

categories = [
    'expertise', 'leadership', 'vision', 'integrity', 'ethics',
    'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'
]

TARGET_PER_AI = 60  # 12 OFFICIAL + 48 PUBLIC
TARGET_PER_CATEGORY = 120  # 60 × 2 AIs

print("\n=== Collection Gap Analysis ===\n")
print(f"Target per AI per category: {TARGET_PER_AI}")
print(f"Target per category total: {TARGET_PER_CATEGORY}\n")
print("=" * 90)
print(f"{'Category':<20} {'Gemini':<12} {'Naver':<12} {'Total':<12} {'Gap':<12} {'Status'}")
print("=" * 90)

critical_gaps = []
minor_gaps = []

for cat in categories:
    gemini_count = supabase.table('collected_data_v40').select('id', count='exact').eq(
        'politician_id', '8c5dcc89'
    ).eq('category', cat).eq('collector_ai', 'Gemini').execute().count

    naver_count = supabase.table('collected_data_v40').select('id', count='exact').eq(
        'politician_id', '8c5dcc89'
    ).eq('category', cat).eq('collector_ai', 'Naver').execute().count

    total = gemini_count + naver_count
    gap = TARGET_PER_CATEGORY - total

    gemini_gap = TARGET_PER_AI - gemini_count
    naver_gap = TARGET_PER_AI - naver_count

    # Status
    if gap == 0:
        status = "OK"
    elif gap > 0 and gap <= 10:
        status = "Minor"
        minor_gaps.append((cat, gemini_gap, naver_gap, gap))
    else:
        status = "CRITICAL"
        critical_gaps.append((cat, gemini_gap, naver_gap, gap))

    print(f"{cat:<20} {gemini_count:>4}/{TARGET_PER_AI:<6} {naver_count:>4}/{TARGET_PER_AI:<6} {total:>4}/{TARGET_PER_CATEGORY:<6} {gap:>4}      {status}")

print("=" * 90)

total_collected = sum([
    supabase.table('collected_data_v40').select('id', count='exact').eq(
        'politician_id', '8c5dcc89'
    ).eq('category', cat).execute().count
    for cat in categories
])

total_gap = TARGET_PER_CATEGORY * len(categories) - total_collected

print(f"{'TOTAL':<20} {'536/600':<12} {'490/600':<12} {total_collected}/{TARGET_PER_CATEGORY * len(categories):<12} {total_gap:>4}")
print()

if critical_gaps:
    print(f"\nCRITICAL GAPS ({len(critical_gaps)} categories need immediate attention):")
    print("-" * 70)
    for cat, g_gap, n_gap, total_gap in critical_gaps:
        print(f"{cat:<20} Gemini: {g_gap:>3} | Naver: {n_gap:>3} | Total gap: {total_gap:>3}")

if minor_gaps:
    print(f"\nMINOR GAPS ({len(minor_gaps)} categories need slight top-up):")
    print("-" * 70)
    for cat, g_gap, n_gap, total_gap in minor_gaps:
        print(f"{cat:<20} Gemini: {g_gap:>3} | Naver: {n_gap:>3} | Total gap: {total_gap:>3}")

print(f"\n{'=' * 90}")
print(f"Overall Progress: {total_collected}/{TARGET_PER_CATEGORY * len(categories)} ({total_collected / (TARGET_PER_CATEGORY * len(categories)) * 100:.1f}%)")
print(f"Items to collect: {total_gap}")
print(f"{'=' * 90}\n")
