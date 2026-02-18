#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""조은희 V30 수집 데이터 빠른 검증"""

import sys
import os
from supabase import create_client
from collections import Counter
from datetime import datetime, timedelta
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
print(f"조은희 ({politician_id}) V30 수집 검증")
print("="*80)
print()

# 전체 데이터 조회
result = supabase.table('collected_data_v30')\
    .select('*')\
    .eq('politician_id', politician_id)\
    .execute()

data = result.data
total = len(data)

print(f"📊 총 수집: {total}개")
print()

if total == 0:
    print("❌ 데이터 없음!")
    sys.exit(1)

# 1. AI별 분포
print("="*80)
print("1️⃣ AI별 분포 (목표: Gemini 90% + Grok 10%)")
print("="*80)
ai_counts = Counter([d['collector_ai'] for d in data])
for ai in sorted(ai_counts.keys()):
    count = ai_counts[ai]
    pct = (count / total) * 100
    print(f"  {ai:12s}: {count:3d}개 ({pct:5.1f}%)")
print()

# 2. 카테고리별 분포
print("="*80)
print("2️⃣ 카테고리별 분포 (목표: 각 100개)")
print("="*80)
cat_counts = Counter([d['category'] for d in data])
for i in range(1, 11):
    cat = f"cat{i:02d}"
    count = cat_counts.get(cat, 0)
    status = "✅" if count >= 90 else "⚠️" if count >= 80 else "❌"
    print(f"  {status} {cat}: {count:3d}개")
print()

# 3. source_type 분포
print("="*80)
print("3️⃣ source_type 분포 (목표: OFFICIAL 50% + PUBLIC 50%)")
print("="*80)
type_counts = Counter([d['source_type'] for d in data])
for st in sorted(type_counts.keys()):
    count = type_counts[st]
    pct = (count / total) * 100
    print(f"  {st:8s}: {count:3d}개 ({pct:5.1f}%)")
print()

# 4. 필수 필드 체크
print("="*80)
print("4️⃣ 필수 필드 검증")
print("="*80)
missing_title = sum(1 for d in data if not d.get('title'))
missing_content = sum(1 for d in data if not d.get('content'))
missing_url = sum(1 for d in data if not d.get('source_url'))
missing_date = sum(1 for d in data if not d.get('published_date'))

print(f"  title 누락: {missing_title}개 {'✅' if missing_title == 0 else '❌'}")
print(f"  content 누락: {missing_content}개 {'✅' if missing_content == 0 else '❌'}")
print(f"  source_url 누락: {missing_url}개 {'✅' if missing_url == 0 else '❌'}")
print(f"  published_date 누락: {missing_date}개 {'✅' if missing_date == 0 else '❌'}")
print()

# 5. 기간 제한 검증
print("="*80)
print("5️⃣ 기간 제한 검증 (OFFICIAL 4년, PUBLIC 2년)")
print("="*80)
now = datetime.now()
official_limit = now - timedelta(days=365*4)
public_limit = now - timedelta(days=365*2)

out_of_range = 0
for d in data:
    if not d.get('published_date'):
        continue
    try:
        pub_date = datetime.fromisoformat(d['published_date'].replace('Z', '+00:00'))
        if d['source_type'] == 'OFFICIAL' and pub_date < official_limit:
            out_of_range += 1
        elif d['source_type'] == 'PUBLIC' and pub_date < public_limit:
            out_of_range += 1
    except:
        pass

print(f"  기간 초과: {out_of_range}개 {'✅' if out_of_range == 0 else '❌'}")
print()

# 6. Grok = X만? 검증
print("="*80)
print("6️⃣ Grok 수집 검증 (X/트위터만 수집해야 함)")
print("="*80)
grok_data = [d for d in data if d['collector_ai'] == 'Grok']
grok_non_x = [d for d in grok_data if 'twitter.com' not in d.get('source_url', '') and 'x.com' not in d.get('source_url', '')]
print(f"  Grok 총: {len(grok_data)}개")
print(f"  Grok X 아님: {len(grok_non_x)}개 {'✅' if len(grok_non_x) == 0 else '❌'}")
if grok_non_x:
    print(f"  ⚠️ Grok이 X 외 출처 수집:")
    for d in grok_non_x[:3]:
        print(f"    - {d['source_url'][:80]}")
print()

# 7. 중복 검사
print("="*80)
print("7️⃣ 중복 검사 (같은 AI + 같은 URL)")
print("="*80)
seen = set()
duplicates = 0
for d in data:
    key = (d['collector_ai'], d.get('source_url', ''))
    if key in seen:
        duplicates += 1
    seen.add(key)
print(f"  중복: {duplicates}개 {'✅' if duplicates == 0 else '❌'}")
print()

# 최종 판정
print("="*80)
print("✅ 검증 완료")
print("="*80)
print()

# 요약
issues = []
if ai_counts.get('Gemini', 0) < total * 0.85:
    issues.append("⚠️ Gemini 비율 부족 (목표 90%)")
if ai_counts.get('Grok', 0) < total * 0.05:
    issues.append("⚠️ Grok 비율 부족 (목표 10%)")
if missing_title or missing_content or missing_url:
    issues.append("❌ 필수 필드 누락")
if out_of_range > 0:
    issues.append("❌ 기간 제한 위반")
if len(grok_non_x) > 0:
    issues.append("❌ Grok이 X 외 수집")
if duplicates > 0:
    issues.append("⚠️ 중복 데이터 존재")

if issues:
    print("🚨 발견된 문제:")
    for issue in issues:
        print(f"  {issue}")
else:
    print("✅ 모든 검증 통과!")
