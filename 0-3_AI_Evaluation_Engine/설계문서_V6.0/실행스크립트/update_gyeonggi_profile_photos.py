#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
경기도지사 후보 10명 프로필 사진 URL 업데이트
"""

import sys, os, io
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from supabase import create_client
from dotenv import load_dotenv

# 환경 변수 로드
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '.env')
load_dotenv(dotenv_path=env_path, override=True)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# 경기도지사 후보 10명 프로필 사진 URL
GYEONGGI_CANDIDATES = [
    {
        'id': '0756ec15',
        'name': '김동연',
        'profile_image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Kim_Dong-yeon_2022.jpg/440px-Kim_Dong-yeon_2022.jpg'
    },
    {
        'id': 'd8fe79e9',
        'name': '추미애',
        'profile_image_url': 'https://upload.wikimedia.org/wikipedia/commons/7/7d/%EC%B6%94%EB%AF%B8%EC%95%A0_%EC%9D%98%EC%9B%90.jpg'
    },
    {
        'id': 'be4f6b92',
        'name': '한준호',
        'profile_image_url': 'https://upload.wikimedia.org/wikipedia/commons/7/7c/%ED%95%9C%EC%A4%80%ED%98%B8_%EC%9D%98%EC%9B%90.jpg'
    },
    {
        'id': '8dc6cea5',
        'name': '김병주',
        'profile_image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Kim_Byung-joo.jpg/220px-Kim_Byung-joo.jpg'
    },
    {
        'id': '266c6671',
        'name': '염태영',
        'profile_image_url': 'https://upload.wikimedia.org/wikipedia/commons/7/7b/%EC%97%BC%ED%83%9C%EC%98%81_%EC%88%98%EC%9B%90%EC%8B%9C%EC%9E%A5.jpg'
    },
    {
        'id': '643d6bec',
        'name': '유승민',
        'profile_image_url': 'https://upload.wikimedia.org/wikipedia/commons/7/7d/%EC%9C%A0%EC%8A%B9%EB%AF%BC_%ED%9B%84%EB%B3%B4.jpg'
    },
    {
        'id': '8639bbf9',
        'name': '원유철',
        'profile_image_url': 'https://www.assembly.go.kr/photo/9770717.jpg'
    },
    {
        'id': 'af3a0f29',
        'name': '김선교',
        'profile_image_url': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/%EA%B9%80%EC%84%A0%EA%B5%90_%EA%B5%AD%ED%9A%8C%EC%9D%98%EC%9B%90.jpg/220px-%EA%B9%80%EC%84%A0%EA%B5%90_%EA%B5%AD%ED%9A%8C%EC%9D%98%EC%9B%90.jpg'
    },
    {
        'id': '023139c6',
        'name': '송석준',
        'profile_image_url': 'https://www.assembly.go.kr/photo/9771088.jpg'
    },
    {
        'id': 'aa2cd708',
        'name': '김성원',
        'profile_image_url': 'https://www.assembly.go.kr/photo/9771250.jpg'
    }
]

def update_profile_photos():
    print("="*80)
    print("경기도지사 후보 10명 프로필 사진 URL 업데이트")
    print("="*80)
    print()

    success_count = 0
    fail_count = 0

    for candidate in GYEONGGI_CANDIDATES:
        politician_id = candidate['id']
        name = candidate['name']
        profile_url = candidate['profile_image_url']

        try:
            result = supabase.table('politicians').update({
                'profile_image_url': profile_url
            }).eq('id', politician_id).execute()

            if result.data:
                print(f"{name}: 프로필 사진 업데이트 완료")
                success_count += 1
            else:
                print(f"{name}: 업데이트 실패 (데이터 없음)")
                fail_count += 1

        except Exception as e:
            print(f"{name}: 업데이트 실패 - {e}")
            fail_count += 1

    print()
    print("="*80)
    print(f"결과: 성공 {success_count}명, 실패 {fail_count}명")
    print("="*80)

if __name__ == "__main__":
    update_profile_photos()
