#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
조은희 collected_data_v30 데이터 상태 확인
Perplexity 데이터 문제 진단
"""

import os
import sys
from pathlib import Path
from supabase import create_client
from collections import Counter
from dotenv import load_dotenv

# UTF-8 출력 설정 (Windows cmd 호환)
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# .env 파일 로드 (0-3_AI_Evaluation_Engine/.env)
env_path = Path(__file__).parent.parent.parent.parent / '.env'
load_dotenv(env_path)

# Supabase 초기화
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

def check_data_status():
    """조은희 데이터 상태 확인"""

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

    # collected_data_v30 조회
    response = supabase.table('collected_data_v30') \
        .select('*') \
        .eq('politician_id', politician_id) \
        .execute()

    data_items = response.data
    total = len(data_items)

    print(f"📊 collected_data_v30 데이터 상태")
    print(f"=" * 60)
    print(f"총 데이터: {total}개")
    print()

    # AI 분포 (collector_ai 필드 사용)
    ai_counter = Counter([item.get('collector_ai', item.get('ai_name', 'Unknown')) for item in data_items])
    print(f"🤖 AI 분포:")
    for ai_name, count in ai_counter.most_common():
        percentage = (count / total * 100) if total > 0 else 0
        print(f"  - {ai_name}: {count}개 ({percentage:.1f}%)")
    print()

    # V30 기대값 (2026-01-20 조정)
    print(f"📋 V30 기대값:")
    print(f"  - Gemini: 950개 (95%)")
    print(f"  - Grok: 50개 (5%)")
    print(f"  - Perplexity: 0개 (0%) ← V30에서 제거됨!")
    print()

    # 문제 진단
    perplexity_count = ai_counter.get('Perplexity', 0)
    if perplexity_count > 0:
        print(f"🚨 문제 발견!")
        print(f"  - Perplexity 데이터가 {perplexity_count}개 ({perplexity_count/total*100:.1f}%) 존재합니다.")
        print(f"  - V30에서는 Perplexity가 제거되었으므로 0개여야 합니다.")
        print(f"  - 이전 버전(V28?) 데이터가 남아있는 것으로 추정됩니다.")
    else:
        print(f"✅ Perplexity 데이터 없음 (정상)")

    print()

    # 카테고리별 분포
    category_counter = Counter([item['category'] for item in data_items])
    print(f"📁 카테고리별 분포:")
    for category, count in sorted(category_counter.items()):
        print(f"  - {category}: {count}개")

if __name__ == "__main__":
    check_data_status()
