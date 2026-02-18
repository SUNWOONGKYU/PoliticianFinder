#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V30 수집 진행 상황 확인"""

import sys
import os
from supabase import create_client
from collections import Counter
from datetime import datetime
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
politician_name = '조은희'

print("="*80)
print(f"조은희 ({politician_id}) V30 수집 진행 상황")
print("="*80)
print()

# collected_data_v30 테이블 확인
result = supabase.table('collected_data_v30')\
    .select('collector_ai, category, created_at')\
    .eq('politician_id', politician_id)\
    .order('created_at', desc=True)\
    .execute()

data = result.data
total = len(data)

if total == 0:
    print("❌ V30 데이터 없음 - 아직 수집 시작 안됨")
    sys.exit(0)

print(f"📊 현재까지 수집: {total}개")
print()

# 최근 수집 시간
latest = data[0]['created_at']
oldest = data[-1]['created_at']
print(f"🕐 최초 수집: {oldest}")
print(f"🕐 최근 수집: {latest}")
print()

# AI별 수집 현황
print("="*80)
print("AI별 수집 현황")
print("="*80)
ai_counts = Counter([d['collector_ai'] for d in data])
for ai in sorted(ai_counts.keys()):
    count = ai_counts[ai]
    pct = (count / total) * 100 if total > 0 else 0
    target = 450 if ai == 'Gemini' else 150 if ai == 'Perplexity' else 0
    progress = f"({count}/{target})" if target > 0 else ""
    print(f"  {ai:12s}: {count:4d}개 ({pct:5.1f}%) {progress}")
print()

# 카테고리별 수집 현황
print("="*80)
print("카테고리별 수집 현황 (목표: 각 60개)")
print("="*80)
cat_counts = Counter([d.get('category', 'NONE') for d in data])
for i in range(1, 11):
    cat = f"cat{i:02d}"
    count = cat_counts.get(cat, 0)
    progress_pct = (count / 60) * 100
    bar = "█" * (count // 3) + "░" * ((60 - count) // 3)
    status = "✅" if count >= 60 else "🔄" if count > 0 else "⏳"
    print(f"  {status} {cat}: [{bar}] {count:3d}/60 ({progress_pct:5.1f}%)")
print()

# 수집 속도 추정
if total > 0:
    try:
        latest_dt = datetime.fromisoformat(latest.replace('Z', '+00:00'))
        oldest_dt = datetime.fromisoformat(oldest.replace('Z', '+00:00'))
        duration = (latest_dt - oldest_dt).total_seconds()
        if duration > 0:
            rate = total / duration  # 개/초
            remaining = 1000 - total
            eta_seconds = remaining / rate if rate > 0 else 0
            eta_minutes = eta_seconds / 60
            print(f"📈 수집 속도: {rate:.2f}개/초")
            print(f"⏱️ 예상 완료까지: {eta_minutes:.1f}분")
    except:
        pass

print()
print("="*80)
if total >= 1000:
    print("✅ 수집 완료!")
else:
    print(f"🔄 수집 진행 중... ({total}/1000)")
print("="*80)
