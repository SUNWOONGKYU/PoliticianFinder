#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gemini 수집 결과 상세 확인"""

import sys
import os
from supabase import create_client
from collections import Counter
from dotenv import load_dotenv

# UTF-8 출력
if sys.platform == 'win32':
    import io
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    except AttributeError:
        pass

load_dotenv(override=True)

# Supabase 연결
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

politician_id = 'd0a5d6e1'

print("="*80)
print(f"조은희 Gemini 수집 결과 상세 분석")
print("="*80)
print()

# collected_data_v30 테이블 확인
result = supabase.table('collected_data_v30')\
    .select('collector_ai, data_type, category, title')\
    .eq('politician_id', politician_id)\
    .eq('collector_ai', 'Gemini')\
    .execute()

data = result.data
total = len(data)

print(f"📊 Gemini 총 수집: {total}개")
print()

# data_type별 분포
print("="*80)
print("data_type별 분포")
print("="*80)
data_type_counts = Counter([d.get('data_type', 'NONE') for d in data])
for dtype in sorted(data_type_counts.keys()):
    count = data_type_counts[dtype]
    pct = (count / total) * 100 if total > 0 else 0
    print(f"  {dtype:12s}: {count:4d}개 ({pct:5.1f}%)")
print()

# category별 분포
print("="*80)
print("category별 분포 (목표: 각 75개)")
print("="*80)
cat_counts = Counter([d.get('category', 'NONE') for d in data])

categories = [
    'expertise', 'leadership', 'vision', 'integrity', 'ethics',
    'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'
]

for cat in categories:
    count = cat_counts.get(cat, 0)
    progress_pct = (count / 75) * 100
    bar = "█" * min(count // 3, 25) + "░" * max(25 - count // 3, 0)
    status = "✅" if count >= 75 else "⚠️" if count >= 50 else "❌"
    print(f"  {status} {cat:18s}: [{bar}] {count:3d}/75 ({progress_pct:5.1f}%)")

print()
print(f"총계: {total}개 / 750개 목표 ({(total/750)*100:.1f}%)")
print()
