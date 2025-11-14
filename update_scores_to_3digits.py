#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
정치인 평가 점수를 3자릿수로 변환 (10배)
"""
import os
import sys
from supabase import create_client

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8"

def main():
    print("Connecting to Supabase...")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    print("\n정치인 데이터 가져오는 중...")
    response = supabase.table('politicians').select('id, name, evaluation_score, ai_score').execute()
    politicians = response.data
    
    print(f"총 {len(politicians)}명의 정치인 발견\n")
    
    updated_count = 0
    for p in politicians:
        old_eval = p.get('evaluation_score', 0) or 0
        old_ai = p.get('ai_score', 0) or 0
        
        # 이미 3자릿수인 경우 스킵 (100 이상)
        if old_eval >= 100 and old_ai >= 100:
            continue
            
        # 10배로 변환
        new_eval = old_eval * 10
        new_ai = old_ai * 10
        
        print(f"{p['name']}: evaluation_score {old_eval} → {new_eval}, ai_score {old_ai} → {new_ai}")
        
        # 업데이트
        supabase.table('politicians').update({
            'evaluation_score': new_eval,
            'ai_score': new_ai
        }).eq('id', p['id']).execute()
        
        updated_count += 1
    
    print(f"\n✓ {updated_count}명의 정치인 점수 업데이트 완료!")
    
    # 결과 확인
    print("\n업데이트 결과 확인:")
    response = supabase.table('politicians').select('name, evaluation_score, ai_score').limit(5).execute()
    for p in response.data:
        print(f"  {p['name']}: evaluation_score={p.get('evaluation_score')}, ai_score={p.get('ai_score')}")

if __name__ == '__main__':
    main()
