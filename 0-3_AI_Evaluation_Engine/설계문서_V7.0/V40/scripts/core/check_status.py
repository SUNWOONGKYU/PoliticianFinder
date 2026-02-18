#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""평가 상태 확인 스크립트"""
import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# UTF-8 출력 설정
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# .env 로드
load_dotenv()

# Supabase 클라이언트
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

# 박주민 politician_id
politician_id = '8c5dcc89'

# 전체 수집 데이터 (count='exact' 사용)
collected_result = supabase.table('collected_data_v40').select('id', count='exact').eq('politician_id', politician_id).execute()
total_collected = collected_result.count

# ChatGPT 평가 데이터 - 모든 데이터 가져오기 (페이지네이션)
all_evaluations = []
page_size = 1000
offset = 0
while True:
    page = supabase.table('evaluations_v40').select('collected_data_id').eq('politician_id', politician_id).eq('evaluator_ai', 'ChatGPT').range(offset, offset + page_size - 1).execute()
    if not page.data:
        break
    all_evaluations.extend(page.data)
    if len(page.data) < page_size:
        break
    offset += page_size

chatgpt_count = len(all_evaluations)

# 고유 collected_data_id 수
unique_ids = set(row['collected_data_id'] for row in all_evaluations if row.get('collected_data_id'))
unique_count = len(unique_ids)

print('=' * 80)
print('박주민 - ChatGPT 평가 현황')
print('=' * 80)
print(f'전체 수집 데이터: {total_collected}개')
print(f'ChatGPT 평가 (레코드): {chatgpt_count}개')
print(f'ChatGPT 평가 (고유 ID): {unique_count}개')
print(f'평가율: {unique_count}/{total_collected} = {unique_count/total_collected*100:.1f}%')
print()

# 카테고리별 상세
print('카테고리별 평가 현황:')
print('-' * 80)
categories = ['expertise', 'leadership', 'vision', 'integrity', 'ethics',
              'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest']

for cat in categories:
    # 카테고리별 수집 데이터 (count='exact')
    cat_collected = supabase.table('collected_data_v40').select('id', count='exact').eq('politician_id', politician_id).eq('category', cat).execute()
    cat_total = cat_collected.count

    # 카테고리별 ChatGPT 평가 (count='exact')
    cat_eval = supabase.table('evaluations_v40').select('collected_data_id', count='exact').eq('politician_id', politician_id).eq('evaluator_ai', 'ChatGPT').eq('category', cat).execute()
    cat_count = cat_eval.count

    rate = cat_count/cat_total*100 if cat_total > 0 else 0
    status = '[OK]' if rate >= 95 else '[!!]'
    print(f'{status} {cat:20s}: {cat_count:3d}/{cat_total:3d} ({rate:5.1f}%)')
