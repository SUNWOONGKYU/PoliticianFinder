"""
조은희 의원 데이터 추출 스크립트
V40 DB 테이블에서 모든 관련 데이터 추출
"""

import os
from supabase import create_client
from dotenv import load_dotenv
import json
from datetime import datetime

load_dotenv()

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

politician_id = 'd0a5d6e1'
politician_name = '조은희'

print(f"\n{'='*60}")
print(f"조은희 의원 데이터 추출 시작")
print(f"{'='*60}\n")

# 1. 최종 점수 데이터
print("1. 최종 점수 추출 중...")
final_scores = supabase.table('politician_final_scores_v40')\
    .select('*')\
    .eq('politician_id', politician_id)\
    .execute()
print(f"   ✅ 최종 점수: {len(final_scores.data)}개")

# 2. 카테고리별 점수
print("2. 카테고리별 점수 추출 중...")
category_scores = supabase.table('politician_category_scores_v40')\
    .select('*')\
    .eq('politician_id', politician_id)\
    .execute()
print(f"   ✅ 카테고리 점수: {len(category_scores.data)}개")

# 3. 수집된 데이터 (전체)
print("3. 수집 데이터 추출 중...")
collected_data = supabase.table('collected_data_v40')\
    .select('id, title, content, source_name, source_url, published_date, collector_ai, data_type, topic_mode, category')\
    .eq('politician_id', politician_id)\
    .order('published_date', desc=True)\
    .execute()
print(f"   ✅ 수집 데이터: {len(collected_data.data)}개")

# 4. 평가 데이터 (reasoning 포함)
print("4. 평가 데이터 추출 중...")
evaluations = supabase.table('evaluations_v40')\
    .select('*')\
    .eq('politician_id', politician_id)\
    .execute()
print(f"   ✅ 평가 데이터: {len(evaluations.data)}개")

# 5. 정치인 기본 정보
print("5. 정치인 기본 정보 추출 중...")
politician_info = supabase.table('politicians')\
    .select('*')\
    .eq('id', politician_id)\
    .execute()
print(f"   ✅ 정치인 정보: {len(politician_info.data)}개")

# 데이터 분석
print(f"\n{'='*60}")
print("데이터 분석")
print(f"{'='*60}\n")

# 출처별 분포
source_dist = {}
data_type_dist = {}
topic_mode_dist = {}
category_dist = {}

for item in collected_data.data:
    # 출처
    source = item.get('source_name', 'Unknown')
    source_dist[source] = source_dist.get(source, 0) + 1

    # 데이터 타입
    dtype = item.get('data_type', 'Unknown')
    data_type_dist[dtype] = data_type_dist.get(dtype, 0) + 1

    # 토픽 모드
    mode = item.get('topic_mode', 'Unknown')
    topic_mode_dist[mode] = topic_mode_dist.get(mode, 0) + 1

    # 카테고리
    cat = item.get('category', 'Unknown')
    category_dist[cat] = category_dist.get(cat, 0) + 1

print("출처별 분포:")
for source, count in sorted(source_dist.items(), key=lambda x: x[1], reverse=True)[:10]:
    print(f"  - {source}: {count}개")

print(f"\n데이터 타입 분포:")
for dtype, count in sorted(data_type_dist.items(), key=lambda x: x[1], reverse=True):
    print(f"  - {dtype}: {count}개")

print(f"\n토픽 모드 분포:")
for mode, count in sorted(topic_mode_dist.items(), key=lambda x: x[1], reverse=True):
    print(f"  - {mode}: {count}개")

print(f"\n카테고리 분포:")
for cat, count in sorted(category_dist.items(), key=lambda x: x[1], reverse=True):
    print(f"  - {cat}: {count}개")

# 평가 분포
rating_dist = {}
ai_dist = {}
for eval_item in evaluations.data:
    rating = eval_item.get('rating')
    ai = eval_item.get('evaluator_ai', 'Unknown')

    if rating is not None:
        rating_dist[rating] = rating_dist.get(rating, 0) + 1
    ai_dist[ai] = ai_dist.get(ai, 0) + 1

print(f"\n평가 점수 분포:")
for rating in sorted(rating_dist.keys(), reverse=True):
    count = rating_dist[rating]
    print(f"  - {rating:+d}점: {count}개")

print(f"\nAI별 평가 개수:")
for ai, count in sorted(ai_dist.items(), key=lambda x: x[1], reverse=True):
    print(f"  - {ai}: {count}개")

# 데이터 저장
output_data = {
    'politician_info': politician_info.data,
    'final_scores': final_scores.data,
    'category_scores': category_scores.data,
    'collected_data': collected_data.data,
    'evaluations': evaluations.data,
    'statistics': {
        'source_distribution': source_dist,
        'data_type_distribution': data_type_dist,
        'topic_mode_distribution': topic_mode_dist,
        'category_distribution': category_dist,
        'rating_distribution': rating_dist,
        'ai_distribution': ai_dist
    }
}

output_file = '조은희_data_v40.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(output_data, f, ensure_ascii=False, indent=2)

print(f"\n{'='*60}")
print(f"✅ 데이터 추출 완료")
print(f"{'='*60}")
print(f"\n저장 파일: {output_file}")
print(f"총 수집 데이터: {len(collected_data.data)}개")
print(f"총 평가: {len(evaluations.data)}개")
print(f"카테고리: {len(category_scores.data)}개")
print(f"\n보고서 작성 준비 완료!\n")
