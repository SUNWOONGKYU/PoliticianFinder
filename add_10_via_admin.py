#!/usr/bin/env python3
"""
대시보드를 통해 10명의 정치인 추가 (admin 권한 사용)
"""

from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv('1_Frontend/.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

print('=== Admin Dashboard: 10명의 정치인 추가 ===\n')

# 대시보드에서 추가할 10명의 정치인
admin_added_politicians = [
    {"name": "양태민", "party": "국민의힘", "region": "서울", "position": "국회의원", "birth_year": 1975, "composite_score": 63.4},
    {"name": "류지안", "party": "더불어민주당", "region": "경기", "position": "국회의원", "birth_year": 1970, "composite_score": 62.7},
    {"name": "곽수현", "party": "국민의힘", "region": "부산", "position": "국회의원", "birth_year": 1968, "composite_score": 61.9},
    {"name": "맹은서", "party": "더불어민주당", "region": "대구", "position": "국회의원", "birth_year": 1973, "composite_score": 61.2},
    {"name": "염지훈", "party": "개혁신당", "region": "서울", "position": "국회의원", "birth_year": 1980, "composite_score": 60.5},

    {"name": "사민주", "party": "국민의힘", "region": "인천", "position": "국회의원", "birth_year": 1967, "composite_score": 59.8},
    {"name": "복준우", "party": "더불어민주당", "region": "광주", "position": "국회의원", "birth_year": 1972, "composite_score": 59.1},
    {"name": "선우아", "party": "무소속", "region": "대전", "position": "국회의원", "birth_year": 1978, "composite_score": 58.4},
    {"name": "제갈승", "party": "국민의힘", "region": "울산", "position": "국회의원", "birth_year": 1965, "composite_score": 57.7},
    {"name": "독고라", "party": "더불어민주당", "region": "세종", "position": "국회의원", "birth_year": 1982, "composite_score": 57.0},
]

print(f'관리자 권한으로 {len(admin_added_politicians)}명의 정치인을 추가합니다...\n')

for i, pol in enumerate(admin_added_politicians, 1):
    politician_data = {
        'name': pol['name'],
        'party': pol['party'],
        'region': pol['region'],
        'position': pol['position'],
        'birth_year': pol['birth_year'],
        'composite_score': pol['composite_score'],
        'avg_rating': round(pol['composite_score'] / 20, 1),
        'status': 'active',
        'profile_image_url': f'https://via.placeholder.com/300x400?text={pol["name"]}',
        'biography': f'{pol["name"]} - {pol["party"]} 소속 {pol["position"]} (관리자 등록)'
    }

    result = supabase.table('politicians').insert(politician_data).execute()
    print(f'{i}. [ADMIN] Added: {pol["name"]} ({pol["party"]}) - Score: {pol["composite_score"]}')

print(f'\n=== Complete! ===')
print(f'관리자가 추가한 정치인: {len(admin_added_politicians)}명')

# 최종 확인
total_result = supabase.table('politicians').select('id').execute()
print(f'데이터베이스 총 정치인 수: {len(total_result.data)}명')
