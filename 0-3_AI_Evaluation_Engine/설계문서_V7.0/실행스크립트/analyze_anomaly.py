# -*- coding: utf-8 -*-
import os
from supabase import create_client
from dotenv import load_dotenv
from collections import Counter

load_dotenv(override=True)

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# 분석할 정치인
targets = [
    ('d0a5d6e1', '조은희'),
    ('1006', '박주민'),
    ('f9e00370', '김민석')
]

for pid, name in targets:
    print('=' * 80)
    print(f'{name} ({pid}) 상세 분석')
    print('=' * 80)
    
    # V28 데이터 조회
    v28_data = supabase.table('collected_data_v28').select(
        'ai_name, category_name, rating, data_title'
    ).eq('politician_id', pid).not_.is_('rating', 'null').execute()
    
    # V24 데이터 조회
    v24_data = supabase.table('collected_data').select(
        'ai_name, category_name, rating, data_title'
    ).eq('politician_id', pid).not_.is_('rating', 'null').execute()
    
    print(f'\n[데이터 개수]')
    print(f'  V28: {len(v28_data.data)}개')
    print(f'  V24: {len(v24_data.data)}개')
    
    # Rating 분포 비교
    def get_rating_dist(data):
        ratings = [r['rating'] for r in data]
        return Counter(ratings)
    
    v28_dist = get_rating_dist(v28_data.data)
    v24_dist = get_rating_dist(v24_data.data)
    
    print(f'\n[Rating 분포 비교]')
    print(f'Rating | V28 개수 | V24 개수 | 차이')
    print('-' * 45)
    
    all_ratings = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    rating_values = {'A': 8, 'B': 6, 'C': 4, 'D': 2, 'E': -2, 'F': -4, 'G': -6, 'H': -8}
    
    v28_total = 0
    v24_total = 0
    
    for r in all_ratings:
        v28_cnt = v28_dist.get(r, 0)
        v24_cnt = v24_dist.get(r, 0)
        diff = v28_cnt - v24_cnt
        diff_str = f'+{diff}' if diff > 0 else str(diff)
        print(f'  {r}    |  {v28_cnt:4}    |  {v24_cnt:4}    | {diff_str}')
        v28_total += v28_cnt * rating_values[r]
        v24_total += v24_cnt * rating_values[r]
    
    # 평균 rating 계산
    v28_avg = v28_total / len(v28_data.data) if v28_data.data else 0
    v24_avg = v24_total / len(v24_data.data) if v24_data.data else 0
    
    print(f'\n[평균 Rating]')
    print(f'  V28 평균: {v28_avg:.2f}')
    print(f'  V24 평균: {v24_avg:.2f}')
    print(f'  차이: {v28_avg - v24_avg:.2f}')
    
    # AI별 분석
    print(f'\n[AI별 Rating 분포]')
    for ai in ['Claude', 'ChatGPT', 'Grok', 'Gemini']:
        v28_ai = [r for r in v28_data.data if r['ai_name'] == ai]
        v24_ai = [r for r in v24_data.data if r['ai_name'] == ai]
        
        v28_ai_dist = Counter([r['rating'] for r in v28_ai])
        v24_ai_dist = Counter([r['rating'] for r in v24_ai])
        
        # 긍정(A-D) vs 부정(E-H) 비율
        v28_pos = sum(v28_ai_dist.get(r, 0) for r in ['A', 'B', 'C', 'D'])
        v28_neg = sum(v28_ai_dist.get(r, 0) for r in ['E', 'F', 'G', 'H'])
        v24_pos = sum(v24_ai_dist.get(r, 0) for r in ['A', 'B', 'C', 'D'])
        v24_neg = sum(v24_ai_dist.get(r, 0) for r in ['E', 'F', 'G', 'H'])
        
        v28_ratio = v28_pos / (v28_pos + v28_neg) * 100 if (v28_pos + v28_neg) > 0 else 0
        v24_ratio = v24_pos / (v24_pos + v24_neg) * 100 if (v24_pos + v24_neg) > 0 else 0
        
        print(f'  {ai}: V28 긍정 {v28_ratio:.1f}% ({v28_pos}/{v28_pos+v28_neg}) | V24 긍정 {v24_ratio:.1f}% ({v24_pos}/{v24_pos+v24_neg})')
    
    print()
