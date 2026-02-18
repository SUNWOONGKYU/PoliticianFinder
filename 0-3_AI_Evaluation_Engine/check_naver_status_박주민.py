#!/usr/bin/env python3
"""박주민 Naver 수집 상태 확인"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

politician_id = '8c5dcc89'
politician_name = '박주민'

print(f"\n{'='*60}")
print(f"박주민 ({politician_id}) Naver 수집 상태")
print(f"{'='*60}\n")

# 카테고리별 수집 현황
categories = [
    'expertise', 'leadership', 'vision', 'integrity', 'ethics',
    'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'
]

total_naver = 0
category_details = []

for cat in categories:
    result = supabase.table('collected_data_v40') \
        .select('id', count='exact') \
        .eq('politician_id', politician_id) \
        .eq('category', cat) \
        .eq('collector_ai', 'Naver') \
        .execute()

    count = result.count if result.count else 0
    total_naver += count
    category_details.append((cat, count))

    status = "[OK]" if count >= 50 else "[NEED]"
    print(f"{status} {cat:15s}: {count:3d}ea / 50ea")

print(f"\n{'='*60}")
print(f"Naver Total: {total_naver}ea / 500ea (Target)")
print(f"{'='*60}\n")

# 부족한 카테고리 확인
insufficient = [(cat, count) for cat, count in category_details if count < 50]

if insufficient:
    print("[WARNING] Need more collection:")
    for cat, count in insufficient:
        needed = 50 - count
        print(f"  - {cat}: need {needed}ea more")
    print(f"\nRun this command:")
    print(f"python collect_v40.py --politician_id={politician_id} --politician_name=\"{politician_name}\" --ai=Naver")
else:
    print("[OK] Naver collection completed!")
    print(f"\nNext step: Gemini CLI Direct collection")
    print(f"Ref: V40/instructions/2_collect/GEMINI_CLI_수집_가이드.md")
