#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Category 9 평가 결과 검증 스크립트
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# UTF-8 출력 설정
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

load_dotenv()

# Supabase 연결
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

print("=" * 80)
print("오세훈 (ID: 272) - Category 9 (대응성) 평가 결과 검증")
print("=" * 80)

# 전체 데이터 조회
result = supabase.table('collected_data').select(
    'item_num, rating, data_title, data_source, collection_date'
).eq('politician_id', 272).eq('category_num', 9).execute()

print(f"\n총 저장된 데이터: {len(result.data)}건\n")

# 항목별 통계
item_stats = {}
for record in result.data:
    item_num = record['item_num']
    if item_num not in item_stats:
        item_stats[item_num] = {
            'count': 0,
            'ratings': [],
            'sources': set()
        }
    item_stats[item_num]['count'] += 1
    item_stats[item_num]['ratings'].append(record['rating'])
    item_stats[item_num]['sources'].add(record['data_source'])

# 항목 이름
item_names = {
    1: "주민참여예산 규모",
    2: "정보공개 처리 평균 기간",
    3: "주민 제안 반영 건수/비율",
    4: "지역 현안 대응 건수",
    5: "위기 대응 언론 보도 건수",
    6: "현장 방문 언론 보도 건수",
    7: "대응성 여론조사 점수"
}

print("항목별 상세 통계:")
print("-" * 80)

total_rating = 0
total_count = 0

for item_num in sorted(item_stats.keys()):
    stats = item_stats[item_num]
    avg_rating = sum(stats['ratings']) / len(stats['ratings'])
    min_rating = min(stats['ratings'])
    max_rating = max(stats['ratings'])

    print(f"\n9-{item_num}. {item_names.get(item_num, '알 수 없음')}")
    print(f"  데이터 수: {stats['count']}건")
    print(f"  평균 Rating: {avg_rating:+.2f}")
    print(f"  Rating 범위: {min_rating:+2d} ~ {max_rating:+2d}")
    print(f"  출처 수: {len(stats['sources'])}개")
    print(f"  출처: {', '.join(list(stats['sources'])[:3])}...")

    total_rating += sum(stats['ratings'])
    total_count += stats['count']

print("\n" + "=" * 80)
print(f"전체 평균 Rating: {total_rating / total_count:+.2f}")
print(f"예상 Item Score (Prior 7.0 + 평균 × 0.6): {7.0 + (total_rating / total_count * 0.6):.2f}")
print("=" * 80)

# 출처별 통계
print("\n출처별 데이터 분포:")
print("-" * 80)

source_counts = {}
for record in result.data:
    source = record['data_source']
    if source not in source_counts:
        source_counts[source] = 0
    source_counts[source] += 1

for source, count in sorted(source_counts.items(), key=lambda x: x[1], reverse=True):
    print(f"  {source}: {count}건")

print("\n검증 완료!")
