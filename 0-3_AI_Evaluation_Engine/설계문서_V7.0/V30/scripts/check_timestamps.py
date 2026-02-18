#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
collected_data_v30 타임스탬프 분석
언제, 어떤 AI로 데이터가 수집되었는지 확인
"""

import os
import sys
from pathlib import Path
from supabase import create_client
from collections import Counter, defaultdict
from datetime import datetime
from dotenv import load_dotenv

# UTF-8 출력 설정
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# .env 파일 로드
env_path = Path(__file__).parent.parent.parent.parent / '.env'
load_dotenv(env_path)

# Supabase 초기화
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

def check_timestamps():
    """타임스탬프 분석"""

    politician_name = "조은희"

    # 조은희 ID 조회
    response = supabase.table('politicians') \
        .select('id') \
        .eq('name', politician_name) \
        .execute()

    if not response.data:
        print(f"❌ {politician_name} 정치인을 찾을 수 없습니다.")
        return

    politician_id = response.data[0]['id']
    print(f"✅ {politician_name} ID: {politician_id}")
    print()

    # collected_data_v30 조회 (created_at 필드 사용)
    response = supabase.table('collected_data_v30') \
        .select('collector_ai, created_at') \
        .eq('politician_id', politician_id) \
        .order('created_at') \
        .execute()

    data_items = response.data
    total = len(data_items)

    print(f"📊 타임스탬프 분석")
    print(f"=" * 60)
    print(f"총 데이터: {total}개")
    print()

    # AI별 타임스탬프 분석
    ai_timestamps = defaultdict(list)
    for item in data_items:
        ai = item.get('collector_ai', 'Unknown')
        timestamp = item.get('created_at')
        if timestamp:
            # ISO 8601 형식 파싱
            dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            ai_timestamps[ai].append(dt)

    # AI별 수집 시간 범위
    print(f"🤖 AI별 수집 시간 범위:")
    print()
    for ai in sorted(ai_timestamps.keys()):
        timestamps = ai_timestamps[ai]
        if timestamps:
            min_time = min(timestamps)
            max_time = max(timestamps)
            count = len(timestamps)
            print(f"  {ai}:")
            print(f"    - 수집 개수: {count}개")
            print(f"    - 최초 수집: {min_time.strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"    - 최근 수집: {max_time.strftime('%Y-%m-%d %H:%M:%S')}")
            print()

    # 전체 타임스탬프 범위
    all_timestamps = []
    for timestamps in ai_timestamps.values():
        all_timestamps.extend(timestamps)

    if all_timestamps:
        min_time = min(all_timestamps)
        max_time = max(all_timestamps)
        print(f"📅 전체 수집 기간:")
        print(f"  - 최초: {min_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"  - 최근: {max_time.strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"  - 기간: {(max_time - min_time).days}일")

if __name__ == "__main__":
    check_timestamps()
