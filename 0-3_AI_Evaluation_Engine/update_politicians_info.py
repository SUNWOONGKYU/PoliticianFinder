#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

# 4명의 정치인 정보 업데이트
politicians = [
    {
        'name': '오세훈',
        'party': '국민의힘',
        'region': '서울',
        'position': '서울시장',
        'position_type': '광역단체장',
        'status': '현직',
        'gender': '남성',
        'age': 62  # 1961년생
    },
    {
        'name': '박주민',
        'party': '더불어민주당',
        'region': '서울 은평구을',
        'position': '국회의원',
        'position_type': '국회의원',
        'status': '현직',
        'gender': '남성',
        'age': 52  # 1972년생
    },
    {
        'name': '나경원',
        'party': '국민의힘',
        'region': '서울 동작구을',
        'position': '국회의원',
        'position_type': '국회의원',
        'status': '현직',
        'gender': '여성',
        'age': 63  # 1961년생
    },
    {
        'name': '우상호',
        'party': '더불어민주당',
        'region': '서울 마포구을',
        'position': '국회의원',
        'position_type': '국회의원',
        'status': '현직',
        'gender': '남성',
        'age': 66  # 1958년생
    }
]

print('='*80)
print('Updating politician information')
print('='*80)
print()

for pol in politicians:
    # 기존 레코드 확인
    response = supabase.table('politicians').select('id').eq('name', pol['name']).execute()

    if response.data:
        # 업데이트
        pol_id = response.data[0]['id']
        supabase.table('politicians').update(pol).eq('id', pol_id).execute()
        print(f"[UPDATE] {pol['name']} (ID: {pol_id})")
        print(f"  - 직종: {pol['position_type']}")
        print(f"  - 신분: {pol['status']}")
        print(f"  - 성별: {pol['gender']}")
        print(f"  - 나이: {pol['age']}")
    else:
        # 신규 생성
        result = supabase.table('politicians').insert(pol).execute()
        if result.data:
            pol_id = result.data[0]['id']
            print(f"[INSERT] {pol['name']} (ID: {pol_id})")

    print()

print('='*80)
print('SUCCESS: All politicians updated!')
print('='*80)
