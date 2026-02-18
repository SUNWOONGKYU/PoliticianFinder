#!/usr/bin/env python3
# -*- coding: utf-8 -*-
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

CATEGORIES = [
    ('expertise', '전문성'), ('leadership', '리더십'), ('vision', '비전'),
    ('integrity', '청렴성'), ('ethics', '윤리성'), ('accountability', '책임감'),
    ('transparency', '투명성'), ('communication', '소통능력'),
    ('responsiveness', '대응성'), ('publicinterest', '공익성')
]

for ai in ['Claude', 'Grok']:
    print(f"\n{'='*80}")
    print(f"조은희 {ai} 평가 현황")
    print('='*80)
    
    total_c = 0
    total_e = 0
    
    for cat_eng, cat_kor in CATEGORIES:
        collected = supabase.table('collected_data_v40').select('id', count='exact').eq(
            'politician_id', POLITICIAN_ID
        ).eq('category', cat_eng).execute()
        
        evaluated = supabase.table('evaluations_v40').select('id', count='exact').eq(
            'politician_id', POLITICIAN_ID
        ).eq('category', cat_eng).eq('evaluator_ai', ai).execute()
        
        c_cnt = collected.count or 0
        e_cnt = evaluated.count or 0
        pct = (e_cnt / c_cnt * 100) if c_cnt > 0 else 0
        
        total_c += c_cnt
        total_e += e_cnt
        
        status = "✅" if pct >= 100 else "❌"
        print(f"{status} {cat_kor:10s}: {e_cnt:3d}/{c_cnt:3d} ({pct:5.1f}%)")
    
    total_pct = (total_e / total_c * 100) if total_c > 0 else 0
    print(f"\n전체: {total_e}/{total_c} ({total_pct:.1f}%)\n")
