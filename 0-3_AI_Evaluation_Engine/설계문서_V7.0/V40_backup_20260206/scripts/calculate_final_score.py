# -*- coding: utf-8 -*-
"""
V40 최종 점수 계산 (V40 방식 사용)
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

# V28 점수 계산 공식
PRIOR = 6.0
COEFFICIENT = 0.5

print('='*100)
print(f'V40 최종 점수 계산 - {politician_name}')
print('='*100)
print()
print('📐 V40 점수 계산 공식:')
print(f'   PRIOR = {PRIOR}')
print(f'   COEFFICIENT = {COEFFICIENT}')
print(f'   카테고리 점수 = (PRIOR + 평균rating × COEFFICIENT) × 10  (범위: 20~100점)')
print(f'   최종 점수 = SUM(10개 카테고리 점수)  (범위: 200~1000점)')
print('='*100)
print()

# AI별 점수 계산
for ai in ais:
    print(f'🤖 {ai}')
    print('-'*100)
    print(f'{"카테고리":<20} {"평균rating":>12} {"카테고리점수":>15} {"계산식":>40}')
    print('-'*100)

    category_scores = []

    for cat_eng, cat_kor in categories:
        # 평가 데이터 조회
        result = supabase.table('evaluations_v40')\
            .select('score, rating')\
            .eq('politician_id', politician_id)\
            .eq('evaluator_ai', ai)\
            .eq('category', cat_eng)\
            .execute()

        if result.data:
            # X 판정은 모수에서 제외
            valid_items = [item for item in result.data if str(item.get('rating', '')).upper() != 'X']
            scores = [item['score'] for item in valid_items]
            avg_score = sum(scores) / len(scores) if scores else 0

            # rating 계산 (score를 rating으로 역변환)
            # score = rating × 2 이므로 rating = score / 2
            avg_rating = avg_score / 2

            # V40 공식: (PRIOR + avg_rating × COEFFICIENT) × 10
            category_score = (PRIOR + avg_rating * COEFFICIENT) * 10

            # 범위 제한: 20~100
            category_score = max(20, min(100, category_score))

            category_scores.append(category_score)

            cat_label = f"{cat_kor}({cat_eng})"
            formula = f"({PRIOR} + {avg_rating:.2f}×{COEFFICIENT})×10"
            print(f'{cat_label:<20} {avg_rating:>12.2f} {category_score:>15.1f}점 {formula:>40}')
        else:
            category_scores.append(60)  # 기본값
            cat_label = f"{cat_kor}({cat_eng})"
            print(f'{cat_label:<20} {0:>12.2f} {60:>15.1f}점 {"(기본값)":>40}')

    # 최종 점수
    final_score = sum(category_scores)
    final_score = min(1000, round(final_score))  # 1000점 상한

    print('-'*100)
    print(f'{"최종 점수":<20} {"":<12} {final_score:>15}점 {"SUM(카테고리점수)":>40}')
    print('='*100)
    print()

# 4개 AI 평균 최종 점수
print('📊 4개 AI 통합 최종 점수:')
print('-'*100)

all_final_scores = []

for ai in ais:
    category_scores = []

    for cat_eng, cat_kor in categories:
        result = supabase.table('evaluations_v40')\
            .select('score, rating')\
            .eq('politician_id', politician_id)\
            .eq('evaluator_ai', ai)\
            .eq('category', cat_eng)\
            .execute()

        if result.data:
            # X 판정은 모수에서 제외
            valid_items = [item for item in result.data if str(item.get('rating', '')).upper() != 'X']
            scores = [item['score'] for item in valid_items]
            avg_score = sum(scores) / len(scores) if scores else 0
            avg_rating = avg_score / 2
            category_score = (PRIOR + avg_rating * COEFFICIENT) * 10
            category_score = max(20, min(100, category_score))
            category_scores.append(category_score)
        else:
            category_scores.append(60)

    final_score = min(1000, round(sum(category_scores)))
    all_final_scores.append(final_score)
    print(f'{ai:<20} {final_score:>10}점')

print('-'*100)
avg_final_score = round(sum(all_final_scores) / len(all_final_scores))
print(f'{"4개 AI 평균":<20} {avg_final_score:>10}점')
print('='*100)
print()

# V40 10단계 등급 계산
if avg_final_score >= 920:
    grade = 'M (Mugunghwa)'
elif avg_final_score >= 840:
    grade = 'D (Diamond)'
elif avg_final_score >= 760:
    grade = 'E (Emerald)'
elif avg_final_score >= 680:
    grade = 'P (Platinum)'
elif avg_final_score >= 600:
    grade = 'G (Gold)'
elif avg_final_score >= 520:
    grade = 'S (Silver)'
elif avg_final_score >= 440:
    grade = 'B (Bronze)'
elif avg_final_score >= 360:
    grade = 'I (Iron)'
elif avg_final_score >= 280:
    grade = 'Tn (Tin)'
else:
    grade = 'L (Lead)'

print(f'🏆 최종 등급: {grade} ({avg_final_score}점)')
print()
print('등급 기준:')
print('  M (Mugunghwa): 920~1000점 (최우수)')
print('  D (Diamond):   840~919점 (우수)')
print('  E (Emerald):   760~839점 (양호)')
print('  P (Platinum):  680~759점 (보통+)')
print('  G (Gold):      600~679점 (보통)')
print('  S (Silver):    520~599점 (보통-)')
print('  B (Bronze):    440~519점 (미흡)')
print('  I (Iron):      360~439점 (부족)')
print('  Tn (Tin):      280~359점 (상당히 부족)')
print('  L (Lead):      200~279점 (매우 부족)')
print('='*100)
