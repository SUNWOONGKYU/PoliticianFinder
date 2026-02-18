#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V40 수집 데이터 전체 확인"""

import os
import sys
from pathlib import Path
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Windows 콘솔 인코딩 설정
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# 경로 설정
SCRIPT_DIR = Path(__file__).resolve().parent
V40_DIR = SCRIPT_DIR
AI_EVAL_DIR = V40_DIR.parent.parent  # 0-3_AI_Evaluation_Engine
ENV_PATH = AI_EVAL_DIR / '.env'

# .env 로드
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)
else:
    print(f"❌ .env not found at: {ENV_PATH}")
    sys.exit(1)

from supabase import create_client

# Supabase 설정
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Supabase credentials not found")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("\n" + "="*60)
print("V40 수집 데이터 전체 현황")
print("="*60 + "\n")

# 전체 데이터 개수
result = supabase.table('collected_data_v40').select('id', count='exact').execute()
total_count = result.count if result.count else 0

print(f"📊 전체 수집 데이터: {total_count}개\n")

if total_count == 0:
    print("✅ V40 데이터가 아직 수집되지 않았습니다.")
    print("   → 스크립트 수정 후 수집을 시작하면 됩니다.\n")
    sys.exit(0)

# 정치인별 개수
result = supabase.table('collected_data_v40').select('politician_name', count='exact').execute()
politicians = {}
if result.data:
    for item in result.data:
        name = item.get('politician_name', 'Unknown')
        politicians[name] = politicians.get(name, 0) + 1

print(f"👥 정치인별 데이터 개수:")
for name, count in politicians.items():
    print(f"   - {name}: {count}개")

# data_type별 개수
print(f"\n📁 데이터 타입별 개수:")
result = supabase.table('collected_data_v40').select('data_type').execute()
if result.data:
    data_types = {}
    for item in result.data:
        dt = item.get('data_type', 'unknown')
        data_types[dt] = data_types.get(dt, 0) + 1

    for dt, count in data_types.items():
        print(f"   - {dt}: {count}개")

# collector_ai별 개수
print(f"\n🤖 수집 AI별 개수:")
result = supabase.table('collected_data_v40').select('collector_ai').execute()
if result.data:
    collectors = {}
    for item in result.data:
        ai = item.get('collector_ai', 'unknown')
        collectors[ai] = collectors.get(ai, 0) + 1

    for ai, count in collectors.items():
        print(f"   - {ai}: {count}개")

# 날짜 범위 확인
print(f"\n📅 수집 데이터 날짜 범위:")
result = supabase.table('collected_data_v40').select('published_date').order('published_date', desc=False).limit(1).execute()
if result.data and result.data[0].get('published_date'):
    oldest = result.data[0].get('published_date')
    print(f"   - 가장 오래된 데이터: {oldest}")

    # 몇 년 전인지 계산
    try:
        oldest_date = datetime.strptime(oldest, "%Y-%m-%d")
        years_ago = (datetime.now() - oldest_date).days / 365
        print(f"   - 기간: 약 {years_ago:.1f}년 전")

        # 4년 이상된 데이터가 있는지 확인
        four_years_ago = datetime.now() - timedelta(days=365*4)
        if oldest_date < four_years_ago:
            print(f"   ⚠️  4년 이상된 데이터 존재!")
    except:
        pass

result = supabase.table('collected_data_v40').select('published_date').order('published_date', desc=True).limit(1).execute()
if result.data and result.data[0].get('published_date'):
    newest = result.data[0].get('published_date')
    print(f"   - 가장 최근 데이터: {newest}")

# OFFICIAL 데이터의 날짜 범위
print(f"\n📅 OFFICIAL 데이터 날짜 범위:")
result = supabase.table('collected_data_v40').select('published_date').eq('data_type', 'official').order('published_date', desc=False).limit(1).execute()
if result.data and result.data[0].get('published_date'):
    oldest = result.data[0].get('published_date')
    print(f"   - 가장 오래된 OFFICIAL: {oldest}")
    try:
        oldest_date = datetime.strptime(oldest, "%Y-%m-%d")
        years_ago = (datetime.now() - oldest_date).days / 365
        print(f"   - 기간: 약 {years_ago:.1f}년 전")

        if years_ago > 4:
            print(f"   ❌ OFFICIAL 기간 제한(4년) 위반!")
        else:
            print(f"   ✅ OFFICIAL 기간 제한(4년) 준수")
    except:
        pass

# PUBLIC 데이터의 날짜 범위
print(f"\n📅 PUBLIC 데이터 날짜 범위:")
result = supabase.table('collected_data_v40').select('published_date').eq('data_type', 'public').order('published_date', desc=False).limit(1).execute()
if result.data and result.data[0].get('published_date'):
    oldest = result.data[0].get('published_date')
    print(f"   - 가장 오래된 PUBLIC: {oldest}")
    try:
        oldest_date = datetime.strptime(oldest, "%Y-%m-%d")
        years_ago = (datetime.now() - oldest_date).days / 365
        print(f"   - 기간: 약 {years_ago:.1f}년 전")

        if years_ago > 2:
            print(f"   ❌ PUBLIC 기간 제한(2년) 위반!")
        else:
            print(f"   ✅ PUBLIC 기간 제한(2년) 준수")
    except:
        pass

print("\n" + "="*60 + "\n")

# 문제 요약
print("🔍 문제 요약:\n")
if total_count > 0:
    print("❌ V40 데이터가 이미 수집되어 있습니다.")
    print("   → 스크립트 수정 후 기존 데이터 삭제 및 재수집 필요\n")
else:
    print("✅ V40 데이터가 없습니다.")
    print("   → 스크립트 수정 후 수집을 시작하면 됩니다.\n")
