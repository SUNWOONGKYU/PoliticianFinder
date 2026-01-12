# -*- coding: utf-8 -*-
import os
import sys
import io
from supabase import create_client
from dotenv import load_dotenv
from collections import Counter

# UTF-8 출력
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv(override=True)

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# 분석할 정치인 4명
targets = [
    ('d0a5d6e1', '조은희', '+54'),
    ('1006', '박주민', '+32'),
    ('d8fe79e9', '추미애', '-4'),
    ('f9e00370', '김민석', '-89')
]

rating_values = {'A': 8, 'B': 6, 'C': 4, 'D': 2, 'E': -2, 'F': -4, 'G': -6, 'H': -8}

print('=' * 100)
print('4명 정치인 V28 vs V24 상세 비교 분석')
print('=' * 100)

for pid, name, change in targets:
    print(f'\n{"="*80}')
    print(f'{name} ({pid}) - V28 vs V24 변화: {change}점')
    print('=' * 80)
    
    # V28 AI별 데이터
    v28_all = []
    for ai in ['Claude', 'ChatGPT', 'Grok', 'Gemini']:
        v28_q = supabase.table('collected_data_v28').select('rating').eq(
            'politician_id', pid).eq('ai_name', ai).not_.is_('rating', 'null').execute()
        v28_all.extend([(ai, r['rating']) for r in v28_q.data])
    
    # V24 AI별 데이터
    v24_all = []
    for ai in ['Claude', 'ChatGPT', 'Grok', 'Gemini']:
        v24_q = supabase.table('collected_data').select('rating').eq(
            'politician_id', pid).eq('ai_name', ai).not_.is_('rating', 'null').execute()
        v24_all.extend([(ai, r['rating']) for r in v24_q.data])
    
    # AI별 개수 및 평균
    print(f'\n[AI별 데이터 개수 및 긍정 비율]')
    print(f'{"AI":<10} | {"V28개수":>7} | {"V28긍정%":>8} | {"V24개수":>7} | {"V24긍정%":>8} | 상태')
    print('-' * 75)
    
    for ai in ['Claude', 'ChatGPT', 'Grok', 'Gemini']:
        v28_ai = [r for a, r in v28_all if a == ai]
        v24_ai = [r for a, r in v24_all if a == ai]
        
        v28_pos = sum(1 for r in v28_ai if r in ['A', 'B', 'C', 'D'])
        v24_pos = sum(1 for r in v24_ai if r in ['A', 'B', 'C', 'D'])
        
        v28_pct = v28_pos / len(v28_ai) * 100 if v28_ai else 0
        v24_pct = v24_pos / len(v24_ai) * 100 if v24_ai else 0
        
        status = ''
        if len(v24_ai) == 0 and len(v28_ai) > 0:
            status = '[!] V24에 없음'
        elif len(v28_ai) > 0 and len(v24_ai) > 0:
            diff_pct = v28_pct - v24_pct
            if diff_pct > 15:
                status = f'[UP] +{diff_pct:.1f}%p'
            elif diff_pct < -15:
                status = f'[DOWN] {diff_pct:.1f}%p'
        
        print(f'{ai:<10} | {len(v28_ai):>7} | {v28_pct:>7.1f}% | {len(v24_ai):>7} | {v24_pct:>7.1f}% | {status}')
    
    # Rating 분포
    print(f'\n[Rating 분포 비교]')
    v28_dist = Counter([r for a, r in v28_all])
    v24_dist = Counter([r for a, r in v24_all])
    
    print(f'{"Rating":<6} | {"V28":>6} | {"V24":>6} | {"차이":>8}')
    print('-' * 35)
    
    for r in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']:
        v28_cnt = v28_dist.get(r, 0)
        v24_cnt = v24_dist.get(r, 0)
        diff = v28_cnt - v24_cnt
        diff_str = f'+{diff}' if diff > 0 else str(diff)
        marker = ' [!]' if abs(diff) > 50 else ''
        print(f'{r:<6} | {v28_cnt:>6} | {v24_cnt:>6} | {diff_str:>8}{marker}')
    
    # 평균 계산
    v28_avg = sum(rating_values[r] for a, r in v28_all) / len(v28_all) if v28_all else 0
    v24_avg = sum(rating_values[r] for a, r in v24_all) / len(v24_all) if v24_all else 0
    
    print(f'\n[평균 Rating]')
    print(f'  V28 평균: {v28_avg:.2f}')
    print(f'  V24 평균: {v24_avg:.2f}')
    print(f'  차이: {v28_avg - v24_avg:+.2f}')

print('\n\n' + '=' * 100)
print('핵심 문제점 요약')
print('=' * 100)
