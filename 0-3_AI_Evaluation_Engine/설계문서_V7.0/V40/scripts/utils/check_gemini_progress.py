#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gemini 평가 진행 상황 확인"""

import os
import sys
from supabase import create_client
from dotenv import load_dotenv

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv(override=True)

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

POLITICIAN_ID = 'd0a5d6e1'
POLITICIAN_NAME = '조은희'

CATEGORIES = [
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

print("="*80)
print(f"조은희 Gemini 평가 현황")
print("="*80)
print()

incomplete = []

for cat_eng, cat_kor in CATEGORIES:
    # 수집 데이터
    collected = supabase.table('collected_data_v40').select('id', count='exact').eq(
        'politician_id', POLITICIAN_ID
    ).eq('category', cat_eng).execute()

    collected_count = collected.count or 0

    # Gemini 평가
    evaluated = supabase.table('evaluations_v40').select('id', count='exact').eq(
        'politician_id', POLITICIAN_ID
    ).eq('category', cat_eng).eq('evaluator_ai', 'Gemini').execute()

    evaluated_count = evaluated.count or 0

    completion = (evaluated_count / collected_count * 100) if collected_count > 0 else 0
    remaining = collected_count - evaluated_count

    status = "✅" if completion >= 100 else "⚠️" if completion >= 90 else "❌"

    print(f"{status} {cat_kor:8s}: {evaluated_count:3d}/{collected_count:3d} ({completion:5.1f}%) | 남음: {remaining:3d}개")

    if completion < 100:
        incomplete.append((cat_eng, cat_kor, remaining))

print()
print("="*80)
print(f"미완료 카테고리: {len(incomplete)}개")
print("="*80)
print()

if incomplete:
    for cat_eng, cat_kor, remaining in incomplete:
        print(f"  {cat_kor}: {remaining}개 남음 → python evaluate_gemini_subprocess.py --politician {POLITICIAN_NAME} --category {cat_eng}")
