#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
조은희 collected_data_v40 데이터 상태 확인
AI별 데이터 분포 진단
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

    # collected_data_v40 조회
    response = supabase.table('collected_data_v40') \
        .select('*') \
        .eq('politician_id', politician_id) \
        .execute()

    data_items = response.data
    total = len(data_items)

    print(f"📊 collected_data_v40 데이터 상태")
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

    # V40 기대값
    print(f"📋 V40 기대값:")
    print(f"  - Gemini: 500개 (50%)")
    print(f"  - Naver: 500개 (50%)")
    print(f"  - 총합: 1000개")
    print()

    # 문제 진단
    gemini_count = ai_counter.get('Gemini', 0)
    naver_count = ai_counter.get('Naver', 0)

    issues = []
    if gemini_count < 450 or gemini_count > 550:
        issues.append(f"Gemini 데이터가 {gemini_count}개 ({gemini_count/total*100:.1f}%) - 기대값: 500개 (50%)")
    if naver_count < 450 or naver_count > 550:
        issues.append(f"Naver 데이터가 {naver_count}개 ({naver_count/total*100:.1f}%) - 기대값: 500개 (50%)")

    if issues:
        print(f"🚨 문제 발견!")
        for issue in issues:
            print(f"  - {issue}")
    else:
        print(f"✅ AI 분포 정상 (Gemini 50%, Naver 50%)")

    print()

    # 카테고리별 분포
    category_counter = Counter([item['category'] for item in data_items])
    print(f"📁 카테고리별 분포:")
    for category, count in sorted(category_counter.items()):
        print(f"  - {category}: {count}개")

if __name__ == "__main__":
    check_data_status()
