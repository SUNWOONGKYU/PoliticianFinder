# -*- coding: utf-8 -*-
"""
Claude 재평가 결과 DB 저장
"""
import os
import sys
import io
import json
from dotenv import load_dotenv
from supabase import create_client, Client

# UTF-8 출력 설정
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv()

# Supabase 연결
url = os.getenv('SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_KEY')
if not url or not key:
    raise ValueError('Supabase 환경 변수가 설정되지 않았습니다')

supabase: Client = create_client(url, key)

print('=== Claude 재평가 결과 DB 저장 ===\n')

# 배치 결과 파일 목록
batch_files = [
    'claude_reeval_batch_01_result.json',
    'claude_reeval_batch_02_result.json',
    'claude_reeval_batch_03_result.json',
    'claude_reeval_batch_04_result.json',
    'claude_reeval_batch_05_result.json',
    'claude_reeval_batch_06_result.json',
    'claude_reeval_batch_07_result.json'
]

# 모든 평가 결과 수집
all_evaluations = []
for batch_file in batch_files:
    if not os.path.exists(batch_file):
        print(f'⚠️ 파일 없음: {batch_file}')
        continue

    with open(batch_file, 'r', encoding='utf-8') as f:
        batch_results = json.load(f)
        all_evaluations.extend(batch_results)
        print(f'✅ {batch_file}: {len(batch_results)}개 평가 로드')

print(f'\n✅ 총 {len(all_evaluations)}개 평가 로드 완료\n')

# 기존 Claude 평가 삭제
print('1️⃣ 기존 Claude 평가 삭제 중...\n')

delete_result = supabase.table('ai_evaluations_v28').delete().eq(
    'politician_id', 'f9e00370'
).eq('category', 'integrity').eq('ai_model', 'claude').execute()

print(f'✅ 기존 평가 {len(delete_result.data)}개 삭제 완료\n')

# 새로운 평가 저장
print('2️⃣ 새로운 평가 저장 중...\n')

saved = 0
errors = 0

for eval_item in all_evaluations:
    try:
        # rating 변환
        rating_str = eval_item['rating']
        rating_int = int(rating_str) if rating_str else 0

        # ai_evaluations_v28 테이블에 저장
        insert_data = {
            'collected_data_id': eval_item['id'],
            'politician_id': 'f9e00370',
            'category': 'integrity',
            'ai_model': 'claude',
            'rating': rating_int,
            'reasoning': eval_item['reasoning']
        }

        result = supabase.table('ai_evaluations_v28').insert(insert_data).execute()

        if result.data:
            saved += 1
            print(f'   ✅ {eval_item["id"][:8]}... rating={rating_int}')
        else:
            errors += 1
            print(f'   ❌ {eval_item["id"][:8]}... 저장 실패')

    except Exception as e:
        errors += 1
        print(f'   ❌ {eval_item["id"][:8]}... 오류: {str(e)}')

print(f'\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
print(f'✅ 저장 완료\n')
print(f'총 평가: {len(all_evaluations)}개')
print(f'성공: {saved}개')
print(f'실패: {errors}개')
print(f'성공률: {saved/len(all_evaluations)*100:.1f}%')
print(f'━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

# 점수 재계산
print('3️⃣ 청렴성 점수 재계산 중...\n')

result = supabase.table('ai_evaluations_v28').select('*').eq(
    'politician_id', 'f9e00370'
).eq('category', 'integrity').execute()

evaluations = result.data
print(f'✅ 총 평가: {len(evaluations)}개\n')

# AI별 점수 계산
from collections import defaultdict

ai_scores = defaultdict(lambda: {'ratings': [], 'score': 0})

for eval in evaluations:
    ai_model = eval['ai_model']
    rating = eval['rating']
    ai_scores[ai_model]['ratings'].append(rating)

# 점수 계산
for ai_model, data in ai_scores.items():
    ratings = data['ratings']

    # V30 점수 계산 로직
    # rating: -4 ~ +4 → score: 0 ~ 100
    # score = 50 + (average_rating * 12.5)
    avg_rating = sum(ratings) / len(ratings) if ratings else 0
    score = 50 + (avg_rating * 12.5)

    ai_scores[ai_model]['score'] = round(score, 1)
    ai_scores[ai_model]['count'] = len(ratings)
    ai_scores[ai_model]['avg_rating'] = round(avg_rating, 2)

# AI별 점수 출력
print('=== AI별 청렴성 점수 (재평가 후) ===\n')
for ai_model in sorted(ai_scores.keys()):
    data = ai_scores[ai_model]
    print(f'{ai_model}:')
    print(f'  - 평가 개수: {data["count"]}개')
    print(f'  - 평균 rating: {data["avg_rating"]}')
    print(f'  - 최종 점수: {data["score"]}점\n')

# AI 평균 점수
all_scores = [data['score'] for data in ai_scores.values()]
avg_score = sum(all_scores) / len(all_scores) if all_scores else 0
print(f'AI 평균 점수: {avg_score:.1f}점\n')

print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
print('✅ Claude 재평가 완료!')
print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
