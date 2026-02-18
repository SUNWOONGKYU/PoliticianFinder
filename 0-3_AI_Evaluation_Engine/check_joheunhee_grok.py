#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""조은희 Grok 수집 현황 확인 (비교용)"""

import sys
import os
from supabase import create_client
from dotenv import load_dotenv
from collections import Counter

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

print("="*80)
print("조은희 vs 김민석 Grok 수집 비교")
print("="*80)
print()

# 조은희 ID
JO_ID = 'd0a5d6e1'
KIM_ID = 'f9e00370'

for politician_id, name in [(JO_ID, '조은희'), (KIM_ID, '김민석')]:
    print(f"📊 {name} (Grok 수집 현황)")
    print("-" * 80)

    try:
        # Grok이 수집한 데이터
        result = supabase.table('collected_data_v30')\
            .select('id, category, source_url', count='exact')\
            .eq('politician_id', politician_id)\
            .eq('collector_ai', 'Grok')\
            .execute()

        total_grok = result.count
        data = result.data

        print(f"총 Grok 수집: {total_grok}개")
        print()

        if total_grok > 0:
            # 카테고리별 분포
            cat_counts = Counter([d['category'] for d in data])

            print("카테고리별 Grok 수집:")
            categories = [
                "expertise", "leadership", "vision", "integrity", "ethics",
                "accountability", "transparency", "communication",
                "responsiveness", "publicinterest"
            ]

            total_expected = len(categories) * 5  # 카테고리당 5개 목표

            for cat in categories:
                count = cat_counts.get(cat, 0)
                status = "✅" if count >= 5 else "⚠️"
                print(f"  {status} {cat}: {count}/5개")

            print()
            print(f"총 수집: {total_grok}/{total_expected}개 ({total_grok/total_expected*100:.1f}%)")

            # 고유 URL 개수 (중복 확인)
            unique_urls = len(set([d['source_url'] for d in data]))
            print(f"고유 URL: {unique_urls}개 (중복 제거 전: {total_grok}개)")
        else:
            print("Grok 수집 데이터 없음")

        print()
        print()

    except Exception as e:
        print(f"❌ 오류: {e}")
        print()

print("="*80)
print("🔍 분석")
print("="*80)
print()
print("한국 정치인의 X/트위터 활동:")
print("- 페이스북, 인스타그램, 블로그가 주류")
print("- X/트위터 활동은 매우 적음")
print("- Grok 5% 목표도 달성 어려움")
print()
print("결론:")
print("- Grok 비율을 더 낮추거나 (2-3%)")
print("- Grok을 선택적으로 사용하거나")
print("- X 활동이 많은 정치인만 Grok 활용")
print()
print("="*80)
