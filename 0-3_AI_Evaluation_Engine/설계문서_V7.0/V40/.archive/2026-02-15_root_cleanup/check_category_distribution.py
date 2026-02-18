#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V40 카테고리별 데이터 분포 확인"""

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
AI_EVAL_DIR = V40_DIR.parent.parent
ENV_PATH = AI_EVAL_DIR / '.env'

# .env 로드
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)

from supabase import create_client

# Supabase 설정
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Supabase credentials not found")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("\n" + "="*80)
print("V40 카테고리별 데이터 분포")
print("="*80 + "\n")

# 카테고리별 데이터 개수
result = supabase.table('collected_data_v40').select('category, data_type, collector_ai').execute()

if not result.data:
    print("✅ V40 데이터가 없습니다.")
    sys.exit(0)

# 카테고리별 통계
categories = {}
for item in result.data:
    cat = item.get('category', 'unknown')
    dtype = item.get('data_type', 'unknown')
    collector = item.get('collector_ai', 'unknown')

    if cat not in categories:
        categories[cat] = {
            'total': 0,
            'official': 0,
            'public': 0,
            'Gemini': 0,
            'Naver': 0
        }

    categories[cat]['total'] += 1

    if dtype == 'official':
        categories[cat]['official'] += 1
    elif dtype == 'public':
        categories[cat]['public'] += 1

    if collector == 'Gemini':
        categories[cat]['Gemini'] += 1
    elif collector == 'Naver':
        categories[cat]['Naver'] += 1

# 카테고리 정렬
cat_order = [
    'expertise', 'leadership', 'vision', 'integrity', 'ethics',
    'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'
]

cat_kr = {
    'expertise': '전문성', 'leadership': '리더십', 'vision': '비전',
    'integrity': '청렴성', 'ethics': '윤리성', 'accountability': '책임감',
    'transparency': '투명성', 'communication': '소통능력',
    'responsiveness': '대응성', 'publicinterest': '공익성'
}

print("📊 카테고리별 데이터 개수:\n")
print(f"{'카테고리':<15} {'총계':<8} {'OFFICIAL':<10} {'PUBLIC':<10} {'Gemini':<10} {'Naver':<10}")
print("-" * 80)

total_sum = 0
official_sum = 0
public_sum = 0
gemini_sum = 0
naver_sum = 0

for cat in cat_order:
    if cat in categories:
        stats = categories[cat]
        kr_name = cat_kr.get(cat, cat)
        print(f"{kr_name:<15} {stats['total']:<8} {stats['official']:<10} {stats['public']:<10} {stats['Gemini']:<10} {stats['Naver']:<10}")

        total_sum += stats['total']
        official_sum += stats['official']
        public_sum += stats['public']
        gemini_sum += stats['Gemini']
        naver_sum += stats['Naver']

print("-" * 80)
print(f"{'합계':<15} {total_sum:<8} {official_sum:<10} {public_sum:<10} {gemini_sum:<10} {naver_sum:<10}")

print("\n" + "="*80)
print("📋 문서 규칙과 비교:")
print("="*80 + "\n")

print("규칙:")
print("  - OFFICIAL: 40개/카테고리 (버퍼 48개)")
print("    * Gemini: 30개 (버퍼 36개)")
print("    * Naver: 10개 (버퍼 12개)")
print("  - PUBLIC: 60개/카테고리 (버퍼 72개)")
print("    * Gemini: 20개 (버퍼 24개)")
print("    * Naver: 40개 (버퍼 48개)")
print("  - 합계: 100개/카테고리 (버퍼 120개)")
print("  - 10개 카테고리: 1,000개 (버퍼 1,200개)\n")

print("실제:")
print(f"  - OFFICIAL: {official_sum}개 (평균 {official_sum/10:.1f}개/카테고리)")
print(f"  - PUBLIC: {public_sum}개 (평균 {public_sum/10:.1f}개/카테고리)")
print(f"  - Gemini: {gemini_sum}개 (평균 {gemini_sum/10:.1f}개/카테고리)")
print(f"  - Naver: {naver_sum}개 (평균 {naver_sum/10:.1f}개/카테고리)")
print(f"  - 합계: {total_sum}개 (평균 {total_sum/10:.1f}개/카테고리)\n")

# 기간 확인 (OFFICIAL vs PUBLIC)
print("="*80)
print("📅 기간 제한 확인:")
print("="*80 + "\n")

# OFFICIAL 4년 제한 확인
four_years_ago = datetime.now() - timedelta(days=365*4)
result = supabase.table('collected_data_v40').select('id, category, published_date').eq('data_type', 'official').execute()

official_violations = []
if result.data:
    for item in result.data:
        date_str = item.get('published_date')
        if date_str:
            try:
                item_date = datetime.strptime(date_str, "%Y-%m-%d")
                if item_date < four_years_ago:
                    official_violations.append({
                        'category': item.get('category'),
                        'date': date_str,
                        'years_ago': (datetime.now() - item_date).days / 365
                    })
            except:
                pass

print(f"OFFICIAL 기간 위반 (4년 이상): {len(official_violations)}개")
if official_violations:
    print("  위반 예시:")
    for v in official_violations[:5]:
        print(f"    - {v['category']}: {v['date']} ({v['years_ago']:.1f}년 전)")

# PUBLIC 2년 제한 확인
two_years_ago = datetime.now() - timedelta(days=365*2)
result = supabase.table('collected_data_v40').select('id, category, published_date').eq('data_type', 'public').execute()

public_violations = []
if result.data:
    for item in result.data:
        date_str = item.get('published_date')
        if date_str:
            try:
                item_date = datetime.strptime(date_str, "%Y-%m-%d")
                if item_date < two_years_ago:
                    public_violations.append({
                        'category': item.get('category'),
                        'date': date_str,
                        'years_ago': (datetime.now() - item_date).days / 365
                    })
            except:
                pass

print(f"\nPUBLIC 기간 위반 (2년 이상): {len(public_violations)}개")
if public_violations:
    print("  위반 예시:")
    for v in public_violations[:5]:
        print(f"    - {v['category']}: {v['date']} ({v['years_ago']:.1f}년 전)")

print("\n" + "="*80)
print("🔍 결론:")
print("="*80 + "\n")

if len(official_violations) > 0 or len(public_violations) > 0:
    print("❌ 기간 제한 위반 데이터 존재!")
    print(f"   - OFFICIAL 위반: {len(official_violations)}개")
    print(f"   - PUBLIC 위반: {len(public_violations)}개")
    print("   → 스크립트에 기간 필터링 로직 누락")
    print("   → 수정 및 재수집 필요\n")
else:
    print("✅ 모든 데이터가 기간 제한 준수\n")
