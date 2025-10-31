#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

oh_id = 272

print('='*80)
print('OH SEHOON FINAL SCORE CHECK')
print('='*80)
print()

# 1. collected_data
response = supabase.table('collected_data').select('*', count='exact').eq('politician_id', oh_id).execute()
print(f'1. collected_data: {response.count} records')

# 2. ai_item_scores
response = supabase.table('ai_item_scores').select('*', count='exact').eq('politician_id', oh_id).execute()
print(f'2. ai_item_scores: {response.count}/70 items')

# 3. ai_category_scores
response = supabase.table('ai_category_scores').select('*').eq('politician_id', oh_id).execute()
print(f'3. ai_category_scores: {len(response.data)}/10 categories')
if response.data:
    total = 0
    for cat in response.data:
        print(f"   Category {cat['category_num']}: {cat['category_score']}")
        total += cat['category_score']
    if len(response.data) == 10:
        print(f'   TOTAL: {total}')

# 4. ai_final_scores
print()
response = supabase.table('ai_final_scores').select('*').eq('politician_id', oh_id).execute()
if response.data:
    final = response.data[0]
    print(f"4. FINAL SCORE: {final['final_score']}")
    print(f"   Grade: {final['grade_code']} - {final['grade_name']} {final['grade_emoji']}")
else:
    print('4. FINAL SCORE: Not yet calculated (waiting for 10 categories)')

print()
print('='*80)
