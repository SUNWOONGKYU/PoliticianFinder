#!/usr/bin/env python3
"""
조은희 수집 데이터 분석 스크립트
V30 90-10 배분 (Gemini-Grok) 검증용
"""

import sys
from supabase import create_client
from collections import Counter
import json

# UTF-8 출력 설정
sys.stdout.reconfigure(encoding='utf-8')

# Supabase 연결
SUPABASE_URL = "https://mmtracsyydrblqvtmnri.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tdHJhY3N5eWRyYmxxdnRtbnJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEwNDkyMjAsImV4cCI6MjA0NjYyNTIyMH0.A6ty3zW6gaCEMhFZ2JaQfLRjEJlO8N_lfv82BJ0FdMs"
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def analyze_joeunhee():
    """조은희 데이터 전체 분석"""

    print("=" * 80)
    print("조은희 (d0a5d6e1) V30 수집 데이터 분석")
    print("=" * 80)
    print()

    # 전체 데이터 가져오기
    result = supabase.table('collected_data_v30')\
        .select('*')\
        .eq('politician_id', 'd0a5d6e1')\
        .execute()

    data = result.data
    total_count = len(data)

    print(f"📊 총 수집 데이터: {total_count}개")
    print()

    if total_count == 0:
        print("⚠️ 수집된 데이터가 없습니다.")
        return

    # 1. AI별 분포 (collector_ai 사용)
    print("=" * 80)
    print("1️⃣ AI별 수집 분포 (90-10 검증)")
    print("=" * 80)
    ai_counts = Counter([d['collector_ai'] for d in data])
    for ai, count in sorted(ai_counts.items(), key=lambda x: -x[1]):
        percentage = (count / total_count) * 100
        print(f"  {ai:12s}: {count:3d}개 ({percentage:5.1f}%)")
    print()

    # 2. 카테고리별 분포
    print("=" * 80)
    print("2️⃣ 카테고리별 분포")
    print("=" * 80)
    category_counts = Counter([d['category'] for d in data])
    for cat, count in sorted(category_counts.items(), key=lambda x: x[0]):
        print(f"  {cat}: {count}개")
    print()

    # 3. 데이터 타입 분포 (official vs public)
    print("=" * 80)
    print("3️⃣ 데이터 타입 분포")
    print("=" * 80)
    datatype_counts = Counter([d['data_type'] for d in data])
    for dt, count in sorted(datatype_counts.items()):
        percentage = (count / total_count) * 100
        print(f"  {dt:8s}: {count:3d}개 ({percentage:5.1f}%)")
    print()

    # 4. 감정 분포 (sentiment)
    print("=" * 80)
    print("4️⃣ 감정 분포 (부정-긍정-자유)")
    print("=" * 80)
    sentiment_counts = Counter([d['sentiment'] for d in data])
    for sent, count in sorted(sentiment_counts.items()):
        percentage = (count / total_count) * 100
        print(f"  {sent:8s}: {count:3d}개 ({percentage:5.1f}%)")
    print()

    # 5. 검증 상태
    print("=" * 80)
    print("5️⃣ 검증 상태")
    print("=" * 80)
    verified_counts = Counter([d['is_verified'] for d in data])
    for verified, count in sorted(verified_counts.items(), key=lambda x: -x[1]):
        status = "✅ 검증됨" if verified else "⏳ 미검증"
        percentage = (count / total_count) * 100
        print(f"  {status}: {count:3d}개 ({percentage:5.1f}%)")
    print()

    # 6. 카테고리별 AI 분포 (90-10 카테고리별 검증)
    print("=" * 80)
    print("6️⃣ 카테고리별 AI 분포 (각 카테고리 90-10 검증)")
    print("=" * 80)
    categories = sorted(set([d['category'] for d in data]))
    for cat in categories:
        cat_data = [d for d in data if d['category'] == cat]
        cat_total = len(cat_data)
        cat_ai_counts = Counter([d['collector_ai'] for d in cat_data])

        print(f"  📁 {cat} ({cat_total}개)")
        for ai, count in sorted(cat_ai_counts.items(), key=lambda x: -x[1]):
            percentage = (count / cat_total) * 100
            print(f"    - {ai}: {count}개 ({percentage:.1f}%)")
    print()

    # 7. Grok 수집 항목 (X/트위터 전담 검증)
    print("=" * 80)
    print("7️⃣ Grok 수집 항목 (X/트위터 전담 검증)")
    print("=" * 80)
    grok_data = [d for d in data if d['collector_ai'] == 'Grok']
    if grok_data:
        print(f"  총 {len(grok_data)}개 수집")
        # 소스 분석
        grok_sources = Counter([d['source_name'] for d in grok_data])
        print(f"  출처:")
        for source, count in sorted(grok_sources.items(), key=lambda x: -x[1]):
            print(f"    - {source}: {count}개")

        # 샘플 3개 출력
        print(f"\n  📋 샘플 3개:")
        for i, d in enumerate(grok_data[:3], 1):
            print(f"    {i}. [{d['category']}] {d['title'][:50]}...")
            print(f"       출처: {d['source_name']}")
            print(f"       URL: {d['source_url'][:80]}...")
    else:
        print("  ⚠️ Grok 수집 데이터 없음")
    print()

    # 8. Gemini 수집 항목
    print("=" * 80)
    print("8️⃣ Gemini 수집 항목 (뉴스 포함)")
    print("=" * 80)
    gemini_data = [d for d in data if d['collector_ai'] == 'Gemini']
    if gemini_data:
        print(f"  총 {len(gemini_data)}개 수집")
        # 소스 분석
        gemini_sources = Counter([d['source_name'] for d in gemini_data])
        print(f"  출처 분포:")
        for source, count in sorted(gemini_sources.items(), key=lambda x: -x[1]):
            print(f"    - {source}: {count}개")

        # 샘플 3개 출력
        print(f"\n  📋 샘플 3개:")
        for i, d in enumerate(gemini_data[:3], 1):
            print(f"    {i}. [{d['category']}] {d['title'][:50]}...")
            print(f"       출처: {d['source_name']}")
            print(f"       URL: {d['source_url'][:80]}...")
    else:
        print("  ⚠️ Gemini 수집 데이터 없음")
    print()

    print("=" * 80)
    print("✅ 분석 완료")
    print("=" * 80)

if __name__ == "__main__":
    analyze_joeunhee()
