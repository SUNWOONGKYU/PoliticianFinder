#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""조은희 V30 데이터 품질 상세 검증"""

import sys
import os
from supabase import create_client
from collections import Counter
from datetime import datetime, timedelta
from urllib.parse import urlparse
from dotenv import load_dotenv

# UTF-8 출력
if sys.platform == 'win32':
    import io
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    except AttributeError:
        pass

load_dotenv(override=True)

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

politician_id = 'd0a5d6e1'
politician_name = '조은희'

# OFFICIAL 도메인
OFFICIAL_DOMAINS = [
    "assembly.go.kr", "likms.assembly.go.kr", "mois.go.kr", "korea.kr",
    "nec.go.kr", "bai.go.kr", "pec.go.kr", "scourt.go.kr", "nesdc.go.kr",
    "manifesto.or.kr", "peoplepower21.org", "theminjoo.kr",
    "seoul.go.kr", "gg.go.kr", "busan.go.kr", "open.go.kr"
]

print("="*80)
print(f"조은희 ({politician_id}) 데이터 품질 검증")
print("="*80)
print()

# 전체 데이터 조회
result = supabase.table('collected_data_v30')\
    .select('*')\
    .eq('politician_id', politician_id)\
    .execute()

data = result.data
total = len(data)

print(f"📊 총 데이터: {total}개")
print()

if total == 0:
    print("❌ 데이터 없음!")
    sys.exit(1)

# 1. AI 분포 분석
print("="*80)
print("1️⃣ AI 분포 (V30 목표: Gemini 90% + Grok 10%)")
print("="*80)
ai_counts = Counter([d['collector_ai'] for d in data])
for ai in sorted(ai_counts.keys()):
    count = ai_counts[ai]
    pct = (count / total) * 100
    target_pct = 90 if ai == 'Gemini' else 10 if ai == 'Grok' else 0
    diff = pct - target_pct
    status = "✅" if abs(diff) < 5 else "⚠️" if abs(diff) < 15 else "❌"
    marker = f"(목표 {target_pct}%, 차이 {diff:+.1f}%)" if target_pct > 0 else "🚨 V30에서 제거됨!"
    print(f"  {status} {ai:12s}: {count:3d}개 ({pct:5.1f}%) {marker}")
print()

# 2. 필수 필드 품질
print("="*80)
print("2️⃣ 필수 필드 품질")
print("="*80)

missing_title = [d for d in data if not d.get('title') or len(d.get('title', '').strip()) == 0]
missing_content = [d for d in data if not d.get('content') or len(d.get('content', '').strip()) == 0]
missing_url = [d for d in data if not d.get('source_url') or len(d.get('source_url', '').strip()) == 0]
missing_source_name = [d for d in data if not d.get('source_name')]
missing_date = [d for d in data if not d.get('published_date')]
missing_category = [d for d in data if not d.get('category')]

print(f"  title 누락: {len(missing_title)}개 {'✅' if len(missing_title) == 0 else '❌'}")
if len(missing_title) > 0:
    print(f"    샘플: {missing_title[0].get('id')}")

print(f"  content 누락: {len(missing_content)}개 {'✅' if len(missing_content) == 0 else '❌'}")
if len(missing_content) > 0:
    print(f"    샘플: {missing_content[0].get('id')}")

print(f"  source_url 누락: {len(missing_url)}개 {'✅' if len(missing_url) == 0 else '❌'}")
if len(missing_url) > 0:
    print(f"    샘플: {missing_url[0].get('id')}")

print(f"  source_name 누락: {len(missing_source_name)}개 {'✅' if len(missing_source_name) == 0 else '❌'}")
print(f"  published_date 누락: {len(missing_date)}개 {'✅' if len(missing_date) == 0 else '❌'}")
print(f"  category 누락: {len(missing_category)}개 {'✅' if len(missing_category) == 0 else '🚨 V30 필수!'}")
print()

# 3. URL 품질 분석
print("="*80)
print("3️⃣ URL 품질")
print("="*80)

fake_patterns = ['example.com', 'placeholder', 'sample', 'test.com', 'dummy']
fake_urls = [d for d in data if any(p in d.get('source_url', '').lower() for p in fake_patterns)]
invalid_urls = [d for d in data if d.get('source_url') and not d['source_url'].startswith('http')]

print(f"  가짜 URL 패턴: {len(fake_urls)}개 {'✅' if len(fake_urls) == 0 else '❌'}")
if len(fake_urls) > 0:
    for i, d in enumerate(fake_urls[:3], 1):
        print(f"    {i}. {d['source_url'][:60]}")

print(f"  유효하지 않은 URL: {len(invalid_urls)}개 {'✅' if len(invalid_urls) == 0 else '❌'}")
if len(invalid_urls) > 0:
    for i, d in enumerate(invalid_urls[:3], 1):
        print(f"    {i}. {d['source_url'][:60]}")
print()

# 4. source_type 검증
print("="*80)
print("4️⃣ source_type 검증 (OFFICIAL vs PUBLIC)")
print("="*80)

# source_type 필드 존재 여부
has_source_type = [d for d in data if 'source_type' in d and d['source_type']]
print(f"  source_type 필드 존재: {len(has_source_type)}개 ({len(has_source_type)/total*100:.1f}%)")

if len(has_source_type) > 0:
    type_counts = Counter([d['source_type'] for d in has_source_type])
    for st in sorted(type_counts.keys()):
        count = type_counts[st]
        pct = (count / len(has_source_type)) * 100
        target = "50%"
        print(f"    {st}: {count}개 ({pct:.1f}%) - 목표: {target}")

    # source_type과 URL 도메인 일치 검증
    mismatches = []
    for d in has_source_type:
        url = d.get('source_url', '')
        source_type = d.get('source_type')
        is_official_domain = any(domain in url for domain in OFFICIAL_DOMAINS)

        if source_type == 'OFFICIAL' and not is_official_domain:
            mismatches.append((d['id'], url, 'OFFICIAL로 표기되었으나 PUBLIC 도메인'))
        elif source_type == 'PUBLIC' and is_official_domain:
            mismatches.append((d['id'], url, 'PUBLIC로 표기되었으나 OFFICIAL 도메인'))

    print(f"\n  source_type 불일치: {len(mismatches)}개 {'✅' if len(mismatches) == 0 else '❌'}")
    if len(mismatches) > 0:
        for i, (id, url, reason) in enumerate(mismatches[:3], 1):
            print(f"    {i}. {reason}")
            print(f"       URL: {url[:70]}")
else:
    print(f"  🚨 source_type 필드 없음 - V30 스키마 아님!")
print()

# 5. 기간 제한 검증
print("="*80)
print("5️⃣ 기간 제한 (OFFICIAL 4년, PUBLIC 2년)")
print("="*80)

now = datetime.now()
official_limit = now - timedelta(days=365*4)
public_limit = now - timedelta(days=365*2)

out_of_range = []
for d in data:
    if not d.get('published_date'):
        continue
    try:
        pub_date = datetime.fromisoformat(d['published_date'].replace('Z', '+00:00'))
        source_type = d.get('source_type', 'UNKNOWN')

        if source_type == 'OFFICIAL' and pub_date < official_limit:
            out_of_range.append((d['id'], pub_date, source_type, '4년 초과'))
        elif source_type == 'PUBLIC' and pub_date < public_limit:
            out_of_range.append((d['id'], pub_date, source_type, '2년 초과'))
    except:
        pass

print(f"  기간 초과: {len(out_of_range)}개 {'✅' if len(out_of_range) == 0 else '❌'}")
if len(out_of_range) > 0:
    for i, (id, date, stype, reason) in enumerate(out_of_range[:3], 1):
        print(f"    {i}. [{stype}] {date.strftime('%Y-%m-%d')} - {reason}")
print()

# 6. 중복 검사
print("="*80)
print("6️⃣ 중복 검사 (같은 AI + 같은 URL)")
print("="*80)

seen = {}
duplicates = []
for d in data:
    key = (d['collector_ai'], d.get('source_url', ''))
    if key in seen:
        duplicates.append((seen[key], d['id'], d['source_url']))
    else:
        seen[key] = d['id']

print(f"  중복: {len(duplicates)}개 {'✅' if len(duplicates) == 0 else '❌'}")
if len(duplicates) > 0:
    print(f"  첫 3개 샘플:")
    for i, (id1, id2, url) in enumerate(duplicates[:3], 1):
        print(f"    {i}. ID {id1} = ID {id2}")
        print(f"       URL: {url[:70]}")
print()

# 7. Grok X 전담 검증
print("="*80)
print("7️⃣ Grok X/트위터 전담 검증")
print("="*80)

grok_data = [d for d in data if d['collector_ai'] == 'Grok']
grok_x = [d for d in grok_data if 'twitter.com' in d.get('source_url', '') or 'x.com' in d.get('source_url', '')]
grok_non_x = [d for d in grok_data if 'twitter.com' not in d.get('source_url', '') and 'x.com' not in d.get('source_url', '')]

print(f"  Grok 총: {len(grok_data)}개")
print(f"  Grok X/Twitter: {len(grok_x)}개 ({len(grok_x)/len(grok_data)*100 if grok_data else 0:.1f}%)")
print(f"  Grok X 외: {len(grok_non_x)}개 {'✅' if len(grok_non_x) == 0 else '❌'}")

if len(grok_non_x) > 0:
    print(f"\n  🚨 Grok이 X 외 출처 수집 (V30 위반!):")
    for i, d in enumerate(grok_non_x[:5], 1):
        print(f"    {i}. {d.get('source_name', 'Unknown')}: {d['source_url'][:60]}")
print()

# 최종 요약
print("="*80)
print("📋 품질 검증 요약")
print("="*80)

issues = []
if 'Perplexity' in ai_counts:
    issues.append(f"🚨 Perplexity 데이터 {ai_counts['Perplexity']}개 (V30은 0개여야 함)")
if len(missing_category) > 0:
    issues.append(f"🚨 category 필드 없음 {len(missing_category)}개 (V30 필수 필드)")
if len(has_source_type) < total:
    issues.append(f"🚨 source_type 필드 없음 {total - len(has_source_type)}개 (V30 필수 필드)")
if len(missing_title) > 0:
    issues.append(f"❌ title 누락 {len(missing_title)}개")
if len(missing_content) > 0:
    issues.append(f"❌ content 누락 {len(missing_content)}개")
if len(missing_url) > 0:
    issues.append(f"❌ source_url 누락 {len(missing_url)}개")
if len(fake_urls) > 0:
    issues.append(f"❌ 가짜 URL {len(fake_urls)}개")
if len(out_of_range) > 0:
    issues.append(f"❌ 기간 초과 {len(out_of_range)}개")
if len(duplicates) > 0:
    issues.append(f"⚠️ 중복 {len(duplicates)}개")
if len(grok_non_x) > 0:
    issues.append(f"❌ Grok X 외 수집 {len(grok_non_x)}개")

if issues:
    print("🚨 발견된 품질 문제:")
    for i, issue in enumerate(issues, 1):
        print(f"  {i}. {issue}")
    print()
    print("💡 결론: 이 데이터는 V30 스키마가 아니라 이전 버전(V28?) 데이터입니다.")
    print("          collected_data_v30 테이블을 비우고 V30 스크립트로 재수집 필요!")
else:
    print("✅ 모든 품질 검증 통과!")

print("="*80)
