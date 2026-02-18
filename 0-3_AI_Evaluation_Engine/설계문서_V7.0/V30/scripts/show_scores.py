# -*- coding: utf-8 -*-
"""
AI별 카테고리별 평가 점수 조회
"""
import os
import sys
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력 설정
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

load_dotenv(override=True)
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

politician_id = 'f9e00370'
politician_name = '김민석'
ais = ['Claude', 'ChatGPT', 'Gemini', 'Grok']
categories = [
    ('expertise', '전문성'),
    ('leadership', '리더십'),
    ('vision', '비전'),
    ('integrity', '청렴성'),
    ('ethics', '윤리성'),
    ('accountability', '책임감'),
    ('transparency', '투명성'),
    ('communication', '소통능력'),
    ('responsiveness', '대응성'),
    ('publicinterest', '공익성')
]

RATING_TO_SCORE = {
    '+4': 8, '+3': 6, '+2': 4, '+1': 2,
    '-1': -2, '-2': -4, '-3': -6, '-4': -8
}

print('='*100)
print(f'AI별 카테고리별 평가 점수 내역 - {politician_name}')
print('='*100)
print()

# 1. AI × 카테고리 평균 점수 매트릭스
print('📊 AI × 카테고리 평균 점수 매트릭스:')
print('-'*100)
print(f'{"카테고리":<20} {"Claude":>10} {"ChatGPT":>10} {"Gemini":>10} {"Grok":>10} {"전체평균":>10}')
print('-'*100)

category_totals = {}

for cat_eng, cat_kor in categories:
    scores = {}
    cat_sum = 0
    cat_count = 0

    for ai in ais:
        result = supabase.table('evaluations_v30')\
            .select('score')\
            .eq('politician_id', politician_id)\
            .eq('evaluator_ai', ai)\
            .eq('category', cat_eng)\
            .execute()

        if result.data:
            ai_scores = [item['score'] for item in result.data]
            avg_score = sum(ai_scores) / len(ai_scores) if ai_scores else 0
            scores[ai] = avg_score
            cat_sum += sum(ai_scores)
            cat_count += len(ai_scores)
        else:
            scores[ai] = 0

    cat_avg = cat_sum / cat_count if cat_count > 0 else 0
    category_totals[cat_eng] = cat_avg

    cat_label = f"{cat_kor}({cat_eng})"
    print(f'{cat_label:<20} {scores.get("Claude", 0):>10.2f} {scores.get("ChatGPT", 0):>10.2f} {scores.get("Gemini", 0):>10.2f} {scores.get("Grok", 0):>10.2f} {cat_avg:>10.2f}')

print('-'*100)

# 2. AI별 전체 평균 점수
print()
print('📊 AI별 전체 평균 점수:')
print('-'*100)
print(f'{"AI":<20} {"평균점수":>12} {"평가개수":>10} {"최고점":>10} {"최저점":>10}')
print('-'*100)

ai_totals = {}
for ai in ais:
    result = supabase.table('evaluations_v30')\
        .select('score')\
        .eq('politician_id', politician_id)\
        .eq('evaluator_ai', ai)\
        .execute()

    if result.data:
        scores = [item['score'] for item in result.data]
        avg_score = sum(scores) / len(scores) if scores else 0
        max_score = max(scores) if scores else 0
        min_score = min(scores) if scores else 0
        ai_totals[ai] = avg_score
        print(f'{ai:<20} {avg_score:>12.2f} {len(scores):>10}개 {max_score:>10} {min_score:>10}')
    else:
        ai_totals[ai] = 0
        print(f'{ai:<20} {0:>12.2f} {0:>10}개 {0:>10} {0:>10}')

print('-'*100)

# 3. 전체 평균
all_result = supabase.table('evaluations_v30')\
    .select('score')\
    .eq('politician_id', politician_id)\
    .execute()

if all_result.data:
    all_scores = [item['score'] for item in all_result.data]
    overall_avg = sum(all_scores) / len(all_scores)
    overall_max = max(all_scores)
    overall_min = min(all_scores)
    print(f'{"전체 평균":<20} {overall_avg:>12.2f} {len(all_scores):>10}개 {overall_max:>10} {overall_min:>10}')

print('='*100)

# 4. 등급 분포
print()
print('📊 등급 분포 (모든 AI 통합):')
print('-'*100)
print(f'{"등급":<10} {"개수":>10} {"비율":>10} {"점수":>10}')
print('-'*100)

rating_result = supabase.table('evaluations_v30')\
    .select('rating')\
    .eq('politician_id', politician_id)\
    .execute()

if rating_result.data:
    ratings = [item['rating'] for item in rating_result.data]
    total = len(ratings)

    rating_counts = {}
    for rating in ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4']:
        count = ratings.count(rating)
        rating_counts[rating] = count
        pct = (count / total * 100) if total > 0 else 0
        score = RATING_TO_SCORE.get(rating, 0)
        print(f'{rating:<10} {count:>10} {pct:>9.1f}% {score:>10}')

print('-'*100)

# 5. 카테고리별 최고/최저 점수
print()
print('📊 카테고리별 최고/최저 AI:')
print('-'*100)
print(f'{"카테고리":<20} {"최고AI":>15} {"점수":>8} {"최저AI":>15} {"점수":>8}')
print('-'*100)

for cat_eng, cat_kor in categories:
    ai_scores = {}

    for ai in ais:
        result = supabase.table('evaluations_v30')\
            .select('score')\
            .eq('politician_id', politician_id)\
            .eq('evaluator_ai', ai)\
            .eq('category', cat_eng)\
            .execute()

        if result.data:
            scores = [item['score'] for item in result.data]
            avg = sum(scores) / len(scores) if scores else 0
            ai_scores[ai] = avg

    if ai_scores:
        max_ai = max(ai_scores, key=ai_scores.get)
        min_ai = min(ai_scores, key=ai_scores.get)
        cat_label = f"{cat_kor}({cat_eng})"
        print(f'{cat_label:<20} {max_ai:>15} {ai_scores[max_ai]:>8.2f} {min_ai:>15} {ai_scores[min_ai]:>8.2f}')

print('='*100)
