#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""전체 카테고리 상세 확인"""

import os
import sys
from pathlib import Path
from supabase import create_client
from dotenv import load_dotenv
from collections import Counter

# UTF-8 출력
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

env_path = Path(__file__).parent.parent.parent.parent / '.env'
load_dotenv(env_path)

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

CATEGORIES = [
    ('integrity', '정직성'),
    ('leadership', '리더십'),
    ('communication', '소통'),
    ('expertise', '전문성'),
    ('vision', '비전'),
    ('transparency', '투명성'),
    ('accountability', '책임성'),
    ('ethics', '윤리성'),
    ('responsiveness', '대응성'),
    ('publicinterest', '공익성')
]

print("="*70)
print("V30 전체 카테고리 상세 분포")
print("="*70)

total_all = 0
for cat_name, cat_korean in CATEGORIES:
    response = supabase.table('collected_data_v30') \
        .select('collector_ai') \
        .eq('politician_id', 'd0a5d6e1') \
        .eq('category', cat_name) \
        .execute()

    total = len(response.data)
    total_all += total

    # AI 분포
    ai_dist = Counter([item['collector_ai'] for item in response.data])
    gemini = ai_dist.get('Gemini', 0)
    grok = ai_dist.get('Grok', 0)

    status = "✅" if total == 100 else ("⚠️" if total < 100 else "❌")

    print(f"{status} {cat_korean:10} ({cat_name:15}): {total:3}개 = Gemini {gemini:2} + Grok {grok:2}")

print("="*70)
print(f"총계: {total_all}개 / 목표: 1,000개")
print(f"부족: {1000 - total_all}개")
