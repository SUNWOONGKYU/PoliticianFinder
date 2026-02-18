#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gemini 분포 확인"""

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

categories = [
    ('leadership', '리더십'),
    ('responsiveness', '대응성'),
    ('publicinterest', '공익성')
]

for cat_name, cat_korean in categories:
    response = supabase.table('collected_data_v40') \
        .select('collector_ai, data_type, sentiment') \
        .eq('politician_id', 'd0a5d6e1') \
        .eq('category', cat_name) \
        .eq('collector_ai', 'Gemini') \
        .execute()

    total = len(response.data)
    print(f'\n{cat_korean} ({cat_name}): Gemini 총 {total}개')

    # Count by data_type and sentiment
    dist = Counter()
    for item in response.data:
        key = f"{item['data_type']}_{item['sentiment']}"
        dist[key] += 1

    print("  분포:")
    for key in ['official_negative', 'official_positive', 'official_free',
                'public_negative', 'public_positive', 'public_free']:
        count = dist.get(key, 0)
        print(f"    {key}: {count}개")
