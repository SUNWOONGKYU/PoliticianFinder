#!/usr/bin/env python3
"""
1. 영어 테스트 정치인 삭제
2. 한글 정치인 20-30명 추가
"""

from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv('1_Frontend/.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

print('=== Step 1: 영어 테스트 정치인 삭제 ===\n')

# 영어 이름 패턴으로 테스트 정치인 찾기
test_patterns = ['Test Politician', 'Admin Added Politician']

for pattern in test_patterns:
    result = supabase.table('politicians').select('id, name').like('name', f'%{pattern}%').execute()
    print(f'Found {len(result.data)} politicians matching "{pattern}"')

    if result.data:
        ids_to_delete = [p['id'] for p in result.data]
        print(f'Deleting IDs: {ids_to_delete}')

        for pid in ids_to_delete:
            supabase.table('politicians').delete().eq('id', pid).execute()

        print(f'Deleted {len(ids_to_delete)} politicians\n')

print('\n=== Step 2: 한글 정치인 30명 추가 ===\n')

# 한국 실제 정치인 데이터 (예시)
korean_politicians = [
    # 국회의원
    {"name": "이재명", "party": "더불어민주당", "region": "경기", "position": "국회의원", "birth_year": 1964, "composite_score": 88.5},
    {"name": "한동훈", "party": "국민의힘", "region": "서울", "position": "국회의원", "birth_year": 1973, "composite_score": 85.2},
    {"name": "박찬대", "party": "더불어민주당", "region": "서울", "position": "국회의원", "birth_year": 1960, "composite_score": 82.3},
    {"name": "추경호", "party": "국민의힘", "region": "대구", "position": "국회의원", "birth_year": 1966, "composite_score": 81.7},
    {"name": "진성준", "party": "더불어민주당", "region": "서울", "position": "국회의원", "birth_year": 1966, "composite_score": 79.8},

    {"name": "심재철", "party": "국민의힘", "region": "인천", "position": "국회의원", "birth_year": 1959, "composite_score": 78.5},
    {"name": "우원식", "party": "더불어민주당", "region": "서울", "position": "국회의원", "birth_year": 1957, "composite_score": 77.9},
    {"name": "김기현", "party": "국민의힘", "region": "울산", "position": "국회의원", "birth_year": 1958, "composite_score": 76.4},
    {"name": "이낙연", "party": "더불어민주당", "region": "전북", "position": "국회의원", "birth_year": 1952, "composite_score": 75.8},
    {"name": "조국", "party": "조국혁신당", "region": "서울", "position": "국회의원", "birth_year": 1965, "composite_score": 74.2},

    {"name": "김동연", "party": "무소속", "region": "경기", "position": "도지사", "birth_year": 1957, "composite_score": 83.1},
    {"name": "오세훈", "party": "국민의힘", "region": "서울", "position": "시장", "birth_year": 1961, "composite_score": 82.7},
    {"name": "박형준", "party": "국민의힘", "region": "부산", "position": "시장", "birth_year": 1960, "composite_score": 80.3},
    {"name": "홍준표", "party": "국민의힘", "region": "대구", "position": "시장", "birth_year": 1954, "composite_score": 79.1},
    {"name": "유정복", "party": "국민의힘", "region": "인천", "position": "시장", "birth_year": 1950, "composite_score": 77.5},

    {"name": "김영록", "party": "더불어민주당", "region": "전남", "position": "도지사", "birth_year": 1960, "composite_score": 76.8},
    {"name": "이철우", "party": "국민의힘", "region": "경북", "position": "도지사", "birth_year": 1960, "composite_score": 75.9},
    {"name": "김관영", "party": "무소속", "region": "전북", "position": "도지사", "birth_year": 1971, "composite_score": 74.6},
    {"name": "최문순", "party": "더불어민주당", "region": "강원", "position": "도지사", "birth_year": 1956, "composite_score": 73.4},
    {"name": "원희룡", "party": "국민의힘", "region": "제주", "position": "전 장관", "birth_year": 1964, "composite_score": 72.8},

    # 신진 정치인
    {"name": "양향자", "party": "더불어민주당", "region": "서울", "position": "국회의원", "birth_year": 1965, "composite_score": 71.5},
    {"name": "배현진", "party": "국민의힘", "region": "서울", "position": "국회의원", "birth_year": 1983, "composite_score": 70.9},
    {"name": "정청래", "party": "더불어민주당", "region": "서울", "position": "국회의원", "birth_year": 1958, "composite_score": 69.7},
    {"name": "장동혁", "party": "조국혁신당", "region": "서울", "position": "국회의원", "birth_year": 1969, "composite_score": 68.5},
    {"name": "김은혜", "party": "국민의힘", "region": "경기", "position": "국회의원", "birth_year": 1976, "composite_score": 67.8},

    {"name": "서영교", "party": "더불어민주당", "region": "경기", "position": "국회의원", "birth_year": 1962, "composite_score": 66.9},
    {"name": "이종배", "party": "국민의힘", "region": "충남", "position": "국회의원", "birth_year": 1964, "composite_score": 66.2},
    {"name": "박주민", "party": "더불어민주당", "region": "서울", "position": "국회의원", "birth_year": 1972, "composite_score": 65.5},
    {"name": "김민석", "party": "더불어민주당", "region": "경기", "position": "국회의원", "birth_year": 1968, "composite_score": 64.8},
    {"name": "전봉민", "party": "국민의힘", "region": "강원", "position": "국회의원", "birth_year": 1971, "composite_score": 64.1},
]

print(f'Adding {len(korean_politicians)} Korean politicians...\n')

for i, pol in enumerate(korean_politicians, 1):
    politician_data = {
        'name': pol['name'],
        'party': pol['party'],
        'region': pol['region'],
        'position': pol['position'],
        'birth_year': pol['birth_year'],
        'composite_score': pol['composite_score'],
        'avg_rating': round(pol['composite_score'] / 20, 1),  # Convert to 5-point scale
        'status': 'active',
        'profile_image_url': f'https://via.placeholder.com/300x400?text={pol["name"]}',
        'biography': f'{pol["name"]} - {pol["party"]} 소속 {pol["position"]}'
    }

    result = supabase.table('politicians').insert(politician_data).execute()
    print(f'{i}. Added: {pol["name"]} ({pol["party"]}) - Score: {pol["composite_score"]}')

print(f'\n=== Complete! ===')
print(f'Total Korean politicians added: {len(korean_politicians)}')

# 최종 확인
total_result = supabase.table('politicians').select('id').execute()
print(f'Total politicians in database: {len(total_result.data)}')
