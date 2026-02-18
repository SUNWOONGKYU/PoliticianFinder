#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""현재 데이터 상태 확인 스크립트"""

import sys
import io

# UTF-8 출력 설정 (최우선)
if sys.platform == 'win32':
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')
    except AttributeError:
        pass

import os
from pathlib import Path
from supabase import create_client
from dotenv import load_dotenv

# 환경 변수 로드
SCRIPT_DIR = Path(__file__).resolve().parent
env_path = SCRIPT_DIR.parent.parent.parent.parent.parent / '.env'
if env_path.exists():
    load_dotenv(env_path, override=True)
else:
    load_dotenv(override=True)

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

politician_id = '8c5dcc89'
politician_name = '박주민'

# 카테고리 목록
categories = [
    'expertise', 'leadership', 'vision', 'integrity', 'ethics',
    'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'
]

print(f'\n현재 데이터 현황 - {politician_name}')
print('='*60)

total_items = 0
category_counts = {}

for category in categories:
    result = supabase.table('collected_data_v40')\
        .select('id', count='exact')\
        .eq('politician_id', politician_id)\
        .eq('category', category)\
        .execute()

    count = result.count
    category_counts[category] = count
    total_items += count

    target = 120
    gap = target - count
    status = 'CRITICAL' if gap > 0 else 'OK'

    print(f'{category:20s}: {count:3d}/120 ({gap:+3d}) [{status}]')

print('='*60)
print(f'전체: {total_items:4d}/1,200 ({1200 - total_items:+4d})')
print()

# 재수집 필요 카테고리 분석
print('재수집 필요 카테고리:')
print('-'*60)
total_needed = 0
critical_categories = []

for category in categories:
    gap = 120 - category_counts[category]
    if gap > 0:
        critical_categories.append((category, gap))
        total_needed += gap
        print(f'{category:20s}: +{gap:3d}개 필요')

print('-'*60)
print(f'총 재수집 필요: {total_needed}개')
print(f'CRITICAL 카테고리: {len(critical_categories)}개')
print()
