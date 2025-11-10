#!/usr/bin/env python3
"""
실명을 가명으로 변경
"""

from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv('1_Frontend/.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

print('=== Step 1: 기존 실명 정치인 삭제 ===\n')

# 기존 데이터 모두 삭제
result = supabase.table('politicians').select('id, name').execute()
print(f'Found {len(result.data)} politicians to delete')

if result.data:
    for politician in result.data:
        supabase.table('politicians').delete().eq('id', politician['id']).execute()
        print(f'Deleted: {politician["name"]}')

print(f'\nDeleted {len(result.data)} politicians\n')

print('\n=== Step 2: 가명 정치인 30명 추가 ===\n')

# 가명 정치인 데이터
fictional_politicians = [
    # 국회의원
    {"name": "김민준", "party": "더불어민주당", "region": "경기", "position": "국회의원", "birth_year": 1964, "composite_score": 88.5},
    {"name": "이서연", "party": "국민의힘", "region": "서울", "position": "국회의원", "birth_year": 1973, "composite_score": 85.2},
    {"name": "박준서", "party": "더불어민주당", "region": "서울", "position": "국회의원", "birth_year": 1960, "composite_score": 82.3},
    {"name": "정하은", "party": "국민의힘", "region": "대구", "position": "국회의원", "birth_year": 1966, "composite_score": 81.7},
    {"name": "최지우", "party": "더불어민주당", "region": "서울", "position": "국회의원", "birth_year": 1966, "composite_score": 79.8},

    {"name": "강도윤", "party": "국민의힘", "region": "인천", "position": "국회의원", "birth_year": 1959, "composite_score": 78.5},
    {"name": "윤서준", "party": "더불어민주당", "region": "서울", "position": "국회의원", "birth_year": 1957, "composite_score": 77.9},
    {"name": "장예은", "party": "국민의힘", "region": "울산", "position": "국회의원", "birth_year": 1958, "composite_score": 76.4},
    {"name": "임시우", "party": "더불어민주당", "region": "전북", "position": "국회의원", "birth_year": 1952, "composite_score": 75.8},
    {"name": "한지호", "party": "개혁신당", "region": "서울", "position": "국회의원", "birth_year": 1965, "composite_score": 74.2},

    # 광역단체장
    {"name": "조유진", "party": "무소속", "region": "경기", "position": "도지사", "birth_year": 1957, "composite_score": 83.1},
    {"name": "신건우", "party": "국민의힘", "region": "서울", "position": "시장", "birth_year": 1961, "composite_score": 82.7},
    {"name": "배수아", "party": "국민의힘", "region": "부산", "position": "시장", "birth_year": 1960, "composite_score": 80.3},
    {"name": "홍현준", "party": "국민의힘", "region": "대구", "position": "시장", "birth_year": 1954, "composite_score": 79.1},
    {"name": "노지민", "party": "국민의힘", "region": "인천", "position": "시장", "birth_year": 1950, "composite_score": 77.5},

    {"name": "송채원", "party": "더불어민주당", "region": "전남", "position": "도지사", "birth_year": 1960, "composite_score": 76.8},
    {"name": "안태양", "party": "국민의힘", "region": "경북", "position": "도지사", "birth_year": 1960, "composite_score": 75.9},
    {"name": "문하율", "party": "무소속", "region": "전북", "position": "도지사", "birth_year": 1971, "composite_score": 74.6},
    {"name": "오시현", "party": "더불어민주당", "region": "강원", "position": "도지사", "birth_year": 1956, "composite_score": 73.4},
    {"name": "서재윤", "party": "국민의힘", "region": "제주", "position": "전 장관", "birth_year": 1964, "composite_score": 72.8},

    # 신진 정치인
    {"name": "권아린", "party": "더불어민주당", "region": "서울", "position": "국회의원", "birth_year": 1965, "composite_score": 71.5},
    {"name": "남준혁", "party": "국민의힘", "region": "서울", "position": "국회의원", "birth_year": 1983, "composite_score": 70.9},
    {"name": "진수빈", "party": "더불어민주당", "region": "서울", "position": "국회의원", "birth_year": 1958, "composite_score": 69.7},
    {"name": "표민서", "party": "개혁신당", "region": "서울", "position": "국회의원", "birth_year": 1969, "composite_score": 68.5},
    {"name": "변유나", "party": "국민의힘", "region": "경기", "position": "국회의원", "birth_year": 1976, "composite_score": 67.8},

    {"name": "차은우", "party": "더불어민주당", "region": "경기", "position": "국회의원", "birth_year": 1962, "composite_score": 66.9},
    {"name": "탁지훈", "party": "국민의힘", "region": "충남", "position": "국회의원", "birth_year": 1964, "composite_score": 66.2},
    {"name": "하윤서", "party": "더불어민주당", "region": "서울", "position": "국회의원", "birth_year": 1972, "composite_score": 65.5},
    {"name": "구민재", "party": "더불어민주당", "region": "경기", "position": "국회의원", "birth_year": 1968, "composite_score": 64.8},
    {"name": "방서진", "party": "국민의힘", "region": "강원", "position": "국회의원", "birth_year": 1971, "composite_score": 64.1},
]

print(f'Adding {len(fictional_politicians)} fictional politicians...\n')

for i, pol in enumerate(fictional_politicians, 1):
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
print(f'Total fictional politicians added: {len(fictional_politicians)}')

# 최종 확인
total_result = supabase.table('politicians').select('id').execute()
print(f'Total politicians in database: {len(total_result.data)}')
