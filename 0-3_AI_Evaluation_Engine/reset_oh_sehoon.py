#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

# 오세훈 찾기
response = supabase.table('politicians').select('id, name').eq('name', '오세훈').execute()

if response.data:
    oh_id = response.data[0]['id']
    print(f"Found: 오세훈 (ID: {oh_id})")
    print()
    print("Deleting existing evaluation data...")

    supabase.table('collected_data').delete().eq('politician_id', oh_id).execute()
    print("- collected_data deleted")

    supabase.table('ai_item_scores').delete().eq('politician_id', oh_id).execute()
    print("- ai_item_scores deleted")

    supabase.table('ai_category_scores').delete().eq('politician_id', oh_id).execute()
    print("- ai_category_scores deleted")

    supabase.table('ai_final_scores').delete().eq('politician_id', oh_id).execute()
    print("- ai_final_scores deleted")

    supabase.table('combined_final_scores').delete().eq('politician_id', oh_id).execute()
    print("- combined_final_scores deleted")

    print()
    print("SUCCESS: 오세훈 기존 데이터 완전 삭제!")
    print(f"Ready for fresh evaluation. ID: {oh_id}")
else:
    print("오세훈 not found. Adding...")
    result = supabase.table('politicians').insert({
        'name': '오세훈',
        'party': '국민의힘',
        'region': '서울',
        'position': '서울시장'
    }).execute()
    if result.data:
        print(f"Added: 오세훈 (ID: {result.data[0]['id']})")
