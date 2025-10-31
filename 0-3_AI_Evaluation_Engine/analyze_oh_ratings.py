#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

oh_id = 272

print('='*80)
print('OH SEHOON RATING DISTRIBUTION ANALYSIS')
print('='*80)
print()

# Rating 분포 분석
response = supabase.table('collected_data').select('rating, category_num').eq('politician_id', oh_id).execute()

ratings = {}
for data in response.data:
    cat = data['category_num']
    rating = data['rating']
    if cat not in ratings:
        ratings[cat] = []
    ratings[cat].append(rating)

print('RATING DISTRIBUTION BY CATEGORY')
print('-'*80)

total_ratings = []
for cat in sorted(ratings.keys()):
    cat_ratings = ratings[cat]
    avg = sum(cat_ratings) / len(cat_ratings)
    positive = len([r for r in cat_ratings if r > 0])
    negative = len([r for r in cat_ratings if r < 0])
    neutral = len([r for r in cat_ratings if r == 0])

    total_ratings.extend(cat_ratings)

    print(f'Category {cat:2d}: Avg={avg:+.2f} | +:{positive:3d} / 0:{neutral:3d} / -:{negative:3d} | Total:{len(cat_ratings):3d}')
    print(f'             Range: {min(cat_ratings)} to {max(cat_ratings)}')

print()
print('='*80)
print('OVERALL STATISTICS')
print('='*80)

total_avg = sum(total_ratings) / len(total_ratings)
total_positive = len([r for r in total_ratings if r > 0])
total_negative = len([r for r in total_ratings if r < 0])
total_neutral = len([r for r in total_ratings if r == 0])

print(f'Total Data: {len(total_ratings)}')
print(f'Average Rating: {total_avg:+.2f}')
print(f'Positive: {total_positive} ({total_positive/len(total_ratings)*100:.1f}%)')
print(f'Neutral:  {total_neutral} ({total_neutral/len(total_ratings)*100:.1f}%)')
print(f'Negative: {total_negative} ({total_negative/len(total_ratings)*100:.1f}%)')
print(f'Range: {min(total_ratings)} to {max(total_ratings)}')

print()
print('='*80)
print('PROBLEM ANALYSIS')
print('='*80)

if total_negative < total_positive * 0.3:
    print('[WARNING] Too few negative ratings!')
    print(f'Expected: ~{int(total_positive * 0.3)} negative ratings')
    print(f'Actual: {total_negative} negative ratings')
    print()
    print('ISSUE: Sub-agents may be too lenient with ratings.')
    print('SOLUTION: Need stricter rating guidelines or balanced data collection.')
else:
    print('[OK] Rating distribution seems reasonable.')

print()
print('='*80)
