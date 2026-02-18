# -*- coding: utf-8 -*-
"""
V40 점수 계산 공식 상세 설명
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

print('='*100)
print('V40 점수 계산 공식 상세 설명')
print('='*100)
print()

print('📐 V40 공식:')
print()
print('  PRIOR = 6.0            (기본 베이스 점수)')
print('  COEFFICIENT = 0.5       (가중치 계수)')
print()
print('  [단계 1] 카테고리 점수 계산:')
print('    카테고리 점수 = (PRIOR + 평균rating × COEFFICIENT) × 10')
print('    = (6.0 + 평균rating × 0.5) × 10')
print()
print('  [단계 2] 최종 점수 계산:')
print('    최종 점수 = 카테고리1 점수 + 카테고리2 점수 + ... + 카테고리10 점수')
print()
print('='*100)
print()

# Claude 예시로 상세 계산
print('🤖 Claude 점수 계산 과정 (상세):')
print('='*100)
print()

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

PRIOR = 6.0
COEFFICIENT = 0.5

print('[1단계] 카테고리별 평균 rating 계산:')
print('-'*100)

category_scores = []
total_rating_sum = 0
total_rating_count = 0

for cat_eng, cat_kor in categories:
    # 평가 데이터 조회
    result = supabase.table('evaluations_v40')\
        .select('score')\
        .eq('politician_id', politician_id)\
        .eq('evaluator_ai', 'Claude')\
        .eq('category', cat_eng)\
        .execute()

    if result.data:
        scores = [item['score'] for item in result.data]
        avg_score = sum(scores) / len(scores)

        # rating = score / 2
        avg_rating = avg_score / 2

        total_rating_sum += sum(scores) / 2
        total_rating_count += 1

        print(f'{cat_kor:10} ({cat_eng:15}): ')
        print(f'  - 100개 평가의 평균 score = {avg_score:6.2f}')
        print(f'  - 평균 rating = score ÷ 2 = {avg_score:6.2f} ÷ 2 = {avg_rating:6.2f}')
        print()

        category_scores.append((cat_kor, cat_eng, avg_rating))

print('='*100)
print()

print('[2단계] 카테고리별 점수 계산 (공식 적용):')
print('-'*100)
print(f'{"카테고리":<15} {"평균rating":>12} {"계산식":>45} {"카테고리점수":>15}')
print('-'*100)

final_score_sum = 0

for cat_kor, cat_eng, avg_rating in category_scores:
    # V40 공식: (PRIOR + avg_rating × COEFFICIENT) × 10
    category_score = (PRIOR + avg_rating * COEFFICIENT) * 10

    # 범위 제한: 20~100
    category_score = max(20, min(100, category_score))

    final_score_sum += category_score

    formula = f'(6.0 + {avg_rating:5.2f} × 0.5) × 10'
    step1 = PRIOR + avg_rating * COEFFICIENT
    formula_detail = f'{formula} = {step1:5.2f} × 10'

    print(f'{cat_kor:<15} {avg_rating:>12.2f} {formula_detail:>45} {category_score:>15.1f}점')

print('-'*100)
final_score = min(1000, round(final_score_sum))
print(f'{"합계 (최종점수)":60} {final_score:>15}점')
print('='*100)
print()

# 전체 평균 rating 계산
overall_avg_rating = total_rating_sum / total_rating_count if total_rating_count > 0 else 0

print('📊 요약:')
print('-'*100)
print(f'Claude 전체 평균 rating (10개 카테고리 평균): {overall_avg_rating:.2f}')
print(f'Claude 최종 점수 (10개 카테고리 합산): {final_score}점')
print()
print('💡 핵심 포인트:')
print('  1. "전체 평균 rating 1.55"는 참고용 통계입니다.')
print('  2. 최종 점수는 전체 평균이 아니라 **카테고리별 점수를 합산**한 값입니다.')
print('  3. 각 카테고리는 독립적으로 계산되어 합산됩니다.')
print()
print('  공식: (6.0 + rating × 0.5) × 10 을 10개 카테고리에 적용 후 합산')
print('  = 카테고리1 점수 + 카테고리2 점수 + ... + 카테고리10 점수')
print('  = 64.5 + 65.2 + 65.3 + 59.9 + 61.4 + 63.2 + 62.5 + 65.8 + 65.3 + 65.5')
print(f'  = {final_score}점')
print('='*100)
print()

# 만약 전체 평균으로 계산한다면?
print('⚠️ 만약 전체 평균 rating (1.55)으로 계산한다면? (잘못된 방법)')
print('-'*100)
wrong_score = (PRIOR + overall_avg_rating * COEFFICIENT) * 10 * 10
print(f'(6.0 + {overall_avg_rating:.2f} × 0.5) × 10 × 10개 카테고리')
print(f'= {PRIOR + overall_avg_rating * COEFFICIENT:.2f} × 100')
print(f'= {wrong_score:.0f}점 ← 이건 잘못된 계산!')
print()
print('✅ 올바른 방법: 카테고리별로 따로 계산 후 합산 = {0}점'.format(final_score))
print('='*100)
