#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import sys
from dotenv import load_dotenv
from supabase import create_client

if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

print('=' * 80)
print('Final Database Verification')
print('=' * 80)

# Check collected_data
cd = supabase.table('collected_data').select('*', count='exact').eq(
    'politician_id', 272
).eq('category_num', 9).execute()

print(f'\n1. collected_data table: {cd.count} records stored')
ratings = [r['rating'] for r in cd.data]
print(f'   Average rating: {sum(ratings)/len(ratings):.2f}')
print(f'   Rating distribution: Min={min(ratings)}, Max={max(ratings)}')

# Check ai_item_scores (should be created by trigger)
items = supabase.table('ai_item_scores').select('*').eq(
    'politician_id', 272
).eq('category_num', 9).execute()

print(f'\n2. ai_item_scores table: {len(items.data)} records')
if items.data:
    for item in sorted(items.data, key=lambda x: x['item_num']):
        score = item.get('item_score', 'pending')
        print(f'   Item 9-{item["item_num"]}: {score}')
else:
    print('   (No item scores yet - triggers may not have run)')

# Check ai_category_scores
cats = supabase.table('ai_category_scores').select('*').eq(
    'politician_id', 272
).eq('category_num', 9).execute()

print(f'\n3. ai_category_scores table: {len(cats.data)} records')
if cats.data:
    for cat in cats.data:
        score = cat.get('category_score', 'pending')
        print(f'   Category 9 Score: {score}')
else:
    print('   (No category scores yet - triggers may not have run)')

print('\n' + '=' * 80)
print('Verification Complete!')
print('=' * 80)
print('\nStatus:')
print(f'  Data Collection: COMPLETE ({cd.count} records)')
print(f'  Item Scores: {"COMPLETE" if items.data else "PENDING (waiting for triggers)"}')
print(f'  Category Scores: {"COMPLETE" if cats.data else "PENDING (waiting for triggers)"}')
print('\nNote: If item/category scores are pending, DB triggers will automatically')
print('      calculate them based on the collected_data records.')
