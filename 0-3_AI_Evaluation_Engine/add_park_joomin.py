#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

# 박주민 확인/추가
response = supabase.table('politicians').select('id, name').eq('name', '박주민').execute()

if response.data:
    park_id = response.data[0]['id']
    print(f"Found: 박주민 (ID: {park_id})")
else:
    print("박주민 not found. Adding...")
    result = supabase.table('politicians').insert({
        'name': '박주민',
        'party': '더불어민주당',
        'region': '서울',
        'position': '국회의원'
    }).execute()
    if result.data:
        park_id = result.data[0]['id']
        print(f"Added: 박주민 (ID: {park_id})")
